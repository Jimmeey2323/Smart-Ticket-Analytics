// Mock storage removed: app must use the real database.
// This stub remains only to fail fast if something still imports it.
export const mockStorage = (() => {
  throw new Error('mockStorage has been removed. Configure the database and use DatabaseStorage.');
})() as never;