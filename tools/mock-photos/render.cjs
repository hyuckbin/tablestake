const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
(async () => {
  const [src, out, ...only] = process.argv.slice(2);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  for (const file of fs.readdirSync(src).filter((f) => f.endsWith('.svg'))) {
    const key = file.replace('.svg', '');
    if (only.length && !only.includes(key)) continue;
    const content = fs.readFileSync(path.join(src, file), 'utf8');
    await page.setContent(`<html><body style="margin:0;background:#000">${content}</body></html>`);
    await page.screenshot({ path: path.join(out, key + '.jpg'), type: 'jpeg', quality: 84, clip: { x: 0, y: 0, width: 800, height: 600 } });
    console.log('jpg', key);
  }
  await browser.close();
})();
