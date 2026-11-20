const {createGame}=require('./engine.js');const L=require('./levels.json');
const inp=(o={})=>({held:o.held||{},order:o.order||[],digL:!!o.digL,digR:!!o.digR});
const R=d=>inp({held:{[d]:1},order:[d]});
function run(g,i,sec){for(let t=0;t<sec;t+=1/60)g.update(1/60,i);}
function goTo(g,d,x){const P=g.G.P;let k=0;while(!(P.moving&&P.tx===x)&&!(P.x===x&&!P.moving)&&k++<3000)g.update(1/60,R(d));run(g,inp(),0.3);}
let g=createGame(L[0].rows);const P=g.G.P;
goTo(g,'right',12);console.log('at',P.x,P.y);
run(g,R('up'),1.5);console.log('top',P.x,P.y);
goTo(g,'left',8);console.log('at',P.x,P.y,'gold',g.G.goldLeft);
run(g,inp({digR:1}),0.05);run(g,inp(),0.4);console.log('holes',g.G.holes.map(h=>h.state+' '+h.x+','+h.y));
run(g,R('right'),0.15);run(g,inp(),1);console.log('coffre',P.x,P.y,'gold',g.G.goldLeft);
run(g,inp({digL:1}),0.05);run(g,inp(),0.4);run(g,R('left'),0.15);run(g,inp(),1.5);console.log('out',P.x,P.y,g.G.state);
// trap scenario
const rows=[];for(let y=0;y<16;y++)rows.push(' '.repeat(28));
rows[13]='P             E             ';rows[14]='############################';rows[15]='@'.repeat(28);
g=createGame(rows,{sfx:n=>process.stdout.write('['+n+']')});const q=g.G.guards[0];
for(let t=0;t<3;t+=1/60){g.update(1/60,inp());if(q.x<=6)break;}
console.log('\nguard x',q.x);goTo(g,'right',3);run(g,inp({digR:1}),0.05);run(g,inp(),3);console.log('\nguard',q.state,q.x,q.y,'player',g.G.P.x,g.G.state);
run(g,inp(),8);console.log('\nafter',q.alive,q.x,q.y,g.G.state,g.G.score);
