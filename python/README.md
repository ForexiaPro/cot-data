# forexia-cot

The CFTC's weekly **Commitments of Traders (COT)** report for FX futures, the US dollar index and gold: **positions only** (long, short, net, net as a share of open interest), legacy and TFF reports, weekly since 2010. Reads the files of [github.com/ForexiaPro/cot-data](https://github.com/ForexiaPro/cot-data), updated every Friday after the CFTC's release.

Standard library only. pandas is optional.

```sh
pip install forexia-cot
forexia-cot          # this week's table: net non-commercial, weekly change, % of open interest
forexia-cot gbp      # the pound's last eight weeks
```

```python
import forexia_cot as cot

cot.get_cot("EUR")                       # every legacy report since 2010, oldest first (a list of dicts)
cot.get_cot("USDJPY", report="tff")      # the yen future's TFF groups
cot.get_cot("gold", since="2024-01-01")
cot.latest()                             # this week, every market and group

df = cot.cot_frame("EUR")                # pip install "forexia-cot[pandas]"
df.noncommercial_net.plot()
```

Markets: `EUR`, `GBP`, `JPY`, `CHF`, `CAD`, `AUD`, `NZD`, `MXN`, `USD` (the dollar index), `XAU` (gold; legacy only). `EURUSD`, `USDJPY`, `gold` and `DXY` work too.

Columns: `date` (the Tuesday the positions were counted), `open_interest`, then for each group `_long`, `_short`, `_net`, `_net_pct_oi` (net as a share of open interest, in per cent); non-commercial also has `_spreading`. Legacy groups: `noncommercial`, `commercial`, `nonreportable`. TFF groups: `dealer`, `asset_manager`, `leveraged_funds`, `other_reportable`, `nonreportable`. Positions are contracts in the future's terms: long `JPY` is long the yen, so short USDJPY.

For Forexia's COT index and weekly reading of these positions, see [forexiapro.com/cot-report](https://forexiapro.com/cot-report/?via=cot-data).

## Licence

The code is MIT. The figures are the CFTC's Commitments of Traders (public domain), compiled by Forexia: [forexiapro.com/cot-report](https://forexiapro.com/cot-report/?via=cot-data).

---

Part of the Forexia network: [InterestRateDecision.com](https://interestratedecision.com/?via=cot-data) · [Forexia Academy](https://forexiapro.com/?via=cot-data) · [TradingSignalBot](https://tradingsignalbot.com/?via=cot-data) · [PropSim](https://github.com/PropSim-Enterprise) · [OpenCharts](https://github.com/dylanpersonguy/OpenCharts)
