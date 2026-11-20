import json
from collections import deque
W,H=28,16
def new():
    g=[[' ']*W for _ in range(H)]
    for x in range(W): g[15][x]='@'
    return g
def hl(g,y,x0,x1,c='#'):
    for x in range(x0,x1+1): g[y][x]=c
def vl(g,x,y0,y1,c='H'):
    for y in range(y0,y1+1): g[y][x]=c
def at(g,pts,c):
    for x,y in pts: g[y][x]=c
L=[]
def add(name,tip,g): L.append({'name':name,'tip':tip,'rows':[''.join(r) for r in g]})

g=new()
hl(g,10,5,11); hl(g,10,13,26); vl(g,12,9,14)
hl(g,12,7,11); at(g,[(7,11),(11,11)],'#'); at(g,[(9,11)],'$')
vl(g,21,6,9); hl(g,6,14,20,'-'); vl(g,25,0,9,'S')
at(g,[(8,14),(6,9),(15,6),(24,14)],'$'); at(g,[(2,14)],'P')
add('Premiers pas',"Une pépite est enfermée dans un coffre de briques : place-toi à côté et creuse avec Z ou X !",g)

g=new()
hl(g,10,0,27); vl(g,4,9,14); vl(g,23,9,14)
hl(g,5,3,24); vl(g,8,4,9); vl(g,19,4,9); vl(g,14,0,4,'S')
at(g,[(13,14),(26,14),(1,9),(14,9),(26,9),(11,4),(17,4)],'$')
at(g,[(2,14)],'P'); at(g,[(21,4)],'E')
add('Le gardien',"Un robot gardien arrive ! Creuse un trou devant lui pour le piéger, puis marche sur sa tête.",g)

g=new()
vl(g,6,3,14); hl(g,11,7,14); hl(g,3,7,20,'-'); hl(g,7,15,27); vl(g,21,3,14)
hl(g,9,0,5,'-'); vl(g,27,0,6,'S')
at(g,[(10,10),(24,6),(17,6),(3,9),(13,3),(26,14),(11,14)],'$')
at(g,[(1,14)],'P'); at(g,[(16,6),(25,14)],'E')
add('Les cordes',"Suspends-toi aux cordes pour traverser. Flèche du bas pour te laisser tomber.",g)

g=new()
hl(g,7,0,27); hl(g,9,0,27); vl(g,1,6,14); at(g,[(9,8),(18,8)],'@')
vl(g,4,3,6); hl(g,3,5,22,'-'); vl(g,24,0,6,'S')
at(g,[(6,8),(13,8),(23,8),(14,14),(25,14),(26,6),(14,3)],'$')
at(g,[(3,6)],'P'); at(g,[(20,6),(20,14)],'E')
add('Creuse !',"Certaines pépites sont dans un tunnel. Creuse pour y entrer… et creuse encore pour en sortir.",g)

g=new()
vl(g,3,4,14); vl(g,24,4,14); hl(g,11,6,21); vl(g,7,10,14)
hl(g,8,4,23); vl(g,20,7,10); hl(g,5,4,23); vl(g,13,1,10)
hl(g,1,4,12,'-'); hl(g,1,14,23,'-')
at(g,[(9,8),(18,8),(9,5),(18,5)],'X'); vl(g,0,0,14,'S')
at(g,[(10,10),(17,10),(6,7),(21,7),(15,7),(11,4),(16,4),(6,1),(21,1),(26,14),(1,14)],'$')
at(g,[(13,14)],'P'); at(g,[(9,7),(18,7),(15,4)],'E')
add('Fausses briques',"Attention : certaines briques sont des pièges et on passe à travers !",g)

g=new()
vl(g,9,6,14,'@'); vl(g,18,6,12,'@'); hl(g,6,10,17); hl(g,6,7,8); hl(g,6,19,20)
hl(g,10,10,17); vl(g,6,2,14); vl(g,21,5,14); hl(g,2,7,24,'-'); hl(g,2,0,5,'-')
vl(g,27,0,14,'S')
at(g,[(13,9),(14,14),(15,2),(2,2),(25,14),(3,14),(20,5)],'$')
at(g,[(1,14)],'P'); at(g,[(24,14),(16,5),(24,2)],'E')
add('La forteresse',"Le trésor est dans la forteresse. Creuse le toit pour entrer !",g)

# checker
def chk(rows):
    def t(x,y,rev):
        if x<0 or x>=W or y>=H: return '@'
        if y<0: return ' '
        c=rows[y][x]
        if c=='S': return 'H' if rev else ' '
        if c in '$PE': return ' '
        return c
    def reach(starts,rev):
        blk=lambda x,y: t(x,y,rev) in '#@'
        def sup(x,y): return t(x,y,rev) in 'H-' or y>=H-1 or t(x,y+1,rev) in '#@H'
        seen=set(starts); q=deque(starts)
        while q:
            x,y=q.popleft(); n=[]
            if not sup(x,y): n=[(x,y+1)]
            else:
                for dx in(-1,1):
                    if not blk(x+dx,y): n.append((x+dx,y))
                    if t(x+dx,y+1,rev)=='#' and t(x+dx,y,rev) in ' -': n.append((x+dx,y+1))
                if t(x,y,rev)=='H' and y>0 and not blk(x,y-1): n.append((x,y-1))
                if y<H-1 and not blk(x,y+1): n.append((x,y+1))
            for c in n:
                if c not in seen: seen.add(c); q.append(c)
        return seen
    P=[(x,y) for y in range(H) for x in range(W) if rows[y][x]=='P'][0]
    gold=[(x,y) for y in range(H) for x in range(W) if rows[y][x]=='$']
    r=reach([P],False); bad=[g for g in gold if g not in r]
    esc=[g for g in gold if not any(y==0 for x,y in reach([g],True))]
    return bad,esc
for i,l in enumerate(L):
    assert all(len(r)==W for r in l['rows']) and len(l['rows'])==H
    print(i+1,l['name'],chk(l['rows']))
json.dump(L,open(__import__('os').path.join(__import__('os').path.dirname(__file__),'levels.json'),'w'),ensure_ascii=False)
