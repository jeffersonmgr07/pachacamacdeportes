let table = [];
document.addEventListener('DOMContentLoaded', async () => {
  const res = await MF.call('getFixture');
  table = MF.calculateStandings(res.fixture || []);
  fillFilters(res.categories || []);
  render();
  ['categoryFilter','groupFilter'].forEach(id => document.getElementById(id).addEventListener('change', render));
  document.getElementById('roundFilter').style.display = 'none';
});
function fillFilters(categories){
  document.getElementById('categoryFilter').innerHTML += categories.map(c => `<option value="${c.id}">${c.label}</option>`).join('');
  document.getElementById('groupFilter').innerHTML += [...new Set(table.map(m => m.group))].map(g => `<option value="${g}">Grupo ${g}</option>`).join('');
}
function render(){
  const c = categoryFilter.value, g = groupFilter.value;
  const rows = table.filter(t => (!c || t.category===c) && (!g || t.group===g));
  pageContent.innerHTML = `<div class="table-wrap"><table><thead><tr><th>Pos</th><th>Categoría</th><th>Grupo</th><th>Equipo</th><th>PJ</th><th>PG</th><th>PE</th><th>PP</th><th>GF</th><th>GC</th><th>DG</th><th>PTS</th></tr></thead><tbody>
    ${rows.map((t,i) => `<tr><td><b>${i+1}</b></td><td>${MF.categoryLabel(t.category)}</td><td>${t.group}</td><td><b>${t.team}</b></td><td>${t.pj}</td><td>${t.pg}</td><td>${t.pe}</td><td>${t.pp}</td><td>${t.gf}</td><td>${t.gc}</td><td>${t.dg > 0 ? '+'+t.dg : t.dg}</td><td><b>${t.pts}</b></td></tr>`).join('')}
  </tbody></table></div>`;
}
