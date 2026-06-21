/**
 * Seed categories from backup data (preserves exact IDs + slugs)
 * Run from storein/ directory:  node scripts/seed-cats.js
 */
const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/storein';

const ID = {
  aftabi:       '6a298eff1151570cae42b601',
  aftabi_m:     '6a298eff1151570cae42b602',
  aftabi_f:     '6a298eff1151570cae42b603',
  aftabi_kids:  '6a298eff1151570cae42b604',
  aftabi_sport: '6a298eff1151570cae42b605',
  aftabi_lux:   '6a298eff1151570cae42b606',
  tebi:         '6a298eff1151570cae42b607',
  tebi_m:       '6a298eff1151570cae42b608',
  tebi_f:       '6a298eff1151570cae42b609',
  tebi_kids:    '6a298eff1151570cae42b60a',
  tebi_gerd:    '6a298eff1151570cae42b60b',
  tebi_rect:    '6a298eff1151570cae42b60c',
  tebi_cat:     '6a298eff1151570cae42b60d',
  lenz:         '6a298eff1151570cae42b60f',
  lenz_1d:      '6a298eff1151570cae42b610',
  lenz_monthly: '6a298eff1151570cae42b611',
  lenz_3m:      '6a298eff1151570cae42b612',
  lenz_color:   '6a298eff1151570cae42b613',
  lenz_tebi_c:  '6a298eff1151570cae42b614',
  lavazem:      '6a298eff1151570cae42b615',
  lavazem_case: '6a298eff1151570cae42b616',
  lavazem_band: '6a298eff1151570cae42b617',
  lavazem_dust: '6a298eff1151570cae42b618',
  lavazem_hold: '6a298eff1151570cae42b619',
  lenz_tebi:    '6a298eff1151570cae42b61a',
  lenz_narm:    '6a298eff1151570cae42b61b',
  lenz_sakt:    '6a298eff1151570cae42b61c',
  lenz_toric:   '6a298eff1151570cae42b61d',
  lenz_multi:   '6a298eff1151570cae42b61e',
  fantzy:       '6a29914622063db883ea8186',
};

function o(key) { return new ObjectId(ID[key]); }

const categories = [
  // roots
  { _id: o('aftabi'),       name: 'عینک آفتابی',      slug: 'eynak-aftabi',          icon: '🕶️', parent: null,             ancestors: [],                        depth: 0, sortOrder: 1 },
  { _id: o('tebi'),         name: 'عینک طبی',          slug: 'eynak-tebi',            icon: '👓',  parent: null,             ancestors: [],                        depth: 0, sortOrder: 2 },
  { _id: o('lenz'),         name: 'لنز چشمی',          slug: 'lenz-cheshmi',          icon: '👁️', parent: null,             ancestors: [],                        depth: 0, sortOrder: 3 },
  { _id: o('lavazem'),      name: 'لوازم جانبی',       slug: 'lavazem-janebi',        icon: '🧴',  parent: null,             ancestors: [],                        depth: 0, sortOrder: 4 },
  { _id: o('lenz_tebi'),    name: 'لنز طبی',           slug: 'lenz-tebi',             icon: '🔬',  parent: null,             ancestors: [],                        depth: 0, sortOrder: 5 },
  // عینک آفتابی
  { _id: o('aftabi_m'),     name: 'عینک آفتابی مردانه', slug: 'aynk-aaftaby-mrdanh',  icon: '', gender: 'men',   parent: o('aftabi'),    ancestors: [o('aftabi')],               depth: 1, sortOrder: 1 },
  { _id: o('aftabi_f'),     name: 'عینک آفتابی زنانه',  slug: 'aynk-aaftaby-znanh',   icon: '', gender: 'women', parent: o('aftabi'),    ancestors: [o('aftabi')],               depth: 1, sortOrder: 2 },
  { _id: o('aftabi_kids'),  name: 'عینک آفتابی بچگانه', slug: 'aynk-aaftaby-bchganh', icon: '', gender: 'kids',  parent: o('aftabi'),    ancestors: [o('aftabi')],               depth: 1, sortOrder: 3 },
  { _id: o('aftabi_sport'), name: 'عینک آفتابی ورزشی',  slug: 'aynk-aaftaby-wrzshy',  icon: '', gender: '',      parent: o('aftabi'),    ancestors: [o('aftabi')],               depth: 1, sortOrder: 4 },
  { _id: o('aftabi_lux'),   name: 'عینک آفتابی لاکچری', slug: 'aynk-aaftaby-lakchry', icon: '', gender: '',      parent: o('aftabi'),    ancestors: [o('aftabi')],               depth: 1, sortOrder: 5 },
  // لاکچری > فانتزی
  { _id: o('fantzy'),       name: 'عینک فانتزی',        slug: 'aynk-fantzy',           icon: '',                  parent: o('aftabi_lux'), ancestors: [o('aftabi'), o('aftabi_lux')], depth: 2, sortOrder: 10 },
  // عینک طبی
  { _id: o('tebi_m'),    name: 'عینک طبی مردانه', slug: 'aynk-tby-mrdanh',     icon: '', gender: 'men',   parent: o('tebi'), ancestors: [o('tebi')], depth: 1, sortOrder: 1 },
  { _id: o('tebi_f'),    name: 'عینک طبی زنانه',  slug: 'aynk-tby-znanh',      icon: '', gender: 'women', parent: o('tebi'), ancestors: [o('tebi')], depth: 1, sortOrder: 2 },
  { _id: o('tebi_kids'), name: 'عینک طبی بچگانه', slug: 'aynk-tby-bchganh',    icon: '', gender: 'kids',  parent: o('tebi'), ancestors: [o('tebi')], depth: 1, sortOrder: 3 },
  { _id: o('tebi_gerd'), name: 'فریم گرد',         slug: 'eynak-tebi-gerd',     icon: '',                  parent: o('tebi'), ancestors: [o('tebi')], depth: 1, sortOrder: 4 },
  { _id: o('tebi_rect'), name: 'فریم مستطیلی',     slug: 'eynak-tebi-mostatil', icon: '',                  parent: o('tebi'), ancestors: [o('tebi')], depth: 1, sortOrder: 5 },
  { _id: o('tebi_cat'),  name: 'فریم کت',          slug: 'eynak-tebi-cat',      icon: '',                  parent: o('tebi'), ancestors: [o('tebi')], depth: 1, sortOrder: 6 },
  // لنز چشمی
  { _id: o('lenz_1d'),      name: 'لنز یک‌روزه',   slug: 'lenz-yakrooze',   icon: '', parent: o('lenz'), ancestors: [o('lenz')], depth: 1, sortOrder: 1 },
  { _id: o('lenz_monthly'), name: 'لنز ماهانه',     slug: 'lenz-mahane',     icon: '', parent: o('lenz'), ancestors: [o('lenz')], depth: 1, sortOrder: 2 },
  { _id: o('lenz_3m'),      name: 'لنز سه‌ماهه',   slug: 'lenz-semahe',     icon: '', parent: o('lenz'), ancestors: [o('lenz')], depth: 1, sortOrder: 3 },
  { _id: o('lenz_color'),   name: 'لنز رنگی',       slug: 'lenz-rangi',      icon: '', parent: o('lenz'), ancestors: [o('lenz')], depth: 1, sortOrder: 4 },
  { _id: o('lenz_tebi_c'),  name: 'لنز طبی رنگی',  slug: 'lenz-tebi-rangi', icon: '', parent: o('lenz'), ancestors: [o('lenz')], depth: 1, sortOrder: 5 },
  // لوازم جانبی
  { _id: o('lavazem_case'), name: 'جاعینکی و کیف',   slug: 'jaeynak-kif',       icon: '', parent: o('lavazem'), ancestors: [o('lavazem')], depth: 1, sortOrder: 1 },
  { _id: o('lavazem_band'), name: 'بند عینک',         slug: 'band-eynak',        icon: '', parent: o('lavazem'), ancestors: [o('lavazem')], depth: 1, sortOrder: 2 },
  { _id: o('lavazem_dust'), name: 'دستمال و اسپری',  slug: 'dastmal-espray',    icon: '', parent: o('lavazem'), ancestors: [o('lavazem')], depth: 1, sortOrder: 3 },
  { _id: o('lavazem_hold'), name: 'پایه و نگهدارنده', slug: 'paye-negahdarande', icon: '', parent: o('lavazem'), ancestors: [o('lavazem')], depth: 1, sortOrder: 4 },
  // لنز طبی
  { _id: o('lenz_narm'),  name: 'لنز نرم',         slug: 'lenz-narm',       icon: '', parent: o('lenz_tebi'), ancestors: [o('lenz_tebi')], depth: 1, sortOrder: 1 },
  { _id: o('lenz_sakt'),  name: 'لنز سخت',         slug: 'lenz-sakt',       icon: '', parent: o('lenz_tebi'), ancestors: [o('lenz_tebi')], depth: 1, sortOrder: 2 },
  { _id: o('lenz_toric'), name: 'لنز توریک',        slug: 'lenz-toric',      icon: '', parent: o('lenz_tebi'), ancestors: [o('lenz_tebi')], depth: 1, sortOrder: 3 },
  { _id: o('lenz_multi'), name: 'لنز مولتی‌فوکال', slug: 'lenz-multifocal', icon: '', parent: o('lenz_tebi'), ancestors: [o('lenz_tebi')], depth: 1, sortOrder: 4 },
];

async function main() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db();
  const col = db.collection('categories');
  const now = new Date();

  let inserted = 0, skipped = 0;
  for (const cat of categories) {
    const exists = await col.findOne({ slug: cat.slug });
    if (exists) { skipped++; continue; }
    await col.insertOne({ ...cat, isActive: true, createdAt: now, updatedAt: now });
    inserted++;
  }
  console.log(`Categories: inserted ${inserted}, skipped ${skipped} (total ${categories.length})`);
  await client.close();
  console.log('Done!');
}

main().catch(err => { console.error(err); process.exit(1); });
