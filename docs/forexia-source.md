# Where Forexia's COT data comes from

The plan (`docs/network-tools.md` in interestratedecision) left this open. Found by reading the Forexia repository (forexia-trading-academy) on 2026-11-02.

## The COT Report page (`/cot-report/`): real CFTC data

- **Builder**: `scripts/generate-cot-report.mjs`, run twice a day by a Railway job (`scripts/cot-server`, service `cot-reports`). It posts each week's report to the Supabase function `supabase/functions/ingest-cot-report`, which stores it in the table `cot_reports` (migration 0022). The page (`src/pages/CotReport.tsx`, rules in `src/lib/cot.ts`) draws from that table.
- **Source**: the CFTC's Public Reporting Environment (Socrata), the same as this repository:
  - legacy futures only, dataset `6dca-aqww`: non-commercial, commercial and non-reportable long and short;
  - TFF futures only, dataset `gpe5-46if`: dealer, asset manager and leveraged funds.
  - Prices: Dukascopy hourly candles, for the chart and the levels. Not reused here (not ours to redistribute, rule 6 of the plan).
- **Market codes** (reused here unchanged): EUR 099741, GBP 096742, JPY 097741, CHF 092741, AUD 232741, CAD 090741, NZD 112741, gold 088691, dollar index 098662. This repository adds MXN 095741.
- **Positions only here** (owner's decision, 2026-11-02): this repository publishes the CFTC's positions (long, short, spreading, net, net as a share of open interest). Forexia's 0 to 100 COT index and its crowded lines stay on Forexia's own report, [forexiapro.com/cot-report](https://forexiapro.com/cot-report/?via=cot-data); the dataset neither computes nor publishes them.
  - Forexia writes positions in the pair's terms (USDJPY, USDCHF and USDCAD flipped). This repository keeps the future's own terms, as the CFTC does, and says how to flip; the TradingView indicator flips on a USD-based chart.

## The Trading Tools COT tab: not real data

`supabase/functions/getCotData/index.ts` (ported from `base44/functions/getCotData`), which feeds `src/components/tradingtools/CotDataAnalysis.jsx` on the Trading Tools page, **returns numbers made with `Math.random()`**, flagged `is_mock_data: true`, with a warning in the file. Nothing here links to that tab. It could read this repository's `data/latest.json` and `data/<report>/<ID>.json` instead: that is the owner's change to make in the Forexia repository.

## Links used

- Forexia's COT guide and weekly report: `https://forexiapro.com/cot-report/?via=<tool-id>` (in Forexia's footer as "COT report").

## Projections: not published here (the owner decides)

`src/lib/cot.ts` also works out a reading and a projection (the path the report supports, with targets and the price that cancels it) from the positions and Dukascopy's prices. The page's own notes describe the edge behind it as small and not proven. None of it is in this repository:

- it needs Dukascopy prices, which are not ours to publish;
- it is Forexia's reason to visit `/cot-report/`, and the members' weeks are gated (first report of the month open, every week for ForexiaPRO);
- the plan's rule 4 bars performance claims, and publishing projections as data invites them.

**Owner's decision**: whether projections are published as data (here, or as `forexiapro.com/data/cot-projections.json`), or stay on the site. This repository publishes the CFTC's positions only.
