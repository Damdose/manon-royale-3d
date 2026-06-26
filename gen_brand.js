#!/usr/bin/env node
/* Génère le logo studio "DAMTAMZ GAMES" dans le style EXACT du logo Supercell,
   en passant l'image Supercell de référence (image_input base64) à kie.ai.
   KIE_API_KEY=xxx node gen_brand.js [chemin_ref.png]   -> assets/_raw_brandlogo.png  */
const fs=require('fs'),path=require('path');
const KEY=process.env.KIE_API_KEY;if(!KEY){console.error('❌ KIE_API_KEY manquante');process.exit(1);}
const REF=process.argv[2]||path.join(process.env.HOME,'Downloads','800px-Logo_Supercell.png');
const OUT=path.join(__dirname,'assets','_raw_brandlogo'+(process.env.VAR||'')+'.png');
const MODEL=process.env.MODEL||'nano-banana-pro';
const CREATE='https://api.kie.ai/api/v1/jobs/createTask';
const REC='https://api.kie.ai/api/v1/jobs/recordInfo?taskId=';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

const UPLOAD='https://kieai.redpandaai.co/api/file-base64-upload';
async function uploadRef(){
  const b64='data:image/png;base64,'+fs.readFileSync(REF).toString('base64');
  const r=await fetch(UPLOAD,{method:'POST',headers:{'Authorization':'Bearer '+KEY,'Content-Type':'application/json'},
    body:JSON.stringify({base64Data:b64,uploadPath:'images/user-uploads',fileName:'supercell_ref.png'})});
  const j=await r.json();const u=(j.data&&(j.data.downloadUrl||j.data.url))||j.downloadUrl;
  if(!u){console.log('échec upload:',JSON.stringify(j).slice(0,300));process.exit(1);}
  return u;
}
const prompt="A game studio logo in the EXACT same style as the reference image: heavy BOLD white uppercase letters in a chunky geometric slab-serif block font, the letters stretched and justified edge-to-edge to fill a tidy block, on a PURE SOLID BLACK #000000 background. Keep the identical typography, weight, blocky slab-serif shapes, white color and black background as the reference — but change the text to spell 'DAMTAMZ' on the top and 'GAMES' on the line below, both stretched to the same width so they form a clean justified rectangular block, perfectly centered. NO other words, NO 'SUPERCELL', NO icons, NO tagline, just the two-line white wordmark on black.";

(async()=>{
  process.stdout.write('⬆️  upload réf … ');const refUrl=await uploadRef();console.log('ok');
  const input={prompt,aspect_ratio:'16:9',output_format:'png',resolution:'2K',image_input:[refUrl]};
  process.stdout.write('🎨 brandlogo … ');
  let r=await fetch(CREATE,{method:'POST',headers:{'Authorization':'Bearer '+KEY,'Content-Type':'application/json'},body:JSON.stringify({model:MODEL,input})});
  let j=await r.json();const taskId=j&&j.data&&j.data.taskId;
  if(!taskId){console.log('échec create:',JSON.stringify(j).slice(0,300));process.exit(1);}
  for(let i=0;i<90;i++){await sleep(3000);
    const ir=await fetch(REC+taskId,{headers:{'Authorization':'Bearer '+KEY}});const ij=await ir.json();
    const d=ij.data||{};const st=(d.state||'').toString().toLowerCase();
    if(st==='success'||st==='done'){let rj=d.resultJson||'{}';if(typeof rj==='string'){try{rj=JSON.parse(rj);}catch(e){rj={};}}
      const url=(rj.resultUrls||rj.resultUrl||[])[0]||(rj.images&&rj.images[0]);
      if(!url){console.log('pas d\'URL:',JSON.stringify(rj).slice(0,300));process.exit(1);}
      const ab=await(await fetch(url)).arrayBuffer();fs.writeFileSync(OUT,Buffer.from(ab));
      console.log('✅ ->',OUT);process.exit(0);}
    if(st==='fail'||st==='failed'){console.log('échec:',JSON.stringify(d).slice(0,300));process.exit(1);}
    process.stdout.write('.');}
  console.log('timeout');process.exit(1);
})();
