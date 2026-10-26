/* Learn24 article engine: table of contents, reading progress, code copy buttons, quizzes, tabs and simple syntax colouring.
   Page-specific demos register with Article.demo('name', el => {...}) and are mounted on <div class="demo" data-demo="name">. */
(function () {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const demos = {};
  window.Article = { demo: (n, f) => { demos[n] = f; }, $, $$ };

  function colour(pre) {
    const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const KW = /\b(from|import|def|return|for|in|print|with|as|if|else|class|lambda|True|False|None)\b/g;
    pre.innerHTML = pre.textContent.split('\n').map(line => {
      let out = '', i = 0, q = null, start = 0;
      const code = t => esc(t).replace(KW, '<span class="k">$1</span>');
      for (; i < line.length; i++) {
        const ch = line[i];
        if (q) { if (ch === q) { out += `<span class="s">${esc(line.slice(start, i + 1))}</span>`; q = null; start = i + 1; } continue; }
        if (ch === '"' || ch === "'") { out += code(line.slice(start, i)); q = ch; start = i; continue; }
        if (ch === '#') { out += code(line.slice(start, i)) + `<span class="c">${esc(line.slice(i))}</span>`; start = line.length; break; }
      }
      if (start < line.length) out += q ? `<span class="s">${esc(line.slice(start))}</span>` : code(line.slice(start));
      return out;
    }).join('\n');
  }

  function init() {
    // code blocks
    $$('.codebox').forEach(box => {
      const pre = $('pre', box), raw = pre.textContent; colour(pre);
      const b = $('.copy', box); if (!b) return;
      b.onclick = async () => {
        try { await navigator.clipboard.writeText(raw); b.textContent = 'Copied'; }
        catch (e) { const r = document.createRange(); r.selectNodeContents(pre); const s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = 'Selected'; }
        setTimeout(() => b.textContent = 'Copy', 1500);
      };
    });
    // toc
    const toc = $('.toc'), hs = $$('article h2[id]');
    if (toc) {
      toc.insertAdjacentHTML('beforeend', hs.map(h => `<a href="#${h.id}">${h.textContent.replace(/^\d+\s*/, '')}</a>`).join(''));
      const links = $$('a', toc);
      const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id)); } }), { rootMargin: '-20% 0px -70% 0px' });
      hs.forEach(h => io.observe(h));
    }
    // progress
    const pb = $('.progress');
    if (pb) addEventListener('scroll', () => { const h = document.documentElement; pb.style.width = (h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight) * 100) + '%'; }, { passive: true });
    // tabs
    $$('.tabset').forEach(ts => {
      const bs = $$('.tabs button', ts), ps = $$('.tabpanel', ts);
      bs.forEach((b, i) => b.onclick = () => { bs.forEach((x, j) => x.setAttribute('aria-selected', String(i === j))); ps.forEach((p, j) => p.hidden = i !== j); ts.dispatchEvent(new CustomEvent('tab', { detail: i })); });
    });
    // quiz
    $$('.quiz').forEach(qz => {
      const qs = $$('.q', qz); let right = 0, answered = 0;
      qs.forEach(q => {
        const ans = +q.dataset.answer, os = $$('.opt', q);
        os.forEach((o, i) => o.onclick = () => {
          if (q.dataset.done) return; q.dataset.done = 1; answered++;
          o.classList.add(i === ans ? 'right' : 'wrong'); os[ans].classList.add('right');
          if (i === ans) right++;
          const w = document.createElement('div'); w.className = 'why'; w.textContent = (i === ans ? '✓ Correct. ' : '✕ Not quite. ') + q.dataset.why; q.append(w);
          if (answered === qs.length) $('.score', qz).textContent = `You scored ${right} / ${qs.length}`;
        });
      });
    });
    // figures: on small screens wide diagrams scroll sideways instead of shrinking text
    $$('.fig > svg').forEach(svg => {
      const box = document.createElement('div'); box.className = 'figscroll';
      svg.replaceWith(box); box.append(svg);
      const vb = (svg.getAttribute('viewBox') || '').split(/[ ,]+/).map(Number);
      if (vb[2] >= 600) { const f = box.parentElement; f.classList.add('wide'); const h = document.createElement('div'); h.className = 'swipe'; h.textContent = 'swipe ↔ to see the full diagram'; f.insertBefore(h, box); }
    });
    // figures animate in when scrolled into view
    const fio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); fio.unobserve(e.target); } }), { threshold: .25 });
    $$('.fig').forEach(f => fio.observe(f));
    // demos
    $$('.demo[data-demo]').forEach(el => { const f = demos[el.dataset.demo]; if (f) f(el); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
