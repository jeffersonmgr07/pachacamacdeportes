function matchVal(m, key, index){return m[key] ?? m[index];}
document.addEventListener('DOMContentLoaded', async ()=>{
  const res = await API.getPublicData(); if(!res.ok) return;
  const tbody = document.querySelector('#fixtureBody');
  const cat = document.querySelector('#filterCategory');
  const round = document.querySelector('#filterRound');
  const cats = [...new Set(res.fixture.map(m=>matchVal(m,'category',8)).filter(Boolean))].sort();
  const rounds = [...new Set(res.fixture.map(m=>matchVal(m,'round',1)).filter(Boolean))].sort((a,b)=>a-b);
  if(cat) cat.innerHTML = '<option value="">Todas las categorías</option>' + cats.map(c=>`<option>${c}</option>`).join('');
  if(round) round.innerHTML = '<option value="">Todas las fechas</option>' + rounds.map(r=>`<option value="${r}">Fecha ${r}</option>`).join('');
  function render(){
    const c = cat?.value || '', r = round?.value || '';
    const rows = res.fixture.filter(m=>(!c||matchVal(m,'category',8)===c)&&(!r||String(matchVal(m,'round',1))===String(r)));
    tbody.innerHTML = rows.map(m=>`
      <tr>
        <td>${matchVal(m,'dateLabel',2)}</td><td>${matchVal(m,'field',4)}</td><td>${formatTime12(matchVal(m,'time',5))}</td>
        <td>${matchVal(m,'home',6)}</td><td>VS</td><td>${matchVal(m,'away',7)}</td><td>${matchVal(m,'category',8)}</td>
        <td>${matchVal(m,'status',9) === 'jugado' ? `${matchVal(m,'homeScore',10)} - ${matchVal(m,'awayScore',11)}` : (matchVal(m,'status',9) || 'programado')}</td>
      </tr>`).join('');
  }
  cat?.addEventListener('change',render); round?.addEventListener('change',render); render();
});
