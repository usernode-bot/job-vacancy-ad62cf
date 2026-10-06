'use strict';
// Job-match notifications. When an employer posts a job, every seeker whose
// profile holds one of the job's REQUIRED skills at the asked level gets a
// notification row; when a seeker saves their profile, the last two weeks of
// jobs are scanned the same way so nothing posted before they joined is
// missed. Scores mirror the browser's matchJob() so the percentage a
// notification shows is the one the job list shows.

const crypto = require('crypto');

const newId = p => p + crypto.randomBytes(8).toString('hex');
const today = () => new Date().toISOString().slice(0, 10);

const PROOF_WEIGHT = { certified: 1, expired: 0.75, none: 0.75 };

// Profiles created before a job was posted still hear about it if it is this
// many days old. Older jobs are only ever surfaced by searching.
const BACKFILL_DAYS = 14;

function skillProof(certs, name, now) {
  const n = String(name).toLowerCase();
  const cs = certs.filter(c => (c.skills || []).some(s => String(s).toLowerCase() === n));
  if (!cs.length) return 'none';
  return cs.some(c => !c.expiry_date || c.expiry_date >= now) ? 'certified' : 'expired';
}

function matchScore(skills, certs, job) {
  const mine = {};
  skills.forEach(s => { mine[String(s.name).toLowerCase()] = s; });
  let total = 0, got = 0;
  const now = today();
  [[job.required, 2], [job.nice, 1]].forEach(([list, w]) => (list || []).forEach(s => {
    total += w;
    const u = mine[String(s.name).toLowerCase()];
    if (!u) return;
    const f = u.level >= s.level ? 1 : (u.level === s.level - 1 ? 0.6 : 0.3);
    got += w * f * PROOF_WEIGHT[skillProof(certs, s.name, now)];
  }));
  return total ? Math.round(got / total * 100) : 0;
}

// The notify bar: the profile holds a REQUIRED skill at the asked level.
// Nice-to-have matches alone never generate a notification.
function matches(skills, job) {
  const mine = {};
  skills.forEach(s => { mine[String(s.name).toLowerCase()] = s.level; });
  return (job.required || []).some(s => mine[String(s.name).toLowerCase()] >= s.level);
}

async function insertFor(db, userId, skills, certs, jobs) {
  let created = 0;
  for (const job of jobs) {
    if (!matches(skills, job)) continue;
    // UNIQUE (user_id, job_id) keeps re-saves and re-posts from duplicating.
    const { rowCount } = await db.query(
      `INSERT INTO notifications (id, user_id, job_id, pct) VALUES ($1,$2,$3,$4)
       ON CONFLICT (user_id, job_id) DO NOTHING`,
      [newId('n'), userId, job.id, matchScore(skills, certs, job)]);
    created += rowCount;
  }
  return created;
}

// A job was just posted: tell everyone whose profile clears the bar.
async function notifyJobMatches(db, job) {
  const names = [...(job.required || []), ...(job.nice || [])]
    .map(s => String(s.name).toLowerCase()).filter(Boolean);
  if (!names.length) return 0;
  // Candidate profiles: anyone holding one of the job's skills. The notify
  // bar itself is decided in JS so a new job and a backfill follow one rule.
  const { rows: cands } = await db.query(
    `SELECT DISTINCT p.id AS profile_id, p.user_id
     FROM skills s JOIN profiles p ON p.id = s.profile_id
     WHERE p.user_id IS NOT NULL AND lower(s.name) = ANY($1)`, [names]);
  if (!cands.length) return 0;
  const ids = cands.map(c => c.profile_id);
  const [skillRows, certRows] = await Promise.all([
    db.query('SELECT profile_id, name, level FROM skills WHERE profile_id = ANY($1)', [ids]),
    db.query('SELECT profile_id, skills, expiry_date FROM certificates WHERE profile_id = ANY($1)', [ids]),
  ]);
  let created = 0;
  for (const c of cands) {
    const skills = skillRows.rows.filter(s => s.profile_id === c.profile_id);
    if (!matches(skills, job)) continue;
    const certs = certRows.rows.filter(x => x.profile_id === c.profile_id);
    const { rowCount } = await db.query(
      `INSERT INTO notifications (id, user_id, job_id, pct) VALUES ($1,$2,$3,$4)
       ON CONFLICT (user_id, job_id) DO NOTHING`,
      [newId('n'), c.user_id, job.id, matchScore(skills, certs, job)]);
    created += rowCount;
  }
  return created;
}

// A profile was just saved: scan recent jobs so a new or freshly-updated
// profile hears about jobs posted in the last two weeks.
async function notifyProfileMatches(db, userId, profileId) {
  const [skillRows, certRows, jobRows] = await Promise.all([
    db.query('SELECT name, level FROM skills WHERE profile_id = $1', [profileId]),
    db.query('SELECT skills, expiry_date FROM certificates WHERE profile_id = $1', [profileId]),
    db.query('SELECT * FROM jobs WHERE posted_at >= $1', [new Date(Date.now() - BACKFILL_DAYS * 86400000)]),
  ]);
  if (!skillRows.rows.length) return 0;
  return insertFor(db, userId, skillRows.rows, certRows.rows, jobRows.rows);
}

module.exports = { notifyJobMatches, notifyProfileMatches, matchScore, matches };