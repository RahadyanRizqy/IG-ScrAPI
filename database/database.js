const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const dbFile = 'database.sqlite';
const dbPath = path.join(__dirname, dbFile);

if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, '');
}

const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

function initDb() {
    // Buat semua tabel
    db.prepare(`
        CREATE TABLE IF NOT EXISTS tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            token TEXT NOT NULL,
            issued_at DATETIME,
            expired_at DATETIME
        )
    `).run();

    db.prepare(`
        CREATE TABLE IF NOT EXISTS caches (
            post_id TEXT PRIMARY KEY,
            cached_data TEXT NOT NULL,
            token_id INTEGER NOT NULL,
            created_at DATETIME,
            FOREIGN KEY (token_id) REFERENCES tokens(id) ON DELETE CASCADE
        )
    `).run();

    db.prepare(`
        CREATE TABLE IF NOT EXISTS shorts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            short TEXT NOT NULL,
            dest TEXT NOT NULL,
            cache_id TEXT NOT NULL,
            FOREIGN KEY (cache_id) REFERENCES caches(post_id) ON DELETE CASCADE
        )
    `).run();

    console.log('✅ Database initialized');
}

// Ekspor
module.exports = {
    db,
    initDb,
};
