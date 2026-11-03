# COT report data: FX futures and gold, CSV and JSON

The CFTC's weekly **Commitments of Traders (COT)** report for the currency futures, the US dollar index and gold, cleaned into one CSV and one JSON file per market. **Positions only**, as the CFTC publishes them: long, short, net and net as a share of open interest. Weekly since January 2010, both the **legacy** and the **Traders in Financial Futures (TFF)** reports. Updated every Friday by a GitHub Action, minutes after the CFTC's release.

For Forexia's COT index and weekly reading of these positions, see [forexiapro.com/cot-report](https://forexiapro.com/cot-report/?via=cot-data).

No account, no key: read the files straight from GitHub, or use the clients:

```sh
pip install forexia-cot
npm install forexia-cot
```

```python
import forexia_cot as cot

cot.get_cot("EUR")                  # every legacy report since 2010, oldest first
cot.get_cot("USDJPY", report="tff") # the yen future, TFF groups
cot.latest()                        # this week, every market: net, weekly change, net % of open interest
cot.cot_frame("gold")               # a pandas DataFrame (pip install "forexia-cot[pandas]")
```

```js
import { getCot, latest } from 'forexia-cot';

const eur = await getCot('EUR');               // [{ date, open_interest, noncommercial_net, noncommercial_net_pct_oi, ... }]
const week = await latest();                   // { report_date, released, markets: [...] }
```

```sh
forexia-cot          # this week's table
forexia-cot gbp      # the pound's last eight weeks
```

## Markets

| Id | Future | CFTC code | Exchange | Reports |
| --- | --- | --- | --- | --- |
| `EUR` | Euro FX | 099741 | CME | legacy, tff |
| `GBP` | British pound | 096742 | CME | legacy, tff |
| `JPY` | Japanese yen | 097741 | CME | legacy, tff |
| `CHF` | Swiss franc | 092741 | CME | legacy, tff |
| `CAD` | Canadian dollar | 090741 | CME | legacy, tff |
| `AUD` | Australian dollar | 232741 | CME | legacy, tff |
| `NZD` | New Zealand dollar | 112741 | CME | legacy, tff |
| `MXN` | Mexican peso | 095741 | CME | legacy, tff |
| `USD` | US dollar index | 098662 | ICE Futures U.S. | legacy, tff |
| `XAU` | Gold | 088691 | COMEX | legacy (gold is not in the TFF report) |

The clients also take `EURUSD`, `USDJPY`, `gold`, `DXY` and the like.

## Files

```
data/legacy/<ID>.csv   data/legacy/<ID>.json
data/tff/<ID>.csv      data/tff/<ID>.json
data/latest.json       this week, every market, every group
data/markets.json      the markets, their codes and the dates each file covers
```

One row a weekly report. `date` is the Tuesday the positions were counted; the CFTC releases them on the Friday at 15:30 New York (a holiday moves it to the next business day). `latest.json` gives that release time as `released`.

The JSON files are `{ market, name, cftc_code, report, source, first, last, columns, rows }`, with each row an array in the order of `columns`, one row a line: about the size of the CSV, and quick to diff. The clients turn them into objects.

**Legacy columns**: `open_interest`, then for `noncommercial` (the large speculators), `commercial` (the hedgers) and `nonreportable` (the small traders): `_long`, `_short`, `_net`, `_net_pct_oi` (net as a share of open interest, in per cent). Non-commercial also has `_spreading`.

**TFF columns**: the same for `dealer`, `asset_manager`, `leveraged_funds`, `other_reportable` and `nonreportable`.

Positions are contracts, **in the future's own terms**, as the CFTC reports them: long `EUR` is long the euro, long `JPY` is long the yen, which is short USDJPY. On a chart where the dollar is the base (USDJPY, USDCHF, USDCAD, USDMXN), turn the sign over.

## What is not here

The dataset is the CFTC's positions and nothing derived beyond net and net as a share of open interest: no index, no extreme flags, no forecast. For Forexia's COT index and its weekly reading of these positions, see [forexiapro.com/cot-report](https://forexiapro.com/cot-report/?via=cot-data).

## Source and updates

The CFTC's Public Reporting Environment (Socrata), futures only:

| Report | Dataset |
| --- | --- |
| Legacy - Futures Only | [`6dca-aqww`](https://publicreporting.cftc.gov/resource/6dca-aqww.json) |
| TFF - Futures Only | [`gpe5-46if`](https://publicreporting.cftc.gov/resource/gpe5-46if.json) |

`node scripts/update.mjs` (Node 18 or later, no dependencies) fetches both and rewrites `data/`; a file is written only when it changed, and nothing in `data/` records the time of a run, so a week with no new report commits nothing. `.github/workflows/update.yml` runs it on Fridays after the release, again on Saturday, and on Monday and Tuesday for holiday weeks. The rules are in `scripts/cot.mjs` and tested in `scripts/cot.test.mjs` (`npm test`).

## Licence

- **The CFTC's figures** (positions, open interest) are a work of the US government and in the **public domain**. A link to [forexiapro.com/cot-report](https://forexiapro.com/cot-report/?via=cot-data), where this dataset is compiled, is welcome.
- **The code** (scripts and clients) is MIT.

Nothing here is investment advice. Positioning data is published with a three-day lag.

---

Part of the Forexia network: [InterestRateDecision.com](https://interestratedecision.com/?via=cot-data) · [Forexia Academy](https://forexiapro.com/?via=cot-data) · [TradingSignalBot](https://tradingsignalbot.com/?via=cot-data) · [PropSim](https://github.com/PropSim-Enterprise) · [OpenCharts](https://github.com/dylanpersonguy/OpenCharts)
