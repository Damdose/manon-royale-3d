#!/usr/bin/env python3
"""Détoure les icônes d'onglets : vire le fond BLANC par flood-fill depuis les coins
   (préserve les reflets blancs internes), adoucit le contour, recadre sur l'objet.
   .venv-rembg/bin/python tab_cut.py   (ou n'importe quel python avec Pillow)"""
import os
from PIL import Image, ImageDraw, ImageFilter

ASSETS = os.path.join(os.path.dirname(__file__), 'assets')
KEYS = ['shop', 'cards', 'battle', 'clan', 'events']
MAGIC = (255, 0, 255)   # couleur témoin pour marquer le fond

ok = 0
for k in KEYS:
    p = os.path.join(ASSETS, 'ui_tab_%s.png' % k)
    if not os.path.exists(p):
        print('  (manquant)', p); continue
    im = Image.open(p).convert('RGB')
    w, h = im.size
    # flood-fill du fond blanc depuis les 4 coins -> magenta témoin
    for seed in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        ImageDraw.floodfill(im, seed, MAGIC, thresh=70)
    # alpha = 0 là où c'est devenu magenta (le fond), 255 ailleurs
    px = im.load()
    alpha = Image.new('L', (w, h), 255)
    ap = alpha.load()
    for y in range(h):
        for x in range(w):
            if px[x, y] == MAGIC:
                ap[x, y] = 0
    # adoucit le bord pour éviter l'aliasing dur
    alpha = alpha.filter(ImageFilter.GaussianBlur(1.2))
    out = im.convert('RGBA')
    out.putalpha(alpha)
    bbox = out.getbbox()
    if bbox:
        out = out.crop(bbox)
    out.save(p)
    print('  ✅ %-8s %dx%d' % (k, out.size[0], out.size[1]))
    ok += 1
print('Termine : %d/%d' % (ok, len(KEYS)))
