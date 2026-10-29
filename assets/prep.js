/* Learn24 Interview Prep: turns a page of question cards (.qa) into active practice.
   Practice mode hides answers: think or say your answer, reveal, then rate yourself (knew it / partly / review).
   Ratings are saved in this browser; search, filters, a random drill and progress are built in. */
(function () {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = $('.prep'); if (!root) return;
  const page = root.dataset.page, KEY = 'learn24-prep', MODE = 'learn24-prep-mode';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; } };
  const save = v => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} };
  const st = load(); st[page] = st[page] || {};
  const R = st[page], cards = $$('.qa', root), total = cards.length;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const css = `
  .prep-bar{position:sticky;top:52px;z-index:20;background:color-mix(in srgb,var(--bg) 93%,transparent);backdrop-filter:blur(8px);border-bottom:1px solid var(--line);padding:10px 0;margin:6px 0 16px;display:flex;flex-direction:column;gap:8px}
  .prep-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
  .prep-bar input[type=search]{flex:1;min-width:180px;font:15px var(--sans);padding:9px 12px;border-radius:10px;border:1.5px solid var(--line);background:var(--panel);color:var(--fg)}
  .prep-chip{font:600 13px var(--sans);padding:6px 11px;border-radius:999px;border:1.5px solid var(--line);background:var(--panel2);color:var(--muted);cursor:pointer;white-space:nowrap}
  .prep-chip[aria-pressed="true"]{border-color:var(--ac);color:var(--fg);background:color-mix(in srgb,var(--ac) 16%,var(--panel2))}
  .prep-mode{display:inline-flex;border:1.5px solid var(--line);border-radius:10px;overflow:hidden}
  .prep-mode button{font:600 13px var(--sans);padding:7px 11px;border:0;background:var(--panel2);color:var(--muted);cursor:pointer}
  .prep-mode button[aria-pressed="true"]{background:var(--ac);color:var(--bg)}
  .prep-prog{flex:1 1 260px;min-width:0;display:flex;align-items:center;gap:10px;font-size:13.5px;color:var(--muted)}
  .prep-prog .bar{flex:1;height:8px;border-radius:5px;background:var(--panel2);overflow:hidden;display:flex}
  .prep-prog .bar i{height:100%;transition:width .4s} .prep-prog .k{background:var(--green)} .prep-prog .p{background:var(--amber)} .prep-prog .r{background:var(--red)}
  .prep-btn{font:700 13.5px var(--sans);padding:8px 13px;border-radius:10px;border:0;background:var(--ac);color:var(--bg);cursor:pointer}
  .prep-btn.ghost{background:transparent;border:1.5px solid var(--line);color:var(--fg)}
  .qa{border:1.5px solid var(--line);border-radius:14px;background:var(--panel);margin:12px 0;scroll-margin-top:150px;transition:border-color .2s}
  .qa.k{border-color:color-mix(in srgb,var(--green) 60%,var(--line))} .qa.p{border-color:color-mix(in srgb,var(--amber) 60%,var(--line))} .qa.r{border-color:color-mix(in srgb,var(--red) 55%,var(--line))}
  .qa.flash{animation:${reduce ? 'none' : 'qaflash 1.2s ease'}} @keyframes qaflash{0%,60%{box-shadow:0 0 0 4px color-mix(in srgb,var(--ac) 45%,transparent)}100%{box-shadow:none}}
  .qa-h{display:flex;gap:12px;align-items:flex-start;padding:14px 16px;cursor:pointer}
  .qa-n{flex:none;min-width:34px;height:30px;padding:0 6px;border-radius:9px;display:grid;place-items:center;font:700 12.5px var(--mono);background:var(--panel2);border:1px solid var(--line);color:var(--ac)}
  .qa-q{flex:1;min-width:0;font-weight:600;font-size:16px;line-height:1.5;color:var(--fg);overflow-wrap:anywhere}
  .qa-tags{display:flex;flex-wrap:wrap;gap:5px;margin-top:6px}
  .qa-tags span{font:600 11.5px var(--sans);padding:2px 8px;border-radius:999px;background:var(--panel2);border:1px solid var(--line);color:var(--muted)}
  .qa-tags .star{color:#c98a00;border-color:#f2b84b} .qa-tags .code{color:var(--ac);border-color:var(--ac)}
  .qa-st{flex:none;font-size:18px;line-height:30px}
  .qa-b{padding:0 16px 14px 62px}
  .qa-think{display:flex;gap:10px;align-items:center;flex-wrap:wrap;font-size:14px;color:var(--muted)}
  .qa-ans{border-top:1px dashed var(--line);margin-top:4px;padding-top:10px;font-size:15.5px;line-height:1.65;overflow-wrap:anywhere;animation:${reduce ? 'none' : 'qain .35s ease'}}
  @keyframes qain{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
  .prep pre{background:#0b1220;color:#d6e0f0;border-radius:10px;padding:12px 14px;overflow-x:auto;font:13px/1.55 var(--mono);max-width:100%}
  .prep pre code{background:none;padding:0;border:0;border-radius:0;display:block;color:inherit;font:inherit;white-space:pre}
  .qa.open .qa-think{display:none}
  .prep table{min-width:0;font-size:14px} .prep .tw2{overflow-x:auto;margin:10px 0;max-width:100%}
  .qa-ans h1,.qa-ans h2,.qa-ans h3,.qa-ans h4,.qa-ans h5{font-size:15.5px;margin:14px 0 6px;color:var(--fg)}
  .qa-rate{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:14px;padding-top:10px;border-top:1px solid var(--line);font-size:14px;color:var(--muted)}
  .qa-rate button{font:600 13.5px var(--sans);padding:7px 11px;border-radius:9px;border:1.5px solid var(--line);background:var(--panel2);color:var(--fg);cursor:pointer}
  .qa-rate button[aria-pressed="true"]{border-color:var(--ac);background:color-mix(in srgb,var(--ac) 18%,var(--panel2))}
  .prep:not(.study) .qa:not(.open) .qa-ans,.prep:not(.study) .qa:not(.open) .qa-rate{display:none}
  .prep.study .qa-think{display:none}
  .qa.hide,.prep-sec.hide{display:none}
  .prep-empty{display:none;text-align:center;color:var(--muted);padding:20px} .prep-empty.on{display:block}
  .prep-toast{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);background:var(--fg);color:var(--bg);font:600 14px var(--sans);padding:9px 16px;border-radius:999px;z-index:60;animation:qain .3s ease}
  @media (max-width:600px){.qa-b{padding-left:16px}.prep-bar{top:52px}.qa-h{padding:12px 13px}}`;
  const s = document.createElement('style'); s.textContent = css; document.head.append(s);

  // wrap wide tables
  $$('table', root).forEach(t => { if (!t.parentElement.classList.contains('tw2')) { const w = document.createElement('div'); w.className = 'tw2'; t.before(w); w.append(t); } });

  const hasStar = cards.some(c => c.dataset.star), hasCode = cards.some(c => c.dataset.code);
  const bar = document.createElement('div'); bar.className = 'prep-bar';
  bar.innerHTML = `<div class="prep-row"><input type="search" placeholder="Search ${total} questions…" aria-label="Search questions">
    <span class="prep-mode" role="group" aria-label="Mode"><button type="button" data-m="practice">🎯 Practice</button><button type="button" data-m="study">📖 Study</button></span>
    <button class="prep-btn" type="button" data-rand>🎲 Random question</button></div>
    <div class="prep-row"><button class="prep-chip" type="button" data-f="all" aria-pressed="true">All</button>${hasStar ? '<button class="prep-chip" type="button" data-f="star">★ Must-know</button>' : ''}${hasCode ? '<button class="prep-chip" type="button" data-f="code">💻 Code</button>' : ''}<button class="prep-chip" type="button" data-f="new">🆕 Not tried</button><button class="prep-chip" type="button" data-f="r">🔁 Review again</button><button class="prep-chip" type="button" data-f="k">✅ Known</button>
    <span class="prep-prog"><span class="bar"><i class="k"></i><i class="p"></i><i class="r"></i></span><span data-pt></span></span></div>`;
  root.querySelector('.prep-start').after(bar);
  const empty = document.createElement('p'); empty.className = 'prep-empty'; empty.textContent = 'No questions match. Try another filter or search word.'; root.append(empty);

  let mode = 'practice'; try { mode = localStorage.getItem(MODE) || 'practice'; } catch (e) {}
  const setMode = m => { mode = m; root.classList.toggle('study', m === 'study'); $$('[data-m]', bar).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.m === m))); try { localStorage.setItem(MODE, m); } catch (e) {} };
  $$('[data-m]', bar).forEach(b => b.onclick = () => setMode(b.dataset.m)); setMode(mode);

  function prog() {
    const v = Object.values(R), k = v.filter(x => x === 'k').length, p = v.filter(x => x === 'p').length, r = v.filter(x => x === 'r').length;
    const [bk, bp, br] = $$('.prep-prog i', bar); bk.style.width = k / total * 100 + '%'; bp.style.width = p / total * 100 + '%'; br.style.width = r / total * 100 + '%';
    $('[data-pt]', bar).textContent = `✅ ${k} known · 🤔 ${p} partly · 🔁 ${r} review · ${total - v.length} not tried`;
    // mark the page done (topic list) when 80% are rated
    if (v.length >= Math.ceil(total * .8) && root.dataset.lesson) {
      try { const d = JSON.parse(localStorage.getItem('learn24-done') || '[]'); if (!d.includes(root.dataset.lesson)) { d.push(root.dataset.lesson); localStorage.setItem('learn24-done', JSON.stringify(d)); toast('🎉 Page complete! Marked as done.'); } } catch (e) {}
    }
  }
  function toast(t) { const d = document.createElement('div'); d.className = 'prep-toast'; d.textContent = t; document.body.append(d); setTimeout(() => d.remove(), 2200); }

  cards.forEach((c, i) => {
    const id = c.id, body = $('.qa-b', c), h = $('.qa-h', c);
    const think = document.createElement('div'); think.className = 'qa-think';
    think.innerHTML = '<span>💭 Answer it in your head or out loud first (aim for under 2 minutes).</span><button class="prep-btn" type="button">Show answer</button>';
    body.prepend(think);
    const rate = document.createElement('div'); rate.className = 'qa-rate';
    rate.innerHTML = '<span>How did you do?</span><button type="button" data-r="k">✅ I knew it</button><button type="button" data-r="p">🤔 Partly</button><button type="button" data-r="r">🔁 Review again</button>';
    body.append(rate);
    const paint = () => { const v = R[id]; c.classList.remove('k', 'p', 'r'); if (v) c.classList.add(v); $$('[data-r]', rate).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.r === v))); $('.qa-st', c).textContent = { k: '✅', p: '🤔', r: '🔁' }[v] || ''; };
    paint();
    const open = () => c.classList.add('open');
    $('button', think).onclick = open;
    h.onclick = e => { if (mode === 'practice' && !c.classList.contains('open')) open(); };
    $$('[data-r]', rate).forEach(b => b.onclick = () => { R[id] = b.dataset.r; save(st); paint(); prog(); });
  });

  // filters + search
  let f = 'all', q = '';
  function apply() {
    let shown = 0; const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    cards.forEach(c => {
      const v = R[c.id]; let ok = f === 'all' || (f === 'star' && c.dataset.star) || (f === 'code' && c.dataset.code) || (f === 'new' && !v) || (f === v);
      if (ok && words.length) { const t = c.textContent.toLowerCase(); ok = words.every(w => t.includes(w)); }
      c.classList.toggle('hide', !ok); if (ok) shown++;
    });
    $$('.prep-sec', root).forEach(sec => { const next = []; let el = sec.nextElementSibling; while (el && !el.classList.contains('prep-sec')) { if (el.classList.contains('qa')) next.push(el); el = el.nextElementSibling; }
      sec.classList.toggle('hide', (f !== 'all' || words.length) && next.length > 0 && next.every(x => x.classList.contains('hide'))); });
    empty.classList.toggle('on', !shown);
  }
  $$('[data-f]', bar).forEach(b => b.onclick = () => { f = b.dataset.f; $$('[data-f]', bar).forEach(x => x.setAttribute('aria-pressed', String(x === b))); apply(); });
  $('input', bar).oninput = e => { q = e.target.value; apply(); };
  $('[data-rand]', bar).onclick = () => {
    const pool = cards.filter(c => !c.classList.contains('hide') && R[c.id] !== 'k'); const list = pool.length ? pool : cards.filter(c => !c.classList.contains('hide'));
    if (!list.length) return; const c = list[Math.floor(Math.random() * list.length)];
    if (mode === 'practice') c.classList.remove('open');
    c.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); c.classList.remove('flash'); void c.offsetWidth; c.classList.add('flash');
  };
  prog();
  // render maths (KaTeX loads with defer on pages that need it)
  addEventListener('load', () => { if (window.renderMathInElement) try { renderMathInElement(root, { delimiters: [{ left: '\\[', right: '\\]', display: true }, { left: '\\(', right: '\\)', display: false }], throwOnError: false }); } catch (e) {} });
  if (location.hash) { const c = $(location.hash); if (c && c.classList.contains('qa')) setTimeout(() => c.scrollIntoView(), 50); }
})();
