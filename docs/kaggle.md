# Kaggle dataset

To publish (owner, with a Kaggle account and the `kaggle` CLI and its API token):

```sh
mkdir kaggle-upload && cp -r data/legacy data/tff data/latest.json data/markets.json kaggle/dataset-metadata.json kaggle-upload/
kaggle datasets create -p kaggle-upload --dir-mode zip      # the first time
kaggle datasets version -p kaggle-upload --dir-mode zip -m "COT report of <date>"   # each week, or monthly
```

Kaggle has no scheduled pull from GitHub: a version is a manual upload (or a step added to the workflow with a `KAGGLE_KEY` secret, if the owner wants it weekly).

---

## Title

COT Report Data: FX Futures and Gold, Weekly (50 characters at most; the `id` in `kaggle/dataset-metadata.json` must use the owner's Kaggle username)

## Subtitle

CFTC Commitments of Traders positions, legacy and TFF

## Description

The CFTC's weekly **Commitments of Traders (COT)** report for the currency futures (euro, pound, yen, Swiss franc, Canadian, Australian and New Zealand dollars, Mexican peso), the US dollar index and gold, cleaned into one CSV per market and report, weekly since January 2010.

**Files**

- `legacy/<ID>.csv`: open interest; non-commercial (large speculators), commercial (hedgers) and non-reportable (small traders) long, short and net.
- `tff/<ID>.csv`: Traders in Financial Futures: dealer, asset manager, leveraged funds, other reportable and non-reportable (no gold: it is not in the TFF report).
- `latest.json`: the latest week, every market and group.
- `markets.json`: the markets, their CFTC contract codes and the dates covered.

Every group has `_long`, `_short`, `_net` and `_net_pct_oi` (net position as a share of open interest). The dataset is positions only: no index, no extreme flags, no forecast. For Forexia's COT index and weekly reading, see https://forexiapro.com/cot-report/?via=cot-data

`date` is the Tuesday the positions were counted; the CFTC releases them on the Friday after, at 15:30 New York. Positions are contracts in the future's terms: long JPY is long the yen, so short USDJPY.

**Ideas**: how far speculators' net share of open interest swings in each currency; whether leveraged funds and asset managers agree; how positioning moves around central bank decisions (dates at interestratedecision.com/central-bank-data/); weekly changes against price.

**Source**: CFTC Public Reporting Environment, Legacy - Futures Only (`6dca-aqww`) and TFF - Futures Only (`gpe5-46if`). Updated every Friday at github.com/ForexiaPro/cot-data, with Python (`pip install forexia-cot`) and JavaScript (`npm install forexia-cot`) clients.

**Licence**: CFTC Commitments of Traders (public domain). Compiled by Forexia: https://forexiapro.com/cot-report/?via=cot-data

## Tags

finance, investing, currencies, time series, economics
