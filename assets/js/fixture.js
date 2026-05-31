function matchVal(m, key, index){return m[key] ?? m[index];}
function matchStatusLabel(m){
  const status = String(matchVal(m,'status',9) || 'programado').toLowerCase();
  const resultType = String(matchVal(m,'resultType',12) || 'normal').toLowerCase();
  if(status === 'jugado'){
    if(resultType === 'wo' || resultType === 'w.o.' || resultType === 'w.o') return 'Partido definido por W.O.';
    if(resultType === 'reclamo') return 'Partido definido por reclamo';
    return 'Partido jugado con normalidad';
  }
  if(status === 'suspendido') return 'Partido suspendido';
  if(status === 'cancelado') return 'Partido cancelado';
  return 'Partido programado';
}
function resultBadge(m){
  const status = String(matchVal(m,'status',9) || 'programado').toLowerCase();
  if(status === 'jugado') return `${matchVal(m,'homeScore',10)} - ${matchVal(m,'awayScore',11)}`;
  return 'VS';
}
document.addEventListener('DOMContentLoaded', async ()=>{
  const res = await API.getPublicData(); if(!res.ok) return;
  const wrap = document.querySelector('#fixtureCards');
  const cat = document.querySelector('#filterCategory');
  const round = document.querySelector('#filterRound');
  const cats = [...new Set(res.fixture.map(m=>matchVal(m,'category',8)).filter(Boolean))].sort((a,b)=>{
    const na = Number(String(a).match(/\d+/)?.[0]||999), nb = Number(String(b).match(/\d+/)?.[0]||999);
    return na-nb || String(a).localeCompare(String(b));
  });
  const rounds = [...new Set(res.fixture.map(m=>matchVal(m,'round',1)).filter(Boolean))].sort((a,b)=>Number(a)-Number(b));
  if(cat) cat.innerHTML = '<option value="">Todas las categorías</option>' + cats.map(c=>`<option>${c}</option>`).join('');
  if(round) round.innerHTML = '<option value="">Todas las fechas</option>' + rounds.map(r=>`<option value="${r}">Fecha ${r}</option>`).join('');
  function render(){
    const c = cat?.value || '', r = round?.value || '';
    const rows = sortFixtureRows(res.fixture.filter(m=>(!c||matchVal(m,'category',8)===c)&&(!r||String(matchVal(m,'round',1))===String(r))));
    const grouped = rows.reduce((acc,m)=>{ const key = matchVal(m,'round',1); (acc[key] ||= []).push(m); return acc; },{});
    wrap.innerHTML = Object.keys(grouped).sort((a,b)=>Number(a)-Number(b)).map(key=>{
      const list = grouped[key];
      return `<section class="card round-card"><div class="section-head"><div><h3>Fecha ${key}</h3><p>${matchVal(list[0],'dateLabel',2)||''}</p></div><span class="badge badge-green">${list.length} partido(s)</span></div><div class="fixture-grid">${list.map(m=>`
        <article class="fixture-match-card ${String(matchVal(m,'status',9)).toLowerCase()==='jugado'?'played':''}">
          <div class="match-meta"><span class="badge badge-green">${matchVal(m,'category',8)}</span><span class="badge badge-green">${matchVal(m,'field',4)}</span><span class="badge badge-green">${formatTime12(matchVal(m,'time',5))}</span></div>
          <div class="match-vs-logos">
            <div class="team-side"><img src="${teamLogoPath(matchVal(m,'home',6))}" onerror="this.src='assets/img/logo-pacha-deportes.svg'"><span>${matchVal(m,'home',6)}</span></div>
            <b class="result-pill">${resultBadge(m)}</b>
            <div class="team-side right"><img src="${teamLogoPath(matchVal(m,'away',7))}" onerror="this.src='assets/img/logo-pacha-deportes.svg'"><span>${matchVal(m,'away',7)}</span></div>
          </div>
          <p class="match-status-text"><b>Estado:</b> ${matchStatusLabel(m)}</p>
        </article>`).join('')}</div></section>`;
    }).join('') || '<div class="card">No hay partidos con estos filtros.</div>';
  }
  cat?.addEventListener('change',render); round?.addEventListener('change',render); render();
});
