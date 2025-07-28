const caches = require('./caches');
const shorts = require('./shorts');
const tokens = require('./tokens');
const { db, initDb } = require('./database');

module.exports = {
  ...caches,
  ...shorts,
  ...tokens,
  db,
  initDb
};
