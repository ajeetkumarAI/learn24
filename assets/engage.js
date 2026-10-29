/* Learn24 engagement store: XP, daily streak, mock-interview history, badges and the shared question bank.
   Everything lives in this browser (localStorage key "learn24-me"); nothing is sent anywhere. */
(function () {
  const KEY = 'learn24-me';
  const today = (d = new Date()) => { const z = new Date(d.getTime() - d.getTimezoneOffset() * 6e4); return z.toISOString().slice(0, 10); };
  const blank = () => ({ xp: 0, days: {}, daily: {}, mocks: [], seen: [], rated: {}, projects: {}, roadmap: {}, certs: {}, dsa: { solved: {} }, name: '' });
  function load() { try { return Object.assign(blank(), JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { return blank(); } }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
  const S = load();

  function markActive(kind) {
    const d = today(); S.days[d] = S.days[d] || {}; S.days[d][kind] = (S.days[d][kind] || 0) + 1; save(S);
  }
  function addXP(n, kind) { S.xp += n; markActive(kind || 'xp'); save(S); toast(`+${n} XP`); }
  function streak() {
    let n = 0, d = new Date();
    if (!S.days[today(d)]) d.setDate(d.getDate() - 1);          // today not done yet: count up to yesterday
    while (S.days[today(d)]) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  function best() {
    const ks = Object.keys(S.days).sort(); let b = 0, run = 0, prev = null;
    for (const k of ks) { const t = new Date(k + 'T00:00:00'); run = prev && (t - prev) === 864e5 ? run + 1 : 1; b = Math.max(b, run); prev = t; }
    return b;
  }
  const level = xp => { const L = [0, 100, 250, 500, 900, 1500, 2500, 4000, 6000, 9000]; let i = 0; while (i < L.length - 1 && xp >= L[i + 1]) i++; return { n: i + 1, from: L[i], to: L[i + 1] || L[i] + 3000 }; };
  const practised = () => Object.keys(S.rated).length;
  function badges() {
    const st = Math.max(streak(), best()), mocks = S.mocks.length, bestMock = Math.max(0, ...S.mocks.map(m => m.score));
    const dl = (() => { try { return JSON.parse(localStorage.getItem('learn24-done') || '[]'); } catch (e) { return []; } })();
    const done = dl.length, projects = dl.filter(k => k.startsWith('projects/')).length;
    return [
      ['🌱', 'First step', 'Answer your first daily challenge', Object.keys(S.daily).length >= 1],
      ['🔥', '3-day streak', 'Practise 3 days in a row', st >= 3],
      ['⚡', '7-day streak', 'Practise 7 days in a row', st >= 7],
      ['🏆', '30-day streak', 'Practise 30 days in a row', st >= 30],
      ['🎤', 'Mock rookie', 'Finish your first mock interview', mocks >= 1],
      ['🎯', 'Mock regular', 'Finish 10 mock interviews', mocks >= 10],
      ['🚀', 'Interview ready', 'Score 80%+ in a mock interview', bestMock >= 80],
      ['💯', 'Century', 'Practise 100 different questions', practised() >= 100],
      ['📚', 'Learner', 'Complete 10 lessons or pages', done >= 10],
      ['🛠️', 'Builder', 'Finish a portfolio project', projects >= 1],
      ['🧩', 'Problem solver', 'Solve 10 DSA practice problems', Object.keys((S.dsa && S.dsa.solved) || {}).length >= 10],
      ['🎓', 'Certified', 'Earn a Learn24 certificate', Object.keys(S.certs).length >= 1],
      ['👑', 'Level 5', 'Reach 900 XP', S.xp >= 900],
    ].map(([i, n, d, ok]) => ({ icon: i, name: n, desc: d, ok }));
  }
  let QB = null;
  async function qbank(base) {
    if (QB) return QB;
    const r = await fetch((base || '') + 'assets/qbank.json'); QB = await r.json(); return QB;
  }
  function toast(msg) {
    let t = document.getElementById('l24-toast');
    if (!t) { t = document.createElement('div'); t.id = 'l24-toast'; t.className = 'l24-toast'; t.setAttribute('role', 'status'); document.body.append(t); }
    t.textContent = msg; t.classList.add('on'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 2200);
  }
  function math(el) { if (window.renderMathInElement) try { renderMathInElement(el, { delimiters: [{ left: '\\(', right: '\\)', display: false }, { left: '\\[', right: '\\]', display: true }], throwOnError: false }); } catch (e) {} }
  const hash = s => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  window.L24 = { S, save: () => save(S), today, markActive, addXP, streak, best, level, badges, practised, qbank, toast, math, hash };
})();
