# 🎨 Pack de prompts — sprites style Clash Royale (Manon Royale)

But : générer des **sprites 2.5D cohérents** (comme le vrai CR : images pré-rendues depuis des modèles 3D).
Le jeu les charge automatiquement depuis `assets/` (voir noms ci-dessous), les pose au sol en billboard, ajoute l'ombre et l'anneau d'équipe, et les **miroite gauche/droite** selon la direction.

---

## ⚙️ Règles à respecter (sinon les sprites ne s'intègrent pas bien)

1. **Fond 100 % transparent** (PNG, alpha). Pas de décor, pas de sol, pas de cadre.
2. **Un seul sujet, centré**, vu **de face**, légèrement **en plongée (caméra ~45° au-dessus)** — c'est l'angle du jeu.
3. **Corps entier, pieds/base touchant le bord BAS** du cadre (le jeu pose le sprite par le bas).
4. **Pas d'ombre portée au sol** dans l'image (le jeu la dessine lui-même). Une légère occlusion sous les pieds est ok.
5. **Pas de texte, pas de logo.**
6. **Taille** : troupes = **1024×1024** ; tours = **1024×1280** (ratio portrait).
7. **COHÉRENCE = le plus important** : génère tout avec le **même préfixe de style**, le **même modèle** et si possible le **même seed**, et une **lumière venant du haut-gauche**. Sinon les persos ne semblent pas du même jeu.

### 🔑 Préfixe de style (à coller AVANT chaque description)
```
Clash Royale style, Supercell mobile game art, 3D rendered cartoon character,
soft toy plastic shading, chunky stylized proportions, big head, vibrant saturated colors,
clean thick dark outline, viewed from a high 3/4 angle (camera looking down ~45°),
full body, feet touching bottom edge, centered, single subject,
soft top-left light, transparent background, no ground, no shadow, no text, square --no background
```

---

## 🧍 Troupes — nom de fichier `troop_<clé>.png`

| Fichier | Description à mettre APRÈS le préfixe |
|---|---|
| `troop_manon.png` | a cute young blonde woman in a hot-pink fashion dress, confident pose, fashionista |
| `troop_caniche.png` | a fluffy white toy poodle dog, groomed, cute, standing |
| `troop_sac.png` | a golden luxury handbag character with little cartoon eyes and tiny legs |
| `troop_pigeon.png` | a chubby grey pigeon with spread wings, flying pose, cute |
| `troop_meme.png` | a sweet old grandma with glasses and grey bun hair, purple cardigan, holding a handbag |
| `troop_diva.png` | a glamorous diva woman in a sparkling pink gown, dramatic pose, microphone |
| `troop_mannequin.png` | a blue tailor's dress mannequin / dressmaker dummy on a stand, walking |
| `troop_talon.png` | a giant glossy red high-heel stiletto shoe character, fierce |
| `troop_damien.png` | an elegant man in an all-black suit and sunglasses, cool rockstar vibe |
| `troop_vespa.png` | a retro mint-green scooter (vespa) with a stylish rider, side-front view |
| `troop_valise.png` | a brown vintage travel suitcase character with little legs, sturdy |
| `troop_pump.png` | a small cute fashion boutique shop building, awning, "open" vibe (BÂTIMENT) |
| `troop_tourelle.png` | a small cartoon defensive cannon turret, metal, mobile-game style (BÂTIMENT) |

> Astuce mouvement : une **image fixe par troupe suffit** pour démarrer (le jeu ajoute rebond + miroir gauche/droite).

### 🎞️ (Optionnel) Animation de marche — feuille de sprites
Le moteur sait jouer un **cycle de marche** si le PNG est une **bande horizontale de N images** côte à côte (même hauteur, largeur = N × hauteur), fond transparent, perso centré dans chaque case.
1. Génère par ex. 6 poses de marche alignées dans `troop_manon.png`.
2. Déclare-le dans `index.html`, objet `SHEET` (en haut de la section assets) :
   ```js
   const SHEET = { manon:{frames:6,fps:10}, caniche:{frames:4,fps:12} };
   ```
3. Recharge. Chaque unité a son **cycle indépendant** (cloné), joué quand elle marche, figé à la 1ʳᵉ image à l'arrêt.
Sans entrée dans `SHEET`, le PNG est traité comme **image fixe** (comportement par défaut).

---

## 🏰 Tours — nom de fichier `tower_<role>_<équipe>.png`

Base en pierre carrée façon CR, **accents de couleur d'équipe aux 4 coins**, perso posé dessus. Base au bord bas.

| Fichier | Description APRÈS le préfixe |
|---|---|
| `tower_princess_blue.png` | a square stone defensive tower with **blue** corner accents and a crossbow archer girl on top, crown banner |
| `tower_princess_red.png` | a square stone defensive tower with **pink/red** corner accents and a crossbow archer on top, crown banner |
| `tower_king_blue.png` | a large square stone king tower with **blue** trim and a chubby king with a gold crown sitting on top |
| `tower_king_red.png` | a large square stone king tower with **red** trim and a chubby red king with a gold crown on top |

---

## 🃏 (Optionnel) Portraits de cartes — `card_<clé>.png`
Carré ~512×512, buste/visage du perso bien cadré, même style. Clés : `manon, caniche, sacs, pigeons, meme, diva, vespa, tourelle, mannequin, valise, talon, parfum, damien, fleches, vernis, soin, rage, pump`. Sans ça, le jeu affiche un emoji.

---

## 📥 Mise en place
1. Génère les PNG, garde **exactement** les noms ci-dessus.
2. Dépose-les dans ce dossier `assets/`.
3. Recharge le jeu (**Cmd+Shift+R**). Chaque image remplace automatiquement la forme 3D ; les fichiers manquants gardent la forme de secours (tu peux y aller une par une).
