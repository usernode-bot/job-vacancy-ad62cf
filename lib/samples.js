'use strict';
// Sample listings: 40 invented openings in 40 countries on every continent, so the
// board shows what Loker Dunia looks like from day one. They ship in every
// environment (production included) and are flagged is_sample, NOT is_demo:
// is_demo companies can be managed by any signed-in user, sample companies by
// nobody. They carry no owner, can't be applied to (see /jobs/:id/apply in
// lib/routes.js), and the interface tags them "Sample listing".
// seedSamples() is idempotent (ON CONFLICT DO NOTHING).

const { parseSkillList, COUNTRY_TZ } = require('./seed');

const DAY = 86400000;
const TZ = {
  ...COUNTRY_TZ,
  FR: 'CET (UTC+1)', ES: 'CET (UTC+1)', IT: 'CET (UTC+1)', PL: 'CET (UTC+1)', SE: 'CET (UTC+1)', NO: 'CET (UTC+1)', DK: 'CET (UTC+1)',
  IE: 'GMT (UTC+0)', PT: 'WET (UTC+0)', FI: 'EET (UTC+2)', TR: 'TRT (UTC+3)', EG: 'EET (UTC+2)', MA: 'WET (UTC+1)', GH: 'GMT (UTC+0)',
  ET: 'EAT (UTC+3)', TZ: 'EAT (UTC+3)', SA: 'AST (UTC+3)', QA: 'AST (UTC+3)', PK: 'PKT (UTC+5)', BD: 'BST (UTC+6)', VN: 'ICT (UTC+7)',
  TH: 'ICT (UTC+7)', TW: 'CST (UTC+8)', NZ: 'NZST (UTC+12)', AR: 'ART (UTC-3)', CL: 'CLT (UTC-4)', CO: 'COT (UTC-5)', PE: 'PET (UTC-5)',
};

// [country, city, employer, title, category, currency, min, max, period, type, model, flags (rw/visa/relo),
//  required, nice ("Skill:level|..."; 1 beginner, 2 intermediate, 3 advanced), min years, education, languages, description,
//  qualifications, benefits]
const ROWS = [
  ['FR', 'Lyon', 'Rhone Digital SAS', 'Platform Engineer', 'it', 'EUR', 55000, 70000, 'year', 'fulltime', 'hybrid', 'visa', 'Kubernetes:3|Terraform:2|Linux:3', 'Go:1|Prometheus:2', 3, 's1', 'en:fluent|fr:basic',
    'Run the cloud platform used by the engineering teams of a French software company.', ['3 years running production infrastructure', 'Comfortable on call'], ['Visa sponsorship', 'Meal vouchers']],
  ['ES', 'Barcelona', 'Costa Studio S.L.', 'Product Designer', 'creative', 'EUR', 38000, 50000, 'year', 'fulltime', 'hybrid', 'relo', 'Figma:3|UX Research:2|Prototyping:2', 'HTML:1|CSS:1', 2, 's1', 'en:fluent|es:intermediate',
    'Design booking flows for a travel app used across Southern Europe.', ['Portfolio with shipped product work', 'Experience running user interviews'], ['Relocation package', 'Spanish classes']],
  ['IT', 'Milan', 'Navigli Moda S.p.A.', 'Marketing Manager', 'marketing', 'EUR', 45000, 60000, 'year', 'fulltime', 'hybrid', '', 'Branding:3|Data Analysis:2|Communication:3', 'Public Speaking:2', 4, 's1', 'en:fluent|it:intermediate',
    'Lead campaigns for a fashion retailer selling in twelve European countries.', ['4 years in consumer marketing', 'Confident with campaign analytics'], ['Staff discount', 'Hybrid schedule']],
  ['PL', 'Warsaw', 'Wisla Software', 'QA Engineer', 'it', 'PLN', 14000, 20000, 'month', 'fulltime', 'remote', '', 'Test Automation:3|JavaScript:2|Git:2', 'CI/CD:1', 2, 's1', 'en:fluent|pl:basic',
    'Build automated tests for a payments product, working from anywhere in Poland.', ['2 years of test automation', 'Clear written English'], ['Remote setup budget', 'Private health care']],
  ['SE', 'Stockholm', 'Nordlys Tech AB', 'Backend Developer', 'it', 'SEK', 55000, 70000, 'month', 'fulltime', 'hybrid', 'visa|relo', 'Python:3|PostgreSQL:2|REST API:3', 'Docker:2|AWS:1', 3, 's1', 'en:fluent|sv:basic',
    'Build services for a fast growing climate data platform.', ['3 years of backend work', 'Care about tests and code review'], ['Visa and relocation help', '25 days of leave']],
  ['NO', 'Bergen', 'Nordfjord Energy AS', 'Wind Turbine Technician', 'engineering', 'EUR', 55000, 65000, 'year', 'fulltime', 'onsite', 'visa', 'Electrical Maintenance:3|Safety Procedures:3|Troubleshooting:2', 'Hydraulics:1', 2, 'd3', 'en:intermediate|no:basic',
    'Service and maintain onshore wind turbines across western Norway as part of a three person field team.', ['Technical diploma or equal experience', 'Work at height certificate'], ['Work visa sponsorship', 'Company vehicle']],
  ['IE', 'Dublin', 'Liffey Cloud Ltd', 'Customer Support Lead', 'sales', 'EUR', 42000, 52000, 'year', 'fulltime', 'hybrid', 'visa', 'Customer Service:3|Communication:3|Negotiation:2', 'HubSpot CRM:1', 3, 's1', 'en:native',
    'Lead a team of eight support agents for a European software company.', ['3 years in customer support', 'Experience coaching a team'], ['Visa sponsorship', 'Pension plan']],
  ['PT', 'Lisbon', 'Tejo Content Lab', 'Content Marketer', 'marketing', 'EUR', 28000, 38000, 'year', 'fulltime', 'remote', 'rw', 'Copywriting:3|SEO:2|Social Media:2', 'Data Analysis:1', 2, 's1', 'en:fluent|pt:fluent',
    'Write articles and newsletters for clients around the world. Work from any country.', ['Strong English writing samples', 'Basic SEO knowledge'], ['Work from anywhere', 'Learning budget']],
  ['TR', 'Istanbul', 'Bosphorus Freight', 'Logistics Coordinator', 'logistics', 'USD', 1800, 2600, 'month', 'fulltime', 'onsite', '', 'Supply Chain:2|Excel:2|Communication:2', 'SAP:1', 2, 's1', 'en:intermediate|tr:fluent',
    'Coordinate container shipments between Istanbul and ports in Europe and the Middle East.', ['2 years in freight or shipping', 'Good with spreadsheets'], ['Meal allowance', 'Shuttle service']],
  ['EG', 'Cairo', 'Nile Apps', 'Frontend Developer', 'it', 'EGP', 40000, 65000, 'month', 'fulltime', 'hybrid', '', 'JavaScript:3|React:2|CSS:3', 'TypeScript:1|Figma:1', 2, 's1', 'en:fluent|ar:native',
    'Build the customer web app of an Egyptian payments startup.', ['2 years with React', 'Eye for responsive design'], ['Health insurance', 'Annual bonus']],
  ['MA', 'Casablanca', 'Atlas Connect', 'Customer Success Specialist', 'sales', 'USD', 1500, 2200, 'month', 'fulltime', 'hybrid', '', 'Customer Service:3|Communication:3|French:3', 'Arabic:2', 1, 'any', 'fr:fluent|en:intermediate',
    'Help French and English speaking business customers get started with a booking platform.', ['Fluent French and good English', 'Friendly and patient on calls'], ['Training programme', 'Hybrid schedule']],
  ['GH', 'Accra', 'Volta Harvest Co-op', 'Agricultural Extension Officer', 'agriculture', 'USD', 900, 1400, 'month', 'contract', 'onsite', '', 'Agronomy:3|Crop Management:2|Community Training:2', 'Data Collection:1', 2, 's1', 'en:fluent',
    'Train smallholder cocoa farmers in soil care and pest control. One year contract.', ['Degree in agriculture or related field', 'Willing to travel to farms'], ['Motorbike allowance', 'Contract renewal option']],
  ['ET', 'Addis Ababa', 'Sheba Community Clinics', 'Public Health Nurse', 'health', 'USD', 700, 1000, 'month', 'contract', 'onsite', '', 'Nursing:3|Vaccination:2|Community Health:2', 'Health Education:1', 2, 'd3', 'en:intermediate|am:native',
    'Run maternal and child health outreach for a network of community clinics. Two year contract.', ['Nursing diploma and licence', '2 years in primary care'], ['Housing support', 'Training abroad']],
  ['TZ', 'Arusha', 'Kilimanjaro Care Clinics', 'Pharmacist', 'health', 'USD', 1000, 1400, 'month', 'fulltime', 'onsite', '', 'Dispensing:3|Inventory Management:2|Patient Counselling:3', 'Clinical Pharmacy:1', 2, 's1', 'en:fluent|sw:fluent',
    'Manage the dispensary of a busy clinic and advise patients on safe use of medicine.', ['Registered pharmacist', 'Careful with stock records'], ['Health cover', 'Paid leave']],
  ['SA', 'Riyadh', 'Najd Infrastructure Co.', 'Project Engineer', 'engineering', 'SAR', 18000, 26000, 'month', 'fulltime', 'onsite', 'visa|relo', 'Project Management:3|AutoCAD:2|Structural Analysis:2', 'Primavera:1', 4, 's1', 'en:fluent|ar:basic',
    'Coordinate site works for new public buildings in Riyadh.', ['4 years on construction projects', 'Professional engineering registration'], ['Work visa and relocation', 'Housing allowance']],
  ['QA', 'Doha', 'Pearl Coast Hotel', 'Hotel Front Office Supervisor', 'hospitality', 'QAR', 9000, 13000, 'month', 'fulltime', 'onsite', 'visa|relo', 'Customer Service:3|Reservation Management:2|Communication:3', 'Opera PMS:1', 2, 'd3', 'en:fluent|ar:basic',
    'Supervise the front desk team of a five star hotel on the Doha waterfront.', ['2 years at a hotel front desk', 'Calm under pressure'], ['Staff accommodation', 'Annual flight home']],
  ['PK', 'Lahore', 'Ravi Analytics', 'Data Analyst', 'it', 'USD', 1200, 1800, 'month', 'fulltime', 'remote', '', 'SQL:3|Python:2|Data Visualization:2', 'Statistics:2', 2, 's1', 'en:fluent|ur:native',
    'Turn sales data from retail clients into weekly dashboards, working remotely from Pakistan.', ['2 years of SQL', 'Clear communication with clients'], ['Internet allowance', 'Flexible hours']],
  ['BD', 'Dhaka', 'Padma Creative', 'Graphic Designer', 'creative', 'USD', 700, 1100, 'month', 'parttime', 'remote', 'rw', 'Adobe Illustrator:3|Photoshop:2|Branding:2', 'Motion Graphics:1', 2, 'any', 'en:fluent|bn:native',
    'Design social media graphics and logos for international clients. About 20 hours a week, work from anywhere.', ['Portfolio of brand work', 'Reliable with deadlines'], ['Flexible schedule', 'Paid design tools']],
  ['VN', 'Ho Chi Minh City', 'Saigon Mobile Works', 'Mobile Developer', 'it', 'VND', 40000000, 60000000, 'month', 'fulltime', 'hybrid', '', 'Kotlin:3|Android:3|REST API:2', 'Swift:1|CI/CD:1', 3, 's1', 'en:fluent|vi:native',
    'Build an Android delivery app used in more than twenty Vietnamese cities.', ['3 years of Android work', 'Published apps on Google Play'], ['13th month salary', 'Health insurance']],
  ['TH', 'Bangkok', 'Chao Phraya Media', 'Digital Marketing Specialist', 'marketing', 'THB', 45000, 65000, 'month', 'fulltime', 'hybrid', 'visa', 'Social Media:3|SEO:2|Data Analysis:2', 'Copywriting:2', 2, 's1', 'en:fluent|th:basic',
    'Plan and measure online campaigns for tourism brands in Thailand.', ['2 years in digital marketing', 'Comfortable with analytics tools'], ['Work permit support', 'Yearly bonus']],
  ['TW', 'Taipei', 'Formosa Circuits Ltd', 'Hardware Engineer', 'engineering', 'USD', 50000, 70000, 'year', 'fulltime', 'onsite', 'visa|relo', 'Circuit Design:3|PCB Layout:2|Troubleshooting:2', 'Python:1', 3, 's1', 'en:fluent|zh:basic',
    'Design circuit boards for consumer electronics built in Taiwan.', ['3 years of hardware design', 'Experience taking a product to production'], ['Gold Card support', 'Relocation package']],
  ['NZ', 'Auckland', 'Kowhai Orchards Ltd', 'Orchard Supervisor', 'agriculture', 'NZD', 62000, 75000, 'year', 'fulltime', 'onsite', 'visa|relo', 'Crop Management:3|Team Leadership:2|Safety Procedures:2', 'Irrigation:1', 3, 'any', 'en:fluent',
    'Lead a seasonal crew on a kiwifruit orchard south of Auckland.', ['3 years of orchard or farm work', 'Driving licence'], ['Accommodation on site', 'Visa support']],
  ['AR', 'Buenos Aires', 'Pampa Software', 'Full Stack Developer', 'it', 'USD', 3000, 4500, 'month', 'fulltime', 'remote', 'rw', 'JavaScript:3|Node.js:3|React:2|PostgreSQL:2', 'TypeScript:2|AWS:1', 3, 'any', 'en:fluent|es:native',
    'Build features for a software product used by customers in 30 countries. Open to people in any country.', ['3 years of full stack work', 'Comfortable working across time zones'], ['Paid in US dollars', 'Home office budget']],
  ['CL', 'Santiago', 'Andes Capital', 'Financial Analyst', 'finance', 'USD', 2200, 3200, 'month', 'fulltime', 'hybrid', '', 'Financial Modeling:3|Excel:3|Valuation:2', 'Power BI:1', 2, 's1', 'en:fluent|es:fluent',
    'Prepare investment reports for a Santiago fund investing across Latin America.', ['Degree in finance or economics', 'Strong spreadsheet modelling'], ['Annual bonus', 'Hybrid schedule']],
  ['CO', 'Medellín', 'Andes Labs', 'Mobile Developer (Flutter)', 'it', 'USD', 3000, 4200, 'month', 'fulltime', 'remote', 'rw', 'Flutter:3|Dart:3|REST API:2', 'Firebase:2|Git:2', 3, 'any', 'en:fluent|es:intermediate',
    'Build a cross platform app for a health coaching company. Work from any country.', ['3 years of mobile development', 'Published a Flutter app'], ['Remote first team', 'Learning budget']],
  ['PE', 'Lima', 'Pacifico Cargo SAC', 'Logistics Analyst', 'logistics', 'USD', 1400, 2000, 'month', 'fulltime', 'onsite', '', 'Supply Chain:2|Excel:3|Data Analysis:2', 'SQL:1', 2, 's1', 'es:native|en:intermediate',
    'Track shipments and costs for a freight company moving goods through the port of Callao.', ['Degree in logistics or engineering', 'Good with data'], ['Health insurance', 'Meal allowance']],
  ['FI', 'Helsinki', 'Aurora Primary School', 'Primary School Teacher', 'education', 'EUR', 3000, 3800, 'month', 'fulltime', 'onsite', 'visa', 'Classroom Management:3|Curriculum Design:2|Child Education:3', 'Public Speaking:1', 2, 's1', 'en:fluent|fi:basic',
    'Teach a grade 4 class at an international school in Helsinki.', ['Teaching qualification', 'Experience with international curricula'], ['Visa support', 'Long summer holiday']],
  ['DK', 'Copenhagen', 'Oresund Data ApS', 'Data Engineer', 'it', 'EUR', 70000, 85000, 'year', 'fulltime', 'hybrid', 'visa', 'Python:3|SQL:3|Spark:2|Docker:2', 'Airflow:2|AWS:1', 3, 's2', 'en:fluent',
    'Build data pipelines for an energy trading company.', ['3 years building pipelines', 'Master level education or equal experience'], ['Visa sponsorship', 'Pension plan']],
  ['US', 'Seattle', 'Cascade Fulfillment Inc.', 'Warehouse Operations Intern', 'logistics', 'USD', 22, 26, 'hour', 'internship', 'onsite', '', 'Inventory Management:1|Communication:2|Safety Procedures:1', 'Excel:1', 0, 'any', 'en:fluent',
    'Learn warehouse operations over a six month paid internship at a large fulfillment centre.', ['Studying or recently graduated', 'Able to lift 20 kg'], ['Paid internship', 'Mentor from the operations team']],
  ['DE', 'Hamburg', 'Hanse Port Services GmbH', 'Port Logistics Planner', 'logistics', 'EUR', 52000, 64000, 'year', 'fulltime', 'hybrid', 'relo', 'Supply Chain:3|SAP:2|Planning:3', 'Python:1', 3, 's1', 'en:fluent|de:intermediate',
    'Plan container movements at one of Europe\'s busiest ports.', ['3 years in logistics planning', 'German at B1 level'], ['Relocation package', '30 days of leave']],
  ['JP', 'Kyoto', 'Gion Heritage Hotel', 'Hotel Concierge', 'hospitality', 'JPY', 3400000, 4200000, 'year', 'fulltime', 'onsite', 'visa', 'Customer Service:3|Communication:3|English:3', 'Japanese:1', 2, 'd3', 'en:fluent|ja:basic',
    'Help international guests plan their stay at a small hotel in Kyoto.', ['2 years in hospitality', 'Warm and well organised'], ['Visa sponsorship', 'Staff meals']],
  ['BR', 'Curitiba', 'Parana Grãos Ltda', 'Agronomy Intern', 'agriculture', 'BRL', 2200, 2800, 'month', 'internship', 'onsite', '', 'Agronomy:1|Data Collection:1|Excel:1', 'Crop Management:1', 0, 'any', 'pt:native|en:basic',
    'Support field trials on soybean and corn farms during a 6 month internship.', ['Studying agronomy', 'Willing to work on farms'], ['Transport voucher', 'Mentor agronomist']],
  ['IN', 'Pune', 'Deccan Accounts LLP', 'Accounts Executive', 'finance', 'INR', 500000, 800000, 'year', 'fulltime', 'onsite', '', 'Accounting:3|Excel:3|Tax Compliance:2', 'Tally:2', 2, 's1', 'en:fluent|hi:fluent',
    'Handle accounts payable, receivable and monthly closing for small business clients.', ['Degree in commerce', '2 years in accounting'], ['Provident fund', 'Health insurance']],
  ['GB', 'Edinburgh', 'Forth Valley Health', 'Physiotherapist', 'health', 'GBP', 33000, 42000, 'year', 'fulltime', 'onsite', 'visa', 'Physiotherapy:3|Patient Assessment:3|Rehabilitation:2', 'Sports Injury:1', 2, 's1', 'en:fluent',
    'Treat outpatients with back and joint problems at a community hospital.', ['Registered physiotherapist', '2 years of clinical work'], ['Health and Care visa', 'NHS pension']],
  ['CA', 'Calgary', 'Prairie Energy Corp.', 'Petroleum Engineer', 'engineering', 'CAD', 100000, 130000, 'year', 'fulltime', 'onsite', 'visa|relo', 'Reservoir Engineering:3|Data Analysis:2|Project Management:2', 'Python:1', 4, 's1', 'en:fluent',
    'Plan and monitor wells for an energy company in Alberta.', ['4 years in petroleum engineering', 'Professional engineering licence'], ['Relocation package', 'Work permit support']],
  ['AU', 'Perth', 'Swan River Mining', 'Mining Data Analyst', 'it', 'AUD', 95000, 120000, 'year', 'fulltime', 'hybrid', 'visa', 'SQL:3|Python:2|Data Visualization:2', 'Machine Learning:1', 3, 's1', 'en:fluent',
    'Analyse equipment and production data for iron ore mines in Western Australia.', ['3 years as a data analyst', 'Comfortable presenting to engineers'], ['Visa sponsorship', 'Fly in fly out options']],
  ['ZA', 'Johannesburg', 'Gold Reef Solutions', 'Sales Representative', 'sales', 'ZAR', 25000, 35000, 'month', 'fulltime', 'onsite', '', 'Negotiation:3|Communication:3|Customer Service:2', 'HubSpot CRM:1', 1, 'any', 'en:fluent|zu:basic',
    'Sell office equipment to small businesses across Gauteng.', ['Sales experience', 'Driving licence'], ['Commission', 'Fuel allowance']],
  ['KE', 'Mombasa', 'Coast Safari Tours', 'Tour Guide', 'hospitality', 'KES', 80000, 120000, 'month', 'parttime', 'onsite', '', 'Customer Service:3|Public Speaking:3|Local History:2', 'First Aid:2', 1, 'any', 'en:fluent|sw:native',
    'Guide visitors on coastal and wildlife tours three or four days a week.', ['Guide certification', 'Friendly and well informed'], ['Tips share', 'Training in first aid']],
  ['NG', 'Lagos', 'Eko Docs Collective', 'Freelance Technical Writer', 'creative', 'USD', 25, 40, 'hour', 'contract', 'remote', 'rw', 'Technical Writing:3|API Documentation:2|Git:2', 'Markdown:2', 2, 'any', 'en:native',
    'Write developer documentation for software clients worldwide. Six month contract, work from anywhere.', ['Writing samples for software products', 'Able to read code'], ['Paid in US dollars', 'Contract extension possible']],
  ['MY', 'Penang', 'Straits Silicon Sdn Bhd', 'Electronics Process Engineer', 'engineering', 'MYR', 6000, 9000, 'month', 'fulltime', 'onsite', 'relo', 'Process Engineering:3|Six Sigma:2|Troubleshooting:2', 'Python:1', 3, 's1', 'en:fluent|ms:fluent',
    'Improve yield on a semiconductor assembly line in Penang.', ['3 years in electronics manufacturing', 'Know quality tools such as Six Sigma'], ['Relocation package', 'Shift allowance']],
];

const SAMPLE_JOBS = ROWS.map((r, i) => {
  const [c, city, co, title, cat, cur, min, max, per, type, model, flags, req, nice, exp, edu, langs, desc, quals, ben] = r;
  const f = flags.split('|');
  return { id: 's-' + (i + 1), coId: 's-co-' + (i + 1), co, c, city, title, cat, cur, min, max, per, type, model,
    rw: f.includes('rw'), visa: f.includes('visa'), relo: f.includes('relo'), req, nice, exp, edu, langs, desc, quals, ben, days: 1 + (i % 21) };
});

async function seedSamples(pool) {
  const now = Date.now();
  for (const j of SAMPLE_JOBS) {
    await pool.query(
      `INSERT INTO companies (id, owner_user_id, name, country, city, industry, is_demo, is_sample)
       VALUES ($1, NULL, $2, $3, $4, $5, FALSE, TRUE) ON CONFLICT (id) DO NOTHING`,
      [j.coId, j.co, j.c, j.city, j.cat]);
    await pool.query(
      `INSERT INTO jobs (id, company_id, title, category, country, city, currency, salary_min, salary_max, period,
         type, model, remote_worldwide, visa_sponsor, relocation, required, nice, min_exp, education, languages,
         description, qualifications, benefits, timezone, is_demo, is_sample, posted_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,FALSE,TRUE,$25)
       ON CONFLICT (id) DO NOTHING`,
      [j.id, j.coId, j.title, j.cat, j.c, j.city, j.cur, j.min, j.max, j.per, j.type, j.model, j.rw, j.visa, j.relo,
        JSON.stringify(parseSkillList(j.req)), JSON.stringify(parseSkillList(j.nice)), j.exp, j.edu,
        JSON.stringify(j.langs.split('|').map(x => { const [code, level] = x.split(':'); return { code, level }; })),
        j.desc, JSON.stringify(j.quals), JSON.stringify(j.ben), j.rw ? 'Flexible' : (TZ[j.c] || ''),
        new Date(now - j.days * DAY).toISOString()]);
  }
}

module.exports = { seedSamples, SAMPLE_JOBS };
