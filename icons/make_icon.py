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
# sol (rez-de-chaussée)
bricks(0,31,27,2)
# 2e étage : une rangée de briques de chaque côté de l'échelle
bricks(0,18,7,1,off=2)
bricks(30,31,7,1,off=2)
# grosse pépite sur le 2e étage
gold=['..yyy..','.yLyyy.','yyyyyyy','yyDyyyD','yyyyyyy']
for yy,r in enumerate(gold):
    for xx,c in enumerate(r):
        if c!='.': g[2+yy][2+xx]={'y':Y,'L':L,'D':D}[c]
# échelle qui relie le sol au 2e étage
rect(20,0,21,26,W);rect(28,0,29,26,W)
for y in range(1,24,5): rect(22,y,27,y+1,W)
# petite pépite au pied de l'échelle
for yy,r in enumerate(['.yy.','yLyy','yyyy']):
    for xx,c in enumerate(r):
        if c!='.': g[24+yy][23+xx]={'y':Y,'L':L}[c]
# bonhomme qui court vers l'échelle (sprite 8×8 doublé)
fig=['....##..','....##..','..####..','.#..#.#.','....#...','...#.#..','..#...#.','.#.....#']
for yy,r in enumerate(fig):
    for xx,c in enumerate(r):
        if c=='#': rect(3+xx*2,11+yy*2,4+xx*2,12+yy*2,W)
img=Image.new('RGB',(N,N));img.putdata([p for row in g for p in row])
out=Path(__file__).parent
for n in (512,192,180,32): img.resize((n,n),Image.NEAREST).save(out/f'icon-{n}.png')
m=Image.new('RGB',(40,40),B);m.paste(img,(4,4));m.resize((520,520),Image.NEAREST).resize((512,512),Image.NEAREST).save(out/'icon-maskable-512.png')
