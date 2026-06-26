#!/usr/bin/env node
/* Génère les images de cartes via l'API kie.ai (GPT-4o Image), style Clash Royale.
   Clé via variable d'env (jamais en dur) :  KIE_API_KEY=xxxx node gen_cards.js [cle1 cle2 ...]
   Sans argument -> génère TOUTES les cartes. Les images sont enregistrées dans assets/card_<cle>.png */
const fs=require('fs'),path=require('path');
const KEY=process.env.KIE_API_KEY;
if(!KEY){console.error('❌ Définis KIE_API_KEY (ex: KIE_API_KEY=xxx node gen_cards.js)');process.exit(1);}
const ASSETS=path.join(__dirname,'assets');
// API "market" unifiée -> on peut choisir le modèle (nano-banana-pro, flux, etc.) via MODEL=...
const MODEL=process.env.MODEL||'nano-banana-pro';
const CREATE='https://api.kie.ai/api/v1/jobs/createTask';
const REC='https://api.kie.ai/api/v1/jobs/recordInfo?taskId=';

// On CONDITIONNE chaque nouvelle carte sur de vraies cartes du jeu (image_input) pour un style 3D IDENTIQUE.
const REFBASE='https://damdose.github.io/manon-royale-3d/assets/';
const STYLE_REFS=[REFBASE+'card_kanye.png',REFBASE+'card_queenmanon.png',REFBASE+'card_givenchy.png'];
// style commun = "carte Clash Royale" — fond SIMPLE et flou, perso bien lisible
const STYLE="Match EXACTLY the art style of the reference card images: the same official Clash Royale character card artwork by Supercell, the same smooth glossy 3D-rendered look, same soft shading, same warm studio lighting with a subtle rim light, same chunky exaggerated proportions, same big expressive head, same bold clean readable silhouette, same painterly finish. "
 +"A single stylized 3D-rendered character. "
 +"TIGHT portrait framing: the character fills most of the frame (close-up bust / upper body), centered, facing the viewer. "
 +"VERY SIMPLE background: one soft muted color, heavily blurred, strong depth of field, smooth and uncluttered — NO scenery, no confetti, no patterns, no busy details. "
 +"Clean, highly readable, the character clearly pops out. No text, no logo, no card frame, no border, no UI. Subject: ";

const PROMPTS={
  // ---- Camp Manon ----
  queenmanon:"a glamorous slim slender blonde queen with a chic shoulder-length blonde bob haircut (carré) and a small gold crown, wearing a hot-pink swimsuit, confident sassy pose",
  ptc:"a small glowing blue CBD crystal pebble creature with a cheeky cartoon face and wisps of blue smoke",
  marcels:"a cheerful group of five cartoon sleeveless ribbed tank-top vest undershirts (French 'marcel' débardeur garments) standing on their own, each a clearly recognizable ribbed tank top with two shoulder straps and arm holes, given a cute little face, tiny arms and legs, bright vivid different colors, a lively squad of living shirts, NO human person, NO body inside",
  anais:"two brunette women with curly brown hair, chic fashion-industry outfits, holding measuring tape and fabric",
  givenchy:"a sharp elegant black male luxury salesman in a suit, FURIOUS and angry, scowling and shouting with an irritated aggressive expression, forcefully shoving a pair of glossy designer high heels at the viewer",
  lardons:"cute anthropomorphic bacon-bit (lardon) creatures with little happy faces, sizzling, golden brown",
  bierepeche:"a peach-beer mascot trio: a frosty golden beer mug flanked by two smiling peach characters",
  cecilie:"an elegant chic fashion designer woman holding fabric and golden scissors, sophisticated",
  feets:"a single tight skin-tight rubber climbing shoe shaped like a foot with five distinct cartoon toes, stretchy moulante sport climbing shoe, sporty and dynamic",
  kanye:"a bold black male rapper artist with sunglasses and a microphone, dramatic intense expression",
  eoghan:"a young rowdy Irishman in his early twenties partying in a pub, medium-length wavy chestnut-brown hair with only a faint auburn tint, youthful sturdy build (not skinny, not fat), cheerful boyish face, green shirt, raising a foamy pint of beer with a crazy euphoric grin",
  cannon:"a giant comical pair of frilly white vintage granny bloomers underpants (a huge culotte) with little red Alsatian ribbon bows, oversized and puffy, floating, funny harmless object",
  pompe:"a sweet little old grandma with a neat bright blue bob haircut (carré) and round glasses, gripping the steering wheel of a tiny cute car, peeking just over the dashboard, driving with a determined funny expression",
  sorciere:"a powerful witch casting dark magic, swirling dark purple energy glowing in her hands, elegant and spooky",
  lecturemain:"a giant mystical glowing hand with a magical eye in the center of the palm, fortune-teller aura",
  heartbreak:"a glowing magical pink heart cracked in two, sparkling heartbreak spell energy",
  // ---- Adversaire Robot DamtamZ ----
  robot:"a sleek powerful AI battle robot with a chrome metallic body and glowing eyes, heroic menacing stance",
  juliette:"a tall menacing brunette woman, towering and fierce, intimidating villain expression",
  darknans:"a pale blonde-haired demon with dark shadowy aura and glowing eyes, sinister and powerful",
  tornade:"a swirling icy snow tornado, whirling white whirlwind of snowflakes, dynamic",
  champagne:"champagne bottles exploding and spraying golden foam everywhere, festive burst",
  womanizer:"a sleek glossy pale blue-green mint-teal handheld personal massager wand gadget with a small rounded silicone nozzle tip, smooth modern ergonomic wellness device, cute and discreet, a single object, NO person, NO character, NO face, NO arms or legs",
  ketamine:"a dramatic explosion of white powder, billowing white cloud burst, dynamic",
  chiffretwo:"a single hand held up showing exactly two fingers in a V shape, making the number-two sign, clean and simple, a few light sparkles",
  tempete:"a young French-Arab man crying his eyes out, sobbing very heavily with thick streams of tears pouring down his cheeks, devastated heartbroken expression, wearing a plain black t-shirt, short dark hair slightly on the longer side",
  braish:"a confident light-skinned mixed-race (métisse) female singer with light caramel skin performing on stage with a microphone, musical energy",
  colis:"an avalanche of falling cardboard delivery parcels and boxes, dynamic tumble",
  addition:"an avalanche of falling money bills and golden coins, cash raining down",
  reubeu:"a squad of six well-dressed young Arab men in stylish urban streetwear (designer tracksuits, caps, sneakers, gold chains), a confident cool crew posing together",
  heartbreak2:"a glowing magical pink heart cracked in two, sparkling heartbreak spell energy",
  inferno:"a stern 19th-century philosopher Friedrich Nietzsche with a huge bushy walrus mustache and intense brooding dark eyes, unleashing a swirling void of dark nihilist energy from his hands, dramatic and ominous",
  cimetiere:"an older middle-aged white-skinned fortune-teller woman (la voyante) with pale fair skin, ginger red hair, a few age wrinkles, mystical knowing gaze, hands hovering over a glowing magical crystal ball swirling with purple mist",
};

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function genOne(key){
  const out=path.join(ASSETS,'card_'+key+'.png');
  if(fs.existsSync(out)&&!process.env.FORCE){console.log(`\n• ${key} déjà fait (skip)`);return true;}
  const prompt=STYLE+PROMPTS[key];
  process.stdout.write(`\n🎨 ${key} [${MODEL}] … `);
  let r=await fetch(CREATE,{method:'POST',headers:{'Authorization':'Bearer '+KEY,'Content-Type':'application/json'},
    body:JSON.stringify({model:MODEL,input:{prompt,aspect_ratio:'2:3',output_format:'png',resolution:'2K',image_input:STYLE_REFS}})});
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
  console.log('Génération de',keys.length,'carte(s) ->',ASSETS);
  let ok=0;for(const k of keys){if(!PROMPTS[k]){console.log('clé inconnue:',k);continue;}if(await genOne(k))ok++;}
  console.log(`\nTerminé : ${ok}/${keys.length} cartes générées.`);
})();
