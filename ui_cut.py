#!/usr/bin/env python3
"""Détoure des assets UI sur fond blanc (flood-fill depuis les coins), comme tab_cut.py
   mais pour des fichiers ui_<nom>.png quelconques passés en argument.
     python ui_cut.py crownbanner passroyale ticket battlecard btn_friends btn_news
   Snapshote la source pristine dans assets/_raw_<nom>.png pour pouvoir re-détourer."""
import os, sys, shutil
from PIL import Image, ImageDraw, ImageFilter

ASSETS = os.path.join(os.path.dirname(__file__), 'assets')
MAGIC = (255, 0, 255)


def flatten_white(p):
    im = Image.open(p).convert('RGBA')
    bg = Image.new('RGBA', im.size, (255, 255, 255, 255))
    bg.alpha_composite(im)
    return bg.convert('RGB')


names = sys.argv[1:]
if not names:
    print('usage: ui_cut.py <nom> [<nom>...]'); sys.exit(1)

ok = 0
for n in names:
    dst = os.path.join(ASSETS, 'ui_%s.png' % n)
    raw = os.path.join(ASSETS, '_raw_%s.png' % n)
    if not os.path.exists(raw) and os.path.exists(dst):
        shutil.copyfile(dst, raw)            # snapshot source pristine au 1er passage
    src = raw if os.path.exists(raw) else dst
    if not os.path.exists(src):
        print('  (manquant)', src); continue
    im = flatten_white(src)
    w, h = im.size
    for seed in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        ImageDraw.floodfill(im, seed, MAGIC, thresh=40)
    px = im.load()
    alpha = Image.new('L', (w, h), 255)
    ap = alpha.load()
    bg = 0
    for y in range(h):
        for x in range(w):
            if px[x, y] == MAGIC:
                ap[x, y] = 0; px[x, y] = (255, 255, 255); bg += 1
    alpha = alpha.filter(ImageFilter.MinFilter(5))
    alpha = alpha.filter(ImageFilter.GaussianBlur(1.0))
    out = im.convert('RGBA'); out.putalpha(alpha)
    bbox = out.getbbox()
    if bbox:
        out = out.crop(bbox)
    out.save(dst)
    print('  ok %-12s %dx%d  (fond %.0f%%)' % (n, out.size[0], out.size[1], 100.0 * bg / (w * h)))
    ok += 1
print('Termine : %d/%d' % (ok, len(names)))
