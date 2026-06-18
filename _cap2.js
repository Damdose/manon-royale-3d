const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2] || '/tmp/cap.png';
  const hk = parseFloat(process.argv[3] || '5.5');   // Hs mul king
  const hp = parseFloat(process.argv[4] || '5.2');   // Hs mul princess
  const vy = parseFloat(process.argv[5] || '0.0');   // base offset along +y (toward player) in tile-r units
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 560, height: 1000 }, deviceScaleFactor: 2 });
  await page.goto('http://localhost:4173/?play', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);
  await page.evaluate(({hk,hp,vy}) => {
    intro = 0; state = 'play';
    try { renderer.shadowMap.enabled = false; } catch(e){}
    try { if (scene) scene.fog = null; } catch(e){}
    const ws = px => px/480*11;
    for (const t of towers) {
      if (!t.mesh) continue;
      const king = t.role==='king';
      const spr = t.mesh.children.find(c=>c.isSprite);
      if (!spr) continue;
      const asp = spr.scale.x/spr.scale.y;
      const Hs = ws(t.r)*(king?hk:hp);
      spr.scale.set(Hs*asp, Hs, 1);
      // reposition tower group base with optional forward offset onto pad
      t.mesh.position.z = (function wz(y){return (y/(32*(480/18))-0.5)*(11*(32*(480/18))/480);})(t.y + t.r*vy);
    }
  }, {hk,hp,vy});
  await page.waitForTimeout(400);
  await page.screenshot({ path: out });
  await browser.close();
  console.log('saved', out, {hk,hp,vy});
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
