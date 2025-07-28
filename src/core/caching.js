async function storeCache(db, key, data) {
  const now = Math.floor(Date.now() / 1000);
  const jsonData = JSON.stringify(data);
  await db.run(
    'REPLACE INTO request_cache (key, data, created_at) VALUES (?, ?, ?)',
    [key, jsonData, now]
  );
}

async function getCache(db, key, ttlSeconds = 300) {
  const now = Math.floor(Date.now() / 1000);
  const row = await db.get(
    'SELECT data, created_at FROM request_cache WHERE key = ?',
    [key]
  );

  if (!row) return null;

  if (now - row.created_at > ttlSeconds) {
    // expired, delete
    await db.run('DELETE FROM request_cache WHERE key = ?', [key]);
    return null;
  }

  return JSON.parse(row.data);
}
