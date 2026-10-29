/* Certificates: each track unlocks when its goal is met (progress is read from this browser). Download a PNG and add it to LinkedIn. */
(function () {
  const app = document.getElementById('cert'), base = app.dataset.base || '../';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const D = window.LEARN24, S = L24.S;
  const done = (() => { try { return JSON.parse(localStorage.getItem('learn24-done') || '[]'); } catch (e) { return []; } })();
  function topicTrack(id, name, need = 0.8) {
    const t = D.topics.find(x => x.id === id); if (!t) return null;
    const live = t.lessons.filter(l => l.status === 'live'), n = live.filter(l => done.includes(id + '/' + l.id)).length, goal = Math.ceil(live.length * need);
    return { id, name, how: `Complete ${goal} of ${live.length} lessons (${Math.round(need * 100)}%)`, have: n, goal, href: `${base}${id}/index.html` };
  }
  const mocks = S.mocks, last3 = mocks.slice(-3), avg3 = last3.length ? Math.round(last3.reduce((a, m) => a + m.score, 0) / last3.length) : 0;
  const projDone = done.filter(k => k.startsWith('projects/')).length;
  const rmDone = Object.entries(S.roadmap).filter(([k, v]) => v && v.complete).length;
  const TR = [
    topicTrack('genai-course', 'Generative AI Foundations'),
    topicTrack('langchain-course', 'LangChain Hands-on Developer'),
    topicTrack('agentic-ai', 'Agentic AI Fundamentals'),
    topicTrack('ai-finance', 'AI in Finance & Fraud Detection'),
    topicTrack('aws-saa', 'AWS Cloud Foundations'),
    { id: 'interview-ready', name: 'AI Interview Ready', how: 'Finish 5 mock interviews, with your last 3 averaging 70%+', have: Math.min(5, mocks.length) + (mocks.length >= 5 && avg3 >= 70 ? 1 : 0), goal: 6, note: `${mocks.length} mocks · last-3 average ${avg3}%`, href: `${base}mock/index.html` },
    { id: 'portfolio-builder', name: 'AI Portfolio Builder', how: 'Finish 3 portfolio projects (press “Mark as done” on each project page)', have: projDone, goal: 3, href: `${base}projects/index.html` },
    { id: 'roadmap-finisher', name: 'Career Roadmap Finisher', how: 'Tick every step of one career roadmap', have: rmDone, goal: 1, href: `${base}roadmaps/index.html` },
  ].filter(Boolean);

  function render() {
    app.innerHTML = `
    <div class="mk-card"><label class="mk-l" for="nm">Name on your certificates</label>
      <div class="mk-row"><input id="nm" class="mk-in" maxlength="60" placeholder="Your full name" value="${esc(S.name || '')}"><button class="btn ghost" id="sv" type="button">Save name</button></div>
      <p class="muted">Progress is tracked on this device (no sign-up). Certificates are self-paced completion awards from Learn24.</p></div>
    <div class="ct-grid">${TR.map(t => { const ok = t.have >= t.goal, p = Math.min(100, Math.round(t.have / t.goal * 100)); return `
      <div class="ct${ok ? ' ok' : ''}"><div class="ct-ic">${ok ? '🎓' : '🔒'}</div><h3>${esc(t.name)}</h3><p>${esc(t.how)}</p>
        <div class="mk-meter"><i class="${ok ? 'good' : 'mid'}" style="width:${p}%"></i></div><small>${t.note ? esc(t.note) : `${t.have} / ${t.goal}`}</small>
        ${ok ? `<button class="btn" data-id="${t.id}" type="button">Get certificate</button>` : `<a class="btn ghost" href="${t.href}">Continue →</a>`}</div>`; }).join('')}</div>
    <div id="out"></div>`;
    app.querySelector('#sv').onclick = () => { S.name = app.querySelector('#nm').value.trim(); L24.save(); L24.toast('Name saved'); };
    app.querySelectorAll('[data-id]').forEach(b => b.onclick = () => make(TR.find(t => t.id === b.dataset.id)));
  }
  function make(t) {
    const name = (app.querySelector('#nm').value || S.name || '').trim();
    if (!name) { L24.toast('Enter your name first'); app.querySelector('#nm').focus(); return; }
    S.name = name;
    const rec = S.certs[t.id] || (S.certs[t.id] = { date: L24.today() });
    const id = 'L24-' + L24.hash(name + '|' + t.id + '|' + rec.date).toString(36).toUpperCase().padStart(7, '0');
    rec.cid = id; L24.save();
    const c = document.createElement('canvas'); c.width = 1600; c.height = 1130; const x = c.getContext('2d');
    x.fillStyle = '#fbfaf6'; x.fillRect(0, 0, 1600, 1130);
    x.strokeStyle = '#1d2b45'; x.lineWidth = 14; x.strokeRect(40, 40, 1520, 1050); x.strokeStyle = '#c9a646'; x.lineWidth = 3; x.strokeRect(70, 70, 1460, 990);
    x.textAlign = 'center'; x.fillStyle = '#1d2b45'; x.font = '700 46px Georgia, serif'; x.fillText('LEARN24', 800, 170);
    x.font = '400 30px Georgia, serif'; x.fillStyle = '#6b7280'; x.fillText('CERTIFICATE OF COMPLETION', 800, 230);
    x.font = '400 30px Georgia, serif'; x.fillText('This certifies that', 800, 360);
    x.fillStyle = '#111827'; x.font = 'italic 700 84px Georgia, serif'; x.fillText(name, 800, 470);
    x.fillStyle = '#c9a646'; x.fillRect(450, 500, 700, 3);
    x.fillStyle = '#6b7280'; x.font = '400 30px Georgia, serif'; x.fillText('has successfully completed the Learn24 track', 800, 580);
    x.fillStyle = '#1d2b45'; x.font = '700 60px Georgia, serif'; x.fillText(t.name, 800, 670);
    x.fillStyle = '#4b5563'; x.font = '400 26px Georgia, serif'; x.fillText(t.how, 800, 730);
    x.textAlign = 'left'; x.font = '400 26px Georgia, serif'; x.fillStyle = '#374151';
    x.fillText(`Date: ${new Date(rec.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`, 160, 930);
    x.fillText(`Certificate ID: ${id}`, 160, 975);
    x.textAlign = 'right'; x.font = 'italic 700 44px Georgia, serif'; x.fillStyle = '#1d2b45'; x.fillText('Ajeetkumar', 1440, 925);
    x.fillStyle = '#c9a646'; x.fillRect(1120, 945, 320, 2); x.font = '400 24px Georgia, serif'; x.fillStyle = '#6b7280'; x.fillText('Founder & Trainer, Learn24', 1440, 980);
    x.textAlign = 'center'; x.font = '400 22px Georgia, serif'; x.fillText('learn24-lilac.vercel.app', 800, 1040);
    const url = c.toDataURL('image/png'), dt = new Date(rec.date);
    const li = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent('Learn24 · ' + t.name)}&organizationName=Learn24&issueYear=${dt.getFullYear()}&issueMonth=${dt.getMonth() + 1}&certUrl=${encodeURIComponent('https://learn24-lilac.vercel.app/certificate')}&certId=${id}`;
    app.querySelector('#out').innerHTML = `<div class="mk-card"><h2>🎉 ${esc(t.name)}</h2><img class="ct-img" src="${url}" alt="Learn24 certificate for ${esc(name)}: ${esc(t.name)}">
      <div class="mk-act"><a class="btn" href="${url}" download="learn24-${t.id}.png">⬇ Download PNG</a><a class="btn ghost" href="${li}" target="_blank" rel="noopener">Add to LinkedIn profile</a><a class="btn ghost" href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://learn24-lilac.vercel.app/certificate')}" target="_blank" rel="noopener">Share post</a></div></div>`;
    app.querySelector('#out').scrollIntoView({ behavior: 'smooth' });
    if (!rec.xp) { rec.xp = 1; L24.save(); L24.addXP(100, 'cert'); }
  }
  render();
})();
