document.addEventListener('DOMContentLoaded', async ()=>{
  const user = Store.getUser();
  if(!user || user.role !== 'admin'){ location.href='login.html'; return; }
  const res = await API.getPublicData(); if(!res.ok) return;
  document.querySelector('#adminSummary').innerHTML = `
    <div class="card"><div class="stat-number">${res.trainers.length}</div><div class="stat-label">Entrenadores</div></div>
    <div class="card"><div class="stat-number">${res.players.length}</div><div class="stat-label">Jugadores</div></div>
    <div class="card"><div class="stat-number">${res.fixture.length}</div><div class="stat-label">Partidos</div></div>`;
  document.querySelector('#accessBody').innerHTML = res.users.map(u=>`
    <tr><td>${u.fullName}</td><td>${u.role}</td><td>${u.email}</td><td>${u.password}</td><td>${u.teamName||''}</td><td>${u.status}</td></tr>`).join('');
});
