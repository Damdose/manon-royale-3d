// Capture iPhone 13 (390x844, DPR3) pour vérifier le responsive. node shot_ip13.js
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  });
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error') console.log('PAGE ERR:', m.text()); });

  // 1) Lobby
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1800);
  const diag = await page.evaluate(() => window.__diag || null);
  console.log('DIAG lobby:', JSON.stringify(diag));
  await page.screenshot({ path: '/tmp/ip13_lobby.png' });

  // 2) Combat
  await page.goto('http://localhost:4173/?play', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  await page.evaluate(() => {
    intro = 0; state = 'play';
    try { renderer.shadowMap.enabled = false; } catch(e){}
    const put = (side, kind, x, y) => { if (CARDS[kind]) spawnTroop(side, CARDS[kind], x, y); };
    try {
      put('me','marcels', LANE[0], AB*0.62);
      put('me','queenmanon', LANE[1], AB*0.62);
      put('foe','robot', LANE[0], AB*0.34);
    } catch(e){ console.log('spawn err', e.message); }
  });
  await page.waitForTimeout(1200);
  const diag2 = await page.evaluate(() => window.__diag || null);
  console.log('DIAG play:', JSON.stringify(diag2));
  await page.screenshot({ path: '/tmp/ip13_play.png' });

  await browser.close();
  console.log('saved /tmp/ip13_lobby.png /tmp/ip13_play.png');
})().catch(e => { console.error(e); process.exit(1); });
