#!/usr/bin/env node
/* Génère les assets d'UI (fonds d'écran + icônes) style Clash Royale via kie.ai (Nano Banana Pro).
   KIE_API_KEY=xxx node gen_assets.js [cle1 cle2 ...]   (sans arg = tout)  -> assets/ui_<cle>.png */
const fs=require('fs'),path=require('path');
const KEY=process.env.KIE_API_KEY;if(!KEY){console.error('❌ KIE_API_KEY manquante');process.exit(1);}
const ASSETS=path.join(__dirname,'assets');
const MODEL=process.env.MODEL||'nano-banana-pro';
const CREATE='https://api.kie.ai/api/v1/jobs/createTask';
const REC='https://api.kie.ai/api/v1/jobs/recordInfo?taskId=';

const BG="Clash Royale mobile game art by Supercell, vibrant stylized 3D cartoon world, soft warm lighting, rich saturated colors, polished and clean. NO text, no logo, no UI, no buttons, no interface. ";
const ICON="Clash Royale game icon by Supercell, single object, 3D stylized glossy render, chunky shape, bold clean readable silhouette, centered, ISOLATED on a plain flat pure white background, no scene, no text, no shadow on ground. Subject: ";

// type: 'bg' (fond plein 9:16) ou 'icon' (objet centré 1:1)
const ASSETS_LIST={
  bg_lobby:{type:'bg',prompt:BG+"Home screen background: a colorful fantasy battle arena seen from afar with a castle and a king tower, grassy field, blue sky with soft clouds, festive banners, vertical mobile wallpaper."},
  bg_shop:{type:'bg',prompt:BG+"Shop screen background: a cozy medieval marketplace with wooden stalls and shelves, warm interior, vertical mobile wallpaper."},
  bg_clan:{type:'bg',prompt:BG+"Clan screen background: the interior of a grand stone clan castle hall with banners and torches, vertical mobile wallpaper."},
  bg_victory:{type:'bg',prompt:BG+"Victory screen background: triumphant golden sky with confetti and light rays over an arena, celebratory, vertical mobile wallpaper."},
  chest_wood:{type:'icon',prompt:"a wooden reward treasure chest with iron bands, closed, glossy stylized."},
  chest_gold:{type:'icon',prompt:"a shiny golden reward treasure chest with jewels, closed, glossy stylized."},
  chest_magic:{type:'icon',prompt:"a magical purple-and-blue reward chest glowing with sparkles, closed, glossy stylized."},
  coin:{type:'icon',prompt:"a single shiny gold coin with a crown engraved, glossy."},
  gem:{type:'icon',prompt:"a single brilliant green gem crystal, glossy, faceted."},
  trophy:{type:'icon',prompt:"a golden victory trophy cup, glossy."},
  elixir:{type:'icon',prompt:"a droplet of glowing magenta-purple elixir liquid, glossy."},
  // ---- intro / avatar ----
  splash:{type:'bg',prompt:BG+"Epic loading-screen hero artwork: a glamorous blonde queen in a pink outfit with a gold crown, a bold black rapper artist with sunglasses, and a chrome battle robot, heroic dynamic poses, dramatic sky and light rays, vertical mobile key art."},
  avatar:{type:'icon',prompt:"a funny cute stylized pig character face wearing a tiny gold crown, profile avatar portrait, glossy."},
  crown:{type:'icon',prompt:"a golden royal crown with blue gems, glossy."},
  level:{type:'icon',prompt:"a stack of glossy game cards with a gold crown badge, icon."},
  // ---- tas d'or (boutique) ----
  gold1:{type:'icon',prompt:"a small drawstring pouch overflowing with shiny gold coins, glossy."},
  gold2:{type:'icon',prompt:"a wooden bucket overflowing with shiny gold coins, glossy."},
  gold3:{type:'icon',prompt:"a wooden wagon cart full of a huge pile of shiny gold coins, glossy."},
  // ---- tas de gemmes (boutique) ----
  gem1:{type:'icon',prompt:"a small handful pile of bright green gems, glossy."},
  gem2:{type:'icon',prompt:"a drawstring pouch overflowing with bright green gems, glossy."},
  gem3:{type:'icon',prompt:"a wooden bucket overflowing with bright green gems, glossy."},
  // ---- barre du bas (onglets) : icônes nettes, style CR ----
  tab_shop:{type:'icon',prompt:"a mobile game tab icon: an open treasure chest with coins and gems, bold simple glossy 3D, blue rounded base."},
  tab_cards:{type:'icon',prompt:"a mobile game tab icon: a fanned stack of colorful battle cards, bold simple glossy 3D."},
  tab_battle:{type:'icon',prompt:"a mobile game tab icon: two crossed battle swords, bold simple glossy 3D, golden."},
  tab_clan:{type:'icon',prompt:"a mobile game tab icon: a heraldic clan shield with crossed swords, bold simple glossy 3D, blue and gold."},
  tab_events:{type:'icon',prompt:"a mobile game tab icon: a silver sword over a banner, bold simple glossy 3D."},
  arena:{type:'icon',prompt:"a floating 3D Clash Royale style arena board diorama seen from a high angle, two grassy lanes with a central blue river and two wooden bridges, small stone towers, decorative rocks and trees around the edge, sitting on a dark rounded base like a game widget, glossy stylized."},
  gear:{type:'icon',prompt:"a mobile game settings gear cog icon, metallic, bold simple glossy 3D."},
};

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function genOne(key){
  const a=ASSETS_LIST[key];const out=path.join(ASSETS,'ui_'+key+'.png');
  if(fs.existsSync(out)&&!process.env.FORCE){console.log(`\n• ${key} déjà fait (skip)`);return true;}
  const prompt=(a.type==='bg'?a.prompt:ICON+a.prompt);
  const aspect=a.type==='bg'?'9:16':'1:1';
  process.stdout.write(`\n🎨 ${key} [${a.type}] … `);
  let r=await fetch(CREATE,{method:'POST',headers:{'Authorization':'Bearer '+KEY,'Content-Type':'application/json'},
    body:JSON.stringify({model:MODEL,input:{prompt,aspect_ratio:aspect,output_format:'png',resolution:'2K'}})});
  let j=await r.json();const taskId=j&&j.data&&j.data.taskId;
  if(!taskId){console.log('échec create:',JSON.stringify(j).slice(0,200));return false;}
  for(let i=0;i<90;i++){await sleep(3000);
    const ir=await fetch(REC+taskId,{headers:{'Authorization':'Bearer '+KEY}});const ij=await ir.json();
    const d=ij.data||{};const st=(d.state||'').toString().toLowerCase();
    if(st==='success'||st==='done'){let rj=d.resultJson||'{}';if(typeof rj==='string'){try{rj=JSON.parse(rj);}catch(e){rj={};}}
      const urls=rj.resultUrls||rj.images||[];if(!urls.length){console.log('done sans url:',JSON.stringify(ij).slice(0,200));return false;}
      const img=await fetch(urls[0]);fs.writeFileSync(out,Buffer.from(await img.arrayBuffer()));console.log('✅');return true;}
    if(st==='failed'||st==='fail'){console.log('❌',d.failMsg||'');return false;}
    process.stdout.write('.');
  }
  console.log('timeout');return false;
}
(async()=>{let keys=process.argv.slice(2);if(!keys.length)keys=Object.keys(ASSETS_LIST);
  let ok=0;for(const k of keys){if(!ASSETS_LIST[k]){console.log('inconnu:',k);continue;}if(await genOne(k))ok++;}
  console.log(`\nTerminé : ${ok}/${keys.length}`);})();
