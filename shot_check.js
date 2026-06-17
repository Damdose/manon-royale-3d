// Vérifie menu + combat à une taille iPhone "Safari" (zone visible entre les barres).
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  // iPhone 14/15 : 393 CSS de large ; ~664 de haut visible quand les barres Safari sont affichées.
  const page = await browser.newPage({ viewport: { width: 393, height: 664 }, deviceScaleFactor: 2 });
  page.on('console', m => { if (m.type() === 'error') console.log('PAGE ERR:', m.text()); });

  // 1) MENU (lobby)
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.evaluate(() => { try { showScreen('lobby'); } catch(e){} try { go && go('lobby'); } catch(e){} });
  await page.waitForTimeout(800);
  // mesures : la tabbar est-elle visible dans la hauteur ? le canvas remplit-il la largeur ?
  const lob = await page.evaluate(() => {
    const tab = document.querySelector('.tabbar');
    const r = tab ? tab.getBoundingClientRect() : null;
    return { innerH: window.innerHeight, innerW: window.innerWidth,
             appH: getComputedStyle(document.documentElement).getPropertyValue('--app-h').trim(),
             tabBottom: r ? Math.round(r.bottom) : null, tabVisible: r ? (r.bottom <= window.innerHeight+1) : null };
  });
  console.log('LOBBY', JSON.stringify(lob));
  await page.screenshot({ path: '/tmp/check_menu.png' });

  // 2) COMBAT
  await page.goto('http://localhost:4173/?play', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  await page.evaluate(() => {
    intro = 0; state = 'play';
    try { renderer.shadowMap.enabled = false; } catch(e){}
    try { if (scene) scene.fog = null; } catch(e){}
  });
  await page.waitForTimeout(800);
  const bat = await page.evaluate(() => {
    const gl = document.getElementById('gl');
    return { canvasW: Math.round(parseFloat(gl.style.width)), canvasLeft: Math.round(parseFloat(gl.style.left)),
             canvasH: Math.round(parseFloat(gl.style.height)), canvasTop: Math.round(parseFloat(gl.style.top)),
             innerW: window.innerWidth, innerH: window.innerHeight };
  });
  console.log('BATTLE', JSON.stringify(bat));
  await page.screenshot({ path: '/tmp/check_battle.png' });

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
