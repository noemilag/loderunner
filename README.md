# Pioche et Pépites

Un petit jeu de plateforme à jouer à deux, papa et fiston. Ramasse toutes les pépites, creuse des trous pour piéger les robots gardiens, puis grimpe tout en haut par l'échelle de sortie.

Inspiré des jeux d'arcade du milieu des années 80. Les graphismes, les niveaux et le code sont originaux.

## Jouer

Ouvre `index.html` dans un navigateur. Tout est dans ce seul fichier, sans installation.

| Touche | Action |
| --- | --- |
| ← → ↑ ↓ (ou WASD) | Courir, grimper, lâcher une corde |
| Z / X | Creuser en bas à gauche / à droite |
| Échap | Pause |
| R | Recommencer le niveau (−1 vie) |

- 6 niveaux de plus en plus durs
- Bords de l'écran reliés : on sort à droite, on rentre à gauche
- Look 1985 (par défaut) ou moderne, vitesse Tortue / Normale / Lièvre
- Atelier pour dessiner, tester, enregistrer et partager ses propres niveaux (par code)

Sur téléphone ou tablette, une croix directionnelle et deux boutons « Creuser » apparaissent à l'écran (jamais sur ordinateur). À l'horizontale, l'écran de jeu est plus grand.

La progression et les niveaux maison sont gardés dans le navigateur (localStorage).

## Code

```
index.html          le jeu assemblé (c'est lui qu'on publie)
manifest.json       nom et icône pour l'écran d'accueil du téléphone
icons/              icône du jeu (32 à 512 px) et make_icon.py qui la dessine
build.py            reconstruit index.html à partir de src/
src/engine.js       règles du jeu : déplacements, trous, gardiens, chemin le plus court
src/ui.js           affichage, sons, menus, atelier
src/template.html   la page et ses styles
src/levels.py       construit les niveaux et vérifie qu'ils se terminent
src/levels.json     niveaux générés
src/test-engine.js  petite simulation du moteur (node src/test-engine.js)
```

Après une modification : `python3 src/levels.py` (si les niveaux changent), puis `python3 build.py`.

## À venir

- Peaufiner la version mobile après les premiers essais
