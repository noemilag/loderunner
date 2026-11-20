"""Dessine l'icône du jeu (grille 32×32, agrandie sans lissage)."""
from PIL import Image
from pathlib import Path
B=(0,0,0);W=(255,255,255);O=(208,88,28);Y=(255,210,63);D=(184,134,11);L=(255,236,150)
N=32;g=[[B]*N for _ in range(N)]
def rect(x0,y0,x1,y1,c):
    for y in range(y0,y1+1):
        for x in range(x0,x1+1):
            if 0<=x<N and 0<=y<N: g[y][x]=c
def bricks(x0,x1,y0,rows,off=0):
    for r in range(rows):
        y=y0+r*4; rect(x0,y,x1,y+2,O)
        for x in range(x0,x1+1):
            if (x+off+(4 if r%2 else 0))%8==7: rect(x,y,x,y+2,B)
# sol
bricks(0,31,24,2)
# plateforme de gauche et sa pépite
bricks(0,8,8,1,off=2)
gold=['..yyy..','.yLyyy.','yyyyyyy','yyDyyyD','yyyyyyy']
for yy,r in enumerate(gold):
    for xx,c in enumerate(r):
        if c!='.': g[3+yy][1+xx]={'y':Y,'L':L,'D':D}[c]
# échelle
rect(20,0,21,23,W);rect(28,0,29,23,W)
for y in range(2,24,5): rect(22,y,27,y+1,W)
# petite plateforme de droite et pépite au sol

for yy,r in enumerate(['.yy.','yLyy','yyyy']):
    for xx,c in enumerate(r):
        if c!='.': g[21+yy][24+xx-0]={'y':Y,'L':L}[c] if xx+24<28 else g[21+yy][24+xx]
# bonhomme qui court vers l'échelle (sprite 8×8 doublé)
fig=['....##..','....##..','..####..','.#..#.#.','....#...','...#.#..','..#...#.','.#.....#']
for yy,r in enumerate(fig):
    for xx,c in enumerate(r):
        if c=='#': rect(3+xx*2,8+yy*2,4+xx*2,9+yy*2,W)
img=Image.new('RGB',(N,N));img.putdata([p for row in g for p in row])
out=Path(__file__).parent
for n in (512,192,180,32): img.resize((n,n),Image.NEAREST).save(out/f'icon-{n}.png')
m=Image.new('RGB',(40,40),B);m.paste(img,(4,4));m.resize((520,520),Image.NEAREST).resize((512,512),Image.NEAREST).save(out/'icon-maskable-512.png')
