#!/usr/bin/env node
/* Génère le DÉCOR de bordure (arbres lush + rochers) style Clash Royale, vue 3/4 plongée,
   fond uni pour détourage -> assets/decorart_<key>.png, puis :
     .venv-rembg/bin/python gen_troops.py --decor
   KIE_API_KEY=xxxx node gen_decor.js [cle...]   (sans arg = toutes) */
const fs=require('fs'),path=require('path');
const KEY=process.env.KIE_API_KEY;
if(!KEY){console.error('❌ Définis KIE_API_KEY');process.exit(1);}
const ASSETS=path.join(__dirname,'assets');
const MODEL=process.env.MODEL||'nano-banana-pro';
const CREATE='https://api.kie.ai/api/v1/jobs/createTask';
const REC='https://api.kie.ai/api/v1/jobs/recordInfo?taskId=';

const STYLE="Official Clash Royale arena decoration by Supercell, stylized 3D-rendered, exact Supercell mobile-game look: "
 +"smooth glossy soft shading, warm sunlight from upper-left, chunky rounded proportions, bold clean readable silhouette, saturated colors. "
 +"Seen from a HIGH 3/4 top-down angle (camera looking down at ~55°), the SAME angle as Clash Royale arena trees and rocks. "
 +"The WHOLE object is fully visible, standing upright, with empty margin all around (do NOT crop, do NOT touch the edges). "
 +"PLAIN solid medium-grey studio background, perfectly even — NO grass, no floor, no scenery, no cast shadow on the ground, no second object. "
 +"No text, no logo, no UI. Subject: ";

const PROMPTS={
  tree1:"a single big lush ROUND tree with a thick rounded green canopy (like a giant broccoli/bush ball) and a short brown trunk, vibrant green leaves with a lighter green highlight on the sunlit top-left",
  tree2:"a CLUSTER of three rounded lush green trees of slightly different heights grouped together, thick rounded canopies, short brown trunks, vibrant green with lighter sunlit highlights",
  tree3:"a small rounded bushy green shrub/tree, compact rounded canopy, vibrant green with a lighter green highlight on top",
  tree4:"a tall rounded pine-ish lush tree with a fat rounded green canopy slightly taller than wide, short brown trunk, vibrant saturated green",
  rock1:"a cluster of smooth rounded grey boulders/stones stacked together, cool grey stone with soft highlights, cartoon stylized",
  rock2:"a single big smooth rounded grey boulder, cool grey stone with a soft sunlit highlight, cartoon stylized",
};

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function genOne(key){
  const out=path.join(ASSETS,'decorart_'+key+'.png');
  if(fs.existsSync(out)&&!process.env.FORCE){console.log(`\n• ${key} déjà fait (skip)`);return true;}
  const prompt=STYLE+PROMPTS[key];
  process.stdout.write(`\n🌳 ${key} [${MODEL}] … `);
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
  console.log('Génération de',keys.length,'élément(s) de décor ->',ASSETS);
  let ok=0;for(const k of keys){if(!PROMPTS[k]){console.log('clé inconnue:',k);continue;}if(await genOne(k))ok++;}
  console.log(`\nTerminé : ${ok}/${keys.length}. Détoure :  .venv-rembg/bin/python gen_troops.py --decor`);
})();
