#!/usr/bin/env node
// Extrait la palette de couleurs d'une image (PNG/JPG) — exact, par pixel.
// Usage : node extract_palette.js <image>
// Sort : 1) couleur moyenne de zones nommées (échantillon carré)  2) palette dominante (clusters)
// Nécessite seulement Node + sips (macOS) pour normaliser en PNG 8 bits non entrelacé.
const fs=require('fs'),zlib=require('zlib'),cp=require('child_process'),os=require('os'),path=require('path');

const src=process.argv[2];
if(!src){console.error('usage: node extract_palette.js <image>');process.exit(1);}
// 1) normaliser en PNG 8 bits via sips
const tmp=path.join(os.tmpdir(),'pal_'+Date.now()+'.png');
cp.execSync(`sips -s format png ${JSON.stringify(src)} --out ${JSON.stringify(tmp)}`,{stdio:'ignore'});

// 2) décoder le PNG (type 2/6, 8 bits, non entrelacé)
const buf=fs.readFileSync(tmp);
if(buf.readUInt32BE(0)!==0x89504e47){console.error('pas un PNG');process.exit(1);}
let off=8,W=0,H=0,ct=0,bd=0,idat=[];
while(off<buf.length){const len=buf.readUInt32BE(off);const type=buf.toString('ascii',off+4,off+8);const data=buf.slice(off+8,off+8+len);
  if(type==='IHDR'){W=data.readUInt32BE(0);H=data.readUInt32BE(4);bd=data[8];ct=data[9];}
  else if(type==='IDAT')idat.push(data); else if(type==='IEND')break;
  off+=12+len;}
const raw=zlib.inflateSync(Buffer.concat(idat));
const ch=ct===6?4:3;                       // RGBA ou RGB
const stride=W*ch;
const px=Buffer.alloc(H*stride);
function paeth(a,b,c){const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;}
for(let y=0;y<H;y++){const f=raw[y*(stride+1)];const ri=y*(stride+1)+1;
  for(let i=0;i<stride;i++){const x=raw[ri+i];const a=i>=ch?px[y*stride+i-ch]:0;const b=y>0?px[(y-1)*stride+i]:0;const c=(i>=ch&&y>0)?px[(y-1)*stride+i-ch]:0;
    let v;switch(f){case 0:v=x;break;case 1:v=x+a;break;case 2:v=x+b;break;case 3:v=x+((a+b)>>1);break;case 4:v=x+paeth(a,b,c);break;default:v=x;}
    px[y*stride+i]=v&255;}}
function at(x,y){const i=(y*W+x)*ch;return [px[i],px[i+1],px[i+2]];}
const hex=([r,g,b])=>'#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');

// moyenne d'un carré (échantillon de zone)
function sample(nx,ny,rad){let r=0,g=0,b=0,n=0;const cx=Math.round(nx*W),cy=Math.round(ny*H);
  for(let y=cy-rad;y<=cy+rad;y++)for(let x=cx-rad;x<=cx+rad;x++){if(x<0||y<0||x>=W||y>=H)continue;const[R,G,B]=at(x,y);r+=R;g+=G;b+=B;n++;}
  return hex([Math.round(r/n),Math.round(g/n),Math.round(b/n)]);}

console.log(`Image ${W}x${H}  (colorType ${ct}, ${bd} bits)`);
// zones nommées en coordonnées NORMALISÉES (0..1) — à ajuster selon l'image fournie
const ZONES=JSON.parse(process.env.ZONES||'null')||{
  herbe_claire:[0.5,0.55],herbe_foncee_bord:[0.04,0.5],
  chemin_sable:[0.27,0.45],riviere:[0.5,0.45],pont_bois:[0.21,0.45],
  tour_adverse_cadre:[0.27,0.21],tour_adverse_pierre:[0.27,0.3],
  tour_alliee_bleu:[0.27,0.78],roi_couronne:[0.5,0.05],
};
console.log('\n— Couleurs par zone (échantillon) —');
for(const k in ZONES){const z=ZONES[k];console.log(k.padEnd(22),sample(z[0],z[1],4));}

// palette dominante : quantification 4 bits/canal + comptage
console.log('\n— Palette dominante (top 12) —');
const cnt=new Map();
for(let y=0;y<H;y+=3)for(let x=0;x<W;x+=3){const[r,g,b]=at(x,y);const key=((r>>4)<<8)|((g>>4)<<4)|(b>>4);cnt.set(key,(cnt.get(key)||0)+1);}
[...cnt.entries()].sort((a,b)=>b[1]-a[1]).slice(0,12).forEach(([key,c])=>{
  const r=((key>>8)&15)*17,g=((key>>4)&15)*17,b=(key&15)*17;
  console.log(hex([r,g,b]),(100*c*9/(W*H)).toFixed(1)+'%');});
fs.unlinkSync(tmp);
