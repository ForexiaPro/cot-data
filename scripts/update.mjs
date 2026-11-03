#!/usr/bin/env node
// Refresh data/ from the CFTC's public reporting API (Socrata). Node 18+, no dependencies.
//
//   node scripts/update.mjs              every market, both reports
//   node scripts/update.mjs --from 2015  write rows from that year (default 2010)
//
// The rules (markets, columns) are in scripts/cot.mjs.
// A file is written only when its content changed, and nothing in data/ holds
// the time of the run, so a week with no new report commits nothing.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MARKETS, REPORTS, buildRows, toCsv, toJson, lastOf, releaseOf } from './cot.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'data');
const API = 'https://publicreporting.cftc.gov/resource';
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : fallback;
};
const FROM = `${arg('from', '2010')}-01-01`;
const PAGE = 50000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url) {
  let error;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const res = await fetch(url, { headers: { accept: 'application/json', 'user-agent': 'forexia-cot-data (github.com/ForexiaPro/cot-data)' }, signal: AbortSignal.timeout(120000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      error = e;
      await sleep(3000 * (attempt + 1));
    }
  }
  throw new Error(`${url}: ${error.message}`);
}

async function fetchReport(report) {
  const r = REPORTS[report];
  const codes = MARKETS.filter((m) => report !== 'tff' || m.tff).map((m) => `'${m.code}'`).join(',');
  const fields = ['cftc_contract_market_code', 'report_date_as_yyyy_mm_dd', 'open_interest_all', ...Object.values(r.groups).flat(), ...Object.values(r.extra)];
  const where = `cftc_contract_market_code in (${codes}) AND report_date_as_yyyy_mm_dd >= '${FROM}T00:00:00'`;
  const out = [];
  for (let offset = 0; ; offset += PAGE) {
    const q = new URLSearchParams({ $select: fields.join(','), $where: where, $order: 'report_date_as_yyyy_mm_dd ASC,cftc_contract_market_code ASC', $limit: String(PAGE), $offset: String(offset) });
    const page = await getJson(`${API}/${r.dataset}.json?${q}`);
    out.push(...page);
    if (page.length < PAGE) break;
  }
  return out;
}

let written = 0;
function write(file, content) {
  const full = path.join(DATA, file);
  if (fs.existsSync(full) && fs.readFileSync(full, 'utf8') === content) return;
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
  written++;
}

const fetched = {};
for (const report of Object.keys(REPORTS)) {
  fetched[report] = await fetchReport(report);
  console.log(`${report} (${REPORTS[report].dataset}): ${fetched[report].length} rows from the API`);
}

const latest = [];
const markets = [];
for (const m of MARKETS) {
  const entry = { id: m.id, name: m.name, code: m.code, exchange: m.exchange, reports: {} };
  const summary = { id: m.id, name: m.name, code: m.code };
  for (const report of Object.keys(REPORTS)) {
    if (report === 'tff' && !m.tff) continue;
    const all = buildRows(fetched[report].filter((a) => a.cftc_contract_market_code === m.code), report);
    const rows = all.filter((x) => x.date >= FROM);
    if (!rows.length) throw new Error(`${m.id} ${report}: no rows`);
    const meta = {
      market: m.id,
      name: m.name,
      cftc_code: m.code,
      exchange: m.exchange,
      report,
      source: `CFTC Commitments of Traders, ${REPORTS[report].title} (publicreporting.cftc.gov, dataset ${REPORTS[report].dataset})`,
      first: rows[0].date,
      last: rows.at(-1).date,
    };
    write(`${report}/${m.id}.csv`, toCsv(rows, report));
    write(`${report}/${m.id}.json`, toJson(meta, rows, report));
    entry.reports[report] = { first: meta.first, last: meta.last, weeks: rows.length, csv: `data/${report}/${m.id}.csv`, json: `data/${report}/${m.id}.json` };
    const x = rows.at(-1);
    summary.report_date = x.date;
    summary.open_interest = x.open_interest;
    summary[report] = Object.fromEntries(Object.keys(REPORTS[report].groups).map((g) => [g, lastOf(rows, g)]));
  }
  summary.released = releaseOf(summary.report_date);
  markets.push(entry);
  latest.push(summary);
}

const reportDate = latest.map((x) => x.report_date).sort().at(-1);
write('latest.json', JSON.stringify({
  report_date: reportDate,
  released: releaseOf(reportDate),
  source: 'CFTC Commitments of Traders (public domain). Compiled by Forexia: https://forexiapro.com/cot-report/?via=cot-data',
  markets: latest,
}, null, 2) + '\n');
write('markets.json', JSON.stringify({ markets }, null, 2) + '\n');

console.log(`report of ${reportDate}; ${written} file(s) changed`);
