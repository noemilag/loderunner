"""Assemble index.html à partir des sources dans src/.
Usage : python3 src/levels.py (si les niveaux changent), puis python3 build.py
"""
from pathlib import Path
s = Path(__file__).parent / 'src'
t = (s / 'template.html').read_text()
eng = (s / 'engine.js').read_text().replace("if(typeof module!=='undefined')module.exports={createGame,W,H};", "")
t = t.replace('/*ENGINE*/', eng).replace('/*LEVELS*/', (s / 'levels.json').read_text()).replace('/*UI*/', (s / 'ui.js').read_text())
(Path(__file__).parent / 'index.html').write_text(t)
print('index.html reconstruit')
