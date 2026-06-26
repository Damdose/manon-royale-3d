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
const ICON="Clash Royale game icon by Supercell, single object, 3D stylized glossy render, chunky shape, bold clean readable silhouette, centered and FILLING most of the frame, ISOLATED on a SOLID PURE WHITE #FFFFFF background (flat uniform white, NO gradient, NO colored background, NO tint), no scene, no text, no shadow on ground. Subject: ";
// Icônes boutique : on CONDITIONNE sur les vraies icônes or/gemmes du jeu (image_input) pour un 3D IDENTIQUE.
const REFBASE='https://damdose.github.io/manon-royale-3d/assets/';
const STYLE_REFS=[REFBASE+'ui_gold2.png',REFBASE+'ui_gem2.png'];
const ICON2="Match EXACTLY the 3D look of the reference images: a fully 3D RENDERED object (CGI render from a 3D model, like a Clash Royale / Supercell shop item), with real volumetric depth, three-dimensional rounded chunky forms, soft 3D studio lighting, ambient occlusion, glossy highlights and a subtle clean outline. It MUST look like a rendered 3D model, NOT a flat 2D drawing, NOT a hand-painted illustration, NOT a sticker, NOT line art. Single free-standing 3D object, NO rounded-square app-icon tile, NO base plate, centered and FILLING most of the frame, ISOLATED on a SOLID PURE WHITE #FFFFFF background, no scene, no text, no ground shadow. The 3D-rendered object is: ";

// type: 'bg' (fond plein 9:16) ou 'icon' (objet centré 1:1)
const ASSETS_LIST={
  bg_lobby:{type:'bg',prompt:BG+"Home screen background EXACTLY like the Clash Royale main menu wallpaper: a flat subtle diamond lattice grid texture, thin softly embossed diagonal lines crossing to form a DENSE grid of MANY SMALL even diamonds (about 14 diamonds across the width, small tiles), medium royal blue. A large bright radial glow of light cyan-blue in the center makes the middle clearly brighter, smoothly fading to a darker navy-blue at the edges and corners (soft vignette). Clean, flat, calm, very subtle relief, NOT puffy, NOT leather, NOT a couch, no thick padding. Full vertical mobile UI wallpaper, no characters, no objects, no scene, no text."},
  bg_cards:{type:'bg',prompt:BG+"Cards collection screen background EXACTLY like Clash Royale: the TOP two thirds is the same flat subtle diamond lattice grid texture (DENSE grid of MANY SMALL embossed diamonds, about 14 diamonds across the width, medium royal blue) with a soft brighter glow in the upper-center. The BOTTOM third softly fades into a ghostly faded monochrome BLUE silhouette of a fantasy castle with stone king towers and battlements, low-contrast and desaturated like a faint backdrop, blending smoothly into the diamond pattern above. Calm, clean, flat. Full vertical mobile UI wallpaper, no text, no UI, no buttons, no characters in front."},
  bg_shop:{type:'bg',prompt:BG+"Shop screen background EXACTLY like the Clash Royale shop wallpaper: a flat subtle diamond lattice grid texture, thin softly embossed diagonal lines crossing to form a DENSE grid of MANY SMALL even diamonds (about 14 diamonds across the width, small tiles), medium GREEN. A large bright radial glow of light yellow-green in the center makes the middle clearly brighter, smoothly fading to a darker forest-green at the edges and corners (soft vignette). Clean, flat, calm, very subtle relief, NOT puffy, NOT leather, no thick padding. Full vertical mobile UI wallpaper, no characters, no objects, no scene, no text."},
  bg_clan:{type:'bg',prompt:BG+"Clan screen background EXACTLY like Clash Royale: a flat subtle diamond lattice grid texture, thin softly embossed diagonal lines crossing to form a DENSE grid of MANY SMALL even diamonds (about 14 diamonds across the width, small tiles), medium PURPLE. A large bright radial glow of light violet in the center makes the middle clearly brighter, smoothly fading to a darker deep-purple at the edges and corners (soft vignette). Clean, flat, calm, very subtle relief, NOT puffy, NOT leather, no thick padding. Full vertical mobile UI wallpaper, no characters, no objects, no scene, no text."},
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
  gold1:{type:'icon',styleRef:true,refs:[REFBASE+'ui_gold2.png',REFBASE+'ui_gold3.png'],prompt:"a small brown drawstring pouch bag overflowing with shiny gold coins, with a blue tie cord, glossy."},
  gold2:{type:'icon',prompt:"a wooden bucket overflowing with shiny gold coins, glossy."},
  gold3:{type:'icon',prompt:"a wooden wagon cart full of a huge pile of shiny gold coins, glossy."},
  // ---- tas de gemmes (boutique) ----
  gem1:{type:'icon',styleRef:true,refs:[REFBASE+'ui_gem2.png',REFBASE+'ui_gem3.png'],prompt:"a small neat pile of a few bright green faceted crystal gems (same crisp faceted diamond gems as the references), glossy."},
  gem2:{type:'icon',prompt:"a drawstring pouch overflowing with bright green gems, glossy."},
  gem3:{type:'icon',prompt:"a wooden bucket overflowing with bright green gems, glossy."},
  gem4:{type:'icon',styleRef:true,refs:[REFBASE+'ui_gem2.png',REFBASE+'ui_gem3.png'],prompt:"a wooden barrel with iron bands overflowing with a big heap of bright green faceted crystal gems (same crisp faceted diamond gems as the references), spilling over the rim, glossy."},
  gem5:{type:'icon',styleRef:true,refs:[REFBASE+'ui_gem2.png',REFBASE+'ui_gem3.png'],prompt:"an open wooden-and-gold treasure chest overflowing with a huge pile of bright green faceted crystal gems (same crisp faceted diamond gems as the references), glossy."},
  gem6:{type:'icon',styleRef:true,refs:[REFBASE+'ui_gem2.png',REFBASE+'ui_gem3.png'],prompt:"a wooden wagon cart full of an enormous mountain of bright green faceted crystal gems (same crisp faceted diamond gems as the references), glossy."},
  // ---- objets boutique (cadeaux de Manon) : style icône CR identique aux tas d'or/gemmes ----
  shop_ibiza:{type:'icon',prompt:"a tropical paradise island with one palm tree, a beach parasol and a bright sun over turquoise water, summer vacation, glossy."},
  shop_chanel:{type:'icon',prompt:"an elegant luxury little black designer dress on a golden hanger, haute couture fashion, glossy."},
  shop_depist:{type:'icon',prompt:"a medical test tube next to a red health cross, a checkup screening kit, glossy."},
  shop_macbook:{type:'icon',prompt:"an open pink rose-gold laptop computer, modern, glossy."},
  shop_exo:{type:'icon',prompt:"a glowing golden holy cross with a swirling purple ghost spirit around it, exorcism, spooky, glossy."},
  shop_annexe:{type:'icon',prompt:"a small white hospital clinic building with a red cross sign on the roof, glossy."},
  shop_chapeau:{type:'icon',prompt:"a colorful medieval troubadour minstrel cap with a long curved feather, glossy."},
  shop_perruque:{type:'icon',prompt:"a curly bright red-orange hair wig on a display stand, glossy."},
  shop_shit:{type:'icon',prompt:"a brown brick block of hashish wrapped in plastic with a small green cannabis leaf resting on top, glossy."},
  shop_contrat:{type:'icon',prompt:"a rolled paper work contract document with a golden wax seal and a quill pen, glossy."},
  shop_antibully:{type:'icon',prompt:"a blue and gold protective shield with a raised fist emblem, anti-bullying badge, glossy."},
  shop_flocon:{type:'icon',prompt:"a cute fluffy white poodle puppy with a pink bow and a small red heart, glossy."},
  shop_gigolo:{type:'icon',prompt:"a handsome charming muscular dark-skinned Black African man (Senegalese), short black hair, wearing a stylish open shirt, confident cool seductive pose, glossy."},
  shop_uv:{type:'icon',prompt:"a modern UV tanning bed capsule, open like a clamshell, glowing inside with bright neon purple-white UV light tubes, tanning salon machine, glossy."},
  shop_bbl:{type:'icon',prompt:"a glossy ripe peach with a measuring tape wrapped around it and a few sparkles, beauty cosmetic icon, glossy."},
  // ---- barre du bas (onglets) : set d'icônes COHÉRENT, style CR ----
  // Toutes dans le MÊME style : objet flottant, glossy, AUCUNE tuile / cadre / socle.
  tab_shop:{type:'icon',prompt:"an open wooden-and-gold treasure chest overflowing with a few gold coins and gems, bold clean glossy 2.5D game icon, a single free-standing floating object, NO rounded-square tile, NO button frame, NO base plate behind it."},
  tab_cards:{type:'icon',prompt:"a fanned hand of three or four colorful battle playing cards, bold clean glossy 2.5D game icon, a single free-standing floating object, NO rounded-square tile, NO button frame, NO base plate behind it."},
  tab_battle:{type:'icon',prompt:"two golden battle swords crossed in an X shape, bold clean glossy 2.5D game icon, a single free-standing floating object, NO rounded-square tile, NO button frame, NO base plate behind it."},
  tab_clan:{type:'icon',prompt:"a blue and gold heraldic shield with two crossed swords behind it, bold clean glossy 2.5D game icon, a single free-standing floating object, NO rounded-square tile, NO button frame, NO base plate behind it."},
  tab_events:{type:'icon',prompt:"a single shiny silver sword crossing a small red banner ribbon, bold clean glossy 2.5D game icon, a single free-standing floating object, NO rounded-square tile, NO button frame, NO base plate behind it."},
  arena:{type:'icon',prompt:"a floating 3D Clash Royale style arena board diorama seen from a high angle, two grassy lanes with a central blue river and two wooden bridges, small stone towers, decorative rocks and trees around the edge, sitting on a dark rounded base like a game widget, glossy stylized."},
  quilt_blue:{type:'bg',prompt:BG+"Seamless quilted diamond pattern background, soft padded tufted 3D diamonds (like quilted leather), deep royal BLUE, subtle highlight and shadow on each diamond, smooth glossy, even lighting, full vertical mobile UI background, perfectly tileable, no characters."},
  quilt_green:{type:'bg',prompt:BG+"Seamless quilted diamond pattern background, soft padded tufted 3D diamonds (like quilted leather), rich GREEN, subtle highlight and shadow on each diamond, smooth glossy, even lighting, full vertical mobile UI background, perfectly tileable, no characters."},
  quilt_purple:{type:'bg',prompt:BG+"Seamless quilted diamond pattern background, soft padded tufted 3D diamonds (like quilted leather), deep PURPLE, subtle highlight and shadow on each diamond, smooth glossy, even lighting, full vertical mobile UI background, perfectly tileable, no characters."},
  gear:{type:'icon',prompt:"a mobile game settings gear cog icon, metallic, bold simple glossy 3D."},
  // ---- en-tête lobby façon Clash Royale (widgets sur fond blanc, à détourer) ----
  crownbanner:{type:'icon',aspect:'16:9',prompt:"a wide horizontal heraldic flag banner: the banner surface is TAN and ORANGE diamond-quilted fabric with a darker rounded border, the left edge pointed with a small notch and the right edge ending in a forked flag tail. Resting across it is a large shiny 3D GOLDEN royal crown (with a few small blue diamond gems) sitting on a glossy BLUE ribbon band stretched horizontally across the banner. Bold glossy Supercell style."},
  robotbanner:{type:'icon',aspect:'16:9',prompt:"a wide horizontal heraldic flag banner, EXACTLY the same banner as a crown banner but the crown is replaced by a robot head: the banner surface is TAN and ORANGE diamond-quilted fabric with a darker rounded border, the left edge pointed with a small notch and the right edge ending in a forked flag tail. Resting across the center is a large shiny 3D CHROME SILVER metal ROBOT HEAD (rounded helmet shape with two big round glowing CYAN-BLUE eyes), sitting on a glossy BLUE ribbon band stretched horizontally across the banner. Bold glossy Supercell style."},
  passroyale:{type:'icon',aspect:'16:9',prompt:"a horizontal GOLDEN premium season-pass button: a rounded gold rectangle with an ornate raised border, a closed shiny golden PADLOCK lock centered on it, and on the right side a glossy BLUE heraldic shield badge bearing a small white-and-gold crown that sticks out past the edge. Rich glossy 3D. NO letters, NO words, NO text, NO numbers."},
  ticket:{type:'icon',aspect:'3:4',prompt:"a single blue event entry ticket voucher with perforated edges and a golden trophy cup emblem in the center, glossy."},
  battlecard:{type:'icon',aspect:'3:4',prompt:"a single Clash Royale style trading card with a blue and gold frame showing a friendly cartoon king character portrait, a small purple elixir cost gem badge in the top-left corner, glossy."},
  btn_friends:{type:'icon',prompt:"two stylized white-and-blue person silhouettes side by side (a friends / social icon), bold simple glossy 3D, single free-standing object, no tile, no frame."},
  btn_news:{type:'icon',prompt:"a rolled parchment scroll with a small golden crown badge (a news / notice icon), bold simple glossy 3D, single free-standing object, no tile, no frame."},
  btn_menu:{type:'icon',prompt:"three thick horizontal rounded bars stacked (a hamburger menu icon), white and light blue, bold simple glossy 3D, single free-standing object, no tile, no frame."},
  // ---- icônes de l'écran d'intro (le dilemme) : tête robot du VS + cœur assorti, MÊME rendu chromé 3D ----
  intro_robot:{type:'icon',styleRef:true,refs:[REFBASE+'ui_robotbanner.png'],prompt:"ONLY the chrome robot head from the reference banner, isolated by itself with NO banner, NO flag, NO ribbon, NO fabric behind it: a large shiny 3D CHROME SILVER metal robot head, rounded helmet shape with two big round glowing CYAN-BLUE eyes and small round ear bolts, exactly the same robot head design and chrome material as in the reference, friendly, glossy Supercell style, single free-standing floating object."},
  intro_heart:{type:'icon',styleRef:true,refs:[REFBASE+'ui_robotbanner.png'],prompt:"a single big glossy 3D heart, smooth rounded chunky shape, glossy RED-and-pink candy gloss surface with bright soft highlights, rendered with the SAME shiny 3D material quality, soft studio lighting, ambient occlusion and clean subtle outline as the chrome robot head in the reference (same Supercell render style, just a heart instead of a head), single free-standing floating object, NO banner, NO ribbon, NO fabric."},
  // ---- bouton DISCUTER (emote en combat) : bulle de BD en 3D glossy, MÊME rendu que les autres icônes ----
  chat:{type:'icon',styleRef:true,prompt:"a single chunky 3D comic speech bubble (chat / talk bubble), a rounded fat pill shape with a short pointed tail at the bottom-left, glossy GLOSSY WHITE surface with a soft light-blue tint and bright highlights, a clean rounded ROYAL-BLUE outline, and THREE round glossy blue dots in a horizontal row in the center (a talking '...' indicator). Same shiny 3D rendered material, soft studio lighting, ambient occlusion and subtle outline as the reference shop icons, single free-standing floating object, NO tile, NO frame, NO base plate, NO text."},
};
// les objets de la boutique sont générés en image-to-image (réfs or/gemmes) pour un style 3D identique
for(const k in ASSETS_LIST){if(k.startsWith('shop_'))ASSETS_LIST[k].styleRef=true;}

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
// fetch tolérant aux coupures réseau transitoires (EHOSTUNREACH, ECONNRESET…) : réessaie quelques fois
async function fetchR(url,opt,tries=5){
  for(let i=0;i<tries;i++){try{return await fetch(url,opt);}catch(e){
    if(i===tries-1)throw e;process.stdout.write('⟳');await sleep(4000);}}
}
async function genOne(key){
  const a=ASSETS_LIST[key];const out=path.join(ASSETS,'ui_'+key+'.png');
  if(fs.existsSync(out)&&!process.env.FORCE){console.log(`\n• ${key} déjà fait (skip)`);return true;}
  const prompt=(a.type==='bg'?a.prompt:(a.styleRef?ICON2:ICON)+a.prompt);
  const aspect=a.aspect||(a.type==='bg'?'9:16':'1:1');
  const input={prompt,aspect_ratio:aspect,output_format:'png',resolution:'2K'};
  if(a.styleRef)input.image_input=a.refs||STYLE_REFS;
  process.stdout.write(`\n🎨 ${key} [${a.type}${a.styleRef?' +ref':''}] … `);
  let r=await fetchR(CREATE,{method:'POST',headers:{'Authorization':'Bearer '+KEY,'Content-Type':'application/json'},
    body:JSON.stringify({model:MODEL,input})});
  let j=await r.json();const taskId=j&&j.data&&j.data.taskId;
  if(!taskId){console.log('échec create:',JSON.stringify(j).slice(0,200));return false;}
  for(let i=0;i<90;i++){await sleep(3000);
    const ir=await fetchR(REC+taskId,{headers:{'Authorization':'Bearer '+KEY}});const ij=await ir.json();
    const d=ij.data||{};const st=(d.state||'').toString().toLowerCase();
    if(st==='success'||st==='done'){let rj=d.resultJson||'{}';if(typeof rj==='string'){try{rj=JSON.parse(rj);}catch(e){rj={};}}
      const urls=rj.resultUrls||rj.images||[];if(!urls.length){console.log('done sans url:',JSON.stringify(ij).slice(0,200));return false;}
      const img=await fetchR(urls[0]);fs.writeFileSync(out,Buffer.from(await img.arrayBuffer()));console.log('✅');return true;}
    if(st==='failed'||st==='fail'){console.log('❌',d.failMsg||'');return false;}
    process.stdout.write('.');
  }
  console.log('timeout');return false;
}
(async()=>{let keys=process.argv.slice(2);if(!keys.length)keys=Object.keys(ASSETS_LIST);
  let ok=0;for(const k of keys){if(!ASSETS_LIST[k]){console.log('inconnu:',k);continue;}
    try{if(await genOne(k))ok++;}catch(e){console.log('\n⚠️ '+k+' erreur:',e.message,'(on continue)');}}
  console.log(`\nTerminé : ${ok}/${keys.length}`);})();
