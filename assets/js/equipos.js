document.addEventListener('DOMContentLoaded', async ()=>{
  const res = await API.getPublicData(); if(!res.ok) return;
  const box = document.querySelector('#teamsGrid');
  box.innerHTML = res.trainers.map(t=>`
    <article class="card">
      <span class="badge badge-green">${t.teamName}</span>
      <h3>${t.teamName}</h3>
      <p>Entrenador: ${t.shortName || t.fullName}</p>
      <p>Correo: ${t.email}</p>
    </article>`).join('');
});
