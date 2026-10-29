/* Career roadmaps: week-by-week checklists. Ticks are saved on this device and earn XP; finishing one unlocks a certificate. */
(function () {
  const app = document.getElementById('rm'), RM = JSON.parse(document.getElementById('rm-data').textContent);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const S = L24.S, done = (() => { try { return JSON.parse(localStorage.getItem('learn24-done') || '[]'); } catch (e) { return []; } })();
  let cur = (location.hash.slice(1) && RM.find(r => r.id === location.hash.slice(1))) ? location.hash.slice(1) : (S.roadmapCur || RM[0].id);
  const lessonKey = h => { const m = /^\.\.\/([^/]+)\/([^/#?]+)\.html$/.exec(h || ''); return m ? m[1] + '/' + m[2] : ''; };
  function render() {
    const r = RM.find(x => x.id === cur), st = S.roadmap[cur] = S.roadmap[cur] || { items: {} };
    const all = r.weeks.flatMap((w, wi) => w[1].map((it, ii) => `${wi}.${ii}`));
    const solvedP = (S.dsa && S.dsa.solved) || {}, pid = h => { const m = /\/dsa\/problems\/([^/#?]+)\.html$/.exec(h || ''); return m ? m[1] : ''; };
    const isDone = (k, it) => !!st.items[k] || (lessonKey(it.h) && done.includes(lessonKey(it.h))) || (pid(it.h) && !!solvedP[pid(it.h)]);
    const n = r.weeks.reduce((a, w, wi) => a + w[1].filter((it, ii) => isDone(`${wi}.${ii}`, it)).length, 0), pct = Math.round(n / all.length * 100);
    app.innerHTML = `
    <div class="chips" style="margin-bottom:12px">${RM.map(x => `<button type="button" data-r="${x.id}" class="${x.id === cur ? 'on' : ''}">${x.icon} ${esc(x.title)}</button>`).join('')}</div>
    <div class="mk-card"><h2>${r.icon} ${esc(r.title)}</h2><p class="muted">For: ${esc(r.for)}</p>
      <div class="rm-prog"><div class="mk-meter"><i class="${pct === 100 ? 'good' : 'mid'}" style="width:${pct}%"></i></div><small class="muted">${n} of ${all.length} steps · ${pct}%${pct === 100 ? ' · 🎉 Complete! <a href="../certificate/index.html">Get your certificate →</a>' : ''}</small></div>
      ${r.weeks.map((w, wi) => { const k = w[1].filter((it, ii) => isDone(`${wi}.${ii}`, it)).length; return `<div class="rm-week"><h3>${esc(w[0])}<small>${k}/${w[1].length}</small></h3>${w[1].map((it, ii) => { const key = `${wi}.${ii}`, d = isDone(key, it); return `
        <label class="rm-item${d ? ' done' : ''}"><input type="checkbox" data-k="${key}"${d ? ' checked' : ''}><span>${it.h ? `<a href="${esc(it.h)}">${esc(it.t)}</a>` : esc(it.t)}</span></label>`; }).join('')}</div>`; }).join('')}
    </div>`;
    app.querySelector('.chips').onclick = e => { const b = e.target.closest('button'); if (!b) return; cur = b.dataset.r; S.roadmapCur = cur; L24.save(); history.replaceState(null, '', '#' + cur); render(); };
    app.querySelectorAll('input[data-k]').forEach(cb => cb.onchange = () => {
      st.items[cb.dataset.k] = cb.checked;
      const left = all.filter(k => { const [wi, ii] = k.split('.').map(Number); return !isDone(k, r.weeks[wi][1][ii]); }).length;
      const was = st.complete; st.complete = left === 0; L24.save();
      if (cb.checked) L24.addXP(5, 'roadmap');
      if (st.complete && !was) { L24.addXP(50, 'roadmap'); L24.toast('🎉 Roadmap complete! Certificate unlocked.'); }
      render();
    });
  }
  render();
})();
