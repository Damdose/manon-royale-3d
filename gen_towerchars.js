#!/usr/bin/env node
/* Génère les PERSONNAGES posés sur les tours, dans le MÊME style que les cartes
   (corps entier, fond gris uni -> détourage rembg). Le fort reste en 3D.
     KIE_API_KEY=xxxx node gen_towerchars.js [cle...]   (sans arg = les 4)
   -> assets/towerchar_<role>_<side>.png  puis :
      .venv-rembg/bin/python gen_troops.py --towerchars */
const fs=require('fs'),path=require('path');
const KEY=process.env.KIE_API_KEY;
if(!KEY){console.error('❌ Définis KIE_API_KEY');process.exit(1);}
const ASSETS=path.join(__dirname,'assets');
const MODEL=process.env.MODEL||'nano-banana-pro';
const CREATE='https://api.kie.ai/api/v1/jobs/createTask';
const REC='https://api.kie.ai/api/v1/jobs/recordInfo?taskId=';

// même direction artistique que les cartes (cf. gen_troopart.js)
const STYLE="Official Clash Royale character by Supercell, single stylized 3D-rendered character in the exact Supercell mobile-game style: "
 +"smooth glossy soft shading, warm studio lighting with a subtle rim light, chunky exaggerated proportions, big expressive head, short sturdy legs, bold clean readable silhouette. "
 +"FULL BODY shot: the ENTIRE character from head to toe is visible, feet included, standing in a confident regal hero pose, slight 3/4 low camera angle, centered with margin all around (do NOT crop feet or head). "
 +"PLAIN solid light grey studio background, perfectly even and uncluttered — NO scenery, no floor, no shadow. "
 +"No text, no logo, no card frame, no border, no UI. Subject: ";

const PROMPTS={
  king_blue:"a beautiful BLONDE QUEEN with long golden hair and a golden crown, wearing an elegant royal blue gown with gold trim, holding a scepter, graceful and confident",
  king_red:"a mighty KING with brown hair and a thick brown beard, wearing a golden crown and a regal red royal robe with gold trim, holding a scepter, powerful and stern",
  princess_blue:"a BLONDE female ARCHER with long golden hair, wearing a light blue and silver tunic, drawing a wooden bow with an arrow, focused and agile",
  princess_red:"a brown-haired male ARCHER with a red and bronze tunic, drawing a wooden bow with an arrow, focused and fierce",
};

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function genOne(key){
  const out=path.join(ASSETS,'towerchar_'+key+'.png');
  if(fs.existsSync(out)&&!process.env.FORCE){console.log(`\n• ${key} déjà fait (skip)`);return true;}
  const prompt=STYLE+PROMPTS[key];
  process.stdout.write(`\n👑 ${key} [${MODEL}] … `);
  let r=await fetch(CREATE,{method:'POST',headers:{'Authorization':'Bearer '+KEY,'Content-Type':'application/json'},
    body:JSON.stringify({model:MODEL,input:{prompt,aspect_ratio:'3:4',output_format:'png',resolution:'2K'}})});
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
  console.log('Génération de',keys.length,'perso(s) de tour ->',ASSETS);
  let ok=0;for(const k of keys){if(!PROMPTS[k]){console.log('clé inconnue:',k);continue;}if(await genOne(k))ok++;}
  console.log(`\nTerminé : ${ok}/${keys.length}. Détoure :  .venv-rembg/bin/python gen_troops.py --towerchars`);
})();
