// forexia-cot: weekly CFTC Commitments of Traders positions for FX futures and
// gold, from github.com/ForexiaPro/cot-data.
// No dependencies; works in Node 18+, Deno, Bun and browsers (anything with fetch).
// CFTC Commitments of Traders (public domain). Compiled by Forexia:
// https://forexiapro.com/cot-report/

export const BASE = 'https://raw.githubusercontent.com/ForexiaPro/cot-data/main/data';
export const MARKETS = ['EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD', 'MXN', 'USD', 'XAU'];
export const REPORTS = ['legacy', 'tff'];
export const COT_REPORT = 'https://forexiapro.com/cot-report/?via=cot-data';

const ALIASES = { GOLD: 'XAU', XAUUSD: 'XAU', DXY: 'USD', DX: 'USD', USDX: 'USD', EURO: 'EUR' };

/** A market id from what people type: "eur", "EURUSD", "USDJPY", "gold", "DXY". */
export function marketOf(name) {
  const s = String(name ?? '').toUpperCase().replace(/[^A-Z]/g, '');
  if (MARKETS.includes(s)) return s;
  if (ALIASES[s]) return ALIASES[s];
  if (s.length === 6) {
    const a = s.slice(0, 3);
    const b = s.slice(3);
    if (a === 'USD' && MARKETS.includes(b)) return b;
    if (b === 'USD' && MARKETS.includes(a)) return a;
  }
  throw new Error(`forexia-cot: unknown market "${name}" (one of ${MARKETS.join(', ')})`);
}

async function get(path, opts = {}) {
  const f = opts.fetch ?? globalThis.fetch;
  if (!f) throw new Error('forexia-cot: no fetch available; pass { fetch }');
  const res = await f(`${opts.base ?? BASE}${path}`);
  if (!res.ok) throw new Error(`forexia-cot: ${path} answered ${res.status}`);
  return res.json();
}

/** Rows of a columnar file as objects. */
export function rowsOf(file) {
  return file.rows.map((r) => Object.fromEntries(file.columns.map((c, i) => [c, r[i]])));
}

/**
 * Every weekly report of a market since 2010, oldest first.
 * `report`: 'legacy' (non-commercial, commercial, non-reportable; the default)
 * or 'tff' (dealer, asset manager, leveraged funds, other reportable,
 * non-reportable; not for gold). `since`: keep rows on or after a date.
 */
export async function getCot(market, opts = {}) {
  const id = marketOf(market);
  const report = opts.report ?? 'legacy';
  if (!REPORTS.includes(report)) throw new Error(`forexia-cot: unknown report "${report}" (legacy or tff)`);
  if (report === 'tff' && id === 'XAU') throw new Error('forexia-cot: gold is not in the TFF report; use legacy');
  const rows = rowsOf(await get(`/${report}/${id}.json`, opts));
  return opts.since ? rows.filter((r) => r.date >= opts.since) : rows;
}

/** The latest report of every market: net, weekly change and share of open interest of each group. */
export async function latest(opts) {
  return get('/latest.json', opts);
}

/** The markets, their CFTC codes and the dates each report covers. */
export async function markets(opts) {
  return (await get('/markets.json', opts)).markets;
}
