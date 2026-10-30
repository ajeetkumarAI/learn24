/* Renders the header, home page, topic pages and footer from assets/data.js. Works on file:// and on Vercel. */
(function () {
  const D = window.LEARN24, me = document.currentScript;
  const base = me.dataset.base || '';
  const page = document.body.dataset.page;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const done = (() => { try { return JSON.parse(localStorage.getItem('learn24-done') || '[]'); } catch (e) { return []; } })();
  const isDone = (t, l) => done.includes(t + '/' + l);
  const live = t => t.lessons.filter(l => l.status === 'live');
  const SHORT = { 'genai-course': 'GenAI', 'agentic-ai': 'Agentic AI', 'ai-security': 'Security', 'aws-saa': 'AWS', 'langchain-course': 'LangChain', 'interview-questions': 'Interviews', 'assignments': 'Assignments', 'frameworks': 'Frameworks', 'ai-system-design': 'Design', 'projects': 'Projects', 'ai-finance': 'Finance AI', 'azure-ai-901': 'Azure AI-901', 'dsa': 'DSA' };   // short names for the top menu
  const lessonHref = (t, l) => `${base}${t.id}/${l.id}.html`;

  // header
  const head = document.createElement('header');
  head.className = 'top';
  head.innerHTML = `<div class="shell"><a class="brand" href="${base}index.html" aria-label="${esc(D.site.name)} home">Learn<span class="n">24</span></a>
    <nav class="nav" aria-label="Topics">${D.topics.map(t => `<a href="${base}${t.id}/index.html"${document.body.dataset.topic === t.id ? ' aria-current="page"' : ''}>${esc(SHORT[t.id] || t.name)}</a>` + (t.id === 'genai-course' ? `<a href="${base}resume/index.html"${page === 'resume' ? ' aria-current="page"' : ''}>📄 Resume</a>` : '')).join('')}
      <a class="nav-x" href="${base}start.html"${page === 'start' ? ' aria-current="page"' : ''}>Start here</a><a class="nav-x" href="${base}glossary.html"${page === 'glossary' ? ' aria-current="page"' : ''}>Glossary</a></nav>
    ${(() => { try { const m = JSON.parse(localStorage.getItem('learn24-me') || '{}'), days = m.days || {}; let n = 0; const d = new Date(); const k = x => new Date(x.getTime() - x.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); if (!days[k(d)]) d.setDate(d.getDate() - 1); while (days[k(d)]) { n++; d.setDate(d.getDate() - 1); } return `<a class="streak-pill" href="${base}daily/index.html" title="Daily challenge streak">🔥 ${n}</a>`; } catch (e) { return ''; } })()}
    <a class="jobs-pill rs-pill" href="${base}resume/index.html" aria-label="Resume builder">📄</a><a class="jobs-pill" href="${base}jobs/index.html"${page === 'jobs' ? ' aria-current="page"' : ''}><span class="lv"></span>Jobs</a></div>`;
  document.body.prepend(head);

  function lessonRow(t, l, i) {
    const d = isDone(t.id, l.id), soon = l.status !== 'live';
    const tag = soon ? 'div' : 'a';
    return `<${tag} class="lesson${soon ? ' soon' : ''}${d ? ' done' : ''}" style="--c:${t.color}"${l.companies ? ` data-co="${esc(l.companies.join('|'))}" data-sector="${esc(l.sector || '')}"` : ''}${soon ? ' aria-disabled="true"' : ` href="${lessonHref(t, l)}"`}>
      <span class="ix"${l.bonus ? ` title="${esc(l.bonusTitle || 'Visual lesson')}"` : ''}>${l.bonus ? '★' : (l.session || i + 1)}</span>
      <div style="min-width:0"><h4>${esc(l.title)}</h4><p>${esc(l.summary)}</p>
        <div class="tags"><span class="tag t">${esc(t.name)}</span>${l.tags.map(g => `<span class="tag">${esc(g)}</span>`).join('')}</div></div>
      <div class="side"><span class="pill">${soon ? 'Coming soon' : d ? 'Done' : 'Start'}</span><span>${esc(l.level)} · ${l.mins} min</span></div>
    </${tag}>`;
  }

  const main = document.querySelector('main');
  if (page === 'home') {
    const total = D.topics.reduce((n, t) => n + live(t).length, 0);
    main.innerHTML = `
    <section class="hero shell">
      <div class="eyebrow">Visual AI lessons · by ${esc(D.site.author)}</div>
      <h1>See how AI works, <em>one step at a time.</em></h1>
      <p>${esc(D.site.tagline)} Every lesson is an animation you can pause, replay and click through.</p>
      <div class="cta"><a class="btn" href="${base}start.html">New to AI? Start here →</a><a class="btn ghost" href="${base}jobs/index.html">💼 Live AI jobs</a><a class="btn ghost" href="${base}glossary.html">📖 Glossary of AI terms</a></div>
      <div class="pipe" aria-hidden="true"><span>tokens</span><i>→</i><span>transformer</span><i>→</i><span>agents</span><i>→</i><span>guardrails</span><i>→</i><span>production</span></div>
      <label class="search" for="q"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        <input id="q" type="search" placeholder="Search lessons: RLHF, prompt injection, MCP…" autocomplete="off"></label>
    </section>
    <section class="sec shell">
      <div class="sec-h"><h2>Practise & grow</h2><span class="meta">streaks, XP, badges and certificates</span></div>
      <div class="home-eng">
        <a href="${base}daily/index.html"><i>🔥</i><b>Daily challenge</b><span>One interview question a day. Keep your streak alive.</span></a>
        <a href="${base}mock/index.html"><i>🎤</i><b>Mock interview</b><span>Timed questions from 1,400+ real ones, with a readiness report.</span></a>
        <a href="${base}roadmaps/index.html"><i>🗺️</i><b>Career roadmaps</b><span>Week-by-week plans: fresher, switcher, DSA, product company, banking.</span></a>
        <a href="${base}dsa/problems/index.html"><i>🧩</i><b>DSA practice</b><span>90 coding problems with a code editor, 4 languages and visualizers.</span></a>
        <a href="${base}projects/index.html"><i>🛠️</i><b>Portfolio projects</b><span>10 job-ready projects with code and resume lines.</span></a>
        <a href="${base}resume/index.html"><i>📄</i><b>Resume builder</b><span>ATS-friendly templates, job-description match, score and PDF. Free, no sign-up.</span></a>
        <a href="${base}certificate/index.html"><i>🎓</i><b>Certificates</b><span>Finish a track and add it to LinkedIn.</span></a>
      </div>
    </section>
    <section class="sec shell" id="topics-sec">
      <div class="sec-h"><h2>Topics</h2><span class="meta">${total} lessons live, more every week</span></div>
      <div class="topics">${D.topics.map(t => `<a class="topic" style="--c:${t.color}" href="${base}${t.id}/index.html">
        <span class="glyph" aria-hidden="true"><b></b><i></i><b></b><i></i><b></b></span>
        <h3>${esc(t.name)}</h3><p>${esc(t.blurb)}</p>
        <span class="count">${live(t).length} live · ${t.lessons.length - live(t).length} coming</span></a>`).join('')}</div>
    </section>
    <section class="sec shell">
      <div class="sec-h"><h2 id="list-h">Start here</h2><span class="meta" id="list-meta"></span></div>
      <div class="lessons" id="list"></div>
    </section>`;
    const all = D.topics.flatMap(t => t.lessons.map((l, i) => ({ t, l, i })));
    const list = document.getElementById('list'), q = document.getElementById('q');
    function draw() {
      const s = q.value.trim().toLowerCase();
      const rows = s ? all.filter(({ t, l }) => [l.title, l.summary, t.name, ...l.tags].join(' ').toLowerCase().includes(s))
                     : all.filter(({ l }) => l.status === 'live');
      document.getElementById('list-h').textContent = s ? 'Results' : 'Start here';
      document.getElementById('list-meta').textContent = s ? `${rows.length} match${rows.length === 1 ? '' : 'es'}` : 'Live lessons';
      list.innerHTML = rows.length ? rows.map(({ t, l, i }) => lessonRow(t, l, i)).join('') : `<div class="empty">No lessons match “${esc(q.value)}” yet. Try “agents” or “OWASP”.</div>`;
    }
    q.addEventListener('input', draw); draw();
  }

  if (page === 'topic') {
    const t = D.topics.find(x => x.id === document.body.dataset.topic);
    document.title = `${t.name} · ${D.site.name}`;
    const lv = live(t), n = lv.filter(l => isDone(t.id, l.id)).length;
    main.innerHTML = `
    <section class="topic-hero shell" style="--c:${t.color}">
      <nav class="crumbs" aria-label="Breadcrumb"><a href="${base}index.html">Home</a><span>›</span><span>${esc(t.name)}</span></nav>
      <h1>${esc(t.name)}</h1><p>${esc(t.blurb)}</p>
      <div class="progress"><div class="bar"><i style="width:${lv.length ? n / lv.length * 100 : 0}%"></i></div><span>${n} of ${lv.length} live lessons done</span></div>
      ${(t.links || []).map(x => `<a class="quest-cta" href="${base}${t.id}/${x.href}"><span class="qi">${x.icon}</span><span><b>${esc(x.title)}</b><small>${esc(x.text)}</small></span><span class="go">Open →</span></a>`).join('')}
      ${t.quest ? `<a class="quest-cta" href="${base}${t.id}/${t.quest}"><span class="qi">🎮</span><span><b>Quest mode: learn by playing</b><small>Short cards from basics to advanced, points for every right answer, real-world scenarios and interview questions.</small></span><span class="go">Play →</span></a>` : ''}
    </section>
    ${t.modules ? t.modules.map(m => `<section class="sec shell module">
      <div class="mod-h" style="--c:${t.color}"><span class="mod-n">Module ${m.n}</span><div style="flex:1;min-width:0"><h2>${esc(m.title)}</h2><p>${esc(m.objective)} · ${m.label ? esc(m.label) : `${({ 'aws-saa': 'Days', 'langchain-course': 'Labs' })[t.id] || 'Sessions'} ${m.sessions[0]}–${m.sessions[m.sessions.length - 1]}`}</p></div>${t.nocheat ? '' : `<a class="cheat" href="${base}${t.id}/cheatsheet-m${m.n}.html">📄 Cheat sheet</a>`}</div>
      <div class="lessons">${t.lessons.filter(l => l.module === m.n).map((l, i) => lessonRow(t, l, i)).join('')}</div></section>`).join('')
      : `<section class="sec shell"><div class="lessons">${t.lessons.map((l, i) => lessonRow(t, l, i)).join('')}</div></section>`}`;
    if (t.picker) companyPicker(t);
  }

  // Company picker: search or tap a company (or a sector) to show only its interview pages.
  function companyPicker(t) {
    const count = {}, sectorOf = {};
    t.lessons.forEach(l => (l.companies || []).forEach(c => { count[c] = (count[c] || 0) + 1; sectorOf[c] = l.sector || 'Other'; }));
    const names = Object.keys(count).sort((a, b) => a.localeCompare(b));
    const sectors = [...new Set(t.lessons.map(l => l.sector).filter(Boolean))];
    const box = document.createElement('section');
    box.className = 'shell co-wrap'; box.style.setProperty('--c', t.color);
    box.innerHTML = `<div class="co-pick"><div class="co-h"><h2>🏢 Pick a company</h2><span class="co-n">${names.length} companies · ${t.lessons.length} pages</span></div>
      <div class="co-row"><input class="co-q" type="search" placeholder="Type a company, e.g. Amazon, TCS, Deloitte…" aria-label="Search companies" list="co-list">
        <datalist id="co-list">${names.map(n => `<option value="${esc(n)}">`).join('')}</datalist>
        <select class="co-sel" aria-label="Choose a company"><option value="">All companies</option>${names.map(n => `<option>${esc(n)}</option>`).join('')}</select></div>
      <div class="co-sec">${['All', ...sectors].map(s => `<button type="button" data-s="${esc(s)}"${s === 'All' ? ' class="on"' : ''}>${esc(s)}</button>`).join('')}</div>
      <div class="co-chips">${names.map(n => `<button type="button" data-c="${esc(n)}" data-s="${esc(sectorOf[n])}">${esc(n)}<i>${count[n]}</i></button>`).join('')}</div>
      <div class="co-res" hidden></div></div>`;
    document.querySelector('.topic-hero').after(box);
    const q = box.querySelector('.co-q'), sel = box.querySelector('.co-sel'), res = box.querySelector('.co-res');
    let co = '', sec = 'All';
    function apply(scroll) {
      const s = q.value.trim().toLowerCase();
      box.querySelectorAll('.co-sec button').forEach(b => b.classList.toggle('on', b.dataset.s === sec));
      box.querySelectorAll('.co-chips button').forEach(b => {
        b.hidden = !((sec === 'All' || b.dataset.s === sec) && (!s || b.dataset.c.toLowerCase().includes(s)));
        b.classList.toggle('on', b.dataset.c === co);
      });
      let shown = 0;
      document.querySelectorAll('.module').forEach(m => {
        let k = 0;
        m.querySelectorAll('.lesson').forEach(r => {
          const cs = (r.dataset.co || '').split('|');
          const ok = co ? cs.includes(co) : (sec === 'All' || r.dataset.sector === sec);
          r.hidden = !ok; if (ok) k++;
        });
        m.hidden = !k; shown += k;
      });
      sel.value = co;
      res.hidden = !co && sec === 'All';
      res.innerHTML = `Showing <b>${shown}</b> page${shown === 1 ? '' : 's'} for <b>${esc(co || sec)}</b> <button type="button" class="co-clear">✕ Show all</button>`;
      try { history.replaceState(null, '', co ? '#company=' + encodeURIComponent(co) : location.pathname); } catch (e) {}
      if (scroll && co) { const first = document.querySelector('.module:not([hidden])'); if (first) first.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    }
    box.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.classList.contains('co-clear')) { co = ''; sec = 'All'; q.value = ''; }
      else if (b.dataset.c) co = co === b.dataset.c ? '' : b.dataset.c;
      else if (b.dataset.s) { sec = b.dataset.s; co = ''; }
      apply(!!b.dataset.c);
    });
    q.addEventListener('input', () => { const hit = names.find(n => n.toLowerCase() === q.value.trim().toLowerCase()); co = hit || ''; apply(!!hit); });
    q.addEventListener('keydown', e => { if (e.key === 'Enter') { const hit = names.find(n => n.toLowerCase().includes(q.value.trim().toLowerCase())); if (hit) { co = hit; apply(true); } } });
    sel.addEventListener('change', () => { co = sel.value; q.value = ''; apply(true); });
    const h = decodeURIComponent((location.hash.match(/company=([^&]+)/) || [])[1] || '');
    if (names.includes(h)) co = h;
    apply(!!co);
  }

  // footer
  const f = document.createElement('footer');
  const L = D.site.links;
  f.innerHTML = `<div class="shell"><span>Created by <b>${esc(D.site.author)}</b> · ${esc(D.site.name)}</span>
    <span class="links">${L.linkedin ? `<a href="${esc(L.linkedin)}" target="_blank" rel="noopener">LinkedIn</a>` : ''}${L.telegram ? `<a href="${esc(L.telegram)}" target="_blank" rel="noopener">Telegram</a>` : ''}</span></div>`;
  document.body.append(f);
})();
