#!/usr/bin/env node
/* Génère l'art "corps entier" des troupes (pour le terrain de bataille) via kie.ai.
   Cadrage FULL BODY (debout, pieds visibles) + fond uni clair = détourage rembg propre.
   Les cartes portrait (card_*.png) restent intactes pour l'UI.
     KIE_API_KEY=xxxx node gen_troopart.js [cle1 cle2 ...]   (sans arg = toutes les troupes)
   -> assets/troopart_<cle>.png   puis :  .venv-rembg/bin/python gen_troops.py  */
const fs=require('fs'),path=require('path');
const KEY=process.env.KIE_API_KEY;
if(!KEY){console.error('❌ Définis KIE_API_KEY (ex: KIE_API_KEY=xxx node gen_troopart.js)');process.exit(1);}
const ASSETS=path.join(__dirname,'assets');
const MODEL=process.env.MODEL||'nano-banana-pro';
const CREATE='https://api.kie.ai/api/v1/jobs/createTask';
const REC='https://api.kie.ai/api/v1/jobs/recordInfo?taskId=';

// style "figurine de jeu" : corps entier, debout, pieds au sol, fond uni pour matting net
const STYLE="Official Clash Royale battle unit by Supercell, single stylized 3D-rendered character in the exact Supercell mobile-game style: "
 +"smooth glossy soft shading, warm studio lighting with a subtle rim light, chunky exaggerated proportions, big expressive head, short sturdy legs, bold clean readable silhouette. "
 +"FULL BODY shot: the ENTIRE character from head to toe is visible, feet included, standing in a confident dynamic hero pose, slight 3/4 low camera angle looking up, centered with a little margin all around (do NOT crop the feet or head). "
 +"PLAIN solid light grey studio background, perfectly even and uncluttered — NO scenery, no floor, no shadow, no confetti, no patterns. "
 +"Clean, highly readable, the character clearly isolated. No text, no logo, no card frame, no border, no UI. Subject: ";

// mêmes sujets que les cartes, mais uniquement les TROUPES (pas les sorts)
const PROMPTS={
  queenmanon:"a glamorous blonde queen wearing a hot-pink swimsuit and a small gold crown, confident sassy pose",
  ptc:"a small glowing blue CBD crystal pebble creature with a cheeky cartoon face and wisps of blue smoke, with little stubby legs",
  marcels:"a cheerful muscular man wearing a bright colorful tank top (marcel undershirt), street style, grinning",
  anais:"two brunette women with curly brown hair, chic fashion-industry outfits, holding measuring tape and fabric",
  givenchy:"a sharp elegant black male luxury salesman in a suit proudly presenting a pair of glossy designer high heels",
  lardons:"a cute anthropomorphic bacon-bit (lardon) creature with a little happy face, sizzling golden brown, with tiny legs",
  bierepeche:"a peach-beer mascot: a frosty golden beer mug character with little arms and legs, smiling",
  cecilie:"an elegant chic fashion designer woman holding fabric and golden scissors, sophisticated",
  feets:"a dynamic rock-climbing shoe creature with five cartoon toes, sporty and energetic, standing",
  kanye:"a bold black male rapper artist with sunglasses and a microphone, dramatic intense expression",
  robot:"a sleek powerful AI battle robot with a chrome metallic body and glowing eyes, heroic menacing stance, full body",
  juliette:"a tall menacing brunette woman, towering and fierce, intimidating villain expression",
  darknans:"a pale blonde-haired demon with dark shadowy aura and glowing eyes, sinister and powerful, full body",
  womanizer:"a playful pink gadget mascot character with a cheeky cartoon face, glossy, with little arms and legs",
  tempete:"a brown-haired teenage boy in an emotional dramatic love crisis, stormy mood with tears",
  braish:"a confident black female singer performing with a microphone, musical energy, full body",
  reubeu:"a tough young man in urban streetwear tracksuit and cap, confident street-fighter pose",
};

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function genOne(key){
  const out=path.join(ASSETS,'troopart_'+key+'.png');
  if(fs.existsSync(out)&&!process.env.FORCE){console.log(`\n• ${key} déjà fait (skip)`);return true;}
  const prompt=STYLE+PROMPTS[key];
  process.stdout.write(`\n🎨 ${key} [${MODEL}] … `);
  let r=await fetch(CREATE,{method:'POST',headers:{'Authorization':'Bearer '+KEY,'Content-Type':'application/json'},
    body:JSON.stringify({model:MODEL,input:{prompt,aspect_ratio:'3:4',output_format:'png',resolution:'2K'}})});
  let j=await r.json();
  const taskId=j&&j.data&&j.data.taskId;
  if(!taskId){console.log('échec create:',JSON.stringify(j).slice(0,220));return false;}
  process.stdout.write('task '+taskId+' ');
  for(let i=0;i<90;i++){await sleep(3000);
    const ir=await fetch(REC+taskId,{headers:{'Authorization':'Bearer '+KEY}});const ij=await ir.json();
    const d=ij.data||{};const st=(d.state||'').toString().toLowerCase();
    if(st==='success'||st==='done'){
      let rj=d.resultJson||d.resultInfoJson||'{}';if(typeof rj==='string'){try{rj=JSON.parse(rj);}catch(e){rj={};}}
      const urls=rj.resultUrls||rj.images||rj.imageUrls||[];
      if(!urls.length){console.log('terminé mais pas d\'URL:',JSON.stringify(ij).slice(0,220));return false;}
      const img=await fetch(urls[0]);const buf=Buffer.from(await img.arrayBuffer());
      fs.writeFileSync(out,buf);console.log('✅ '+Math.round(buf.length/1024)+'KB');return true;
    }
    if(st==='failed'||st==='fail'){console.log('❌ échec:',(d.failMsg||JSON.stringify(ij).slice(0,180)));return false;}
    process.stdout.write('.');
  }
  console.log('⏱️ timeout');return false;
}
(async()=>{
  let keys=process.argv.slice(2);
  if(!keys.length)keys=Object.keys(PROMPTS);
  console.log('Génération de',keys.length,'art(s) corps entier ->',ASSETS);
  let ok=0;for(const k of keys){if(!PROMPTS[k]){console.log('clé inconnue:',k);continue;}if(await genOne(k))ok++;}
  console.log(`\nTerminé : ${ok}/${keys.length}. Lance ensuite :  .venv-rembg/bin/python gen_troops.py`);
})();
