'use strict';
// Worldwide job openings. Real listings come from two free public feeds that
// need no key (Arbeitnow and Remotive). They are fetched here, never in the
// browser, so a blocked or failed lookup is not a browser network error. If
// both feeds fail or come back empty, a built-in set of sample listings from
// many countries is returned so the page never shows 0 jobs.

const ARBEITNOW_URL = 'https://www.arbeitnow.com/api/job-board-api';
const REMOTIVE_URL = 'https://remotive.com/api/remote-jobs?limit=60';
const TTL_MS = 30 * 60 * 1000;
const TIMEOUT_MS = 6000;
const PER_FEED = 40;

const clip = (v, max) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max);
const httpsUrl = v => { try { const u = new URL(String(v)); return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : ''; } catch (e) { return ''; } };
const isoDate = v => { const d = typeof v === 'number' ? new Date(v * 1000) : new Date(v); return Number.isNaN(d.getTime()) ? null : d.toISOString(); };

function normalizeArbeitnow(body) {
  const list = body && Array.isArray(body.data) ? body.data : [];
  return list.map(j => ({
    title: clip(j.title, 140), company: clip(j.company_name, 100),
    location: clip(j.remote ? (j.location ? j.location + ' (Remote)' : 'Remote') : j.location, 100),
    country: '', url: httpsUrl(j.url), postedAt: isoDate(j.created_at), source: 'Arbeitnow',
  })).filter(j => j.title && j.company && j.location && j.url);
}

function normalizeRemotive(body) {
  const list = body && Array.isArray(body.jobs) ? body.jobs : [];
  return list.map(j => ({
    title: clip(j.title, 140), company: clip(j.company_name, 100),
    location: clip(j.candidate_required_location || 'Worldwide', 100),
    country: '', url: httpsUrl(j.url), postedAt: isoDate(j.publication_date), source: 'Remotive',
  })).filter(j => j.title && j.company && j.location && j.url);
}

// Sample listings, spread across many countries. They link to each country's
// public job portal rather than to a made-up posting.
const S = (title, company, country, location, url) => ({ title, company, location, country, url, postedAt: null, source: 'sample' });
const SAMPLES = [
  S('Software Engineer', 'Nusantara Digital', 'ID', 'Jakarta, Indonesia', 'https://www.kemnaker.go.id/'),
  S('Data Analyst', 'Merlion Analytics', 'SG', 'Singapore', 'https://www.mycareersfuture.gov.sg/'),
  S('Nurse', 'Sunrise Care', 'MY', 'Kuala Lumpur, Malaysia', 'https://www.jobstreet.com.my/'),
  S('Product Designer', 'Siam Studio', 'TH', 'Bangkok, Thailand', 'https://www.jobsdb.com/th'),
  S('Backend Developer', 'Saigon Labs', 'VN', 'Ho Chi Minh City, Vietnam', 'https://www.vietnamworks.com/'),
  S('Electrical Engineer', 'Kanto Systems', 'JP', 'Tokyo, Japan', 'https://www.hellowork.mhlw.go.jp/'),
  S('Marketing Manager', 'Han River Retail', 'KR', 'Seoul, South Korea', 'https://www.work.go.kr/'),
  S('Teacher', 'Bharat Academy', 'IN', 'Bengaluru, India', 'https://www.ncs.gov.in/'),
  S('Logistics Coordinator', 'Gulf Freight', 'AE', 'Dubai, United Arab Emirates', 'https://www.bayt.com/'),
  S('Accountant', 'Anatolia Finance', 'TR', 'Istanbul, Turkey', 'https://www.kariyer.net/'),
  S('Mechanical Engineer', 'Rhein Technik', 'DE', 'Berlin, Germany', 'https://www.arbeitsagentur.de/jobsuche/'),
  S('Chef', 'Maison Lumiere', 'FR', 'Lyon, France', 'https://www.francetravail.fr/'),
  S('UX Researcher', 'Thames Digital', 'GB', 'London, United Kingdom', 'https://findajob.dwp.gov.uk/'),
  S('Hotel Receptionist', 'Costa Azul Hotels', 'ES', 'Barcelona, Spain', 'https://www.infojobs.net/'),
  S('Warehouse Supervisor', 'Dutch Harbour Logistics', 'NL', 'Rotterdam, Netherlands', 'https://www.werk.nl/'),
  S('Frontend Developer', 'Vistula Soft', 'PL', 'Warsaw, Poland', 'https://www.pracuj.pl/'),
  S('Civil Engineer', 'Nordic Build', 'SE', 'Stockholm, Sweden', 'https://arbetsformedlingen.se/'),
  S('Pharmacist', 'Nile Health', 'EG', 'Cairo, Egypt', 'https://wuzzuf.net/'),
  S('Farm Manager', 'Savanna Agro', 'KE', 'Nairobi, Kenya', 'https://www.brightermonday.co.ke/'),
  S('Mobile Developer', 'Lagos Pay', 'NG', 'Lagos, Nigeria', 'https://www.jobberman.com/'),
  S('Mining Technician', 'Highveld Resources', 'ZA', 'Johannesburg, South Africa', 'https://www.pnet.co.za/'),
  S('Customer Support Agent', 'Maple Leaf Commerce', 'CA', 'Toronto, Canada', 'https://www.jobbank.gc.ca/'),
  S('Cloud Engineer', 'Lone Star Cloud', 'US', 'Austin, United States', 'https://www.usajobs.gov/'),
  S('Graphic Designer', 'Azteca Creative', 'MX', 'Mexico City, Mexico', 'https://www.occ.com.mx/'),
  S('Agronomist', 'Pampas Farms', 'AR', 'Buenos Aires, Argentina', 'https://www.zonajobs.com.ar/'),
  S('Sales Executive', 'Paulista Trade', 'BR', 'Sao Paulo, Brazil', 'https://www.vagas.com.br/'),
  S('Surveyor', 'Outback Mapping', 'AU', 'Perth, Australia', 'https://www.seek.com.au/'),
  S('Tourism Guide', 'Kiwi Trails', 'NZ', 'Queenstown, New Zealand', 'https://www.seek.co.nz/'),
  S('Remote Content Writer', 'Open Horizon', '', 'Remote (Worldwide)', 'https://remotive.com/'),
];

let cache = null;

async function fetchJson(fetchFn, url) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const res = await fetchFn(url, { signal: ctl.signal, headers: { accept: 'application/json' } });
    if (!res.ok) throw new Error('http_' + res.status);
    return await res.json();
  } finally { clearTimeout(timer); }
}

// Interleave the feeds so one source does not fill the page.
function interleave(lists) {
  const out = [];
  for (let i = 0; lists.some(l => i < l.length); i++) lists.forEach(l => { if (i < l.length) out.push(l[i]); });
  return out;
}

async function loadWorldJobs(fetchFn = fetch) {
  const feeds = [[ARBEITNOW_URL, normalizeArbeitnow], [REMOTIVE_URL, normalizeRemotive]];
  const results = await Promise.allSettled(feeds.map(async ([url, norm]) => norm(await fetchJson(fetchFn, url)).slice(0, PER_FEED)));
  const lists = results.filter(r => r.status === 'fulfilled').map(r => r.value);
  const live = interleave(lists);
  if (live.length) return { live: true, jobs: live, sources: [...new Set(live.map(j => j.source))] };
  return { live: false, jobs: SAMPLES.slice(), sources: [] };
}

async function getWorldJobs(fetchFn) {
  const now = Date.now();
  if (cache && now - cache.at < (cache.live ? TTL_MS : 60 * 1000)) return cache.data;
  const data = await loadWorldJobs(fetchFn);
  cache = { at: now, live: data.live, data };
  return data;
}

function resetWorldCache() { cache = null; }

module.exports = { getWorldJobs, loadWorldJobs, normalizeArbeitnow, normalizeRemotive, resetWorldCache, SAMPLES };
