const fs = require('fs');
const path = require('path');

const obfuscatedCode = fs.readFileSync(path.join(__dirname, 'scrape.ob.js'), 'utf-8');

async function scrapePage(page) {
    return await page.evaluate(new Function(obfuscatedCode));
}

module.exports = {
    scrapePage
};
