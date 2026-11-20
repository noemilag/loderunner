const TS=32;
const $=id=>document.getElementById(id);
const cv=$('cv'),ctx=cv.getContext('2d');ctx.imageSmoothingEnabled=false;
const store={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
let progress=store.get('pp_progress',{unlocked:1});
let custom=store.get('pp_custom',[]);
let settings=Object.assign({speed:1,mute:false,theme:'retro'},store.get('pp_settings',{}));
const retro=()=>settings.theme==='retro';

// ================= sound =================
let AC=null;
function ac(){if(!AC){try{AC=new(window.AudioContext||window.webkitAudioContext)()}catch(e){}}if(AC&&AC.state==='suspended')AC.resume().catch(()=>{});return AC;}
function tone(f,d,o){o=o||{};if(settings.mute)return;const a=ac();if(!a)return;const t=a.currentTime+(o.delay||0);
  const osc=a.createOscillator(),g=a.createGain();osc.type=o.type||'square';osc.frequency.setValueAtTime(f,t);
  if(o.slide)osc.frequency.exponentialRampToValueAtTime(Math.max(40,f+o.slide),t+d);
  g.gain.setValueAtTime(o.vol||.06,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);osc.connect(g).connect(a.destination);osc.start(t);osc.stop(t+d+.03);}
function noise(d,vol){if(settings.mute)return;const a=ac();if(!a)return;const b=a.createBuffer(1,a.sampleRate*d,a.sampleRate),ch=b.getChannelData(0);
  for(let i=0;i<ch.length;i++)ch[i]=(Math.random()*2-1)*(1-i/ch.length);const s=a.createBufferSource(),g=a.createGain(),f=a.createBiquadFilter();
  f.type='lowpass';f.frequency.value=900;s.buffer=b;g.gain.value=vol;s.connect(f).connect(g).connect(a.destination);s.start();}
const SFX={
  gold(){tone(988,.07,{vol:.05});tone(1480,.12,{vol:.05,delay:.06});},
  dig(){noise(.2,.18);tone(160,.12,{type:'triangle',vol:.1,slide:-70});},
  trap(){tone(260,.2,{type:'triangle',vol:.12,slide:320});},
  kill(){tone(420,.3,{type:'sawtooth',vol:.05,slide:-330});},
  die(){[660,523,415,330,262].forEach((f,i)=>tone(f,.15,{vol:.06,delay:i*.12}));},
  reveal(){[523,659,784,1047,1319].forEach((f,i)=>tone(f,.13,{vol:.05,delay:i*.08}));},
  win(){[523,659,784,659,784,1047].forEach((f,i)=>tone(f,.17,{type:'triangle',vol:.12,delay:i*.11}));},
  click(){tone(660,.05,{vol:.04});}
};

// ================= sprites =================
function mk(w,h,fn){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');fn(x);return c;}
const SPRM={};let SPR=SPRM;
SPRM.brick=mk(32,32,x=>{x.fillStyle='#6b2619';x.fillRect(0,0,32,32);
  const b=(bx,by,w)=>{x.fillStyle='#c2553a';x.fillRect(bx,by,w,14);x.fillStyle='#e07a57';x.fillRect(bx,by,w,2);x.fillStyle='#93392a';x.fillRect(bx,by+12,w,2);x.fillStyle='#d4694a';x.fillRect(bx+2,by+4,2,2);};
  b(1,1,14);b(17,1,14);b(0,17,7);b(9,17,14);b(25,17,7);});
SPRM.solid=mk(32,32,x=>{x.fillStyle='#4a5070';x.fillRect(0,0,32,32);x.fillStyle='#737b9e';x.fillRect(0,0,32,3);x.fillRect(0,0,3,32);
  x.fillStyle='#2b2f48';x.fillRect(0,29,32,3);x.fillRect(29,0,3,32);x.fillStyle='#575e80';x.fillRect(7,7,18,18);
  x.fillStyle='#9aa2c4';[[8,8],[22,8],[8,22],[22,22]].forEach(([a,c])=>x.fillRect(a,c,2,2));});
function ladderSpr(r1,r2,g1,g2){return mk(32,32,x=>{x.fillStyle=r1;x.fillRect(5,0,4,32);x.fillRect(23,0,4,32);x.fillStyle=r2;x.fillRect(5,0,2,32);x.fillRect(23,0,2,32);
  for(let y=3;y<32;y+=8){x.fillStyle=g1;x.fillRect(9,y,14,3);x.fillStyle=g2;x.fillRect(9,y,14,1);}});}
SPRM.ladder=ladderSpr('#7c4a1e','#c98d4a','#a8692f','#e3a868');
SPRM.esc=ladderSpr('#0f766e','#5eead4','#14b8a6','#a7f3d0');
SPRM.rope=mk(32,32,x=>{x.fillStyle='#6b4f2a';x.fillRect(0,5,32,3);x.fillStyle='#e2c08a';for(let i=0;i<32;i+=4)x.fillRect(i,5,2,2);});
SPRM.gold=mk(32,32,x=>{x.fillStyle='rgba(0,0,0,.3)';x.fillRect(5,29,22,2);
  const bar=(bx,by)=>{x.fillStyle='#a16207';x.fillRect(bx,by+2,12,6);x.fillStyle='#eab308';x.fillRect(bx+1,by,10,6);x.fillStyle='#fde047';x.fillRect(bx+2,by,8,2);x.fillStyle='#fffbeb';x.fillRect(bx+2,by+1,2,1);};
  bar(5,22);bar(15,22);bar(10,16);});
SPRM.trapEd=mk(32,32,x=>{x.drawImage(SPRM.brick,0,0);x.fillStyle='rgba(20,0,30,.45)';x.fillRect(0,0,32,32);x.strokeStyle='#f0abfc';x.lineWidth=2;x.setLineDash([4,3]);x.strokeRect(3,3,26,26);});
SPRM.escEd=mk(32,32,x=>{x.globalAlpha=.55;x.drawImage(SPRM.esc,0,0);x.globalAlpha=1;x.strokeStyle='#5eead4';x.lineWidth=2;x.setLineDash([4,3]);x.strokeRect(2,2,28,28);});
SPRM.bg=mk(W*TS,H*TS,x=>{const g=x.createLinearGradient(0,0,0,H*TS);g.addColorStop(0,'#1b2150');g.addColorStop(1,'#0b0d1f');x.fillStyle=g;x.fillRect(0,0,W*TS,H*TS);
  let s=11;const r=()=>(s=(s*16807)%2147483647)/2147483647;
  for(let i=0;i<220;i++){x.fillStyle=`rgba(170,180,255,${.04+r()*.12})`;const z=r()<.85?2:4;x.fillRect((r()*W*TS)|0,(r()*H*TS)|0,z,z);}
  for(let i=0;i<14;i++){x.fillStyle='rgba(253,224,71,.12)';x.fillRect((r()*W*TS)|0,(r()*H*TS)|0,2,2);}});

const PAL={
  miner:{a:'#facc15',a2:'#b45309',hi:'#fef08a',lamp:'#fffbe0',skin:'#f6c99f',eye:'#1f2937',hair:'#7c3f1d',body:'#3b82f6',body2:'#1e40af',leg:'#1e3a8a',foot:'#5b3a1e',arm:'#2563eb',hand:'#f6c99f'},
  robot:{a:'#c084fc',a2:'#6b21a8',hi:'#f3e8ff',visor:'#1a1530',eye:'#ff4d6d',ant:'#fda4af',body:'#a78bfa',body2:'#5b21b6',chest:'#f0abfc',leg:'#5b21b6',foot:'#2e1065',arm:'#8b5cf6',hand:'#e9d5ff'}
};
function drawChar(c,kind,X,Y,pose,f,face,o){
  o=o||{};const P=PAL[kind],u=2;
  const R=(x,y,w,h,col)=>{if(face<0)x=16-x-w;c.fillStyle=col;c.fillRect(X+x*u,Y+y*u,w*u,h*u);};
  const back=pose==='climb';
  switch(pose){
    case 'run':if(f===0){R(9,12,2,2,P.leg);R(10,13,2,2,P.leg);R(10,15,3,1,P.foot);R(5,12,2,2,P.leg);R(4,13,2,1,P.leg);R(3,14,2,1,P.foot);}
      else{R(6,12,2,3,P.leg);R(8,12,2,3,P.leg);R(6,15,2,1,P.foot);R(9,15,2,1,P.foot);}break;
    case 'climb':if(f===0){R(5,12,2,2,P.leg);R(5,14,2,1,P.foot);R(9,12,2,3,P.leg);R(9,15,2,1,P.foot);}
      else{R(5,12,2,3,P.leg);R(5,15,2,1,P.foot);R(9,12,2,2,P.leg);R(9,14,2,1,P.foot);}break;
    case 'hang':{const s=f?1:0;R(6,12,2,2+s,P.leg);R(8,12,2,3-s,P.leg);R(6,14+s,2,1,P.foot);R(8,15-s,2,1,P.foot);}break;
    case 'fall':R(4,12,2,2,P.leg);R(3,14,2,1,P.foot);R(10,12,2,2,P.leg);R(11,14,2,1,P.foot);break;
    default:R(5,12,2,3,P.leg);R(9,12,2,3,P.leg);R(4,15,3,1,P.foot);R(9,15,3,1,P.foot);
  }
  if(kind==='miner'){R(5,8,6,4,P.body);R(6,8,1,3,P.body2);R(9,8,1,3,P.body2);R(5,11,6,1,P.leg);R(7,9,2,1,'#fbbf24');}
  else{R(5,7,6,5,P.body);R(5,11,6,1,P.body2);R(7,8,2,2,P.chest);}
  const A=P.arm,Hd=P.hand;
  switch(pose){
    case 'run':if(f===0){R(11,8,1,2,A);R(12,9,1,2,A);R(12,11,1,1,Hd);R(4,8,1,2,A);R(3,9,1,2,A);R(3,11,1,1,Hd);}
      else{R(4,8,1,4,A);R(11,8,1,4,A);R(4,12,1,1,Hd);R(11,12,1,1,Hd);}break;
    case 'climb':if(f===0){R(3,3,1,6,A);R(3,2,1,1,Hd);R(12,6,1,5,A);R(12,5,1,1,Hd);}else{R(12,3,1,6,A);R(12,2,1,1,Hd);R(3,6,1,5,A);R(3,5,1,1,Hd);}break;
    case 'hang':R(3,3,1,6,A);R(12,3,1,6,A);R(3,2,1,1,Hd);R(12,2,1,1,Hd);break;
    case 'fall':R(3,4,1,4,A);R(12,4,1,4,A);R(3,3,1,1,Hd);R(12,3,1,1,Hd);break;
    case 'dig':R(4,8,1,4,A);R(4,12,1,1,Hd);
      if(f===0){R(11,8,2,1,A);R(13,8,1,1,Hd);R(13,7,1,1,'#8b5a2b');R(14,6,1,1,'#8b5a2b');R(13,4,3,1,'#cbd5e1');R(15,5,1,1,'#94a3b8');R(12,4,1,1,'#94a3b8');}
      else{R(11,9,2,1,A);R(13,9,1,1,Hd);R(14,10,1,1,'#8b5a2b');R(15,11,1,1,'#8b5a2b');R(14,13,2,1,'#cbd5e1');R(15,12,1,1,'#94a3b8');}break;
    default:R(4,8,1,4,A);R(11,8,1,4,A);R(4,12,1,1,Hd);R(11,12,1,1,Hd);
  }
  if(kind==='miner'){
    R(5,1,6,1,P.a);R(4,2,8,2,P.a);R(5,2,3,1,P.hi);R(3,4,10,1,P.a2);
    if(back)R(5,5,6,3,P.hair);
    else{R(10,2,2,2,P.lamp);R(5,5,6,3,P.skin);R(9,6,1,1,P.eye);R(10,7,1,1,'#e8a37c');}
  } else {
    R(7,0,2,1,P.ant);R(4,1,8,6,P.a);R(4,1,8,1,P.hi);R(4,6,8,1,P.a2);R(5,3,6,2,P.visor);
    if(!back)R(8,3,2,2,o.eye||P.eye);else R(7,3,2,1,P.a2);
  }
  if(o.gold){R(10,10,4,2,'#eab308');R(10,10,4,1,'#fde047');}
}

// ---------- rétro 1985 : gros pixels de 4 px ----------
const SPRR={};
function px8(x,rows,cols){rows.forEach((r,y)=>{for(let i=0;i<r.length;i++){const ch=r[i];if(ch!=='.'&&cols[ch]){x.fillStyle=cols[ch];x.fillRect(i*4,y*4,4,4);}}});}
SPRR.brick=mk(32,32,x=>px8(x,['bbbbbbb.','bbbbbbb.','bbbbbbb.','........','bbb.bbbb','bbb.bbbb','bbb.bbbb','........'],{b:'#d0581c'}));
SPRR.solid=mk(32,32,x=>px8(x,['llllllll','lsssssss','lsssssss','lsssssss','lsssssss','lsssssss','lsssssss','ssssssss'],{l:'#b9c3d6',s:'#7a86a3'}));
SPRR.ladder=mk(32,32,x=>px8(x,['.w....w.','.wwwwww.','.w....w.','.w....w.','.w....w.','.wwwwww.','.w....w.','.w....w.'],{w:'#f2f2f2'}));
SPRR.esc=mk(32,32,x=>px8(x,['.w....w.','.wwwwww.','.w....w.','.w....w.','.w....w.','.wwwwww.','.w....w.','.w....w.'],{w:'#5ef2e6'}));
SPRR.rope=mk(32,32,x=>px8(x,['........','wwwwwwww'],{w:'#f2f2f2'}));
SPRR.gold=mk(32,32,x=>px8(x,['........','........','........','........','..yyyy..','.yoooyy.','.yyyyyy.','.yyyyyy.'],{y:'#ffd23f',o:'#b8860b'}));
SPRR.trapEd=mk(32,32,x=>{x.drawImage(SPRR.brick,0,0);x.fillStyle='rgba(0,0,0,.5)';x.fillRect(0,0,32,32);x.strokeStyle='#ff4fd8';x.lineWidth=4;x.setLineDash([4,4]);x.strokeRect(2,2,28,28);});
SPRR.escEd=mk(32,32,x=>{x.globalAlpha=.6;x.drawImage(SPRR.esc,0,0);});
SPRR.bg=mk(W*TS,H*TS,x=>{x.fillStyle='#000';x.fillRect(0,0,W*TS,H*TS);});
// Bonshommes allumettes 8×8, tournés vers la droite
const STICK={
 stand:[['...##...','...##...','..####..','.#.##.#.','...##...','..#..#..','..#..#..','..#..#..']],
 run:[['....##..','....##..','..####..','.#..#.#.','....#...','...#.#..','..#...#.','.#.....#'],
      ['....##..','....##..','...###..','...##.#.','....#...','....#...','...##...','...#.#..']],
 climb:[['#..##...','.#.##...','..####.#','...##.#.','...##...','..#..#..','..#..#..','..#.....'],
        ['...##..#','...##.#.','#.####..','.#.##...','...##...','..#..#..','..#..#..','.....#..']],
 hang:[['.#....#.','.#.##.#.','..####..','...##...','...##...','..#..#..','..#..#..','..#..#..'],
       ['.#....#.','.#.##.#.','..####..','...##...','...##...','...#.#..','..#..#..','..#...#.']],
 fall:[['#..##..#','.#.##.#.','..####..','...##...','...##...','..#..#..','.#....#.','#......#']],
 dig:[['........','...##...','...##...','..####..','...##.#.','..#..#.#','..#..#..','.##..##.'],
      ['........','...##...','...##...','..###...','...####.','..#..#.#','..#..#.#','.##..##.']]
};
function drawStick(c,kind,X,Y,pose,f,face,o){
  const fr=(STICK[pose]||STICK.stand);const rows=fr[f%fr.length];
  c.fillStyle=kind==='miner'?'#ffffff':'#ff4fd8';
  for(let y=0;y<8;y++)for(let i=0;i<8;i++)if(rows[y][i]==='#'){const xx=face<0?7-i:i;c.fillRect(X+xx*4,Y+y*4,4,4);}
  if(o&&o.gold){c.fillStyle='#ffd23f';c.fillRect(X+(face<0?4:24),Y+16,4,4);}
}
function drawFig(c,kind,X,Y,pose,f,face,o){if(retro())drawStick(c,kind,X,Y,pose,f,face,o);else drawChar(c,kind,X,Y,pose,f,face,o);}
function applyTheme(){SPR=retro()?SPRR:SPRM;document.body.classList.toggle('retro',retro());buildIcons();buildPal();}

function icon(fn){return mk(32,32,fn).toDataURL();}
let ICON={};function buildIcons(){ICON={
  '#':icon(x=>x.drawImage(SPR.brick,0,0)),'@':icon(x=>x.drawImage(SPR.solid,0,0)),'H':icon(x=>x.drawImage(SPR.ladder,0,0)),
  '-':icon(x=>x.drawImage(SPR.rope,0,8)),'$':icon(x=>x.drawImage(SPR.gold,0,0)),'S':icon(x=>x.drawImage(SPR.escEd,0,0)),
  'X':icon(x=>x.drawImage(SPR.trapEd,0,0)),'P':icon(x=>drawFig(x,'miner',0,0,'stand',0,1)),'E':icon(x=>drawFig(x,'robot',0,0,'stand',0,-1)),
  ' ':icon(x=>{x.strokeStyle='#fb7185';x.lineWidth=3;x.beginPath();x.moveTo(8,8);x.lineTo(24,24);x.moveTo(24,8);x.lineTo(8,24);x.stroke();})
};}

// ================= particles =================
let parts=[];
function burst(x,y,n,cols,sp,grav,life){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,v=sp*(.4+Math.random());
  parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-sp*.3,g:grav,life,max:life,c:cols[i%cols.length],s:Math.random()<.5?2:4});}}
function particles(kind,x,y){
  const cx=x*TS+16,cy=y*TS+16;
  if(kind==='gold')burst(cx,cy,14,['#fde047','#fbbf24','#fffbeb'],150,250,.6);
  else if(kind==='dig')burst(cx,cy-10,10,['#c2553a','#93392a','#e07a57'],90,500,.5);
  else if(kind==='poof')burst(cx,cy,18,['#c084fc','#f0abfc','#ffffff'],140,80,.7);
  else if(kind==='die')burst(cx,cy,26,['#facc15','#3b82f6','#ffffff','#fb7185'],180,300,1);
  else if(kind==='reveal'&&game){const M=game.G.map;for(let yy=0;yy<H;yy++)for(let xx=0;xx<W;xx++)if(M[yy][xx]===6)burst(xx*TS+16,yy*TS+16,3,['#5eead4','#a7f3d0','#ffffff'],60,-20,.9);}
}

// ================= state =================
let mode='menu',game=null,preview=null,cur=null,lives=5,score=0,started=false,winT=-1,testing=false;
const hooks={sfx:n=>{if(n==='dig'){digL=digR=0;digLH=digRH=false;}SFX[n]&&SFX[n]();},particles,onWin(){winT=0;}};

function levelLabel(){if(!cur)return'';return cur.custom?(testing?'Test : ':'Mon niveau : ')+cur.level.name:'Niveau '+(cur.index+1)+' · '+cur.level.name;}
function startLevel(c,fresh){
  cur=c;if(fresh){lives=5;score=0;}
  game=createGame(c.level.rows,hooks);game.G.score=score;game.G.spd=settings.speed;
  started=false;winT=-1;parts=[];mode='play';closeOv();
  $('tip').textContent=c.level.tip||'';updHud(true);ac();
}
function restartSame(){startLevel(cur,false);}
function playBuiltin(i,fresh){startLevel({index:i,level:LEVELS[i],custom:false},fresh);}

// ================= input =================
const held={left:false,right:false,up:false,down:false};let order=[];let digL=0,digR=0,digLH=false,digRH=false;
const KM={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down'};
addEventListener('keydown',e=>{
  if(e.target&&(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'))return;
  const d=KM[e.code];
  if(d){e.preventDefault();if(!held[d]){held[d]=true;order=[d,...order.filter(o=>o!==d)];}}
  if(e.code==='KeyZ'||e.code==='KeyQ'){digLH=true;digL=performance.now();e.preventDefault();}
  if(e.code==='KeyX'||e.code==='KeyE'){digRH=true;digR=performance.now();e.preventDefault();}
  if(e.code==='Space')e.preventDefault();
  if(e.repeat)return;
  if(e.code==='Escape'||e.code==='KeyP'){if(mode==='play')pause();else if(mode==='pause')resume();}
  if(e.code==='KeyR'&&mode==='play'&&game&&game.G.state==='play'&&started)game.restartDie();
  if(e.code==='Enter'||e.code==='Space'){const b=document.querySelector('#ov.on .pri');if(b){e.preventDefault();b.click();}}
});
addEventListener('keyup',e=>{const d=KM[e.code];if(d){held[d]=false;order=order.filter(o=>o!==d);}
  if(e.code==='KeyZ'||e.code==='KeyQ')digLH=false;if(e.code==='KeyX'||e.code==='KeyE')digRH=false;});
addEventListener('blur',()=>{for(const k in held)held[k]=false;order=[];digLH=digRH=false;if(mode==='play'&&started)pause();});
function getInput(){const n=performance.now();return{held,order:order.filter(d=>held[d]),digL:digLH||n-digL<450,digR:digRH||n-digR<450};}

// ================= overlays =================
const ov=$('ov');
function openOv(html){ov.innerHTML=html;ov.classList.add('on');const b=ov.querySelector('.pri');if(b)b.focus({preventScroll:true});}
function closeOv(){ov.classList.remove('on');ov.innerHTML='';}
ov.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b||b.disabled)return;SFX.click();act(b.dataset.a,b.dataset.v);});
function themeSeg(){return `<div class="seg">${[['retro','Look 1985'],['moderne','Look moderne']].map(([v,l])=>`<button data-a="theme" data-v="${v}" class="${settings.theme===v?'on':''}">${l}</button>`).join('')}</div>`;}
function speedSeg(){return `<div class="seg">${[[.75,'Tortue'],[1,'Normale'],[1.2,'Lièvre']].map(([v,l])=>`<button data-a="speed" data-v="${v}" class="${settings.speed==v?'on':''}">${l}</button>`).join('')}</div>`;}
function showMenu(){
  mode='menu';testing=false;game=null;cur=null;$('tip').textContent='';showEditBar(false);updHud(true);
  const n=Math.min(progress.unlocked,LEVELS.length);
  openOv(`<div class="panel"><h1 class="logo">Runner</h1>
  <p>Ramasse toutes les pépites, creuse des trous pour piéger les robots gardiens, puis grimpe tout en haut par l'échelle de sortie.</p>
  <div class="col"><button class="btn pri" data-a="play">▶ Jouer · niveau ${n}</button>
  <button class="btn" data-a="select">Choisir un niveau</button>
  <button class="btn" data-a="editor">Atelier de niveaux</button>
  <button class="btn" data-a="help">Comment jouer</button></div>${speedSeg()}<br>${themeSeg()}</div>`);
}
function showSelect(){
  mode='menu';
  const b=LEVELS.map((l,i)=>`<button class="card" data-a="lvl" data-v="${i}" ${i<progress.unlocked?'':'disabled'}><b>${i+1}</b><span>${i<progress.unlocked?esc(l.name):'Verrouillé'}</span></button>`).join('');
  const c=custom.map((l,i)=>`<button class="card" data-a="clvl" data-v="${i}"><b>★</b><span>${esc(l.name)}</span></button>`).join('');
  openOv(`<div class="panel" style="width:min(680px,100%)"><h2>Choisis ta mine</h2><div class="grid">${b}</div>
  ${custom.length?`<div class="sub">Mes niveaux</div><div class="grid">${c}</div>`:''}
  <div class="row"><button class="btn pri" data-a="menu">Retour</button></div></div>`);
}
function showHelp(){
  const L=[['P','Toi, le mineur'],['E','Robot gardien'],['$','Pépite d\'or'],['#','Brique (on peut creuser)'],['@','Roc (impossible à creuser)'],['H','Échelle'],['-','Corde'],['S','Échelle de sortie (apparaît à la fin)']];
  openOv(`<div class="panel" style="width:min(640px,100%)"><h2>Comment jouer</h2>
  <div class="keys"><span><kbd>←</kbd> <kbd>→</kbd></span><span>Courir, et avancer sur les cordes</span>
  <span><kbd>↑</kbd> <kbd>↓</kbd></span><span>Grimper aux échelles, lâcher une corde</span>
  <span><kbd>Z</kbd> <kbd>X</kbd></span><span>Creuser un trou en bas à gauche ou à droite</span>
  <span><kbd>Échap</kbd></span><span>Pause · <kbd>R</kbd> recommence le niveau (coûte une vie)</span></div>
  <div class="legend">${L.map(([k,t])=>`<div><img src="${ICON[k]}" alt="">${t}</div>`).join('')}</div>
  <p>Un robot qui tombe dans ton trou reste coincé un moment : tu peux marcher sur sa tête. Si le trou se referme sur lui, il réapparaît en haut. Attention, le trou se referme aussi sur toi !</p>
  <div class="row"><button class="btn pri" data-a="menu">Compris !</button></div></div>`);
}
function pause(){if(mode!=='play')return;mode='pause';
  openOv(`<div class="panel"><h2>Pause</h2><p>${esc(levelLabel())}</p><div class="col"><button class="btn pri" data-a="resume">Continuer</button>
  <button class="btn" data-a="retry">Recommencer (−1 vie)</button>${testing?'<button class="btn" data-a="editor">Retour à l\'Atelier</button>':''}<button class="btn" data-a="menu">Menu principal</button></div>${speedSeg()}</div>`);}
function resume(){mode='play';closeOv();}
function showWin(){
  mode='won';score=game.G.score;
  let next='';
  if(testing){next='<button class="btn pri" data-a="editor">Retour à l\'Atelier</button>';}
  else if(!cur.custom){progress.unlocked=Math.max(progress.unlocked,Math.min(cur.index+2,LEVELS.length+1));store.set('pp_progress',progress);
    lives=Math.min(9,lives+1);
    next=cur.index+1<LEVELS.length?'<button class="btn pri" data-a="next">Niveau suivant ▶</button>':'<button class="btn pri" data-a="editor">Créer mon propre niveau</button>';}
  else next='<button class="btn pri" data-a="select">Autres niveaux</button>';
  const last=!cur.custom&&!testing&&cur.index+1>=LEVELS.length;
  openOv(`<div class="panel"><h2>${last?'Toutes les mines sont vidées !':'Bravo !'}</h2>
  <p>${last?'Tu as terminé tous les niveaux. Et si vous inventiez les vôtres dans l\'Atelier ?':'Toutes les pépites sont à toi.'+(cur.custom?'':' Une vie bonus en prime !')}</p>
  <p style="font:400 40px 'Lilita One';color:var(--ink);margin:4px 0 16px">${score.toLocaleString('fr-CA')} pts</p>
  <div class="row">${next}<button class="btn" data-a="retry0">Rejouer</button><button class="btn" data-a="menu">Menu</button></div></div>`);
}
function showOver(){mode='over';
  openOv(`<div class="panel"><h2>Plus de vies…</h2><p>Les robots ont gagné cette manche. On réessaie ?</p>
  <div class="row"><button class="btn pri" data-a="again">Réessayer ce niveau</button>${testing?'<button class="btn" data-a="editor">Retour à l\'Atelier</button>':''}<button class="btn" data-a="menu">Menu</button></div></div>`);}
function act(a,v){
  if(a==='play')playBuiltin(Math.min(progress.unlocked,LEVELS.length)-1,true);
  else if(a==='select')showSelect();
  else if(a==='help')showHelp();
  else if(a==='menu')showMenu();
  else if(a==='editor')openEditor();
  else if(a==='lvl')playBuiltin(+v,true);
  else if(a==='clvl'){testing=false;startLevel({custom:true,level:custom[+v]},true);}
  else if(a==='resume')resume();
  else if(a==='retry'){mode='play';closeOv();game.restartDie();}
  else if(a==='retry0'){startLevel(cur,false);}
  else if(a==='next')playBuiltin(cur.index+1,false);
  else if(a==='again'){lives=5;startLevel(cur,false);}
  else if(a==='theme'){settings.theme=v;store.set('pp_settings',settings);applyTheme();preview=null;showMenu();}
  else if(a==='speed'){settings.speed=+v;store.set('pp_settings',settings);if(game)game.G.spd=settings.speed;ov.querySelectorAll('.seg button[data-a=speed]').forEach(b=>b.classList.toggle('on',b.dataset.v==v));}
  else if(a==='edLoad'){const l=custom[+v];ED.grid=l.rows.map(r=>r.split(''));$('edName').value=l.name;closeOv();mode='editor';}
  else if(a==='edPlay'){const l=custom[+v];testing=true;ED.grid=l.rows.map(r=>r.split(''));$('edName').value=l.name;startLevel({custom:true,level:l},true);showEditBar(false);}
  else if(a==='edDel'){custom.splice(+v,1);store.set('pp_custom',custom);showMine();}
  else if(a==='edClose'){closeOv();mode='editor';}
  else if(a==='copy'){const t=$('code');t.select();(navigator.clipboard?navigator.clipboard.writeText(t.value):Promise.reject()).then(()=>toast('Code copié !'),()=>toast('Sélectionne le texte et copie-le'));}
  else if(a==='import'){const r=decode($('imp').value.trim());if(!r){toast('Code invalide');return;}ED.grid=r.rows.map(s=>s.split(''));$('edName').value=r.name;closeOv();mode='editor';toast('Niveau importé !');}
}
function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
let toastT=0;function toast(m){const t=$('toast');t.textContent=m;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('on'),2000);}

// ================= HUD =================
let hudKey='';
function updHud(force){
  const G=game&&game.G;
  const k=mode+'|'+(G?G.goldLeft+'|'+G.score:'')+'|'+lives+'|'+settings.mute+'|'+(cur?levelLabel():'');
  if(k===hudKey&&!force)return;hudKey=k;
  const ed=mode==='editor';
  if(retro()&&G&&!ed){$('lvl').innerHTML=(cur.custom?'MON NIVEAU':'NIVEAU '+String(cur.index+1).padStart(3,'0'))+'<small>'+esc(cur.level.name)+'</small>';}else $('lvl').innerHTML=ed?'Atelier de niveaux<small>Clic pour poser, clic droit pour effacer</small>':cur?esc(levelLabel())+'<small>'+(testing?'Mode test':'Runner')+'</small>':'Runner<small>Une mine, des pépites, des robots</small>';
  $('stats').style.visibility=G&&!ed?'visible':'hidden';
  if(G){$('sGold').textContent=(G.totalGold-G.goldLeft)+'/'+G.totalGold;$('sScore').textContent=G.score.toLocaleString('fr-CA');$('sLives').textContent='♥'.repeat(Math.max(0,lives));}
  $('bSound').textContent=settings.mute?'✕':'♪';$('bPause').style.visibility=G&&!ed?'visible':'hidden';
}
$('bPause').onclick=()=>{if(mode==='play')pause();else if(mode==='pause')resume();};
$('bSound').onclick=()=>{settings.mute=!settings.mute;store.set('pp_settings',settings);updHud(true);if(!settings.mute)SFX.gold();};
$('bMenu').onclick=()=>{if(mode==='play'||mode==='pause'){pause();}else showMenu();};

// ================= rendering =================
function drawMap(gm,t,editor){
  const G=gm.G;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    const v=G.map[y][x],X=x*TS,Y=y*TS,h=G.holeGrid[y][x];
    if(h)continue;
    if(v===1||v===5)ctx.drawImage(SPR.brick,X,Y);
    else if(v===2)ctx.drawImage(SPR.solid,X,Y);
    else if(v===3)ctx.drawImage(SPR.ladder,X,Y);
    else if(v===4)ctx.drawImage(SPR.rope,X,Y);
    else if(v===6&&G.revealed){ctx.drawImage(SPR.esc,X,Y);}
  }
  for(const h of G.holes){const X=h.x*TS,Y=h.y*TS;
    if(h.state==='dig'){const k=Math.min(1,h.t/0.3),c=Math.floor(k*30);ctx.drawImage(SPR.brick,0,c,32,32-c,X,Y+c,32,32-c);}
    else if(h.state==='open'){ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillRect(X,Y,32,32);ctx.fillStyle='#3a140d';ctx.fillRect(X,Y+28,32,4);}
    else{const k=Math.min(1,h.t/0.9),c=Math.ceil(k*32);ctx.drawImage(SPR.brick,0,32-c,32,c,X,Y+32-c,32,c);}
  }
  for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(G.gold[y][x]){
    ctx.drawImage(SPR.gold,x*TS,y*TS);
    const ph=(t*1.3+x*.37+y*.71)%3;
    if(ph<.35&&!retro()){const s=ph<.17?2:4;ctx.fillStyle='#fffbeb';ctx.fillRect(x*TS+20,y*TS+16-s/2,2,s+2);ctx.fillRect(x*TS+21-s/2-1,y*TS+17,s+2,2);}
  }
}
function poseOf(gm,e,G){
  if(e.dig)return['dig',e.dig.t<.15?0:1];
  if(e.state==='trapped')return['hang',Math.floor(G.t*6)%2];
  const fr=Math.floor(e.walk*3)%2;
  if(e.moving){
    if(e.mk==='fall'||e.mk==='drop')return['fall',0];
    if(e.mk==='climb')return['climb',fr];
    if(gm.rope(e.x,e.y)||gm.rope(e.tx,e.ty))return['hang',fr];
    return['run',fr];
  }
  if(gm.rope(e.x,e.y))return['hang',0];
  if(gm.ladder(e.x,e.y)&&!gm.floorAt(e.x,e.y+1))return['climb',0];
  return['stand',0];
}
function wrapX(X){const r=[X];if(X<0)r.push(X+W*TS);else if(X>(W-1)*TS)r.push(X-W*TS);return r;}
function drawEntities(gm,t){
  const G=gm.G;
  for(const g of G.guards){if(!g.alive)continue;if(g.spawnT>0&&Math.floor(t*14)%2)continue;
    const [p,f]=poseOf(gm,g,G);let X=g.px*TS,Y=g.py*TS;
    if(g.state==='trapped'&&g.trapT>2.2)X+=Math.sin(t*60)*2;
    for(const ox of wrapX(X))drawFig(ctx,'robot',Math.round(ox),Math.round(Y),p,f,g.face,{gold:g.gold});}
  const P=G.P;
  if(G.state==='dying'){if(Math.floor(G.dyingT*10)%2)return;}
  const [p,f]=poseOf(gm,P,G);
  if(p!=='climb'&&!retro()){const lx=P.px*TS+(P.face>0?24:8),ly=P.py*TS+6;const gr=ctx.createRadialGradient(lx,ly,1,lx,ly,26);gr.addColorStop(0,'rgba(255,245,200,.22)');gr.addColorStop(1,'rgba(255,245,200,0)');ctx.fillStyle=gr;ctx.fillRect(lx-26,ly-26,52,52);}
  for(const ox of wrapX(P.px*TS))drawFig(ctx,'miner',Math.round(ox),Math.round(P.py*TS),p,f,P.face);
}
function drawParts(dt){
  for(let i=parts.length-1;i>=0;i--){const q=parts[i];q.life-=dt;if(q.life<=0){parts.splice(i,1);continue;}
    q.vy+=q.g*dt;q.x+=q.vx*dt;q.y+=q.vy*dt;ctx.globalAlpha=Math.min(1,q.life/q.max*1.6);ctx.fillStyle=q.c;if(retro())ctx.fillRect((q.x>>2)<<2,(q.y>>2)<<2,4,4);else ctx.fillRect(q.x|0,q.y|0,q.s,q.s);}
  ctx.globalAlpha=1;
}
function banner(txt,sub,a){
  ctx.globalAlpha=a;ctx.fillStyle=retro()?'#000':'rgba(9,11,28,.8)';const w=Math.max(420,txt.length*(retro()?21:17)+60);ctx.fillRect(448-w/2,206,w,sub?100:70);
  ctx.strokeStyle=retro()?'#fff':'#fbbf24';ctx.lineWidth=retro()?4:3;ctx.strokeRect(448-w/2+1.5,207.5,w-3,(sub?100:70)-3);
  ctx.fillStyle=retro()?'#ffd23f':'#fbbf24';ctx.font=retro()?'20px "Press Start 2P",monospace':'30px "Lilita One",system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(txt,448,sub?240:241);
  if(sub){ctx.fillStyle='#f6f0dc';ctx.font=retro()?'11px "Press Start 2P",monospace':'800 16px Nunito,system-ui';ctx.fillText(sub,448,276);}
  ctx.globalAlpha=1;
}
let last=performance.now();
function frame(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;const t=now/1000;
  ctx.drawImage(SPR.bg,0,0);
  if(mode==='editor'){drawEditor(t);}
  else if(game){
    const G=game.G;
    if(mode==='play'){
      const inp=getInput();
      if(!started&&(inp.order.length||inp.digL||inp.digR))started=true;
      if(started)game.update(dt,inp);
      if(G.state==='dying'&&G.dyingT>1.4){lives--;score=G.score;if(lives<=0){showOver();}else restartSame();}
      if(winT>=0){winT+=dt;if(winT>.9){winT=-1;showWin();}}
      updHud();
    }
    drawMap(game,t);drawEntities(game,t);drawParts(mode==='pause'?0:dt);
    if(mode==='play'&&!started)banner(levelLabel(),isTouch?'Touche la croix pour commencer':'Appuie sur une flèche pour commencer',1);
    else if(mode==='play'&&G.revealed&&G.t-G.revealT<2.4&&G.revealT>0)banner('La sortie est ouverte !','Grimpe tout en haut par l\'échelle turquoise',Math.min(1,(2.4-(G.t-G.revealT))*2));
  } else {
    if(!preview)preview=createGame(LEVELS[0].rows,{});drawMap(preview,t);drawEntities(preview,t);
  }
  requestAnimationFrame(frame);
}

// ================= editor =================
const TOOLS=[['#','Brique'],['@','Roc'],['H','Échelle'],['-','Corde'],['$','Pépite'],['P','Mineur'],['E','Gardien'],['S','Sortie'],['X','Fausse brique'],[' ','Gomme']];
const ED={grid:null,tool:'#',paint:false,erase:false,hover:null};
function blank(){const g=[];for(let y=0;y<H;y++)g.push((y===H-1?'@'.repeat(W):' '.repeat(W)).split(''));g[H-2][1]='P';return g;}
const pal=$('pal');
function buildPal(){pal.innerHTML=TOOLS.map(([k,l])=>`<button data-t="${k}" class="${k===ED.tool?'on':''}"><img src="${ICON[k]}" alt="">${l}</button>`).join('');}
pal.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;ED.tool=b.dataset.t;pal.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));});
function showEditBar(on){$('editbar').style.display=on?'flex':'none';$('help').style.display=on?'none':'flex';fit();}
function openEditor(){
  if(!ED.grid){ED.grid=blank();$('edName').value='Mon niveau';}
  mode='editor';testing=false;game=null;cur=null;closeOv();$('tip').textContent='';showEditBar(true);updHud(true);
}
function edRows(){return ED.grid.map(r=>r.join(''));}
function edSet(x,y,c){
  const g=ED.grid;if(x<0||y<0||x>=W||y>=H)return;
  if(g[y][x]===c)return;
  if(c==='P'){for(const r of g)for(let i=0;i<W;i++)if(r[i]==='P')r[i]=' ';}
  if(c==='E'&&g.flat().filter(v=>v==='E').length>=8){toast('8 gardiens maximum');return;}
  g[y][x]=c;
}
function cellOf(e){const r=cv.getBoundingClientRect();return[Math.floor((e.clientX-r.left)/r.width*W),Math.floor((e.clientY-r.top)/r.height*H)];}
cv.addEventListener('pointerdown',e=>{if(mode!=='editor')return;e.preventDefault();ED.paint=true;ED.erase=e.button===2;cv.setPointerCapture(e.pointerId);const [x,y]=cellOf(e);edSet(x,y,ED.erase?' ':ED.tool);});
cv.addEventListener('pointermove',e=>{if(mode!=='editor')return;const [x,y]=cellOf(e);ED.hover=[x,y];if(ED.paint){const c=ED.erase?' ':ED.tool;if(c!=='P')edSet(x,y,c);}});
cv.addEventListener('pointerup',()=>ED.paint=false);cv.addEventListener('pointerleave',()=>ED.hover=null);
cv.addEventListener('contextmenu',e=>{if(mode==='editor')e.preventDefault();});
function drawEditor(t){
  const g=ED.grid;
  ctx.strokeStyle='rgba(169,174,214,.08)';ctx.lineWidth=1;
  for(let x=1;x<W;x++){ctx.beginPath();ctx.moveTo(x*TS+.5,0);ctx.lineTo(x*TS+.5,H*TS);ctx.stroke();}
  for(let y=1;y<H;y++){ctx.beginPath();ctx.moveTo(0,y*TS+.5);ctx.lineTo(W*TS,y*TS+.5);ctx.stroke();}
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const c=g[y][x],X=x*TS,Y=y*TS;
    if(c==='#')ctx.drawImage(SPR.brick,X,Y);else if(c==='@')ctx.drawImage(SPR.solid,X,Y);else if(c==='H')ctx.drawImage(SPR.ladder,X,Y);
    else if(c==='-')ctx.drawImage(SPR.rope,X,Y);else if(c==='X')ctx.drawImage(SPR.trapEd,X,Y);else if(c==='S')ctx.drawImage(SPR.escEd,X,Y);
    else if(c==='$')ctx.drawImage(SPR.gold,X,Y);else if(c==='P')drawFig(ctx,'miner',X,Y,'stand',0,1);else if(c==='E')drawFig(ctx,'robot',X,Y,'stand',0,-1);}
  if(ED.hover){const [x,y]=ED.hover;ctx.strokeStyle='#fbbf24';ctx.lineWidth=2;ctx.strokeRect(x*TS+1,y*TS+1,30,30);}
}
function validate(){const f=ED.grid.flat();
  if(!f.includes('P')){toast('Place le mineur quelque part');return false;}
  if(!f.includes('$')){toast('Ajoute au moins une pépite');return false;}
  return true;}
function edName(){return($('edName').value||'Mon niveau').trim().slice(0,28)||'Mon niveau';}
$('eTest').onclick=()=>{if(!validate())return;testing=true;showEditBar(false);startLevel({custom:true,level:{name:edName(),rows:edRows()}},true);
  if(!ED.grid.flat().includes('S')&&!ED.grid[0].some(c=>c==='H'))toast('Astuce : ajoute une échelle de sortie qui monte jusqu\'en haut');};
$('eSave').onclick=()=>{if(!validate())return;const n=edName(),i=custom.findIndex(l=>l.name===n);const l={name:n,rows:edRows()};
  if(i>=0)custom[i]=l;else custom.push(l);store.set('pp_custom',custom);toast('« '+n+' » enregistré');};
$('eClear').onclick=()=>{ED.grid=blank();toast('Grille vidée');};
function showMine(){mode='edmodal';
  openOv(`<div class="panel"><h2>Mes niveaux</h2>${custom.length?`<div class="mylist">${custom.map((l,i)=>`<div class="it"><span>${esc(l.name)}</span><button class="btn" data-a="edPlay" data-v="${i}">Jouer</button><button class="btn" data-a="edLoad" data-v="${i}">Modifier</button><button class="btn" data-a="edDel" data-v="${i}" aria-label="Supprimer">✕</button></div>`).join('')}</div>`:'<p>Aucun niveau enregistré pour l\'instant. Dessine-en un, puis appuie sur Enregistrer.</p>'}
  <p style="font-size:13px">Les niveaux sont gardés dans ce navigateur seulement. Utilise Partager pour les envoyer ailleurs.</p>
  <div class="row"><button class="btn pri" data-a="edClose">Fermer</button></div></div>`);}
$('eMine').onclick=showMine;
function encode(){const s=edName()+'|'+edRows().join('');return'PP1.'+btoa(unescape(encodeURIComponent(s)));}
function decode(c){try{if(!c.startsWith('PP1.'))return null;const s=decodeURIComponent(escape(atob(c.slice(4))));const i=s.lastIndexOf('|');const body=s.slice(i+1);
  if(body.length!==W*H)return null;const rows=[];for(let y=0;y<H;y++)rows.push(body.slice(y*W,y*W+W));return{name:s.slice(0,i)||'Niveau importé',rows};}catch(e){return null}}
$('eShare').onclick=()=>{mode='edmodal';openOv(`<div class="panel"><h2>Partager</h2><p>Copie ce code pour garder ou envoyer ce niveau.</p>
  <textarea id="code" readonly>${encode()}</textarea><div class="row" style="margin:10px 0 18px"><button class="btn" data-a="copy">Copier le code</button></div>
  <p>Ou colle le code d'un niveau ici pour l'ouvrir :</p><textarea id="imp" placeholder="PP1.…"></textarea>
  <div class="row" style="margin-top:10px"><button class="btn" data-a="import">Importer</button><button class="btn pri" data-a="edClose">Fermer</button></div></div>`);};


// ================= tactile =================
let isTouch=false;
function enableTouch(){if(isTouch)return;isTouch=true;document.body.classList.add('touch');
  if(document.documentElement.requestFullscreen)$('bFull').classList.add('ok');fit();}
// Seulement sur téléphone/tablette (pas de souris, pas de survol) : jamais sur un ordinateur
if(matchMedia('(hover:none) and (pointer:coarse)').matches)enableTouch();
const dpad=$('dpad'),knob=dpad.querySelector('i');let padId=null;
function setDir(d){for(const k of ['left','right','up','down']){const on=k===d;
    if(on&&!held[k]){held[k]=true;order=[k,...order.filter(o=>o!==k)];}
    if(!on&&held[k]&&padId!==null){held[k]=false;order=order.filter(o=>o!==k);}}
  dpad.querySelectorAll('span').forEach(s=>s.classList.toggle('on',d&&s.className.startsWith({left:'l',right:'r',up:'u',down:'d'}[d])));}
function padMove(e){const r=dpad.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),dist=Math.hypot(dx,dy),R=r.width/2;
  const k=Math.min(1,dist/R)*R*.33;knob.style.transform=`translate(${dist?dx/dist*k:0}px,${dist?dy/dist*k:0}px)`;
  setDir(dist<R*.18?null:Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'up':'down'));}
dpad.addEventListener('pointerdown',e=>{e.preventDefault();padId=e.pointerId;dpad.setPointerCapture(e.pointerId);ac();padMove(e);});
dpad.addEventListener('pointermove',e=>{if(e.pointerId===padId)padMove(e);});
function padEnd(e){if(e.pointerId!==padId)return;setDir(null);padId=null;knob.style.transform='';}
dpad.addEventListener('pointerup',padEnd);dpad.addEventListener('pointercancel',padEnd);
function digBtn(id,side){const b=$(id);
  b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);b.classList.add('on');ac();
    if(side<0){digLH=true;digL=performance.now();}else{digRH=true;digR=performance.now();}try{navigator.vibrate&&navigator.vibrate(12)}catch(_){}});
  const up=()=>{b.classList.remove('on');if(side<0)digLH=false;else digRH=false;};
  b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);b.addEventListener('contextmenu',e=>e.preventDefault());}
digBtn('digL',-1);digBtn('digR',1);
$('bFull').onclick=()=>{const d=document;try{(d.fullscreenElement?d.exitFullscreen():d.documentElement.requestFullscreen({navigationUI:'hide'})).then(()=>setTimeout(fit,200)).catch(()=>toast('Plein écran non disponible ici'));}catch(_){toast('Plein écran non disponible ici');}};
document.addEventListener('dblclick',e=>{if(isTouch)e.preventDefault();},{passive:false});

// ================= layout =================
function fit(){const ed=$('editbar').style.display==='flex';
  if(isTouch&&!ed){const land=innerWidth>innerHeight;
    const pad=Math.round(Math.max(110,Math.min(170,(land?innerHeight*0.42:innerWidth*0.38))));document.documentElement.style.setProperty('--pad',pad+'px');
    const w=land?Math.min(innerWidth-2*pad-60,(innerHeight-70)*W/H+16):Math.min(innerWidth-16,(innerHeight-pad-150)*W/H+16);
    document.documentElement.style.setProperty('--w',Math.max(240,Math.min(w,1180))+'px');return;}
  const reserve=ed?250:130;
  const w=Math.max(280,Math.min(innerWidth-24,(innerHeight-reserve)*W/H+20,1180));document.documentElement.style.setProperty('--w',w+'px');}
addEventListener('resize',fit);fit();
applyTheme();
showMenu();
requestAnimationFrame(frame);
