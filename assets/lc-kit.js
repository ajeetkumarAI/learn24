/* Learn24 LangChain Hands-on kit: interactive demos for the LangChain course.
   nb (notebook player), chat (animated message flow with choices), split (chunking playground),
   tmpl (prompt template filler), parse (output parser playground), route (LangGraph conditional edge),
   cache (LLM cache timing). */
(function () {
  const A = window.Article; if (!A) return;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const json = el => { try { return JSON.parse($('script[type="application/json"]', el).textContent); } catch (e) { return {}; } };
  const add = (el, html) => { const d = document.createElement('div'); d.innerHTML = html; el.append(d); return d; };
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const css = `
  .lck-bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:10px}
  .lck-file{font:600 13px var(--mono);color:var(--fg);background:var(--panel2);border:1px solid var(--line);border-radius:8px;padding:6px 10px;word-break:break-all}
  .lck-bar a.btn{text-decoration:none;display:inline-block}
  .lck-dots{display:flex;flex-wrap:wrap;gap:4px;margin:6px 0 12px}
  .lck-dots button{width:16px;height:16px;border-radius:4px;border:1.5px solid var(--line);background:var(--panel2);cursor:pointer;padding:0}
  .lck-dots button.ok{border-color:var(--green)} .lck-dots button.live{border-color:var(--amber)}
  .lck-dots button.done.ok{background:var(--green)} .lck-dots button.done.live{background:var(--amber)}
  .lck-dots button[aria-current="true"]{outline:2px solid var(--ac);outline-offset:1px}
  .lck-cell{border:1px solid var(--line);border-radius:12px;background:var(--bg2);padding:12px 14px}
  .lck-meta{display:flex;justify-content:space-between;gap:8px;font:12px var(--mono);color:var(--dim);margin-bottom:6px;flex-wrap:wrap}
  .lck-md{font-size:15px;color:var(--body)} .lck-md h1,.lck-md h2,.lck-md h3{font-size:17px;margin:4px 0 8px;color:var(--fg)}
  .lck-md table{border-collapse:collapse;font-size:13.5px;margin:8px 0;display:block;overflow-x:auto} .lck-md td,.lck-md th{border:1px solid var(--line);padding:4px 8px;text-align:left}
  .lck-md pre{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:8px 10px;overflow-x:auto;font:12.5px/1.5 var(--mono)}
  .lck-md table{max-width:100%;min-width:0;width:auto} .lck-cell,.lck-chat,.lck-res{min-width:0;overflow-wrap:anywhere} .lck-in{max-width:100%} article li a,.quiz .opt{overflow-wrap:anywhere} .lck-row label{flex-wrap:wrap;max-width:100%} select.lck-in{width:100%}
  .lck-md p{margin:6px 0} .lck-md ul{margin:6px 0;padding-left:20px}
  .lck-md blockquote{margin:6px 0;padding:4px 10px;border-left:3px solid var(--amber);color:var(--muted)}
  .lck-code{position:relative;margin-top:8px}
  .lck-code .lab{font:600 11px var(--mono);color:var(--ac);margin-bottom:3px}
  .lck-code pre{margin:0;background:#0b1220;color:#d6e0f0;border-radius:10px;padding:12px 14px;overflow-x:auto;font:13px/1.55 var(--mono)}
  .lck-code pre .c{color:#7d8aa3} .lck-code pre .s{color:#f2c46b} .lck-code pre .k{color:#7cc4ff}
  .lck-acts{display:flex;gap:8px;margin-top:8px;flex-wrap:wrap}
  .lck-out{margin-top:10px;border:1px dashed var(--line);border-radius:10px;padding:10px 12px;background:var(--panel);font:12.5px/1.5 var(--mono);white-space:pre-wrap;color:var(--fg);max-height:340px;overflow:auto}
  .lck-out .tag{display:block;font:600 11px var(--sans);letter-spacing:.08em;text-transform:uppercase;color:var(--dim);margin-bottom:4px}
  .lck-out.live{border-color:var(--amber);font-family:var(--sans);white-space:normal;color:var(--muted)}
  .lck-out.si{border-color:var(--ac)}
  .lck-nav{display:flex;justify-content:space-between;gap:8px;margin-top:12px;flex-wrap:wrap}
  .lck-spin{display:inline-block;width:12px;height:12px;border:2px solid var(--line);border-top-color:var(--ac);border-radius:50%;animation:lckspin .7s linear infinite;vertical-align:-2px;margin-right:6px}
  @keyframes lckspin{to{transform:rotate(360deg)}}
  .lck-chat{display:flex;flex-direction:column;gap:8px;min-height:60px}
  .lck-msg{max-width:86%;padding:8px 12px;border-radius:12px;font-size:14.5px;line-height:1.45;animation:lckin .35s ease both;border:1px solid var(--line);background:var(--panel2);color:var(--fg)}
  .lck-msg .who{display:block;font:600 10.5px var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--dim);margin-bottom:2px}
  .lck-msg.user{align-self:flex-end;background:color-mix(in srgb,var(--ac) 18%,var(--panel));border-color:var(--ac)}
  .lck-msg.ai{align-self:flex-start}
  .lck-msg.tool{align-self:flex-start;font-family:var(--mono);font-size:13px;border-color:var(--amber);background:color-mix(in srgb,var(--amber) 10%,var(--panel))}
  .lck-msg.call{align-self:flex-start;font-family:var(--mono);font-size:13px;border-style:dashed;border-color:var(--amber)}
  .lck-msg.sys,.lck-msg.mw{align-self:center;max-width:94%;font-size:13px;text-align:center;color:var(--muted);background:transparent;border-style:dashed}
  .lck-msg.mw{border-color:var(--green);color:var(--fg)}
  .lck-msg.bad{border-color:var(--red);background:color-mix(in srgb,var(--red) 10%,var(--panel))}
  @keyframes lckin{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
  .lck-typing{align-self:flex-start;color:var(--dim);font-size:13px}
  .lck-row{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:6px 0}
  .lck-row label{font-size:13.5px;color:var(--muted);display:flex;gap:8px;align-items:center}
  .lck-in{font:14px var(--mono);padding:7px 9px;border-radius:8px;border:1px solid var(--line);background:var(--bg2);color:var(--fg);min-width:0}
  textarea.lck-in{width:100%;min-height:110px;resize:vertical;box-sizing:border-box}
  .lck-chunks{display:flex;flex-direction:column;gap:6px;margin-top:8px}
  .lck-chunk{border:1px solid var(--line);border-left:4px solid var(--c);border-radius:8px;padding:6px 10px;font:13px/1.45 var(--mono);background:var(--panel);white-space:pre-wrap;animation:lckin .3s ease both}
  .lck-chunk b{font:600 11px var(--sans);color:var(--dim);display:block;margin-bottom:2px}
  .lck-chunk mark{background:color-mix(in srgb,var(--amber) 35%,transparent);color:inherit;border-radius:3px}
  .lck-res{margin-top:8px;border-radius:10px;padding:10px 12px;font:13px/1.5 var(--mono);white-space:pre-wrap;background:var(--bg2);border:1px solid var(--line)}
  .lck-res.err{border-color:var(--red);color:var(--red)} .lck-res.good{border-color:var(--green)}
  .lck-g{width:100%;max-width:560px;display:block;margin:6px auto}
  .lck-g rect{fill:var(--panel2);stroke:var(--line);stroke-width:1.5;transition:all .35s} .lck-g text{fill:var(--fg);font:600 13px var(--sans)}
  .lck-g path{stroke:var(--line);stroke-width:2;fill:none;transition:all .35s} .lck-g .on rect{stroke:var(--ac);fill:color-mix(in srgb,var(--ac) 20%,var(--panel))}
  .lck-g path.on{stroke:var(--ac);stroke-width:3;stroke-dasharray:6 5;animation:lckdash 1s linear infinite}
  @keyframes lckdash{to{stroke-dashoffset:-22}}
  .lck-meter{height:12px;border-radius:6px;background:var(--panel2);overflow:hidden;border:1px solid var(--line)} .lck-meter i{display:block;height:100%;width:0;background:var(--ac)}
  .lck-stat{display:flex;gap:14px;flex-wrap:wrap;font-size:13.5px;color:var(--muted);margin-top:8px} .lck-stat b{color:var(--fg)}`;
  const st = document.createElement('style'); st.textContent = css; document.head.append(st);

  // tiny Python highlighter
  const KW = /\b(from|import|def|class|return|for|in|if|else|elif|while|with|as|try|except|print|lambda|None|True|False|await|async|and|or|not|break|is)\b/g;
  function hl(code) {
    return code.split('\n').map(line => {
      let out = '', i = 0, q = null, s = 0;
      for (; i < line.length; i++) {
        const ch = line[i];
        if (!q && ch === '#') { out += plain(line.slice(s, i)) + `<span class="c">${esc(line.slice(i))}</span>`; return out; }
        if (!q && (ch === '"' || ch === "'")) { out += plain(line.slice(s, i)); q = ch; s = i; }
        else if (q && ch === q && line[i - 1] !== '\\') { out += `<span class="s">${esc(line.slice(s, i + 1))}</span>`; q = null; s = i + 1; }
      }
      return out + (q ? `<span class="s">${esc(line.slice(s))}</span>` : plain(line.slice(s)));
    }).join('\n');
    function plain(t) { return esc(t).replace(KW, '<span class="k">$1</span>'); }
  }
  async function copy(btn, text) {
    try { await navigator.clipboard.writeText(text); btn.textContent = 'Copied ✓'; } catch (e) { btn.textContent = 'Select & copy'; }
    setTimeout(() => btn.textContent = 'Copy', 1400);
  }

  // ---------- notebook player ----------
  const LIVE = {
    llm: '🔑 <b>This cell calls the Groq LLM.</b> Run it in Colab with your <code>groq_key</code> to see the model’s answer. LLM answers change a little on every run, so they are not printed here.',
    dep: '🔗 <b>This cell uses the result of an earlier live cell</b> (an LLM call, a download or a website). Run the notebook in Colab to see it.',
    net: '🌐 <b>Needs internet</b> (it downloads a file or calls a website). Run it in Colab.',
    download: '⬇️ <b>Downloads the free MiniLM embedding model</b> (about 90 MB) the first time. Run it in Colab.',
    shell: '📦 <b>Colab shell command</b> (installs packages or downloads files). In Colab, run it once at the top of the notebook.',
    input: '⌨️ <b>Waits for you to type.</b> Run it in Colab and type <code>exit</code> to stop.',
    image: '🖼️ <b>Draws a picture</b> of the graph in Colab.'
  };
  A.demo('nb', el => {
    const d = json(el), steps = d.steps || [];
    const isLive = s => !['ok', 'standin'].includes(s.st);
    add(el, `<div class="lck-bar"><span class="lck-file">📓 ${esc(d.file)}</span>
      <a class="btn" href="${esc(d.dl)}" download>⬇ Download notebook</a>
      <a class="btn ghost" href="${esc(d.colab)}" target="_blank" rel="noopener">Open in Colab ↗</a></div>
      <p class="note-s" style="margin:0">Step through Ajeetkumar’s notebook cell by cell. Press <b>▶ Run</b> to see the real output from running this exact code. Cells that need your Groq key or internet are marked, so you know what to expect in Colab. Dots: <span style="color:var(--green)">■</span> runs here, <span style="color:var(--amber)">■</span> run in Colab.</p>
      <div class="lck-dots" role="tablist" aria-label="Notebook cells"></div><div class="lck-cell" aria-live="polite"></div>
      <div class="lck-nav"><button class="btn ghost" type="button" data-p>◀ Previous</button><span class="note-s" data-n style="margin:0;align-self:center"></span><button class="btn" type="button" data-x>Next cell ▶</button></div>`);
    const dots = $('.lck-dots', el), cell = $('.lck-cell', el), n = $('[data-n]', el);
    dots.innerHTML = steps.map((s, i) => `<button type="button" class="${isLive(s) ? 'live' : 'ok'}" aria-label="Cell ${i + 1}" title="Cell ${i + 1}"></button>`).join('');
    let k = 0;
    const show = i => {
      k = Math.max(0, Math.min(steps.length - 1, i)); const s = steps[k];
      $$('button', dots).forEach((b, j) => b.setAttribute('aria-current', String(j === k)));
      n.textContent = `Cell ${k + 1} of ${steps.length}`;
      cell.innerHTML = `<div class="lck-meta"><span>${esc(s.sec || '')}</span><span>In [${k + 1}]</span></div>
        ${s.md ? `<div class="lck-md">${s.md}</div>` : ''}
        ${s.code ? `<div class="lck-code"><pre>${hl(s.code)}</pre></div>
        <div class="lck-acts"><button class="btn" type="button" data-run>▶ Run</button><button class="btn ghost" type="button" data-copy>Copy</button></div><div data-o></div>` : ''}`;
      if (!s.code) { $$('button', dots)[k].classList.add('done'); return; }
      $('[data-copy]', cell).onclick = e => copy(e.target, s.code);
      $('[data-run]', cell).onclick = async e => {
        const o = $('[data-o]', cell); e.target.disabled = true;
        o.innerHTML = `<div class="lck-out"><span class="lck-spin"></span>running…</div>`;
        await sleep(isLive(s) ? 350 : 450);
        if (isLive(s)) o.innerHTML = `<div class="lck-out live">${LIVE[s.st] || LIVE.dep}</div>`;
        else if (!s.out) o.innerHTML = `<div class="lck-out"><span class="tag">Output</span>✓ Ran with no printed output (it defines something used later).</div>`;
        else {
          o.innerHTML = `<div class="lck-out ${s.st === 'standin' ? 'si' : ''}"><span class="tag">Output${s.st === 'standin' ? ' · stand-in embeddings' : ''}</span><span data-t></span></div>`;
          const t = $('[data-t]', o), txt = s.out; let p = 0;
          const stepN = Math.max(4, Math.ceil(txt.length / 60));
          while (p < txt.length) { p += stepN; t.textContent = txt.slice(0, p); await sleep(14); }
          if (s.st === 'standin') o.firstChild.insertAdjacentHTML('beforeend', `<span class="tag" style="margin-top:8px;text-transform:none;letter-spacing:0;font-weight:400">This run used a small keyword stand-in instead of downloading MiniLM, so exact numbers differ in Colab. The steps and object shapes are the same.</span>`);
        }
        e.target.disabled = false; e.target.textContent = '↻ Run again';
        $$('button', dots)[k].classList.add('done');
      };
    };
    $$('button', dots).forEach((b, i) => b.onclick = () => show(i));
    $('[data-p]', el).onclick = () => show(k - 1); $('[data-x]', el).onclick = () => { show(k + 1); };
    show(0);
  });

  // ---------- chat / message flow ----------
  A.demo('chat', el => {
    const d = json(el);
    const ctl = add($('.demo-h', el), `<button class="btn" type="button">▶ Play</button>`); const play = $('button', ctl);
    const box = add(el, `${d.intro ? `<p class="note-s">${d.intro}</p>` : ''}<div class="lck-chat"></div><div class="lck-row" data-ch></div>`);
    const chat = $('.lck-chat', box), ch = $('[data-ch]', box);
    const WHO = { user: '🧑 Human', ai: '🤖 AI', tool: '🔧 Tool result', call: '🤖 AI → tool call', sys: '⚙️ System', mw: '🛡️ Middleware' };
    let run = 0;
    async function playMsgs(msgs, id) {
      for (const m of msgs) {
        if (id !== run) return;
        if (m.r === 'ai' || m.r === 'call') { const t = add(chat, `<div class="lck-typing">🤖 thinking…</div>`); await sleep(650); t.remove(); }
        else await sleep(380);
        if (id !== run) return;
        add(chat, `<div class="lck-msg ${m.r} ${m.bad ? 'bad' : ''}"><span class="who">${m.who || WHO[m.r] || m.r}</span>${m.t}</div>`);
        chat.lastElementChild.scrollIntoView({ block: 'nearest' });
      }
    }
    async function start() {
      const id = ++run; chat.innerHTML = ''; ch.innerHTML = ''; play.textContent = '↺ Replay';
      await playMsgs(d.msgs, id);
      if (id !== run || !d.choices) return;
      ch.innerHTML = `<span class="note-s" style="margin:0">${d.ask || 'Your decision:'}</span>` + d.choices.map((c, i) => `<button class="btn ${i ? 'ghost' : ''}" type="button">${c.label}</button>`).join('');
      $$('button', ch).forEach((b, i) => b.onclick = async () => { ch.innerHTML = ''; add(chat, `<div class="lck-msg user"><span class="who">🧑 You decided</span>${d.choices[i].label}</div>`); await playMsgs(d.choices[i].msgs, id); });
    }
    play.onclick = start;
    new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { o.disconnect(); start(); } }, { threshold: .35 }).observe(el);
  });

  // ---------- text splitter playground (same algorithm idea as RecursiveCharacterTextSplitter) ----------
  function merge(splits, sep, size, ov) {
    const docs = []; let cur = [], total = 0;
    for (const s of splits) {
      const L = s.length;
      if (total + L + (cur.length ? sep.length : 0) > size && cur.length) {
        docs.push(cur.join(sep).trim());
        while (total > ov || (total + L + (cur.length ? sep.length : 0) > size && total > 0)) { total -= cur[0].length + (cur.length > 1 ? sep.length : 0); cur.shift(); }
      }
      cur.push(s); total += L + (cur.length > 1 ? sep.length : 0);
    }
    if (cur.length) docs.push(cur.join(sep).trim());
    return docs.filter(Boolean);
  }
  function rsplit(text, size, ov, seps = ['\n\n', '\n', ' ', '']) {
    let sep = seps[seps.length - 1], rest = [];
    for (let i = 0; i < seps.length; i++) { if (seps[i] === '' || text.includes(seps[i])) { sep = seps[i]; rest = seps.slice(i + 1); break; } }
    const raw = sep ? text.split(sep) : [...text];      // keep_separator=True: the separator stays at the start of the next piece
    const parts = (sep ? raw.map((p, i) => i ? sep + p : p) : raw).filter(x => x !== '');
    const out = []; let good = [];
    for (const p of parts) {
      if (p.length < size) good.push(p);
      else { if (good.length) { out.push(...merge(good, '', size, ov)); good = []; } if (!rest.length) out.push(p); else out.push(...rsplit(p, size, ov, rest)); }
    }
    if (good.length) out.push(...merge(good, '', size, ov));
    return out;
  }
  A.rsplit = rsplit;
  A.demo('split', el => {
    const d = json(el);
    const b = add(el, `<textarea class="lck-in" aria-label="Text to split">${esc(d.text)}</textarea>
      <div class="lck-row"><label>chunk_size <input type="range" min="30" max="600" step="10" value="${d.size || 120}" data-s> <b data-sv></b></label>
      <label>chunk_overlap <input type="range" min="0" max="80" step="5" value="${d.overlap || 20}" data-o> <b data-ov></b></label></div>
      <div class="lck-stat" data-st></div><div class="lck-chunks"></div>`);
    const ta = $('textarea', b), S = $('[data-s]', b), O = $('[data-o]', b), list = $('.lck-chunks', b);
    const C = ['var(--ac)', 'var(--green)', 'var(--amber)', 'var(--red)', '#b38cff', '#4fd1c5'];
    const draw = () => {
      const size = +S.value, ov = Math.min(+O.value, size - 10);
      $('[data-sv]', b).textContent = size; $('[data-ov]', b).textContent = ov;
      const ch = rsplit(ta.value, size, ov);
      $('[data-st]', b).innerHTML = `<span>📄 <b>${ta.value.length}</b> characters</span><span>✂️ <b>${ch.length}</b> chunk${ch.length === 1 ? "" : "s"}</span><span>📏 longest <b>${Math.max(0, ...ch.map(c => c.length))}</b></span><span style="color:var(--amber)">▇ = overlap (text repeated from the previous chunk)</span>`;
      list.innerHTML = ch.map((c, i) => {
        let o = 0; const prev = ch[i - 1] || '';
        for (let L = Math.min(prev.length, c.length); L > 0; L--) if (prev.endsWith(c.slice(0, L))) { o = L; break; }
        return `<div class="lck-chunk" style="--c:${C[i % C.length]};animation-delay:${i * 40}ms"><b>chunk ${i} · ${c.length} chars</b>${o ? `<mark>${esc(c.slice(0, o))}</mark>` : ''}${esc(c.slice(o))}</div>`;
      }).join('');
    };
    [ta, S, O].forEach(x => x.oninput = draw); draw();
  });

  // ---------- prompt template filler ----------
  A.demo('tmpl', el => {
    const d = json(el), vars = [...new Set((d.parts || [[null, d.template]]).flatMap(p => [...p[1].matchAll(/\{(\w+)\}/g)].map(m => m[1])))];
    const b = add(el, `<div class="lck-code"><div class="lab">${esc(d.label || 'template')}</div><pre>${esc((d.parts || [[null, d.template]]).map(p => p[0] ? `("${p[0]}", "${p[1]}")` : p[1]).join('\n'))}</pre></div>
      <p class="note-s">input_variables detected: <code>${esc(JSON.stringify(vars.slice().sort()))}</code>. Type values below (clear one to see the error).</p>
      <div class="lck-row">${vars.map(v => `<label>${v} <input class="lck-in" data-v="${v}" value="${esc((d.vars || {})[v] || '')}"></label>`).join('')}</div><div class="lck-res" data-r></div>`);
    const r = $('[data-r]', b);
    const draw = () => {
      const val = {}; $$('[data-v]', b).forEach(i => val[i.dataset.v] = i.value);
      const miss = vars.filter(v => !val[v]);
      if (miss.length) { r.className = 'lck-res err'; r.textContent = `KeyError: missing variable '${miss[0]}'\n→ LangChain stops you here instead of sending a broken prompt to the LLM.`; return; }
      const fill = t => t.replace(/\{(\w+)\}/g, (_, k) => val[k]);
      r.className = 'lck-res good';
      r.textContent = d.parts ? d.parts.map(p => `${p[0].padEnd(6)}: ${fill(p[1])}`).join('\n') : fill(d.template);
    };
    $$('[data-v]', b).forEach(i => i.oninput = draw); draw();
  });

  // ---------- output parser playground ----------
  A.demo('parse', el => {
    const d = json(el);
    const b = add(el, `<div class="lck-row">${d.samples.map((s, i) => `<button class="btn ${i ? 'ghost' : ''}" type="button" data-s="${i}">${esc(s.label)}</button>`).join('')}</div>
      <textarea class="lck-in" aria-label="LLM text output" style="min-height:80px"></textarea>
      <div class="lck-row"><label>Parser <select class="lck-in" data-p>
      <option>StrOutputParser</option><option>CommaSeparatedListOutputParser</option><option>NumberedListOutputParser</option><option>JsonOutputParser</option><option>PydanticOutputParser(Smartphone)</option></select></label></div>
      <div class="lck-res" data-r></div><p class="note-s">Smartphone schema: <code>name: str, price: int, features: list[str]</code></p>`);
    const ta = $('textarea', b), sel = $('[data-p]', b), r = $('[data-r]', b);
    const py = v => v === null ? 'None' : Array.isArray(v) ? '[' + v.map(py).join(', ') + ']' : typeof v === 'string' ? `'${v.replace(/'/g, "\\'")}'` : typeof v === 'object' ? '{' + Object.entries(v).map(([k, x]) => `'${k}': ${py(x)}`).join(', ') + '}' : String(v);
    const run = () => {
      const t = ta.value, p = sel.value; let out;
      try {
        if (p === 'StrOutputParser') out = py(t);
        else if (p.startsWith('Comma')) out = py(t.trim().split(/\s*,\s*/).filter(Boolean));
        else if (p.startsWith('Numbered')) { const m = [...t.matchAll(/^\s*\d+\.\s+(.*)$/gm)].map(x => x[1].trim()); out = py(m) + (m.length ? '' : '   ← no "1. 2. 3." lines found'); }
        else {
          const raw = (t.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, t])[1]; const s = raw.indexOf('{'), e2 = raw.lastIndexOf('}');
          let o; try { o = JSON.parse(raw.slice(s, e2 + 1)); } catch (e) { throw new Error('OutputParserException: Invalid json output: ' + raw.slice(0, 60)); }
          if (p.startsWith('Json')) out = py(o);
          else {
            const errs = []; if (typeof o.name !== 'string') errs.push('name: Input should be a valid string');
            if (!Number.isInteger(typeof o.price === 'string' && /^\d+$/.test(o.price) ? +o.price : o.price)) errs.push(`price: Input should be a valid integer, got ${JSON.stringify(o.price)}`);
            if (!Array.isArray(o.features)) errs.push('features: Input should be a valid list');
            if (errs.length) throw new Error('OutputParserException: Failed to parse Smartphone\n  ' + errs.join('\n  '));
            out = `Smartphone(name=${py(o.name)}, price=${+o.price}, features=${py(o.features)})`;
          }
        }
        r.className = 'lck-res good'; r.textContent = out;
      } catch (e) { r.className = 'lck-res err'; r.textContent = e.message; }
    };
    $$('[data-s]', b).forEach(x => x.onclick = () => { $$('[data-s]', b).forEach(y => y.classList.add('ghost')); x.classList.remove('ghost'); ta.value = d.samples[+x.dataset.s].text; if (d.samples[+x.dataset.s].parser) sel.value = d.samples[+x.dataset.s].parser; run(); });
    ta.oninput = run; sel.onchange = run; ta.value = d.samples[0].text; if (d.samples[0].parser) sel.value = d.samples[0].parser; run();
  });

  // ---------- LangGraph conditional edge ----------
  A.demo('route', el => {
    const d = json(el), T = d.threshold || 35;
    const b = add(el, `<div class="lck-row"><label>marks <input type="range" min="0" max="100" value="${d.start || 72}" data-m> <b data-mv></b></label></div>
      <svg class="lck-g" viewBox="0 0 560 210" role="img" aria-label="Graph: START to check, then passed or failed, then END">
       <path data-e="s" d="M70 105 L150 105"/><path data-e="p" d="M250 95 C300 60,320 45,360 45"/><path data-e="f" d="M250 115 C300 150,320 165,360 165"/>
       <path data-e="pe" d="M460 45 C490 45,500 80,505 92"/><path data-e="fe" d="M460 165 C490 165,500 130,505 118"/>
       <g data-n="START"><rect x="10" y="88" width="60" height="34" rx="17"/><text x="40" y="110" text-anchor="middle">START</text></g>
       <g data-n="check"><rect x="150" y="85" width="100" height="40" rx="10"/><text x="200" y="110" text-anchor="middle">check</text></g>
       <g data-n="passed"><rect x="360" y="25" width="100" height="40" rx="10"/><text x="410" y="50" text-anchor="middle">passed</text></g>
       <g data-n="failed"><rect x="360" y="145" width="100" height="40" rx="10"/><text x="410" y="170" text-anchor="middle">failed</text></g>
       <g data-n="END"><rect x="486" y="88" width="64" height="34" rx="17"/><text x="518" y="110" text-anchor="middle">END</text></g>
       <text x="290" y="105" style="font:500 11px var(--mono);fill:var(--dim)" data-c></text></svg>
      <div class="lck-res good" data-r></div>`);
    const M = $('[data-m]', b);
    const draw = () => {
      const m = +M.value, pass = m >= T; $('[data-mv]', b).textContent = m;
      $$('[data-n]', b).forEach(g => g.classList.toggle('on', ['START', 'check', 'END', pass ? 'passed' : 'failed'].includes(g.dataset.n)));
      $$('[data-e]', b).forEach(p => p.classList.toggle('on', ['s', pass ? 'p' : 'f', pass ? 'pe' : 'fe'].includes(p.dataset.e)));
      $('[data-c]', b).textContent = `route() → "${pass ? 'passed' : 'failed'}"`;
      $('[data-r]', b).textContent = `result_graph.invoke({"marks": ${m}})\n→ {'marks': ${m}, 'message': '${pass ? '🎉 Pass' : '📚 Fail, try again'}'}`;
    };
    M.oninput = draw; draw();
  });

  // ---------- cache timing ----------
  A.demo('cache', el => {
    const d = json(el), delay = (d.delay || 1.2) * 1000;
    const b = add(el, `<div class="lck-row"><label><input type="checkbox" data-c checked> set_llm_cache(InMemoryCache())</label></div>
      <div class="lck-row">${d.questions.map((q, i) => `<button class="btn ${i ? 'ghost' : ''}" type="button" data-q="${i}">Ask: “${esc(q)}”</button>`).join('')}</div>
      <div class="lck-meter"><i></i></div><div class="lck-res" data-r>Ask a question. Then ask the same one again.</div>
      <div class="lck-stat"><span>API calls: <b data-a>0</b></span><span>from cache: <b data-h>0</b></span><span>money spent: <b data-m>₹0.00</b></span></div>`);
    const cache = new Map(); let api = 0, hit = 0; const bar = $('.lck-meter i', b), r = $('[data-r]', b);
    $$('[data-q]', b).forEach(btn => btn.onclick = async () => {
      const q = d.questions[+btn.dataset.q], useC = $('[data-c]', b).checked; $$('[data-q]', b).forEach(x => x.disabled = true);
      const t0 = performance.now();
      if (useC && cache.has(q)) { hit++; bar.style.transition = 'none'; bar.style.width = '100%'; r.className = 'lck-res good'; r.textContent = `⚡ ${((performance.now() - t0) / 1000).toFixed(3)} s · from cache, no API call\n${cache.get(q)}`; }
      else {
        r.className = 'lck-res'; r.innerHTML = '<span class="lck-spin"></span>calling the LLM API…'; bar.style.transition = 'none'; bar.style.width = '0';
        requestAnimationFrame(() => { bar.style.transition = `width ${delay}ms linear`; bar.style.width = '100%'; });
        await sleep(delay); api++; const a = d.answers[q] || 'OK'; if (useC) cache.set(q, a);
        r.textContent = `🐢 ${(delay / 1000).toFixed(1)} s · real API call\n${a}`;
      }
      $('[data-a]', b).textContent = api; $('[data-h]', b).textContent = hit; $('[data-m]', b).textContent = '₹' + (api * (d.cost || 0.05)).toFixed(2);
      $$('[data-q]', b).forEach(x => x.disabled = false);
    });
    $('[data-c]', b).onchange = () => cache.clear();
  });
})();
