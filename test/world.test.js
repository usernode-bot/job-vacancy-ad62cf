'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadWorldJobs, normalizeArbeitnow, normalizeRemotive, SAMPLES } = require('../lib/world');

const json = body => async () => ({ ok: true, json: async () => body });
const fail = async () => { throw new Error('offline'); };
const route = (a, r) => async url => (String(url).includes('arbeitnow') ? a : r)(url);

const AN = { data: [{ title: 'Dev', company_name: 'Acme', location: 'Berlin', remote: false, url: 'https://x.test/1', created_at: 1700000000 }, { title: '', company_name: 'No title', url: 'https://x.test/2' }] };
const RM = { jobs: [{ title: 'Writer', company_name: 'Beta', candidate_required_location: 'USA Only', url: 'https://y.test/1', publication_date: '2026-01-01T00:00:00' }, { title: 'Bad link', company_name: 'C', url: 'javascript:alert(1)' }] };

test('feeds are normalised and entries without title, company or safe link are dropped', () => {
  assert.deepEqual(normalizeArbeitnow(AN).map(j => j.title), ['Dev']);
  assert.equal(normalizeRemotive(RM).length, 1);
  assert.equal(normalizeRemotive(RM)[0].location, 'USA Only');
});

test('live listings from both feeds are returned when they work', async () => {
  const r = await loadWorldJobs(route(json(AN), json(RM)));
  assert.equal(r.live, true);
  assert.deepEqual(r.sources.sort(), ['Arbeitnow', 'Remotive']);
  assert.equal(r.jobs.length, 2);
});

test('one failing feed still shows the other', async () => {
  const r = await loadWorldJobs(route(fail, json(RM)));
  assert.equal(r.live, true);
  assert.equal(r.jobs[0].company, 'Beta');
});

test('falls back to samples across many countries when feeds fail or are empty', async () => {
  for (const f of [fail, route(json({ data: [] }), json({ jobs: [] }))]) {
    const r = await loadWorldJobs(f);
    assert.equal(r.live, false);
    assert.ok(r.jobs.length >= 20);
    assert.ok(new Set(r.jobs.map(j => j.country)).size >= 20);
    for (const j of r.jobs) assert.ok(j.title && j.company && j.location && /^https?:\/\//.test(j.url));
  }
  assert.equal(SAMPLES.length, (await loadWorldJobs(fail)).jobs.length);
});
