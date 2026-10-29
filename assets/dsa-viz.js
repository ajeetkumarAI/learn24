/* Learn24 DSA visualizer: step-by-step animations with pseudocode highlighting.
   Usage: <div class="viz" data-viz="binary-search"></div> or data-viz="bubble-sort,merge-sort" for a chooser. */
(function () {
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const nums = s => String(s || '').split(/[\s,]+/).filter(Boolean).map(Number).filter(x => !isNaN(x));
  const parts = s => String(s || '').split(';').map(x => x.trim());
  const rnd = (n, lo, hi) => Array.from({ length: n }, () => lo + Math.floor(Math.random() * (hi - lo + 1)));
  const clone = o => JSON.parse(JSON.stringify(o));
  const V = {};

  // -------------------------------------------------- renderers
  function rArr(p) {
    const items = p.items.map((x, i) => (x !== null && typeof x === 'object' && 'v' in x) ? x : { id: i, v: x });
    const hl = p.hl || {}, ptr = {};
    Object.entries(p.ptr || {}).forEach(([k, i]) => { if (i !== null && i !== undefined && i >= 0 && i <= items.length) (ptr[i] = ptr[i] || []).push(k); });
    const dim = i => p.range && (i < p.range[0] || i > p.range[1]);
    if (p.bars) return null; // handled by keyed renderer
    return `${p.name ? `<div class="vz-name">${esc(p.name)}</div>` : ''}<div class="vz-row">${items.map((t, i) => `
      <div class="vz-cell ${hl[i] || ''}${dim(i) ? ' dim' : ''}"><b>${t.v === null || t.v === undefined ? '' : esc(t.v)}</b>${p.noidx ? '' : `<i>${p.labels ? esc(p.labels[i]) : i}</i>`}<u>${(ptr[i] || []).map(esc).join(' ')}</u></div>`).join('')}
      ${ptr[items.length] ? `<div class="vz-cell ghost"><b></b><i></i><u>${ptr[items.length].map(esc).join(' ')}</u></div>` : ''}</div>`;
  }
  function rBars(el, p) {
    let box = el.querySelector('.vz-bars');
    if (!box) { el.innerHTML = `<div class="vz-name"></div><div class="vz-bars"></div><div class="vz-ptrs"></div>`; box = el.querySelector('.vz-bars'); }
    el.querySelector('.vz-name').textContent = p.name || '';
    const items = p.items, n = items.length, max = Math.max(1, ...items.map(t => Math.abs(+t.v) || 0)), w = 100 / n, seen = new Set(), hl = p.hl || {};
    items.forEach((t, i) => {
      let b = box.querySelector(`[data-id="${t.id}"]`);
      if (!b) { b = document.createElement('div'); b.dataset.id = t.id; b.innerHTML = '<span></span>'; box.append(b); }
      seen.add(String(t.id));
      b.className = 'vz-bar ' + (hl[i] || '') + (p.range && (i < p.range[0] || i > p.range[1]) ? ' dim' : '');
      b.style.left = `calc(${i * w}% + 2px)`; b.style.width = `calc(${w}% - 4px)`; b.style.height = (14 + 80 * Math.abs(t.v) / max) + '%';
      b.firstChild.textContent = t.v;
    });
    box.querySelectorAll('.vz-bar').forEach(b => { if (!seen.has(b.dataset.id)) b.remove(); });
    const pt = el.querySelector('.vz-ptrs'), by = {};
    Object.entries(p.ptr || {}).forEach(([k, i]) => { if (i !== null && i >= 0) (by[i] = by[i] || []).push(k); });
    pt.innerHTML = Object.entries(by).map(([i, ks]) => `<span style="left:${(+i + 0.5) * w}%">${esc(ks.join(' '))}</span>`).join('');
  }
  function rGrid(p) {
    const hl = p.hl || {};
    return `${p.name ? `<div class="vz-name">${esc(p.name)}</div>` : ''}<div class="vz-gw"><table class="vz-grid${p.board ? ' board' : ''}">${p.ch ? `<tr><th>${esc(p.corner || '')}</th>${p.ch.map(c => `<th>${esc(c)}</th>`).join('')}</tr>` : ''}
      ${p.rows.map((row, r) => `<tr>${p.rh ? `<th>${esc(p.rh[r])}</th>` : ''}${row.map((v, c) => `<td class="${hl[r + ',' + c] || ''}${p.board && (r + c) % 2 ? ' dk' : ''}">${v === null || v === undefined ? '' : esc(v)}</td>`).join('')}</tr>`).join('')}</table></div>`;
  }
  function rGraph(p) {
    const ns = p.ns || {}, es = p.es || {}, sub = p.sub || {}, pos = {};
    p.nodes.forEach(n => pos[n.id] = n);
    const R = 4.6, lines = p.edges.map(e => {
      const a = pos[e.a], b = pos[e.b]; if (!a || !b) return '';
      const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
      const x1 = a.x + ux * R, y1 = a.y + uy * R, x2 = b.x - ux * (R + (e.dir ? 1.4 : 0)), y2 = b.y - uy * (R + (e.dir ? 1.4 : 0));
      const cls = es[e.a + ',' + e.b] || es[e.b + ',' + e.a] || '';
      return `<line class="vz-e ${cls}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"${e.dir ? ' marker-end="url(#vzarr)"' : ''}/>` +
        (e.w !== undefined ? `<text class="vz-ew" x="${(a.x + b.x) / 2 - uy * 3}" y="${(a.y + b.y) / 2 + ux * 3 + 1.2}">${esc(e.w)}</text>` : '');
    }).join('');
    const circles = p.nodes.map(n => `<g class="vz-n ${ns[n.id] || ''}"><circle cx="${n.x}" cy="${n.y}" r="${R}"/><text x="${n.x}" y="${n.y + 1.5}">${esc(n.label ?? n.id)}</text>${sub[n.id] !== undefined ? `<text class="vz-sub" x="${n.x}" y="${n.y + R + 4.2}">${esc(sub[n.id])}</text>` : ''}</g>`).join('');
    const H = p.h || 64;
    return `${p.name ? `<div class="vz-name">${esc(p.name)}</div>` : ''}<svg class="vz-svg" viewBox="0 0 100 ${H}" role="img" aria-label="${esc(p.name || 'graph')}"><defs><marker id="vzarr" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L6,3 L0,6 z" class="vz-ah"/></marker></defs>${lines}${circles}</svg>`;
  }
  function treeLayout(arr, heapIdx) { // level-order array (LeetCode style, or heap-indexed) -> positioned nodes
    const nodes = {}, kids = {};
    if (!arr.length || arr[0] === null || arr[0] === undefined) return { nodes: [], edges: [], kids, depth: 0 };
    nodes[0] = { id: 0, v: arr[0], d: 0 };
    if (heapIdx) {
      for (let i = 1; i < arr.length; i++) if (arr[i] !== null && arr[i] !== undefined && nodes[(i - 1) >> 1]) { const p = (i - 1) >> 1; nodes[i] = { id: i, v: arr[i], d: nodes[p].d + 1 }; (kids[p] = kids[p] || {})[i % 2 ? 'l' : 'r'] = i; }
    } else {
      const q = [0]; let i = 1, h = 0;
      while (h < q.length && i < arr.length) {
        const p = q[h++];
        for (const side of ['l', 'r']) {
          if (i < arr.length && arr[i] !== null) { nodes[i] = { id: i, v: arr[i], d: nodes[p].d + 1 }; (kids[p] = kids[p] || {})[side] = i; q.push(i); }
          i++;
        }
      }
    }
    let x = 0; const ord = id => { if (id === undefined) return; ord((kids[id] || {}).l); nodes[id].o = x++; ord((kids[id] || {}).r); };
    ord(0);
    const list = Object.values(nodes), depth = Math.max(...list.map(n => n.d)) + 1, gy = Math.min(15, 52 / Math.max(1, depth - 1));
    list.forEach(n => { n.x = 6 + (n.o + 0.5) * (88 / x); n.y = 7 + n.d * gy; });
    const edges = [];
    Object.entries(kids).forEach(([p, k]) => ['l', 'r'].forEach(s => k[s] !== undefined && edges.push({ a: +p, b: k[s] })));
    return { nodes: list.map(n => ({ id: n.id, label: n.v, x: n.x, y: n.y })), edges, kids, depth, gy };
  }
  function rTree(p) {
    const L = treeLayout(p.arr, p.heap);
    if (!L.nodes.length) return `${p.name ? `<div class="vz-name">${esc(p.name)}</div>` : ''}<div class="vz-empty">(empty tree)</div>`;
    return rGraph({ name: p.name, nodes: L.nodes, edges: L.edges, ns: p.ns, es: p.es, sub: p.sub, h: Math.max(26, 15 + (L.depth - 1) * L.gy) });
  }
  function rList(p) {
    const n = p.nodes.length, gap = 100 / Math.max(n, 1), xs = p.nodes.map((_, i) => gap * (i + 0.5)), ptr = {};
    Object.entries(p.ptr || {}).forEach(([k, i]) => { const key = i === null || i === undefined ? 'null' : i; (ptr[key] = ptr[key] || []).push(k); });
    const hl = p.hl || {}, y = 16, w = Math.min(10, gap * 0.55);
    const arrows = p.next.map((t, i) => {
      if (t === null || t === undefined) return `<text class="vz-null" x="${xs[i] + (p.dirs && p.dirs[i] === -1 ? -w / 2 - 3.5 : w / 2 + 3.5)}" y="${y + 1.5}">∅</text>`;
      const fwd = t > i, x1 = xs[i] + (fwd ? w / 2 : -w / 2), x2 = xs[t] + (fwd ? -w / 2 - 1.2 : w / 2 + 1.2);
      return `<path class="vz-e on" d="M${x1},${y} L${x2},${y}" marker-end="url(#vzarr2)"/>`;
    }).join('');
    const boxes = p.nodes.map((v, i) => `<g class="vz-ln ${hl[i] || ''}"><rect x="${xs[i] - w / 2}" y="${y - 5}" width="${w}" height="10" rx="2"/><text x="${xs[i]}" y="${y + 1.6}">${esc(v)}</text></g>`).join('');
    const labels = Object.entries(ptr).map(([i, ks]) => i === 'null' ? '' : `<text class="vz-pl" x="${xs[i]}" y="${y + 11}">${esc(ks.join(' · '))}</text>`).join('');
    const nullNote = ptr['null'] ? `<text class="vz-pl" x="2" y="${y + 18}" text-anchor="start">${esc(ptr['null'].join(' · '))} = null</text>` : '';
    return `${p.name ? `<div class="vz-name">${esc(p.name)}</div>` : ''}<svg class="vz-svg" viewBox="0 0 100 ${ptr['null'] ? 37 : 31}"><defs><marker id="vzarr2" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="4" markerHeight="4" orient="auto"><path d="M0,0 L6,3 L0,6 z" class="vz-ah"/></marker></defs>${arrows}${boxes}${labels}${nullNote}</svg>`;
  }
  function rStack(p) {
    const hl = p.hl || {};
    return `<div class="vz-name">${esc(p.name || 'Stack')}</div><div class="vz-stack${p.h ? ' h' : ''}">${p.items.length ? p.items.map((v, i) => `<div class="${hl[i] || ''}">${esc(v)}</div>`).join('') : '<em>empty</em>'}</div>`;
  }
  function rChips(p) {
    const hl = p.hl || {};
    return `<div class="vz-name">${esc(p.name || '')}</div><div class="vz-chips">${p.items.length ? p.items.map((v, i) => `<span class="${hl[i] || ''}">${esc(v)}</span>`).join('') : '<em>none yet</em>'}</div>`;
  }
  function rIntervals(p) {
    const lo = p.lo, hi = p.hi, span = Math.max(1, hi - lo), X = v => 4 + (v - lo) / span * 92, rows = p.rows;
    const ticks = []; for (let v = lo; v <= hi; v += Math.max(1, Math.ceil(span / 12))) ticks.push(v);
    const H = 8 + rows.length * 6;
    return `${p.name ? `<div class="vz-name">${esc(p.name)}</div>` : ''}<svg class="vz-svg" viewBox="0 0 100 ${H}">${ticks.map(v => `<line class="vz-tick" x1="${X(v)}" y1="2" x2="${X(v)}" y2="${H - 5}"/><text class="vz-tl" x="${X(v)}" y="${H - 1}">${v}</text>`).join('')}
      ${rows.map((r, i) => `<g class="vz-iv ${r.cls || ''}"><rect x="${X(r.s)}" y="${3 + i * 6}" width="${Math.max(0.8, X(r.e) - X(r.s))}" height="4" rx="1.2"/><text x="${X(r.s) - 1}" y="${6.2 + i * 6}">${esc(r.label || '')}</text></g>`).join('')}</svg>`;
  }
  const R = { arr: rArr, grid: rGrid, graph: rGraph, tree: rTree, list: rList, stack: rStack, chips: rChips, iv: rIntervals };

  // -------------------------------------------------- component
  function mount(el) {
    const ids = el.dataset.viz.split(',').map(s => s.trim()).filter(id => V[id]);
    if (!ids.length) return;
    let id = ids[0], F = [], k = 0, timer = null, speed = 1;
    el.classList.add('vz');
    el.innerHTML = `<div class="vz-head"><b class="vz-title"></b>${ids.length > 1 ? `<select class="vz-sel" aria-label="Choose algorithm">${ids.map(x => `<option value="${x}">${esc(V[x].title)}</option>`).join('')}</select>` : ''}</div>
      <div class="vz-in"><label><span class="vz-il"></span><input class="vz-inp" spellcheck="false"></label><button type="button" class="vz-b vz-go">Visualize</button><button type="button" class="vz-b vz-rnd" title="Random input">🎲</button></div>
      <div class="vz-body"><div class="vz-stage" aria-live="polite"></div><div class="vz-side"><pre class="vz-code"></pre><div class="vz-vars"></div></div></div>
      <div class="vz-msg"></div>
      <div class="vz-ctl"><button type="button" class="vz-b" data-a="first" title="Restart">⏮</button><button type="button" class="vz-b" data-a="prev" title="Step back (←)">◀</button><button type="button" class="vz-b vz-play" data-a="play" title="Play / pause (space)">▶ Play</button><button type="button" class="vz-b" data-a="next" title="Step forward (→)">▶|</button><button type="button" class="vz-b" data-a="last" title="Jump to end">⏭</button>
        <input type="range" class="vz-pos" min="0" value="0" aria-label="Step"><span class="vz-k"></span>
        <select class="vz-spd" aria-label="Speed"><option value="0.5">0.5×</option><option value="1" selected>1×</option><option value="2">2×</option><option value="4">4×</option></select></div>`;
    const $ = s => el.querySelector(s), stage = $('.vz-stage');
    function load(newId, input) {
      id = newId; const v = V[id];
      $('.vz-title').textContent = v.title;
      $('.vz-il').textContent = v.label;
      if (input !== undefined) $('.vz-inp').value = input; else if (!$('.vz-inp').value || $('.vz-inp').dataset.for !== id) $('.vz-inp').value = el.dataset.input && newId === ids[0] && !$('.vz-inp').dataset.for ? el.dataset.input : v.input;
      $('.vz-inp').dataset.for = id;
      $('.vz-code').innerHTML = v.code.map((l, i) => `<span data-l="${i}">${esc(l)}</span>`).join('');
      try { F = v.run($('.vz-inp').value); } catch (e) { F = [{ msg: '⚠️ ' + (e.message || 'Could not read that input') + '. Example: ' + v.input, panels: [] }]; }
      if (!F.length) F = [{ msg: 'Nothing to show.', panels: [] }];
      stage.innerHTML = ''; k = 0; stop();
      $('.vz-pos').max = F.length - 1;
      show();
    }
    function show() {
      const f = F[k];
      const want = (f.panels || []).map((p, i) => p.t + i);
      stage.querySelectorAll(':scope > .vz-p').forEach(d => { if (!want.includes(d.dataset.key)) d.remove(); });
      (f.panels || []).forEach((p, i) => {
        const key = p.t + i; let d = stage.querySelector(`:scope > [data-key="${key}"]`);
        if (!d) { d = document.createElement('div'); d.className = 'vz-p vzp-' + p.t + (p.wide ? ' wide' : ''); d.dataset.key = key; stage.append(d); }
        if (p.t === 'arr' && p.bars) rBars(d, p); else d.innerHTML = R[p.t](p);
      });
      [...stage.children].forEach((d, i) => { if (d.dataset.key !== want[i]) { const want_el = stage.querySelector(`:scope > [data-key="${want[i]}"]`); if (want_el) stage.insertBefore(want_el, d); } });
      el.querySelectorAll('.vz-code span').forEach(s => s.classList.toggle('on', +s.dataset.l === f.line));
      $('.vz-vars').innerHTML = f.vars ? Object.entries(f.vars).map(([a, b]) => `<span><i>${esc(a)}</i> = <b>${esc(b)}</b></span>`).join('') : '';
      $('.vz-msg').innerHTML = f.msg || '';
      $('.vz-pos').value = k; $('.vz-k').textContent = `${k + 1} / ${F.length}`;
    }
    const go = n => { k = Math.max(0, Math.min(F.length - 1, n)); show(); };
    function stop() { clearInterval(timer); timer = null; $('.vz-play').textContent = '▶ Play'; }
    function play() {
      if (timer) return stop();
      if (k >= F.length - 1) k = 0;
      $('.vz-play').textContent = '⏸ Pause';
      timer = setInterval(() => { if (k >= F.length - 1) return stop(); go(k + 1); }, 900 / speed);
    }
    el.querySelector('.vz-ctl').addEventListener('click', e => {
      const a = e.target.closest('[data-a]'); if (!a) return;
      ({ first: () => { stop(); go(0); }, prev: () => { stop(); go(k - 1); }, next: () => { stop(); go(k + 1); }, last: () => { stop(); go(F.length - 1); }, play })[a.dataset.a]();
    });
    $('.vz-pos').oninput = e => { stop(); go(+e.target.value); };
    $('.vz-spd').onchange = e => { speed = +e.target.value; if (timer) { stop(); play(); } };
    $('.vz-go').onclick = () => load(id, $('.vz-inp').value);
    $('.vz-inp').onkeydown = e => { if (e.key === 'Enter') load(id, e.target.value); };
    $('.vz-rnd').onclick = () => load(id, V[id].random ? V[id].random() : V[id].input);
    if ($('.vz-sel')) $('.vz-sel').onchange = e => load(e.target.value, V[e.target.value].input);
    el.tabIndex = 0;
    el.addEventListener('keydown', e => {
      if (e.target.closest('input,select,textarea')) return;
      if (e.key === 'ArrowRight') { stop(); go(k + 1); e.preventDefault(); }
      else if (e.key === 'ArrowLeft') { stop(); go(k - 1); e.preventDefault(); }
      else if (e.key === ' ') { play(); e.preventDefault(); }
    });
    load(id);
  }

  // -------------------------------------------------- helper to define visualizers
  const def = (id, title, label, input, code, run, random) => (V[id] = { title, label, input, code, run, random });
  const arrIn = (s, max = 16) => { const a = nums(s); if (!a.length) throw new Error('Enter some numbers'); if (a.length > max) throw new Error(`Use at most ${max} numbers`); return a; };

  // ======================= Sorting =======================
  function sorter(name, body) {
    return s => {
      const a = arrIn(parts(s)[0]); const it = a.map((v, i) => ({ id: i, v })), F = [], done = new Set();
      const fr = (line, msg, hl = {}, extra = {}) => { const h = {}; done.forEach(i => h[i] = 'done'); Object.assign(h, hl); F.push(clone({ line, msg, vars: extra.vars, panels: [{ t: 'arr', bars: 1, name, items: it, hl: h, ptr: extra.ptr, range: extra.range }].concat(extra.more || []) })); };
      body(it, fr, done);
      it.forEach((_, i) => done.add(i)); fr(-1, '✅ Sorted!');
      return F;
    };
  }
  const RS = () => rnd(8, 1, 30).join(' ');
  def('bubble-sort', 'Bubble Sort', 'Numbers', '5 1 4 2 8 3', ['for i = 0 .. n-2:', '  swapped = false', '  for j = 0 .. n-2-i:', '    if a[j] > a[j+1]:', '      swap(a[j], a[j+1]); swapped = true', '  a[n-1-i] is in its final place', '  if not swapped: stop'],
    sorter('Array', (it, fr, done) => {
      const n = it.length; fr(-1, 'Bubble sort walks the array and swaps neighbours that are out of order. The largest value “bubbles” to the end each pass.');
      for (let i = 0; i < n - 1; i++) {
        let sw = false; fr(1, `Pass ${i + 1}`);
        for (let j = 0; j < n - 1 - i; j++) {
          fr(3, `Compare a[${j}] = <b>${it[j].v}</b> and a[${j + 1}] = <b>${it[j + 1].v}</b>`, { [j]: 'cmp', [j + 1]: 'cmp' }, { vars: { i, j } });
          if (it[j].v > it[j + 1].v) { [it[j], it[j + 1]] = [it[j + 1], it[j]]; sw = true; fr(4, `Out of order, so swap them`, { [j]: 'swap', [j + 1]: 'swap' }, { vars: { i, j } }); }
        }
        done.add(n - 1 - i); fr(5, `<b>${it[n - 1 - i].v}</b> is now in its final position`);
        if (!sw) { fr(6, 'No swaps in this pass, so the array is already sorted. Stop early.'); break; }
      }
    }), RS);
  def('selection-sort', 'Selection Sort', 'Numbers', '29 10 14 37 13', ['for i = 0 .. n-2:', '  min = i', '  for j = i+1 .. n-1:', '    if a[j] < a[min]: min = j', '  swap(a[i], a[min])'],
    sorter('Array', (it, fr, done) => {
      const n = it.length; fr(-1, 'Selection sort finds the smallest remaining value and moves it to the front.');
      for (let i = 0; i < n - 1; i++) {
        let m = i; fr(1, `Assume a[${i}] = <b>${it[i].v}</b> is the minimum`, { [i]: 'act' }, { vars: { i, min: m } });
        for (let j = i + 1; j < n; j++) {
          fr(3, `Is ${it[j].v} < ${it[m].v}?`, { [m]: 'act', [j]: 'cmp' }, { vars: { i, j, min: m } });
          if (it[j].v < it[m].v) { m = j; fr(3, `Yes, the new minimum is <b>${it[m].v}</b>`, { [m]: 'act' }, { vars: { i, j, min: m } }); }
        }
        [it[i], it[m]] = [it[m], it[i]]; done.add(i); fr(4, `Swap the minimum into position ${i}`, { [i]: 'swap', [m]: 'swap' }, { vars: { i, min: m } });
      }
    }), RS);
  def('insertion-sort', 'Insertion Sort', 'Numbers', '12 11 13 5 6 3', ['for i = 1 .. n-1:', '  key = a[i]; j = i - 1', '  while j >= 0 and a[j] > key:', '    a[j+1] = a[j]; j = j - 1', '  a[j+1] = key'],
    sorter('Array', (it, fr) => {
      const n = it.length; fr(-1, 'Insertion sort grows a sorted prefix. Each new value slides left until it is in place, like sorting playing cards.');
      for (let i = 1; i < n; i++) {
        const sorted = {}; for (let q = 0; q < i; q++) sorted[q] = 'win';
        fr(1, `Take key = <b>${it[i].v}</b>; the prefix a[0..${i - 1}] is already sorted`, Object.assign({}, sorted, { [i]: 'act' }), { vars: { i, key: it[i].v } });
        let j = i;
        while (j > 0 && it[j - 1].v > it[j].v) {
          fr(2, `${it[j - 1].v} > ${it[j].v}: shift it right`, { [j - 1]: 'cmp', [j]: 'act' }, { vars: { i, j: j - 1, key: it[j].v } });
          [it[j - 1], it[j]] = [it[j], it[j - 1]]; j--;
          fr(3, 'Shifted', { [j]: 'act', [j + 1]: 'swap' }, { vars: { i, j: j - 1, key: it[j].v } });
        }
        const s2 = {}; for (let q = 0; q <= i; q++) s2[q] = 'win'; s2[j] = 'act';
        fr(4, `Insert ${it[j].v} at position ${j}`, s2, { vars: { i, key: it[j].v } });
      }
    }), RS);
  def('merge-sort', 'Merge Sort', 'Numbers', '38 27 43 3 9 82 10', ['mergeSort(lo, hi):', '  if lo >= hi: return', '  mid = (lo + hi) / 2', '  mergeSort(lo, mid); mergeSort(mid+1, hi)', '  merge the two sorted halves:', '    take the smaller front element each time'],
    sorter('Array', (it, fr) => {
      fr(-1, 'Merge sort splits the array in half, sorts each half recursively, then merges the two sorted halves.');
      const ms = (lo, hi, depth) => {
        if (lo >= hi) { fr(1, `Range [${lo}..${hi}] has one element, so it is sorted`, { [lo]: 'act' }, { range: [lo, hi] }); return; }
        const mid = (lo + hi) >> 1; fr(2, `Split [${lo}..${hi}] into [${lo}..${mid}] and [${mid + 1}..${hi}]`, {}, { range: [lo, hi], ptr: { lo, mid, hi }, vars: { depth } });
        ms(lo, mid, depth + 1); ms(mid + 1, hi, depth + 1);
        const L = it.slice(lo, mid + 1), Rr = it.slice(mid + 1, hi + 1), out = [];
        let i = 0, j = 0;
        const aux = () => ({ t: 'arr', name: 'Merged so far', items: out.map(x => x.v), noidx: 1 });
        while (i < L.length && j < Rr.length) {
          const hl = { [lo + i]: 'cmp', [mid + 1 + j]: 'cmp' };
          fr(5, `Compare ${L[i].v} and ${Rr[j].v}, take the smaller`, hl, { range: [lo, hi], more: [aux()] });
          out.push(L[i].v <= Rr[j].v ? L[i++] : Rr[j++]);
        }
        while (i < L.length) out.push(L[i++]); while (j < Rr.length) out.push(Rr[j++]);
        out.forEach((x, q) => it[lo + q] = x);
        const hl = {}; for (let q = lo; q <= hi; q++) hl[q] = 'win';
        fr(4, `Merged [${lo}..${hi}] is sorted`, hl, { range: [lo, hi], more: [aux()] });
      };
      ms(0, it.length - 1, 0);
    }), RS);
  def('quick-sort', 'Quick Sort', 'Numbers', '10 80 30 90 40 50 70', ['quickSort(lo, hi):', '  if lo >= hi: return', '  pivot = a[hi]; i = lo', '  for j = lo .. hi-1:', '    if a[j] < pivot: swap(a[i], a[j]); i++', '  swap(a[i], a[hi])   # pivot in place', '  quickSort(lo, i-1); quickSort(i+1, hi)'],
    sorter('Array', (it, fr, done) => {
      fr(-1, 'Quick sort picks a pivot, moves smaller values to its left and larger to its right (partition), then sorts both sides.');
      const qs = (lo, hi) => {
        if (lo > hi) return;
        if (lo === hi) { done.add(lo); fr(1, `Single element ${it[lo].v} is in place`, {}, { range: [lo, hi] }); return; }
        const pv = it[hi].v; let i = lo;
        fr(2, `Pivot = <b>${pv}</b> (last element of [${lo}..${hi}])`, { [hi]: 'mid' }, { range: [lo, hi], ptr: { i } });
        for (let j = lo; j < hi; j++) {
          fr(4, `Is ${it[j].v} < ${pv}?`, { [hi]: 'mid', [j]: 'cmp' }, { range: [lo, hi], ptr: { i, j }, vars: { pivot: pv } });
          if (it[j].v < pv) { [it[i], it[j]] = [it[j], it[i]]; fr(4, `Yes: swap it into the “smaller” zone at i = ${i}`, { [hi]: 'mid', [i]: 'swap', [j]: 'swap' }, { range: [lo, hi], ptr: { i, j } }); i++; }
        }
        [it[i], it[hi]] = [it[hi], it[i]]; done.add(i);
        fr(5, `Put the pivot ${pv} at index ${i}: everything left is smaller, everything right is larger`, { [i]: 'mid' }, { range: [lo, hi] });
        qs(lo, i - 1); qs(i + 1, hi);
      };
      qs(0, it.length - 1);
    }), RS);
  def('dutch-flag', 'Dutch National Flag (0 / 1 / 2)', 'Values 0, 1, 2', '2 0 2 1 1 0 1 2 0', ['lo = mid = 0; hi = n-1', 'while mid <= hi:', '  if a[mid] == 0: swap(lo, mid); lo++; mid++', '  elif a[mid] == 1: mid++', '  else: swap(mid, hi); hi--'],
    s => {
      const a = arrIn(s).map(x => Math.max(0, Math.min(2, x))), F = [], C = ['🔴', '⚪', '🔵'];
      let lo = 0, mid = 0, hi = a.length - 1;
      const fr = (line, msg, hl = {}) => F.push(clone({ line, msg, vars: { lo, mid, hi }, panels: [{ t: 'arr', name: 'Colours', items: a.map(v => C[v] + ' ' + v), hl, ptr: { lo, mid, hi } }] }));
      fr(0, 'Three zones: [0, lo) holds 0s, [lo, mid) holds 1s, (hi, n−1] holds 2s. The values in [mid, hi] are not checked yet.');
      while (mid <= hi) {
        if (a[mid] === 0) { [a[lo], a[mid]] = [a[mid], a[lo]]; fr(2, `a[mid] is 0: swap it to the front (index ${lo})`, { [lo]: 'swap', [mid]: 'swap' }); lo++; mid++; }
        else if (a[mid] === 1) { fr(3, 'a[mid] is 1: it is already in the middle zone', { [mid]: 'act' }); mid++; }
        else { [a[mid], a[hi]] = [a[hi], a[mid]]; fr(4, `a[mid] is 2: swap it to the back (index ${hi}). Do not move mid: the swapped-in value is unchecked`, { [mid]: 'swap', [hi]: 'swap' }); hi--; }
      }
      const d = {}; a.forEach((_, i) => d[i] = 'done'); fr(-1, '✅ Sorted in a single pass', d);
      return F;
    }, () => rnd(9, 0, 2).join(' '));

  // ======================= Searching & pointers =======================
  def('binary-search', 'Binary Search', 'Sorted numbers ; target', '2 5 8 12 16 23 38 56 72 91 ; 23', ['lo = 0, hi = n - 1', 'while lo <= hi:', '  mid = (lo + hi) / 2', '  if a[mid] == target: return mid', '  if a[mid] < target: lo = mid + 1', '  else: hi = mid - 1', 'return -1'],
    s => {
      const [x, y] = parts(s), a = arrIn(x, 20).sort((p, q) => p - q), t = nums(y)[0] ?? a[0], F = [];
      let lo = 0, hi = a.length - 1, steps = 0;
      const fr = (line, msg, hl = {}, mid) => F.push(clone({ line, msg, vars: { lo, hi, mid: mid ?? '–', target: t, steps }, panels: [{ t: 'arr', name: 'Sorted array', items: a, hl, ptr: { lo, hi, mid }, range: [lo, hi] }] }));
      fr(0, `Search for <b>${t}</b>. The whole array is the search range.`);
      while (lo <= hi) {
        const mid = (lo + hi) >> 1; steps++;
        fr(2, `mid = (${lo} + ${hi}) / 2 = ${mid}; a[mid] = <b>${a[mid]}</b>`, { [mid]: 'mid' }, mid);
        if (a[mid] === t) { fr(3, `Found ${t} at index ${mid} after ${steps} step(s). A linear scan could need up to ${a.length}.`, { [mid]: 'done' }, mid); return F; }
        if (a[mid] < t) { lo = mid + 1; fr(4, `${a[mid]} < ${t}: discard the left half`, {}, mid); }
        else { hi = mid - 1; fr(5, `${a[mid]} > ${t}: discard the right half`, {}, mid); }
      }
      fr(6, `The range is empty: ${t} is not in the array. Index lo = ${lo} is where it would be inserted.`);
      return F;
    }, () => { const a = [...new Set(rnd(10, 1, 99))].sort((p, q) => p - q); return a.join(' ') + ' ; ' + a[Math.floor(Math.random() * a.length)]; });
  def('two-pointers', 'Two Pointers (pair sum in a sorted array)', 'Sorted numbers ; target', '1 2 4 6 8 9 14 15 ; 13', ['lo = 0, hi = n - 1', 'while lo < hi:', '  s = a[lo] + a[hi]', '  if s == target: return (lo, hi)', '  if s < target: lo++   # need bigger', '  else: hi--            # need smaller'],
    s => {
      const [x, y] = parts(s), a = arrIn(x, 20).sort((p, q) => p - q), t = nums(y)[0] ?? 0, F = [];
      let lo = 0, hi = a.length - 1;
      const fr = (line, msg, hl = {}) => F.push(clone({ line, msg, vars: { lo, hi, sum: lo < hi ? a[lo] + a[hi] : '–', target: t }, panels: [{ t: 'arr', name: 'Sorted array', items: a, hl, ptr: { lo, hi }, range: [lo, hi] }] }));
      fr(0, 'Start with the smallest (lo) and largest (hi) values.');
      while (lo < hi) {
        const sm = a[lo] + a[hi];
        fr(2, `${a[lo]} + ${a[hi]} = <b>${sm}</b>`, { [lo]: 'cmp', [hi]: 'cmp' });
        if (sm === t) { fr(3, `Found it: ${a[lo]} + ${a[hi]} = ${t}`, { [lo]: 'done', [hi]: 'done' }); return F; }
        if (sm < t) { fr(4, `${sm} < ${t}: the sum is too small, so move lo right (every pair with a[lo] is too small)`, { [lo]: 'swap' }); lo++; }
        else { fr(5, `${sm} > ${t}: the sum is too big, so move hi left`, { [hi]: 'swap' }); hi--; }
      }
      fr(-1, 'The pointers met: no pair adds up to the target.');
      return F;
    }, () => { const a = [...new Set(rnd(8, 1, 30))].sort((p, q) => p - q); return a.join(' ') + ' ; ' + (a[1] + a[a.length - 2]); });
  def('two-sum-hash', 'Two Sum with a Hash Map', 'Numbers ; target', '4 9 1 7 3 ; 11', ['seen = {}', 'for i, x in enumerate(nums):', '  need = target - x', '  if need in seen: return [seen[need], i]', '  seen[x] = i'],
    s => {
      const [x, y] = parts(s), a = arrIn(x), t = nums(y)[0] ?? 0, F = [], seen = new Map();
      const fr = (line, msg, i, hl = {}, vars = {}) => F.push(clone({ line, msg, vars, panels: [{ t: 'arr', name: 'nums', items: a, hl, ptr: { i } }, { t: 'chips', name: 'seen (value → index)', items: [...seen].map(([k, v]) => `${k} → ${v}`), hl: vars.hit !== undefined ? { [vars.hit]: 'done' } : {} }] }));
      fr(0, 'One pass. For each number, ask: “have I already seen the partner I need?”', null);
      for (let i = 0; i < a.length; i++) {
        const need = t - a[i];
        fr(2, `x = ${a[i]}, so we need ${t} − ${a[i]} = <b>${need}</b>`, i, { [i]: 'act' }, { i, x: a[i], need });
        if (seen.has(need)) { const hit = [...seen.keys()].indexOf(need); fr(3, `${need} is in the map at index ${seen.get(need)}. Answer: [${seen.get(need)}, ${i}]`, i, { [i]: 'done', [seen.get(need)]: 'done' }, { i, need, hit }); return F; }
        seen.set(a[i], i); fr(4, `${need} not seen yet. Store ${a[i]} → ${i}`, i, { [i]: 'act' }, { i, need });
      }
      fr(-1, 'No pair found.', null); return F;
    }, () => { const a = rnd(6, 1, 20); return a.join(' ') + ' ; ' + (a[1] + a[4]); });
  def('prefix-sum', 'Prefix Sums & Range Queries', 'Numbers ; query i j', '3 1 4 1 5 9 2 6 ; 2 5', ['prefix[0] = 0', 'for i = 0 .. n-1:', '  prefix[i+1] = prefix[i] + a[i]', 'sum(i..j) = prefix[j+1] - prefix[i]'],
    s => {
      const [x, y] = parts(s), a = arrIn(x), q = nums(y), F = [], P = [0];
      let i = Math.max(0, Math.min(a.length - 1, q[0] ?? 0)), j = Math.max(i, Math.min(a.length - 1, q[1] ?? a.length - 1));
      const fr = (line, msg, ha = {}, hp = {}, vars = {}) => F.push(clone({ line, msg, vars, panels: [{ t: 'arr', name: 'a', items: a, hl: ha }, { t: 'arr', name: 'prefix (prefix[k] = sum of the first k values)', items: P.concat(Array(a.length + 1 - P.length).fill(null)), hl: hp }] }));
      fr(0, 'prefix[k] stores the sum of the first k elements. Building it once makes every range sum O(1).');
      for (let k = 0; k < a.length; k++) { P.push(P[k] + a[k]); const h = {}; for (let z = 0; z <= k; z++) h[z] = 'win'; fr(2, `prefix[${k + 1}] = prefix[${k}] + a[${k}] = ${P[k]} + ${a[k]} = <b>${P[k + 1]}</b>`, h, { [k + 1]: 'act', [k]: 'cmp' }); }
      const ha = {}; for (let z = i; z <= j; z++) ha[z] = 'done';
      fr(3, `Query sum(${i}..${j}) = prefix[${j + 1}] − prefix[${i}] = ${P[j + 1]} − ${P[i]} = <b>${P[j + 1] - P[i]}</b>. One subtraction, no loop.`, ha, { [j + 1]: 'done', [i]: 'swap' }, { i, j, sum: P[j + 1] - P[i] });
      return F;
    }, () => { const a = rnd(8, 1, 9); return a.join(' ') + ' ; 2 5'; });
  def('kadane', "Kadane's Algorithm (maximum subarray)", 'Numbers', '-2 1 -3 4 -1 2 1 -5 4', ['cur = best = a[0]', 'for i = 1 .. n-1:', '  cur = max(a[i], cur + a[i])  # extend or restart', '  best = max(best, cur)'],
    s => {
      const a = arrIn(s), F = []; let cur = a[0], best = a[0], st = 0, bs = 0, be = 0;
      const fr = (line, msg, i) => { const h = {}; for (let z = st; z <= i; z++) h[z] = 'win'; for (let z = bs; z <= be; z++) h[z] = h[z] === 'win' ? 'done' : 'mid'; h[i] = 'act'; F.push(clone({ line, msg, vars: { i, cur, best }, panels: [{ t: 'arr', name: 'a  (blue = current run, green/purple = best run)', items: a, hl: h, ptr: { i } }] })); };
      fr(0, `Start: cur = best = ${a[0]}`, 0);
      for (let i = 1; i < a.length; i++) {
        if (a[i] > cur + a[i]) { const old = cur; cur = a[i]; st = i; fr(2, `${old} + ${a[i]} = ${old + a[i]} is worse than ${a[i]} alone: the old run only hurts, so <b>restart</b> at index ${i}`, i); }
        else { cur += a[i]; fr(2, `Extend the run: cur = <b>${cur}</b>`, i); }
        if (cur > best) { best = cur; bs = st; be = i; fr(3, `New best = <b>${best}</b> (indices ${bs}..${be})`, i); }
      }
      fr(-1, `✅ Maximum subarray sum = <b>${best}</b>, from index ${bs} to ${be}`, a.length - 1);
      return F;
    }, () => rnd(9, -9, 9).join(' '));
  def('window-fixed', 'Sliding Window (fixed size k)', 'Numbers ; k', '2 1 5 1 3 2 9 4 ; 3', ['sum = a[0] + … + a[k-1]', 'best = sum', 'for r = k .. n-1:', '  sum += a[r] - a[r-k]   # slide by one', '  best = max(best, sum)'],
    s => {
      const [x, y] = parts(s), a = arrIn(x), kk = Math.max(1, Math.min(a.length, nums(y)[0] || 3)), F = [];
      let sum = 0; for (let i = 0; i < kk; i++) sum += a[i]; let best = sum, bl = 0;
      const fr = (line, msg, l, extra = {}) => { const h = {}; for (let z = l; z < l + kk; z++) h[z] = 'win'; Object.assign(h, extra); F.push(clone({ line, msg, vars: { k: kk, sum, best }, panels: [{ t: 'arr', name: 'a', items: a, hl: h, ptr: { L: l, R: l + kk - 1 } }] })); };
      fr(0, `First window: sum of a[0..${kk - 1}] = <b>${sum}</b>`, 0);
      for (let r = kk; r < a.length; r++) {
        sum += a[r] - a[r - kk];
        fr(3, `Slide: add a[${r}] = ${a[r]}, remove a[${r - kk}] = ${a[r - kk]}, so sum = <b>${sum}</b>. O(1) per step instead of re-adding k numbers.`, r - kk + 1, { [r]: 'act', [r - kk]: 'swap' });
        if (sum > best) { best = sum; bl = r - kk + 1; fr(4, `New best = <b>${best}</b>`, bl); }
      }
      const h = {}; for (let z = bl; z < bl + kk; z++) h[z] = 'done';
      F.push(clone({ line: -1, msg: `✅ Best window sum = <b>${best}</b> at indices ${bl}..${bl + kk - 1}`, vars: { k: kk, best }, panels: [{ t: 'arr', name: 'a', items: a, hl: h }] }));
      return F;
    }, () => rnd(9, 1, 9).join(' ') + ' ; 3');
  def('window-var', 'Sliding Window (longest substring without repeats)', 'Text', 'abcabcbb', ['left = 0; last = {}', 'for right, ch in enumerate(s):', '  if ch seen at index >= left:', '    left = last[ch] + 1   # shrink', '  last[ch] = right', '  best = max(best, right - left + 1)'],
    s => {
      const str = String(s).slice(0, 18), a = [...str], F = [], last = new Map(); let left = 0, best = 0, bl = 0, br = -1;
      if (!a.length) throw new Error('Type some text');
      const fr = (line, msg, r, extra = {}) => { const h = {}; for (let z = left; z <= r; z++) h[z] = 'win'; Object.assign(h, extra); F.push(clone({ line, msg, vars: { left, right: r, best }, panels: [{ t: 'arr', name: 's', items: a, hl: h, ptr: { L: left, R: r } }, { t: 'chips', name: 'Characters in the window', items: a.slice(left, r + 1) }] })); };
      for (let r = 0; r < a.length; r++) {
        const ch = a[r];
        if (last.has(ch) && last.get(ch) >= left) { const p = last.get(ch); fr(2, `“${ch}” repeats (it is at index ${p}, inside the window)`, r, { [r]: 'swap', [p]: 'swap' }); left = p + 1; fr(3, `Shrink: move left past it, to ${left}`, r, { [r]: 'act' }); }
        last.set(ch, r);
        if (r - left + 1 > best) { best = r - left + 1; bl = left; br = r; }
        fr(5, `Window “${a.slice(left, r + 1).join('')}” has length ${r - left + 1}; best = <b>${best}</b>`, r, { [r]: 'act' });
      }
      const h = {}; for (let z = bl; z <= br; z++) h[z] = 'done';
      F.push(clone({ line: -1, msg: `✅ Longest substring without repeats: “${a.slice(bl, br + 1).join('')}” (length ${best})`, vars: { best }, panels: [{ t: 'arr', name: 's', items: a, hl: h }] }));
      return F;
    }, () => Array.from({ length: 10 }, () => 'abcde'[Math.floor(Math.random() * 5)]).join(''));
  def('merge-intervals', 'Merge Intervals', 'Intervals (start-end …)', '1-3 2-6 8-10 9-12 15-18', ['sort intervals by start', 'for [s, e] in intervals:', '  if s <= last merged end:', '    last.end = max(last.end, e)   # overlap', '  else: start a new merged interval'],
    s => {
      const iv = String(s).split(/[\s,;]+/).filter(Boolean).map(t => t.split('-').map(Number)).filter(p => p.length === 2 && !isNaN(p[0]) && !isNaN(p[1])).map(([a, b]) => [Math.min(a, b), Math.max(a, b)]).slice(0, 9);
      if (!iv.length) throw new Error('Write intervals like 1-3 2-6');
      const lo = Math.min(...iv.map(x => x[0])), hi = Math.max(...iv.map(x => x[1])), F = [], res = [];
      const fr = (line, msg, cur) => F.push(clone({ line, msg, panels: [{ t: 'iv', name: 'Input (sorted by start)', lo, hi, rows: iv.map((x, i) => ({ s: x[0], e: x[1], label: `[${x[0]},${x[1]}]`, cls: i === cur ? 'act' : i < cur ? 'dim' : '' })) }, { t: 'iv', name: 'Merged', lo, hi, rows: res.map(x => ({ s: x[0], e: x[1], label: `[${x[0]},${x[1]}]`, cls: 'done' })) }] }));
      fr(-1, 'Input intervals.', -1);
      iv.sort((a, b) => a[0] - b[0]); fr(0, 'Sort by start. Now an interval can only overlap the most recently merged one.', -1);
      iv.forEach((x, i) => {
        if (res.length && x[0] <= res[res.length - 1][1]) { res[res.length - 1][1] = Math.max(res[res.length - 1][1], x[1]); fr(3, `[${x}] starts before ${res[res.length - 1][1] === x[1] ? 'the old' : 'the'} end: extend to [${res[res.length - 1]}]`, i); }
        else { res.push([...x]); fr(4, `[${x}] does not overlap: start a new merged interval`, i); }
      });
      fr(-1, `✅ ${res.length} merged interval(s)`, iv.length);
      return F;
    }, () => Array.from({ length: 5 }, () => { const a = Math.floor(Math.random() * 15); return a + '-' + (a + 1 + Math.floor(Math.random() * 5)); }).join(' '));

  // ======================= Stacks =======================
  def('parens', 'Valid Parentheses (stack)', 'Brackets', '{[()()]}', ['stack = []', 'for ch in s:', '  if ch is an opener: push(ch)', '  else if stack empty or pop() != match(ch):', '    return false', 'return stack is empty'],
    s => {
      const a = [...String(s).replace(/[^()[\]{}]/g, '')].slice(0, 20), F = [], st = [], M = { ')': '(', ']': '[', '}': '{' };
      if (!a.length) throw new Error('Type brackets like ([]{})');
      const fr = (line, msg, i, hl = {}, sh = {}) => F.push(clone({ line, msg, panels: [{ t: 'arr', name: 's', items: a, hl, ptr: { i } }, { t: 'stack', name: 'Stack (top first)', items: [...st].reverse(), hl: sh }] }));
      fr(0, 'Openers go on the stack; each closer must match the most recent unclosed opener.', null);
      for (let i = 0; i < a.length; i++) {
        const ch = a[i];
        if (!M[ch]) { st.push(ch); fr(2, `“${ch}” opens: push it`, i, { [i]: 'act' }, { 0: 'act' }); }
        else {
          const top = st.pop();
          if (top !== M[ch]) { fr(4, top ? `“${ch}” does not match “${top}”: invalid` : `“${ch}” has nothing to close: invalid`, i, { [i]: 'swap' }); return F; }
          fr(3, `“${ch}” matches “${top}”: pop`, i, { [i]: 'done' });
        }
      }
      fr(5, st.length ? `Unclosed brackets remain: invalid` : '✅ Every bracket was matched: valid', null, st.length ? {} : Object.fromEntries(a.map((_, i) => [i, 'done'])));
      return F;
    }, () => ['([]{})', '(]', '{[()()]}', '(()', '([)]', '[{}](())'][Math.floor(Math.random() * 6)]);
  def('mono-stack', 'Monotonic Stack (next greater element)', 'Numbers', '73 74 75 71 69 72 76 73', ['res = [0] * n; stack = []', 'for i, x in enumerate(a):', '  while stack and a[stack.top] < x:', '    j = pop(); res[j] = i - j   # x is j’s next greater', '  push(i)'],
    s => {
      const a = arrIn(s), F = [], st = [], res = a.map(() => 0);
      const fr = (line, msg, i, hl = {}) => F.push(clone({ line, msg, panels: [{ t: 'arr', name: 'a', items: a, hl, ptr: { i } }, { t: 'stack', name: 'Stack of waiting indices (top first); values decrease downward', items: [...st].reverse().map(j => `${j}: ${a[j]}`) }, { t: 'arr', name: 'answer: days until a greater value', items: res }] }));
      fr(0, 'The stack holds indices still waiting for a greater value. Their values are decreasing.', null);
      for (let i = 0; i < a.length; i++) {
        fr(1, `Look at a[${i}] = <b>${a[i]}</b>`, i, { [i]: 'act' });
        while (st.length && a[st[st.length - 1]] < a[i]) { const j = st.pop(); res[j] = i - j; fr(3, `${a[i]} > ${a[j]}: index ${j} found its next greater value. res[${j}] = ${i} − ${j} = ${i - j}`, i, { [i]: 'act', [j]: 'done' }); }
        st.push(i); fr(4, `Push index ${i}`, i, { [i]: 'act' });
      }
      fr(-1, '✅ Indices left on the stack never find a greater value (answer 0). Each index is pushed and popped once: O(n).', null);
      return F;
    }, () => rnd(8, 60, 80).join(' '));

  // ======================= Linked list =======================
  def('reverse-list', 'Reverse a Linked List', 'Values', '1 2 3 4 5', ['prev = null; curr = head', 'while curr:', '  next = curr.next     # save', '  curr.next = prev     # flip arrow', '  prev = curr; curr = next', 'return prev'],
    s => {
      const v = arrIn(s, 8), n = v.length, nx = v.map((_, i) => i + 1 < n ? i + 1 : null), F = [];
      let prev = null, curr = 0, next = null;
      const fr = (line, msg, hl = {}) => F.push(clone({ line, msg, vars: { prev: prev === null ? 'null' : v[prev], curr: curr === null ? 'null' : v[curr], next: next === null ? 'null' : v[next] }, panels: [{ t: 'list', name: 'Nodes (arrows are .next)', nodes: v, next: nx, dirs: nx.map((t, i) => t === null ? (i === 0 ? -1 : 1) : 0), ptr: { prev, curr, next }, hl }] }));
      fr(0, 'Three pointers. Each step flips one arrow to point backwards.', { 0: 'act' });
      while (curr !== null) {
        next = nx[curr]; fr(2, `Save next = ${next === null ? 'null' : v[next]} so we do not lose the rest of the list`, { [curr]: 'act' });
        nx[curr] = prev; fr(3, `Flip: ${v[curr]}.next now points to ${prev === null ? 'null' : v[prev]}`, { [curr]: 'swap' });
        prev = curr; curr = next; fr(4, 'Advance prev and curr', prev !== null ? { [prev]: 'done' } : {});
      }
      next = null; fr(5, `✅ prev (${v[prev]}) is the new head`, Object.fromEntries(v.map((_, i) => [i, 'done'])));
      return F;
    }, () => rnd(5, 1, 9).join(' '));

  // ======================= Trees =======================
  const treeIn = s => { const t = String(s).split(/[\s,]+/).filter(Boolean).map(x => /^null|n|-$/i.test(x) ? null : Number(x)); if (!t.length || t.length > 15) throw new Error('Give 1–15 values in level order, null for gaps'); return t; };
  function traversal(kind, LN) {
    return s => {
      const arr = treeIn(s), F = [], out = [], ns = {};
      const L = treeLayout(arr), kids = id => [(L.kids[id] || {}).l, (L.kids[id] || {}).r], val = id => arr[id];
      const fr = (line, msg, extra) => F.push(clone({ line, msg, panels: [{ t: 'tree', name: 'Tree', arr, ns }, { t: 'chips', name: 'Output', items: out }].concat(extra || []) }));
      if (kind === 'level') {
        const q = [0], qs = () => [{ t: 'stack', h: 1, name: 'Queue (front first)', items: q.map(val) }];
        ns[0] = 'q'; fr(0, 'Breadth-first: a queue visits the tree level by level.', qs());
        while (q.length) {
          const id = q.shift(); ns[id] = 'cur'; out.push(val(id)); fr(2, `Dequeue ${val(id)} and visit it`, qs());
          kids(id).forEach(c => { if (c !== undefined) { q.push(c); ns[c] = 'q'; } });
          fr(3, 'Enqueue its children', qs()); ns[id] = 'done';
        }
      } else {
        const stack = [], ex = () => [{ t: 'stack', name: 'Call stack (top first)', items: [...stack].reverse() }];
        const visitNow = id => { out.push(val(id)); ns[id] = 'done'; fr(LN.visit, `${({ pre: 'Pre-order: visit <b>before</b> the children', in: 'In-order: visit <b>between</b> left and right', post: 'Post-order: visit <b>after</b> both children' })[kind]} → ${val(id)}`, ex()); };
        const visit = id => {
          if (id === undefined) return;
          stack.push(val(id)); ns[id] = 'cur'; fr(LN.enter, `Enter node ${val(id)}`, ex());
          const [l, r] = kids(id);
          if (kind === 'pre') visitNow(id);
          if (l !== undefined) { if (ns[id] !== 'done') ns[id] = 'q'; fr(LN.left, `Go left from ${val(id)}`, ex()); visit(l); if (ns[id] !== 'done') ns[id] = 'cur'; }
          if (kind === 'in') visitNow(id);
          if (r !== undefined) { fr(LN.right, `Go right from ${val(id)}`, ex()); visit(r); }
          if (kind === 'post') visitNow(id);
          stack.pop(); fr(LN.ret, `Return from ${val(id)}`, ex());
        };
        visit(0);
      }
      fr(-1, `✅ ${({ pre: 'Pre-order', in: 'In-order', post: 'Post-order', level: 'Level-order' })[kind]}: ${out.join(', ')}`);
      return F;
    };
  }
  const TREE = '4 2 6 1 3 5 7';
  def('tree-inorder', 'In-order (left, node, right)', 'Tree in level order (null for gaps)', TREE, ['inorder(node):', '  if node is null: return', '  inorder(node.left)', '  visit(node)', '  inorder(node.right)'], traversal('in', { enter: 0, left: 2, visit: 3, right: 4, ret: 1 }), () => '8 4 12 2 6 10 14');
  def('tree-preorder', 'Pre-order (node, left, right)', 'Tree in level order (null for gaps)', TREE, ['preorder(node):', '  visit(node)', '  preorder(node.left)', '  preorder(node.right)', '  return'], traversal('pre', { enter: 0, visit: 1, left: 2, right: 3, ret: 4 }), () => '1 2 3 4 5 null 6');
  def('tree-postorder', 'Post-order (left, right, node)', 'Tree in level order (null for gaps)', TREE, ['postorder(node):', '  postorder(node.left)', '  postorder(node.right)', '  visit(node)', '  return'], traversal('post', { enter: 0, left: 1, right: 2, visit: 3, ret: 4 }), () => '1 2 3 4 5 null 6');
  def('tree-levelorder', 'Level-order (BFS)', 'Tree in level order (null for gaps)', '3 9 20 null null 15 7', ['queue = [root]', 'while queue:', '  node = dequeue(); visit(node)', '  enqueue(node.left, node.right)'], traversal('level', {}), () => '1 2 3 4 5 6 7');
  V['tree-traversal'] = V['tree-inorder'];
  def('bst', 'Binary Search Tree: insert & search', 'Insert values ; search for', '8 3 10 1 6 14 4 7 13 ; 7', ['insert(x): start at root', '  go left if x < node, right if x > node', '  attach x at the empty spot', 'search(t): same walk; stop when equal'],
    s => {
      const [x, y] = parts(s), vals = arrIn(x, 15), t = nums(y)[0], F = [];
      const arr = []; const ns = {};
      const put = (v) => { let i = 0, path = []; while (arr[i] !== undefined && arr[i] !== null) { path.push(i); i = v < arr[i] ? 2 * i + 1 : 2 * i + 2; if (i > 62) return null; } arr[i] = v; return { i, path }; };
      const fr = (line, msg) => { const a = []; const maxI = arr.length; for (let i = 0; i < maxI; i++) a.push(arr[i] === undefined ? null : arr[i]); while (a.length && a[a.length - 1] === null) a.pop(); F.push(clone({ line, msg, panels: [{ t: 'tree', name: 'BST', arr: a, ns, heap: 1 }] })); };
      for (const v of vals) {
        const r = put(v); if (!r) continue;
        Object.keys(ns).forEach(k => delete ns[k]); r.path.forEach(p => ns[p] = 'q'); ns[r.i] = 'cur';
        fr(r.path.length ? 2 : 0, r.path.length ? `Insert ${v}: ${r.path.map(p => `${v} ${v < arr[p] ? '<' : '>'} ${arr[p]} → go ${v < arr[p] ? 'left' : 'right'}`).join(', ')}` : `Insert ${v} as the root`);
      }
      Object.keys(ns).forEach(k => delete ns[k]);
      if (t !== undefined) {
        let i = 0, steps = 0;
        while (arr[i] !== undefined && arr[i] !== null) {
          steps++; ns[i] = 'cur';
          if (arr[i] === t) { ns[i] = 'done'; fr(3, `✅ Found ${t} in ${steps} comparison(s): each step discards a whole subtree`); return F; }
          fr(3, `${t} ${t < arr[i] ? '<' : '>'} ${arr[i]}: go ${t < arr[i] ? 'left' : 'right'}`); ns[i] = 'q';
          i = t < arr[i] ? 2 * i + 1 : 2 * i + 2;
        }
        fr(3, `${t} is not in the tree`);
      }
      return F;
    }, () => [...new Set(rnd(8, 1, 40))].join(' ') + ' ; 20');
  def('heap', 'Min-Heap: push & pop', 'Push values ; pops', '5 3 8 1 9 2 ; 2', ['push(x): append at the end', '  while x < parent: swap up', 'pop(): take root, move last to root', '  while bigger than a child: swap down with the smaller child'],
    s => {
      const [x, y] = parts(s), vals = arrIn(x, 12), pops = Math.min(nums(y)[0] ?? 2, vals.length), h = [], F = [], out = [];
      const fr = (line, msg, ns = {}) => { const ha = {}; Object.entries(ns).forEach(([k, c]) => ha[k] = c); F.push(clone({ line, msg, panels: [{ t: 'tree', name: 'Heap as a tree (parent ≤ children)', arr: h.slice(), ns, heap: 1 }, { t: 'arr', name: 'Same heap as an array: children of i are 2i+1 and 2i+2', items: h, hl: ha }, { t: 'chips', name: 'Popped (in order)', items: out }] })); };
      for (const v of vals) {
        h.push(v); let i = h.length - 1; fr(0, `Push ${v} at the end (index ${i})`, { [i]: 'act' });
        while (i > 0 && h[(i - 1) >> 1] > h[i]) { const p = (i - 1) >> 1; [h[p], h[i]] = [h[i], h[p]]; fr(1, `${h[p]} < parent ${h[i]}: swap up`, { [p]: 'swap', [i]: 'swap' }); i = p; }
      }
      fr(-1, `The minimum, ${h[0]}, is always at the root.`, { 0: 'done' });
      for (let k = 0; k < pops; k++) {
        out.push(h[0]); const last = h.pop();
        if (!h.length) { fr(2, `Pop ${out[out.length - 1]}; the heap is now empty`); break; }
        h[0] = last; let i = 0; fr(2, `Pop the root ${out[out.length - 1]}; move the last element ${last} to the root`, { 0: 'act' });
        while (true) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < h.length && h[l] < h[m]) m = l; if (r < h.length && h[r] < h[m]) m = r; if (m === i) break; [h[i], h[m]] = [h[m], h[i]]; fr(3, `Swap down with the smaller child ${h[i]}`, { [i]: 'swap', [m]: 'swap' }); i = m; }
        fr(-1, 'Heap order restored.', { 0: 'done' });
      }
      return F;
    }, () => rnd(7, 1, 40).join(' ') + ' ; 2');

  // ======================= Graphs =======================
  const parseEdges = (s, weighted, directed) => {
    const E = [];
    String(s).split(/[\s,]+/).filter(Boolean).forEach(tok => {
      const m = /^(\d+)\s*(->|>|-)\s*(\d+)(?::(-?\d+))?$/.exec(tok); if (!m) return;
      E.push({ a: +m[1], b: +m[3], w: weighted ? +(m[4] ?? 1) : undefined, dir: directed });
    });
    if (!E.length) throw new Error('Write edges like 0-1 1-2');
    return E;
  };
  function layout(n, E, start = 0) { // layered by BFS depth (undirected), so BFS looks like rings
    const adj = Array.from({ length: n }, () => []); E.forEach(e => { adj[e.a].push(e.b); adj[e.b].push(e.a); });
    const d = Array(n).fill(-1), order = []; let layer = 0;
    const roots = [start, ...Array.from({ length: n }, (_, i) => i)];
    for (const r of roots) { if (d[r] !== -1) continue; d[r] = r === start ? 0 : layer + 1; const q = [r]; for (let h = 0; h < q.length; h++) { const u = q[h]; order.push(u); layer = Math.max(layer, d[u]); adj[u].forEach(v => { if (d[v] === -1) { d[v] = d[u] + 1; q.push(v); } }); } }
    const by = {}; order.forEach(u => (by[d[u]] = by[d[u]] || []).push(u));
    const L = Object.keys(by).length, nodes = [];
    Object.entries(by).forEach(([lv, us], li) => us.forEach((u, k) => nodes.push({ id: u, x: L === 1 ? 50 : 8 + li * (84 / (L - 1)), y: us.length === 1 ? 30 : 7 + k * (44 / (us.length - 1)) })));
    return nodes;
  }
  const nOf = E => Math.max(...E.flatMap(e => [e.a, e.b])) + 1;
  def('bfs', 'Breadth-First Search', 'Edges ; start', '0-1 0-2 1-3 1-4 2-5 4-6 5-6 ; 0', ['queue = [start]; seen = {start}', 'while queue:', '  u = dequeue(); visit(u)', '  for v in neighbours(u):', '    if v not in seen: seen.add(v); enqueue(v)'],
    s => {
      const [x, y] = parts(s), E = parseEdges(x), n = nOf(E); if (n > 12) throw new Error('Use at most 12 nodes');
      const st = Math.min(n - 1, nums(y)[0] ?? 0), nodes = layout(n, E, st), adj = Array.from({ length: n }, () => []);
      E.forEach(e => { adj[e.a].push(e.b); adj[e.b].push(e.a); }); adj.forEach(a => a.sort((p, q) => p - q));
      const ns = {}, es = {}, dist = {}, F = [], order = [];
      const fr = (line, msg, q) => F.push(clone({ line, msg, panels: [{ t: 'graph', name: 'Graph (number below a node = distance from start)', nodes, edges: E, ns, es, sub: dist }, { t: 'stack', h: 1, name: 'Queue (front first)', items: q }, { t: 'chips', name: 'Visit order', items: order }] }));
      const q = [st]; ns[st] = 'q'; dist[st] = 0; fr(0, `Start at ${st}. BFS explores in rings: all nodes at distance 1, then 2, …`, q.slice());
      while (q.length) {
        const u = q.shift(); ns[u] = 'cur'; order.push(u); fr(2, `Dequeue ${u} and visit it`, q.slice());
        for (const v of adj[u]) {
          if (dist[v] === undefined) { dist[v] = dist[u] + 1; ns[v] = 'q'; es[u + ',' + v] = 'on'; q.push(v); fr(4, `${v} is new: distance ${dist[v]}, enqueue`, q.slice()); }
        }
        ns[u] = 'done';
      }
      fr(-1, `✅ BFS order: ${order.join(' → ')}. The blue edges form the shortest-path tree for unweighted graphs.`, []);
      return F;
    }, () => '0-1 0-2 1-3 2-3 3-4 2-5 5-6 ; 0');
  def('dfs', 'Depth-First Search', 'Edges ; start', '0-1 0-2 1-3 1-4 2-5 4-6 5-6 ; 0', ['dfs(u):', '  seen.add(u); visit(u)', '  for v in neighbours(u):', '    if v not in seen: dfs(v)', '  return  # backtrack'],
    s => {
      const [x, y] = parts(s), E = parseEdges(x), n = nOf(E); if (n > 12) throw new Error('Use at most 12 nodes');
      const st = Math.min(n - 1, nums(y)[0] ?? 0), nodes = layout(n, E, st), adj = Array.from({ length: n }, () => []);
      E.forEach(e => { adj[e.a].push(e.b); adj[e.b].push(e.a); }); adj.forEach(a => a.sort((p, q) => p - q));
      const ns = {}, es = {}, F = [], order = [], stack = [], seen = new Set();
      const fr = (line, msg) => F.push(clone({ line, msg, panels: [{ t: 'graph', name: 'Graph', nodes, edges: E, ns, es }, { t: 'stack', name: 'Call stack (top first)', items: [...stack].reverse() }, { t: 'chips', name: 'Visit order', items: order }] }));
      const dfs = u => {
        seen.add(u); stack.push(u); ns[u] = 'cur'; order.push(u); fr(1, `Visit ${u}: go as deep as possible before backtracking`);
        for (const v of adj[u]) if (!seen.has(v)) { es[u + ',' + v] = 'on'; ns[u] = 'q'; fr(3, `${v} is unvisited: recurse into it`); dfs(v); ns[u] = 'cur'; fr(2, `Back at ${u}`); }
        ns[u] = 'done'; stack.pop(); fr(4, `${u} has no unvisited neighbours: backtrack`);
      };
      dfs(st);
      fr(-1, `✅ DFS order: ${order.join(' → ')}`);
      return F;
    }, () => '0-1 0-2 1-3 2-3 3-4 2-5 5-6 ; 0');
  def('dijkstra', "Dijkstra's Shortest Paths", 'Directed weighted edges u>v:w ; source', '0>1:4 0>2:1 2>1:2 1>3:1 2>3:5 3>4:3 ; 0', ['dist[src] = 0; heap = [(0, src)]', 'while heap:', '  d, u = pop smallest', '  if u is finalised: skip', '  finalise u', '  for (v, w) in edges(u): push (d + w, v)'],
    s => {
      const [x, y] = parts(s), E = parseEdges(x, true, true), n = nOf(E); if (n > 10) throw new Error('Use at most 10 nodes');
      const src = Math.min(n - 1, nums(y)[0] ?? 0), nodes = layout(n, E, src), adj = Array.from({ length: n }, () => []);
      E.forEach(e => adj[e.a].push(e)); const dist = {}, best = {}, ns = {}, es = {}, F = [], heap = [[0, src]];
      for (let i = 0; i < n; i++) best[i] = '∞'; best[src] = 0;
      const fr = (line, msg) => F.push(clone({ line, msg, panels: [{ t: 'graph', name: 'Graph (number below a node = best known distance)', nodes, edges: E, ns, es, sub: best }, { t: 'chips', name: 'Min-heap (distance, node)', items: heap.slice().sort((a, b) => a[0] - b[0]).map(h => `(${h[0]}, ${h[1]})`) }] }));
      fr(0, `Start at ${src} with distance 0. Everything else is ∞.`);
      while (heap.length) {
        heap.sort((a, b) => a[0] - b[0]); const [d, u] = heap.shift();
        if (dist[u] !== undefined) { fr(3, `(${d}, ${u}) is stale: ${u} was already finalised at ${dist[u]}`); continue; }
        dist[u] = d; ns[u] = 'done'; fr(4, `Pop (${d}, ${u}): the smallest distance in the heap is final. With non-negative weights nothing can beat it.`);
        for (const e of adj[u]) {
          if (dist[e.b] !== undefined) continue;
          const nd = d + e.w;
          if (best[e.b] === '∞' || nd < best[e.b]) { best[e.b] = nd; heap.push([nd, e.b]); es[e.a + ',' + e.b] = 'on'; ns[e.b] = 'q'; fr(5, `Relax ${u}→${e.b}: ${d} + ${e.w} = ${nd} is better, so push (${nd}, ${e.b})`); }
          else fr(5, `${u}→${e.b}: ${d} + ${e.w} = ${nd} is not better than ${best[e.b]}`);
        }
      }
      fr(-1, `✅ Shortest distances from ${src}: ${Object.entries(best).map(([k, v]) => `${k}: ${v}`).join(', ')}`);
      return F;
    }, () => '0>1:' + (2 + Math.floor(Math.random() * 6)) + ' 0>2:1 2>1:2 1>3:1 2>3:' + (3 + Math.floor(Math.random() * 4)) + ' 3>4:2 ; 0');
  def('topo-sort', "Topological Sort (Kahn's algorithm)", 'Directed edges u>v (u before v)', '0>1 0>2 1>3 2>3 3>4 5>4', ['indeg[v] = number of incoming edges', 'queue = nodes with indeg 0', 'while queue:', '  u = dequeue(); order.append(u)', '  for v in out(u): indeg[v]--', '    if indeg[v] == 0: enqueue(v)', 'if len(order) < n: there is a cycle'],
    s => {
      const E = parseEdges(s, false, true), n = nOf(E); if (n > 12) throw new Error('Use at most 12 nodes');
      const nodes = layout(n, E, 0), out = Array.from({ length: n }, () => []), indeg = Array(n).fill(0), ns = {}, es = {}, F = [], order = [];
      E.forEach(e => { out[e.a].push(e.b); indeg[e.b]++; });
      const fr = (line, msg, q) => F.push(clone({ line, msg, panels: [{ t: 'graph', name: 'Graph (number below a node = remaining in-degree)', nodes, edges: E, ns, es, sub: Object.fromEntries(indeg.map((d, i) => [i, d])) }, { t: 'stack', h: 1, name: 'Ready queue (in-degree 0)', items: q }, { t: 'chips', name: 'Topological order', items: order }] }));
      const q = []; indeg.forEach((d, i) => { if (!d) { q.push(i); ns[i] = 'q'; } });
      fr(1, 'Nodes with no prerequisites can go first.', q.slice());
      while (q.length) {
        const u = q.shift(); order.push(u); ns[u] = 'done'; fr(3, `Take ${u}`, q.slice());
        for (const v of out[u]) { indeg[v]--; es[u + ',' + v] = 'on'; if (!indeg[v]) { q.push(v); ns[v] = 'q'; fr(5, `${v} has no remaining prerequisites: ready`, q.slice()); } else fr(4, `${v} still waits for ${indeg[v]} more`, q.slice()); }
      }
      fr(6, order.length === n ? `✅ Valid order: ${order.join(' → ')}` : `⚠️ Only ${order.length} of ${n} nodes were ordered: the rest form a cycle`, []);
      return F;
    }, () => '0>2 1>2 2>3 1>4 4>3 3>5');
  def('union-find', 'Union-Find (Disjoint Set Union)', 'Edges to union', '0-1 2-3 1-2 4-5 6-7 5-6 3-7', ['parent[i] = i  # every node alone', 'union(a, b):', '  ra, rb = find(a), find(b)', '  if ra == rb: already connected (cycle!)', '  parent[ra] = rb', 'find(x): follow parents to the root'],
    s => {
      const E = parseEdges(s), n = nOf(E); if (n > 12) throw new Error('Use at most 12 nodes');
      const parent = Array.from({ length: n }, (_, i) => i), F = [], es = {};
      const nodes = Array.from({ length: n }, (_, i) => ({ id: i, x: 50 + 40 * Math.cos(2 * Math.PI * i / n - Math.PI / 2), y: 32 + 26 * Math.sin(2 * Math.PI * i / n - Math.PI / 2) }));
      const find = x => { while (parent[x] !== x) x = parent[x]; return x; };
      const fr = (line, msg, hl = {}) => { const roots = [...new Set(parent.map((_, i) => find(i)))], ns = {}; parent.forEach((_, i) => ns[i] = 'g' + (roots.indexOf(find(i)) % 8)); F.push(clone({ line, msg, vars: { groups: roots.length }, panels: [{ t: 'graph', name: 'Nodes coloured by group (thick = union done)', nodes, edges: E, ns, es }, { t: 'arr', name: 'parent[]', items: parent, hl }] })); };
      fr(0, `${n} nodes, ${n} separate groups.`);
      E.forEach(e => {
        const ra = find(e.a), rb = find(e.b);
        if (ra === rb) { es[e.a + ',' + e.b] = 'bad'; fr(3, `${e.a} and ${e.b} already share root ${ra}: this edge would form a cycle`, { [e.a]: 'swap', [e.b]: 'swap' }); return; }
        parent[ra] = rb; es[e.a + ',' + e.b] = 'on'; fr(4, `find(${e.a}) = ${ra}, find(${e.b}) = ${rb}: set parent[${ra}] = ${rb}`, { [ra]: 'act' });
      });
      fr(-1, '✅ Done. Path compression and union by rank make each operation almost O(1).');
      return F;
    }, () => '0-1 2-3 1-2 4-5 3-0 5-6');
  def('grid-bfs', 'Grid Flood Fill (Number of Islands)', 'Rows of 1/0 separated by spaces', '11000 11010 00100 00011', ['for each cell:', '  if land and not visited:', '    islands += 1', '    BFS from it, marking all connected land', 'return islands'],
    s => {
      const rows = String(s).split(/[\s,;]+/).filter(Boolean).map(r => [...r].map(c => c === '1' ? 1 : 0));
      if (!rows.length || rows.length > 9 || rows.some(r => r.length !== rows[0].length || r.length > 12)) throw new Error('Give up to 9 equal-length rows of 1s and 0s');
      const m = rows.length, n = rows[0].length, id = rows.map(r => r.map(() => 0)), F = []; let count = 0;
      const fr = (line, msg, cur = [], q = []) => { const hl = {}; for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) { if (id[r][c]) hl[r + ',' + c] = 'g' + ((id[r][c] - 1) % 8); else if (rows[r][c]) hl[r + ',' + c] = 'land'; } q.forEach(([r, c]) => hl[r + ',' + c] = 'q'); cur.forEach(([r, c]) => hl[r + ',' + c] = 'cur'); F.push(clone({ line, msg, vars: { islands: count }, panels: [{ t: 'grid', name: 'Grid (1 = land)', rows: rows.map((r, ri) => r.map((v, ci) => id[ri][ci] ? '#' + id[ri][ci] : v)), hl }] })); };
      fr(0, 'Scan every cell. Unvisited land starts a new island.');
      for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) {
        if (!rows[r][c] || id[r][c]) continue;
        count++; id[r][c] = count; const q = [[r, c]]; fr(2, `New island #${count} at (${r}, ${c})`, [[r, c]]);
        while (q.length) {
          const [a, b] = q.shift();
          for (const [x, y] of [[a + 1, b], [a - 1, b], [a, b + 1], [a, b - 1]]) if (x >= 0 && y >= 0 && x < m && y < n && rows[x][y] && !id[x][y]) { id[x][y] = count; q.push([x, y]); }
          fr(3, `Expand from (${a}, ${b}) to its land neighbours`, [[a, b]], q.slice());
        }
      }
      fr(4, `✅ ${count} island(s)`);
      return F;
    }, () => Array.from({ length: 5 }, () => Array.from({ length: 6 }, () => Math.random() < 0.45 ? 1 : 0).join('')).join(' '));

  // ======================= Backtracking =======================
  def('subsets', 'Backtracking: Subsets', 'Distinct numbers (up to 4)', '1 2 3', ['backtrack(start):', '  record(path)', '  for i = start .. n-1:', '    path.push(nums[i])   # choose', '    backtrack(i + 1)     # explore', '    path.pop()           # un-choose'],
    s => {
      const a = arrIn(s, 4), F = [], path = [], res = [];
      const fr = (line, msg, i) => F.push(clone({ line, msg, panels: [{ t: 'arr', name: 'nums', items: a, hl: i !== undefined ? { [i]: 'act' } : {} }, { t: 'stack', h: 1, name: 'Current path', items: path }, { t: 'chips', name: `Subsets found (${res.length})`, items: res.map(r => '[' + r.join(',') + ']') }] }));
      const bt = start => {
        res.push(path.slice()); fr(1, `Record [${path.join(', ')}]`);
        for (let i = start; i < a.length; i++) {
          path.push(a[i]); fr(3, `Choose ${a[i]}`, i);
          bt(i + 1);
          path.pop(); fr(5, `Un-choose ${a[i]} and try the next option`, i);
        }
      };
      bt(0);
      fr(-1, `✅ ${res.length} = 2^${a.length} subsets. Choose → explore → un-choose is the template for every backtracking problem.`);
      return F;
    }, () => [...new Set(rnd(3, 1, 9))].join(' '));
  def('n-queens', 'Backtracking: N-Queens', 'Board size n (4–6)', '4', ['place(row):', '  if row == n: record solution', '  for col in 0..n-1:', '    if safe(row, col):', '      put queen; place(row + 1)', '      remove queen   # backtrack'],
    s => {
      const n = Math.max(4, Math.min(6, nums(s)[0] || 4)), F = [], cols = []; let sols = 0, steps = 0;
      const fr = (line, msg, try_ = null, bad = false) => {
        const rows = Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => cols[r] === c ? '♛' : '')), hl = {};
        cols.forEach((c, r) => { for (let k = 0; k < n; k++) { hl[r + ',' + k] = hl[r + ',' + k] || 'att'; hl[k + ',' + c] = hl[k + ',' + c] || 'att'; const d = k - r; if (c + d >= 0 && c + d < n) hl[k + ',' + (c + d)] = hl[k + ',' + (c + d)] || 'att'; if (c - d >= 0 && c - d < n) hl[k + ',' + (c - d)] = hl[k + ',' + (c - d)] || 'att'; } });
        cols.forEach((c, r) => hl[r + ',' + c] = 'done');
        if (try_) { hl[try_[0] + ',' + try_[1]] = bad ? 'bad' : 'cur'; if (!bad) rows[try_[0]][try_[1]] = '♛'; }
        F.push(clone({ line, msg, vars: { row: cols.length, solutions: sols }, panels: [{ t: 'grid', name: `${n}×${n} board (shaded = attacked)`, rows, hl, board: 1 }] }));
      };
      const safe = (r, c) => cols.every((cc, rr) => cc !== c && Math.abs(cc - c) !== r - rr);
      const place = r => {
        if (steps > 160) return;
        if (r === n) { sols++; fr(1, `✅ Solution #${sols} found`); return; }
        for (let c = 0; c < n; c++) {
          steps++;
          if (!safe(r, c)) { fr(3, `(${r}, ${c}) is attacked`, [r, c], true); continue; }
          cols.push(c); fr(4, `Place a queen at (${r}, ${c})`); place(r + 1); cols.pop();
          if (steps > 160) return;
          fr(5, `Remove the queen from (${r}, ${c}) and try the next column`);
        }
      };
      place(0);
      fr(-1, steps > 160 ? `Stopped after ${steps} steps (${sols} solution(s) so far).` : `✅ Finished: ${sols} solution(s) for n = ${n}`);
      return F;
    }, () => String(4 + Math.floor(Math.random() * 2)));

  // ======================= Dynamic programming =======================
  def('house-robber', '1-D DP: House Robber', 'House values', '2 7 9 3 1 5', ['dp[0] = a[0]; dp[1] = max(a[0], a[1])', 'for i = 2 .. n-1:', '  skip = dp[i-1]', '  take = dp[i-2] + a[i]', '  dp[i] = max(skip, take)'],
    s => {
      const a = arrIn(s), n = a.length, dp = Array(n).fill(null), F = [];
      const fr = (line, msg, ha = {}, hd = {}) => F.push(clone({ line, msg, panels: [{ t: 'arr', name: 'House values', items: a, hl: ha }, { t: 'arr', name: 'dp[i] = best loot from houses 0..i', items: dp, hl: hd }] }));
      dp[0] = a[0]; fr(0, `dp[0] = ${a[0]}: only one house`, { 0: 'act' }, { 0: 'done' });
      if (n > 1) { dp[1] = Math.max(a[0], a[1]); fr(0, `dp[1] = max(${a[0]}, ${a[1]}) = ${dp[1]}`, { 1: 'act' }, { 1: 'done' }); }
      for (let i = 2; i < n; i++) {
        const skip = dp[i - 1], take = dp[i - 2] + a[i];
        fr(3, `House ${i}: skip it (${skip}) or take it (dp[${i - 2}] + ${a[i]} = ${take})?`, { [i]: 'act' }, { [i - 1]: 'cmp', [i - 2]: 'cmp' });
        dp[i] = Math.max(skip, take); fr(4, `dp[${i}] = <b>${dp[i]}</b> (${take > skip ? 'take' : 'skip'})`, { [i]: 'act' }, { [i]: 'done' });
      }
      fr(-1, `✅ Answer: dp[${n - 1}] = <b>${dp[n - 1]}</b>. Each value depends only on the previous two, so two variables are enough: O(1) space.`, {}, { [n - 1]: 'done' });
      return F;
    }, () => rnd(7, 1, 15).join(' '));
  def('coin-change', '1-D DP: Coin Change', 'Coins ; amount', '1 3 4 ; 6', ['dp[0] = 0; dp[a] = ∞', 'for a = 1 .. amount:', '  for c in coins:', '    if c <= a: dp[a] = min(dp[a], dp[a-c] + 1)', 'return dp[amount] or -1'],
    s => {
      const [x, y] = parts(s), coins = arrIn(x, 6).filter(c => c > 0), amt = Math.max(1, Math.min(20, nums(y)[0] || 6)), dp = [0, ...Array(amt).fill(Infinity)], F = [];
      const show = v => v === Infinity ? '∞' : v;
      const fr = (line, msg, hd = {}) => F.push(clone({ line, msg, panels: [{ t: 'chips', name: 'Coins', items: coins }, { t: 'arr', name: 'dp[a] = fewest coins to make amount a', items: dp.map(show), hl: hd }] }));
      fr(0, 'dp[0] = 0. Greedy can fail (with coins 1, 3, 4 and amount 6, greedy picks 4+1+1 but 3+3 is better), so try every coin.');
      for (let a = 1; a <= amt; a++) {
        for (const c of coins) if (c <= a) { const cand = dp[a - c] + 1; const better = cand < dp[a]; if (better) dp[a] = cand; fr(3, `a = ${a}, coin ${c}: dp[${a - c}] + 1 = ${show(cand)}${better ? ' → new best' : ''}`, { [a]: 'act', [a - c]: 'cmp' }); }
        fr(3, `dp[${a}] = <b>${show(dp[a])}</b>`, { [a]: 'done' });
      }
      fr(4, `✅ Fewest coins for ${amt}: <b>${dp[amt] === Infinity ? -1 : dp[amt]}</b>`, { [amt]: 'done' });
      return F;
    }, () => '1 ' + (2 + Math.floor(Math.random() * 3)) + ' ' + (5 + Math.floor(Math.random() * 3)) + ' ; ' + (8 + Math.floor(Math.random() * 6)));
  function grid2(title, label, input, code, setup) { // generic 2-D DP table visualizer
    return [title, label, input, code, s => {
      const S = setup(s), F = [], T = S.T;
      const fr = (line, msg, hl = {}) => F.push(clone({ line, msg, vars: S.vars && S.vars(), panels: [{ t: 'grid', name: S.name, rows: T.map(r => r.map(v => v === null ? '' : v)), rh: S.rh, ch: S.ch, corner: S.corner, hl }] }));
      fr(-1, S.intro);
      S.fill(fr);
      return F;
    }];
  }
  def('lcs', ...grid2('2-D DP: Longest Common Subsequence', 'text1 ; text2', 'ABCBDAB ; BDCABA', ['dp[i][j] = LCS of first i chars and first j chars', 'if a[i-1] == b[j-1]:', '  dp[i][j] = dp[i-1][j-1] + 1   # diagonal', 'else:', '  dp[i][j] = max(dp[i-1][j], dp[i][j-1])'],
    s => {
      const [x, y] = parts(s), A = [...(x || 'ABCBDAB')].slice(0, 9), B = [...(y || 'BDCABA')].slice(0, 9), m = A.length, n = B.length;
      const T = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => i === 0 || j === 0 ? 0 : null));
      return { T, name: 'dp table', rh: ['∅', ...A], ch: ['∅', ...B], intro: 'Row 0 and column 0 are empty prefixes: LCS 0.', fill: fr => {
        for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
          if (A[i - 1] === B[j - 1]) { T[i][j] = T[i - 1][j - 1] + 1; fr(2, `${A[i - 1]} = ${B[j - 1]}: take the diagonal + 1 = ${T[i][j]}`, { [i + ',' + j]: 'done', [(i - 1) + ',' + (j - 1)]: 'cmp' }); }
          else { T[i][j] = Math.max(T[i - 1][j], T[i][j - 1]); fr(4, `${A[i - 1]} ≠ ${B[j - 1]}: max(up ${T[i - 1][j]}, left ${T[i][j - 1]}) = ${T[i][j]}`, { [i + ',' + j]: 'act', [(i - 1) + ',' + j]: 'cmp', [i + ',' + (j - 1)]: 'cmp' }); }
        }
        let i = m, j = n; const out = [], hl = {};
        while (i > 0 && j > 0) { if (A[i - 1] === B[j - 1]) { out.unshift(A[i - 1]); hl[i + ',' + j] = 'done'; i--; j--; } else if (T[i - 1][j] >= T[i][j - 1]) { hl[i + ',' + j] = 'win'; i--; } else { hl[i + ',' + j] = 'win'; j--; } }
        fr(-1, `✅ LCS length ${T[m][n]}: “${out.join('')}” (traced back along the green cells)`, hl);
      } };
    }), () => ['ABCBDAB ; BDCABA', 'AGGTAB ; GXTXAYB', 'abcde ; ace', 'kitten ; sitting'][Math.floor(Math.random() * 4)]);
  def('edit-distance', ...grid2('2-D DP: Edit Distance', 'word1 ; word2', 'horse ; ros', ['dp[i][0] = i; dp[0][j] = j', 'if a[i-1] == b[j-1]: dp[i][j] = dp[i-1][j-1]', 'else dp[i][j] = 1 + min(', '   dp[i-1][j],     # delete', '   dp[i][j-1],     # insert', '   dp[i-1][j-1])   # replace'],
    s => {
      const [x, y] = parts(s), A = [...(x || 'horse')].slice(0, 9), B = [...(y || 'ros')].slice(0, 9), m = A.length, n = B.length;
      const T = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : null));
      return { T, name: 'dp[i][j] = edits to turn word1[:i] into word2[:j]', rh: ['∅', ...A], ch: ['∅', ...B], intro: 'First row: insert j characters. First column: delete i characters.', fill: fr => {
        for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
          if (A[i - 1] === B[j - 1]) { T[i][j] = T[i - 1][j - 1]; fr(1, `${A[i - 1]} = ${B[j - 1]}: no edit needed, copy the diagonal (${T[i][j]})`, { [i + ',' + j]: 'done', [(i - 1) + ',' + (j - 1)]: 'cmp' }); }
          else { T[i][j] = 1 + Math.min(T[i - 1][j], T[i][j - 1], T[i - 1][j - 1]); fr(2, `${A[i - 1]} ≠ ${B[j - 1]}: 1 + min(delete ${T[i - 1][j]}, insert ${T[i][j - 1]}, replace ${T[i - 1][j - 1]}) = ${T[i][j]}`, { [i + ',' + j]: 'act', [(i - 1) + ',' + j]: 'cmp', [i + ',' + (j - 1)]: 'cmp', [(i - 1) + ',' + (j - 1)]: 'cmp' }); }
        }
        fr(-1, `✅ Edit distance = <b>${T[m][n]}</b>`, { [m + ',' + n]: 'done' });
      } };
    }), () => ['horse ; ros', 'kitten ; sitting', 'sunday ; saturday', 'intent ; execute'][Math.floor(Math.random() * 4)]);
  def('unique-paths', ...grid2('2-D DP: Grid Paths', 'rows cols', '4 5', ['dp[0][*] = dp[*][0] = 1', 'for each other cell (r, c):', '  dp[r][c] = dp[r-1][c] + dp[r][c-1]   # from above + from left'],
    s => {
      const [m0, n0] = nums(s), m = Math.max(1, Math.min(7, m0 || 4)), n = Math.max(1, Math.min(8, n0 || 5));
      const T = Array.from({ length: m }, (_, r) => Array.from({ length: n }, (_, c) => r === 0 || c === 0 ? 1 : null));
      return { T, name: 'dp[r][c] = number of right/down paths from the top-left to (r, c)', intro: 'The first row and the first column can only be reached one way.', fill: fr => {
        for (let r = 1; r < m; r++) for (let c = 1; c < n; c++) { T[r][c] = T[r - 1][c] + T[r][c - 1]; fr(2, `dp[${r}][${c}] = ${T[r - 1][c]} (above) + ${T[r][c - 1]} (left) = <b>${T[r][c]}</b>`, { [r + ',' + c]: 'act', [(r - 1) + ',' + c]: 'cmp', [r + ',' + (c - 1)]: 'cmp' }); }
        fr(-1, `✅ ${T[m - 1][n - 1]} paths to the bottom-right corner`, { [(m - 1) + ',' + (n - 1)]: 'done' });
      } };
    }), () => (3 + Math.floor(Math.random() * 3)) + ' ' + (3 + Math.floor(Math.random() * 4)));
  def('knapsack', '2-D DP: 0/1 Knapsack', 'weights ; values ; capacity', '1 3 4 5 ; 1 4 5 7 ; 7', ['dp[i][c] = best value using the first i items, capacity c', 'skip = dp[i-1][c]', 'if w[i] <= c: take = dp[i-1][c - w[i]] + v[i]', 'dp[i][c] = max(skip, take)'],
    s => {
      const [a, b, c] = parts(s), W = arrIn(a, 5), Vv = nums(b).slice(0, W.length), cap = Math.max(1, Math.min(10, nums(c)[0] || 7));
      while (Vv.length < W.length) Vv.push(1);
      const F = [], T = Array.from({ length: W.length + 1 }, (_, i) => Array.from({ length: cap + 1 }, () => i === 0 ? 0 : null));
      const rh = ['none', ...W.map((w, i) => `w${w} v${Vv[i]}`)], ch = Array.from({ length: cap + 1 }, (_, i) => i);
      const fr = (line, msg, hl = {}) => F.push(clone({ line, msg, panels: [{ t: 'grid', name: 'dp[i][c] (rows = items considered, columns = capacity)', rows: T.map(r => r.map(v => v === null ? '' : v)), rh, ch, corner: 'item \\ cap', hl }] }));
      fr(0, 'With no items, every capacity is worth 0.');
      for (let i = 1; i <= W.length; i++) for (let cc = 0; cc <= cap; cc++) {
        const skip = T[i - 1][cc], w = W[i - 1], v = Vv[i - 1];
        if (w <= cc) { const take = T[i - 1][cc - w] + v; T[i][cc] = Math.max(skip, take); fr(3, `Item ${i} (w ${w}, v ${v}), cap ${cc}: skip = ${skip}, take = dp[${i - 1}][${cc - w}] + ${v} = ${take}, so ${T[i][cc]}`, { [i + ',' + cc]: 'act', [(i - 1) + ',' + cc]: 'cmp', [(i - 1) + ',' + (cc - w)]: 'mid' }); }
        else { T[i][cc] = skip; fr(1, `Item ${i} (w ${w}) does not fit in capacity ${cc}: copy ${skip} from above`, { [i + ',' + cc]: 'act', [(i - 1) + ',' + cc]: 'cmp' }); }
      }
      fr(-1, `✅ Best value with capacity ${cap}: <b>${T[W.length][cap]}</b>`, { [W.length + ',' + cap]: 'done' });
      return F;
    }, () => '2 3 4 5 ; 3 4 5 6 ; 8');

  // -------------------------------------------------- boot
  window.L24VIZ = { V, mount };
  const boot = () => document.querySelectorAll('.viz[data-viz]').forEach(el => { if (!el.classList.contains('vz')) mount(el); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
