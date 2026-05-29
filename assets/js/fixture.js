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
  pageContent.innerHTML = `<div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Hora</th><th>Campo</th><th>Categoría</th><th>Local</th><th>Marcador</th><th>Visitante</th><th>Estado</th></tr></thead><tbody>
    ${rows.map(m => `<tr><td>${m.dateLabel}</td><td>${m.time}</td><td>${m.field}</td><td>${MF.categoryLabel(m.category)} ${m.group}</td><td><b>${m.home}</b></td><td>${m.status === 'jugado' ? `<span class="score">${m.homeScore} - ${m.awayScore}</span>` : 'vs'}</td><td><b>${m.away}</b></td><td><span class="status ${m.status}">${m.status}</span></td></tr>`).join('')}
  </tbody></table></div>`;
}
