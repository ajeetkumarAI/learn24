/* Adds the Learn24 bar, breadcrumb, previous/next links and "mark as done" to any lesson page.
   Usage at the end of a lesson: <script src="../assets/data.js"></script><script src="../assets/lesson.js" data-lesson="topic-id/lesson-id"></script> */
(function () {
  const D = window.LEARN24, me = document.currentScript;
  const [tid, lid] = (me.dataset.lesson || '').split('/');
  const t = D.topics.find(x => x.id === tid); if (!t) return;
  const live = t.lessons.filter(l => l.status === 'live');
  const i = live.findIndex(l => l.id === lid), l = live[i];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const KEY = 'learn24-done', id = tid + '/' + lid;
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; } };
  const write = v => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} };

  const css = document.createElement('style');
  css.textContent = `
  .l24-bar{position:sticky;top:0;z-index:50;background:var(--l24-bar);backdrop-filter:blur(8px);border-bottom:1px solid var(--l24-line);font-family:"IBM Plex Sans",system-ui,sans-serif}
  .l24-in{max-width:1080px;margin:0 auto;display:flex;align-items:center;gap:14px;height:52px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));font-size:14px;color:var(--l24-muted)}
  .l24-brand{font-family:"Bricolage Grotesque","IBM Plex Sans",sans-serif;font-weight:700;font-size:18px;color:var(--l24-fg);text-decoration:none;display:flex;gap:6px;align-items:center}
  .l24-brand span{font-family:"IBM Plex Mono",monospace;font-size:12px;font-weight:500;background:var(--l24-chip);color:var(--l24-chipfg);border-radius:5px;padding:0 5px}
  .l24-in a{color:var(--l24-muted);text-decoration:none}.l24-in a:hover{color:var(--l24-fg)}
  .l24-crumb{display:flex;gap:7px;min-width:0;overflow:hidden;white-space:nowrap}
  .l24-gl{margin-left:auto;flex:none;font-size:13.5px}
  .l24-crumb b{color:var(--l24-fg);font-weight:500;overflow:hidden;text-overflow:ellipsis}
  .l24-nav{max-width:820px;margin:8px auto 40px;display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:stretch;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));font-family:"IBM Plex Sans",system-ui,sans-serif}
  .l24-nav a,.l24-nav button{display:flex;flex-direction:column;gap:2px;background:var(--l24-panel);border:1px solid var(--l24-line);border-radius:12px;padding:12px 14px;color:var(--l24-fg);text-decoration:none;font:inherit;font-size:14.5px;min-width:0}
  .l24-nav a:hover{border-color:var(--l24-tc)}
  .l24-nav small{font-size:12px;color:var(--l24-muted);text-transform:uppercase;letter-spacing:.08em}
  .l24-nav .nx{text-align:right;align-items:flex-end}
  .l24-nav button{cursor:pointer;justify-content:center;align-items:center;font-weight:600;color:var(--l24-tc);border-color:var(--l24-tc)}
  .l24-nav button[aria-pressed="true"]{background:var(--l24-tc);color:var(--l24-chipfg)}
  .l24-nav .ph{visibility:hidden}
  @media (max-width:560px){.l24-glt{display:none}.l24-nav{grid-template-columns:1fr 1fr}.l24-nav button{grid-column:1/-1;order:-1}.l24-crumb .l24-t{display:none}}`;
  document.head.append(css);

  const bar = document.createElement('div');
  bar.className = 'l24-bar';
  bar.innerHTML = `<div class="l24-in"><a class="l24-brand" href="../index.html">Learn<span>24</span></a>
    <nav class="l24-crumb" aria-label="Breadcrumb"><a class="l24-t" href="../index.html">Home</a><span class="l24-t">›</span><a href="index.html">${esc(t.name)}</a><span>›</span><b>${esc(l ? l.title : '')}</b></nav><a class="l24-gl" href="../glossary.html" title="Glossary of AI terms">📖<span class="l24-glt"> Glossary</span></a></div>`;
  bar.style.setProperty('--l24-tc', t.color);
  document.body.prepend(bar);

  const prev = live[i - 1], next = live[i + 1];
  const nav = document.createElement('nav');
  nav.className = 'l24-nav'; nav.style.setProperty('--l24-tc', t.color); nav.setAttribute('aria-label', 'Lesson navigation');
  nav.innerHTML = `${prev ? `<a href="${prev.id}.html"><small>← Previous</small>${esc(prev.title)}</a>` : `<a href="index.html"><small>← Back to</small>All ${esc(t.name)} lessons</a>`}
    <button type="button" id="l24-done" aria-pressed="false">Mark as done</button>
    ${next ? `<a class="nx" href="${next.id}.html"><small>Next →</small>${esc(next.title)}</a>` : `<a class="nx" href="../index.html"><small>Next →</small>Explore other topics</a>`}`;
  document.body.append(nav);
  const btn = nav.querySelector('#l24-done');
  const paint = () => { const d = read().includes(id); btn.setAttribute('aria-pressed', String(d)); btn.textContent = d ? '✓ Done' : 'Mark as done'; };
  btn.onclick = () => { const v = read(); const k = v.indexOf(id); k >= 0 ? v.splice(k, 1) : v.push(id); write(v); paint(); };
  paint();

  // hover definitions for key terms (assets/glossary.js)
  if (!window.L24_GLOSSARY_LOADED) { const g = document.createElement('script'); g.src = me.src.replace(/lesson\.js(\?.*)?$/, 'glossary.js'); document.body.append(g); }
})();
