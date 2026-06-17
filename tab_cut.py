#!/usr/bin/env python3
"""Détoure les icônes d'onglets : vire le fond BLANC par flood-fill depuis les coins
   (préserve les reflets blancs internes), érode le bord, recadre.
   Lit la source pristine assets/_raw_tab_<k>.png (snapshotée par --snap) et
   écrit assets/ui_tab_<k>.png. Pas d'IA.
     python tab_cut.py --snap   # copie ui_tab_* -> _raw_tab_*  (à faire après régen)
     python tab_cut.py          # détoure _raw_tab_* -> ui_tab_*"""
import os, sys, shutil
from PIL import Image, ImageDraw, ImageFilter

ASSETS = os.path.join(os.path.dirname(__file__), 'assets')
KEYS = ['shop', 'cards', 'battle', 'clan', 'events']
MAGIC = (255, 0, 255)


def flatten_white(p):
    """Ouvre n'importe quel PNG (palette/RGBA/RGB) -> RGB sur fond blanc franc."""
    im = Image.open(p)
    im = im.convert('RGBA')
    bg = Image.new('RGBA', im.size, (255, 255, 255, 255))
    bg.alpha_composite(im)
    return bg.convert('RGB')


if '--snap' in sys.argv:
    n = 0
    for k in KEYS:
        src = os.path.join(ASSETS, 'ui_tab_%s.png' % k)
        if os.path.exists(src):
            shutil.copyfile(src, os.path.join(ASSETS, '_raw_tab_%s.png' % k)); n += 1
    print('snapshot raw : %d' % n); sys.exit(0)

ok = 0
for k in KEYS:
    raw = os.path.join(ASSETS, '_raw_tab_%s.png' % k)
    dst = os.path.join(ASSETS, 'ui_tab_%s.png' % k)
    src = raw if os.path.exists(raw) else dst
    if not os.path.exists(src):
        print('  (manquant)', src); continue
    im = flatten_white(src)
    w, h = im.size
    # flood-fill du fond blanc depuis les 4 coins -> magenta témoin (thresh bas: ne fuit pas dans l'objet)
    for seed in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        ImageDraw.floodfill(im, seed, MAGIC, thresh=40)
    px = im.load()
    alpha = Image.new('L', (w, h), 255)
    ap = alpha.load()
    bgcount = 0
    for y in range(h):
        for x in range(w):
            if px[x, y] == MAGIC:
                ap[x, y] = 0
                px[x, y] = (255, 255, 255)
                bgcount += 1
    # érode le bord (mange la frange) + léger flou
    alpha = alpha.filter(ImageFilter.MinFilter(5))
    alpha = alpha.filter(ImageFilter.GaussianBlur(1.0))
    out = im.convert('RGBA')
    out.putalpha(alpha)
    bbox = out.getbbox()
    if bbox:
        out = out.crop(bbox)
    pct = 100.0 * bgcount / (w * h)
    print('  ok %-8s %dx%d  (fond retiré %.0f%%)' % (k, out.size[0], out.size[1], pct))
    out.save(dst)
    ok += 1
print('Termine : %d/%d' % (ok, len(KEYS)))
