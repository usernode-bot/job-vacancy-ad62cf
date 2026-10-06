'use strict';
// lib/match.js must score like matchJob() in public/index.html: the percentage
// in a notification is the one the job card shows.

const test = require('node:test');
const assert = require('node:assert/strict');
const { scoreJob, MATCH_NOTIFY_MIN } = require('../lib/match');

const job = { required: [{ name: 'React', level: 3 }, { name: 'SQL', level: 2 }], nice: [{ name: 'Docker', level: 1 }] };

test('full match with a valid certificate on one skill', () => {
  const skills = [{ name: 'react', level: 3 }, { name: 'SQL', level: 2 }, { name: 'Docker', level: 1 }];
  const certs = [{ skills: ['React'], expiry_date: '' }];
  // total 5; React 2*1*1, SQL 2*1*.75, Docker 1*1*.75 = 4.25 -> 85
  assert.deepEqual(scoreJob(job, skills, certs, '2026-10-06'), { pct: 85, requiredHeld: 2 });
});

test('levels below the ask count 60% and 30%; an expired certificate counts 75%', () => {
  const skills = [{ name: 'React', level: 2 }, { name: 'SQL', level: 1 }];
  const certs = [{ skills: ['React'], expiry_date: '2020-01-01' }];
  // React 2*.6*.75 = .9, SQL 2*.6*.75 = .9 (level 1 is one below 2) -> 1.8/5 = 36
  assert.equal(scoreJob(job, skills, certs, '2026-10-06').pct, 36);
  assert.ok(36 < MATCH_NOTIFY_MIN);
});

test('a nice-to-have-only overlap holds no required skill', () => {
  assert.equal(scoreJob(job, [{ name: 'Docker', level: 3 }], [], '2026-10-06').requiredHeld, 0);
});
