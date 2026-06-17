#!/usr/bin/env node
/* Génère les TOURS COMPLÈTES en image (pierre + perso intégré), style Clash Royale,
   vue 3/4 plongée comme dans le jeu. Fond gris uni -> détourage rembg.
     KIE_API_KEY=xxxx node gen_towerbuild.js [cle...]   (sans arg = les 4)
   -> assets/towerbuild_<role>_<side>.png  puis :
      .venv-rembg/bin/python gen_troops.py --towerfull */
const fs=require('fs'),path=require('path');
const KEY=process.env.KIE_API_KEY;
if(!KEY){console.error('❌ Définis KIE_API_KEY');process.exit(1);}
const ASSETS=path.join(__dirname,'assets');
const MODEL=process.env.MODEL||'nano-banana-pro';
const CREATE='https://api.kie.ai/api/v1/jobs/createTask';
const REC='https://api.kie.ai/api/v1/jobs/recordInfo?taskId=';

const STYLE="Official Clash Royale arena tower by Supercell, stylized 3D-rendered, exact Supercell mobile-game look: "
 +"smooth glossy soft shading, warm lighting, chunky proportions, bold clean readable silhouette. "
 +"A square STONE castle tower with crenellated battlements (merlons) and small pointed corner turret roofs, "
 +"seen from a HIGH 3/4 top-down angle (camera looking down at ~55°) exactly like a tower in the Clash Royale arena. "
 +"The WHOLE tower is visible with a little margin all around (do NOT crop). "
 +"PLAIN solid light grey studio background, perfectly even — NO grass, no floor, no scenery, no shadow on ground. "
 +"No text, no logo, no UI, no health bar. Subject: ";

const PROMPTS={
  king_blue:"a large imposing KING tower with a beautiful BLONDE QUEEN in a royal blue gown and gold crown standing in the battlement; BLUE banners and blue pointed turret roofs; a golden crown emblem on the front wall",
  king_red:"a large imposing KING tower with a mighty brown-bearded KING in a red royal robe and gold crown standing in the battlement; RED banners and red pointed turret roofs; a golden crown emblem on the front wall",
  princess_blue:"a smaller PRINCESS archer tower with a BLONDE female archer drawing a bow, standing in the battlement; BLUE accents and blue pointed turret roofs; a wooden ladder on the front",
  princess_red:"a smaller PRINCESS archer tower with a brown-haired archer drawing a bow, standing in the battlement; RED accents and red pointed turret roofs; a wooden ladder on the front",
};

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function genOne(key){
  const out=path.join(ASSETS,'towerbuild_'+key+'.png');
  if(fs.existsSync(out)&&!process.env.FORCE){console.log(`\n• ${key} déjà fait (skip)`);return true;}
  const prompt=STYLE+PROMPTS[key];
  process.stdout.write(`\n🏯 ${key} [${MODEL}] … `);
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
  console.log('Génération de',keys.length,'tour(s) complète(s) ->',ASSETS);
  let ok=0;for(const k of keys){if(!PROMPTS[k]){console.log('clé inconnue:',k);continue;}if(await genOne(k))ok++;}
  console.log(`\nTerminé : ${ok}/${keys.length}. Détoure :  .venv-rembg/bin/python gen_troops.py --towerfull`);
})();
