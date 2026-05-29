document.addEventListener('DOMContentLoaded', async () => {
  const res = await MF.call('getPublicData');
  const d = res.data;
  const pending = d.fixture.filter(m => m.status !== 'jugado' && Number(m.round) >= 3);
  const nextRound = pending.length ? Math.min(...pending.map(m => Number(m.round))) : null;
  const next = pending.filter(m => Number(m.round) === nextRound).slice(0,3);
  document.getElementById('homeNextMatches').innerHTML = next.map(m => `
    <div class="match-mini">
      <small>${m.dateLabel} · ${m.field} · ${MF.categoryLabel(m.category)} ${m.group}</small>
      <div class="match-line"><span>${m.home}</span><span>vs</span><span>${m.away}</span></div>
    </div>`).join('');
  document.getElementById('homeMetrics').innerHTML = [
    ['Categorías', d.rules.categories.length],
    ['Equipos', d.teams.length],
    ['Partidos', d.fixture.length],
    ['Jugadores demo', d.players.length],
  ].map(([k,v]) => `<div class="card metric"><div><span class="chip">${k}</span><br><strong>${v}</strong></div><span style="font-size:34px">⚽</span></div>`).join('');
  document.getElementById('homeResults').innerHTML = d.fixture.slice(0,8).map(m => `
    <tr><td>${m.dateLabel}</td><td>${MF.categoryLabel(m.category)} ${m.group}</td><td>${m.field} · ${m.time}</td><td><b>${m.home}</b> vs <b>${m.away}</b></td><td><span class="status ${m.status}">${m.status}</span></td></tr>
  `).join('');
});
