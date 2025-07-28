const { db } = require('./database');

// Buat short URL baru
function createShort({ short, dest, cache_id }) {
    const stmt = db.prepare(`
        INSERT INTO shorts (short, dest, cache_id)
        VALUES (?, ?, ?)
    `);
    const info = stmt.run(short, dest, cache_id);
    return info.lastInsertRowid;
}

// Ambil data short berdasarkan short string
function readShortByDest(dest) {
    const stmt = db.prepare(`
        SELECT short FROM shorts WHERE short = ?
    `);
    return stmt.get(dest); // Dapatkan satu baris berdasarkan short
}

function readDestByShort(short) {
    const stmt = db.prepare(`
        SELECT dest FROM shorts WHERE short = ?
    `);
    const shorted = stmt.get(short);
    return shorted.dest; // Dapatkan satu baris berdasarkan short
}

function readShortByCacheId(cache_id) {
    const stmt = db.prepare(`
        SELECT short, dest FROM shorts WHERE cache_id = ?
    `);
    return stmt.all(cache_id); // Dapatkan satu baris berdasarkan short
}

module.exports = {
    createShort,
    readDestByShort,
    readShortByDest,
    readShortByCacheId
};
