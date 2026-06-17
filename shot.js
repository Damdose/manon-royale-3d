// Capture le combat en local pour vérifier le rendu 3D.  node shot.js [out.png]
const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2] || '/tmp/game.png';
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 560, height: 1000 }, deviceScaleFactor: 2 });
  page.on('console', m => { if (m.type() === 'error') console.log('PAGE ERR:', m.text()); });
  await page.goto('http://localhost:4173/?play', { waitUntil: 'networkidle' });
  // laisse charger textures + démarrer la bataille
  await page.waitForTimeout(2500);
  // place quelques troupes des deux côtés pour juger l'échelle perso/tour
  await page.evaluate(() => {
    intro = 0; state = 'play';
    try { renderer.shadowMap.enabled = false; } catch(e){}
    try { if (scene) scene.fog = null; } catch(e){}
    const put = (side, kind, x, y) => { if (CARDS[kind]) spawnTroop(side, CARDS[kind], x, y); };
    put('me','marcels', LANE[0], AB*0.62);
    put('me','queenmanon', LANE[1], AB*0.62);
    put('me','kanye', W*0.5, AB*0.7);
    put('foe','robot', LANE[0], AB*0.34);
    put('foe','juliette', LANE[1], AB*0.34);
  });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: out });
  await browser.close();
  console.log('saved', out);
})().catch(e => { console.error(e); process.exit(1); });
