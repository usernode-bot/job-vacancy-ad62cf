# Loker Dunia

A mobile-first global job board that runs on Homeroom. Interface text is in
Bahasa Indonesia with an English toggle, in light and dark mode.

- **Job seekers** build a CV-style profile in a 4-step sign-up (biodata,
  education and experience, skills and languages, certificates). Skills show
  whether a certificate proves them, and "Cocokkan Skill Saya" scores every
  job against the profile, weighting certified skills higher.
- **Companies** post jobs ("Pasang Loker"), see applicants per job with their
  match score and certificates, filter them and move them through
  Baru, Diproses, Wawancara, Diterima and Ditolak.
- **Everyone** can search and filter 37 sample jobs from every continent,
  convert salaries with static exchange rates, bookmark jobs, and browse the
  most wanted skills and jobs per country.

## How it is built

The whole app is `public/index.html`. There is no backend for app data: state
lives in memory (and is mirrored to `localStorage` when the browser allows it)
as `users`, `companies`, `profiles`, `skills`, `certificates`, `jobs`,
`applications` and `bookmarks`. All reads and writes go through the `api`
object in that file, so it can be swapped for real HTTP calls later.

Sign-in uses the Homeroom account the app is opened with; choosing
"Pencari Kerja" or "Perusahaan" creates the role, with no passwords. Sample
accounts (Rizky Pratama, PT Nusantara Digital) are available under "Masuk".

`server.js` only serves the page, verifies the platform token and shuts down
gracefully. Tailwind is precompiled by `npm run build` during the image build.
