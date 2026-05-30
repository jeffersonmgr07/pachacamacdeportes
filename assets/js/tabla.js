function calcStandings(matches){
  const table = {};
  for(const m of matches.filter(x=>String(x.status||'').toLowerCase()==='jugado')){
    const home=m.home, away=m.away, hs=Number(m.homeScore||0), as=Number(m.awayScore||0), cat=m.category||'GENERAL';
    const keyH=cat+'|'+home, keyA=cat+'|'+away;
    if(!table[keyH]) table[keyH]={category:cat,team:home,pj:0,pg:0,pe:0,pp:0,gf:0,gc:0,dg:0,pts:0};
    if(!table[keyA]) table[keyA]={category:cat,team:away,pj:0,pg:0,pe:0,pp:0,gf:0,gc:0,dg:0,pts:0};
    const H=table[keyH], A=table[keyA];
    H.pj++; A.pj++; H.gf+=hs; H.gc+=as; A.gf+=as; A.gc+=hs;
    if(hs>as){H.pg++; A.pp++; H.pts+=3}else if(hs<as){A.pg++; H.pp++; A.pts+=3}else{H.pe++; A.pe++; H.pts++; A.pts++}
    H.dg=H.gf-H.gc; A.dg=A.gf-A.gc;
  }
  return Object.values(table).sort((a,b)=>a.category.localeCompare(b.category)||b.pts-a.pts||b.dg-a.dg||b.gf-a.gf);
}
function catOrder(c){ return Number(String(c||'').match(/\d+/)?.[0] || 999); }
document.addEventListener('DOMContentLoaded', async ()=>{
  const res = await API.getPublicData(); if(!res.ok) return;
  const rows = calcStandings(res.fixture);
  const select = document.querySelector('#standingCategory');
  const cats = [...new Set(rows.map(r=>r.category))].sort((a,b)=>catOrder(a)-catOrder(b)||a.localeCompare(b));
  if(select) select.innerHTML = cats.map(c=>`<option value="${c}">${c}</option>`).join('') || '<option>Sin resultados</option>';
  function render(){
    const current = select?.value || cats[0];
    const filtered = rows.filter(r=>r.category===current);
    document.querySelector('#standingsBody').innerHTML = filtered.length ? filtered.map((r,i)=>`
      <tr><td>${i+1}</td><td>${r.team}</td><td>${r.pj}</td><td>${r.pg}</td><td>${r.pe}</td><td>${r.pp}</td><td>${r.gf}</td><td>${r.gc}</td><td>${r.dg>0?'+':''}${r.dg}</td><td><b>${r.pts}</b></td></tr>`).join('') :
      `<tr><td colspan="10">La tabla de esta categoría se generará automáticamente cuando se carguen resultados.</td></tr>`;
  }
  select?.addEventListener('change', render); render();
});
