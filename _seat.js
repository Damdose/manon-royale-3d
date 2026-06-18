const { chromium } = require('playwright');
(async () => {
  const out=process.argv[2], seat=parseFloat(process.argv[3]), hk=parseFloat(process.argv[4]||'4.5'), hp=parseFloat(process.argv[5]||'4.4');
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 600, height: 1300 }, deviceScaleFactor: 2 });
  await p.goto('http://localhost:4173/?play', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(4500);
  await p.evaluate(({seat,hk,hp}) => {
    intro=0; state='play'; try{renderer.shadowMap.enabled=false;}catch(e){} try{if(scene)scene.fog=null;}catch(e){}
    const ws=px=>px/480*11;
    const AB2=32*(480/18), FD2=11*AB2/480;
    const wz=y=>(y/AB2-0.5)*FD2;
    for(const t of towers){ if(!t.mesh) continue; const king=t.role==='king';
      const spr=t.mesh.children.find(c=>c.isSprite); if(!spr) continue;
      const asp=spr.scale.x/spr.scale.y; const Hs=ws(t.r)*(king?hk:hp); spr.scale.set(Hs*asp,Hs,1);
      t.vy=t.y+t.r*seat; t.mesh.position.z=wz(t.vy);
    }
  }, {seat,hk,hp});
  await p.waitForTimeout(400);
  await p.screenshot({ path: out });
  await b.close(); console.log('ok',out,{seat,hk,hp});
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
