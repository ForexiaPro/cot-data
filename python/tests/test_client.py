import io
import json
import pathlib
import unittest
from contextlib import redirect_stdout

import forexia_cot as cot
from forexia_cot.__main__ import main

FIXTURES = pathlib.Path(__file__).parent / "fixtures"
FILES = {
    "/legacy/EUR.json": (FIXTURES / "legacy-EUR.json").read_text(encoding="utf-8"),
    "/latest.json": (FIXTURES / "latest.json").read_text(encoding="utf-8"),
    "/markets.json": (FIXTURES / "markets.json").read_text(encoding="utf-8"),
}


def fetch(url: str) -> str:
    path = url[len(cot.BASE):]
    if path not in FILES:
        raise FileNotFoundError(path)
    return FILES[path]


class Markets(unittest.TestCase):
    def test_names(self):
        self.assertEqual(cot.market_of("eur"), "EUR")
        self.assertEqual(cot.market_of("EUR/USD"), "EUR")
        self.assertEqual(cot.market_of("USDJPY"), "JPY")
        self.assertEqual(cot.market_of("gold"), "XAU")
        self.assertEqual(cot.market_of("DXY"), "USD")
        with self.assertRaises(ValueError):
            cot.market_of("BTC")


class Client(unittest.TestCase):
    def test_get_cot(self):
        rows = cot.get_cot("EUR", fetch=fetch)
        self.assertEqual(len(rows), 3)
        self.assertEqual(rows[-1]["date"], "2026-10-27")
        self.assertEqual(rows[-1]["noncommercial_net"], -143894)
        self.assertEqual(rows[-1]["noncommercial_net_pct_oi"], -16.57)
        self.assertNotIn("noncommercial_extreme", rows[-1])
        self.assertEqual(len(cot.get_cot("EURUSD", since="2026-10-20", fetch=fetch)), 2)
        with self.assertRaises(ValueError):
            cot.get_cot("XAU", report="tff", fetch=fetch)

    def test_latest_and_markets(self):
        eur = next(m for m in cot.latest(fetch)["markets"] if m["id"] == "EUR")
        self.assertEqual(eur["legacy"]["noncommercial"], {"net": -143894, "net_change_1w": -9370, "net_pct_oi": -16.57})
        self.assertNotIn("extremes", cot.latest(fetch))
        self.assertEqual(len(cot.markets(fetch)), 10)

    def test_cli(self):
        original = cot.latest
        try:
            import forexia_cot.__main__ as m

            m.latest = lambda: json.loads(FILES["/latest.json"])
            out = io.StringIO()
            with redirect_stdout(out):
                main([])
            self.assertIn("EUR", out.getvalue())
            self.assertIn("via=cot-data", out.getvalue())
        finally:
            m.latest = original


if __name__ == "__main__":
    unittest.main()
