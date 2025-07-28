const { chromium } = require('playwright');

let browser;

async function initBrowser(configEnv) {
    if (!browser) {
        browser = await chromium.launch({
            headless: configEnv.headlessValue,
            args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
            '--disable-dev-shm-usage',
            '--disable-extensions',
            '--disable-infobars',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
            '--start-maximized',
            ],
            ignoreDefaultArgs: ['--enable-automation'],
        });
    }
    return browser;
}

module.exports = initBrowser;