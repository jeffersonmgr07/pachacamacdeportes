let all = [];
document.addEventListener('DOMContentLoaded', async () => {
  const res = await MF.call('getFixture');
  all = res.fixture || [];
  fillFilters(res.categories || []);
  render();
  ['categoryFilter','groupFilter','roundFilter'].forEach(id => document.getElementById(id).addEventListener('change', render));
});
function fillFilters(categories){
  document.getElementById('categoryFilter').innerHTML += categories.map(c => `<option value="${c.id}">${c.label}</option>`).join('');
  document.getElementById('groupFilter').innerHTML += [...new Set(all.map(m => m.group))].map(g => `<option value="${g}">Grupo ${g}</option>`).join('');
  document.getElementById('roundFilter').innerHTML += [...new Set(all.map(m => m.round))].sort((a,b)=>a-b).map(r => `<option value="${r}">Fecha ${r}</option>`).join('');
}
function render(){
  const c = categoryFilter.value, g = groupFilter.value, r = roundFilter.value;
  const rows = all.filter(m => (!c || m.category===c) && (!g || m.group===g) && (!r || String(m.round)===r));
  pageContent.innerHTML = `<div class="grid grid-3">
    ${rows.map(m => `<article class="card">
      <span class="chip">${MF.categoryLabel(m.category)} · Grupo ${m.group}</span>
      <h3>${m.home} <span style="color:#94a3b8">vs</span> ${m.away}</h3>
      <p>${m.dateLabel} · ${m.time} · ${m.field}</p>
      <div style="margin-top:14px">${m.status==='jugado' ? `<span class="score">${m.homeScore} - ${m.awayScore}</span>` : `<span class="status ${m.status}">${m.status}</span>`}</div>
    </article>`).join('')}
  </div>`;
}
