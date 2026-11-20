"""Dessine l'icône : une scène de 4×4 cases faite avec les mêmes dessins
(8×8 gros pixels) que le look 1985 du jeu, puis agrandie sans lissage."""
from PIL import Image
from pathlib import Path
COL={'b':(208,88,28),'w':(242,242,242),'y':(255,210,63),'o':(184,134,11),'#':(255,255,255)}
T={
 'brick':['bbbbbbb.','bbbbbbb.','bbbbbbb.','........','bbb.bbbb','bbb.bbbb','bbb.bbbb','........'],
 'ladder':['.w....w.','.wwwwww.','.w....w.','.w....w.','.w....w.','.wwwwww.','.w....w.','.w....w.'],
 'gold':['........','........','........','........','..yyyy..','.yoooyy.','.yyyyyy.','.yyyyyy.'],
 'run':['....##..','....##..','..####..','.#..#.#.','....#...','...#.#..','..#...#.','.#.....#'],
 '':['........']*8,
}
SCENE=[['gold','',   'ladder',''     ],
       ['brick','brick','ladder','brick'],
       ['',  'run',  'ladder','gold' ],
       ['brick','brick','brick','brick']]
N=32;img=Image.new('RGB',(N,N),(0,0,0));px=img.load()
for ty,row in enumerate(SCENE):
    for tx,name in enumerate(row):
        for y,r in enumerate(T[name]):
            for x,c in enumerate(r):
                if c in COL: px[tx*8+x,ty*8+y]=COL[c]
out=Path(__file__).parent
for n in (512,192,180,32): img.resize((n,n),Image.NEAREST).save(out/f'icon-{n}.png')
m=Image.new('RGB',(40,40),(0,0,0));m.paste(img,(4,4));m.resize((520,520),Image.NEAREST).resize((512,512),Image.NEAREST).save(out/'icon-maskable-512.png')
