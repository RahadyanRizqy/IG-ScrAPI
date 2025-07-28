const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { db } = require('../database');

function formatUnixTimestamp(ts) {
    const date = new Date(ts * 1000); // ubah ke milidetik
    const pad = n => n.toString().padStart(2, '0');
    
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` + `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

const secret = process.env.SECRET_KEY;
if (!secret) {
  console.error("❌ SECRET_KEY belum disetel di file .env");
  process.exit(1);
}

// Ambil argumen dari CLI
const args = process.argv.slice(2);
const params = {};

args.forEach(arg => {
  const [key, value] = arg.replace(/^--/, '').split('=');
  params[key] = value;
});

// Validasi wajib ada username
if (!params.username) {
  console.error("❌ Parameter --username wajib diisi. Contoh: --username=razor");
  process.exit(1);
}

// Buat payload
const payload = {
  username: params.username
};

// Generate token
let token;
let expiredAt = null;
let decoded;

if (params.expiry && params.expiry !== '0') {
  const seconds = parseInt(params.expiry);
  if (isNaN(seconds)) {
    console.error("❌ expiry harus berupa angka detik");
    process.exit(1);
  }

  token = jwt.sign(payload, secret, { expiresIn: seconds });

  // Set expired_at dalam format ISO
  decoded = jwt.verify(token, secret);
  // expiredAt = formatUnixTimestamp(decoded.iat);
  console.log(formatUnixTimestamp(decoded.iat))

  console.log(`✅ Token dengan expiry (${params.expiry} detik):\n`);
} else {
  token = jwt.sign(payload, secret);
  console.log(`✅ Token tanpa kadaluarsa (unlimited):\n`);
  decoded = jwt.verify(token, secret);
  console.log(formatUnixTimestamp(decoded.iat))
}

// Simpan ke database
const stmt = db.prepare(`
  INSERT INTO tokens (username, token, issued_at, expired_at)
  VALUES (?, ?, ?, ?)
`);

try {
  const issuedAt = formatUnixTimestamp(decoded.iat);
  const expiredAt = typeof decoded.exp === 'number'
    ? formatUnixTimestamp(decoded.exp)
    : null;

  stmt.run(params.username, token, issuedAt, expiredAt);

  console.log(token);
  console.log(`\n✅ Token disimpan ke database.`);
} catch (err) {
  console.error("❌ Gagal menyimpan ke database:", err.message);
  process.exit(1);
}
