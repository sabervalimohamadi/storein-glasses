const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
const BSON = require('bson');

const MONGODB_URI = 'mongodb://localhost:27017';
const DB_NAME = 'storein';
const DUMP_DIR = path.join(__dirname, 'storein');

async function main() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  console.log('✅ Connected to MongoDB');

  const db = client.db(DB_NAME);

  const files = fs.readdirSync(DUMP_DIR).filter(f => f.endsWith('.bson'));

  for (const file of files) {
    const collectionName = file.replace('.bson', '');
    const filePath = path.join(DUMP_DIR, file);
    const buffer = fs.readFileSync(filePath);

    if (buffer.length === 0) {
      console.log(`⏭  Skipping ${collectionName} (empty)`);
      continue;
    }

    const docs = [];
    let offset = 0;
    while (offset < buffer.length) {
      const size = buffer.readInt32LE(offset);
      const docBuffer = buffer.slice(offset, offset + size);
      docs.push(BSON.deserialize(docBuffer));
      offset += size;
    }

    if (docs.length === 0) {
      console.log(`⏭  Skipping ${collectionName} (no docs)`);
      continue;
    }

    const col = db.collection(collectionName);
    await col.deleteMany({});
    await col.insertMany(docs);
    console.log(`✅ ${collectionName}: ${docs.length} documents imported`);
  }

  await client.close();
  console.log('\n🎉 Import complete!');
}

main().catch(err => { console.error('❌ Error:', err); process.exit(1); });
