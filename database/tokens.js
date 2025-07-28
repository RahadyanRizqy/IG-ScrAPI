const { db } = require('./database');

function createToken({ username, token, issued_at, expired_at }) {
    const stmt = db.prepare(`
        INSERT INTO tokens (username, token, issued_at, expired_at)
        VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(username, token, issued_at, expired_at);
    return result.lastInsertRowid;
}

function readToken(token) {
    const stmt = db.prepare(`SELECT id, username FROM tokens WHERE token = ?`);
    return stmt.get(token);
}

module.exports = { 
    createToken,
    readToken
};