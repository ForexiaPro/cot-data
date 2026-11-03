export type MarketId = 'EUR' | 'GBP' | 'JPY' | 'CHF' | 'CAD' | 'AUD' | 'NZD' | 'MXN' | 'USD' | 'XAU';
export type Report = 'legacy' | 'tff';

export interface Options {
  /** a fetch to use instead of the global one */
  fetch?: typeof fetch;
  /** another address for the data (tests, a mirror, a local copy) */
  base?: string;
}

export interface CotOptions extends Options {
  report?: Report;
  /** keep rows on or after this date, YYYY-MM-DD */
  since?: string;
}

/** One weekly report. Positions are contracts, in the future's terms (long EUR is long the euro). */
export interface CotRow {
  /** the Tuesday the positions are counted, YYYY-MM-DD */
  date: string;
  open_interest: number;
  [column: string]: string | number | null;
}

export interface LegacyRow extends CotRow {
  noncommercial_long: number;
  noncommercial_short: number;
  noncommercial_spreading: number | null;
  noncommercial_net: number;
  noncommercial_net_pct_oi: number;
  commercial_long: number;
  commercial_short: number;
  commercial_net: number;
  commercial_net_pct_oi: number;
  nonreportable_long: number;
  nonreportable_short: number;
  nonreportable_net: number;
  nonreportable_net_pct_oi: number;
}

export interface Reading {
  net: number | null;
  net_change_1w: number | null;
  net_pct_oi: number | null;
}

export interface LatestMarket {
  id: MarketId;
  name: string;
  code: string;
  report_date: string;
  open_interest: number;
  /** when the CFTC normally releases that report (Friday 15:30 New York), ISO UTC */
  released: string;
  legacy: { noncommercial: Reading; commercial: Reading; nonreportable: Reading };
  tff?: { dealer: Reading; asset_manager: Reading; leveraged_funds: Reading; other_reportable: Reading; nonreportable: Reading };
}

export interface Latest {
  report_date: string;
  released: string;
  source: string;
  markets: LatestMarket[];
}

export interface MarketInfo {
  id: MarketId;
  name: string;
  code: string;
  exchange: string;
  reports: Partial<Record<Report, { first: string; last: string; weeks: number; csv: string; json: string }>>;
}

export const BASE: string;
export const MARKETS: MarketId[];
export const REPORTS: Report[];
export const COT_REPORT: string;
export function marketOf(name: string): MarketId;
export function rowsOf(file: { columns: string[]; rows: unknown[][] }): CotRow[];
export function getCot(market: string, opts?: CotOptions & { report?: 'legacy' }): Promise<LegacyRow[]>;
export function getCot(market: string, opts: CotOptions): Promise<CotRow[]>;
export function latest(opts?: Options): Promise<Latest>;
export function markets(opts?: Options): Promise<MarketInfo[]>;
