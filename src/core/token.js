const jwt = require('jsonwebtoken');
const configEnv = require('../config');

function generateToken(options = {}) {
    return jwt.sign({}, configEnv.secretKey, options);
}

function verifyToken(token) { // isTokenVerified
    try {
        return jwt.verify(token, configEnv.secretKey);
    } catch (err) {
        throw new Error('Invalid or expired token');
    }
}

async function storeToken(token, db) {
    return true
}

async function findToken(token, db) { // isTokenSaved
    return true
}

module.exports = {
    generateToken,
    verifyToken,
    storeToken,
    findToken,
};