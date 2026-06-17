const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport:{width:560,height:1000}, deviceScaleFactor:2, serviceWorkers:'block' });
  const p = await ctx.newPage();
  // neutralize the auto-advance so brand stays put for the capture
  await p.addInitScript(()=>{ const _st=window.setTimeout;
    window.setTimeout=(fn,t)=>{ if(t&&t>=2000&&t<3000) return 0; return _st(fn,t); }; });
  await p.goto('http://localhost:4174/', { waitUntil:'load' });
  await p.waitForTimeout(1500);
  const v=await p.evaluate(()=>{const b=document.getElementById('brand');return b&&!b.classList.contains('hidden');});
  await p.screenshot({ path:'/tmp/brand.png' });
  await b.close(); console.log('brand visible:', v);
})().catch(e=>{console.error(e);process.exit(1);});
