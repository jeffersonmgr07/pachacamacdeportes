(function(){
  const HOME_REFRESH_MS = 25000;
  const UPCOMING_DAYS_AHEAD = 2;
  let refreshTimer = null;

  function safe(value){
    return String(value ?? '').replace(/[&<>"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
  }
  function normalize(value){
    return String(value || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  }
  function getMatchId(m){ return m?.matchId || m?.id || m?.codigo || m?.[0] || ''; }
  function getDate(m){ return m?.matchDate || m?.date || m?.fecha || m?.[3] || ''; }
  function getField(m){ return m?.field || m?.campo || m?.venue || m?.[4] || ''; }
  function getTime(m){ return m?.time || m?.hora || m?.[5] || ''; }
  function getHome(m){ return m?.home || m?.local || m?.equipoLocal || m?.[6] || ''; }
  function getAway(m){ return m?.away || m?.visitante || m?.equipoVisitante || m?.[7] || ''; }
  function getCategory(m){ return m?.category || m?.categoryLabel || m?.categoria || m?.[8] || ''; }
  function getStatus(m){ return m?.status || m?.estado || m?.[9] || 'programado'; }
  function getChampionship(m){
    return m?.championship || m?.campeonato || m?.tournament || m?.torneo || m?.league || m?.competition || 'Campeonato de menores';
  }
  function getScore(m, side){
    const value = side === 'home'
      ? (m?.homeScore ?? m?.golesLocal ?? m?.localScore ?? m?.[10])
      : (m?.awayScore ?? m?.golesVisitante ?? m?.awayScore ?? m?.[11]);
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  function parseLocalDate(value){
    if(!value) return null;
    if(value instanceof Date && !Number.isNaN(value.getTime())) return new Date(value.getFullYear(), value.getMonth(), value.getDate());
    const raw = String(value).trim();
    let m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if(m) return new Date(Number(m[1]), Number(m[2])-1, Number(m[3]));
    m = raw.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
    if(m) return new Date(Number(m[3]), Number(m[2])-1, Number(m[1]));
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  function todayLocal(){
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  function addDays(date, days){
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }
  function isSameOrAfter(a,b){ return a.getTime() >= b.getTime(); }
  function isSameOrBefore(a,b){ return a.getTime() <= b.getTime(); }
  function isLiveMatch(m){
    const s = normalize(getStatus(m));
    return ['en_juego','en juego','envivo','en vivo','live','iniciado','iniciada','en curso'].includes(s);
  }
  function isFinishedOrRest(m){
    const s = normalize(getStatus(m));
    return ['jugado','finalizado','finalizada','terminado','terminada','descansa','cancelado','cancelada'].includes(s);
  }
  function isUpcomingSoon(m){
    if(isLiveMatch(m) || isFinishedOrRest(m)) return false;
    if(!getAway(m)) return false;
    const d = parseLocalDate(getDate(m));
    if(!d) return false;
    const start = todayLocal();
    const end = addDays(start, UPCOMING_DAYS_AHEAD);
    return isSameOrAfter(d,start) && isSameOrBefore(d,end);
  }
  function dateLabel(dateValue){
    const d = parseLocalDate(dateValue);
    if(!d) return safe(dateValue || 'Fecha por confirmar');
    return d.toLocaleDateString('es-PE', {weekday:'short', day:'2-digit', month:'short'}).replace('.', '');
  }
  function sortMatches(rows){
    return [...(rows || [])].sort((a,b)=>{
      const da = parseLocalDate(getDate(a))?.getTime() ?? 9999999999999;
      const db = parseLocalDate(getDate(b))?.getTime() ?? 9999999999999;
      if(da !== db) return da - db;
      return String(getTime(a) || '99:99').localeCompare(String(getTime(b) || '99:99')) || String(getMatchId(a)).localeCompare(String(getMatchId(b)));
    });
  }
  function renderLiveCard(m){
    const home = getHome(m), away = getAway(m);
    return `<article class="home-event-card home-event-card-live">
      <div class="home-event-topline">
        <span class="badge badge-red live-pulse">● En vivo</span>
        <span class="badge badge-blue">${safe(getChampionship(m))}</span>
        <span class="badge badge-green">${safe(getCategory(m) || 'Categoría')}</span>
      </div>
      <div class="home-live-score">
        <strong>${safe(home)}</strong>
        <span>${getScore(m,'home')} - ${getScore(m,'away')}</span>
        <strong>${safe(away)}</strong>
      </div>
      <div class="home-event-foot">
        <span>${safe(getField(m) || 'Campo por confirmar')}</span>
        <span>${safe(formatTime12(getTime(m) || ''))}</span>
      </div>
    </article>`;
  }
  function renderUpcomingCard(m){
    const home = getHome(m), away = getAway(m);
    return `<article class="home-event-card">
      <div class="home-event-topline">
        <span class="badge badge-gold">Próximo</span>
        <span class="badge badge-blue">${safe(getChampionship(m))}</span>
        <span class="badge badge-green">${safe(getCategory(m) || 'Categoría')}</span>
      </div>
      <div class="home-upcoming-match">
        <strong>${safe(home)}</strong>
        <span>VS</span>
        <strong>${safe(away)}</strong>
      </div>
      <div class="home-event-foot">
        <span>${dateLabel(getDate(m))}</span>
        <span>${safe(formatTime12(getTime(m) || 'Por definir'))}</span>
        <span>${safe(getField(m) || 'Campo por confirmar')}</span>
      </div>
    </article>`;
  }
  function renderHomeEvents(data){
    const section = document.querySelector('#homeLiveEventsSection');
    if(!section) return;
    const fixture = sortMatches((data?.fixture || []).filter(m => getAway(m)));
    const live = fixture.filter(isLiveMatch);
    const upcoming = fixture.filter(isUpcomingSoon).slice(0, 8);
    const liveBox = document.querySelector('#homeLiveMatches');
    const upcomingBox = document.querySelector('#homeUpcomingMatches');
    const liveWrap = document.querySelector('#homeLiveWrap');
    const upcomingWrap = document.querySelector('#homeUpcomingWrap');

    if(!live.length && !upcoming.length){
      section.hidden = true;
      return;
    }
    section.hidden = false;
    if(liveWrap) liveWrap.hidden = !live.length;
    if(upcomingWrap) upcomingWrap.hidden = !upcoming.length;
    if(liveBox) liveBox.innerHTML = live.map(renderLiveCard).join('');
    if(upcomingBox) upcomingBox.innerHTML = upcoming.map(renderUpcomingCard).join('');
  }
  async function loadHomeEvents(){
    try{
      const res = await API.getPublicData({silent:true});
      if(res?.ok) renderHomeEvents(res);
    }catch(err){
      const section = document.querySelector('#homeLiveEventsSection');
      if(section) section.hidden = true;
      console.warn('No se pudo cargar la sección de próximos partidos/en vivo', err);
    }
  }
  document.addEventListener('DOMContentLoaded', ()=>{
    if(!document.querySelector('#homeLiveEventsSection') || !window.API) return;
    loadHomeEvents();
    clearInterval(refreshTimer);
    refreshTimer = setInterval(loadHomeEvents, HOME_REFRESH_MS);
  });
})();
