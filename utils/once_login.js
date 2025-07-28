const { chromium } = require('playwright');
const fs = require('fs');
const readline = require('readline');
const minimist = require('minimist');

const args = minimist(process.argv.slice(2));
const username = args.username;
const password = args.password;
const session_filename = args.session;

if (!username || !password || !session_filename) {
    console.error("❌ Harap masukkan --username, --password, --session sebagai argumen.");
    process.exit(1);
}

(async () => {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('https://www.instagram.com/accounts/login/', {
        waitUntil: 'networkidle'
    });

    await page.waitForSelector('input[name="username"]');
    await page.fill('input[name="username"]', username);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');

    console.log("🔐 Silakan login manual di browser (termasuk OTP jika ada)");
    console.log("📥 Setelah berhasil login dan masuk ke halaman utama, tekan ENTER di terminal...");

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question('⏳ Menunggu konfirmasi ENTER...\n', async () => {
        const storage = await context.storageState();
        fs.writeFileSync(session_filename, JSON.stringify(storage));
        console.log(`✅ Session berhasil disimpan ke ${session_filename}`);
        await browser.close();
        rl.close();
    });
})();
