// Capture l'écran VS / matchmaking.  node shot_match.js [out.png]
const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2] || '/tmp/match.png';
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 439, height: 954 }, deviceScaleFactor: 2 });
  page.on('console', m => { if (m.type() === 'error') console.log('PAGE ERR:', m.text()); });
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    document.getElementById('rivalName').textContent = 'BG_Sniper';
    const rt = document.getElementById('rivalTr'); if (rt) rt.textContent = '36';
    window.show = () => {};
    document.querySelectorAll('.scr').forEach(s => s.classList.add('hidden'));
    document.getElementById('match').classList.remove('hidden');
  });
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    document.querySelectorAll('.scr').forEach(s => s.classList.add('hidden'));
    document.getElementById('match').classList.remove('hidden');
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: out });
  await browser.close();
  console.log('saved', out);
})().catch(e => { console.error(e); process.exit(1); });
