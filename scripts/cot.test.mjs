import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildRows, columnsOf, toCsv, toJson, rowsOf, lastOf, releaseOf, MARKETS } from './cot.mjs';

const api = (date, oi, l, s, extra = {}) => ({
  report_date_as_yyyy_mm_dd: `${date}T00:00:00.000`,
  open_interest_all: String(oi),
  noncomm_positions_long_all: String(l),
  noncomm_positions_short_all: String(s),
  noncomm_postions_spread_all: '5',
  comm_positions_long_all: String(s),
  comm_positions_short_all: String(l),
  nonrept_positions_long_all: '1',
  nonrept_positions_short_all: '1',
  ...extra,
});

test('rows: one a date, sorted, net and share of open interest', () => {
  const rows = buildRows([api('2020-01-14', 100, 30, 10), api('2020-01-07', 200, 10, 30), api('2020-01-07', 50, 1, 1)], 'legacy');
  assert.equal(rows.length, 2);
  assert.equal(rows[0].date, '2020-01-07');
  assert.equal(rows[0].open_interest, 200, 'the larger open interest wins a duplicate date');
  assert.equal(rows[0].noncommercial_net, -20);
  assert.equal(rows[0].noncommercial_net_pct_oi, -10);
  assert.equal(rows[1].commercial_net, -20);
  assert.equal(rows[1].noncommercial_spreading, 5);
  assert.deepEqual(columnsOf('legacy'), [
    'date', 'open_interest',
    'noncommercial_long', 'noncommercial_short', 'noncommercial_spreading', 'noncommercial_net', 'noncommercial_net_pct_oi',
    'commercial_long', 'commercial_short', 'commercial_net', 'commercial_net_pct_oi',
    'nonreportable_long', 'nonreportable_short', 'nonreportable_net', 'nonreportable_net_pct_oi',
  ], 'positions only');
  assert.deepEqual(Object.keys(rows[0]), columnsOf('legacy'));
});

test('csv and columnar json carry the same rows', () => {
  const rows = buildRows([api('2020-01-07', 200, 10, 30), api('2020-01-14', 100, 30, 10)], 'legacy');
  const csv = toCsv(rows, 'legacy').trim().split('\n');
  assert.equal(csv[0], columnsOf('legacy').join(','));
  assert.equal(csv.length, 3);
  const file = JSON.parse(toJson({ market: 'EUR' }, rows, 'legacy'));
  assert.equal(file.market, 'EUR');
  assert.deepEqual(rowsOf(file), rows);
});

test('the last reading and its weekly change', () => {
  const rows = buildRows([api('2020-01-07', 200, 10, 30), api('2020-01-14', 100, 30, 10)], 'legacy');
  assert.deepEqual(lastOf(rows, 'noncommercial'), { net: 20, net_change_1w: 40, net_pct_oi: 20 });
});

test('release: the Friday, 15:30 in New York', () => {
  assert.equal(releaseOf('2026-10-27'), '2026-10-30T19:30:00.000Z');
  assert.equal(releaseOf('2026-12-01'), '2026-12-04T20:30:00.000Z');
});

test('ten markets, unique ids and codes', () => {
  assert.equal(new Set(MARKETS.map((m) => m.id)).size, 10);
  assert.equal(new Set(MARKETS.map((m) => m.code)).size, 10);
});
