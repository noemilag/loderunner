const W=28,H=16;
const EMPTY=0,BRICK=1,SOLID=2,LADDER=3,ROPE=4,TRAP=5,HLAD=6,HOLE=7;
const CH={' ':EMPTY,'#':BRICK,'@':SOLID,'H':LADDER,'-':ROPE,'X':TRAP,'S':HLAD};
const PLAYER_SPD=4.4,GUARD_RATIO=0.6,FALL_MUL=1.45,CLIMB_MUL=0.9;
const DIG_T=0.3,OPEN_T=5.6,FILL_T=0.9,TRAP_T=3.0,SPAWN_T=0.9;

function createGame(rows,hooks){
  hooks=hooks||{};
  const fx=n=>hooks.sfx&&hooks.sfx(n);
  const pt=(k,x,y)=>hooks.particles&&hooks.particles(k,x,y);
  const G={map:[],gold:[],holeGrid:[],holes:[],guards:[],P:null,goldLeft:0,revealed:false,spd:1,state:'play',t:0,score:0,dyingT:0,revealT:-9};
  const spawns=[];
  const mk=(kind,x,y)=>({kind,x,y,px:x,py:y,tx:x,ty:y,moving:false,mk:'idle',face:1,walk:0,alive:true,state:'walk',trapT:0,gold:false,goldSteps:0,escaping:false,spawnT:0,wait:0,dig:null,deadT:0});
  for(let y=0;y<H;y++){
    G.map.push([]);G.gold.push([]);G.holeGrid.push([]);
    for(let x=0;x<W;x++){
      const c=(rows[y]||'')[x]||' ';let t=CH[c];if(t===undefined)t=EMPTY;
      G.map[y].push(t);G.gold[y].push(c==='$');G.holeGrid[y].push(null);
      if(c==='$')G.goldLeft++;
      if(c==='P')G.P=mk('player',x,y);
      if(c==='E'){G.guards.push(mk('guard',x,y));spawns.push([x,y]);}
    }
  }
  if(!G.P)G.P=mk('player',1,H-2);
  G.totalGold=G.goldLeft;
  if(G.goldLeft===0)G.revealed=true;

  function tile(x,y){if(y>=H)return SOLID;if(y<0)return EMPTY;return G.map[y][wx(x)];}
  function wx(x){return((x%W)+W)%W;}
  function wd(a,b){const d=Math.abs(a-b)%W;return Math.min(d,W-d);}
  function blocking(x,y){const t=tile(x,y);return t===BRICK||t===SOLID;}
  function ladder(x,y){const t=tile(x,y);return t===LADDER||(t===HLAD&&G.revealed);}
  function rope(x,y){return tile(x,y)===ROPE;}
  function floorAt(x,y){if(y>=H)return true;const t=tile(x,y);return t===BRICK||t===SOLID||t===LADDER||(t===HLAD&&G.revealed);}
  function guardSupport(x,y,self){for(const g of G.guards)if(g!==self&&g.alive&&g.x===x&&g.y===y&&(g.state==='trapped'||!g.moving))return true;return false;}
  function supported(x,y,self){return ladder(x,y)||rope(x,y)||y>=H-1||floorAt(x,y+1)||guardSupport(x,y+1,self);}
  function supStatic(x,y){return ladder(x,y)||rope(x,y)||y>=H-1||floorAt(x,y+1)||G.guards.some(g=>g.alive&&g.state==='trapped'&&g.x===x&&g.y===y+1);}
  function guardOcc(x,y,self){x=wx(x);return G.guards.some(g=>g!==self&&g.alive&&((g.x===x&&g.y===y)||(g.moving&&wx(g.tx)===x&&g.ty===y)));}
  function startMove(e,dx,dy,k){e.tx=e.x+dx;e.ty=e.y+dy;e.moving=true;e.mk=k;if(dx)e.face=dx;}

  // ---------- pathfinding ----------
  const prev=new Int32Array(W*H),queue=new Int32Array(W*H),nb=[];
  function nbrs(x,y){
    nb.length=0;
    if(!supStatic(x,y)){if(y+1<H&&!blocking(x,y+1))nb.push(x,y+1);return nb;}
    if(!blocking(x-1,y))nb.push(wx(x-1),y);
    if(!blocking(x+1,y))nb.push(wx(x+1),y);
    if(ladder(x,y)&&y>0&&!blocking(x,y-1))nb.push(x,y-1);
    if(y+1<H&&!blocking(x,y+1))nb.push(x,y+1);
    return nb;
  }
  function pathStep(sx,sy,tx,ty){
    prev.fill(-1);const s=sy*W+sx;prev[s]=s;let qh=0,qt=0;queue[qt++]=s;
    let best=s,bestSc=Math.abs(ty-sy)*3+wd(tx,sx);
    while(qh<qt){
      const c=queue[qh++],cx=c%W,cy=(c/W)|0;
      if(cx===tx&&cy===ty){best=c;break;}
      const sc=Math.abs(ty-cy)*3+wd(tx,cx);if(sc<bestSc){bestSc=sc;best=c;}
      const n=nbrs(cx,cy);
      for(let i=0;i<n.length;i+=2){const k=n[i+1]*W+n[i];if(prev[k]<0){prev[k]=c;queue[qt++]=k;}}
    }
    if(best===s)return null;
    let c=best;while(prev[c]!==s)c=prev[c];
    return [c%W,(c/W)|0];
  }

  // ---------- digging & holes ----------
  function digBlocked(hx,ay,hy){
    return G.guards.some(g=>g.alive&&((wx(Math.round(g.px))===hx&&(Math.round(g.py)===ay||Math.round(g.py)===hy))||(g.moving&&wx(g.tx)===hx&&(g.ty===ay||g.ty===hy))));
  }
  function tryDig(p,dir){
    const tx=wx(p.x+dir),ty=p.y+1;
    if(ty>=H)return false;
    p.face=dir;
    if(tile(tx,ty)!==BRICK||G.holeGrid[ty][tx])return false;
    if(blocking(tx,p.y)||ladder(tx,p.y)||G.gold[p.y][tx])return false;
    if(digBlocked(tx,p.y,ty))return false;
    const h={x:tx,y:ty,state:'dig',t:0};G.holes.push(h);G.holeGrid[ty][tx]=h;
    p.dig={dir,t:0,h};fx('dig');pt('dig',tx,ty);
    return true;
  }
  function removeHole(h){const i=G.holes.indexOf(h);if(i>=0)G.holes.splice(i,1);G.holeGrid[h.y][h.x]=null;}
  function inCell(e,x,y){return(wx(Math.round(e.px))===x&&Math.round(e.py)===y)||(e.moving&&wx(e.tx)===x&&e.ty===y);}
  function updateHoles(sd){
    for(let i=G.holes.length-1;i>=0;i--){
      const h=G.holes[i];h.t+=sd;
      if(h.state==='dig'){if(h.t>=DIG_T){h.state='open';h.t=0;G.map[h.y][h.x]=HOLE;}}
      else if(h.state==='open'){if(h.t>=OPEN_T){h.state='fill';h.t=0;}}
      else if(h.t>=FILL_T){
        G.map[h.y][h.x]=BRICK;removeHole(h);
        if(G.state==='play'&&inCell(G.P,h.x,h.y))die();
        for(const g of G.guards)if(g.alive&&inCell(g,h.x,h.y))killGuard(g);
      }
    }
  }

  // ---------- player ----------
  function playerDecide(p,input){
    if(!supported(p.x,p.y,p)){startMove(p,0,1,'fall');return;}
    if(input.digL&&tryDig(p,-1))return;
    if(input.digR&&tryDig(p,1))return;
    for(const d of input.order){
      if(d==='up'){if(ladder(p.x,p.y)&&p.y>0&&!blocking(p.x,p.y-1)){startMove(p,0,-1,'climb');return;}}
      else if(d==='down'){
        if(p.y<H-1&&!blocking(p.x,p.y+1)&&!guardOcc(p.x,p.y+1,null)){startMove(p,0,1,(ladder(p.x,p.y)||ladder(p.x,p.y+1))?'climb':'drop');return;}
      } else {
        const dx=d==='left'?-1:1;
        if(!blocking(p.x+dx,p.y)){startMove(p,dx,0,'side');return;}
        p.face=dx;
      }
    }
    p.mk='idle';
  }
  function rev(e){let a=e.x;e.x=e.tx;e.tx=a;a=e.y;e.y=e.ty;e.ty=a;if(e.x<0||e.x>=W){const k=e.x<0?W:-W;e.x+=k;e.tx+=k;e.px+=k;}if(e.tx!==e.x)e.face=Math.sign(e.tx-e.x);}
  function maybeReverse(p,input){
    const dx=p.tx-p.x,dy=p.ty-p.y,h=input.held;
    if(dx){const b=dx>0?'left':'right',f=dx>0?'right':'left';if(h[b]&&!h[f])rev(p);}
    else if(dy&&p.mk==='climb'){const b=dy>0?'up':'down',f=dy>0?'down':'up';if(h[b]&&!h[f])rev(p);}
  }
  function playerArrive(p){
    if(G.gold[p.y][p.x]){
      G.gold[p.y][p.x]=false;G.goldLeft--;G.score+=250;fx('gold');pt('gold',p.x,p.y);
      if(G.goldLeft===0)reveal();
    }
    if(G.goldLeft===0&&p.y===0)win();
  }
  function reveal(){G.revealed=true;G.revealT=G.t;fx('reveal');pt('reveal');}
  function win(){if(G.state!=='play')return;G.state='won';G.score+=1500;fx('win');hooks.onWin&&hooks.onWin();}
  function die(){if(G.state!=='play')return;G.state='dying';G.dyingT=0;fx('die');pt('die',G.P.px,G.P.py);hooks.onDie&&hooks.onDie();}

  // ---------- guards ----------
  function guardDecide(g){
    if(g.state!=='walk'||g.spawnT>0||g.wait>0)return;
    const P=G.P;
    if(g.escaping){
      g.escaping=false;
      const pref=Math.sign(P.x-g.x)||(Math.random()<.5?-1:1);
      for(const d of [pref,-pref]){
        const nx=g.x+d;
        if(!blocking(nx,g.y)&&!guardOcc(nx,g.y,g)&&tile(nx,g.y)!==HOLE){startMove(g,d,0,'side');return;}
      }
    }
    if(!supported(g.x,g.y,g)){if(!guardOcc(g.x,g.y+1,g))startMove(g,0,1,'fall');return;}
    const st=pathStep(g.x,g.y,Math.round(P.px),Math.round(P.py));
    if(st&&!guardOcc(st[0],st[1],g)){
      const dx=st[0]-g.x,dy=st[1]-g.y;
      startMove(g,dx,dy,dy<0?'climb':dy>0?((ladder(g.x,g.y)||ladder(st[0],st[1]))?'climb':'drop'):'side');
      return;
    }
    g.wait=0.2;
  }
  function guardArrive(g){
    if(tile(g.x,g.y)===HOLE&&G.holeGrid[g.y][g.x]){
      g.state='trapped';g.trapT=0;g.moving=false;G.score+=75;fx('trap');
      if(g.gold){const ay=g.y-1,t=tile(g.x,ay);
        if(ay>=0&&!G.gold[ay][g.x]&&(t===EMPTY||t===ROPE||t===HLAD)){G.gold[ay][g.x]=true;g.gold=false;}}
      return;
    }
    if(g.gold){
      if(--g.goldSteps<=0&&tile(g.x,g.y)===EMPTY&&!G.gold[g.y][g.x]&&(tile(g.x,g.y+1)===BRICK||tile(g.x,g.y+1)===SOLID)){G.gold[g.y][g.x]=true;g.gold=false;}
    } else if(G.gold[g.y][g.x]&&Math.random()<0.55){
      G.gold[g.y][g.x]=false;g.gold=true;g.goldSteps=5+Math.floor(Math.random()*14);
    }
  }
  function killGuard(g){g.alive=false;g.deadT=1.0;g.moving=false;g.state='walk';g.escaping=false;G.score+=75;fx('kill');pt('poof',g.px,g.py);}
  function respawn(g){
    const P=G.P;let c=[];
    for(let y=0;y<5&&!c.length;y++)for(let x=0;x<W;x++)
      if(tile(x,y)===EMPTY&&!G.gold[y][x]&&!guardOcc(x,y,g)&&Math.abs(x-P.x)+Math.abs(y-P.y)>6)c.push([x,y]);
    if(!c.length)c=spawns.slice();
    const [x,y]=c[Math.floor(Math.random()*c.length)];
    Object.assign(g,{x,y,px:x,py:y,tx:x,ty:y,alive:true,state:'walk',spawnT:SPAWN_T,moving:false,trapT:0,wait:0});
  }
  function updateGuard(g,sd){
    if(!g.alive){g.deadT-=sd;if(g.deadT<=0)respawn(g);return;}
    if(g.spawnT>0){g.spawnT-=sd;return;}
    if(g.wait>0)g.wait-=sd;
    if(g.state==='trapped'){
      g.trapT+=sd;
      if(g.trapT<TRAP_T)return;
      if(!blocking(g.x,g.y-1)&&!guardOcc(g.x,g.y-1,g)){g.state='walk';g.escaping=true;startMove(g,0,-1,'climb');}
      else{g.trapT=TRAP_T-0.25;return;}
    }
    advance(g,sd*PLAYER_SPD*GUARD_RATIO,null);
  }

  // ---------- movement ----------
  function advance(e,dist,input){
    for(let n=0;n<6;n++){
      if(!e.moving){
        if(e.kind==='player')playerDecide(e,input);else guardDecide(e);
        if(!e.moving||e.dig)return;
      }
      const mul=e.mk==='fall'?FALL_MUL:e.mk==='climb'?CLIMB_MUL:1;
      const need=Math.abs(e.tx-e.px)+Math.abs(e.ty-e.py),can=dist*mul;
      if(can>=need){
        e.x=wx(e.tx);e.y=e.ty;e.tx=e.x;e.px=e.x;e.py=e.ty;e.moving=false;e.walk+=need;dist-=need/mul;
        if(e.kind==='player')playerArrive(e);else guardArrive(e);
        if(G.state!=='play'||e.state==='trapped')return;
      } else {
        e.px+=Math.sign(e.tx-e.px)*can;e.py+=Math.sign(e.ty-e.py)*can;e.walk+=can;return;
      }
    }
  }
  function updatePlayer(sd,input){
    const p=G.P;
    if(p.dig){
      p.dig.t+=sd;const h=p.dig.h;
      if(h.state==='dig'&&digBlocked(h.x,p.y,h.y)){removeHole(h);p.dig=null;}
      else if(p.dig.t>=DIG_T)p.dig=null;
      return;
    }
    if(p.moving&&p.mk!=='fall'&&p.mk!=='drop')maybeReverse(p,input);
    advance(p,sd*PLAYER_SPD,input);
  }
  function checkCollisions(){
    const p=G.P;
    for(const g of G.guards)if(g.alive&&g.spawnT<=0&&wd(g.px,p.px)<0.72&&Math.abs(g.py-p.py)<0.72){die();return;}
  }
  function update(dt,input){
    if(G.state==='dying'){G.dyingT+=dt;return;}
    if(G.state!=='play')return;
    const sd=dt*G.spd;G.t+=sd;
    updateHoles(sd);if(G.state!=='play')return;
    updatePlayer(sd,input);if(G.state!=='play')return;
    for(const g of G.guards)updateGuard(g,sd);
    checkCollisions();
  }
  return {G,update,tile,ladder,rope,floorAt,restartDie:die};
}
if(typeof module!=='undefined')module.exports={createGame,W,H};
