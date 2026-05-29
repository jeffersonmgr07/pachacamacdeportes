function calcStandings(matches){
  const table = {};
  for(const m of matches.filter(x=>x.status==='jugado')){
    const home=m.home, away=m.away, hs=Number(m.homeScore||0), as=Number(m.awayScore||0), cat=m.category||'GENERAL';
    const keyH=cat+'|'+home, keyA=cat+'|'+away;
    if(!table[keyH]) table[keyH]={category:cat,team:home,pj:0,pg:0,pe:0,pp:0,gf:0,gc:0,dg:0,pts:0};
    if(!table[keyA]) table[keyA]={category:cat,team:away,pj:0,pg:0,pe:0,pp:0,gf:0,gc:0,dg:0,pts:0};
    const H=table[keyH], A=table[keyA]; H.pj++; A.pj++; H.gf+=hs; H.gc+=as; A.gf+=as; A.gc+=hs;
    if(hs>as){H.pg++; A.pp++; H.pts+=3}else if(hs<as){A.pg++; H.pp++; A.pts+=3}else{H.pe++; A.pe++; H.pts++; A.pts++}
    H.dg=H.gf-H.gc; A.dg=A.gf-A.gc;
  }
  return Object.values(table).sort((a,b)=>a.category.localeCompare(b.category)||b.pts-a.pts||b.dg-a.dg||b.gf-a.gf);
}
document.addEventListener('DOMContentLoaded', async ()=>{
  const res = await API.getPublicData(); if(!res.ok) return;
  const rows = calcStandings(res.fixture);
  document.querySelector('#standingsBody').innerHTML = rows.length ? rows.map((r,i)=>`
    <tr><td>${i+1}</td><td>${r.category}</td><td>${r.team}</td><td>${r.pj}</td><td>${r.pg}</td><td>${r.pe}</td><td>${r.pp}</td><td>${r.gf}</td><td>${r.gc}</td><td>${r.dg>0?'+':''}${r.dg}</td><td><b>${r.pts}</b></td></tr>`).join('') :
    `<tr><td colspan="11">La tabla se generará automáticamente cuando se carguen resultados.</td></tr>`;
});
