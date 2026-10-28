/* Learn24 Quest mode: learn a concept in levels, answer to earn points, then scenarios and interview questions.
   Reusable for any course. A quest page has <div id="quest" data-course="..." data-lab="..."> and a
   <script type="application/json" id="quest-data"> with {title, lesson, next, prev, stages:[...]}.
   A hub page has <div id="quest-hub" data-course="..."> and JSON {title, labs:[{id, n, title, module, max}], ranks:[...]}.
   Stage types: learn, mcq (code:true for code options), order, scenario, interview. Progress is saved in this browser only. */
(function () {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const KEY = c => 'learn24-quest:' + c;
  const load = c => { try { return JSON.parse(localStorage.getItem(KEY(c)) || '{}'); } catch (e) { return {}; } };
  const save = (c, v) => { try { localStorage.setItem(KEY(c), JSON.stringify(v)); } catch (e) {} };
  const shuffle = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  const PTS = { mcq: 10, scenario: 15, order: 15 };
  const maxOf = st => { const q = st.filter(x => PTS[x.type]).length;   // includes the best possible streak bonus (+2 from the 3rd correct answer in a row)
    return st.reduce((s, x) => s + (x.type === 'interview' ? 5 * x.points.length : (PTS[x.type] || 0)), 0) + 2 * Math.max(0, q - 2); };
  const starsOf = (sc, mx) => sc >= mx * .9 ? 3 : sc >= mx * .7 ? 2 : sc >= mx * .4 ? 1 : 0;
  const DEFAULT_RANKS = [[0, '🌱 Beginner'], [150, '🔧 Builder'], [500, '🚀 Practitioner'], [1000, '🏆 Expert'], [1600, '👑 Master']];
  const rankOf = (xp, ranks) => (ranks || DEFAULT_RANKS).filter(r => xp >= r[0]).pop()[1];
  const totalXP = st => Object.values(st.labs || {}).reduce((s, l) => s + (l.best || 0), 0);

  const css = `
  .q-wrap{max-width:780px;margin:0 auto;padding:22px 0 40px}
  .q-hud{position:sticky;top:60px;z-index:5;background:color-mix(in srgb,var(--bg) 92%,transparent);backdrop-filter:blur(8px);padding:10px 0 8px;margin-bottom:14px;border-bottom:1px solid var(--line)}
  .q-hud .row1{display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap}
  .q-hud h1{font-size:clamp(18px,3.4vw,24px);margin:0;line-height:1.2}
  .q-chips{display:flex;gap:6px;flex-wrap:wrap}
  .q-chip{font:600 13px var(--sans);padding:5px 10px;border-radius:999px;background:var(--panel2);border:1px solid var(--line);color:var(--fg);white-space:nowrap}
  .q-chip.xp{border-color:var(--ac);color:var(--fg)} .q-chip b{color:var(--ac)}
  .q-track{display:flex;gap:4px;margin-top:9px}
  .q-track i{flex:1;height:7px;border-radius:4px;background:var(--panel2);border:1px solid var(--line);transition:background .3s}
  .q-track i.d{background:var(--ac);border-color:var(--ac)} .q-track i.c{background:color-mix(in srgb,var(--ac) 45%,var(--panel2))}
  .q-wrap,.q-card,.q-body,.q-q,.q-story,.q-fb,.q-model{min-width:0;overflow-wrap:anywhere} .q-body pre{max-width:100%}
  .q-card{background:var(--panel);border:1.5px solid var(--line);border-radius:16px;padding:20px 22px;animation:qin .45s ease both}
  @keyframes qin{from{opacity:0;transform:translateY(14px) scale(.985)}to{opacity:1;transform:none}}
  .q-lv{display:inline-flex;gap:6px;align-items:center;font:700 11.5px var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--ac);margin-bottom:8px}
  .q-card h2{font-size:clamp(19px,3.6vw,24px);margin:0 0 10px;line-height:1.25}
  .q-body{font-size:16px;line-height:1.65;color:var(--body)} .q-body p{margin:8px 0} .q-body ul{padding-left:20px;margin:8px 0}
  .q-body pre{background:#0b1220;color:#d6e0f0;border-radius:10px;padding:12px 14px;overflow-x:auto;font:13px/1.55 var(--mono);margin:10px 0}
  .q-body code{font-family:var(--mono);font-size:.9em;background:var(--panel2);padding:1px 5px;border-radius:5px} .q-body pre code{background:none;padding:0}
  .q-body .an{display:flex;gap:10px;background:color-mix(in srgb,var(--ac) 10%,var(--panel2));border:1px solid color-mix(in srgb,var(--ac) 40%,var(--line));border-radius:12px;padding:10px 12px;margin:10px 0}
  .q-body .an span{font-size:24px;line-height:1}
  .q-body .pipe{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:10px 0}
  .q-body .pipe b{background:var(--panel2);border:1.5px solid var(--ac);border-radius:9px;padding:6px 10px;font:600 13.5px var(--sans);animation:qpop .4s ease both}
  .q-body .pipe em{color:var(--dim);font-style:normal}
  @keyframes qpop{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:none}}
  .q-q{font-size:17px;font-weight:600;color:var(--fg);margin:4px 0 12px;line-height:1.5}
  .q-story{background:color-mix(in srgb,var(--amber) 9%,var(--panel2));border:1px solid color-mix(in srgb,var(--amber) 45%,var(--line));border-radius:12px;padding:12px 14px;margin-bottom:12px;font-size:15.5px;line-height:1.6;color:var(--body)}
  .q-opts{display:flex;flex-direction:column;gap:8px}
  .q-opt{display:flex;gap:10px;align-items:flex-start;text-align:left;background:var(--panel2);border:1.5px solid var(--line);border-radius:11px;padding:11px 13px;font:500 15px/1.45 var(--sans);color:var(--fg);cursor:pointer;transition:border-color .15s,transform .15s;overflow-wrap:anywhere}
  .q-opt:hover:not(:disabled){border-color:var(--ac);transform:translateX(3px)}
  .q-opt .k{flex:none;width:24px;height:24px;border-radius:7px;display:grid;place-items:center;font:700 12px var(--mono);background:var(--panel);border:1px solid var(--line);color:var(--muted)}
  .q-opt.code span:last-child{font:13px/1.5 var(--mono);white-space:pre-wrap}
  .q-opt.ok{border-color:var(--green);background:color-mix(in srgb,var(--green) 14%,var(--panel2))}
  .q-opt.no{border-color:var(--red);background:color-mix(in srgb,var(--red) 10%,var(--panel2));animation:${reduce ? 'none' : 'qshake .35s'}}
  .q-opt:disabled{cursor:default}
  @keyframes qshake{20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}
  .q-fb{margin-top:12px;border-radius:12px;padding:11px 14px;font-size:15px;line-height:1.55;animation:qin .3s ease both}
  .q-fb.ok{background:color-mix(in srgb,var(--green) 12%,var(--panel));border:1px solid var(--green)} .q-fb.no{background:color-mix(in srgb,var(--red) 8%,var(--panel));border:1px solid var(--red)}
  .q-fb.info{background:var(--panel2);border:1px solid var(--line)}
  .q-act{display:flex;gap:8px;justify-content:space-between;align-items:center;margin-top:16px;flex-wrap:wrap}
  .q-btn{background:var(--ac);color:var(--bg);border:0;font:700 15px var(--sans);padding:10px 18px;border-radius:10px;cursor:pointer}
  .q-btn.ghost{background:transparent;color:var(--fg);border:1px solid var(--line);font-weight:600}
  .q-btn:disabled{opacity:.45;cursor:default} .q-btn:focus-visible,.q-opt:focus-visible{outline:2px solid var(--ac);outline-offset:2px}
  .q-hint{font-size:14px;color:var(--muted);background:none;border:0;cursor:pointer;text-decoration:underline;padding:0}
  .q-ord{display:flex;flex-direction:column;gap:6px}
  .q-ord .slot{min-height:44px;border:1.5px dashed var(--line);border-radius:10px;padding:8px 12px;display:flex;align-items:center;gap:10px;font-size:15px}
  .q-ord .slot b{font:700 12px var(--mono);color:var(--ac)}
  .q-pool{display:flex;flex-wrap:wrap;gap:6px;margin:12px 0}
  .q-pool button{background:var(--panel2);border:1.5px solid var(--line);color:var(--fg);border-radius:9px;padding:8px 12px;font:500 14.5px var(--sans);cursor:pointer}
  .q-pool button:disabled{opacity:.3}
  textarea.q-ta{width:100%;box-sizing:border-box;min-height:110px;border-radius:11px;border:1.5px solid var(--line);background:var(--bg2);color:var(--fg);font:15px/1.5 var(--sans);padding:10px 12px;resize:vertical}
  .q-model{margin-top:12px;border:1.5px solid var(--ac);border-radius:12px;padding:12px 14px;background:color-mix(in srgb,var(--ac) 7%,var(--panel));font-size:15px;line-height:1.6;animation:qin .35s ease both}
  .q-model h4{margin:0 0 6px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:var(--ac)}
  .q-check label{display:flex;gap:10px;align-items:flex-start;padding:7px 0;border-top:1px solid var(--line);font-size:15px;cursor:pointer}
  .q-check input{width:18px;height:18px;margin-top:2px;accent-color:var(--ac);flex:none}
  .q-plus{position:fixed;left:50%;top:42%;transform:translate(-50%,-50%);font:800 44px var(--sans);color:var(--ac);text-shadow:0 2px 18px rgba(0,0,0,.35);pointer-events:none;z-index:50;animation:qplus 1s ease forwards}
  @keyframes qplus{0%{opacity:0;transform:translate(-50%,-30%) scale(.6)}25%{opacity:1;transform:translate(-50%,-50%) scale(1.1)}100%{opacity:0;transform:translate(-50%,-120%) scale(1)}}
  .q-conf{position:fixed;width:9px;height:14px;top:-20px;z-index:49;pointer-events:none;border-radius:2px;animation:qfall linear forwards}
  @keyframes qfall{to{transform:translateY(105vh) rotate(720deg)}}
  .q-end{text-align:center}
  .q-stars{font-size:46px;letter-spacing:6px;margin:6px 0}
  .q-stars span{display:inline-block;animation:qpop .5s ease both}
  .q-stars span.off{filter:grayscale(1);opacity:.25}
  .q-big{font:800 40px var(--sans);color:var(--ac);margin:4px 0}
  .q-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin:14px 0;text-align:left}
  .q-grid div{background:var(--panel2);border:1px solid var(--line);border-radius:10px;padding:9px 11px;font-size:14px;color:var(--muted)} .q-grid b{display:block;font-size:18px;color:var(--fg)}
  .qh-hero{padding:28px 0 8px} .qh-hero h1{margin:4px 0 8px}
  .qh-stats{display:flex;gap:10px;flex-wrap:wrap;margin:14px 0 6px}
  .qh-stats div{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:10px 14px;min-width:120px} .qh-stats b{display:block;font-size:22px;color:var(--fg)} .qh-stats span{font-size:13px;color:var(--muted)}
  .qh-how{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px;margin:14px 0 22px}
  .qh-how div{background:var(--panel2);border:1px solid var(--line);border-radius:12px;padding:10px 12px;font-size:14px;color:var(--muted)} .qh-how b{display:block;color:var(--fg);font-size:15px;margin-bottom:2px}
  .qh-mod{margin:22px 0 8px;font-size:18px} .qh-list{display:grid;gap:8px}
  .qh-lab{display:flex;align-items:center;gap:12px;background:var(--panel);border:1.5px solid var(--line);border-radius:13px;padding:12px 14px;text-decoration:none;color:var(--fg);transition:border-color .15s,transform .15s}
  .qh-lab:hover{border-color:var(--ac);transform:translateY(-2px)}
  .qh-lab .n{flex:none;width:36px;height:36px;border-radius:10px;display:grid;place-items:center;font:700 14px var(--mono);background:var(--panel2);border:1px solid var(--line);color:var(--ac)}
  .qh-lab .t{flex:1;min-width:0} .qh-lab .t b{display:block;font-size:15.5px} .qh-lab .t small{color:var(--muted);font-size:13px}
  .qh-lab .s{flex:none;text-align:right;font-size:13px;color:var(--muted)} .qh-lab .s .st{font-size:17px;letter-spacing:1px;display:block}
  .qh-lab.done{border-color:color-mix(in srgb,var(--ac) 55%,var(--line))}
  @media (max-width:560px){.q-card{padding:16px 15px}.q-hud{top:56px}}`;
  const st = document.createElement('style'); st.textContent = css; document.head.append(st);

  function burst(n = 26) {
    if (reduce) return;
    const C = ['#7ee081', '#5aa9ff', '#f2b84b', '#ff6b6b', '#b38cff', '#4fd1c5'];
    for (let i = 0; i < n; i++) {
      const c = document.createElement('i'); c.className = 'q-conf';
      c.style.left = Math.random() * 100 + 'vw'; c.style.background = C[i % C.length];
      c.style.animationDuration = (1.2 + Math.random() * 1.3) + 's'; c.style.animationDelay = Math.random() * .25 + 's';
      document.body.append(c); setTimeout(() => c.remove(), 3000);
    }
  }
  function plus(n) {
    if (!n) return; const p = document.createElement('div'); p.className = 'q-plus'; p.textContent = '+' + n;
    document.body.append(p); setTimeout(() => p.remove(), 1000);
  }

  // ---------- one lab quest ----------
  const root = $('#quest');
  if (root) {
    const D = JSON.parse($('#quest-data').textContent), course = root.dataset.course, lab = root.dataset.lab;
    const S = D.stages, MAX = maxOf(S); let i = 0, score = 0, streak = 0, best = 0, correct = 0, asked = 0;
    const stLevel = { 1: 'Level 1 · Basics', 2: 'Level 2 · Deeper', 3: 'Level 3 · Advanced' };
    root.innerHTML = `<div class="q-wrap"><div class="q-hud"><div class="row1"><h1>🎮 ${esc(D.title)}</h1>
      <div class="q-chips"><span class="q-chip xp">⭐ <b data-sc>0</b> / ${MAX}</span><span class="q-chip">🔥 <span data-sk>0</span></span><span class="q-chip" data-pos></span></div></div>
      <div class="q-track">${S.map(() => '<i></i>').join('')}</div></div><div data-stage aria-live="polite"></div></div>`;
    const stage = $('[data-stage]', root), track = $$('.q-track i', root);
    const hud = () => { $('[data-sc]', root).textContent = score; $('[data-sk]', root).textContent = streak; $('[data-pos]', root).textContent = i < S.length ? `${i + 1} / ${S.length}` : 'Done';
      track.forEach((t, j) => { t.className = j < i ? 'd' : j === i ? 'c' : ''; }); };
    const award = (n, ok) => {
      if (ok) { streak++; best = Math.max(best, streak); const bonus = streak >= 3 ? 2 : 0; n += bonus; } else streak = 0;
      score += n; plus(n); if (ok && n >= 10) burst(); hud(); return n;
    };
    const next = () => { i++; render(); window.scrollTo({ top: root.offsetTop - 70, behavior: reduce ? 'auto' : 'smooth' }); };
    const nextBtn = (label = 'Continue →') => `<div class="q-act"><span></span><button class="q-btn" type="button" data-next>${label}</button></div>`;
    const bindNext = el => { const b = $('[data-next]', el); b.onclick = next; b.focus({ preventScroll: true }); };

    function mcq(x, isScen) {
      asked++;
      const base = isScen ? PTS.scenario : PTS.mcq, order = shuffle(x.opts.map((o, k) => k));
      stage.innerHTML = `<div class="q-card">${isScen ? `<div class="q-lv">📍 Real-world scenario</div><div class="q-story">${x.story}</div>` : `<div class="q-lv">${x.code ? '💻 Code check' : '❓ Check yourself'}</div>`}
        <p class="q-q">${x.q}</p><div class="q-opts" role="group">${order.map((k, j) => `<button class="q-opt${x.code ? ' code' : ''}" type="button" data-k="${k}"><span class="k">${j + 1}</span><span>${x.code ? esc(x.opts[k]) : x.opts[k]}</span></button>`).join('')}</div>
        <div data-fb></div><div class="q-act"><span>${x.hint ? '<button class="q-hint" type="button" data-h>💡 Hint (−2 points)</button>' : ''}</span><button class="q-btn" type="button" data-next hidden>Continue →</button></div></div>`;
      let tries = 0, hintUsed = 0; const fb = $('[data-fb]', stage);
      const h = $('[data-h]', stage); if (h) h.onclick = () => { h.outerHTML = `<span class="q-hint" style="text-decoration:none">💡 ${x.hint}</span>`; hintUsed = 2; };
      $$('.q-opt', stage).forEach(b => b.onclick = () => {
        tries++; const ok = +b.dataset.k === x.a;
        if (ok) {
          const got = award(Math.max(0, (tries === 1 ? base : Math.round(base / 2)) - hintUsed), tries === 1); if (tries === 1) correct++;
          b.classList.add('ok'); $$('.q-opt', stage).forEach(o => o.disabled = true);
          fb.innerHTML = `<div class="q-fb ok"><b>${tries === 1 ? ['Correct! 🎉', 'Spot on! ✅', 'Well done! 🌟'][Math.floor(Math.random() * 3)] : 'Got it on the second try 👍'} +${got} points.</b> ${x.why}</div>`;
          const n = $('[data-next]', stage); n.hidden = false; n.onclick = next; n.focus({ preventScroll: true });
        } else {
          b.classList.add('no'); b.disabled = true;
          if (tries >= 2) {
            award(0, false); $$('.q-opt', stage).forEach(o => { o.disabled = true; if (+o.dataset.k === x.a) o.classList.add('ok'); });
            fb.innerHTML = `<div class="q-fb no"><b>Not this time.</b> The right answer is highlighted. ${x.why}</div>`;
            const n = $('[data-next]', stage); n.hidden = false; n.onclick = next; n.focus({ preventScroll: true });
          } else { streak = 0; hud(); fb.innerHTML = `<div class="q-fb no">Not quite. Read the options again: you have one more try for half points.</div>`; }
        }
      });
    }
    function order(x) {
      asked++;
      const pool = shuffle(x.items.map((t, k) => k)), picked = [];
      stage.innerHTML = `<div class="q-card"><div class="q-lv">🧩 Put in order</div><p class="q-q">${x.q}</p>
        <div class="q-ord">${x.items.map((_, k) => `<div class="slot" data-s="${k}"><b>${k + 1}</b><span></span></div>`).join('')}</div>
        <div class="q-pool">${pool.map(k => `<button type="button" data-k="${k}">${x.items[k]}</button>`).join('')}</div>
        <div data-fb></div><div class="q-act"><button class="q-btn ghost" type="button" data-r>↺ Reset</button><button class="q-btn" type="button" data-c disabled>Check order</button></div></div>`;
      const slots = $$('.slot span', stage), c = $('[data-c]', stage);
      $$('.q-pool button', stage).forEach(b => b.onclick = () => { picked.push(+b.dataset.k); b.disabled = true; slots[picked.length - 1].textContent = x.items[b.dataset.k]; c.disabled = picked.length < x.items.length; });
      $('[data-r]', stage).onclick = () => { picked.length = 0; slots.forEach(s => s.textContent = ''); $$('.q-pool button', stage).forEach(b => b.disabled = false); c.disabled = true; };
      c.onclick = () => {
        const right = picked.filter((k, j) => k === j).length, all = right === x.items.length;
        const got = award(all ? PTS.order : Math.round(PTS.order * right / x.items.length / 2), all); if (all) correct++;
        $$('.slot', stage).forEach((s, j) => s.style.borderColor = picked[j] === j ? 'var(--green)' : 'var(--red)');
        $('[data-fb]', stage).innerHTML = `<div class="q-fb ${all ? 'ok' : 'no'}"><b>${all ? 'Perfect order! 🎉' : `${right} of ${x.items.length} in the right place.`} +${got} points.</b> Correct order: ${x.items.map((t, k) => `<b>${k + 1}.</b> ${t}`).join(' → ')}. ${x.why || ''}</div>`;
        $('[data-r]', stage).disabled = true; c.outerHTML = '<button class="q-btn" type="button" data-next>Continue →</button>'; bindNext(stage);
      };
    }
    function interview(x) {
      stage.innerHTML = `<div class="q-card"><div class="q-lv">🎤 Interview question</div><p class="q-q">${x.q}</p>
        <p style="font-size:14px;color:var(--muted);margin:0 0 8px">Answer as you would in an interview: type it, or say it aloud. Then compare with the model answer and tick what you covered (5 points each).</p>
        <textarea class="q-ta" aria-label="Your answer" placeholder="Your answer…"></textarea>
        <div data-m></div><div class="q-act"><span></span><button class="q-btn" type="button" data-show>Show model answer</button></div></div>`;
      $('[data-show]', stage).onclick = e => {
        e.target.remove();
        $('[data-m]', stage).innerHTML = `<div class="q-model"><h4>Model answer</h4><div class="q-body" style="font-size:15px">${x.answer}</div>
          <div class="q-check" style="margin-top:8px"><b style="font-size:14px">Tick the key points you covered:</b>${x.points.map((p, k) => `<label><input type="checkbox" data-p="${k}"> ${p}</label>`).join('')}</div></div>
          <div class="q-act"><span style="font-size:14px;color:var(--muted)" data-pv>0 points</span><button class="q-btn" type="button" data-sub>Save & continue →</button></div>`;
        const cnt = () => $$('[data-p]:checked', stage).length;
        $$('[data-p]', stage).forEach(c => c.onchange = () => $('[data-pv]', stage).textContent = `${cnt() * 5} points`);
        $('[data-sub]', stage).onclick = () => { const n = cnt(); score += n * 5; plus(n * 5); if (n === x.points.length) burst(16); hud(); next(); };
      };
    }
    function finish() {
      const stars = starsOf(score, MAX), st = load(course); st.labs = st.labs || {};
      const prev = st.labs[lab] || {}; st.labs[lab] = { best: Math.max(prev.best || 0, score), max: MAX, stars: Math.max(prev.stars || 0, stars), plays: (prev.plays || 0) + 1 };
      save(course, st); const xp = totalXP(st);
      if (stars >= 2) burst(60);
      stage.innerHTML = `<div class="q-card q-end"><div class="q-lv">🏁 Quest complete</div><h2>${esc(D.title)}</h2>
        <div class="q-stars">${[0, 1, 2].map(k => `<span class="${k < stars ? '' : 'off'}" style="animation-delay:${k * .2}s">⭐</span>`).join('')}</div>
        <div class="q-big">${score} / ${MAX}</div><p style="color:var(--muted);margin:0">${stars === 3 ? 'Outstanding! You really know this.' : stars === 2 ? 'Great work! Replay to reach 3 stars.' : stars === 1 ? 'Good start. Read the lesson, then try again.' : 'Read the full lesson first, then come back. You will do better!'}</p>
        <div class="q-grid"><div><b>${correct} / ${asked}</b>first-try answers</div><div><b>🔥 ${best}</b>best streak</div><div><b>${xp}</b>total course XP</div><div><b>${rankOf(xp, D.ranks)}</b>your rank</div></div>
        <div class="q-act" style="justify-content:center"><button class="q-btn ghost" type="button" data-again>↺ Play again</button><a class="q-btn ghost" style="text-decoration:none" href="${D.lesson}">📖 Read full lesson</a><a class="q-btn ghost" style="text-decoration:none" href="quest.html">🗺 All quests</a>${D.next ? `<a class="q-btn" style="text-decoration:none" href="${D.next}">Next quest →</a>` : ''}</div></div>`;
      $('[data-again]', stage).onclick = () => { i = 0; score = 0; streak = 0; best = 0; correct = 0; asked = 0; render(); };
    }
    function render() {
      hud(); const x = S[i];
      if (!x) return finish();
      if (x.type === 'learn') {
        stage.innerHTML = `<div class="q-card"><div class="q-lv">📘 ${stLevel[x.level] || 'Learn'}</div><h2>${x.title}</h2><div class="q-body">${x.html}</div>${nextBtn(S[i + 1] && S[i + 1].type === 'learn' ? 'Continue →' : 'I’m ready: test me →')}</div>`;
        bindNext(stage);
      } else if (x.type === 'mcq') mcq(x, false);
      else if (x.type === 'scenario') mcq(x, true);
      else if (x.type === 'order') order(x);
      else if (x.type === 'interview') interview(x);
    }
    document.addEventListener('keydown', e => {
      if (e.target.tagName === 'TEXTAREA') return;
      const n = +e.key; if (n >= 1 && n <= 6) { const o = $$('.q-opt', stage)[n - 1]; if (o && !o.disabled) o.click(); }
    });
    render();
  }

  // ---------- quest hub ----------
  const hub = $('#quest-hub');
  if (hub) {
    const D = JSON.parse($('#quest-data').textContent), st = load(hub.dataset.course), labs = st.labs || {};
    const xp = totalXP(st), max = D.labs.reduce((s, l) => s + l.max, 0), done = D.labs.filter(l => labs[l.id]).length, stars = D.labs.reduce((s, l) => s + ((labs[l.id] || {}).stars || 0), 0);
    const mods = [...new Set(D.labs.map(l => l.module))];
    hub.innerHTML = `<div class="q-wrap" style="max-width:860px"><section class="qh-hero"><nav class="crumbs" aria-label="Breadcrumb"><a href="../index.html">Home</a><span>›</span><a href="index.html">${esc(D.course)}</a><span>›</span><span>Quest mode</span></nav>
      <h1>🎮 ${esc(D.title)}</h1><p class="lead" style="margin:0">${D.intro}</p>
      <div class="qh-stats"><div><b>${xp}</b><span>XP of ${max}</span></div><div><b>${done} / ${D.labs.length}</b><span>quests played</span></div><div><b>${stars} ⭐</b><span>of ${D.labs.length * 3} stars</span></div><div><b>${rankOf(xp, D.ranks)}</b><span>your rank</span></div></div></section>
      <div class="qh-how"><div><b>📘 Learn</b>Short cards, from basics to advanced, in 3 levels.</div><div><b>❓ Answer</b>+10 first try, +5 second try, +2 streak bonus from 3 in a row.</div><div><b>📍 Scenario</b>Real-world problems from banking and apps: +15.</div><div><b>🎤 Interview</b>Answer, compare with the model answer, +5 per key point.</div></div>
      ${mods.map(m => `<h2 class="qh-mod">Module ${m}: ${esc(D.modules[m] || '')}</h2><div class="qh-list">${D.labs.filter(l => l.module === m).map(l => { const r = labs[l.id];
        return `<a class="qh-lab${r ? ' done' : ''}" href="${l.href}"><span class="n">${String(l.n).padStart(2, '0')}</span><span class="t"><b>${esc(l.title)}</b><small>${r ? `Best ${r.best} / ${l.max} · played ${r.plays}×` : `${l.max} points to win · about 10 minutes`}</small></span><span class="s"><span class="st">${[0, 1, 2].map(k => k < ((r || {}).stars || 0) ? '⭐' : '☆').join('')}</span>${r ? 'Replay' : 'Play →'}</span></a>`; }).join('')}</div>`).join('')}
      <p style="font-size:13.5px;color:var(--muted);margin-top:22px">Your points are saved in this browser only. <button class="q-hint" type="button" data-reset>Reset my quest progress</button></p></div>`;
    $('[data-reset]', hub).onclick = () => { if (confirmReset()) { save(hub.dataset.course, {}); location.reload(); } };
    function confirmReset() { const b = $('[data-reset]', hub); if (b.dataset.sure) return true; b.dataset.sure = 1; b.textContent = 'Click again to confirm reset'; return false; }
  }
})();
