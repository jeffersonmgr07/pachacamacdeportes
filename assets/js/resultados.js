function resultCatOrder(c){ return Number(String(c||'').match(/\d+/)?.[0] || 999); }
function resultStatusText(m){
  const type = String(m.resultType || 'normal').toLowerCase();
  if(type === 'wo' || type === 'w.o.' || type === 'w.o') return 'W.O.';
  if(type === 'reclamo') return 'Reclamo';
  return 'Normal';
}
document.addEventListener('DOMContentLoaded', async ()=>{
  const res = await API.getPublicData(); if(!res.ok) return;
  const tbody = document.querySelector('#resultsBody');
  const roundFilter = document.querySelector('#resultRound');
  const categoryFilter = document.querySelector('#resultCategory');
  const teamFilter = document.querySelector('#resultTeam');
  const rows = sortFixtureRows(res.fixture.filter(m=>String(m.status||'').toLowerCase()==='jugado'));
  const rounds = [...new Set(rows.map(m=>m.round).filter(Boolean))].sort((a,b)=>Number(a)-Number(b));
  const cats = [...new Set(rows.map(m=>m.category).filter(Boolean))].sort((a,b)=>resultCatOrder(a)-resultCatOrder(b)||String(a).localeCompare(String(b)));
  const teams = [...new Set(rows.flatMap(m=>[m.home,m.away]).filter(Boolean))].sort();
  if(roundFilter) roundFilter.innerHTML = '<option value="">Todas las fechas</option>' + rounds.map(r=>`<option value="${r}">Fecha ${r}</option>`).join('');
  if(categoryFilter) categoryFilter.innerHTML = '<option value="">Todas las categorías</option>' + cats.map(c=>`<option value="${c}">${c}</option>`).join('');
  if(teamFilter) teamFilter.innerHTML = '<option value="">Todos los equipos</option>' + teams.map(t=>`<option value="${t}">${t}</option>`).join('');
  function render(){
    const r = roundFilter?.value || '';
    const c = categoryFilter?.value || '';
    const t = teamFilter?.value || '';
    const filtered = rows.filter(m => (!r || String(m.round)===String(r)) && (!c || m.category===c) && (!t || m.home===t || m.away===t));
    tbody.innerHTML = filtered.length ? filtered.map(m=>`
      <tr><td>Fecha ${m.round}<br><small>${m.dateLabel||''}</small></td><td>${m.category}</td><td>${m.home}</td><td class="score">${m.homeScore ?? ''} - ${m.awayScore ?? ''}</td><td>${m.away}</td><td>${resultStatusText(m)}</td></tr>`).join('') :
      `<tr><td colspan="6">No hay resultados con estos filtros.</td></tr>`;
  }
  [roundFilter,categoryFilter,teamFilter].forEach(el=>el?.addEventListener('change', render));
  render();
});
