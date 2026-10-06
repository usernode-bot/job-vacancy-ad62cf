'use strict';
// Server-side twin of matchJob() in public/index.html, so the percentage in a
// notification is the one the job card shows. Required skills weigh 2,
// nice-to-have 1. A skill held at the asked level counts fully, one level
// below 60%, two below 30%. Proof multiplier: certified 100%, uncertified or
// expired 75%.

const crypto = require('crypto');

// A seeker is notified at this score or higher, and only when they hold at
// least one required skill (a nice-to-have-only overlap never notifies).
const MATCH_NOTIFY_MIN = 60;
const PROOF_WEIGHT = { certified: 1, expired: 0.75, none: 0.75 };

const lower = s => String(s).toLowerCase();

// skills: [{ name, level }]; certs: [{ skills: [name], expiry_date }]
function scoreJob(job, skills, certs, now) {
  const mine = {};
  skills.forEach(s => { mine[lower(s.name)] = s; });
  const proof = name => {
    const n = lower(name);
    const cs = certs.filter(c => (c.skills || []).some(x => lower(x) === n));
    if (!cs.length) return 'none';
    return cs.some(c => !c.expiry_date || c.expiry_date >= now) ? 'certified' : 'expired';
  };
  let total = 0, got = 0, requiredHeld = 0;
  [[job.required || [], 2], [job.nice || [], 1]].forEach(([list, w]) => list.forEach(s => {
    total += w;
    const u = mine[lower(s.name)];
    if (!u) return;
    if (w === 2) requiredHeld++;
    const f = u.level >= s.level ? 1 : (u.level === s.level - 1 ? 0.6 : 0.3);
    got += w * f * PROOF_WEIGHT[proof(s.name)];
  }));
  return { pct: total ? Math.round(got / total * 100) : 0, requiredHeld };
}

// Notify every seeker whose skills fit `job`, except the poster and the
// company's owner. Never throws: a failure here must not fail the job post.
async function notifyForJob(pool, job, actorUserId) {
  try {
    const now = new Date().toISOString().slice(0, 10);
    const [prof, sk, ce, co] = await Promise.all([
      pool.query('SELECT id, user_id FROM profiles WHERE user_id IS NOT NULL'),
      pool.query('SELECT profile_id, name, level FROM skills'),
      pool.query(`SELECT profile_id, skills, expiry_date FROM certificates WHERE skills <> '[]'::jsonb`),
      pool.query('SELECT owner_user_id FROM companies WHERE id = $1', [job.company_id]),
    ]);
    const owner = co.rows[0] ? co.rows[0].owner_user_id : null;
    const group = rows => { const m = new Map(); rows.forEach(r => { if (!m.has(r.profile_id)) m.set(r.profile_id, []); m.get(r.profile_id).push(r); }); return m; };
    const skillsBy = group(sk.rows), certsBy = group(ce.rows);
    for (const p of prof.rows) {
      if (p.user_id === actorUserId || p.user_id === owner) continue;
      const { pct, requiredHeld } = scoreJob(job, skillsBy.get(p.id) || [], certsBy.get(p.id) || [], now);
      if (!requiredHeld || pct < MATCH_NOTIFY_MIN) continue;
      await pool.query(
        `INSERT INTO notifications (id, user_id, job_id, match_pct) VALUES ($1,$2,$3,$4) ON CONFLICT (user_id, job_id) DO NOTHING`,
        ['n' + crypto.randomBytes(8).toString('hex'), p.user_id, job.id, pct]);
    }
  } catch (e) {
    console.error('[notify]', job && job.id, e);
  }
}

module.exports = { scoreJob, notifyForJob, MATCH_NOTIFY_MIN };
