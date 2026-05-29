let all = [];
document.addEventListener('DOMContentLoaded', async () => {
  const res = await MF.call('getTeams');
  all = res.teams || [];
  fillFilters(res.categories || []);
  render();
  ['categoryFilter','groupFilter'].forEach(id => document.getElementById(id).addEventListener('change', render));
  document.getElementById('roundFilter').style.display = 'none';
});
function fillFilters(categories){
  document.getElementById('categoryFilter').innerHTML += categories.map(c => `<option value="${c.id}">${c.label}</option>`).join('');
  document.getElementById('groupFilter').innerHTML += [...new Set(all.map(m => m.group))].map(g => `<option value="${g}">Grupo ${g}</option>`).join('');
}
function render(){
  const c = categoryFilter.value, g = groupFilter.value;
  const rows = all.filter(t => (!c || t.category===c) && (!g || t.group===g));
  pageContent.innerHTML = `<div class="grid grid-3">
    ${rows.map(t => `<article class="card"><span class="chip">${MF.categoryLabel(t.category)} · Grupo ${t.group}</span><h3>${t.name}</h3><p>ID: ${t.id}</p></article>`).join('')}
  </div>`;
}
