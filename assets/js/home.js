
document.addEventListener('DOMContentLoaded', async ()=>{
  const res = await API.getPublicData();
  if(!res.ok) return;
  const current = Number(window.APP_CONFIG.CURRENT_ROUND || 3);
  const next = res.fixture.filter(m=>Number(m.round)===current).slice(0,6);
  const box = document.querySelector('#homeNextMatches');
  if(box) box.innerHTML = next.map(m=>`
    <div class="card match-card match-card-visual">
      <div class="match-meta"><span class="badge badge-green">${m.category||m[8]}</span><span class="badge badge-green">${m.field||m[4]}</span><span class="badge badge-green">${formatTime12(m.time||m[5])}</span></div>
      <div class="match-vs-logos">
        <div class="team-side"><img src="${teamLogoPath(m.home||m[6])}" onerror="this.src='assets/img/logo-pacha-deportes.svg'"><span>${m.home||m[6]}</span></div>
        <b>VS</b>
        <div class="team-side right"><img src="${teamLogoPath(m.away||m[7])}" onerror="this.src='assets/img/logo-pacha-deportes.svg'"><span>${m.away||m[7]}</span></div>
      </div>
    </div>`).join('');
});
