/* Learn24 course kit: declarative diagrams and demos for article lessons.
   Diagrams (inside <figure class="fig">):
     <div class="kflow" data-nodes='[["Title","sub","ac"],...]' data-dir="row|col"></div>
     <div class="kgrid" data-cards='[["Title","text","gr"],...]'></div>
   Demos (JSON in a child <script type="application/json">):
     <div class="demo" data-demo="pick">   {title, options:[{label, tokens?:[[t,cls,label?]], rows?:[[l,v]], note?, html?}]}
     <div class="demo" data-demo="stepper">{title, steps:[html,...]}
   Requires article.js loaded first. */
(function () {
  const A = window.Article, $ = A.$, $$ = A.$$;
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const tok = (t, c = '', lab = '') => lab ? `<span class="ktok"><span class="tok ${c}">${esc(t)}</span><small>${esc(lab)}</small></span>` : `<span class="tok ${c}">${esc(t)}</span>`;
  const bars = (el, rows, max) => {
    const mx = max || Math.max(...rows.map(r => r[1]), 1e-9);
    const top = rows.reduce((b, r, i) => r[1] > rows[b][1] ? i : b, 0);
    el.innerHTML = rows.map(([l, v, d], i) => `<div class="bar${i === top ? ' top' : ''}"><span>${esc(l)}</span><div class="track"><div class="fill"></div></div><span class="v">${esc(d != null ? d : (+v).toFixed(2))}</span></div>`).join('');
    requestAnimationFrame(() => requestAnimationFrame(() => $$('.fill', el).forEach((f, i) => f.style.width = Math.max(1, rows[i][1] / mx * 100) + '%')));
  };
  window.Kit = { esc, tok, bars };

  function flows() {
    $$('.kflow[data-nodes]').forEach(el => {
      const ns = JSON.parse(el.dataset.nodes), col = el.dataset.dir === 'col';
      el.classList.add(col ? 'col' : 'row');
      el.innerHTML = ns.map((n, i) => `${i ? `<span class="kar an" style="--dl:${(i * .22 - .1).toFixed(2)}s">${col ? '↓' : '→'}</span>` : ''}<div class="kn an ${n[2] || ''}" style="--dl:${(i * .22).toFixed(2)}s"><b>${esc(n[0])}</b>${n[1] ? `<span>${esc(n[1])}</span>` : ''}</div>`).join('');
    });
    $$('.kgrid[data-cards]').forEach(el => {
      el.innerHTML = JSON.parse(el.dataset.cards).map((c, i) => `<div class="kc an ${c[2] || ''}" style="--dl:${(i * .15).toFixed(2)}s"><b>${esc(c[0])}</b><span>${c[1]}</span></div>`).join('');
    });
  }

  A.demo('pick', el => {
    const cfg = JSON.parse($('script[type="application/json"]', el).textContent);
    el.insertAdjacentHTML('afterbegin', `<div class="demo-h"><b>Demo · ${esc(cfg.title)}</b><div class="tabs" role="tablist">${cfg.options.map((o, i) => `<button type="button" aria-selected="${i === 0}">${esc(o.label)}</button>`).join('')}</div></div><div data-body></div>`);
    const body = $('[data-body]', el), bs = $$('.tabs button', el);
    const show = i => {
      const o = cfg.options[i];
      body.innerHTML = (o.tokens ? `<div class="row">${o.tokens.map(t => tok(t[0], t[1] || '', t[2] || '')).join('')}</div>` : '') + (o.html || '') + (o.rows ? '<div class="bars" data-b></div>' : '') + (o.note ? `<div class="note-s">${o.note}</div>` : '');
      if (o.rows) bars($('[data-b]', body), o.rows, o.max);
    };
    bs.forEach((b, i) => b.onclick = () => { bs.forEach(x => x.setAttribute('aria-selected', String(x === b))); show(i); });
    show(0);
  });

  A.demo('stepper', el => {
    const cfg = JSON.parse($('script[type="application/json"]', el).textContent);
    el.insertAdjacentHTML('afterbegin', `<div class="demo-h"><b>Demo · ${esc(cfg.title)}</b><div class="row"><span class="note-s" data-c style="margin:0"></span><button class="btn ghost" type="button" data-reset>↺ Reset</button><button class="btn" type="button" data-next>Next step ▶</button></div></div><div data-body class="ksteps"></div>`);
    const body = $('[data-body]', el), nx = $('[data-next]', el); let k = 0;
    const show = () => { body.innerHTML = cfg.steps.slice(0, k + 1).map((s, i) => `<div class="kstep${i === k ? ' cur' : ''}"><span class="kno">${i + 1}</span><div>${s}</div></div>`).join(''); nx.disabled = k >= cfg.steps.length - 1; nx.style.opacity = nx.disabled ? .5 : 1; $('[data-c]', el).textContent = `${k + 1} / ${cfg.steps.length}`; };
    nx.onclick = () => { if (k < cfg.steps.length - 1) { k++; show(); } };
    $('[data-reset]', el).onclick = () => { k = 0; show(); };
    show();
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', flows, { once: true }); else flows();
})();
