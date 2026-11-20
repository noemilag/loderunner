"""Assemble index.html à partir des sources dans src/.
Usage : python3 src/levels.py (si les niveaux changent), puis python3 build.py
"""
from pathlib import Path
s = Path(__file__).parent / 'src'
t = (s / 'template.html').read_text()
eng = (s / 'engine.js').read_text().replace("if(typeof module!=='undefined')module.exports={createGame,W,H};", "")
t = t.replace('/*ENGINE*/', eng).replace('/*LEVELS*/', (s / 'levels.json').read_text()).replace('/*UI*/', (s / 'ui.js').read_text())
import json, datetime
v = datetime.datetime.now().strftime('%Y.%m.%d-%H%M')
t = t.replace('/*VERSION*/', v)
(Path(__file__).parent / 'index.html').write_text(t)
(Path(__file__).parent / 'version.json').write_text(json.dumps({'version': v}) + '\n')
print('index.html reconstruit, version', v)
