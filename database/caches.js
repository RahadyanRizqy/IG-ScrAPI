const { db } = require('./database');

// database/caches.js

function createCache({ post_id, cached_data, token_id, created_at }) {
    const stmt = db.prepare(`
        INSERT INTO caches (post_id, cached_data, token_id, created_at)
        VALUES (?, ?, ?, ?)
    `);

    // 🔥 Pastikan cached_data berupa string
    const serializedData = typeof cached_data === "string"
        ? cached_data
        : JSON.stringify(cached_data);

    const info = stmt.run(post_id, serializedData, token_id, created_at);
    return info;
}


// Baca cache berdasarkan post_id
function readCache(post_id) {
    const stmt = db.prepare(`
        SELECT cached_data FROM caches WHERE post_id = ?
    `);
    return stmt.get(post_id); // Mengembalikan satu hasil, atau undefined
}

module.exports = {
    createCache,
    readCache,
};
