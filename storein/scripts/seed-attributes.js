/**
 * Seed colors, frame shapes, and frame materials
 * Run from storein/ directory:  node scripts/seed-attributes.js
 */
const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/storein';

const colors = [
  { name: 'صورتی',       hex: '#FFC0CB', isActive: true, sortOrder: 0 },
  { name: 'زرد',         hex: '#FED049', isActive: true, sortOrder: 1 },
  { name: 'بنفش',        hex: '#800080', isActive: true, sortOrder: 2 },
  { name: 'آبی',         hex: '#2563EB', isActive: true, sortOrder: 3 },
  { name: 'عسلی',        hex: '#C4830A', isActive: true, sortOrder: 4 },
  { name: 'مشکی',        hex: '#000000', isActive: true, sortOrder: 5 },
  { name: 'طلایی',       hex: '#D4AF37', isActive: true, sortOrder: 6 },
  { name: 'خاکستری',     hex: '#6B7280', isActive: true, sortOrder: 7 },
  { name: 'سبز',         hex: '#16A34A', isActive: true, sortOrder: 8 },
  { name: 'نقره‌ای', hex: '#C0C0C0', isActive: true, sortOrder: 9 },
  { name: 'مسی',         hex: '#B87333', isActive: true, sortOrder: 10 },
  { name: 'آبی اقیانوسی', hex: '#0284C7', isActive: true, sortOrder: 11 },
];

const frameAttributes = [
  // Frame Shapes
  { type: 'frameShape', label: 'گرد',       value: 'round',       icon: '⭕', isActive: true, sortOrder: 0 },
  { type: 'frameShape', label: 'مربعی',     value: 'square',      icon: '🔲', isActive: true, sortOrder: 1 },
  { type: 'frameShape', label: 'بیضی',      value: 'oval',        icon: '🥚', isActive: true, sortOrder: 2 },
  { type: 'frameShape', label: 'مستطیلی',   value: 'rectangular', icon: '▬',  isActive: true, sortOrder: 3 },
  { type: 'frameShape', label: 'پایلوت',    value: 'aviator',     icon: '✈️', isActive: true, sortOrder: 4 },
  { type: 'frameShape', label: 'گربه‌ای', value: 'cat-eye',  icon: '😼', isActive: true, sortOrder: 5 },
  { type: 'frameShape', label: 'هشت‌ضلعی', value: 'octagonal', icon: '🔷', isActive: true, sortOrder: 6 },
  { type: 'frameShape', label: 'بی‌فریم', value: 'rimless',  icon: '💎', isActive: true, sortOrder: 7 },
  // Frame Materials
  { type: 'frameMaterial', label: 'استیل',    value: 'steel',    icon: '🔩', isActive: true, sortOrder: 0 },
  { type: 'frameMaterial', label: 'تیتانیوم', value: 'titanium', icon: '🪖', isActive: true, sortOrder: 1 },
  { type: 'frameMaterial', label: 'استات',    value: 'acetate',  icon: '🎭', isActive: true, sortOrder: 2 },
  { type: 'frameMaterial', label: 'TR90',      value: 'tr90',     icon: '🧬', isActive: true, sortOrder: 3 },
  { type: 'frameMaterial', label: 'کربن',      value: 'carbon',   icon: '🖤', isActive: true, sortOrder: 4 },
];

async function main() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db();

  const now = new Date();

  // ── Colors ──────────────────────────────────────────────────────────────────
  let colorsInserted = 0, colorsSkipped = 0;
  for (const c of colors) {
    const exists = await db.collection('colors').findOne({ name: c.name });
    if (exists) { colorsSkipped++; continue; }
    await db.collection('colors').insertOne({ ...c, createdAt: now, updatedAt: now });
    colorsInserted++;
  }
  console.log(`Colors:          inserted ${colorsInserted}, skipped ${colorsSkipped}`);

  // ── Frame Attributes ────────────────────────────────────────────────────────
  let faInserted = 0, faSkipped = 0;
  for (const fa of frameAttributes) {
    const exists = await db.collection('frameattributes').findOne({ type: fa.type, value: fa.value });
    if (exists) { faSkipped++; continue; }
    await db.collection('frameattributes').insertOne({ ...fa, createdAt: now, updatedAt: now });
    faInserted++;
  }
  console.log(`Frame shapes:    inserted ${frameAttributes.filter(f => f.type === 'frameShape').length - faSkipped} (approx)`);
  console.log(`Frame materials: inserted ${frameAttributes.filter(f => f.type === 'frameMaterial').length} (approx)`);
  console.log(`Frame attrs:     inserted ${faInserted}, skipped ${faSkipped}`);

  await client.close();
  console.log('\nDone!');
}

main().catch(err => { console.error(err); process.exit(1); });
