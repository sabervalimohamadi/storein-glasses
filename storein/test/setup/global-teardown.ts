export default async function globalTeardown(): Promise<void> {
  const mongod = (global as any).__MONGOD__;
  if (mongod) {
    await mongod.stop();
  }
}
