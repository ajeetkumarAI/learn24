/* Learn24 course demos: reusable, data-driven widgets for course sessions.
   Each demo is <div class="demo" data-demo="NAME"> with a <script type="application/json"> child holding its data.
   Types: tabs, steps, slider, pick, decode. Bars inside any panel use <div class="fill" data-w="0.42">. */
(function () {
  const A = window.Article, { $, $$ } = A;
  const json = el => { try { return JSON.parse($('script[type="application/json"]', el).textContent); } catch (e) { return {}; } };
  const fillBars = root => requestAnimationFrame(() => requestAnimationFrame(() => $$('.fill[data-w]', root).forEach(f => f.style.width = (+f.dataset.w * 100) + '%')));
  const resetBars = root => $$('.fill[data-w]', root).forEach(f => f.style.width = '0');

  // tabs: {tabs:[{label, html}]}
  A.demo('tabs', el => {
    const d = json(el), head = $('.demo-h', el), body = document.createElement('div');
    const t = document.createElement('div'); t.className = 'tabs'; t.setAttribute('role', 'tablist');
    t.innerHTML = d.tabs.map((x, i) => `<button type="button" aria-selected="${i === 0}">${x.label}</button>`).join('');
    head.append(t); el.append(body);
    const show = i => { $$('button', t).forEach((b, j) => b.setAttribute('aria-selected', String(i === j))); body.innerHTML = d.tabs[i].html; fillBars(body); };
    $$('button', t).forEach((b, i) => b.onclick = () => show(i)); show(0);
  });

  // steps: {steps:[html]}
  A.demo('steps', el => {
    const d = json(el), head = $('.demo-h', el), body = document.createElement('div');
    const ctl = document.createElement('div'); ctl.className = 'row';
    ctl.innerHTML = '<button class="btn ghost" type="button">↺ Reset</button><button class="btn" type="button">Next step ▶</button>';
    head.append(ctl); el.append(body);
    const [rs, nx] = $$('button', ctl); let k = 0;
    const show = () => { body.innerHTML = d.steps.slice(0, k + 1).map(s => `<div class="stepbox">${s}</div>`).join(''); fillBars(body); nx.disabled = k >= d.steps.length - 1; nx.style.opacity = nx.disabled ? .5 : 1; };
    nx.onclick = () => { if (k < d.steps.length - 1) { k++; show(); } }; rs.onclick = () => { k = 0; show(); }; show();
  });

  // slider: {label, start, options:[{name, html}]}
  A.demo('slider', el => {
    const d = json(el), body = document.createElement('div'), id = 'sl' + Math.random().toString(36).slice(2, 7);
    const lab = document.createElement('label'); lab.className = 'note-s'; lab.style.display = 'block'; lab.htmlFor = id;
    const r = document.createElement('input'); r.type = 'range'; r.id = id; r.min = 0; r.max = d.options.length - 1; r.step = 1; r.value = d.start || 0; r.style.cssText = 'width:100%;max-width:520px;accent-color:var(--ac)';
    el.append(lab, r, body);
    const show = () => { const o = d.options[+r.value]; lab.innerHTML = `${d.label}: <b>${o.name}</b>`; body.innerHTML = o.html; fillBars(body); };
    r.oninput = show; show();
  });

  // pick: {question, options:[{label, html}]}
  A.demo('pick', el => {
    const d = json(el), q = document.createElement('p'), opts = document.createElement('div'), body = document.createElement('div');
    q.className = 'note-s'; q.innerHTML = d.question; opts.className = 'row'; opts.style.marginBottom = '10px';
    opts.innerHTML = d.options.map((o, i) => `<button class="btn ghost" type="button" data-i="${i}">${o.label}</button>`).join('');
    el.append(q, opts, body);
    $$('button', opts).forEach(b => b.onclick = () => { $$('button', opts).forEach(x => { x.classList.toggle('ghost', x !== b); }); body.innerHTML = d.options[+b.dataset.i].html; fillBars(body); });
  });

  // decode: {prompt, tokens:[[tok, logit]]} — interactive temperature / top-k / top-p
  A.demo('decode', el => {
    const d = json(el), box = document.createElement('div');
    box.innerHTML = `<div class="row" style="gap:16px;margin-bottom:8px">
      <label class="note-s" style="margin:0">Temperature <b data-t>1.0</b><br><input type="range" min="1" max="20" value="10" data-tr style="accent-color:var(--ac)"></label>
      <label class="note-s" style="margin:0">Top-k <b data-k>all</b><br><input type="range" min="1" max="${d.tokens.length}" value="${d.tokens.length}" data-kr style="accent-color:var(--ac)"></label>
      <label class="note-s" style="margin:0">Top-p <b data-p>1.00</b><br><input type="range" min="10" max="100" value="100" data-pr style="accent-color:var(--ac)"></label></div>
      <div class="row" style="margin-bottom:6px"><span class="tok">${d.prompt}</span><span class="tok mask" data-out>?</span><button class="btn" type="button" data-s>🎲 Sample</button><button class="btn ghost" type="button" data-g>Greedy</button></div>
      <div class="bars" data-b></div><div class="note-s" data-n></div>`;
    el.append(box);
    const tr = $('[data-tr]', box), kr = $('[data-kr]', box), pr = $('[data-pr]', box), b = $('[data-b]', box);
    let probs = [];
    const calc = () => {
      const T = tr.value / 10, K = +kr.value, P = pr.value / 100;
      $('[data-t]', box).textContent = T.toFixed(1); $('[data-k]', box).textContent = K >= d.tokens.length ? 'all' : K; $('[data-p]', box).textContent = P.toFixed(2);
      const l = d.tokens.map(t => t[1] / T), m = Math.max(...l), e = l.map(x => Math.exp(x - m)), z = e.reduce((a, c) => a + c, 0);
      let p = e.map((x, i) => ({ t: d.tokens[i][0], p: x / z, i })).sort((a, c) => c.p - a.p);
      let keep = [], cum = 0; for (let j = 0; j < p.length && j < K; j++) { keep.push(p[j]); cum += p[j].p; if (cum >= P) break; }
      const zz = keep.reduce((a, c) => a + c.p, 0); const kept = new Set(keep.map(x => x.i));
      probs = p.map(x => ({ ...x, q: kept.has(x.i) ? x.p / zz : 0 }));
      b.innerHTML = probs.map((x, j) => `<div class="bar${j === 0 ? ' top' : ''}" style="${x.q ? '' : 'opacity:.35'}"><span>${x.t}</span><div class="track"><div class="fill" style="width:${(x.q * 100).toFixed(1)}%"></div></div><span class="v">${x.q.toFixed(2)}</span></div>`).join('');
      $('[data-n]', box).textContent = `${keep.length} of ${d.tokens.length} tokens can be picked. ` + (T < .6 ? 'Low temperature: safe and repetitive.' : T > 1.4 ? 'High temperature: creative but risky.' : 'Balanced.');
    };
    $('[data-s]', box).onclick = () => { let r = Math.random(), c = 0; for (const x of probs) { c += x.q; if (r <= c && x.q) { $('[data-out]', box).textContent = x.t; return; } } };
    $('[data-g]', box).onclick = () => { $('[data-out]', box).textContent = probs[0].t; };
    [tr, kr, pr].forEach(x => x.oninput = calc); calc();
  });
})();
