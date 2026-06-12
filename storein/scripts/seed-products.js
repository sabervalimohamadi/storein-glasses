/**
 * seed-products.js
 * Run from storein/: node scripts/seed-products.js
 *
 * 1. Converts JPG photos from docs/photo → uploads/products (WebP)
 * 2. Inserts 10 product documents into MongoDB
 */
const { MongoClient, ObjectId } = require('mongodb')
const sharp  = require('sharp')
const fs     = require('fs')
const path   = require('path')
const crypto = require('crypto')

const MONGO_URI   = 'mongodb://localhost:27017/storein'
const PHOTOS_DIR  = path.resolve(__dirname, '../../docs/photo')
const UPLOADS_DIR = path.resolve(__dirname, '../uploads/products')
const BASE_URL    = 'http://localhost:3000'

// ── Photo groups (50 images, 5 per product) ───────────────────────────────────
const PHOTO_GROUPS = [
  ['IMG_1538.jpg','IMG_1539.jpg','IMG_15391.jpg','IMG_1542.jpg','IMG_1545.jpg'],
  ['IMG_1546.jpg','IMG_3760.jpg','IMG_3760 (1).jpg','IMG_3761.jpg','IMG_3789.jpg'],
  ['IMG_4483.jpg','IMG_5660.jpg','IMG_5680.jpg','IMG_5684.jpg','IMG_5699.jpg'],
  ['IMG_5713.jpg','IMG_5726.jpg','IMG_5733.jpg','IMG_5733 (1).jpg','IMG_5736.jpg'],
  ['IMG_700140.jpg','IMG_700142.jpg','IMG_7117.jpg','IMG_7120.jpg','IMG_7139.jpg'],
  ['IMG_7140.jpg','IMG_714002.jpg','IMG_7142.jpg','IMG_7148.jpg','IMG_7151.jpg'],
  ['IMG_7152.jpg','IMG_7247.jpg','IMG_8345.jpg','IMG_900794.jpg','IMG_97368.jpg'],
  ['IMG_9768.jpg','IMG_9768 (1).jpg','IMG_9768 (2).jpg','IMG_9775-1.jpg','IMG_9783334.jpg'],
  ['IMG_97834.jpg','IMG_9784.jpg','IMG_9785.jpg','IMG_9793.jpg','IMG_9793 (1).jpg'],
  ['IMG_9794.jpg','IMG_9798.jpg','IMG_9800.jpg','IMG_9800142.jpg','IMG_9801.jpg'],
]

// ── Convert one JPG → WebP, save to uploads/products ─────────────────────────
async function convertAndSave(filename) {
  const src = path.join(PHOTOS_DIR, filename)
  const id  = crypto.randomUUID()

  const buf = await sharp(src)
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer()

  const dest = path.join(UPLOADS_DIR, `${id}.webp`)
  fs.writeFileSync(dest, buf)

  const thumbBuf = await sharp(src)
    .resize(300, 300, { fit: 'cover' })
    .webp({ quality: 75 })
    .toBuffer()

  fs.writeFileSync(path.join(UPLOADS_DIR, `${id}_thumb.webp`), thumbBuf)

  return `${BASE_URL}/uploads/products/${id}.webp`
}

// ── Variant builder helpers ───────────────────────────────────────────────────
function makeVariant(attrs, price, comparePrice, stock, sku) {
  return {
    _id:          new ObjectId(),
    sku,
    price,
    comparePrice: comparePrice ?? null,
    stock,
    attributes:   attrs,
    isActive:     true,
  }
}

// ── Product definitions (category slug → filled in at runtime) ────────────────
const PRODUCT_DEFS = [
  {
    name:  'عینک آفتابی مردانه ری‌بن کلاسیک',
    slug:  'rayban-classic-mardane',
    catSlug: 'eynak-aftabi-mardane',
    shortDescription: 'عینک آفتابی کلاسیک مردانه با فریم استیل و لنز پلاریزه',
    description: 'عینک آفتابی ری‌بن مدل کلاسیک با فریم استیل سبک‌وزن، لنز پلاریزه UV400 و دسته‌های تنظیم‌پذیر. مناسب برای استفاده روزانه و رانندگی.',
    tags: ['ری‌بن', 'پلاریزه', 'UV400', 'مردانه', 'کلاسیک'],
    specs: [
      { key: 'جنس فریم', value: 'استیل' },
      { key: 'نوع لنز',  value: 'پلاریزه' },
      { key: 'محافظت',   value: 'UV400' },
      { key: 'وزن',      value: '28', unit: 'گرم' },
    ],
    variants: [
      makeVariant([{ key: 'رنگ', value: 'مشکی' }],  2_850_000, 3_200_000, 12, 'RB-M-BLK'),
      makeVariant([{ key: 'رنگ', value: 'قهوه‌ای' }], 2_850_000, 3_200_000,  8, 'RB-M-BRN'),
      makeVariant([{ key: 'رنگ', value: 'طلایی' }],  3_100_000, 3_500_000,  5, 'RB-M-GLD'),
    ],
    weight: 28,
    sortOrder: 1,
  },
  {
    name:  'عینک آفتابی زنانه اوکلی اسپرت',
    slug:  'oakley-sport-zanane',
    catSlug: 'eynak-aftabi-zanane',
    shortDescription: 'عینک آفتابی زنانه با طراحی مدرن و لنز رنگارنگ',
    description: 'عینک آفتابی اوکلی مخصوص بانوان با فریم کائوچوی سبک، لنز رنگارنگ پلاریزه و طراحی کت مدرن. مناسب برای مدروز و بیرون‌رفتن.',
    tags: ['اوکلی', 'زنانه', 'اسپرت', 'رنگی', 'کت'],
    specs: [
      { key: 'جنس فریم', value: 'کائوچو' },
      { key: 'نوع لنز',  value: 'پلاریزه رنگی' },
      { key: 'سبک',      value: 'کت (Cat Eye)' },
      { key: 'وزن',      value: '22', unit: 'گرم' },
    ],
    variants: [
      makeVariant([{ key: 'رنگ', value: 'صورتی' }],  1_950_000, 2_300_000, 15, 'OAK-Z-PNK'),
      makeVariant([{ key: 'رنگ', value: 'بنفش' }],   1_950_000, 2_300_000,  9, 'OAK-Z-PRP'),
      makeVariant([{ key: 'رنگ', value: 'آبی' }],    2_100_000, 2_400_000,  7, 'OAK-Z-BLU'),
    ],
    weight: 22,
    sortOrder: 2,
  },
  {
    name:  'عینک آفتابی ورزشی دوچرخه‌سواری',
    slug:  'sport-cycling-eynak',
    catSlug: 'eynak-aftabi-varzeshi',
    shortDescription: 'عینک ورزشی مخصوص دوچرخه‌سواری با لنز تبادل‌پذیر',
    description: 'عینک آفتابی ورزشی با طراحی آیرودینامیک، لنز‌های قابل تعویض (روز/شب/صورتی)، فریم TR90 ضدضربه و بند ضدلغزش. ایده‌آل برای دوچرخه‌سواری و پیاده‌روی.',
    tags: ['ورزشی', 'دوچرخه', 'ضدضربه', 'لنز تبادلی', 'TR90'],
    specs: [
      { key: 'جنس فریم', value: 'TR90' },
      { key: 'لنز',      value: 'سه لنز قابل تعویض' },
      { key: 'استاندارد', value: 'CE EN ISO 12312-1' },
      { key: 'وزن',      value: '32', unit: 'گرم' },
    ],
    variants: [
      makeVariant([{ key: 'رنگ فریم', value: 'مشکی/قرمز' }],  1_750_000, 2_100_000, 20, 'SPT-BK-RD'),
      makeVariant([{ key: 'رنگ فریم', value: 'سفید/آبی' }],   1_750_000, 2_100_000, 14, 'SPT-WH-BL'),
    ],
    weight: 32,
    sortOrder: 3,
  },
  {
    name:  'عینک آفتابی لاکچری تام‌فورد مدل فورد',
    slug:  'tomford-ford-luxury',
    catSlug: 'eynak-aftabi-luxury',
    shortDescription: 'عینک آفتابی لاکچری با طراحی ایتالیایی',
    description: 'عینک آفتابی تام فورد مدل TF5 ساخت ایتالیا با فریم استات اسیتات دست‌ساز، لنز گرادیان و جلد اصلی چرم. برای افرادی که کیفیت را در اولویت قرار می‌دهند.',
    tags: ['تام‌فورد', 'لاکچری', 'ایتالیا', 'استات', 'گرادیان'],
    specs: [
      { key: 'جنس فریم', value: 'استات اسیتات ایتالیایی' },
      { key: 'لنز',      value: 'گرادیان' },
      { key: 'ساخت',     value: 'ایتالیا' },
      { key: 'وزن',      value: '35', unit: 'گرم' },
    ],
    variants: [
      makeVariant([{ key: 'رنگ', value: 'تراتواز' }], 8_500_000, 10_000_000, 4, 'TF-TRQ'),
      makeVariant([{ key: 'رنگ', value: 'قهوه‌ای شاه‌بلوطی' }], 8_500_000, 10_000_000, 3, 'TF-CHE'),
    ],
    weight: 35,
    sortOrder: 4,
  },
  {
    name:  'عینک طبی مردانه فریم تیتانیومی',
    slug:  'eynak-tebi-titanium-mardane',
    catSlug: 'eynak-tebi-mardane',
    shortDescription: 'عینک طبی مردانه با فریم تیتانیومی سبک و مقاوم',
    description: 'فریم عینک طبی مردانه ساخته‌شده از تیتانیوم خالص با وزن بسیار کم (۱۵ گرم)، مقاوم در برابر خوردگی و آلرژی‌زا نبودن. مناسب برای استفاده طولانی‌مدت.',
    tags: ['طبی', 'تیتانیوم', 'مردانه', 'سبک‌وزن', 'فریم'],
    specs: [
      { key: 'جنس فریم', value: 'تیتانیوم ۱۰۰٪' },
      { key: 'وزن',      value: '15', unit: 'گرم' },
      { key: 'ابعاد لنز', value: '54-18-145' },
      { key: 'مناسب',    value: 'صورت متوسط و بزرگ' },
    ],
    variants: [
      makeVariant([{ key: 'سایز', value: 'M (54mm)' }, { key: 'رنگ', value: 'نقره‌ای' }], 3_200_000, 3_800_000, 10, 'TTN-M-SLV'),
      makeVariant([{ key: 'سایز', value: 'M (54mm)' }, { key: 'رنگ', value: 'مشکی مات' }], 3_200_000, 3_800_000,  8, 'TTN-M-BLK'),
      makeVariant([{ key: 'سایز', value: 'L (56mm)' }, { key: 'رنگ', value: 'نقره‌ای' }], 3_400_000, 4_000_000,  6, 'TTN-L-SLV'),
    ],
    weight: 15,
    sortOrder: 5,
  },
  {
    name:  'عینک طبی زنانه فریم گربه‌ای',
    slug:  'eynak-tebi-cateyeye-zanane',
    catSlug: 'eynak-tebi-zanane',
    shortDescription: 'فریم طبی زنانه با طرح گربه‌ای جذاب',
    description: 'فریم عینک طبی زنانه با طرح کت‌ای محبوب، جنس استات اسیتات با رنگ‌بندی متنوع. مناسب برای انواع نمره چشم و طراحی چهره زنانه.',
    tags: ['طبی', 'زنانه', 'کت', 'گربه‌ای', 'استات'],
    specs: [
      { key: 'جنس فریم', value: 'استات اسیتات' },
      { key: 'سبک',      value: 'Cat Eye' },
      { key: 'ابعاد',    value: '52-17-140' },
    ],
    variants: [
      makeVariant([{ key: 'رنگ', value: 'لاجوردی' }], 1_850_000, 2_200_000, 12, 'CAT-Z-LAJ'),
      makeVariant([{ key: 'رنگ', value: 'ترکمه' }],   1_850_000, 2_200_000,  9, 'CAT-Z-TRK'),
      makeVariant([{ key: 'رنگ', value: 'کرم‌شیری' }], 1_650_000, 2_000_000, 11, 'CAT-Z-CRM'),
    ],
    weight: 25,
    sortOrder: 6,
  },
  {
    name:  'فریم طبی گرد مدل جان لنون',
    slug:  'framee-gerd-john-lennon',
    catSlug: 'eynak-tebi-gerd',
    shortDescription: 'فریم گرد کلاسیک الهام‌گرفته از سبک جان لنون',
    description: 'فریم طبی گرد با قطر ۴۸ میلی‌متر از جنس استیل پوشش‌دار. طراحی رترو و کلاسیک مناسب برای صورت‌های قلبی و بیضی. سبک جاودان جان لنون.',
    tags: ['گرد', 'کلاسیک', 'رترو', 'جان لنون', 'استیل'],
    specs: [
      { key: 'جنس فریم',  value: 'استیل پوشش‌دار' },
      { key: 'سبک',       value: 'گرد (Round)' },
      { key: 'قطر لنز',   value: '48', unit: 'میلی‌متر' },
      { key: 'مناسب صورت', value: 'قلبی و بیضی' },
    ],
    variants: [
      makeVariant([{ key: 'رنگ', value: 'طلایی' }],    1_450_000, 1_700_000, 18, 'GRD-GLD'),
      makeVariant([{ key: 'رنگ', value: 'مسی' }],      1_450_000, 1_700_000, 14, 'GRD-COP'),
      makeVariant([{ key: 'رنگ', value: 'نقره‌ای' }],  1_350_000, 1_600_000, 20, 'GRD-SLV'),
    ],
    weight: 20,
    sortOrder: 7,
  },
  {
    name:  'لنز رنگی سالانه گری‌زون',
    slug:  'lenz-rangi-grayzone-salane',
    catSlug: 'lenz-rangi',
    shortDescription: 'لنز رنگی سالانه با رنگ‌بندی طبیعی و جذاب',
    description: 'لنز رنگی سالانه گری‌زون با تکنولوژی لایه‌گذاری رنگ، مناسب برای چشم‌های تیره. رنگ‌های طبیعی آبی، سبز، عسلی و خاکستری. محتوای آب ۳۸٪ و اکسیژن‌رسانی بالا.',
    tags: ['لنز رنگی', 'سالانه', 'طبیعی', 'آبی', 'عسلی'],
    specs: [
      { key: 'نوع',        value: 'رنگی سالانه' },
      { key: 'محتوای آب',  value: '38', unit: '٪' },
      { key: 'قطر',        value: '14.2', unit: 'میلی‌متر' },
      { key: 'بازه نمره',  value: '0.00 تا -6.00' },
    ],
    variants: [
      makeVariant([{ key: 'رنگ', value: 'آبی' },    { key: 'بسته', value: '۲ عدد' }],   680_000,  820_000, 30, 'LRG-BLU-2'),
      makeVariant([{ key: 'رنگ', value: 'عسلی' },   { key: 'بسته', value: '۲ عدد' }],   680_000,  820_000, 25, 'LRG-HZL-2'),
      makeVariant([{ key: 'رنگ', value: 'سبز' },    { key: 'بسته', value: '۲ عدد' }],   680_000,  820_000, 20, 'LRG-GRN-2'),
      makeVariant([{ key: 'رنگ', value: 'خاکستری' },{ key: 'بسته', value: '۲ عدد' }],   680_000,  820_000, 22, 'LRG-GRY-2'),
    ],
    weight: 10,
    sortOrder: 8,
  },
  {
    name:  'لنز طبی رنگی ماهانه فرش‌لوک',
    slug:  'lenz-tebi-rangi-freshlook-mahane',
    catSlug: 'lenz-tebi-rangi',
    shortDescription: 'لنز طبی رنگی ماهانه با نمره برای اصلاح بینایی',
    description: 'لنز فرش‌لوک طبی رنگی ماهانه با قابلیت اصلاح بینایی تا -8 دیوپتر. رنگ‌های متنوع با ماندگاری بالا. مناسب برای استفاده روزانه تا ۱۶ ساعت.',
    tags: ['لنز طبی رنگی', 'ماهانه', 'فرش‌لوک', 'نمره‌دار'],
    specs: [
      { key: 'نوع',           value: 'طبی رنگی ماهانه' },
      { key: 'بازه نمره',     value: '0.00 تا -8.00' },
      { key: 'محتوای آب',     value: '55', unit: '٪' },
      { key: 'حداکثر پوشش',  value: '16', unit: 'ساعت' },
    ],
    variants: [
      makeVariant([{ key: 'رنگ', value: 'آبی اقیانوسی' }, { key: 'نمره', value: '0.00' }],  420_000,  500_000, 40, 'FL-BLU-000'),
      makeVariant([{ key: 'رنگ', value: 'آبی اقیانوسی' }, { key: 'نمره', value: '-1.00' }], 420_000,  500_000, 35, 'FL-BLU-100'),
      makeVariant([{ key: 'رنگ', value: 'آبی اقیانوسی' }, { key: 'نمره', value: '-2.00' }], 420_000,  500_000, 30, 'FL-BLU-200'),
      makeVariant([{ key: 'رنگ', value: 'عسلی' },         { key: 'نمره', value: '0.00' }],  420_000,  500_000, 38, 'FL-HZL-000'),
      makeVariant([{ key: 'رنگ', value: 'عسلی' },         { key: 'نمره', value: '-1.00' }], 420_000,  500_000, 32, 'FL-HZL-100'),
    ],
    weight: 5,
    sortOrder: 9,
  },
  {
    name:  'فریم طبی مستطیلی مردانه مدل اسکوئر',
    slug:  'eynak-tebi-mostatil-square-mardane',
    catSlug: 'eynak-tebi-mostatil',
    shortDescription: 'فریم طبی مستطیلی مردانه با طراحی مدرن',
    description: 'فریم طبی مستطیلی مردانه مدل اسکوئر از جنس استات ایتالیایی با طراحی مدرن و خطوط صاف. مناسب برای صورت‌های گرد و بیضی. همراه با جلد و دستمال اصلی.',
    tags: ['طبی', 'مستطیلی', 'مردانه', 'اسکوئر', 'مدرن'],
    specs: [
      { key: 'جنس فریم',  value: 'استات ایتالیایی' },
      { key: 'سبک',       value: 'مستطیلی (Rectangle)' },
      { key: 'ابعاد',     value: '55-17-145' },
      { key: 'مناسب صورت', value: 'گرد و بیضی' },
    ],
    variants: [
      makeVariant([{ key: 'رنگ', value: 'مشکی مات' }],      2_100_000, 2_500_000, 15, 'SQR-BLK'),
      makeVariant([{ key: 'رنگ', value: 'آبی‌تیره' }],      2_100_000, 2_500_000, 10, 'SQR-NVY'),
      makeVariant([{ key: 'رنگ', value: 'شکلاتی' }],        2_200_000, 2_600_000,  8, 'SQR-CHO'),
    ],
    weight: 26,
    sortOrder: 10,
  },
]

// ── Main ──────────────────────────────────────────────────────────────────────
async function seed() {
  // Ensure uploads dir exists
  fs.mkdirSync(UPLOADS_DIR, { recursive: true })

  const client = new MongoClient(MONGO_URI)
  await client.connect()
  console.log('✅ Connected to MongoDB')

  const db       = client.db()
  const catCol   = db.collection('categories')
  const prodCol  = db.collection('products')

  // Load category slug → _id map
  const cats = await catCol.find({}, { projection: { slug: 1 } }).toArray()
  const catMap = {}
  for (const c of cats) catMap[c.slug] = c._id

  console.log(`📂 Found ${cats.length} categories`)

  // Check for missing categories
  const missing = PRODUCT_DEFS.filter(p => !catMap[p.catSlug]).map(p => p.catSlug)
  if (missing.length) {
    console.warn('⚠️  Missing categories (will skip those products):', missing)
  }

  // Remove existing seeded products (by slug)
  const slugs = PRODUCT_DEFS.map(p => p.slug)
  const deleted = await prodCol.deleteMany({ slug: { $in: slugs } })
  if (deleted.deletedCount) console.log(`🗑️  Removed ${deleted.deletedCount} existing seed products`)

  // Process each product
  const now  = new Date()
  const docs = []

  for (let i = 0; i < PRODUCT_DEFS.length; i++) {
    const def = PRODUCT_DEFS[i]
    const catId = catMap[def.catSlug]
    if (!catId) { console.warn(`⚠️  Skipping "${def.name}" — category "${def.catSlug}" not found`); continue }

    process.stdout.write(`📸 Processing product ${i + 1}/10: ${def.name} ... `)

    // Convert images for this product
    const imageUrls = []
    for (const filename of PHOTO_GROUPS[i]) {
      const src = path.join(PHOTOS_DIR, filename)
      if (!fs.existsSync(src)) {
        console.warn(`\n   ⚠️  Photo not found: ${filename}, skipping`)
        continue
      }
      try {
        const url = await convertAndSave(filename)
        imageUrls.push(url)
      } catch (err) {
        console.warn(`\n   ⚠️  Failed to convert ${filename}: ${err.message}`)
      }
    }

    const thumbnail = imageUrls[0]?.replace('.webp', '_thumb.webp') ?? null

    // Compute min/max price + total stock from variants
    const prices = def.variants.map(v => v.price)
    const minPrice   = Math.min(...prices)
    const maxPrice   = Math.max(...prices)
    const totalStock = def.variants.reduce((s, v) => s + v.stock, 0)

    docs.push({
      _id:              new ObjectId(),
      name:             def.name,
      slug:             def.slug,
      category:         catId,
      shortDescription: def.shortDescription,
      description:      def.description,
      images:           imageUrls,
      thumbnail,
      specs:            def.specs,
      variants:         def.variants,
      minPrice,
      maxPrice,
      totalStock,
      tags:             def.tags,
      weight:           def.weight,
      status:           'active',
      viewCount:        Math.floor(Math.random() * 300),
      soldCount:        Math.floor(Math.random() * 80),
      avgRating:        +(3.5 + Math.random() * 1.5).toFixed(1),
      reviewCount:      Math.floor(Math.random() * 30),
      createdAt:        now,
      updatedAt:        now,
    })

    console.log(`✅ ${imageUrls.length} images`)
  }

  if (docs.length === 0) {
    console.error('❌ No products to insert')
    await client.close()
    return
  }

  await prodCol.insertMany(docs)
  console.log(`\n🎉 Inserted ${docs.length} products:`)
  for (const d of docs) {
    console.log(`  📦 ${d.name}  [${d.images.length} imgs | min: ${d.minPrice.toLocaleString()} تومان | stock: ${d.totalStock}]`)
  }

  await client.close()
  console.log('\n✅ Done!')
}

seed().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
