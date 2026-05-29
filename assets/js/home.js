document.addEventListener('DOMContentLoaded', async ()=>{
  const res = await API.getPublicData();
  if(!res.ok) return;
  const next = res.fixture.filter(m=>Number(m.round)===window.APP_CONFIG.CURRENT_ROUND).slice(0,4);
  const box = document.querySelector('#homeNextMatches');
  if(box) box.innerHTML = next.map(m=>`
    <div class="card match-card">
      <div class="match-meta"><span class="badge badge-green">${m.category||m[8]}</span><span class="badge badge-blue">${m.field||m[4]}</span><span class="badge badge-gold">${m.time||m[5]}</span></div>
      <div class="match-teams"><span>${m.home||m[6]}</span><span>VS</span><span class="away">${m.away||m[7]}</span></div>
    </div>`).join('');
});
