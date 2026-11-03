# forexia-cot

The CFTC's weekly **Commitments of Traders (COT)** report for FX futures, the US dollar index and gold: **positions only** (long, short, net, net as a share of open interest), legacy and TFF reports, weekly since 2010. Reads the files of [github.com/ForexiaPro/cot-data](https://github.com/ForexiaPro/cot-data), updated every Friday after the CFTC's release.

No dependencies, no key. Node 18+, Deno, Bun and browsers.

```sh
npm install forexia-cot
```

```js
import { getCot, latest, markets } from 'forexia-cot';

await getCot('EUR');                         // every legacy report since 2010: { date, open_interest, noncommercial_long, noncommercial_short, noncommercial_net, noncommercial_net_pct_oi, ... }
await getCot('USDJPY', { report: 'tff' });   // the yen future's TFF groups: dealer, asset_manager, leveraged_funds, ...
await getCot('gold', { since: '2024-01-01' });
await latest();                              // this week, every market and group: net, net_change_1w, net_pct_oi
```

Markets: `EUR`, `GBP`, `JPY`, `CHF`, `CAD`, `AUD`, `NZD`, `MXN`, `USD` (the dollar index), `XAU` (gold; legacy only). `EURUSD`, `USDJPY`, `gold` and `DXY` work too.

Positions are contracts in the future's terms: long `JPY` is long the yen, so short USDJPY. `date` is the Tuesday the positions were counted; the CFTC releases them on the Friday.

For Forexia's COT index and weekly reading of these positions, see [forexiapro.com/cot-report](https://forexiapro.com/cot-report/?via=cot-data).

## Licence

The code is MIT. The figures are the CFTC's Commitments of Traders (public domain), compiled by Forexia: [forexiapro.com/cot-report](https://forexiapro.com/cot-report/?via=cot-data).

---

Part of the Forexia network: [InterestRateDecision.com](https://interestratedecision.com/?via=cot-data) · [Forexia Academy](https://forexiapro.com/?via=cot-data) · [TradingSignalBot](https://tradingsignalbot.com/?via=cot-data) · [PropSim](https://github.com/PropSim-Enterprise) · [OpenCharts](https://github.com/dylanpersonguy/OpenCharts)
