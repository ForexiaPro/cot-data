"""CFTC Commitments of Traders (COT) positions for FX futures and gold.

Weekly legacy and TFF reports since 2010 for EUR, GBP, JPY, CHF, CAD, AUD, NZD,
MXN, the US dollar index and gold, read from github.com/ForexiaPro/cot-data.
Standard library only; pandas is optional.

CFTC Commitments of Traders (public domain). Compiled by Forexia:
https://forexiapro.com/cot-report/
"""

from __future__ import annotations

import json
import urllib.request
from typing import Any, Callable, Optional

__version__ = "1.0.0"
__all__ = ["BASE", "MARKETS", "REPORTS", "COT_REPORT", "market_of", "get_cot", "latest", "markets", "cot_frame"]

BASE = "https://raw.githubusercontent.com/ForexiaPro/cot-data/main/data"
MARKETS = ("EUR", "GBP", "JPY", "CHF", "CAD", "AUD", "NZD", "MXN", "USD", "XAU")
REPORTS = ("legacy", "tff")
COT_REPORT = "https://forexiapro.com/cot-report/?via=cot-data"

_ALIASES = {"GOLD": "XAU", "XAUUSD": "XAU", "DXY": "USD", "DX": "USD", "USDX": "USD", "EURO": "EUR"}

Fetch = Callable[[str], str]


def _fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": f"forexia-cot-python/{__version__}"})
    with urllib.request.urlopen(req, timeout=30) as res:
        return res.read().decode("utf-8")


def _get(path: str, fetch: Optional[Fetch] = None, base: str = BASE) -> Any:
    return json.loads((fetch or _fetch)(f"{base}{path}"))


def market_of(name: str) -> str:
    """A market id from what people type: "eur", "EURUSD", "USDJPY", "gold", "DXY"."""
    s = "".join(c for c in str(name).upper() if c.isalpha())
    if s in MARKETS:
        return s
    if s in _ALIASES:
        return _ALIASES[s]
    if len(s) == 6:
        a, b = s[:3], s[3:]
        if a == "USD" and b in MARKETS:
            return b
        if b == "USD" and a in MARKETS:
            return a
    raise ValueError(f'unknown market "{name}" (one of {", ".join(MARKETS)})')


def _rows(file: dict) -> list[dict[str, Any]]:
    cols = file["columns"]
    return [dict(zip(cols, r)) for r in file["rows"]]


def get_cot(market: str, report: str = "legacy", since: Optional[str] = None, fetch: Optional[Fetch] = None, base: str = BASE) -> list[dict[str, Any]]:
    """Every weekly report of a market since 2010, oldest first.

    ``report`` is ``"legacy"`` (non-commercial, commercial, non-reportable) or
    ``"tff"`` (dealer, asset manager, leveraged funds, other reportable,
    non-reportable; not for gold). ``since`` keeps rows on or after a date
    (YYYY-MM-DD). Positions are contracts in the future's terms: long EUR is
    long the euro, long JPY is long the yen (short USDJPY).
    """
    mid = market_of(market)
    if report not in REPORTS:
        raise ValueError(f'unknown report "{report}" (legacy or tff)')
    if report == "tff" and mid == "XAU":
        raise ValueError("gold is not in the TFF report; use legacy")
    rows = _rows(_get(f"/{report}/{mid}.json", fetch, base))
    return [r for r in rows if since is None or r["date"] >= since]


def latest(fetch: Optional[Fetch] = None, base: str = BASE) -> dict[str, Any]:
    """The latest report of every market: net, weekly change and share of open interest of each group."""
    return _get("/latest.json", fetch, base)


def markets(fetch: Optional[Fetch] = None, base: str = BASE) -> list[dict[str, Any]]:
    """The markets, their CFTC codes and the dates each report covers."""
    return _get("/markets.json", fetch, base)["markets"]


def cot_frame(market: str, report: str = "legacy", since: Optional[str] = None, fetch: Optional[Fetch] = None):
    """The reports as a pandas DataFrame indexed by date (needs pandas)."""
    import pandas as pd  # optional

    df = pd.DataFrame(get_cot(market, report, since, fetch))
    df["date"] = pd.to_datetime(df["date"])
    return df.set_index("date")
