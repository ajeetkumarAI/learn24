/* Mock interview: pick a role, company, topics and length; answer under a timer; reveal the model answer; rate yourself; get a readiness report. */
(async function () {
  const app = document.getElementById('mock'), base = app.dataset.base || '../';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  app.innerHTML = '<p class="muted">Loading 1,400+ questions…</p>';
  let QB; try { QB = await L24.qbank(base); } catch (e) { app.innerHTML = '<p>Could not load the question bank. Please refresh.</p>'; return; }
  const Q = QB.questions, TOP = QB.topics.map(t => t.name), HREF = Object.fromEntries(QB.topics.map(t => [t.name, t.href]));
  const ROLES = {
    'GenAI Engineer': ['LLMs & Prompting', 'RAG & Retrieval', 'Agents & MCP', 'System Design & MLOps', 'Python & Coding', 'Behavioural & Case'],
    'Data Scientist': ['Machine Learning', 'Statistics & Experiments', 'SQL & Data', 'Python & Coding', 'Deep Learning', 'Behavioural & Case'],
    'ML Engineer': ['Machine Learning', 'Deep Learning', 'System Design & MLOps', 'Python & Coding', 'LLMs & Prompting'],
    'AI Engineer (fresher)': ['Python & Coding', 'Machine Learning', 'Deep Learning', 'LLMs & Prompting', 'NLP'],
    'Agentic AI Engineer': ['Agents & MCP', 'RAG & Retrieval', 'LLMs & Prompting', 'System Design & MLOps', 'Security & Safety'],
  };
  const companies = [...new Set(Q.flatMap(q => q.co))].filter(c => c && c !== 'GenAI Assignments').sort((a, b) => a.localeCompare(b));
  const params = new URLSearchParams(location.search);
  let cfg = { role: params.get('role') || 'GenAI Engineer', co: params.get('company') || '', topics: params.get('topic') ? [params.get('topic')] : ROLES['GenAI Engineer'].slice(), lv: 'mixed', n: 10, mins: 3 };
  if (params.get('role') && ROLES[cfg.role]) cfg.topics = ROLES[cfg.role].slice();

  function setup() {
    const past = L24.S.mocks.slice(-6).reverse();
    app.innerHTML = `
    <div class="mk-card">
      <h2>Set up your mock interview</h2>
      <label class="mk-l">Role</label>
      <div class="chips" id="roles">${Object.keys(ROLES).map(r => `<button type="button" data-r="${esc(r)}" class="${r === cfg.role ? 'on' : ''}">${esc(r)}</button>`).join('')}</div>
      <label class="mk-l" for="co">Company (optional)</label>
      <select id="co" class="mk-in"><option value="">Any company</option>${companies.map(c => `<option${c === cfg.co ? ' selected' : ''}>${esc(c)}</option>`).join('')}</select>
      <label class="mk-l">Topics</label>
      <div class="chips" id="tops">${TOP.filter(t => t !== 'General').map(t => `<button type="button" data-t="${esc(t)}" class="${cfg.topics.includes(t) ? 'on' : ''}">${esc(t)}</button>`).join('')}</div>
      <div class="mk-row">
        <div><label class="mk-l" for="lv">Difficulty</label><select id="lv" class="mk-in">${['mixed', 'easy', 'medium', 'hard'].map(v => `<option${v === cfg.lv ? ' selected' : ''}>${v}</option>`).join('')}</select></div>
        <div><label class="mk-l" for="n">Questions</label><select id="n" class="mk-in">${[5, 10, 15, 20].map(v => `<option${v === cfg.n ? ' selected' : ''}>${v}</option>`).join('')}</select></div>
        <div><label class="mk-l" for="mins">Time per question</label><select id="mins" class="mk-in">${[[2, '2 min'], [3, '3 min'], [5, '5 min'], [0, 'No timer']].map(([v, l]) => `<option value="${v}"${v === cfg.mins ? ' selected' : ''}>${l}</option>`).join('')}</select></div>
      </div>
      <p class="muted" id="avail"></p>
      <button class="btn" id="go" type="button">Start interview →</button>
    </div>
    ${past.length ? `<div class="mk-card"><h2>Your recent mocks</h2><div class="mk-hist">${past.map(m => `<div><b>${m.score}%</b><span>${esc(m.role)}${m.co ? ' · ' + esc(m.co) : ''}</span><small>${m.date} · ${m.n} Qs</small></div>`).join('')}</div></div>` : ''}`;
    const upd = () => {
      cfg.co = app.querySelector('#co').value; cfg.lv = app.querySelector('#lv').value; cfg.n = +app.querySelector('#n').value; cfg.mins = +app.querySelector('#mins').value;
      const pool = pick(true); app.querySelector('#avail').textContent = `${pool.length} matching questions${cfg.co && pool.length < cfg.n ? ' (we will add similar questions from other companies)' : ''}.`;
    };
    app.querySelector('#roles').onclick = e => { const b = e.target.closest('button'); if (!b) return; cfg.role = b.dataset.r; cfg.topics = ROLES[cfg.role].slice(); setup(); };
    app.querySelector('#tops').onclick = e => { const b = e.target.closest('button'); if (!b) return; const t = b.dataset.t; cfg.topics = cfg.topics.includes(t) ? cfg.topics.filter(x => x !== t) : [...cfg.topics, t]; b.classList.toggle('on'); upd(); };
    app.querySelectorAll('select').forEach(s => s.onchange = upd); upd();
    app.querySelector('#go').onclick = () => { upd(); start(); };
  }

  function pick(countOnly) {
    const okT = q => !cfg.topics.length || q.t.some(t => cfg.topics.includes(t));
    const okL = q => cfg.lv === 'mixed' || q.lv === cfg.lv;
    let pool = Q.filter(q => okT(q) && okL(q) && (!cfg.co || q.co.includes(cfg.co)));
    if (countOnly) return pool;
    const seen = new Set(L24.S.seen.slice(-600)), shuffle = a => a.map(x => [Math.random(), x]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
    let chosen = shuffle(pool.filter(q => !seen.has(q.id)));
    if (chosen.length < cfg.n) chosen = chosen.concat(shuffle(pool.filter(q => seen.has(q.id))));
    if (chosen.length < cfg.n) chosen = chosen.concat(shuffle(Q.filter(q => okT(q) && okL(q) && !chosen.includes(q))));
    // spread across topics: round-robin by first tag
    const by = {}; chosen.forEach(q => (by[q.t[0]] = by[q.t[0]] || []).push(q));
    const out = [], keys = Object.keys(by); let i = 0;
    while (out.length < cfg.n && keys.some(k => by[k].length)) { const k = keys[i++ % keys.length]; if (by[k].length) out.push(by[k].shift()); }
    return out;
  }

  let run;
  function start() {
    const qs = pick(false);
    if (!qs.length) { L24.toast('No questions match. Pick more topics.'); return; }
    run = { qs, i: 0, res: [], t0: Date.now() }; ask();
  }
  let timer;
  function ask() {
    clearInterval(timer);
    const q = run.qs[run.i], n = run.qs.length, secs = cfg.mins * 60;
    app.innerHTML = `
    <div class="mk-card mk-q">
      <div class="mk-top"><span class="mk-p">Question ${run.i + 1} of ${n}</span><span class="mk-tags">${q.t.map(t => `<span>${esc(t)}</span>`).join('')}<span class="lv-${q.lv}">${q.lv}</span></span>${secs ? `<span class="mk-timer" id="tm">${cfg.mins}:00</span>` : ''}</div>
      <div class="mk-bar"><i style="width:${run.i / n * 100}%"></i></div>
      <h2 class="mk-qt">${esc(q.q)}</h2>
      <p class="muted mk-from">Asked at / from: ${esc(q.co.join(', ') || 'Learn24')} · <a href="${base}${q.href}" target="_blank" rel="noopener">source page ↗</a></p>
      <textarea id="draft" class="mk-in mk-draft" rows="6" placeholder="Say your answer out loud, or type key points here (stays on this device)…"></textarea>
      <div class="mk-act"><button class="btn" id="rev" type="button">Show model answer</button><button class="btn ghost" id="skip" type="button">Skip</button><button class="btn ghost" id="end" type="button">End interview</button></div>
      <div id="ans" hidden></div>
    </div>`;
    if (secs) { let left = secs; const tm = app.querySelector('#tm'); timer = setInterval(() => { left--; tm.textContent = `${Math.floor(Math.max(left, 0) / 60)}:${String(Math.max(left, 0) % 60).padStart(2, '0')}`; if (left <= 30) tm.classList.add('low'); if (left <= 0) { clearInterval(timer); tm.textContent = "Time's up"; reveal(); } }, 1000); }
    app.querySelector('#rev').onclick = reveal;
    app.querySelector('#skip').onclick = () => rate(0, true);
    app.querySelector('#end').onclick = () => report();
    app.querySelector('#draft').focus({ preventScroll: true });
  }
  function reveal() {
    clearInterval(timer);
    const q = run.qs[run.i], box = app.querySelector('#ans'); if (!box.hidden) return;
    box.hidden = false; app.querySelector('#rev').disabled = true;
    box.innerHTML = `<div class="ans">${q.a}</div>
      <p class="mk-l">How did you do?</p>
      <div class="mk-rate"><button type="button" data-s="1">✅ Nailed it</button><button type="button" data-s="0.5">🤔 Partly</button><button type="button" data-s="0">🔁 Missed it</button></div>`;
    L24.math(box);
    box.querySelector('.mk-rate').onclick = e => { const b = e.target.closest('button'); if (b) rate(+b.dataset.s); };
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function rate(s, skipped) {
    const q = run.qs[run.i];
    run.res.push({ id: q.id, q: q.q, t: q.t, href: q.href, s, skipped: !!skipped });
    L24.S.seen.push(q.id); if (L24.S.seen.length > 1500) L24.S.seen = L24.S.seen.slice(-1500);
    if (!skipped) L24.S.rated[q.id] = s;
    L24.save();
    run.i++; run.i < run.qs.length ? ask() : report();
  }
  function report() {
    clearInterval(timer);
    const R = run.res; if (!R.length) { setup(); return; }
    const score = Math.round(R.reduce((a, r) => a + r.s, 0) / R.length * 100);
    const per = {}; R.forEach(r => r.t.forEach(t => { per[t] = per[t] || [0, 0]; per[t][0] += r.s; per[t][1]++; }));
    const rows = Object.entries(per).map(([t, [g, n]]) => [t, Math.round(g / n * 100), n]).sort((a, b) => a[1] - b[1]);
    const weak = rows.filter(r => r[1] < 60);
    const label = score >= 80 ? ['🚀 Interview ready', 'Great work. Keep the streak going and try a harder level or a specific company.'] : score >= 60 ? ['👍 Almost there', 'Solid base. Revise the weak topics below, then take another mock.'] : ['📚 Keep practising', 'Focus on the weak topics below. Short daily practice works best.'];
    const xp = 20 + Math.round(score / 5);
    L24.S.mocks.push({ date: L24.today(), role: cfg.role, co: cfg.co, n: R.length, score, topics: per }); L24.save(); L24.addXP(xp, 'mock');
    app.innerHTML = `
    <div class="mk-card mk-rep">
      <div class="mk-score"><b>${score}%</b><div><h2>${label[0]}</h2><p>${label[1]}</p><p class="muted">${esc(cfg.role)}${cfg.co ? ' · ' + esc(cfg.co) : ''} · ${R.length} questions · +${xp} XP</p></div></div>
      <h3>By topic</h3>
      <div class="mk-topics">${rows.map(([t, p, n]) => `<div class="mk-tr"><span>${esc(t)}</span><div class="mk-meter"><i style="width:${p}%" class="${p < 60 ? 'bad' : p < 80 ? 'mid' : 'good'}"></i></div><b>${p}%</b><small>${n} Q</small></div>`).join('')}</div>
      ${weak.length ? `<h3>Revise next</h3><div class="mk-weak">${weak.map(([t]) => `<div><b>${esc(t)}</b><a href="${base}${HREF[t] || 'assignments/must-know-145.html'}">📖 Revise lesson</a><a href="?topic=${encodeURIComponent(t)}">🎯 Practise this topic</a></div>`).join('')}</div>` : ''}
      <h3>Your answers</h3>
      <ol class="mk-list">${R.map(r => `<li><span class="${r.skipped ? 'sk' : r.s === 1 ? 'ok' : r.s ? 'pt' : 'no'}">${r.skipped ? 'Skipped' : r.s === 1 ? 'Nailed' : r.s ? 'Partly' : 'Missed'}</span><a href="${base}${r.href}" target="_blank" rel="noopener">${esc(r.q)}</a></li>`).join('')}</ol>
      <div class="mk-act"><button class="btn" id="again" type="button">New mock interview</button><a class="btn ghost" href="${base}daily/index.html">🔥 Daily challenge</a><a class="btn ghost" href="${base}certificate/index.html">🎓 Certificates</a></div>
    </div>`;
    app.querySelector('#again').onclick = setup;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  setup();
})();
