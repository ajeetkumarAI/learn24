/* Daily challenge: one question per day (the same for everyone), streaks, XP levels, badges, activity calendar and a shareable streak card. */
(async function () {
  const app = document.getElementById('daily'), base = app.dataset.base || '../';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  app.innerHTML = '<p class="muted">Loading today\'s challenge…</p>';
  let QB; try { QB = await L24.qbank(base); } catch (e) { app.innerHTML = '<p>Could not load questions. Please refresh.</p>'; return; }
  const pool = QB.questions.filter(q => q.lv !== 'easy' && q.q.length < 220 && !/tell me about yourself/i.test(q.q));
  const day = L24.today(), q = pool[L24.hash('learn24-' + day) % pool.length];
  const S = L24.S;

  function render() {
    const st = L24.streak(), lv = L24.level(S.xp), doneToday = S.daily[day], B = L24.badges();
    const pct = Math.min(100, Math.round((S.xp - lv.from) / (lv.to - lv.from) * 100));
    app.innerHTML = `
    <div class="dl-stats">
      <div class="dl-stat"><span class="dl-ic">🔥</span><b>${st}</b><small>day streak</small></div>
      <div class="dl-stat"><span class="dl-ic">⭐</span><b>${S.xp}</b><small>XP · level ${lv.n}</small><div class="mk-meter"><i class="good" style="width:${pct}%"></i></div></div>
      <div class="dl-stat"><span class="dl-ic">🏅</span><b>${B.filter(b => b.ok).length}/${B.length}</b><small>badges</small></div>
      <div class="dl-stat"><span class="dl-ic">🎯</span><b>${L24.practised()}</b><small>questions practised</small></div>
    </div>
    <div class="mk-card mk-q">
      <div class="mk-top"><span class="mk-p">Today's challenge · ${new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })}</span><span class="mk-tags">${q.t.map(t => `<span>${esc(t)}</span>`).join('')}<span class="lv-${q.lv}">${q.lv}</span></span></div>
      <h2 class="mk-qt">${esc(q.q)}</h2>
      <p class="muted mk-from">From: ${esc(q.co.join(', ') || 'Learn24')} · <a href="${base}${q.href}" target="_blank" rel="noopener">source page ↗</a></p>
      ${doneToday ? `<p class="dl-done">✅ Done for today (${doneToday.s === 1 ? 'nailed it' : doneToday.s ? 'partly' : 'review again'}). Come back tomorrow to keep your streak. 🔥</p>
        <div class="mk-act"><button class="btn ghost" id="show" type="button">Show the answer again</button><a class="btn" href="${base}mock/index.html">🎤 Take a mock interview</a></div>`
      : `<textarea id="draft" class="mk-in mk-draft" rows="5" placeholder="Think it through or type key points, then reveal the model answer…"></textarea>
        <div class="mk-act"><button class="btn" id="show" type="button">Show model answer</button></div>`}
      <div id="ans" hidden></div>
    </div>
    <div class="mk-card"><h2>Your last 10 weeks</h2>${cal()}<p class="muted">Each square is a day you practised (daily challenge, mock interview or lessons). Best streak: ${L24.best()} days.</p>
      <div class="mk-act"><button class="btn ghost" id="share" type="button">📣 Share my streak</button><a class="btn ghost" id="li" target="_blank" rel="noopener" href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://learn24-lilac.vercel.app/daily')}">Share on LinkedIn</a><a class="btn ghost" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(`I'm on a ${st}-day AI interview practice streak on Learn24 🔥 Join the daily challenge: https://learn24-lilac.vercel.app/daily`)}">WhatsApp</a><a class="btn ghost" target="_blank" rel="noopener" href="https://t.me/share/url?url=${encodeURIComponent('https://learn24-lilac.vercel.app/daily')}&text=${encodeURIComponent(`${st}-day AI practice streak on Learn24 🔥`)}">Telegram</a></div></div>
    <div class="mk-card"><h2>Badges</h2><div class="dl-badges">${B.map(b => `<div class="dl-b${b.ok ? ' on' : ''}" title="${esc(b.desc)}"><span>${b.icon}</span><b>${esc(b.name)}</b><small>${esc(b.desc)}</small></div>`).join('')}</div></div>`;
    app.querySelector('#show').onclick = reveal;
    app.querySelector('#share').onclick = card;
  }
  function reveal() {
    const box = app.querySelector('#ans'); if (!box.hidden) { box.hidden = true; return; }
    box.hidden = false;
    box.innerHTML = `<div class="ans">${q.a}</div>${S.daily[day] ? '' : `<p class="mk-l">How did you do?</p><div class="mk-rate"><button type="button" data-s="1">✅ Nailed it</button><button type="button" data-s="0.5">🤔 Partly</button><button type="button" data-s="0">🔁 Review again</button></div>`}`;
    L24.math(box);
    const r = box.querySelector('.mk-rate');
    if (r) r.onclick = e => {
      const b = e.target.closest('button'); if (!b) return;
      S.daily[day] = { id: q.id, s: +b.dataset.s }; S.rated[q.id] = +b.dataset.s; L24.save();
      const st = L24.streak() + (L24.S.days[day] ? 0 : 1);
      L24.addXP(15 + Math.min(20, 2 * st), 'daily');
      render(); L24.toast(`🔥 ${L24.streak()}-day streak!`);
    };
  }
  function cal() {
    const d = new Date(); d.setDate(d.getDate() - 69 - d.getDay()); let h = '<div class="dl-cal">';
    for (let i = 0; i < 70 + new Date().getDay() + 1; i++) { const k = L24.today(d); const n = S.days[k] ? Object.values(S.days[k]).reduce((a, b) => a + b, 0) : 0; h += `<i class="c${Math.min(3, n)}" title="${k}${n ? ' · active' : ''}"></i>`; d.setDate(d.getDate() + 1); }
    return h + '</div>';
  }
  function card() {
    const c = document.createElement('canvas'); c.width = 1200; c.height = 630; const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 1200, 630); g.addColorStop(0, '#0d1420'); g.addColorStop(1, '#1d2b45'); x.fillStyle = g; x.fillRect(0, 0, 1200, 630);
    x.fillStyle = '#7cb4ff'; x.font = '700 44px system-ui, sans-serif'; x.fillText('Learn24', 70, 100);
    x.fillStyle = '#ffffff'; x.font = '800 150px system-ui, sans-serif'; x.fillText(`🔥 ${L24.streak()}`, 70, 300);
    x.font = '600 48px system-ui, sans-serif'; x.fillText('day AI interview practice streak', 70, 380);
    x.fillStyle = '#c9d3e3'; x.font = '400 34px system-ui, sans-serif';
    x.fillText(`${S.xp} XP · level ${L24.level(S.xp).n} · ${L24.badges().filter(b => b.ok).length} badges · ${L24.practised()} questions practised`, 70, 450);
    x.fillStyle = '#45d19b'; x.font = '600 32px system-ui, sans-serif'; x.fillText('Join the daily challenge → learn24-lilac.vercel.app/daily', 70, 560);
    c.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `learn24-streak-${L24.streak()}.png`; a.click(); L24.toast('Streak card downloaded. Post it with #Learn24!'); });
  }
  render();
})();
