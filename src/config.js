// src/config/config.js
const path = require('path');
const dotenv = require('dotenv');

// Pastikan .env dimuat dari root project meski config.js ada di subfolder
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const configEnv = {
    port: parseInt(process.env.SERVER_PORT, 10) || 3000,
    host: process.env.SERVER_HOST || '127.0.0.1',
    secretKey: process.env.SECRET_KEY || 'changeme',
    rateLimitPerMinute: parseInt(process.env.RATE_LIMIT_PER_MINUTE, 10) || 5,

    headlessValue: String(process.env.HEADLESS || '').toLowerCase() === 'true',
    socket: String(process.env.SOCKET || '').toLowerCase() === 'true',
    restApi: String(process.env.REST_API || '').toLowerCase() === 'true',
    logger: String(process.env.LOGGER || '').toLowerCase() === 'true',

    altLength: parseInt(process.env.ALT_LENGTH, 10) || 8, // fallback jika undefined
    apiLabel: process.env.API_LABEL || 'API Result',
    unixSockPath: process.env.UNIX_SOCKET || '/tmp/app.sock',

    sessionJson: process.env.SESSION_PATH || './session.json',
};

module.exports = configEnv;