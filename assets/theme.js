/* Learn24 theme switch. Load in <head> (before the body) so the page never flashes the wrong colours.
   Dark is the default; the reader's saved choice wins. Topic colours are darkened in light mode so text stays readable. */
(function () {
  const KEY = 'learn24-theme', root = document.documentElement;
  const saved = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  let mode = saved() || 'dark';
  root.dataset.theme = mode;

  // topic colours (pastel, made for dark) → darker shade for white backgrounds
  const dark = hex => {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim()); if (!m) return null;
    const n = parseInt(m[1], 16), f = .6;
    return '#' + [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(v * f).toString(16).padStart(2, '0')).join('');
  };
  const VARS = ['--ac', '--c', '--l24-tc'];
  function tint() {
    const light = mode === 'light';
    // values set in page <style> :root blocks
    // (or inline on <html> by stepper.js)
    if (!('oac' in root.dataset)) root.dataset.oac = root.style.getPropertyValue('--ac').trim();
    const inl = root.dataset.oac;
    if (inl) root.style.setProperty('--ac', inl); else root.style.removeProperty('--ac');
    if (light) { const v = getComputedStyle(root).getPropertyValue('--ac'); const d = v && dark(v); if (d) root.style.setProperty('--ac', d); }
    // values set inline on elements (topic cards, lesson rows, lesson bar)
    document.querySelectorAll('[style*="--"]').forEach(el => {
      if (el === root) return;
      VARS.forEach(k => {
        const key = 'o' + k.replace(/-/g, '');
        if (!(key in el.dataset)) { const v = el.style.getPropertyValue(k); if (!v) return; el.dataset[key] = v.trim(); }
        const o = el.dataset[key]; el.style.setProperty(k, light ? (dark(o) || o) : o);
      });
    });
    const tc = document.querySelector('meta[name="theme-color"]');
    if (tc) { if (!tc.dataset.o) tc.dataset.o = tc.content; tc.content = light ? '#f6f8fc' : tc.dataset.o; }
    document.querySelectorAll('.l24-theme').forEach(b => {
      b.textContent = light ? '☾' : '☀';
      b.setAttribute('aria-label', light ? 'Switch to dark theme' : 'Switch to light theme');
      b.title = b.getAttribute('aria-label');
    });
  }
  function set(m) { mode = m; root.dataset.theme = m; try { localStorage.setItem(KEY, m); } catch (e) {} tint(); }
  window.Learn24Theme = { set, get: () => mode, refresh: tint };

  function button() {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'l24-theme';
    b.onclick = () => set(mode === 'light' ? 'dark' : 'light'); return b;
  }
  function mount() {
    const host = document.querySelector('.top .shell') || document.querySelector('.l24-in');
    if (!document.querySelector('.l24-theme')) {
      const b = button();
      if (host) host.append(b); else { b.classList.add('l24-float'); document.body.append(b); }
    }
    tint();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
