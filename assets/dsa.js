/* Learn24 DSA: language tabs, problem list, LeetCode-style editor + in-browser runner, solved tracking.
   Progress lives in this browser: learn24-me.dsa.solved, drafts in learn24-dsa-code, preferred language in learn24-lang. */
(function () {
  const me = document.currentScript, base = (me && me.dataset.base) || '../';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const LS = { get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  const LANG = { py: 'Python', java: 'Java', cpp: 'C++', js: 'JavaScript' };
  const MODE = { py: 'python', java: 'text/x-java', cpp: 'text/x-c++src', js: 'javascript' };
  const L24 = window.L24;
  const store = () => { if (!L24) return { solved: {} }; L24.S.dsa = L24.S.dsa || { solved: {} }; L24.S.dsa.solved = L24.S.dsa.solved || {}; return L24.S.dsa; };
  const solved = () => store().solved;
  let lang = LS.get('learn24-lang', 'py'); if (!LANG[lang]) lang = 'py';
  const setLang = l => { lang = l; LS.set('learn24-lang', l); };

  // ---------------- static code highlighting + language tabs ----------------
  function highlight(root) {
    if (!window.CodeMirror || !CodeMirror.runMode) return;
    root.querySelectorAll('.ctabs pre code:not([data-hl])').forEach(c => { const l = c.parentNode.dataset.l; c.dataset.hl = 1; const t = c.textContent; c.textContent = ''; CodeMirror.runMode(t, MODE[l], c); });
  }
  function paintTabs() {
    document.querySelectorAll('.ctabs').forEach(box => {
      box.querySelectorAll('.ctabs-h [data-l]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.l === lang)));
      box.querySelectorAll('pre[data-l]').forEach(p => p.classList.toggle('on', p.dataset.l === lang));
    });
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('.ctabs-h [data-l]');
    if (b) { setLang(b.dataset.l); paintTabs(); const sel = document.getElementById('lang'); if (sel && sel.value !== lang && window.__l24SetEditorLang) window.__l24SetEditorLang(lang); return; }
    const cp = e.target.closest('.ct-copy');
    if (cp) { const pre = cp.closest('.ctabs').querySelector('pre.on'); if (pre && navigator.clipboard) navigator.clipboard.writeText(pre.textContent).then(() => { cp.textContent = 'Copied ✓'; setTimeout(() => cp.textContent = 'Copy', 1400); }); }
  });

  // ---------------- solved status on any problem table ----------------
  function paintTables() {
    const S = solved();
    document.querySelectorAll('.ptab tr[data-id]').forEach(tr => { const ok = !!S[tr.dataset.id]; tr.classList.toggle('ok', ok); tr.querySelector('.st').textContent = ok ? '✓' : ''; tr.querySelector('.st').title = ok ? 'Solved' : ''; });
  }

  // ---------------- comparison (mirrors dsa/core.py) ----------------
  const canon = v => JSON.stringify(v, (k, x) => (x && typeof x === 'object' && !Array.isArray(x)) ? Object.keys(x).sort().reduce((o, kk) => (o[kk] = x[kk], o), {}) : x);
  function same(P, args, got, exp) {
    if (P.cmp === 'topo') {
      const [n, pre] = args;
      if (Array.isArray(exp) && !exp.length) return Array.isArray(got) && !got.length;
      if (!Array.isArray(got) || got.length !== n || [...got].sort((a, b) => a - b).some((v, i) => v !== i)) return false;
      const pos = {}; got.forEach((c, i) => pos[c] = i);
      return pre.every(([a, b]) => pos[b] < pos[a]);
    }
    if (P.cmp === 'sort') return Array.isArray(got) && canon(got.map(canon).sort()) === canon(exp.map(canon).sort());
    if (P.cmp === 'sort2') { const f = v => v.map(x => canon([...x].sort((a, b) => canon(a) < canon(b) ? -1 : canon(a) > canon(b) ? 1 : 0))).sort(); return Array.isArray(got) && got.every(Array.isArray) && canon(f(got)) === canon(f(exp)); }
    return canon(got) === canon(exp);
  }

  // ---------------- runner (web worker) ----------------
  const Runner = (() => {
    let w = null, seq = 0, pyReady = false;
    const make = () => { w = new Worker(base + 'assets/dsa-runner.js'); };
    function run(l, code, spec, onStatus) {
      if (!w) make();
      const id = ++seq, wk = w;
      return new Promise(resolve => {
        let timer = null, done = false;
        const kill = () => { wk.terminate(); if (w === wk) { w = null; pyReady = false; } };
        const finish = r => { if (done) return; done = true; clearTimeout(timer); wk.removeEventListener('message', onMsg); resolve(r); };
        const arm = () => { clearTimeout(timer); timer = setTimeout(() => { kill(); finish({ timeout: true }); }, l === 'py' ? 8000 : 5000); };
        const onMsg = e => {
          const m = e.data;
          if (m.type === 'status') { onStatus && onStatus(m.msg); return; }
          if (m.id !== id) return;
          if (m.type === 'ready') { if (l === 'py') pyReady = true; arm(); return; }
          if (m.type === 'done') finish(m);
        };
        wk.addEventListener('message', onMsg);
        wk.onerror = ev => { kill(); finish({ error: 'The code runner failed to start: ' + (ev.message || 'network error') + '. Python loads from a CDN on first use, so check your connection.' }); };
        if (l === 'py' && !pyReady) timer = setTimeout(() => { kill(); finish({ error: 'Python took too long to load. Check your internet connection and try again.' }); }, 60000);
        else arm();
        wk.postMessage({ id, lang: l, code, spec });
      });
    }
    return { run };
  })();

  // ---------------- problem page ----------------
  function problemPage() {
    const P = JSON.parse(document.getElementById('pdata').textContent);
    const drafts = LS.get('learn24-dsa-code', {});
    const sel = document.getElementById('lang'), ta = document.getElementById('code');
    const runB = document.getElementById('run'), subB = document.getElementById('submit');
    const cases = document.querySelector('.pp-cbody[data-c="cases"]'), result = document.querySelector('.pp-cbody[data-c="result"]');
    let ed = null, saveT = null;
    const getCode = () => ed ? ed.getValue() : ta.value;
    const setCode = v => { if (ed) ed.setValue(v); else ta.value = v; };
    const codeFor = l => (drafts[P.id] && drafts[P.id][l]) || P.starter[l];
    const save = () => { clearTimeout(saveT); saveT = setTimeout(() => { (drafts[P.id] = drafts[P.id] || {})[lang] = getCode(); LS.set('learn24-dsa-code', drafts); }, 300); };
    sel.value = lang;
    if (window.CodeMirror) {
      ed = CodeMirror.fromTextArea(ta, { mode: MODE[lang], theme: 'l24', lineNumbers: true, indentUnit: lang === 'js' ? 2 : 4, tabSize: 4, indentWithTabs: false, matchBrackets: true, autoCloseBrackets: true, lineWrapping: false,
        extraKeys: { Tab: cm => cm.somethingSelected() ? cm.indentSelection('add') : cm.replaceSelection(' '.repeat(cm.getOption('indentUnit'))), 'Shift-Tab': cm => cm.indentSelection('subtract'),
          'Ctrl-Enter': () => exec(false), 'Cmd-Enter': () => exec(false), 'Ctrl-Shift-Enter': () => exec(true), 'Cmd-Shift-Enter': () => exec(true) } });
      ed.on('change', save);
    } else {
      ta.addEventListener('input', save);
      ta.addEventListener('keydown', e => { if (e.key === 'Tab') { e.preventDefault(); const s = ta.selectionStart; ta.setRangeText('    ', s, ta.selectionEnd, 'end'); } });
    }
    setCode(codeFor(lang));
    function switchLang(l) {
      (drafts[P.id] = drafts[P.id] || {})[lang] = getCode(); LS.set('learn24-dsa-code', drafts);
      setLang(l); sel.value = l;
      if (ed) { ed.setOption('mode', MODE[l]); ed.setOption('indentUnit', l === 'js' ? 2 : 4); }
      setCode(codeFor(l)); paintTabs(); paintRunnable();
    }
    window.__l24SetEditorLang = switchLang;
    sel.onchange = () => switchLang(sel.value);
    document.getElementById('reset').onclick = () => { if (confirmReset()) { setCode(P.starter[lang]); save(); } };
    function confirmReset() { const b = document.getElementById('reset'); if (b.dataset.armed) { delete b.dataset.armed; b.textContent = '↺ Reset'; return true; } b.dataset.armed = 1; b.textContent = 'Click again to reset'; setTimeout(() => { delete b.dataset.armed; b.textContent = '↺ Reset'; }, 2500); return false; }
    const runnable = () => lang === 'py' || lang === 'js';
    function paintRunnable() { runB.title = runnable() ? 'Run the sample tests (Ctrl+Enter)' : 'Java and C++ run on your machine or on LeetCode'; subB.title = runnable() ? 'Run all tests (Ctrl+Shift+Enter)' : runB.title; }
    paintRunnable();

    // left tabs
    const tabs = document.querySelectorAll('.pp-tabs [data-t]');
    tabs.forEach(b => b.onclick = () => { tabs.forEach(x => x.setAttribute('aria-selected', String(x === b))); document.querySelectorAll('.pp-pane').forEach(p => p.hidden = p.dataset.t !== b.dataset.t); });
    // console tabs
    const ctabs = document.querySelectorAll('.pp-ctabs [data-c]');
    const showCon = c => { ctabs.forEach(x => x.setAttribute('aria-selected', String(x.dataset.c === c))); document.querySelectorAll('.pp-cbody').forEach(p => p.hidden = p.dataset.c !== c); };
    ctabs.forEach(b => b.onclick = () => showCon(b.dataset.c));

    const argText = args => args.map((a, i) => `${P.params[i]} = ${JSON.stringify(a)}`).join('\n');
    // sample testcases
    const sampleIdx = [...Array(P.sample).keys()];
    function caseView(box, list, render) {
      box.innerHTML = `<div class="case-tabs">${list.map((c, i) => `<button type="button" class="${i === 0 ? 'on ' : ''}${c.cls || ''}" data-i="${i}">${c.label}</button>`).join('')}</div><div class="case-body"></div>`;
      const body = box.querySelector('.case-body'), bs = box.querySelectorAll('.case-tabs button');
      const pick = i => { bs.forEach((b, k) => b.classList.toggle('on', k === i)); body.innerHTML = render(list[i]); };
      bs.forEach(b => b.onclick = () => pick(+b.dataset.i)); pick(0);
    }
    caseView(cases, sampleIdx.map(i => ({ i, label: `Case ${i + 1}` })), c => `<div class="io"><div><label>Input</label><pre>${esc(argText(P.tests[c.i]))}</pre></div><div><label>Expected</label><pre>${esc(JSON.stringify(P.expected[c.i]))}</pre></div></div>`);

    const S = solved(), badge = document.querySelector('.solved-b');
    const paintSolved = () => { if (badge) badge.hidden = !solved()[P.id]; };
    paintSolved();

    async function exec(all) {
      showCon('result');
      if (!runnable()) {
        result.innerHTML = `<p class="verdict info">${LANG[lang]} cannot run inside the browser</p><p>Your ${LANG[lang]} code is saved on this device. To test it, paste it into your IDE or ${P.lc !== '' ? '<a href="#" id="lcl">LeetCode</a>' : 'an online compiler'}. Switch the language to <b>Python</b> or <b>JavaScript</b> to run tests right here. The <b>Solution</b> tab has a verified ${LANG[lang]} solution.</p>`;
        const a = document.querySelector('.pp-meta .ext[href]'); const l = document.getElementById('lcl'); if (l && a) l.href = a.href, l.target = '_blank'; else if (l) l.replaceWith('an online compiler');
        return;
      }
      const idx = all ? P.tests.map((_, i) => i) : sampleIdx;
      const spec = { fn: P.fn, types: P.types, ret: P.ret, inplace: P.inplace, tests: idx.map(i => P.tests[i]) };
      runB.disabled = subB.disabled = true;
      result.innerHTML = `<p class="verdict info">⏳ ${all ? 'Submitting' : 'Running'}…</p>`;
      const t0 = performance.now();
      const r = await Runner.run(lang, getCode(), spec, msg => { result.innerHTML = `<p class="verdict info">⏳ ${esc(msg)}</p>`; });
      runB.disabled = subB.disabled = false;
      const stdout = r.stdout ? `<div><label>Stdout</label><pre>${esc(r.stdout.slice(0, 4000))}</pre></div>` : '';
      if (r.timeout) { result.innerHTML = `<p class="verdict no">⏱ Time Limit Exceeded</p><p>Your code ran for more than ${lang === 'py' ? 8 : 5} seconds. Check for an infinite loop, or a solution that is slower than the target complexity.</p>`; return; }
      if (r.error) { result.innerHTML = `<p class="verdict no">Compile / Runtime Error</p><div class="io"><pre class="err">${esc(r.error)}</pre>${stdout}</div>`; return; }
      const res = r.results.map((x, k) => ({ ...x, i: idx[k], ok: !x.err && same(P, P.tests[idx[k]], x.out, P.expected[idx[k]]) }));
      const pass = res.filter(x => x.ok).length, ms = Math.round(res.reduce((a, x) => a + (x.ms || 0), 0)), wall = Math.round(performance.now() - t0);
      const one = c => `<div class="io"><div><label>Input</label><pre>${esc(argText(P.tests[c.i]))}</pre></div>${c.err ? `<div><label>Error</label><pre class="err">${esc(c.err)}</pre></div>` : `<div><label>Your output</label><pre>${esc(JSON.stringify(c.out))}</pre></div>`}<div><label>Expected${P.cmp === 'topo' ? ' (any valid order is accepted)' : P.cmp !== 'exact' ? ' (any order is accepted)' : ''}</label><pre>${esc(JSON.stringify(P.expected[c.i]))}</pre></div>${stdout}</div>`;
      if (!all) {
        result.innerHTML = `<p class="verdict ${pass === res.length ? 'ok' : 'no'}">${pass === res.length ? '✅ Sample tests passed' : '❌ Wrong Answer'}<small>${pass}/${res.length} cases · ${ms} ms</small></p><div class="cv"></div>`;
        caseView(result.querySelector('.cv'), res.map((c, k) => ({ ...c, label: `${c.ok ? '✓' : '✗'} Case ${k + 1}`, cls: c.ok ? 'ok' : 'no' })), one);
        if (pass === res.length) result.insertAdjacentHTML('beforeend', '<p class="muted">Now press <b>Submit</b> to run the hidden tests too.</p>');
        return;
      }
      const bad = res.find(x => !x.ok);
      if (!bad) {
        const first = !solved()[P.id];
        solved()[P.id] = { d: L24 ? L24.today() : '', lang };
        if (L24) { L24.save(); L24.markActive('dsa'); if (first) L24.addXP({ Easy: 10, Medium: 20, Hard: 40 }[P.diff] || 10, 'dsa'); }
        paintSolved(); paintTables();
        result.innerHTML = `<p class="verdict ok">✅ Accepted<small>${pass}/${res.length} tests passed · ${ms} ms (${wall} ms including startup)</small></p>${first ? `<p>🎉 Problem solved${L24 ? `: +${{ Easy: 10, Medium: 20, Hard: 40 }[P.diff]} XP` : ''}. Compare your approach with the <b>Solution</b> tab, then try the next problem.</p>` : '<p>Solved again. Nice practice!</p>'}${stdout ? `<div class="io">${stdout}</div>` : ''}`;
      } else {
        result.innerHTML = `<p class="verdict no">${bad.err ? 'Runtime Error' : '❌ Wrong Answer'}<small>${pass}/${res.length} tests passed</small></p><p class="muted">First failing test (#${bad.i + 1}):</p>${one(bad)}`;
      }
    }
    runB.onclick = () => exec(false);
    subB.onclick = () => exec(true);
  }

  // ---------------- problem list page ----------------
  function listPage() {
    const DATA = JSON.parse(document.getElementById('plist').textContent), PS = DATA.problems, PT = Object.fromEntries(DATA.patterns.map(p => [p.id, p.t]));
    const st = { q: '', d: '', p: '', s: '' };
    try { Object.assign(st, Object.fromEntries(new URLSearchParams(location.search))); } catch (e) {}
    const $ = s => document.querySelector(s);
    $('#pl-q').value = st.q || ''; $('#pl-pat').value = st.p || ''; $('#pl-st').value = st.s || '';
    document.querySelectorAll('#pl-diff button').forEach(b => b.classList.toggle('on', b.dataset.d === (st.d || '')));
    function stats() {
      const S = solved(), by = d => PS.filter(p => p.d === d), sv = d => by(d).filter(p => S[p.id]).length, all = PS.filter(p => S[p.id]).length;
      $('#pl-stats').innerHTML = `<div><b>${all}/${PS.length}</b><small>problems solved</small><div class="mk-meter"><i class="good" style="width:${Math.round(all / PS.length * 100)}%"></i></div></div>` +
        ['Easy', 'Medium', 'Hard'].map(d => `<div><b>${sv(d)}/${by(d).length}</b><small>${d}</small><div class="mk-meter"><i class="${d === 'Easy' ? 'good' : d === 'Medium' ? 'mid' : 'bad'}" style="width:${by(d).length ? Math.round(sv(d) / by(d).length * 100) : 0}%"></i></div></div>`).join('');
    }
    function render() {
      const S = solved(), q = st.q.trim().toLowerCase();
      const list = PS.filter(p => (!st.d || p.d === st.d) && (!st.p || p.p === st.p) && (!st.s || (st.s === 'done') === !!S[p.id]) &&
        (!q || (p.t + ' ' + p.tags.join(' ') + ' ' + PT[p.p]).toLowerCase().includes(q)));
      $('#pl').innerHTML = list.length ? `<div class="ptw"><table class="ptab"><thead><tr><th aria-label="Solved"></th><th>#</th><th>Problem</th><th>Pattern</th><th>Difficulty</th><th>Also on</th></tr></thead><tbody>${list.map(p => `
        <tr data-id="${p.id}"><td class="st"></td><td class="num">${p.n}</td><td><a href="${p.id}.html">${esc(p.t)}</a></td><td class="pt"><a href="../${p.p}.html">${esc(PT[p.p])}</a></td><td><span class="diff ${p.d.toLowerCase()}">${p.d}</span></td><td class="lc">${p.lc ? `<a href="https://leetcode.com/problems/${p.lc}/" target="_blank" rel="noopener" title="Open on LeetCode">LeetCode ↗</a>` : '<span class="muted">Classic</span>'}</td></tr>`).join('')}</tbody></table></div>` : '<div class="pl-empty">No problems match these filters.</div>';
      paintTables(); stats();
      const qs = new URLSearchParams(Object.entries(st).filter(([, v]) => v)).toString();
      history.replaceState(null, '', location.pathname + (qs ? '?' + qs : ''));
    }
    $('#pl-q').oninput = e => { st.q = e.target.value; render(); };
    $('#pl-pat').onchange = e => { st.p = e.target.value; render(); };
    $('#pl-st').onchange = e => { st.s = e.target.value; render(); };
    $('#pl-diff').onclick = e => { const b = e.target.closest('button'); if (!b) return; st.d = b.dataset.d; document.querySelectorAll('#pl-diff button').forEach(x => x.classList.toggle('on', x === b)); render(); };
    $('#pl-rand').onclick = () => { const S = solved(), todo = PS.filter(p => !S[p.id] && (!st.d || p.d === st.d) && (!st.p || p.p === st.p)); const pick = (todo.length ? todo : PS)[Math.floor(Math.random() * (todo.length || PS.length))]; location.href = pick.id + '.html'; };
    render();
  }

  // ---------------- visualizer gallery ----------------
  function galleryPage() {
    const all = window.L24_VG || [], host = document.getElementById('vg-host');
    const titles = id => (window.L24VIZ && L24VIZ.V[id] && L24VIZ.V[id].title) || id;
    document.querySelectorAll('.vg-g button[data-v]').forEach(b => b.textContent = titles(b.dataset.v));
    function show() {
      const id = all.includes(location.hash.slice(1)) ? location.hash.slice(1) : all[0];
      document.querySelectorAll('.vg-g button[data-v]').forEach(b => b.classList.toggle('on', b.dataset.v === id));
      host.innerHTML = `<div class="viz" data-viz="${[id, ...all.filter(x => x !== id)].join(',')}"></div>`;
      L24VIZ.mount(host.firstChild);
      const s = host.querySelector('.vz-sel'); if (s) s.onchange = () => { location.hash = s.value; };
    }
    document.querySelector('.vg-groups').onclick = e => { const b = e.target.closest('button[data-v]'); if (b) location.hash = b.dataset.v; };
    window.addEventListener('hashchange', show);
    show();
  }

  function boot() {
    highlight(document); paintTabs(); paintTables();
    const page = document.body.dataset.page;
    if (page === 'dsa-problem') problemPage();
    else if (page === 'dsa-problems') listPage();
    else if (page === 'dsa-visualizer') galleryPage();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
