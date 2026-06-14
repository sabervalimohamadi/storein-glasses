import mongoose from 'mongoose';

export default async function globalTeardown(): Promise<void> {
  const dbName = (global as any).__TEST_DB_NAME__;
  if (dbName) {
    const conn = await mongoose.connect(`mongodb://localhost:27017/${dbName}`);
    await conn.connection.dropDatabase();
    await mongoose.disconnect();
  }
}
