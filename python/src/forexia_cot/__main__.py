"""forexia-cot: this week's positioning, or one market's last weeks."""

from __future__ import annotations

import sys

from . import COT_REPORT, get_cot, latest


def _fmt(x) -> str:
    return "" if x is None else f"{x:,}" if isinstance(x, int) else str(x)


def main(argv: list[str] | None = None) -> int:
    args = sys.argv[1:] if argv is None else argv
    if args:
        rows = get_cot(args[0], args[1] if len(args) > 1 else "legacy")[-8:]
        group = "noncommercial" if "noncommercial_net" in rows[-1] else "leveraged_funds"
        label = "net " + group.replace("_", " ")
        print(f"{'date':<12}{label:>22}{'% of OI':>10}")
        for r in rows:
            print(f"{r['date']:<12}{_fmt(r[group + '_net']):>22}{_fmt(r[group + '_net_pct_oi']):>10}")
    else:
        data = latest()
        print(f"COT report of {data['report_date']} (non-commercial, legacy)")
        print(f"{'market':<8}{'net':>12}{'1w':>10}{'% of OI':>10}")
        for m in data["markets"]:
            nc = m["legacy"]["noncommercial"]
            print(f"{m['id']:<8}{_fmt(nc['net']):>12}{_fmt(nc['net_change_1w']):>10}{_fmt(nc['net_pct_oi']):>10}")
    print(f"\nForexia's COT index and weekly reading: {COT_REPORT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
