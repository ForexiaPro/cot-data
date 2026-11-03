// The rules of the dataset, apart from the fetching, so they can be tested.
//
// Markets: the CFTC contract market codes of the FX futures, the dollar index
// and gold. The codes are the same ones Forexia's COT report uses
// (docs/forexia-source.md); MXN and the dollar index are added here.
//
// Positions are in the future's own terms, as the CFTC reports them: long the
// euro future is long EUR against the dollar. (On a chart of USDJPY, long yen
// futures is short the pair: the TradingView indicator flips it there.)
//
// The dataset is the CFTC's positions only: long, short, spreading where the
// report has it, net (long minus short) and net as a share of open interest.

export const MARKETS = [
  { id: 'EUR', name: 'Euro FX', code: '099741', exchange: 'CME', tff: true },
  { id: 'GBP', name: 'British pound', code: '096742', exchange: 'CME', tff: true },
  { id: 'JPY', name: 'Japanese yen', code: '097741', exchange: 'CME', tff: true },
  { id: 'CHF', name: 'Swiss franc', code: '092741', exchange: 'CME', tff: true },
  { id: 'CAD', name: 'Canadian dollar', code: '090741', exchange: 'CME', tff: true },
  { id: 'AUD', name: 'Australian dollar', code: '232741', exchange: 'CME', tff: true },
  { id: 'NZD', name: 'New Zealand dollar', code: '112741', exchange: 'CME', tff: true },
  { id: 'MXN', name: 'Mexican peso', code: '095741', exchange: 'CME', tff: true },
  { id: 'USD', name: 'US dollar index', code: '098662', exchange: 'ICE Futures U.S.', tff: true },
  { id: 'XAU', name: 'Gold', code: '088691', exchange: 'COMEX', tff: false },
];

/** Socrata dataset ids on publicreporting.cftc.gov, futures only. */
export const REPORTS = {
  legacy: {
    dataset: '6dca-aqww',
    title: 'Legacy - Futures Only',
    groups: {
      noncommercial: ['noncomm_positions_long_all', 'noncomm_positions_short_all'],
      commercial: ['comm_positions_long_all', 'comm_positions_short_all'],
      nonreportable: ['nonrept_positions_long_all', 'nonrept_positions_short_all'],
    },
    extra: { noncommercial_spreading: 'noncomm_postions_spread_all' },
  },
  tff: {
    dataset: 'gpe5-46if',
    title: 'TFF (Traders in Financial Futures) - Futures Only',
    groups: {
      dealer: ['dealer_positions_long_all', 'dealer_positions_short_all'],
      asset_manager: ['asset_mgr_positions_long', 'asset_mgr_positions_short'],
      leveraged_funds: ['lev_money_positions_long', 'lev_money_positions_short'],
      other_reportable: ['other_rept_positions_long', 'other_rept_positions_short'],
      nonreportable: ['nonrept_positions_long_all', 'nonrept_positions_short_all'],
    },
    extra: {},
  },
};

const round = (x, dp) => (Number.isFinite(x) ? Number(x.toFixed(dp)) : null);

/** The columns of a report's files, in order. */
export function columnsOf(report) {
  const r = REPORTS[report];
  const cols = ['date', 'open_interest'];
  for (const g of Object.keys(r.groups)) {
    cols.push(`${g}_long`, `${g}_short`);
    for (const [k] of Object.entries(r.extra)) if (k.startsWith(g)) cols.push(k);
    cols.push(`${g}_net`, `${g}_net_pct_oi`);
  }
  return cols;
}

/**
 * Socrata rows of one market and report -> the dataset's rows, oldest first.
 * One row a report date (the largest open interest wins, in case the CFTC lists
 * a market twice on a day as it renames it).
 */
export function buildRows(apiRows, report) {
  const r = REPORTS[report];
  const byDate = new Map();
  for (const a of apiRows) {
    const date = String(a.report_date_as_yyyy_mm_dd).slice(0, 10);
    const oi = Number(a.open_interest_all);
    if (!(oi > 0)) continue;
    const prev = byDate.get(date);
    if (!prev || oi > Number(prev.open_interest_all)) byDate.set(date, a);
  }
  const dates = [...byDate.keys()].sort();
  const rows = dates.map((date) => {
    const a = byDate.get(date);
    const row = { date, open_interest: Number(a.open_interest_all) };
    for (const [g, [lk, sk]] of Object.entries(r.groups)) {
      const long = Number(a[lk]);
      const short = Number(a[sk]);
      row[`${g}_long`] = Number.isFinite(long) ? long : null;
      row[`${g}_short`] = Number.isFinite(short) ? short : null;
      for (const [k, src] of Object.entries(r.extra)) if (k.startsWith(g)) row[k] = a[src] == null ? null : Number(a[src]);
      const net = Number.isFinite(long) && Number.isFinite(short) ? long - short : null;
      row[`${g}_net`] = net;
      row[`${g}_net_pct_oi`] = net == null ? null : round((100 * net) / row.open_interest, 2);
    }
    return row;
  });
  const cols = columnsOf(report);
  return rows.map((x) => Object.fromEntries(cols.map((c) => [c, x[c] ?? null])));
}

export function toCsv(rows, report) {
  const cols = columnsOf(report);
  return [cols.join(','), ...rows.map((r) => cols.map((c) => (r[c] == null ? '' : r[c])).join(','))].join('\n') + '\n';
}

/**
 * JSON as columns and rows (the rows are arrays in the order of `columns`), one
 * row a line: about the size of the CSV, and a weekly update is a small diff.
 */
export function toJson(meta, rows, report) {
  const cols = columnsOf(report);
  const head = JSON.stringify({ ...meta, columns: cols }).slice(0, -1);
  return `${head},"rows":[\n${rows.map((r) => JSON.stringify(cols.map((c) => r[c] ?? null))).join(',\n')}\n]}\n`;
}

/** Rows of a columnar file back to objects. */
export function rowsOf(file) {
  return file.rows.map((r) => Object.fromEntries(file.columns.map((c, i) => [c, r[i]])));
}

/** A group's last reading, with its change on the week. */
export function lastOf(rows, group) {
  const n = rows.length - 1;
  if (n < 0) return null;
  const x = rows[n];
  const prev = rows[n - 1];
  return {
    net: x[`${group}_net`],
    net_change_1w: prev && x[`${group}_net`] != null && prev[`${group}_net`] != null ? x[`${group}_net`] - prev[`${group}_net`] : null,
    net_pct_oi: x[`${group}_net_pct_oi`],
  };
}

/** The Friday 15:30 New York a Tuesday's report is normally released (a holiday can push it to Monday). */
export function releaseOf(tuesday) {
  const friday = new Date(Date.parse(`${tuesday}T12:00:00Z`) + 3 * 86400e3).toISOString().slice(0, 10);
  // New York's offset that day: 15:30 there is 19:30 UTC in summer time, 20:30 in winter.
  const probe = new Date(`${friday}T20:30:00Z`);
  const hour = Number(new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', hourCycle: 'h23' }).format(probe));
  return new Date(`${friday}T${hour === 16 ? '19' : '20'}:30:00Z`).toISOString();
}
