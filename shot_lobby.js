const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2] || '/tmp/lobby.png';
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 460, height: 940 }, deviceScaleFactor: 2 });
  const errs=[];
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', e => errs.push('PAGEERR '+e.message));
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.evaluate(() => { try{ showLobby(); }catch(e){} });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: out });
  await browser.close();
  console.log('saved', out);
  if(errs.length) console.log('ERRORS:\n'+errs.slice(0,15).join('\n')); else console.log('no console errors');
})().catch(e => { console.error(e); process.exit(1); });
