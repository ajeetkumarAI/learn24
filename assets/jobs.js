/* Learn24 live AI jobs board. Pulls /api/jobs?source=… (cached per source on Vercel), merges with featured.json,
   filters by role, location, date and platform, saves favourites in this browser and refreshes every 15 minutes. */
(function () {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const root = $('#jobs'); if (!root) return;
  const API = root.dataset.api || '../api/jobs', FEAT = root.dataset.featured || '../jobs/featured.json';
  const SRC = { remotive: ['Remotive', 'https://remotive.com'], jobicy: ['Jobicy', 'https://jobicy.com'], remoteok: ['Remote OK', 'https://remoteok.com'], adzuna: ['Adzuna', 'https://www.adzuna.in'] };
  const CATS = [['all', 'All AI roles'], ['genai', '🤖 GenAI & LLM'], ['ml', '📊 ML & Data Science'], ['data-eng', '🛠 Data Engineering'], ['mlops', '☁️ MLOps & Platform'], ['ai', '✨ Other AI']];
  const WHERE = [['any', '🌏 Anywhere'], ['india', '📍 India'], ['remote', '🏠 Remote']];
  const WHEN = [['0', 'Any time'], ['1', 'Last 24 h'], ['3', '3 days'], ['7', '7 days'], ['30', '30 days']];
  const KEY = 'learn24-jobs', load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; } };
  const save = v => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} };
  const S = load(); S.saved = S.saved || {}; const lastVisit = S.last || 0; S.last = Date.now(); save(S);
  let all = [], featured = [], status = {}, shown = 30;
  const F = { q: '', cat: 'all', where: 'any', when: '0', src: new Set(Object.keys(SRC)), saved: false };

  const ago = iso => { if (!iso) return ''; const m = (Date.now() - new Date(iso)) / 6e4; return m < 60 ? `${Math.max(1, m | 0)} min ago` : m < 1440 ? `${(m / 60) | 0} h ago` : m < 43200 ? `${(m / 1440) | 0} d ago` : new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }); };
  const isIndia = j => /india|bengaluru|bangalore|mumbai|pune|hyderabad|chennai|delhi|gurgaon|gurugram|noida|kolkata|ahmedabad|kochi|indore|apac|asia/i.test(j.location) || j.source === 'adzuna';
  const initials = s => (s || '?').split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();

  root.innerHTML = `
  <section class="jb-hero"><nav class="crumbs" aria-label="Breadcrumb"><a href="../index.html">Home</a><span>›</span><span>Live AI jobs</span></nav>
    <h1>💼 Live AI &amp; GenAI Jobs</h1>
    <p class="lead">Fresh AI, GenAI, ML and data roles from several job platforms in one place. Filter, save the ones you like, and apply on the original site in one click.</p>
    <div class="jb-status" aria-live="polite"><span class="dot"></span><span data-st>Loading live jobs…</span><button type="button" class="jb-btn ghost" data-refresh>↻ Refresh</button></div></section>
  <section class="jb-feat" data-feat hidden></section>
  <div class="jb-bar">
    <input type="search" placeholder="Search title, company, skill… (e.g. LangChain, Bengaluru)" aria-label="Search jobs">
    <div class="jb-row" data-g="cat">${CATS.map(([k, l]) => `<button type="button" class="jb-chip" data-v="${k}" aria-pressed="${k === 'all'}">${l}</button>`).join('')}</div>
    <div class="jb-row"><span class="jb-lab">Where</span><span data-g="where">${WHERE.map(([k, l]) => `<button type="button" class="jb-chip" data-v="${k}" aria-pressed="${k === 'any'}">${l}</button>`).join('')}</span>
      <span class="jb-lab">Posted</span><span data-g="when">${WHEN.map(([k, l]) => `<button type="button" class="jb-chip" data-v="${k}" aria-pressed="${k === '0'}">${l}</button>`).join('')}</span></div>
    <div class="jb-row"><span class="jb-lab">Platforms</span><span data-src></span><button type="button" class="jb-chip" data-saved aria-pressed="false">☆ Saved (<b>0</b>)</button></div>
  </div>
  <p class="jb-count" data-count></p>
  <div class="jb-list" data-list></div>
  <div class="jb-more"><button type="button" class="jb-btn" data-more hidden>Show more jobs</button></div>
  <section class="jb-plat"><h2>🔎 Search the same role on other job sites</h2><p>These sites have no public feed, so we link straight to their search results for your filters. Opens in a new tab.</p><div class="jb-links" data-links></div></section>
  <section class="jb-note"><div class="jb-warn"><b>⚠️ Stay safe:</b> genuine employers never ask you to pay for a job, training or "registration". Check the company's own careers page, and never share OTPs, bank or Aadhaar details with recruiters.</div>
    <p class="jb-attr">Jobs come from <a href="https://remotive.com" target="_blank" rel="noopener">Remotive</a>, <a href="https://remoteok.com" target="_blank" rel="noopener">Remote OK</a>, <a href="https://jobicy.com" target="_blank" rel="noopener">Jobicy</a> and <a href="https://www.adzuna.in" target="_blank" rel="noopener">Jobs by Adzuna</a>. Every listing links to its original post; Learn24 does not post or verify these jobs. Remotive listings appear 24 hours after posting.</p>
    <a class="quest-cta" href="../interview-questions/index.html" style="--c:var(--ac)"><span class="qi">🎯</span><span><b>Got an interview call?</b><small>Practise real TCS, Infosys, Wipro, Deloitte, EY, PwC and Google questions, and the 145 must-know GenAI questions.</small></span><span class="go">Practise →</span></a></section>`;

  const srcBox = $('[data-src]', root);
  const paintSrc = () => { srcBox.innerHTML = Object.entries(SRC).map(([k, [n]]) => { const st = status[k] || {}; const c = all.filter(j => j.source === k).length;
    return `<button type="button" class="jb-chip src" data-s="${k}" aria-pressed="${F.src.has(k)}" title="${st.error === 'not-configured' ? 'Not connected yet' : st.error ? 'Could not load right now' : ''}">${esc(n)} <b>${st.loading ? '…' : st.error ? '–' : c}</b></button>`; }).join('');
    $$('[data-s]', srcBox).forEach(b => b.onclick = () => { F.src.has(b.dataset.s) ? F.src.delete(b.dataset.s) : F.src.add(b.dataset.s); shown = 30; paintSrc(); render(); }); };

  function card(j, feat) {
    feat = feat || j.source === 'featured';
    const saved = !!S.saved[j.id], fresh = j.posted && Date.now() - new Date(j.posted) < 864e5, newVisit = !feat && j.posted && new Date(j.posted) > lastVisit && lastVisit;
    const src = feat ? `<span class="jb-src feat">⭐ Shared by Ajeetkumar</span>` : `<a class="jb-src" href="${esc(SRC[j.source][1])}" target="_blank" rel="noopener">via ${esc(SRC[j.source][0])}</a>`;
    return `<article class="jb-card${feat ? ' featured' : ''}">
      <div class="jb-logo"><span>${esc(initials(j.company))}</span>${j.logo ? `<img src="${esc(j.logo)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : ''}</div>
      <div class="jb-main"><h3><a href="${esc(j.url)}" target="_blank" rel="noopener nofollow">${esc(j.title)}</a></h3>
        <p class="jb-meta"><b>${esc(j.company)}</b> · 📍 ${esc(j.location || 'Not stated')}${j.type ? ` · ${esc(j.type)}` : ''}${j.salary ? ` · 💰 ${esc(j.salary)}` : ''}</p>
        ${j.note ? `<p class="jb-noteline">${esc(j.note)}</p>` : ''}
        <div class="jb-tags">${fresh ? '<span class="new">NEW</span>' : ''}${newVisit && !fresh ? '<span class="new">New since your last visit</span>' : ''}${isIndia(j) ? '<span>📍 India / APAC</span>' : ''}${j.remote ? '<span>🏠 Remote</span>' : ''}${(j.tags || []).slice(0, 3).map(t => `<span>${esc(t)}</span>`).join('')}</div></div>
      <div class="jb-side"><span class="jb-ago">${esc(ago(j.posted))}</span>${src}
        <div class="jb-acts"><button type="button" class="jb-save" data-id="${esc(j.id)}" aria-pressed="${saved}" title="${saved ? 'Remove from saved' : 'Save for later'}">${saved ? '★' : '☆'}</button><a class="jb-btn" href="${esc(j.url)}" target="_blank" rel="noopener nofollow">Apply →</a></div></div></article>`;
  }

  function filtered() {
    const words = F.q.toLowerCase().split(/\s+/).filter(Boolean), days = +F.when;
    let list = F.saved ? Object.values(S.saved) : all.filter(j => F.src.has(j.source));
    return list.filter(j => (F.cat === 'all' || j.cat === F.cat)
      && (F.where === 'any' || (F.where === 'india' ? isIndia(j) : j.remote))
      && (!days || (j.posted && Date.now() - new Date(j.posted) < days * 864e5))
      && (!words.length || words.every(w => `${j.title} ${j.company} ${j.location} ${(j.tags || []).join(' ')}`.toLowerCase().includes(w))));
  }
  function render() {
    const list = filtered(), out = list.slice(0, shown);
    $('[data-list]', root).innerHTML = out.length ? out.map(j => card(j)).join('') : `<p class="jb-empty">${F.saved ? 'No saved jobs yet. Tap ☆ on any job to save it here.' : all.length ? 'No jobs match these filters. Try “Anywhere” or “Any time”, or search on the other job sites below.' : 'Live jobs are loading…'}</p>`;
    $('[data-count]', root).textContent = list.length ? `Showing ${out.length} of ${list.length} jobs${F.saved ? ' you saved' : ''}` : '';
    $('[data-more]', root).hidden = list.length <= shown;
    $('[data-saved] b', root).textContent = Object.keys(S.saved).length;
    $$('.jb-save', root).forEach(b => b.onclick = () => { const id = b.dataset.id, j = all.find(x => x.id === id) || featured.find(x => x.id === id) || S.saved[id];
      if (S.saved[id]) delete S.saved[id]; else if (j) S.saved[id] = j; save(S); render(); paintFeat(); });
    links();
  }
  function links() {
    const role = F.q || ({ genai: 'Generative AI', ml: 'Machine Learning Engineer', 'data-eng': 'Data Engineer', mlops: 'MLOps Engineer', ai: 'AI Engineer', all: 'AI Engineer' })[F.cat];
    const loc = F.where === 'remote' ? 'Remote' : 'India', q = encodeURIComponent(role), slug = role.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const P = [['LinkedIn', `https://www.linkedin.com/jobs/search/?keywords=${q}&location=${encodeURIComponent(loc)}&f_TPR=r604800`],
      ['Naukri', `https://www.naukri.com/${slug}-jobs${F.where === 'remote' ? '?wfhType=2' : ''}`],
      ['Indeed India', `https://in.indeed.com/jobs?q=${q}${F.where === 'remote' ? '&l=Remote' : ''}&sort=date`],
      ['Glassdoor', `https://www.glassdoor.co.in/Job/jobs.htm?sc.keyword=${q}`],
      ['foundit', `https://www.foundit.in/srp/results?query=${q}`],
      ['Google Jobs', `https://www.google.com/search?q=${encodeURIComponent(role + ' jobs ' + loc)}&ibp=htl;jobs`],
      ['Wellfound (startups)', 'https://wellfound.com/jobs']];
    $('[data-links]', root).innerHTML = P.map(([n, u]) => `<a class="jb-btn ghost" href="${esc(u)}" target="_blank" rel="noopener nofollow">${esc(n)}: “${esc(role)}” ↗</a>`).join('');
  }
  function paintFeat() {
    const box = $('[data-feat]', root); box.hidden = !featured.length;
    if (featured.length) box.innerHTML = `<h2>⭐ Featured openings</h2><p class="jb-sub">Shared by Ajeetkumar for the Learn24 community.</p><div class="jb-list">${featured.map(j => card(j, true)).join('')}</div>`;
    $$('.jb-save', box).forEach(b => b.onclick = () => { const id = b.dataset.id, j = featured.find(x => x.id === id); if (S.saved[id]) delete S.saved[id]; else S.saved[id] = j; save(S); paintFeat(); render(); });
  }
  function setStatus() {
    const ok = Object.values(status).filter(s => !s.loading && !s.error).length, loading = Object.values(status).some(s => s.loading);
    const times = Object.values(status).filter(s => s.fetchedAt).map(s => +new Date(s.fetchedAt)), newest = times.length ? Math.max(...times) : 0;
    const fresh = lastVisit ? all.filter(j => j.posted && new Date(j.posted) > lastVisit).length : 0;
    $('.jb-status', root).classList.toggle('off', !ok && !loading);
    $('[data-st]', root).textContent = loading ? 'Loading live jobs…' : ok ? `Live · ${all.length} AI jobs from ${ok} platform${ok > 1 ? 's' : ''} · updated ${ago(new Date(newest).toISOString())}${fresh ? ` · ${fresh} new since your last visit` : ''} · refreshes every 15 min`
      : 'Live feeds could not be reached right now. Use the job-site links below, or try again in a few minutes.';
  }

  async function fetchAll() {
    Object.keys(SRC).forEach(k => status[k] = { loading: true }); setStatus(); paintSrc();
    const before = new Set(all.map(j => j.id));
    const res = await Promise.all(Object.keys(SRC).map(k => fetch(`${API}?source=${k}`).then(r => r.json()).catch(e => ({ source: k, jobs: [], error: String(e) }))));
    const map = new Map();
    res.forEach((r, i) => { const k = Object.keys(SRC)[i]; status[k] = { fetchedAt: r.fetchedAt, error: r.error };
      (r.jobs || []).forEach(j => { const key = (j.title + '|' + j.company).toLowerCase().replace(/[^a-z0-9|]/g, ''); if (!map.has(key)) map.set(key, j); }); });
    all = [...map.values()].sort((a, b) => (b.posted || '').localeCompare(a.posted || ''));
    const added = before.size ? all.filter(j => !before.has(j.id)).length : 0;
    setStatus(); paintSrc(); render();
    if (added) toast(`🔔 ${added} new job${added > 1 ? 's' : ''} just arrived`);
  }
  function toast(t) { const d = document.createElement('div'); d.className = 'prep-toast'; d.textContent = t; document.body.append(d); setTimeout(() => d.remove(), 3000); }

  // filters
  $$('[data-g]', root).forEach(g => $$('.jb-chip', g).forEach(b => b.onclick = () => { $$('.jb-chip', g).forEach(x => x.setAttribute('aria-pressed', String(x === b))); F[g.dataset.g] = b.dataset.v; shown = 30; render(); }));
  $('[data-saved]', root).onclick = e => { F.saved = !F.saved; e.currentTarget.setAttribute('aria-pressed', String(F.saved)); shown = 30; render(); };
  let tq; $('input[type=search]', root).oninput = e => { clearTimeout(tq); tq = setTimeout(() => { F.q = e.target.value.trim(); shown = 30; render(); }, 150); };
  $('[data-more]', root).onclick = () => { shown += 30; render(); };
  $('[data-refresh]', root).onclick = fetchAll;
  setInterval(() => { if (!document.hidden) fetchAll(); }, 15 * 60 * 1000);
  setInterval(setStatus, 60 * 1000);

  fetch(FEAT).then(r => r.json()).then(d => { featured = (Array.isArray(d) ? d : d.jobs || []).filter(j => j && j.title && j.url && !(j.expires && new Date(j.expires) < new Date()))
    .map((j, i) => ({ id: 'ft-' + (j.id || i), remote: /remote/i.test(j.location || ''), tags: [], ...j, source: 'featured', company: j.company || '' })); paintFeat(); }).catch(() => {});
  paintSrc(); render(); fetchAll();
})();
