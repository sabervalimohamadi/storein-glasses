/**
 * seed-categories.js
 * Run: node scripts/seed-categories.js
 */
const { MongoClient, ObjectId } = require('mongodb')

const MONGO_URI = 'mongodb://localhost:27017/storein'

const slugify = (str) =>
  str
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9؀-ۿ-]/g, '')
    .toLowerCase()

// ── Category tree ─────────────────────────────────────────────────────────────
// Each root entry may have a `children` array
const TREE = [
  {
    name: 'عینک آفتابی',
    slug: 'eynak-aftabi',
    icon: '🕶️',
    sortOrder: 1,
    children: [
      { name: 'عینک آفتابی مردانه',  slug: 'eynak-aftabi-mardane',  sortOrder: 1 },
      { name: 'عینک آفتابی زنانه',   slug: 'eynak-aftabi-zanane',   sortOrder: 2 },
      { name: 'عینک آفتابی بچگانه',  slug: 'eynak-aftabi-bachegane',sortOrder: 3 },
      { name: 'عینک آفتابی ورزشی',  slug: 'eynak-aftabi-varzeshi',  sortOrder: 4 },
      { name: 'عینک آفتابی لاکچری', slug: 'eynak-aftabi-luxury',    sortOrder: 5 },
    ],
  },
  {
    name: 'عینک طبی',
    slug: 'eynak-tebi',
    icon: '👓',
    sortOrder: 2,
    children: [
      { name: 'عینک طبی مردانه',   slug: 'eynak-tebi-mardane',   sortOrder: 1 },
      { name: 'عینک طبی زنانه',    slug: 'eynak-tebi-zanane',    sortOrder: 2 },
      { name: 'عینک طبی بچگانه',   slug: 'eynak-tebi-bachegane', sortOrder: 3 },
      { name: 'فریم گرد',          slug: 'eynak-tebi-gerd',      sortOrder: 4 },
      { name: 'فریم مستطیلی',      slug: 'eynak-tebi-mostatil',  sortOrder: 5 },
      { name: 'فریم کت',           slug: 'eynak-tebi-cat',       sortOrder: 6 },
      { name: 'فریم بدون فریم',    slug: 'eynak-tebi-rimless',   sortOrder: 7 },
    ],
  },
  {
    name: 'لنز چشمی',
    slug: 'lenz-cheshmi',
    icon: '👁️',
    sortOrder: 3,
    children: [
      { name: 'لنز یک‌روزه',   slug: 'lenz-yakrooze',   sortOrder: 1 },
      { name: 'لنز ماهانه',    slug: 'lenz-mahane',     sortOrder: 2 },
      { name: 'لنز سه‌ماهه',   slug: 'lenz-semahe',     sortOrder: 3 },
      { name: 'لنز رنگی',      slug: 'lenz-rangi',      sortOrder: 4 },
      { name: 'لنز طبی رنگی',  slug: 'lenz-tebi-rangi', sortOrder: 5 },
    ],
  },
  {
    name: 'لوازم جانبی',
    slug: 'lavazem-janebi',
    icon: '🧴',
    sortOrder: 4,
    children: [
      { name: 'جاعینکی و کیف', slug: 'jaeynak-kif',     sortOrder: 1 },
      { name: 'بند عینک',      slug: 'band-eynak',      sortOrder: 2 },
      { name: 'دستمال و اسپری',slug: 'dastmal-espray',  sortOrder: 3 },
      { name: 'پایه و نگهدارنده', slug: 'paye-negahdarande', sortOrder: 4 },
    ],
  },
  {
    name: 'لنز طبی',
    slug: 'lenz-tebi',
    icon: '🔬',
    sortOrder: 5,
    children: [
      { name: 'لنز نرم',      slug: 'lenz-narm',       sortOrder: 1 },
      { name: 'لنز سخت',      slug: 'lenz-sakt',       sortOrder: 2 },
      { name: 'لنز توریک',    slug: 'lenz-toric',      sortOrder: 3 },
      { name: 'لنز مولتی‌فوکال', slug: 'lenz-multifocal', sortOrder: 4 },
    ],
  },
]

async function seed() {
  const client = new MongoClient(MONGO_URI)
  await client.connect()
  console.log('✅ Connected to MongoDB')

  const db  = client.db()
  const col = db.collection('categories')

  // Clear existing categories
  const existing = await col.countDocuments()
  if (existing > 0) {
    await col.deleteMany({})
    console.log(`🗑️  Cleared ${existing} existing categories`)
  }

  const now = new Date()
  const docs = []

  for (const root of TREE) {
    const rootId = new ObjectId()
    docs.push({
      _id:       rootId,
      name:      root.name,
      slug:      root.slug,
      icon:      root.icon ?? '',
      parent:    null,
      ancestors: [],
      depth:     0,
      sortOrder: root.sortOrder,
      isActive:  true,
      createdAt: now,
      updatedAt: now,
    })

    for (const child of (root.children ?? [])) {
      const childId = new ObjectId()
      docs.push({
        _id:       childId,
        name:      child.name,
        slug:      child.slug,
        icon:      child.icon ?? '',
        parent:    rootId,
        ancestors: [rootId],
        depth:     1,
        sortOrder: child.sortOrder,
        isActive:  true,
        createdAt: now,
        updatedAt: now,
      })
    }
  }

  await col.insertMany(docs)

  const roots    = docs.filter(d => d.depth === 0).length
  const children = docs.filter(d => d.depth === 1).length
  console.log(`✅ Inserted ${docs.length} categories: ${roots} root, ${children} subcategories`)

  for (const root of docs.filter(d => d.depth === 0)) {
    const subs = docs.filter(d => d.parent?.toString() === root._id.toString())
    console.log(`  📁 ${root.name} (${subs.length} زیردسته)`)
    for (const s of subs) console.log(`     └─ ${s.name}`)
  }

  await client.close()
  console.log('\n🎉 Done!')
}

seed().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
