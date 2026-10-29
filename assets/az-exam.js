/* Learn24 AI-901 exam practice: 3 timed mock exams, topic drills (study mode), Quick 10.
   Formats: mc, ms (multiple answers), yn (Yes/No statements), dd (drop-down completion), match (drag-and-drop style).
   Progress is saved in this browser (learn24-me.az). */
(function () {
  const app = document.getElementById('az'), base = app.dataset.base || '../../';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const rich = s => esc(s).replace(/&lt;code&gt;/g, '<code>').replace(/&lt;\/code&gt;/g, '</code>');
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const L24 = window.L24, S = () => { if (!L24) return { best: {}, topics: {}, history: [] }; L24.S.az = L24.S.az || {}; const z = L24.S.az; z.best = z.best || {}; z.topics = z.topics || {}; z.history = z.history || []; return z; };
  const save = () => L24 && L24.save();
  let DATA = null, run = null, timer = null;

  // ---------------- data ----------------
  fetch(base + 'assets/az-questions.json').then(r => r.json()).then(d => { DATA = d; route(); window.addEventListener('hashchange', route); })
    .catch(() => { app.innerHTML = '<p class="muted">Could not load the question bank. Please refresh the page.</p>'; });

  const topicName = t => DATA.topics[t].name;
  function route() {
    clearInterval(timer);
    const h = location.hash.slice(1);
    if (/^mock[123]$/.test(h)) return intro(h);
    if (h === 'quick') return start({ kind: 'quick', title: 'Quick 10', qs: shuffle(DATA.questions).slice(0, 10), study: false, minutes: 10 });
    if (h.startsWith('t-') && DATA.topics[h.slice(2)]) return start({ kind: 'topic', topic: h.slice(2), title: topicName(h.slice(2)), qs: shuffle(DATA.questions.filter(q => q.t === h.slice(2))), study: true });
    home(h === 'topics');
  }

  // ---------------- home ----------------
  function home(scrollTopics) {
    const z = S(), mocks = [1, 2, 3].map(n => ({ n, id: 'mock' + n, best: z.best['mock' + n] }));
    const counts = {}; DATA.questions.forEach(q => counts[q.t] = (counts[q.t] || 0) + 1);
    const tlist = Object.entries(DATA.topics);
    app.innerHTML = `
      <div class="az-grid">${mocks.map(m => `<a class="az-card" href="#${m.id}"><i>📝</i><b>Mock Exam ${m.n}</b><span>40 questions · 45 minutes · both domains</span>
        <small>${m.best !== undefined ? `Best: <b class="${m.best >= 80 ? 'ok' : m.best >= 70 ? 'mid' : 'no'}">${m.best}%</b>` : 'Not attempted yet'}</small></a>`).join('')}
        <a class="az-card" href="#quick"><i>⚡</i><b>Quick 10</b><span>10 random questions · 10 minutes</span><small>Daily warm-up</small></a></div>
      <div class="mk-card" id="topics"><h2>Topic practice (study mode)</h2><p class="muted">Each answer shows the explanation immediately. Aim for 80%+ on every topic before your exam.</p>
        ${[1, 2].map(d => `<h3>Domain ${d}: ${d === 1 ? 'Identify AI concepts and capabilities (40–45%)' : 'Implement AI solutions by using Microsoft Foundry (55–60%)'}</h3>
        <div class="az-topics">${tlist.filter(([, v]) => v.d === d).map(([k, v]) => `<a href="#t-${k}"><span>${esc(v.name)}</span><small>${counts[k]} questions${z.topics[k] !== undefined ? ` · best <b class="${z.topics[k] >= 80 ? 'ok' : 'mid'}">${z.topics[k]}%</b>` : ''}</small></a>`).join('')}</div>`).join('')}</div>
      ${z.history.length ? `<div class="mk-card"><h2>Recent attempts</h2><div class="mk-hist">${z.history.slice(-6).reverse().map(h => `<div><b>${h.pct}%</b><small>${esc(h.title)}</small><small>${esc(h.date)}</small></div>`).join('')}</div></div>` : ''}
      <p class="muted">These are original practice questions written for Learn24 and mapped to Microsoft’s published AI-901 skills outline. They are not real exam questions. The real exam is scored 1–1000 with a pass mark of 700.</p>`;
    if (scrollTopics) document.getElementById('topics').scrollIntoView();
  }

  function intro(id) {
    const n = +id.slice(4), qs = DATA.questions.filter(q => q.m === n);
    const d1 = qs.filter(q => DATA.topics[q.t].d === 1).length;
    app.innerHTML = `<div class="mk-card"><h2>📝 Mock Exam ${n}</h2>
      <p>${qs.length} questions (${d1} on Domain 1, ${qs.length - d1} on Domain 2) · <b>45 minutes</b> · mixed formats: multiple choice, multiple answers, Yes/No statements, drop-down completion and matching.</p>
      <ul><li>No feedback until you submit, like the real exam.</li><li>Flag questions to review later; use the numbered navigator to jump around.</li><li>The timer submits automatically at 0:00.</li><li>Statements and matching items earn partial credit.</li></ul>
      <div class="mk-act"><button class="btn" id="go" type="button">Start Mock Exam ${n}</button><button class="btn ghost" id="study" type="button">Practise it in study mode</button><a class="btn ghost" href="#">← All practice</a></div></div>`;
    app.querySelector('#go').onclick = () => start({ kind: id, title: `Mock Exam ${n}`, qs, study: false, minutes: 45 });
    app.querySelector('#study').onclick = () => start({ kind: id + '-study', title: `Mock Exam ${n} (study mode)`, qs, study: true });
  }

  // ---------------- running a set ----------------
  function start(cfg) {
    run = { ...cfg, i: 0, ans: cfg.qs.map(() => null), flag: cfg.qs.map(() => false), checked: cfg.qs.map(() => false),
      order: cfg.qs.map(q => (q.type === 'mc' || q.type === 'ms' || q.type === 'dd') ? shuffle(q.o.map((_, k) => k)) : q.o.map((_, k) => k)), t0: Date.now() };
    if (cfg.minutes) { run.end = Date.now() + cfg.minutes * 60000; timer = setInterval(tick, 1000); }
    draw();
  }
  function tick() {
    const el = app.querySelector('.mk-timer'); if (!el || !run) return;
    const left = Math.max(0, run.end - Date.now()), m = Math.floor(left / 60000), s = Math.floor(left / 1000) % 60;
    el.textContent = `${m}:${String(s).padStart(2, '0')}`; el.classList.toggle('low', left < 5 * 60000);
    if (left <= 0) { clearInterval(timer); finish(true); }
  }
  function partial(q, a) { // score 0..1
    if (a === null || a === undefined) return 0;
    if (q.type === 'mc' || q.type === 'dd') return a === q.a ? 1 : 0;
    if (q.type === 'ms') { const want = new Set(q.a), got = new Set(a); return [...q.o.keys()].every(k => want.has(k) === got.has(k)) ? 1 : 0; }
    if (q.type === 'yn') return q.a.reduce((n, v, k) => n + (a[k] === v ? 1 : 0), 0) / q.a.length;
    if (q.type === 'match') return q.a.reduce((n, v, k) => n + (a[k] === v ? 1 : 0), 0) / q.a.length;
    return 0;
  }
  const answered = (q, a) => a !== null && a !== undefined && (q.type === 'ms' ? a.length > 0 : Array.isArray(a) ? a.every(x => x !== null && x !== undefined) : true);

  function inputs(q, k, a, locked) {
    const ord = run.order[k], name = 'q' + k;
    if (q.type === 'mc') return `<div class="az-opts">${ord.map(o => `<label class="az-opt${locked ? (o === q.a ? ' right' : a === o ? ' wrong' : '') : ''}"><input type="radio" name="${name}" value="${o}"${a === o ? ' checked' : ''}${locked ? ' disabled' : ''}><span>${rich(q.o[o])}</span></label>`).join('')}</div>`;
    if (q.type === 'ms') return `<p class="az-hint">Select ${q.a.length} answers.</p><div class="az-opts">${ord.map(o => { const on = (a || []).includes(o); return `<label class="az-opt${locked ? (q.a.includes(o) ? ' right' : on ? ' wrong' : '') : ''}"><input type="checkbox" name="${name}" value="${o}"${on ? ' checked' : ''}${locked ? ' disabled' : ''}><span>${rich(q.o[o])}</span></label>`; }).join('')}</div>`;
    if (q.type === 'dd') return `<div class="az-dd"><select name="${name}" class="mk-in"${locked ? ' disabled' : ''}><option value="">Select…</option>${ord.map(o => `<option value="${o}"${a === o ? ' selected' : ''}>${esc(q.o[o])}</option>`).join('')}</select>${locked ? `<span class="${a === q.a ? 'ok' : 'no'}">${a === q.a ? '✓' : '✗ Correct: ' + esc(q.o[q.a])}</span>` : ''}</div>`;
    if (q.type === 'yn') return `<table class="az-yn"><thead><tr><th>Statement</th><th>Yes</th><th>No</th></tr></thead><tbody>${q.o.map((s, j) => { const v = a ? a[j] : null; return `<tr class="${locked ? (v === q.a[j] ? 'right' : 'wrong') : ''}"><td>${rich(s)}${locked ? ` <small>(${q.a[j] ? 'Yes' : 'No'})</small>` : ''}</td>
      <td><input type="radio" name="${name}-${j}" value="1" aria-label="Yes"${v === true ? ' checked' : ''}${locked ? ' disabled' : ''}></td><td><input type="radio" name="${name}-${j}" value="0" aria-label="No"${v === false ? ' checked' : ''}${locked ? ' disabled' : ''}></td></tr>`; }).join('')}</tbody></table>`;
    if (q.type === 'match') return `<p class="az-hint">Choose the matching answer for each item. An answer may be used once, more than once, or not at all.</p><div class="az-match">${q.o.map((it, j) => { const v = a ? a[j] : null; return `<div class="${locked ? (v === q.a[j] ? 'right' : 'wrong') : ''}"><span>${rich(it)}</span><select class="mk-in" data-j="${j}"${locked ? ' disabled' : ''}><option value="">Select…</option>${q.c.map((c, ci) => `<option value="${ci}"${v === ci ? ' selected' : ''}>${esc(c)}</option>`).join('')}</select>${locked && v !== q.a[j] ? `<small>Correct: ${esc(q.c[q.a[j]])}</small>` : ''}</div>`; }).join('')}</div>`;
    return '';
  }
  function read(q, k) {
    const box = app.querySelector('.az-q'), name = 'q' + k;
    if (q.type === 'mc') { const r = box.querySelector(`input[name="${name}"]:checked`); return r ? +r.value : null; }
    if (q.type === 'ms') return [...box.querySelectorAll(`input[name="${name}"]:checked`)].map(x => +x.value);
    if (q.type === 'dd') { const v = box.querySelector('select').value; return v === '' ? null : +v; }
    if (q.type === 'yn') return q.o.map((_, j) => { const r = box.querySelector(`input[name="${name}-${j}"]:checked`); return r ? r.value === '1' : null; });
    if (q.type === 'match') return [...box.querySelectorAll('select[data-j]')].map(s => s.value === '' ? null : +s.value);
  }

  function draw() {
    const k = run.i, q = run.qs[k], a = run.ans[k], locked = run.study && run.checked[k], dname = DATA.topics[q.t];
    app.innerHTML = `<div class="mk-card az-run">
      <div class="mk-top"><span class="mk-p">${esc(run.title)} · Question ${k + 1} of ${run.qs.length}</span>
        <span class="mk-tags"><span>Domain ${dname.d}</span><span>${esc(dname.name)}</span></span>
        ${run.end ? '<span class="mk-timer">--:--</span>' : ''}</div>
      <div class="mk-bar"><i style="width:${Math.round((k + 1) / run.qs.length * 100)}%"></i></div>
      <div class="az-q"><p class="az-stem">${rich(q.q)}</p>${inputs(q, k, a, locked)}</div>
      ${locked ? feedback(q, a) : ''}
      <div class="mk-act">
        <button class="btn ghost" id="prev" type="button"${k === 0 ? ' disabled' : ''}>← Previous</button>
        ${run.study ? (locked ? '' : '<button class="btn" id="check" type="button">Check answer</button>') : `<button class="btn ghost" id="flag" type="button">${run.flag[k] ? '🚩 Flagged' : '⚑ Flag for review'}</button>`}
        ${k < run.qs.length - 1 ? '<button class="btn ghost" id="next" type="button">Next →</button>' : `<button class="btn" id="submit" type="button">${run.study ? 'See results' : 'Submit exam'}</button>`}
      </div>
      ${run.study ? '' : `<div class="az-nav" aria-label="Question navigator">${run.qs.map((qq, j) => `<button type="button" data-j="${j}" class="${j === k ? 'cur ' : ''}${answered(qq, run.ans[j]) ? 'done ' : ''}${run.flag[j] ? 'flag' : ''}" aria-label="Question ${j + 1}">${j + 1}</button>`).join('')}</div>
      <p class="muted az-legend">Blue = answered · 🚩 = flagged · <button type="button" class="linkish" id="submit2">Submit now</button></p>`}
    </div>`;
    if (run.end) tick();
    const top = app.getBoundingClientRect().top; if (top < 70) window.scrollBy(0, top - 80);
    const keep = () => { if (!locked) run.ans[k] = read(q, k); };
    app.querySelector('.az-q').addEventListener('change', keep);
    const on = (id, f) => { const b = app.querySelector('#' + id); if (b) b.onclick = f; };
    on('prev', () => { keep(); run.i--; draw(); });
    on('next', () => { keep(); run.i++; draw(); });
    on('flag', () => { keep(); run.flag[k] = !run.flag[k]; draw(); });
    on('check', () => { keep(); if (!answered(q, run.ans[k])) { L24 && L24.toast('Choose an answer first'); return; } run.checked[k] = true; draw(); });
    const sub = () => { keep(); const left = run.qs.filter((qq, j) => !answered(qq, run.ans[j])).length;
      if (!run.study && left && !run.confirm) { run.confirm = true; L24 && L24.toast(`${left} unanswered. Press Submit again to finish.`); setTimeout(() => run && (run.confirm = false), 4000); return; }
      finish(false); };
    on('submit', sub); on('submit2', sub);
    app.querySelectorAll('.az-nav [data-j]').forEach(b => b.onclick = () => { keep(); run.i = +b.dataset.j; draw(); });
  }
  function feedback(q, a) {
    const sc = partial(q, a), t = DATA.topics[q.t];
    return `<div class="ans ${sc === 1 ? 'az-ok' : sc > 0 ? 'az-part' : 'az-no'}"><p><b>${sc === 1 ? '✅ Correct.' : sc > 0 ? `🟡 Partly correct (${Math.round(sc * 100)}%).` : '❌ Not quite.'}</b> ${rich(q.e)}</p>
      <p class="muted">Revise: <a href="../${t.ref}.html">${esc(t.name)}</a></p></div>`;
  }

  // ---------------- results ----------------
  function finish(timeUp) {
    clearInterval(timer);
    const R = run, scores = R.qs.map((q, k) => partial(q, R.ans[k]));
    const pct = Math.round(scores.reduce((a, b) => a + b, 0) / R.qs.length * 100);
    const by = {}, dom = { 1: [0, 0], 2: [0, 0] };
    R.qs.forEach((q, k) => { (by[q.t] = by[q.t] || [0, 0]); by[q.t][0] += scores[k]; by[q.t][1]++; const d = DATA.topics[q.t].d; dom[d][0] += scores[k]; dom[d][1]++; });
    const z = S(), key = R.kind;
    if (/^mock[123]$/.test(key)) z.best[key] = Math.max(z.best[key] || 0, pct);
    if (key === 'topic') z.topics[R.topic] = Math.max(z.topics[R.topic] || 0, pct);
    z.history.push({ title: R.title, pct, date: L24 ? L24.today() : '' }); z.history = z.history.slice(-30);
    save();
    if (L24) { L24.markActive('az'); L24.addXP(/^mock/.test(key) && !key.endsWith('study') ? 30 : 10, 'az'); }
    const mins = Math.round((Date.now() - R.t0) / 60000);
    const meter = v => `<div class="mk-meter"><i class="${v >= 80 ? 'good' : v >= 70 ? 'mid' : 'bad'}" style="width:${v}%"></i></div>`;
    app.innerHTML = `<div class="mk-card"><div class="mk-score"><b>${pct}%</b><div><h2>${pct >= 80 ? '🎉 Exam-ready score' : pct >= 70 ? '✅ Above the pass line, keep pushing to 80%' : '📚 Keep practising'}</h2>
        <p class="muted">${esc(R.title)} · ${mins} min${timeUp ? ' · time ran out' : ''} · the real exam needs 700/1000, so aim for 80%+ in practice.</p></div></div>
      ${[1, 2].filter(d => dom[d][1]).map(d => { const v = Math.round(dom[d][0] / dom[d][1] * 100); return `<div class="mk-tr"><span>Domain ${d}</span>${meter(v)}<b>${v}%</b><small>${dom[d][1]} q</small></div>`; }).join('')}
      <h3>By topic</h3>${Object.entries(by).map(([t, [s, n]]) => { const v = Math.round(s / n * 100); return `<div class="mk-tr"><span><a href="../${DATA.topics[t].ref}.html">${esc(DATA.topics[t].name)}</a></span>${meter(v)}<b>${v}%</b><small>${n} q</small></div>`; }).join('')}
      <div class="mk-act"><button class="btn" id="again" type="button">Try again</button><a class="btn ghost" href="#">All practice</a>${pct >= 80 && key === 'mock3' ? `<a class="btn ghost" href="${base}certificate/index.html">🎓 Get your certificate</a>` : ''}</div></div>
      <div class="mk-card"><h2>Review every question</h2><ol class="az-review">${R.qs.map((q, k) => { const sc = scores[k]; return `<li class="${sc === 1 ? 'ok' : sc > 0 ? 'pt' : 'no'}"><details${sc < 1 ? ' open' : ''}><summary>${sc === 1 ? '✅' : sc > 0 ? '🟡' : '❌'} ${esc(q.q.replace(/<\/?code>/g, '').slice(0, 160))}${q.q.length > 160 ? '…' : ''}</summary>
        <div class="az-q">${inputs(q, k, R.ans[k], true)}</div><div class="ans"><p>${rich(q.e)}</p><p class="muted">Revise: <a href="../${DATA.topics[q.t].ref}.html">${esc(DATA.topics[q.t].name)}</a></p></div></details></li>`; }).join('')}</ol></div>`;
    app.querySelector('#again').onclick = () => start({ ...R, qs: R.kind === 'quick' ? shuffle(DATA.questions).slice(0, 10) : R.kind === 'topic' ? shuffle(R.qs) : R.qs });
    window.scrollTo({ top: app.offsetTop - 80 });
    run = null;
  }
})();
