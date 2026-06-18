#!/usr/bin/env python3
# Compose le perso (buste) dans le rempart du château + preview. Règle CFG jusqu'à ce que ce soit parfait.
from PIL import Image
import sys
KEYS=['king_blue','king_red','princess_blue','princess_red']
# par château : footFrac = position du BAS du buste (fraction depuis le HAUT), scale = hauteur buste / hauteur château, dx = décalage horizontal (fraction largeur)
CFG={
 'king_blue':   dict(footFrac=0.52, scale=0.42, dx=0.0),
 'king_red':    dict(footFrac=0.55, scale=0.40, dx=0.0),
 'princess_blue':dict(footFrac=0.55, scale=0.40, dx=0.0),
 'princess_red':dict(footFrac=0.55, scale=0.40, dx=0.0),
}
def compose(k):
    castle=Image.open('assets/towercastle_cut_%s.png'%k).convert('RGBA')
    bust=Image.open('assets/towerchar_bust_%s.png'%k).convert('RGBA')
    Wc,Hc=castle.size; c=CFG[k]
    bh=int(Hc*c['scale']); bw=int(bust.size[0]*bh/bust.size[1])
    bust=bust.resize((bw,bh))
    out=castle.copy()
    bx=int(Wc/2 - bw/2 + c['dx']*Wc)
    by=int(Hc*c['footFrac'] - bh)   # bas du buste à footFrac
    out.alpha_composite(bust,(bx,by))
    return out
if __name__=='__main__':
    ims=[]
    for k in KEYS:
        o=compose(k); o.thumbnail((230,300))
        bg=Image.new('RGB',o.size,(120,160,90)); bg.paste(o,(0,0),o); ims.append(bg)
    W=sum(i.width for i in ims)+50;H=max(i.height for i in ims)
    sheet=Image.new('RGB',(W,H),(255,255,255));x=0
    for i in ims: sheet.paste(i,(x,H-i.height)); x+=i.width+12
    sheet.save('/tmp/compose.png'); print('saved /tmp/compose.png')
