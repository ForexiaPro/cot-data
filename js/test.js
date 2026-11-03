import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getCot, latest, markets, marketOf, BASE } from './index.js';

const fixture = (name) => readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8');
const files = {
  '/legacy/EUR.json': fixture('legacy-EUR.json'),
  '/latest.json': fixture('latest.json'),
  '/markets.json': fixture('markets.json'),
};
const fetch = async (url) => {
  const body = files[url.slice(BASE.length)];
  return { ok: !!body, status: body ? 200 : 404, json: async () => JSON.parse(body) };
};

test('market names people type', () => {
  assert.equal(marketOf('eur'), 'EUR');
  assert.equal(marketOf('EUR/USD'), 'EUR');
  assert.equal(marketOf('USDJPY'), 'JPY');
  assert.equal(marketOf('gold'), 'XAU');
  assert.equal(marketOf('DXY'), 'USD');
  assert.throws(() => marketOf('BTC'), /unknown market/);
});

test('reads a market as rows of objects', async () => {
  const rows = await getCot('EURUSD', { fetch });
  assert.equal(rows.length, 3);
  assert.equal(rows.at(-1).date, '2026-10-27');
  assert.equal(rows.at(-1).noncommercial_net, -143894);
  assert.equal(rows.at(-1).noncommercial_net_pct_oi, -16.57);
  assert.ok(!('noncommercial_extreme' in rows.at(-1)), 'positions only');
  assert.equal((await getCot('EUR', { fetch, since: '2026-10-20' })).length, 2);
  await assert.rejects(getCot('XAU', { fetch, report: 'tff' }), /not in the TFF/);
  await assert.rejects(getCot('GBP', { fetch }), /answered 404/);
});

test('latest and markets', async () => {
  const l = await latest({ fetch });
  assert.deepEqual(l.markets.find((m) => m.id === 'EUR').legacy.noncommercial, { net: -143894, net_change_1w: -9370, net_pct_oi: -16.57 });
  assert.ok(!('extremes' in l));
  assert.match(l.source, /^CFTC Commitments of Traders \(public domain\)/);
  assert.equal((await markets({ fetch })).length, 10);
});
