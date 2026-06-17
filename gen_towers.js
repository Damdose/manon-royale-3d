#!/usr/bin/env node
/* Génère l'art des TOURS (roi + princesse, bleu + rouge) via kie.ai, style Clash Royale.
   Fond gris uni -> détourage rembg propre (cf. gen_troops.py).
     KIE_API_KEY=xxxx node gen_towers.js [cle...]   (sans arg = les 4 tours)
   -> assets/towerart_<role>_<side>.png   puis détourage -> assets/tower_<role>_<side>.png */
const fs=require('fs'),path=require('path');
const KEY=process.env.KIE_API_KEY;
if(!KEY){console.error('❌ Définis KIE_API_KEY');process.exit(1);}
const ASSETS=path.join(__dirname,'assets');
const MODEL=process.env.MODEL||'nano-banana-pro';
const CREATE='https://api.kie.ai/api/v1/jobs/createTask';
const REC='https://api.kie.ai/api/v1/jobs/recordInfo?taskId=';

const STYLE="Official Clash Royale arena tower by Supercell, stylized 3D-rendered defensive stone tower in the exact Supercell mobile-game style: "
 +"smooth glossy soft shading, warm studio lighting, chunky exaggerated proportions, bold clean readable silhouette, seen from a slight 3/4 top-down angle like in the game. "
 +"The WHOLE tower is visible (base to top), centered with a little margin all around. "
 +"PLAIN solid light grey studio background, perfectly even and uncluttered — NO scenery, no floor, no shadow, no grass, no characters. "
 +"No text, no logo, no UI, no health bar. Subject: ";

const C={blue:"team BLUE colors (blue banners, blue roof, blue accents)",
         red:"team RED colors (red banners, red roof, red accents)"};
const ROLE={
  king:"a large imposing square stone KING tower fortress with crenellated battlements, a big central cannon and a small royal flag on top, sturdy and powerful",
  princess:"a smaller round stone PRINCESS archer tower with crenellated battlements, a pointed roof and a crossbow/cannon slit, elegant",
};

const PROMPTS={};
for(const r of ['king','princess'])for(const s of ['blue','red'])
  PROMPTS[r+'_'+s]=ROLE[r]+", "+C[s];

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function genOne(key){
  const out=path.join(ASSETS,'towerart_'+key+'.png');
  if(fs.existsSync(out)&&!process.env.FORCE){console.log(`\n• ${key} déjà fait (skip)`);return true;}
  const prompt=STYLE+PROMPTS[key];
  process.stdout.write(`\n🏰 ${key} [${MODEL}] … `);
  let r=await fetch(CREATE,{method:'POST',headers:{'Authorization':'Bearer '+KEY,'Content-Type':'application/json'},
    body:JSON.stringify({model:MODEL,input:{prompt,aspect_ratio:'1:1',output_format:'png',resolution:'2K'}})});
  let j=await r.json();const taskId=j&&j.data&&j.data.taskId;
  if(!taskId){console.log('échec create:',JSON.stringify(j).slice(0,220));return false;}
  process.stdout.write('task '+taskId+' ');
  for(let i=0;i<90;i++){await sleep(3000);
    const ir=await fetch(REC+taskId,{headers:{'Authorization':'Bearer '+KEY}});const ij=await ir.json();
    const d=ij.data||{};const st=(d.state||'').toString().toLowerCase();
    if(st==='success'||st==='done'){
      let rj=d.resultJson||d.resultInfoJson||'{}';if(typeof rj==='string'){try{rj=JSON.parse(rj);}catch(e){rj={};}}
      const urls=rj.resultUrls||rj.images||rj.imageUrls||[];
      if(!urls.length){console.log('terminé sans URL');return false;}
      const img=await fetch(urls[0]);const buf=Buffer.from(await img.arrayBuffer());
      fs.writeFileSync(out,buf);console.log('✅ '+Math.round(buf.length/1024)+'KB');return true;
    }
    if(st==='failed'||st==='fail'){console.log('❌',(d.failMsg||''));return false;}
    process.stdout.write('.');
  }
  console.log('⏱️ timeout');return false;
}
(async()=>{
  let keys=process.argv.slice(2);if(!keys.length)keys=Object.keys(PROMPTS);
  console.log('Génération de',keys.length,'tour(s) ->',ASSETS);
  let ok=0;for(const k of keys){if(!PROMPTS[k]){console.log('clé inconnue:',k);continue;}if(await genOne(k))ok++;}
  console.log(`\nTerminé : ${ok}/${keys.length}. Détoure ensuite :  .venv-rembg/bin/python gen_troops.py --towers`);
})();
