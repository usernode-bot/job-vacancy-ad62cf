# Loker Dunia

A mobile-first global job board that runs on Homeroom. The interface comes in
50 languages (English by default, picked from the header's language button;
Arabic, Persian, Urdu and Hebrew lay out right to left), in light and dark mode.
Interface text lives in `public/i18n/<code>.js`, one file per language, listed
in `public/i18n/languages.js`; to add a language, copy `en.js`, translate it and
add an entry to that list. A missing key falls back to English.

- **Job seekers** build a CV-style profile in a 4-step sign-up (biodata,
  education and experience, skills and languages, certificates). Skills show
  whether a certificate proves them, and "Match My Skills" scores every
  job against the profile, weighting certified skills higher.
- **Companies** post jobs ("Post a Job"), see applicants per job with their
  match score and certificates, filter them and move them through
  New, In review, Interview, Accepted and Rejected.
- **Everyone** can search and filter jobs from every continent,
  convert salaries with static exchange rates, bookmark jobs, and browse the
  most wanted skills and jobs per country.
- **No education certificate needed**: a job whose Education is set to that
  first choice (stored as `education = 'any'`) shows a badge on its card and
  page, and the "No education certificate needed" filter lists only those jobs.
- **Notifications**: the bell in the header lists job-match alerts. When an
  employer posts a job, everyone whose profile holds one of its required
  skills at the asked level hears about it; saving a profile backfills the
  last two weeks of jobs the same way. Opening the page marks the alerts
  read and clears the header badge.

## How it is built

The interface is the single page `public/index.html`. All data lives in the
app's Postgres database and is served by authenticated `/api` routes
(`lib/routes.js`), scoped to the signed-in Homeroom user:

- `lib/schema.js` creates the tables on boot: `app_users`, `companies`,
  `jobs` (public) and `profiles`, `skills`, `certificates`, `applications`,
  `saved_jobs`, `notifications` (marked `staging:private`, so staging previews
  get them empty).
- `lib/notify.js` decides who hears about a job: a profile must hold one of
  the job's required skills at the asked level, and its stored match score
  mirrors the score the job list shows. Each user and job pair is unique, so
  re-saves never duplicate an alert.
- Privacy is enforced on the server: a company reviewing an applicant, or
  anyone opening a shared profile, only receives the phone number and the
  certificates when the applicant allows it.
- Certificate images and profile photos are uploaded to the platform's file
  storage through the bridge; only the returned URL is stored. Platform
  storage accepts images only, so a PDF certificate is saved without its file.
- `lib/seed.js` fills staging previews (never production) with 37 sample
  jobs, 34 sample employers, 3 fake applicants and their applications. The
  demo employer "PT Nusantara Digital" can be opened from "Masuk" by any
  tester. Production starts with an empty board. No visitor's profile is
  seeded, so a fresh preview has an empty notifications list; a tester who
  saves a profile with skills immediately gets alerts for matching seeded
  jobs, and `/#/notifications?demo=1` (staging only) shows a labelled demo
  feed without touching the database.

Sign-in uses the Homeroom account the app is opened with; choosing
"Pencari Kerja" or "Perusahaan" sets the role, with no passwords.

`npm test` runs the API against a real Postgres (`TEST_DATABASE_URL`, or
`INLOOP_DATABASE_URL` in Homeroom build workers) on a throwaway database.
Tailwind is precompiled by `npm run build` during the image build.
