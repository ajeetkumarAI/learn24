/* Learn24 Resume Builder: ATS-friendly templates, live A4 preview, JD keyword match, resume score, bullet helper,
   cover letters, Learn24 import, PDF / JSON / plain-text export. Everything is stored in this browser (localStorage "learn24-resume"). */
(function () {
  const app = document.getElementById('rb'), base = app.dataset.base || '../';
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const KEY = 'learn24-resume', clone = o => JSON.parse(JSON.stringify(o)), uid = () => Math.random().toString(36).slice(2, 9);
  const L24 = window.L24;
  const LS = { get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  const TYPES = { experience: 'Experience', projects: 'Projects', education: 'Education', skills: 'Skills', certs: 'Certifications', list: 'Achievements', custom: 'Custom section' };
  const FIELDS = {
    experience: [['role', 'Job title'], ['org', 'Company'], ['location', 'Location'], ['start', 'Start (e.g. Jan 2024)'], ['end', 'End (or Present)'], ['bullets', 'Achievements (one per line)', 'ta']],
    projects: [['name', 'Project name'], ['tech', 'Tech stack'], ['date', 'Duration or date (optional)'], ['link', 'Link (GitHub / demo)'], ['domain', 'Domain (optional, e.g. Banking / GenAI)'], ['ptype', 'Project type (optional, e.g. RAG Project)'],
      ['bullets', 'What you built and the result (one per line). Tip: start lines with “Problem:”, “Solution:”, “Impact:”', 'ta']],
    education: [['degree', 'Degree / course'], ['school', 'Institution'], ['location', 'Location'], ['start', 'Start year'], ['end', 'End year'], ['score', 'CGPA / %']],
    skills: [['name', 'Group (e.g. GenAI)'], ['keywords', 'Skills, comma-separated', 'ta']],
    certs: [['name', 'Certification'], ['issuer', 'Issuer'], ['date', 'Year'], ['link', 'Credential link']],
    list: [['text', 'Achievement', 'ta']],
    custom: [['title', 'Title'], ['subtitle', 'Subtitle / organisation'], ['date', 'Date'], ['bullets', 'Details (one per line)', 'ta']],
  };
  const TEMPLATES = [['ats', 'ATS Pro', 'Left-aligned, coloured small-caps headings. The safest choice for job portals.', true], ['classic', 'Classic', 'Centred header, ruled headings. Safe for every ATS.', true],
    ['modern', 'Modern', 'Accent name and heading bars. ATS-friendly.', true], ['banner', 'Banner', 'Full-width colour header and filled section bars. ATS-friendly.', true],
    ['minimal', 'Minimal', 'Clean, airy, small-caps headings. ATS-friendly.', true], ['compact', 'Compact', 'Dense layout that fits more on one page (internships, freshers). ATS-friendly.', true],
    ['executive', 'Executive', 'Dark header band, Executive Summary and a Core Competencies grid. For 8+ years.', true], ['sidebar', 'Two-column', 'Tinted side column for skills, education and certifications. Looks great, but some ATS read columns poorly.', false]];
  const COLORS = ['#1f4e8c', '#0e7a52', '#7a2e8c', '#b4462c', '#0b6e86', '#333f50', '#a6266e', '#8a6d00'];
  const FONTS = { plex: '"IBM Plex Sans", Arial, sans-serif', arial: 'Arial, Helvetica, sans-serif', georgia: 'Georgia, "Times New Roman", serif', times: '"Times New Roman", Times, serif', calibri: 'Calibri, Carlito, Arial, sans-serif' };
  const blankDoc = name => ({ name, updated: Date.now(), jd: '', cover: { company: '', role: '', manager: '', why: '', text: '' },
    design: { template: 'ats', accent: COLORS[0], font: 'plex', size: 10.5, spacing: 'normal', margin: 'normal' },
    data: { basics: { name: '', title: '', email: '', phone: '', location: '', links: [{ label: 'LinkedIn', url: '' }, { label: 'GitHub', url: '' }] }, summary: '',
      sections: [{ id: uid(), type: 'experience', title: 'Experience', items: [] }, { id: uid(), type: 'projects', title: 'Projects', items: [] }, { id: uid(), type: 'skills', title: 'Skills', items: [] },
        { id: uid(), type: 'education', title: 'Education', items: [] }, { id: uid(), type: 'certs', title: 'Certifications', items: [] }] } });
  let DATA = null, ST = LS.get(KEY, null), doc = null, tab = 'content', zoom = 0, saveT = null, prevT = null;

  fetch(base + 'assets/resume-data.json').then(r => r.json()).then(d => { DATA = d; init(); }).catch(() => { app.innerHTML = '<p>Could not load the resume builder data. Please refresh.</p>'; });

  // ------------------------------------------------ state
  function init() {
    if (!ST || !ST.docs || !Object.keys(ST.docs).length) {
      const id = uid(); ST = { active: id, docs: { [id]: fromSample('GenAI Engineer (3 yrs)', 'My resume') } };
    }
    if (!ST.docs[ST.active]) ST.active = Object.keys(ST.docs)[0];
    doc = ST.docs[ST.active];
    shell(); drawEditor(); drawPreview(); fitZoom();
    window.addEventListener('resize', () => { if (!zoom) fitZoom(); });
    const m = /import=([\w\-/]+)/.exec(location.hash); if (m) importModal(m[1]);
  }
  function fromSample(key, name) {
    const s = clone(DATA.samples[key]), d = blankDoc(name || key);
    d.data.basics = Object.assign(d.data.basics, s.basics); d.data.summary = s.summary;
    d.data.sections = s.sections.map(x => ({ id: uid(), type: x.type, title: x.title, items: x.items }));
    if (s.tpl) d.design.template = s.tpl;
    return d;
  }
  const save = () => { doc.updated = Date.now(); clearTimeout(saveT); saveT = setTimeout(() => LS.set(KEY, ST), 250); };
  const getPath = (o, p) => p.split('.').reduce((a, k) => a == null ? a : a[k], o);
  const setPath = (o, p, v) => { const ks = p.split('.'), last = ks.pop(); const t = ks.reduce((a, k) => a[k], o); t[last] = v; };
  const lines = s => String(s || '').split('\n').map(x => x.replace(/^\s*[-•*▪●]\s*/, '').trim()).filter(Boolean);
  const kws = s => String(s || '').split(/[,;\n]/).map(x => x.trim()).filter(Boolean);

  // ------------------------------------------------ shell
  function shell() {
    app.innerHTML = `
    <div class="rb-top">
      <div class="rb-title"><h1>📄 Resume Builder</h1><span>ATS-friendly · free · no sign-up · saved in your browser</span></div>
      <div class="rb-docs"><label class="sr" for="rb-doc">Resume version</label><select id="rb-doc"></select>
        <button type="button" class="rb-b" data-a="new" title="New resume">＋ New</button><button type="button" class="rb-b" data-a="dup" title="Duplicate to tailor for a job">⧉ Duplicate</button>
        <button type="button" class="rb-b" data-a="rename">✎ Rename</button><button type="button" class="rb-b" data-a="del" title="Delete this version">🗑</button></div>
      <div class="rb-exp"><button type="button" class="rb-b" data-a="import">⬆ Import</button><button type="button" class="rb-b" data-a="json">⬇ JSON</button><button type="button" class="rb-b" data-a="txt">⬇ Text</button>
        <button type="button" class="rb-b rb-pri" data-a="pdf">⬇ Download PDF</button><input type="file" id="rb-file" accept=".json,application/json" hidden></div>
    </div>
    <div class="rb-main">
      <aside class="rb-left">
        <div class="rb-tabs" role="tablist">${[['content', '✍️ Content'], ['design', '🎨 Design'], ['ats', '🎯 ATS match'], ['score', '✅ Score'], ['cover', '✉️ Cover letter']].map(([k, n]) => `<button type="button" role="tab" data-tab="${k}">${n}</button>`).join('')}</div>
        <div class="rb-pane" id="rb-pane"></div>
      </aside>
      <section class="rb-right">
        <div class="rb-pbar"><span id="rb-pages"></span><span class="grow"></span><button type="button" class="rb-b" data-z="-1" aria-label="Zoom out">−</button><span id="rb-zoom">100%</span><button type="button" class="rb-b" data-z="1" aria-label="Zoom in">＋</button><button type="button" class="rb-b" data-z="0">Fit</button></div>
        <div class="rb-stage" id="rb-stage"><div class="rb-scale" id="rb-scale"><div id="rdoc" class="rdoc"></div></div></div>
        <div id="rcover" class="rdoc rcover" aria-hidden="true"></div>
        <a class="rb-jump" href="#rb-stage">👁 Preview</a>
      </section>
    </div>
    <div class="rb-modal" id="rb-modal" hidden><div class="rb-mbox" role="dialog" aria-modal="true"><button type="button" class="rb-x" data-a="close" aria-label="Close">✕</button><div id="rb-mbody"></div></div></div>`;
    paintDocs();
    app.querySelector('.rb-tabs').onclick = e => { const b = e.target.closest('[data-tab]'); if (b) { tab = b.dataset.tab; drawEditor(); } };
    app.querySelector('#rb-doc').onchange = e => { ST.active = e.target.value; doc = ST.docs[ST.active]; LS.set(KEY, ST); drawEditor(); drawPreview(); };
    app.addEventListener('click', onClick);
    app.querySelector('#rb-file').onchange = onImportFile;
    app.querySelector('.rb-pbar').onclick = e => { const b = e.target.closest('[data-z]'); if (!b) return; const z = +b.dataset.z; if (!z) { zoom = 0; fitZoom(); } else { zoom = Math.min(1.6, Math.max(0.35, (zoom || cur) + z * 0.1)); applyZoom(zoom); } };
    const pane = app.querySelector('#rb-pane');
    pane.addEventListener('input', onInput);
    pane.addEventListener('change', onInput);
  }
  function paintDocs() {
    const sel = app.querySelector('#rb-doc');
    sel.innerHTML = Object.entries(ST.docs).sort((a, b) => b[1].updated - a[1].updated).map(([id, d]) => `<option value="${id}"${id === ST.active ? ' selected' : ''}>${esc(d.name)}</option>`).join('');
  }

  // ------------------------------------------------ editor
  function drawEditor() {
    app.querySelectorAll('.rb-tabs [data-tab]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === tab)));
    const pane = app.querySelector('#rb-pane');
    pane.innerHTML = ({ content: contentPane, design: designPane, ats: atsPane, score: scorePane, cover: coverPane })[tab]();
    if (tab === 'ats' && doc.jd) runATS();
    if (tab === 'score') runScore();
  }
  const fld = (k, label, v, ta, ph) => ta ? `<label class="rb-f rb-wide"><span>${esc(label)}</span><textarea data-k="${k}" rows="${k.endsWith('bullets') ? 4 : 2}" placeholder="${esc(ph || '')}">${esc(v)}</textarea></label>`
    : `<label class="rb-f"><span>${esc(label)}</span><input data-k="${k}" value="${esc(v)}" placeholder="${esc(ph || '')}"></label>`;
  function contentPane() {
    const d = doc.data, b = d.basics;
    return `
    <div class="rb-card rb-quick"><b>Quick start</b>
      <div class="rb-row"><select id="rb-sample">${Object.keys(DATA.samples).map(k => `<option>${esc(k)}</option>`).join('')}</select><button type="button" class="rb-b" data-a="sample">Load sample</button>
      <button type="button" class="rb-b" data-a="l24">⭐ Import from Learn24</button><button type="button" class="rb-b" data-a="clear">Start blank</button></div>
      <small>Samples use fictional people and pick a matching template. Replace every detail with your own.</small></div>
    <div class="rb-card"><h3>Personal details</h3><div class="rb-grid">
      ${fld('basics.name', 'Full name', b.name)}${fld('basics.title', 'Headline (target role)', b.title, false, 'e.g. GenAI Engineer')}${fld('basics.email', 'Email', b.email)}${fld('basics.phone', 'Phone', b.phone)}${fld('basics.location', 'City, Country', b.location)}</div>
      <div class="rb-links">${b.links.map((l, i) => `<div class="rb-row">${fld(`basics.links.${i}.label`, 'Label', l.label)}${fld(`basics.links.${i}.url`, 'URL', l.url, false, 'linkedin.com/in/you')}<button type="button" class="rb-i" data-a="link-del" data-i="${i}" aria-label="Remove link">✕</button></div>`).join('')}
      <button type="button" class="rb-add" data-a="link-add">＋ Add link</button></div></div>
    <div class="rb-card"><h3>Summary <small id="rb-sumc"></small></h3>${fld('summary', '2–4 lines: who you are, years of experience, key skills, a proof point', d.summary, true)}</div>
    ${d.sections.map((s, si) => sectionCard(s, si)).join('')}
    <div class="rb-card rb-row"><select id="rb-newsec">${Object.entries(TYPES).map(([k, n]) => `<option value="${k}">${n}</option>`).join('')}</select><button type="button" class="rb-b" data-a="sec-add">＋ Add section</button></div>`;
  }
  function sectionCard(s, si) {
    const n = doc.data.sections.length;
    return `<div class="rb-card rb-sec${s.hidden ? ' off' : ''}" id="sec-${s.id}">
      <div class="rb-sh"><input class="rb-st" data-k="sections.${si}.title" value="${esc(s.title)}" aria-label="Section title"><span class="rb-ty">${TYPES[s.type]}</span>
        <button type="button" class="rb-i" data-a="sec-up" data-s="${si}"${si === 0 ? ' disabled' : ''} title="Move up">↑</button><button type="button" class="rb-i" data-a="sec-down" data-s="${si}"${si === n - 1 ? ' disabled' : ''} title="Move down">↓</button>
        <button type="button" class="rb-i" data-a="sec-hide" data-s="${si}" title="${s.hidden ? 'Show' : 'Hide'} section">${s.hidden ? '🙈' : '👁'}</button><button type="button" class="rb-i" data-a="sec-del" data-s="${si}" title="Delete section">🗑</button></div>
      ${s.items.map((it, ii) => `<div class="rb-item"><div class="rb-ih"><b>${esc(itemLabel(s.type, it) || 'New entry')}</b><span>
        <button type="button" class="rb-i" data-a="it-up" data-s="${si}" data-i="${ii}"${ii === 0 ? ' disabled' : ''}>↑</button><button type="button" class="rb-i" data-a="it-down" data-s="${si}" data-i="${ii}"${ii === s.items.length - 1 ? ' disabled' : ''}>↓</button><button type="button" class="rb-i" data-a="it-del" data-s="${si}" data-i="${ii}" aria-label="Delete entry">✕</button></span></div>
        <div class="rb-grid">${FIELDS[s.type].map(([f, lab, ta]) => fld(`sections.${si}.items.${ii}.${f}`, lab, it[f] || '', !!ta)).join('')}</div>
        ${FIELDS[s.type].some(f => f[0] === 'bullets') ? `<button type="button" class="rb-add" data-a="ideas" data-k="sections.${si}.items.${ii}.bullets">💡 Bullet ideas & action verbs</button>` : ''}</div>`).join('')}
      <button type="button" class="rb-add" data-a="it-add" data-s="${si}">＋ Add ${esc(TYPES[s.type].toLowerCase().replace(/s$/, ''))}</button></div>`;
  }
  const itemLabel = (t, it) => ({ experience: [it.role, it.org].filter(Boolean).join(' · '), projects: it.name, education: [it.degree, it.school].filter(Boolean).join(' · '), skills: it.name, certs: it.name, list: (it.text || '').slice(0, 50), custom: it.title })[t];

  function designPane() {
    const g = doc.design;
    return `<div class="rb-card"><h3>Template</h3><div class="rb-tpls">${TEMPLATES.map(([k, n, d, ats]) => `<button type="button" class="rb-tpl${g.template === k ? ' on' : ''}" data-a="tpl" data-t="${k}"><i class="tp tp-${k}"></i><b>${n}</b><small>${d}</small><em class="${ats ? 'ok' : 'warn'}">${ats ? 'ATS ✓' : 'ATS ⚠'}</em></button>`).join('')}</div></div>
    <div class="rb-card"><h3>Colour</h3><div class="rb-row">${COLORS.map(c => `<button type="button" class="rb-sw${g.accent === c ? ' on' : ''}" data-a="color" data-c="${c}" style="background:${c}" aria-label="Colour ${c}"></button>`).join('')}<label class="rb-f rb-inline"><span>Custom</span><input type="color" data-k="design.accent" value="${g.accent}"></label></div></div>
    <div class="rb-card"><h3>Text</h3><div class="rb-grid">
      <label class="rb-f"><span>Font</span><select data-k="design.font">${Object.keys(FONTS).map(f => `<option value="${f}"${g.font === f ? ' selected' : ''}>${{ plex: 'IBM Plex Sans', arial: 'Arial', georgia: 'Georgia (serif)', times: 'Times New Roman', calibri: 'Calibri' }[f]}</option>`).join('')}</select></label>
      <label class="rb-f"><span>Size: <b id="rb-sz">${g.size}pt</b></span><input type="range" min="9" max="12" step="0.25" data-k="design.size" value="${g.size}"></label>
      <label class="rb-f"><span>Spacing</span><select data-k="design.spacing">${['compact', 'normal', 'relaxed'].map(x => `<option${g.spacing === x ? ' selected' : ''}>${x}</option>`).join('')}</select></label>
      <label class="rb-f"><span>Page margins</span><select data-k="design.margin">${['narrow', 'normal', 'wide'].map(x => `<option${g.margin === x ? ' selected' : ''}>${x}</option>`).join('')}</select></label></div>
      <p class="rb-tip">Tip: one page for less than about 5 years of experience, two pages at most. Use <b>Compact</b> and <b>narrow</b> margins if you spill slightly onto a second page.</p></div>`;
  }

  // ------------------------------------------------ input & actions
  function onInput(e) {
    const el = e.target, k = el.dataset.k; if (!k) return;
    let v = el.type === 'range' ? +el.value : el.value;
    if (k.startsWith('design.')) { setPath(doc, k, v); if (k === 'design.size') { const s = app.querySelector('#rb-sz'); if (s) s.textContent = v + 'pt'; } }
    else if (k.startsWith('cover.')) setPath(doc, k, v);
    else if (k === 'jd') { doc.jd = v; }
    else setPath(doc.data, k, v);
    save();
    if (k === 'summary') sumCount();
    if (/sections\.\d+\.items\.\d+\.(role|org|name|degree|school|title|text)$/.test(k)) { const card = el.closest('.rb-item'); if (card) { const [, si, ii] = k.match(/sections\.(\d+)\.items\.(\d+)/); const s = doc.data.sections[si]; card.querySelector('.rb-ih b').textContent = itemLabel(s.type, s.items[ii]) || 'New entry'; } }
    clearTimeout(prevT); prevT = setTimeout(drawPreview, 120);
  }
  function sumCount() { const c = app.querySelector('#rb-sumc'); if (c) { const n = (doc.data.summary.match(/\S+/g) || []).length; c.textContent = `${n} words${n && (n < 25 || n > 90) ? ' · aim for 25–90' : ''}`; } }
  function onClick(e) {
    const b = e.target.closest('[data-a]'); if (!b) return;
    const a = b.dataset.a, S = doc.data.sections, si = +b.dataset.s, ii = +b.dataset.i;
    const swap = (arr, i, j) => { [arr[i], arr[j]] = [arr[j], arr[i]]; };
    const re = () => { save(); drawEditor(); drawPreview(); };
    switch (a) {
      case 'sample': if (confirm('Replace this resume with the sample? (Duplicate it first if you want to keep it.)')) { const d = fromSample(app.querySelector('#rb-sample').value, doc.name); d.design = Object.assign({}, doc.design, { template: d.design.template }); ST.docs[ST.active] = doc = d; re(); } break;
      case 'clear': if (confirm('Clear all content in this resume?')) { const d = blankDoc(doc.name); d.design = doc.design; ST.docs[ST.active] = doc = d; re(); } break;
      case 'l24': importModal(); break;
      case 'link-add': doc.data.basics.links.push({ label: 'Portfolio', url: '' }); re(); break;
      case 'link-del': doc.data.basics.links.splice(ii, 1); re(); break;
      case 'sec-add': { const t = app.querySelector('#rb-newsec').value; S.push({ id: uid(), type: t, title: TYPES[t], items: [] }); re(); break; }
      case 'sec-up': swap(S, si, si - 1); re(); break;
      case 'sec-down': swap(S, si, si + 1); re(); break;
      case 'sec-hide': S[si].hidden = !S[si].hidden; re(); break;
      case 'sec-del': if (confirm(`Delete the section "${S[si].title}"?`)) { S.splice(si, 1); re(); } break;
      case 'it-add': S[si].items.push({}); re(); setTimeout(() => { const c = app.querySelectorAll(`#sec-${S[si].id} .rb-item`); const last = c[c.length - 1]; if (last) { last.scrollIntoView({ block: 'center' }); const i = last.querySelector('input,textarea'); i && i.focus(); } }, 30); break;
      case 'it-up': swap(S[si].items, ii, ii - 1); re(); break;
      case 'it-down': swap(S[si].items, ii, ii + 1); re(); break;
      case 'it-del': S[si].items.splice(ii, 1); re(); break;
      case 'ideas': ideasModal(b.dataset.k); break;
      case 'tpl': doc.design.template = b.dataset.t; re(); break;
      case 'color': doc.design.accent = b.dataset.c; re(); break;
      case 'new': newModal(); break;
      case 'dup': { const id = uid(); ST.docs[id] = clone(doc); ST.docs[id].name = doc.name + ' (copy)'; ST.active = id; doc = ST.docs[id]; save(); paintDocs(); drawEditor(); drawPreview(); toast('Duplicated: tailor this copy for a specific job'); break; }
      case 'rename': { const n = prompt('Name this resume version (e.g. "GenAI – Contoso"):', doc.name); if (n && n.trim()) { doc.name = n.trim(); save(); paintDocs(); } break; }
      case 'del': if (Object.keys(ST.docs).length < 2) { toast('This is your only resume, so it cannot be deleted'); break; }
        if (confirm(`Delete "${doc.name}"? This cannot be undone.`)) { delete ST.docs[ST.active]; ST.active = Object.keys(ST.docs)[0]; doc = ST.docs[ST.active]; LS.set(KEY, ST); paintDocs(); drawEditor(); drawPreview(); } break;
      case 'import': app.querySelector('#rb-file').click(); break;
      case 'json': download(`${slug(doc.name)}.json`, JSON.stringify({ learn24Resume: 1, ...doc }, null, 2), 'application/json'); break;
      case 'txt': textModal(); break;
      case 'pdf': printDoc('resume'); break;
      case 'close': closeModal(); break;
      case 'ats-run': runATS(); break;
      case 'ats-add': addSkill(b.dataset.w); b.remove(); break;
      case 'cover-gen': genCover(); break;
      case 'cover-pdf': printDoc('cover'); break;
      case 'cover-copy': copy(doc.cover.text); break;
      case 'goto': gotoField(b.dataset.k); break;
    }
  }
  const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'resume';
  function toast(m) { L24 ? L24.toast(m) : alert(m); }
  function download(name, text, type) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }
  function copy(t) { if (navigator.clipboard) navigator.clipboard.writeText(t).then(() => toast('Copied to clipboard')); }
  function gotoField(k) { tab = 'content'; drawEditor(); setTimeout(() => { const el = app.querySelector(`[data-k="${k}"]`); if (el) { el.scrollIntoView({ block: 'center' }); el.focus(); el.classList.add('rb-flash'); setTimeout(() => el.classList.remove('rb-flash'), 1600); } }, 30); }

  // ------------------------------------------------ preview
  const href = u => { u = String(u || '').trim(); if (!u) return ''; if (/^mailto:|^https?:\/\//i.test(u)) return u; if (/^[\w.+-]+@[\w-]+\.[\w.]+$/.test(u)) return 'mailto:' + u; return 'https://' + u; };
  const dates = (a, b) => [a, b].filter(Boolean).join(' – ');
  const lbl = t => { const m = /^([A-Z][A-Za-z &/+\-]{1,22}):\s+(.*)$/.exec(t); return m ? `<b class="r-lb">${esc(m[1])}:</b> ${esc(m[2])}` : esc(t); };
  function renderDoc() {
    const d = doc.data, g = doc.design, b = d.basics;
    const contact = [b.email && `<a href="mailto:${esc(b.email)}">${esc(b.email)}</a>`, b.phone && esc(b.phone), b.location && esc(b.location),
      ...b.links.filter(l => l.url).map(l => `<a href="${esc(href(l.url))}">${esc(l.url.replace(/^https?:\/\/(www\.)?/, ''))}</a>`)].filter(Boolean);
    const head = `<header class="r-head"><h1>${esc(b.name || 'Your Name')}</h1>${b.title ? `<div class="r-title">${esc(b.title)}</div>` : ''}<div class="r-contact">${contact.join('<span class="r-dot"> | </span>')}</div></header>`;
    const sec = s => {
      if (s.hidden || !s.items.length) return '';
      const items = s.items.map(it => {
        const ul = x => lines(x).length ? `<ul>${lines(x).map(l => `<li>${lbl(l)}</li>`).join('')}</ul>` : '';
        switch (s.type) {
          case 'experience': return `<div class="r-it"><div class="r-row"><b>${esc(it.role)}</b>${it.org ? `<span class="r-org">${esc(it.org)}</span>` : ''}<span class="r-date">${esc(dates(it.start, it.end))}</span></div>${it.location ? `<div class="r-sub">${esc(it.location)}</div>` : ''}${ul(it.bullets)}</div>`;
          case 'projects': { const meta = [it.domain && `Domain: ${esc(it.domain)}`, it.ptype && `Type: ${esc(it.ptype)}`, it.date && it.link && `<a href="${esc(href(it.link))}">${esc(it.link.replace(/^https?:\/\//, ''))}</a>`].filter(Boolean);
            const right = it.date ? `<span class="r-date">${esc(it.date)}</span>` : it.link ? `<a class="r-date" href="${esc(href(it.link))}">${esc(it.link.replace(/^https?:\/\//, ''))}</a>` : '';
            return `<div class="r-it"><div class="r-row"><b>${esc(it.name)}</b>${it.tech ? `<span class="r-org">${esc(it.tech)}</span>` : ''}${right}</div>${meta.length ? `<div class="r-sub">${meta.join('<span class="r-dot"> | </span>')}</div>` : ''}${ul(it.bullets)}</div>`; }
          case 'education': return `<div class="r-it"><div class="r-row"><b>${esc(it.degree)}</b><span class="r-org">${esc([it.school, it.location].filter(Boolean).join(', '))}</span><span class="r-date">${esc(dates(it.start, it.end))}</span></div>${it.score ? `<div class="r-sub">${esc(it.score)}</div>` : ''}</div>`;
          case 'skills': return `<div class="r-skill">${it.name ? `<b>${esc(it.name)}:</b> ` : ''}<span>${esc(kws(it.keywords).join(', '))}</span></div>`;
          case 'certs': return `<div class="r-it r-cert"><div class="r-row"><b>${esc(it.name)}</b><span class="r-org">${esc(it.issuer || '')}</span><span class="r-date">${it.link ? `<a href="${esc(href(it.link))}">${esc(it.date || 'link')}</a>` : esc(it.date || '')}</span></div></div>`;
          case 'list': return `<li>${lbl(it.text)}</li>`;
          case 'custom': return `<div class="r-it"><div class="r-row"><b>${esc(it.title)}</b><span class="r-org">${esc(it.subtitle || '')}</span><span class="r-date">${esc(it.date || '')}</span></div>${ul(it.bullets)}</div>`;
        }
      }).join('');
      return `<section class="r-sec r-${s.type}"><h2>${esc(s.title)}</h2>${s.type === 'list' ? `<ul class="r-list">${items}</ul>` : items}</section>`;
    };
    const summary = d.summary.trim() ? `<section class="r-sec r-summary"><h2>${g.template === 'executive' ? 'Executive Summary' : 'Professional Summary'}</h2><p>${esc(d.summary)}</p></section>` : '';
    if (g.template === 'sidebar') {
      const side = d.sections.filter(s => ['skills', 'education', 'certs'].includes(s.type)), main = d.sections.filter(s => !side.includes(s));
      return head + `<div class="r-cols"><div class="r-side">${side.map(sec).join('')}</div><div class="r-main">${summary}${main.map(sec).join('')}</div></div>`;
    }
    return head + summary + d.sections.map(sec).join('');
  }
  function styleVars(el) {
    const g = doc.design, sp = { compact: 0.8, normal: 1, relaxed: 1.25 }[g.spacing] || 1, mg = { narrow: 10, normal: 14, wide: 19 }[g.margin] || 14;
    el.style.setProperty('--r-ac', g.accent); el.style.setProperty('--r-font', FONTS[g.font] || FONTS.plex);
    el.style.setProperty('--r-size', g.size + 'pt'); el.style.setProperty('--r-sp', sp); el.style.setProperty('--r-mg', mg + 'mm');
  }
  let cur = 1;
  function drawPreview() {
    const el = app.querySelector('#rdoc'); if (!el) return;
    el.className = 'rdoc tpl-' + doc.design.template; styleVars(el);
    el.innerHTML = renderDoc();
    requestAnimationFrame(() => { applyZoom(zoom || cur); const pages = el.scrollHeight / (297 * 96 / 25.4); const n = Math.max(1, Math.ceil(pages - 0.02));
      const p = app.querySelector('#rb-pages'); p.textContent = `${n} page${n > 1 ? 's' : ''}`; p.className = n > 2 ? 'warn' : ''; });
  }
  function fitZoom() { const st = app.querySelector('#rb-stage'); if (!st) return; const w = st.clientWidth - 24; applyZoom(Math.min(1, Math.max(0.35, w / (210 * 96 / 25.4)))); }
  function applyZoom(z) {
    cur = z; const el = app.querySelector('#rdoc'), sc = app.querySelector('#rb-scale'); if (!el) return;
    el.style.transform = `scale(${z})`; sc.style.width = (210 * 96 / 25.4 * z) + 'px'; sc.style.height = (el.offsetHeight * z) + 'px';
    app.querySelector('#rb-zoom').textContent = Math.round(z * 100) + '%';
  }
  function printDoc(which) {
    if (which === 'cover') { const c = app.querySelector('#rcover'); c.className = 'rdoc rcover tpl-' + doc.design.template; styleVars(c); c.innerHTML = coverHTML(); }
    document.body.classList.toggle('rb-print-cover', which === 'cover');
    const old = document.title; document.title = `${doc.data.basics.name || 'Resume'} - ${which === 'cover' ? 'Cover Letter' : 'Resume'}`;
    if (L24 && !(L24.S.resume || {}).pdf) { L24.S.resume = { pdf: 1 }; L24.addXP(20, 'resume'); }
    setTimeout(() => { window.print(); document.title = old; }, 50);
  }

  // ------------------------------------------------ modals
  function modal(html) { app.querySelector('#rb-mbody').innerHTML = html; app.querySelector('#rb-modal').hidden = false; }
  function closeModal() { app.querySelector('#rb-modal').hidden = true; if (/import=/.test(location.hash)) history.replaceState(null, '', location.pathname); }
  app.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
  function newModal() {
    modal(`<h3>New resume</h3><p>Start from a blank page or a sample, or duplicate the current one to tailor it for a job.</p><div class="rb-grid">
      <label class="rb-f"><span>Name</span><input id="rb-nn" value="Resume ${Object.keys(ST.docs).length + 1}"></label>
      <label class="rb-f"><span>Start from</span><select id="rb-ns"><option value="">Blank</option>${Object.keys(DATA.samples).map(k => `<option>${esc(k)}</option>`).join('')}</select></label></div>
      <div class="rb-row"><button type="button" class="rb-b rb-pri" id="rb-nok">Create</button></div>`);
    app.querySelector('#rb-nok').onclick = () => { const id = uid(), s = app.querySelector('#rb-ns').value, n = app.querySelector('#rb-nn').value.trim() || 'Resume';
      ST.docs[id] = s ? fromSample(s, n) : blankDoc(n); ST.active = id; doc = ST.docs[id]; save(); paintDocs(); closeModal(); tab = 'content'; drawEditor(); drawPreview(); };
  }
  function ideasModal(k) {
    const target = () => app.querySelector(`[data-k="${k}"]`);
    modal(`<h3>💡 Bullet ideas</h3><p class="rb-tip">Formula: <b>Action verb + what you did + how (tools) + measurable result.</b> Replace every {placeholder} with your real facts and numbers.</p>
      <h4>Action verbs</h4>${Object.entries(DATA.verbs).map(([g, vs]) => `<div class="rb-chips"><small>${esc(g)}</small>${vs.map(v => `<button type="button" data-ins="${esc(v)} ">${esc(v)}</button>`).join('')}</div>`).join('')}
      <h4>Bullet templates</h4>${Object.entries(DATA.bullets).map(([g, bs]) => `<details><summary>${esc(g)}</summary>${bs.map(x => `<button type="button" class="rb-idea" data-ins="${esc(x)}">${esc(x)}</button>`).join('')}</details>`).join('')}
      <h4>Avoid these weak phrases</h4><p class="rb-tip">${DATA.weak.map(w => `“${esc(w)}”`).join(', ')}: replace them with what you actually did and achieved.</p>`);
    app.querySelector('#rb-mbody').onclick = e => { const b = e.target.closest('[data-ins]'); if (!b) return; const t = target(); if (!t) return;
      const val = b.dataset.ins.endsWith(' ') ? b.dataset.ins : b.dataset.ins; t.value = t.value.trim() ? t.value.replace(/\s*$/, '') + '\n' + val : val; t.dispatchEvent(new Event('input', { bubbles: true })); toast('Added: edit the placeholders'); };
  }
  function importModal(pre) {
    const done = LS.get('learn24-done', []), S = (L24 && L24.S) || {}, certs = Object.keys(S.certs || {}), solved = Object.keys((S.dsa && S.dsa.solved) || {}).length, az = (S.az && S.az.best) || {};
    modal(`<h3>⭐ Import from your Learn24 progress</h3><p class="rb-tip">Ready-made resume bullets for projects you built, and certificates you earned on Learn24. Ticked items are ones you completed. <b>Only add what you actually built</b>, and replace sample numbers with your own.</p>
      <h4>Projects</h4><div class="rb-checks">${DATA.projects.map((p, i) => `<label><input type="checkbox" data-p="${i}"${done.includes(p.key) || p.key === pre ? ' checked' : ''}><span><b>${esc(p.name)}</b> <small>${esc(p.tech)}</small>${done.includes(p.key) ? ' <em>✓ completed</em>' : ''}</span></label>`).join('')}</div>
      <h4>Certificates</h4>${certs.length ? `<div class="rb-checks">${certs.map(c => `<label><input type="checkbox" data-c="${esc(c)}" checked><span><b>${esc(DATA.certs[c] || c)}</b> <small>Learn24</small></span></label>`).join('')}</div>` : '<p class="rb-tip">No Learn24 certificates yet: <a href="' + base + 'certificate/index.html">see how to earn them</a>.</p>'}
      <h4>Achievements</h4><div class="rb-checks">${solved ? `<label><input type="checkbox" data-x="dsa" checked><span>Solved ${solved} data-structures &amp; algorithms problems (Learn24 DSA)</span></label>` : ''}${az.mock3 !== undefined ? `<label><input type="checkbox" data-x="az"><span>AI-901 practice: ${az.mock3}% on a full-length mock exam</span></label>` : ''}${!solved && az.mock3 === undefined ? '<p class="rb-tip">Solve DSA problems or take AI-901 mocks to add achievements here.</p>' : ''}</div>
      <div class="rb-row"><button type="button" class="rb-b rb-pri" id="rb-iok">Add selected to my resume</button></div>`);
    app.querySelector('#rb-iok').onclick = () => {
      const box = app.querySelector('#rb-mbody'), secOf = (t, title) => { let s = doc.data.sections.find(x => x.type === t); if (!s) { s = { id: uid(), type: t, title, items: [] }; doc.data.sections.push(s); } return s; };
      let n = 0;
      box.querySelectorAll('[data-p]:checked').forEach(c => { const p = DATA.projects[+c.dataset.p], s = secOf('projects', 'Projects'); if (!s.items.some(x => x.name === p.name)) { s.items.push({ name: p.name, tech: p.tech, link: '', bullets: p.bullets.join('\n') }); n++; } });
      box.querySelectorAll('[data-c]:checked').forEach(c => { const s = secOf('certs', 'Certifications'), name = DATA.certs[c.dataset.c] || c.dataset.c; if (!s.items.some(x => x.name === name)) { s.items.push({ name, issuer: 'Learn24', date: String(new Date().getFullYear()), link: '' }); n++; } });
      box.querySelectorAll('[data-x]:checked').forEach(c => { const s = secOf('list', 'Achievements'), text = c.dataset.x === 'dsa' ? `Solved ${solved}+ data-structures and algorithms problems across arrays, trees, graphs and dynamic programming.` : `Scored ${az.mock3}% on a full-length AI-901 (Azure AI Fundamentals) practice exam.`; if (!s.items.some(x => x.text === text)) { s.items.push({ text }); n++; } });
      save(); closeModal(); tab = 'content'; drawEditor(); drawPreview(); toast(n ? `Added ${n} item${n > 1 ? 's' : ''}` : 'Nothing new to add');
    };
  }
  function plainText() {
    const d = doc.data, b = d.basics, out = [b.name, b.title, [b.email, b.phone, b.location, ...b.links.filter(l => l.url).map(l => l.url)].filter(Boolean).join(' | '), ''];
    if (d.summary) out.push('SUMMARY', d.summary, '');
    d.sections.filter(s => !s.hidden && s.items.length).forEach(s => {
      out.push(s.title.toUpperCase());
      s.items.forEach(it => {
        if (s.type === 'skills') out.push(`${it.name ? it.name + ': ' : ''}${kws(it.keywords).join(', ')}`);
        else if (s.type === 'list') out.push('- ' + it.text);
        else { const head = { experience: [it.role, it.org, it.location, dates(it.start, it.end)], projects: [it.name, it.tech, it.date, it.domain && 'Domain: ' + it.domain, it.ptype && 'Type: ' + it.ptype, it.link], education: [it.degree, it.school, it.location, dates(it.start, it.end), it.score], certs: [it.name, it.issuer, it.date], custom: [it.title, it.subtitle, it.date] }[s.type].filter(Boolean).join(' | ');
          out.push(head); lines(it.bullets).forEach(l => out.push('- ' + l)); }
      });
      out.push('');
    });
    return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }
  function textModal() {
    const t = plainText();
    modal(`<h3>Plain-text resume</h3><p class="rb-tip">Paste this into job portals that ask you to fill in a text box, or to check what an ATS “sees”.</p><textarea class="rb-txt" readonly>${esc(t)}</textarea>
      <div class="rb-row"><button type="button" class="rb-b rb-pri" id="rb-tc">Copy</button><button type="button" class="rb-b" id="rb-td">Download .txt</button></div>`);
    app.querySelector('#rb-tc').onclick = () => copy(t); app.querySelector('#rb-td').onclick = () => download(`${slug(doc.name)}.txt`, t, 'text/plain');
  }
  function onImportFile(e) {
    const f = e.target.files[0]; if (!f) return;
    f.text().then(txt => {
      let j; try { j = JSON.parse(txt); } catch (err) { toast('That file is not valid JSON'); return; }
      let d;
      if (j.data && j.data.basics && Array.isArray(j.data.sections)) d = Object.assign(blankDoc(j.name || f.name.replace(/\.json$/, '')), { data: j.data, design: j.design || blankDoc('').design, jd: j.jd || '', cover: j.cover || blankDoc('').cover });
      else if (j.basics || j.work) d = fromJsonResume(j, f.name.replace(/\.json$/, ''));
      else { toast('Unrecognised format. Use a Learn24 export or a JSON Resume file.'); return; }
      d.data.sections.forEach(s => s.id = s.id || uid());
      const id = uid(); ST.docs[id] = d; ST.active = id; doc = d; save(); paintDocs(); drawEditor(); drawPreview(); toast('Imported as a new version');
    });
    e.target.value = '';
  }
  function fromJsonResume(j, name) { // jsonresume.org schema
    const d = blankDoc(name), b = j.basics || {};
    d.data.basics = { name: b.name || '', title: b.label || '', email: b.email || '', phone: b.phone || '', location: [b.location && b.location.city, b.location && b.location.countryCode].filter(Boolean).join(', '),
      links: (b.profiles || []).map(p => ({ label: p.network || 'Link', url: p.url || p.username || '' })).concat(b.url ? [{ label: 'Website', url: b.url }] : []) };
    d.data.summary = b.summary || '';
    const S = [];
    if (j.work) S.push({ id: uid(), type: 'experience', title: 'Experience', items: j.work.map(w => ({ role: w.position, org: w.name || w.company, location: w.location || '', start: w.startDate || '', end: w.endDate || 'Present', bullets: (w.highlights || []).join('\n') || w.summary || '' })) });
    if (j.projects) S.push({ id: uid(), type: 'projects', title: 'Projects', items: j.projects.map(p => ({ name: p.name, tech: (p.keywords || []).join(', '), link: p.url || '', bullets: (p.highlights || []).join('\n') || p.description || '' })) });
    if (j.skills) S.push({ id: uid(), type: 'skills', title: 'Skills', items: j.skills.map(s => ({ name: s.name, keywords: (s.keywords || []).join(', ') })) });
    if (j.education) S.push({ id: uid(), type: 'education', title: 'Education', items: j.education.map(e => ({ degree: [e.studyType, e.area].filter(Boolean).join(', '), school: e.institution, start: e.startDate || '', end: e.endDate || '', score: e.score || '' })) });
    if (j.certificates) S.push({ id: uid(), type: 'certs', title: 'Certifications', items: j.certificates.map(c => ({ name: c.name, issuer: c.issuer || '', date: c.date || '', link: c.url || '' })) });
    if (j.awards) S.push({ id: uid(), type: 'list', title: 'Achievements', items: j.awards.map(a => ({ text: [a.title, a.awarder, a.date].filter(Boolean).join(', ') })) });
    d.data.sections = S.length ? S : d.data.sections; return d;
  }

  // ------------------------------------------------ ATS keyword match
  const DICT = () => DICT.c || (DICT.c = Object.entries(DATA.skills).flatMap(([grp, m]) => Object.entries(m).map(([name, al]) => ({ name, grp, pats: [name.toLowerCase(), ...al.map(a => a.toLowerCase())].map(p => new RegExp('(^|[^a-z0-9+#])' + p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?=$|[^a-z0-9+#])', 'g')) }))));
  const resumeText = () => plainText().toLowerCase();
  function findSkills(text) { const t = ' ' + String(text).toLowerCase() + ' ', out = []; DICT().forEach(s => { let n = 0; s.pats.forEach(p => { p.lastIndex = 0; n += (t.match(p) || []).length; }); if (n) out.push({ ...s, n }); }); return out; }
  const STOP = new Set('a an and or the of to in for with on at by from as is are be will you your our we us this that it its their they who what which have has into across within using use able must should can may etc role team work working experience years year strong good excellent ability skills knowledge understanding including such other new also more based all any not job candidates candidate looking required preferred responsibilities requirements plus well about over through key ensure help'.split(' '));
  function atsPane() {
    return `<div class="rb-card"><h3>🎯 Match your resume to a job</h3><p class="rb-tip">Paste the job description. You’ll see which skills and keywords the job asks for, which your resume already covers, and what is missing. Applicant tracking systems (ATS) and recruiters both scan for these.</p>
      <textarea data-k="jd" rows="9" class="rb-jd" placeholder="Paste the full job description here…">${esc(doc.jd)}</textarea>
      <div class="rb-row"><button type="button" class="rb-b rb-pri" data-a="ats-run">Analyze match</button></div></div><div id="rb-ats"></div>`;
  }
  function runATS() {
    const out = app.querySelector('#rb-ats'); if (!out) return; const jd = doc.jd.trim();
    if (jd.length < 80) { out.innerHTML = '<div class="rb-card"><p class="rb-tip">Paste a full job description (at least a few lines) to analyse.</p></div>'; return; }
    const want = findSkills(jd).sort((a, b) => b.n - a.n), have = new Set(findSkills(resumeText()).map(s => s.name));
    const hit = want.filter(s => have.has(s.name)), miss = want.filter(s => !have.has(s.name));
    const pct = want.length ? Math.round(hit.length / want.length * 100) : 0;
    const words = jd.toLowerCase().replace(/[^a-z0-9+#.\- ]/g, ' ').split(/\s+/).filter(w => w.length > 3 && !STOP.has(w) && !/^\d+$/.test(w));
    const freq = {}; words.forEach(w => freq[w] = (freq[w] || 0) + 1);
    const known = new Set(want.flatMap(s => s.name.toLowerCase().split(' '))), rt = resumeText();
    const other = Object.entries(freq).filter(([w, n]) => n >= 2 && !known.has(w)).sort((a, b) => b[1] - a[1]).slice(0, 14);
    const titleWords = (doc.data.basics.title || '').toLowerCase();
    const firstLine = jd.split('\n').find(l => l.trim()) || '';
    const titleHit = titleWords && firstLine.toLowerCase().split(/\W+/).filter(w => w.length > 2 && !STOP.has(w)).some(w => titleWords.includes(w));
    out.innerHTML = `<div class="rb-card"><div class="rb-score"><div class="rb-ring" style="--p:${pct};--c:${pct >= 75 ? 'var(--green)' : pct >= 50 ? 'var(--amber)' : 'var(--red)'}"><b>${pct}%</b></div>
      <div><b>${pct >= 75 ? 'Strong match' : pct >= 50 ? 'Decent match: close the gaps' : 'Low match: tailor this resume'}</b><p class="rb-tip">${hit.length} of ${want.length} skills from the job description appear in your resume. Aim for 75%+ by adding skills you <b>really</b> have, ideally inside experience or project bullets rather than only the skills list.</p></div></div>
      <h4>✅ Found in your resume (${hit.length})</h4><div class="rb-kw">${hit.map(s => `<span class="ok">${esc(s.name)}${s.n > 1 ? ` ×${s.n}` : ''}</span>`).join('') || '<em>none yet</em>'}</div>
      <h4>❌ Missing (${miss.length})</h4><div class="rb-kw">${miss.map(s => `<button type="button" class="no" data-a="ats-add" data-w="${esc(s.name)}" title="Add to your skills section">＋ ${esc(s.name)}${s.n > 1 ? ` ×${s.n}` : ''}</button>`).join('') || '<em>nothing important is missing 🎉</em>'}</div>
      ${miss.length ? '<p class="rb-tip">Click a missing skill to add it to your skills section. Then mention it in a bullet that shows how you used it.</p>' : ''}
      ${other.length ? `<h4>Other repeated words in the job description</h4><div class="rb-kw">${other.map(([w, n]) => `<span class="${rt.includes(w) ? 'ok' : 'neu'}">${esc(w)} ×${n}</span>`).join('')}</div>` : ''}
      <h4>Format checks</h4><ul class="rb-checklist">
        <li class="${titleHit ? 'ok' : 'warn'}">${titleHit ? 'Your headline matches the job title wording' : 'Consider making your headline match the job title (for example “' + esc(firstLine.slice(0, 60)) + '”)'}</li>
        <li class="${doc.design.template !== 'sidebar' ? 'ok' : 'warn'}">${doc.design.template !== 'sidebar' ? 'Single-column template: easy for ATS to read' : 'Two-column template: switch to a single-column template when you apply through an ATS'}</li>
        <li class="ok">Standard section headings and a text-based PDF (not an image), as used by this builder</li></ul></div>`;
  }
  function addSkill(name) {
    let s = doc.data.sections.find(x => x.type === 'skills'); if (!s) { s = { id: uid(), type: 'skills', title: 'Skills', items: [] }; doc.data.sections.push(s); }
    let g = s.items.find(i => /additional|other/i.test(i.name || '')); if (!g) { g = { name: 'Additional', keywords: '' }; s.items.push(g); }
    g.keywords = kws(g.keywords).concat(name).join(', '); save(); drawPreview(); toast(`Added “${name}” to Skills`);
  }

  // ------------------------------------------------ resume score
  function scorePane() { return '<div id="rb-score"></div>'; }
  function runScore() {
    const d = doc.data, b = d.basics, tips = [], verbs = new Set(Object.values(DATA.verbs).flat().map(v => v.toLowerCase()).concat('achieved,added,applied,authored,collaborated,conducted,configured,converted,curated,defined,delivered,documented,established,expanded,generated,grew,handled,integrated,introduced,leveraged,maintained,managed,migrated,monitored,negotiated,organised,organized,performed,planned,prepared,produced,published,ran,rebuilt,redesigned,refactored,resolved,saved,secured,set,simplified,solved,standardised,supported,tested,transformed,tuned,upgraded,wrote,won,answers,converts'.split(',')));
    let pts = 0;
    const add = (ok, p, msg, k) => { if (ok) pts += p; else tips.push({ msg, k }); return ok; };
    add(!!b.name.trim(), 4, 'Add your full name', 'basics.name'); add(/\S+@\S+\.\S+/.test(b.email), 3, 'Add a professional email address', 'basics.email');
    add(b.phone.replace(/\D/g, '').length >= 10, 3, 'Add a phone number with country code', 'basics.phone'); add(!!b.location.trim(), 2, 'Add your city and country', 'basics.location');
    add(b.links.some(l => /linkedin|github|portfolio|\./i.test(l.url)), 3, 'Add a LinkedIn or GitHub link', 'basics.links.0.url'); add(!!b.title.trim(), 5, 'Add a headline that matches your target role', 'basics.title');
    const sw = (d.summary.match(/\S+/g) || []).length; add(sw >= 25 && sw <= 90, 7, sw ? `Make the summary 25–90 words (now ${sw})` : 'Add a short summary', 'summary'); add(/\d/.test(d.summary), 3, 'Add a number to your summary (years, users, impact)', 'summary');
    const bl = []; d.sections.forEach((s, si) => !s.hidden && (s.type === 'experience' || s.type === 'projects' || s.type === 'custom') && s.items.forEach((it, ii) => lines(it.bullets).forEach(t => bl.push({ t, k: `sections.${si}.items.${ii}.bullets`, where: itemLabel(s.type, it) }))));
    if (!bl.length) add(false, 35, 'Add experience or project bullets describing what you achieved', d.sections.find(s => s.type === 'experience') ? `sections.${d.sections.findIndex(s => s.type === 'experience')}.items.0.bullets` : 'summary');
    else {
      let good = 0;
      bl.forEach(x => { const w = x.t.split(/\s+/), first = (w[0] || '').toLowerCase().replace(/[^a-z]/g, ''), issues = [];
        if (!verbs.has(first) && !/ed$/.test(first)) issues.push('start with an action verb');
        if (!/\d/.test(x.t)) issues.push('add a number (%, ₹, time, users)');
        if (w.length < 8) issues.push('add more detail'); if (w.length > 40) issues.push('shorten it');
        const weak = DATA.weak.find(p => x.t.toLowerCase().includes(p)); if (weak) issues.push(`replace “${weak}”`);
        if (/\b(i|my|me)\b/i.test(x.t)) issues.push('drop “I / my”');
        if (!issues.length) good++; else if (tips.filter(t => t.bullet).length < 8) tips.push({ msg: `${x.where}: “${x.t.slice(0, 60)}${x.t.length > 60 ? '…' : ''}”: ${issues.join(', ')}`, k: x.k, bullet: 1 }); });
      pts += Math.round(35 * good / bl.length);
      const quant = bl.filter(x => /\d/.test(x.t)).length / bl.length;
      if (quant < 0.5) tips.unshift({ msg: `Only ${Math.round(quant * 100)}% of your bullets contain a number. Aim for at least half: recruiters look for measurable impact.` });
    }
    const skills = d.sections.filter(s => s.type === 'skills' && !s.hidden).flatMap(s => s.items.flatMap(i => kws(i.keywords)));
    add(skills.length >= 8, 8, `List at least 8 relevant skills (now ${skills.length})`, d.sections.findIndex(s => s.type === 'skills') >= 0 ? `sections.${d.sections.findIndex(s => s.type === 'skills')}.items.0.keywords` : null);
    add(skills.length <= 40, 2, 'Trim the skills list to the most relevant 15–30');
    const edu = d.sections.find(s => s.type === 'education' && !s.hidden && s.items.length); add(!!edu, 5, 'Add your education');
    const exp = d.sections.find(s => s.type === 'experience' && !s.hidden && s.items.length);
    add(!exp || exp.items.every(it => it.start && it.end), 5, 'Add start and end dates to every job', exp ? `sections.${d.sections.indexOf(exp)}.items.0.start` : null);
    const el = app.querySelector('#rdoc'), pages = el ? el.scrollHeight / (297 * 96 / 25.4) : 1;
    add(pages <= (exp ? 2.02 : 1.05), 7, exp ? 'Keep the resume to 2 pages at most' : 'Fit a fresher resume on one page (Design → Compact, narrow margins)');
    add(doc.design.template !== 'sidebar', 3, 'Use a single-column template for ATS applications');
    const score = Math.min(100, pts);
    app.querySelector('#rb-score').innerHTML = `<div class="rb-card"><div class="rb-score"><div class="rb-ring" style="--p:${score};--c:${score >= 80 ? 'var(--green)' : score >= 60 ? 'var(--amber)' : 'var(--red)'}"><b>${score}</b></div>
      <div><b>${score >= 85 ? 'Excellent resume' : score >= 70 ? 'Good, with a few fixes to make' : score >= 50 ? 'Needs work' : 'Just getting started'}</b><p class="rb-tip">Scored on contact details, headline and summary, bullet quality (action verbs, numbers, length, weak phrases), skills, education, dates, length and ATS-friendliness. Content quality matters more than any score.</p></div></div>
      <h4>${tips.length ? `Suggestions (${tips.length})` : 'No suggestions: great work!'}</h4><ul class="rb-fixes">${tips.map(t => `<li>${esc(t.msg)}${t.k ? ` <button type="button" class="rb-add" data-a="goto" data-k="${t.k}">Fix →</button>` : ''}</li>`).join('')}</ul></div>`;
  }

  // ------------------------------------------------ cover letter
  function coverPane() {
    const c = doc.cover;
    return `<div class="rb-card"><h3>✉️ Cover letter</h3><p class="rb-tip">Fill in the job details and generate a first draft from your resume (and the job description in the ATS tab, if you pasted one). Then edit it so it sounds like you.</p>
      <div class="rb-grid">${fld('cover.company', 'Company', c.company)}${fld('cover.role', 'Role', c.role)}${fld('cover.manager', 'Hiring manager (optional)', c.manager)}</div>
      ${fld('cover.why', 'Why this company? (one specific reason)', c.why, true, 'e.g. your work on UPI fraud prevention for small merchants')}
      <div class="rb-row"><button type="button" class="rb-b rb-pri" data-a="cover-gen">Generate draft</button></div>
      ${fld('cover.text', 'Your letter (editable)', c.text, true)}
      <div class="rb-row"><button type="button" class="rb-b" data-a="cover-copy">Copy</button><button type="button" class="rb-b" data-a="cover-pdf">⬇ Download PDF</button></div></div>`;
  }
  function genCover() {
    const d = doc.data, b = d.basics, c = doc.cover, exp = (d.sections.find(s => s.type === 'experience' && s.items.length) || {}).items, proj = (d.sections.find(s => s.type === 'projects' && s.items.length) || {}).items;
    const skillsAll = d.sections.filter(s => s.type === 'skills').flatMap(s => s.items.flatMap(i => kws(i.keywords)));
    const jdSkills = doc.jd ? findSkills(doc.jd).map(s => s.name) : [], have = new Set(findSkills(resumeText()).map(s => s.name));
    const top = (jdSkills.filter(s => have.has(s)).concat(skillsAll)).filter((v, i, a) => a.indexOf(v) === i).slice(0, 3);
    const role = c.role || (b.title || '').split('|')[0].replace(/\(.*?\)/g, '').trim() || 'this role', co = c.company || 'your company';
    const latest = exp && exp[0], proof = latest ? lines(latest.bullets)[0] : proj ? lines(proj[0].bullets)[0] : '';
    const p = [`Dear ${c.manager || 'Hiring Manager'},`,
      `I am writing to apply for the ${role} position at ${co}. ${latest ? `As ${/^[aeiou]/i.test(latest.role) ? 'an' : 'a'} ${latest.role} at ${latest.org}, I` : 'I'} work with ${top.length ? top.slice(0, -1).join(', ') + (top.length > 1 ? ' and ' : '') + top[top.length - 1] : 'modern AI and data tools'}, and I would love to bring that experience to your team.`,
      proof ? `A recent example of my work: ${proof.replace(/\.$/, '')}.${proj && latest ? ` I have also built ${proj[0].name}${proj[0].tech ? ` (${proj[0].tech})` : ''}.` : ''}` : '',
      c.why ? `What draws me to ${co} is ${c.why.replace(/\.$/, '')}. I would welcome the chance to contribute to that work.` : `I am excited about ${co}'s work and would welcome the chance to contribute.`,
      `Thank you for considering my application. I would be glad to discuss how I can help ${co}${jdSkills.length ? `, especially with ${jdSkills.slice(0, 2).join(' and ')}` : ''}.`,
      `Sincerely,\n${b.name || 'Your Name'}`].filter(Boolean);
    c.text = p.join('\n\n'); save(); drawEditor(); toast('Draft ready: personalise it before sending');
  }
  function coverHTML() {
    const b = doc.data.basics, today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    return `<header class="r-head"><h1>${esc(b.name || 'Your Name')}</h1>${b.title ? `<div class="r-title">${esc(b.title)}</div>` : ''}<div class="r-contact">${[b.email, b.phone, b.location].filter(Boolean).map(esc).join('<span class="r-dot"> | </span>')}</div></header>
      <div class="r-letter"><p>${esc(today)}</p>${doc.cover.company ? `<p>${esc(doc.cover.company)}</p>` : ''}${esc(doc.cover.text || 'Generate or write your letter in the Cover letter tab.').split(/\n\n+/).map(x => `<p>${x.replace(/\n/g, '<br>')}</p>`).join('')}</div>`;
  }
})();
