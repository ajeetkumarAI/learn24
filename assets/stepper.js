/* Learn24 lesson engine.
   A lesson page defines window.LESSON = { eyebrow, title, lede, color, steps:[{t, s, b:[blocks]}], takeaways:[[bold, text]], fine }
   and loads this file. Block types: flow, chips, msg, bars, list, code, cards, table, note, dots, cycle, trace. */
(function () {
  const L = window.LESSON;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  let runId = 0, paused = false, speed = 1;
  class Abort extends Error {}
  if (L.color) document.documentElement.style.setProperty('--ac', L.color);

  function setSpeed(s) { speed = s; document.documentElement.style.setProperty('--d', (reduce ? .05 : .45 / s) + 's'); $$('.seg button').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.s === s))); }
  async function wait(ms) { const id = runId; let t = 0; const eff = reduce ? ms / 10 : ms; while (t < eff) { if (id !== runId) throw new Abort(); await new Promise(r => setTimeout(r, 16)); if (!paused) t += 16 * speed; } if (id !== runId) throw new Abort(); }
  async function type(el, text, cps = 60) { el.textContent = ''; el.classList.add('typing'); for (const ch of text) { el.textContent += ch; await wait(1000 / cps); } el.classList.remove('typing'); }
  async function seq(els, gap = 260, cls = 'show') { for (const e of els) { e.classList.add(cls); await wait(gap); } }

  const hl = line => {
    let h = esc(line);
    if (/^\s*(#|\/\/)/.test(line)) return `<span class="c">${h}</span>`;
    h = h.replace(/("[^"]*")/g, '<span class="s">$1</span>');
    return h;
  };

  const B = {
    flow: {
      h: b => `<div class="flow${b.col ? ' col' : ''}">${b.nodes.map((n, i) => `${i ? `<span class="ar">${b.col ? '↓' : '→'}</span>` : ''}<div class="node" data-i="${i}">${esc(n[0])}${n[1] ? `<small>${esc(n[1])}</small>` : ''}</div>`).join('')}</div>`,
      r: async (el, b) => {
        const ns = $$('.node', el), as = $$('.ar', el), hot = b.hot || [];
        for (let i = 0; i < ns.length; i++) {
          if (i) as[i - 1].classList.add('lit');
          ns[i].classList.add(hot.includes(i) ? (b.tone || 'hot') : 'lit');
          await wait(hot.includes(i) ? 600 : 360);
        }
      }
    },
    chips: {
      h: b => `<div class="chips">${b.items.map((c, i) => Array.isArray(c) ? `<div class="chipc rv"><span class="chip${(b.ac || []).includes(i) ? ' ac' : ''}">${esc(c[0])}</span><span class="cid">${esc(c[1])}</span></div>` : `<span class="chip rv${(b.ac || []).includes(i) ? ' ac' : ''}">${esc(c)}</span>`).join('')}</div>`,
      r: async el => seq($$('.rv', el), 190)
    },
    msg: {
      h: b => `<div class="msg rv ${b.tone || 'in'}"><span class="who">${esc(b.who)}</span><div class="txt"></div></div>`,
      r: async (el, b) => { $('.msg', el).classList.add('show'); await wait(220); await type($('.txt', el), b.text, b.cps || 60); }
    },
    bars: {
      h: b => { const mx = b.max || Math.max(...b.rows.map(r => r[1])); return `<div class="bars">${b.rows.map(r => `<div class="bar rv ${r[3] || ''}"><span class="l">${esc(r[0])}</span><div class="track"><div class="fill" style="--w:${Math.max(1, r[1] / mx * 100)}%"></div></div><span class="v">${esc(r[2] != null ? r[2] : r[1].toFixed(2))}</span></div>`).join('')}</div>`; },
      r: async el => seq($$('.bar', el), 230)
    },
    list: {
      h: b => `<ul class="list${b.x ? ' x' : ''}">${b.items.map(([a, d]) => `<li class="rv"><div><b>${esc(a)}</b>${d ? ` <span>· ${esc(d)}</span>` : ''}</div></li>`).join('')}</ul>`,
      r: async el => seq($$('li', el), 380)
    },
    code: {
      h: b => `<pre class="code">${b.cap ? `<span class="cap">${esc(b.cap)}</span>` : ''}${b.text.split('\n').map(l => `<span class="ln">${hl(l) || ' '}</span>`).join('')}</pre>`,
      r: async (el, b) => seq($$('.ln', el), b.gap || 150)
    },
    cards: {
      h: b => `<div class="cards">${b.items.map(c => `<div class="card rv"><b>${esc(c[0])}</b><span>${esc(c[1])}</span>${c[2] ? `<span class="mono">${esc(c[2])}</span>` : ''}</div>`).join('')}</div>`,
      r: async el => seq($$('.card', el), 330)
    },
    table: {
      h: b => `<div class="tw"><table class="tbl"><thead><tr>${b.head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${b.rows.map(r => `<tr class="rv">${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`,
      r: async el => seq($$('tr.rv', el), 330)
    },
    note: {
      h: b => `<div class="note rv">${b.text}</div>`,
      r: async el => { $('.note', el).classList.add('show'); await wait(500); }
    },
    dots: {
      h: b => {
        const W = 520, H = 230, px = x => 30 + x / 100 * (W - 60), py = y => H - 24 - y / 100 * (H - 48);
        const [qx, qy, ql] = b.q;
        return `<svg class="dots" viewBox="0 0 ${W} ${H}" role="img" aria-label="Vectors in embedding space">
          <line class="ax" x1="30" y1="${H - 24}" x2="${W - 30}" y2="${H - 24}"/><line class="ax" x1="30" y1="24" x2="30" y2="${H - 24}"/>
          ${(b.near || []).map(i => `<line class="link" data-i="${i}" x1="${px(qx)}" y1="${py(qy)}" x2="${px(b.pts[i][0])}" y2="${py(b.pts[i][1])}"/>`).join('')}
          ${b.pts.map((p, i) => `<circle class="pt" data-i="${i}" cx="${px(p[0])}" cy="${py(p[1])}" r="7"/><text x="${px(p[0]) + 11}" y="${py(p[1]) + 4}">${esc(p[2])}</text>`).join('')}
          <circle class="qd" cx="${px(qx)}" cy="${py(qy)}" r="0"/><text class="qt" x="${px(qx) + 12}" y="${py(qy) - 10}" opacity="0">${esc(ql)}</text></svg>`;
      },
      r: async (el, b) => {
        await wait(400);
        const q = $('.qd', el); q.setAttribute('r', '8'); q.classList.add('q'); $('.qt', el).setAttribute('opacity', '1'); await wait(700);
        for (const i of b.near || []) { $(`line.link[data-i="${i}"]`, el).classList.add('show'); $(`circle.pt[data-i="${i}"]`, el).classList.add('near'); await wait(450); }
      }
    },
    cycle: {
      h: b => `<div class="cyc">${b.nodes.map((n, i) => `${i ? '<span class="ar">→</span>' : ''}<div class="node">${esc(n[0])}${n[1] ? `<small>${esc(n[1])}</small>` : ''}</div>`).join('')}<span class="ar">↺</span><span class="loop">${esc(b.label || 'repeat')}</span></div>`,
      r: async (el, b) => {
        const ns = $$('.node', el), as = $$('.ar', el);
        for (let r = 0; r < (b.rounds || 2); r++) for (let i = 0; i < ns.length; i++) {
          ns.forEach(n => n.classList.remove('hot')); ns[i].classList.add('hot', 'lit'); if (i) as[i - 1].classList.add('lit');
          if (i === ns.length - 1) as[as.length - 1].classList.add('lit');
          await wait(520);
        }
        ns.forEach(n => n.classList.remove('hot'));
      }
    },
    trace: {
      h: b => `<div class="trace">${b.lines.map(([k, t]) => `<div class="tr rv ${k}"><span class="k">${({ thought: 'Thought', action: 'Action', obs: 'Result', final: 'Answer', user: 'User' })[k] || k}</span><span class="t"></span></div>`).join('')}</div>`,
      r: async (el, b) => { const rows = $$('.tr', el); for (let i = 0; i < rows.length; i++) { rows[i].classList.add('show'); await type($('.t', rows[i]), b.lines[i][1], 80); await wait(220); } }
    }
  };

  function build() {
    const steps = L.steps.map((st, i) => `<section class="step"><div class="num">${i + 1}</div><div><h3>${esc(st.t)}</h3>${st.s ? `<p class="sub">${esc(st.s)}</p>` : ''}<div class="stage">${st.b.map((b, j) => `<div class="blk" data-j="${j}">${B[b.type].h(b)}</div>`).join('')}</div></div></section>`).join('');
    document.body.insertAdjacentHTML('afterbegin', `<div class="wrap">
      <div class="eyebrow">${esc(L.eyebrow || '')}</div><h1>${esc(L.title)}</h1><p class="lede">${esc(L.lede || '')}</p>
      <div class="ctl"><button id="btn-pause" type="button">❚❚ Pause</button><button id="btn-restart" type="button">↺ Restart</button>
        <div class="seg" role="group" aria-label="Speed"><button type="button" data-s="0.5">0.5×</button><button type="button" data-s="1" aria-pressed="true">1×</button><button type="button" data-s="2">2×</button></div></div>
      <div class="panel" id="panel">${steps}</div>
      <div class="take rv" id="take"><h2>Key takeaways</h2><ul class="list">${(L.takeaways || []).map(([a, d]) => `<li><div><b>${esc(a)}</b>${d ? ` <span>· ${esc(d)}</span>` : ''}</div></li>`).join('')}</ul></div>
      <div class="foot rv" id="foot"><div class="credit">Created by <b>Ajeetkumar</b></div>${L.fine ? `<div class="fine">${esc(L.fine)}</div>` : ''}</div>
    </div>`);
  }
  async function run() {
    const id = ++runId; paused = false; $('#btn-pause').textContent = '❚❚ Pause';
    $('#panel').outerHTML = `<div class="panel" id="panel">${L.steps.map((st, i) => `<section class="step"><div class="num">${i + 1}</div><div><h3>${esc(st.t)}</h3>${st.s ? `<p class="sub">${esc(st.s)}</p>` : ''}<div class="stage">${st.b.map((b, j) => `<div class="blk" data-j="${j}">${B[b.type].h(b)}</div>`).join('')}</div></div></section>`).join('')}</div>`;
    $('#take').classList.remove('show'); $('#foot').classList.remove('show');
    const els = $$('.step');
    try {
      await wait(300);
      for (let i = 0; i < L.steps.length; i++) {
        els[i].classList.add('on');
        if (i > 0) { const r = els[i].getBoundingClientRect(); if (r.bottom > innerHeight || r.top < 60) els[i].scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' }); }
        const blks = $$('.blk', els[i]);
        for (let j = 0; j < L.steps[i].b.length; j++) { await B[L.steps[i].b[j].type].r(blks[j], L.steps[i].b[j]); await wait(250); }
        await wait(700); els[i].classList.remove('on'); els[i].classList.add('done');
      }
      $('#take').classList.add('show'); $$('#take li').forEach(l => l.classList.add('show'));
      await wait(400); $('#foot').classList.add('show');
    } catch (e) { if (!(e instanceof Abort)) console.error(e); }
  }
  build();
  $$('#take li').forEach(l => l.classList.add('rv'));
  $('#btn-restart').onclick = () => { window.scrollTo({ top: 0 }); run(); };
  $('#btn-pause').onclick = e => { paused = !paused; e.currentTarget.textContent = paused ? '▶ Play' : '❚❚ Pause'; };
  $$('.seg button').forEach(b => b.onclick = () => setSpeed(+b.dataset.s));
  setSpeed(1);
  window.lessonRun = run;
  run();
})();
