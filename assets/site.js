/* Renders the header, home page, topic pages and footer from assets/data.js. Works on file:// and on Vercel. */
(function () {
  const D = window.LEARN24, me = document.currentScript;
  const base = me.dataset.base || '';
  const page = document.body.dataset.page;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const done = (() => { try { return JSON.parse(localStorage.getItem('learn24-done') || '[]'); } catch (e) { return []; } })();
  const isDone = (t, l) => done.includes(t + '/' + l);
  const live = t => t.lessons.filter(l => l.status === 'live');
  const lessonHref = (t, l) => `${base}${t.id}/${l.id}.html`;

  // header
  const head = document.createElement('header');
  head.className = 'top';
  head.innerHTML = `<div class="shell"><a class="brand" href="${base}index.html" aria-label="${esc(D.site.name)} home">Learn<span class="n">24</span></a>
    <nav class="nav" aria-label="Topics">${D.topics.map(t => `<a href="${base}${t.id}/index.html"${document.body.dataset.topic === t.id ? ' aria-current="page"' : ''}>${esc(t.name)}</a>`).join('')}
      <a class="nav-x" href="${base}start.html"${page === 'start' ? ' aria-current="page"' : ''}>Start here</a><a class="nav-x" href="${base}glossary.html"${page === 'glossary' ? ' aria-current="page"' : ''}>Glossary</a></nav></div>`;
  document.body.prepend(head);

  function lessonRow(t, l, i) {
    const d = isDone(t.id, l.id), soon = l.status !== 'live';
    const tag = soon ? 'div' : 'a';
    return `<${tag} class="lesson${soon ? ' soon' : ''}${d ? ' done' : ''}" style="--c:${t.color}"${soon ? ' aria-disabled="true"' : ` href="${lessonHref(t, l)}"`}>
      <span class="ix">${l.session || i + 1}</span>
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
      <div class="cta"><a class="btn" href="${base}start.html">New to AI? Start here →</a><a class="btn ghost" href="${base}glossary.html">📖 Glossary of AI terms</a></div>
      <div class="pipe" aria-hidden="true"><span>tokens</span><i>→</i><span>transformer</span><i>→</i><span>agents</span><i>→</i><span>guardrails</span><i>→</i><span>production</span></div>
      <label class="search" for="q"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        <input id="q" type="search" placeholder="Search lessons: RLHF, prompt injection, MCP…" autocomplete="off"></label>
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
    </section>
    ${t.modules ? t.modules.map(m => `<section class="sec shell module">
      <div class="mod-h" style="--c:${t.color}"><span class="mod-n">Module ${m.n}</span><div style="flex:1;min-width:0"><h2>${esc(m.title)}</h2><p>${esc(m.objective)} · Sessions ${m.sessions[0]}–${m.sessions[m.sessions.length - 1]}</p></div><a class="cheat" href="${base}${t.id}/cheatsheet-m${m.n}.html">📄 Cheat sheet</a></div>
      <div class="lessons">${t.lessons.filter(l => l.module === m.n).map((l, i) => lessonRow(t, l, i)).join('')}</div></section>`).join('')
      : `<section class="sec shell"><div class="lessons">${t.lessons.map((l, i) => lessonRow(t, l, i)).join('')}</div></section>`}`;
  }

  // footer
  const f = document.createElement('footer');
  const L = D.site.links;
  f.innerHTML = `<div class="shell"><span>Created by <b>${esc(D.site.author)}</b> · ${esc(D.site.name)}</span>
    <span class="links">${L.linkedin ? `<a href="${esc(L.linkedin)}" target="_blank" rel="noopener">LinkedIn</a>` : ''}${L.telegram ? `<a href="${esc(L.telegram)}" target="_blank" rel="noopener">Telegram</a>` : ''}</span></div>`;
  document.body.append(f);
})();
