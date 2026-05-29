document.addEventListener('DOMContentLoaded', async ()=>{
  const res = await API.getPublicData(); if(!res.ok) return;
  const tbody = document.querySelector('#resultsBody');
  const rows = res.fixture.filter(m=>m.status==='jugado');
  tbody.innerHTML = rows.length ? rows.map(m=>`
    <tr><td>${m.dateLabel}</td><td>${m.category}</td><td>${m.home}</td><td class="score">${m.homeScore ?? ''} - ${m.awayScore ?? ''}</td><td>${m.away}</td><td>${m.resultType||'normal'}</td></tr>`).join('') :
    `<tr><td colspan="6">Todavía no hay resultados cargados en la hoja de cálculo.</td></tr>`;
});
