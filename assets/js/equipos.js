function teamCategories(t){
  const raw = t.categories || 'SUB 6, SUB 8, SUB 10, SUB 12';
  return String(raw).split(',').map(c=>c.trim()).filter(Boolean);
}
function teamLogo(t){
  return t.crestUrl || t.crest || `assets/img/equipos/${String(t.teamId || 'equipo').toLowerCase()}.png`;
}
document.addEventListener('DOMContentLoaded', async ()=>{
  const res = await API.getPublicData(); if(!res.ok) return;
  const box = document.querySelector('#teamsGrid');
  const list = (res.teams && res.teams.length) ? res.teams : res.trainers;
  box.innerHTML = list.map(t=>`
    <article class="card team-public-card">
      <div class="team-public-info">
        <h3>${t.teamName}</h3>
        <p><strong>Entrenador:</strong> ${t.coachName || t.shortName || t.fullName || 'Pendiente'}</p>
        <div class="team-cat-badges">${teamCategories(t).map(c=>`<span class="badge badge-green">${c.replace('SUB','Sub')}</span>`).join('')}</div>
      </div>
      <img class="team-public-logo" src="${teamLogo(t)}" onerror="this.src='assets/img/logo-pacha-deportes.svg'" alt="Insignia de ${t.teamName}">
    </article>`).join('');
});
