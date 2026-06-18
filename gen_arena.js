#!/usr/bin/env node
/* Génère l'ARÈNE complète (sol top-down) style Clash Royale -> assets/arena.png (chargée auto comme sol).
   Ratio 9:16 (terrain ~0.56). Lanes à ~19% et 81% de la largeur, rivière au milieu (50%), 2 ponts.
     KIE_API_KEY=xxxx node gen_arena.js */
const fs=require('fs'),path=require('path');
const KEY=process.env.KIE_API_KEY;if(!KEY){console.error('❌ KIE_API_KEY manquante');process.exit(1);}
const ASSETS=path.join(__dirname,'assets');
const MODEL=process.env.MODEL||'nano-banana-pro';
const CREATE='https://api.kie.ai/api/v1/jobs/createTask';
const REC='https://api.kie.ai/api/v1/jobs/recordInfo?taskId=';

const PROMPT=
"Top-down view (straight from directly above, 90°) of a Clash Royale arena battlefield floor, exact Supercell mobile-game art style, "
+"bright saturated colors, soft clean shading. VERTICAL board. "
+"A bright green grass field with a SUBTLE two-tone checkerboard pattern (alternating slightly lighter/darker green squares). "
+"TWO vertical sandy/dirt LANES (paths), the left lane centered at about 19% of the width, the right lane at about 81% of the width, running top to bottom. "
+"A horizontal BLUE-TEAL RIVER crossing the middle (at 50% height), with TWO wooden plank BRIDGES, one over each lane. "
+"Small flat dirt platforms where the towers will stand, on each lane near top and bottom and at the top/bottom center. "
+"Symmetric top and bottom halves. Clean, readable, no characters, no towers, no troops, no UI, no text, no numbers, no health bars, no logo. "
+"Fill the whole frame edge to edge with the field.";

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  const out=path.join(ASSETS,'arena.png');
  process.stdout.write(`🌍 arena [${MODEL}] … `);
  let r=await fetch(CREATE,{method:'POST',headers:{'Authorization':'Bearer '+KEY,'Content-Type':'application/json'},
    body:JSON.stringify({model:MODEL,input:{prompt:PROMPT,aspect_ratio:'9:16',output_format:'png',resolution:'2K'}})});
  let j=await r.json();const taskId=j&&j.data&&j.data.taskId;
  if(!taskId){console.log('échec create:',JSON.stringify(j).slice(0,240));process.exit(1);}
  process.stdout.write('task '+taskId+' ');
  for(let i=0;i<120;i++){await sleep(3000);
    const ir=await fetch(REC+taskId,{headers:{'Authorization':'Bearer '+KEY}});const ij=await ir.json();
    const d=ij.data||{};const st=(d.state||'').toString().toLowerCase();
    if(st==='success'||st==='done'){
      let rj=d.resultJson||d.resultInfoJson||'{}';if(typeof rj==='string'){try{rj=JSON.parse(rj);}catch(e){rj={};}}
      const urls=rj.resultUrls||rj.images||rj.imageUrls||[];
      if(!urls.length){console.log('done sans url:',JSON.stringify(ij).slice(0,240));process.exit(1);}
      const img=await fetch(urls[0]);fs.writeFileSync(out,Buffer.from(await img.arrayBuffer()));
      console.log('✅ arena.png');return;
    }
    if(st==='failed'||st==='fail'){console.log('❌',(d.failMsg||JSON.stringify(ij).slice(0,200)));process.exit(1);}
    process.stdout.write('.');
  }
  console.log('⏱️ timeout');process.exit(1);
})();
