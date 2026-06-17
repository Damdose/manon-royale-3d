#!/usr/bin/env python3
"""Détoure les personnages des cartes -> sprites de troupes transparents (matting IA rembg).
   Lit  assets/card_<kind>.png  et écrit  assets/troop_<kind>.png  (fond transparent).
   À lancer avec le venv :  .venv-rembg/bin/python gen_troops.py [kind1 kind2 ...]
   (sans argument = toutes les troupes)
"""
import sys, os
from PIL import Image, ImageFilter
from rembg import remove, new_session

ASSETS = os.path.join(os.path.dirname(__file__), 'assets')

TROOP_KINDS = ['queenmanon','ptc','marcels','anais','givenchy','lardons','bierepeche',
               'cecilie','feets','kanye','robot','juliette','darknans','womanizer',
               'tempete','braish','reubeu']

# u2net = modèle généraliste robuste pour objets/persos
SESSION = new_session(os.environ.get('REMBG_MODEL', 'u2net'))

def detour(kind):
    src = os.path.join(ASSETS, 'card_%s.png' % kind)
    dst = os.path.join(ASSETS, 'troop_%s.png' % kind)
    if not os.path.exists(src):
        print('  (manquant) %s' % src); return False
    im = Image.open(src).convert('RGBA')
    out = remove(im, session=SESSION,
                 alpha_matting=True,
                 alpha_matting_foreground_threshold=240,
                 alpha_matting_background_threshold=15,
                 alpha_matting_erode_size=8)
    # nettoie le contour : enlève les pixels quasi-transparents (halo) puis adoucit
    r,g,b,a = out.split()
    a = a.point(lambda v: 0 if v < 28 else (255 if v > 210 else v))
    a = a.filter(ImageFilter.GaussianBlur(0.6))
    out = Image.merge('RGBA', (r,g,b,a))
    bbox = out.getbbox()
    if bbox: out = out.crop(bbox)
    out.save(dst)
    print('  ✅ %-12s %dx%d' % (kind, out.size[0], out.size[1]))
    return True

if __name__ == '__main__':
    kinds = sys.argv[1:] or TROOP_KINDS
    print('Détourage IA de %d troupe(s) -> %s' % (len(kinds), ASSETS))
    ok=0
    for k in kinds:
        if detour(k): ok+=1
    print('Terminé : %d/%d' % (ok, len(kinds)))
