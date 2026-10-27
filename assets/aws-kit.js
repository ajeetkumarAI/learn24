/* Learn24 AWS course tools: interactive demos used by the AWS Solutions Architect lessons.
   bits (binary ⇄ decimal), subnet (IP/CIDR calculator), ec2name (instance type decoder),
   scale (on-premises vs cloud capacity), shell (practice Linux terminal). */
(function () {
  const A = window.Article; if (!A) return;
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const box = (el, html) => { const d = document.createElement('div'); d.innerHTML = html; el.append(d); return d; };
  const inputCss = 'font:15px var(--mono);padding:8px 10px;border-radius:8px;border:1px solid var(--line);background:var(--bg2);color:var(--fg);min-width:0';

  // ---------- binary <-> decimal ----------
  A.demo('bits', el => {
    const vals = [128, 64, 32, 16, 8, 4, 2, 1];
    const d = box(el, `<p class="note-s">Tap the bits to switch them on (1) or off (0), or type a number from 0 to 255.</p>
      <div class="row" data-b style="gap:6px;flex-wrap:nowrap;overflow-x:auto"></div>
      <div class="row" style="margin-top:10px;align-items:center;gap:10px"><label class="note-s" style="margin:0">Decimal <input data-n type="number" min="0" max="255" value="177" style="${inputCss};width:90px"></label>
      <span class="note-s" data-s style="margin:0"></span></div>`);
    const row = $('[data-b]', d), num = $('[data-n]', d), sum = $('[data-s]', d);
    let v = 177;
    const draw = () => {
      row.innerHTML = vals.map(p => `<button type="button" class="btn${v & p ? '' : ' ghost'}" data-p="${p}" style="min-width:52px;display:flex;flex-direction:column;align-items:center;padding:6px 4px"><b style="font:600 18px var(--mono)">${v & p ? 1 : 0}</b><small style="font-size:11px;opacity:.8">${p}</small></button>`).join('');
      row.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { v ^= +b.dataset.p; num.value = v; draw(); });
      const on = vals.filter(p => v & p);
      sum.innerHTML = `binary <b style="font-family:var(--mono)">${v.toString(2).padStart(8, '0')}</b> = ${on.length ? on.join(' + ') : '0'} = <b>${v}</b>`;
    };
    num.oninput = () => { const n = Math.max(0, Math.min(255, parseInt(num.value || '0', 10) || 0)); v = n; draw(); };
    draw();
  });

  // ---------- IP / CIDR calculator ----------
  const ipToInt = s => s.split('.').reduce((a, o) => a * 256 + (+o), 0);
  const intToIp = n => [24, 16, 8, 0].map(b => Math.floor(n / 2 ** b) % 256).join('.');
  function classify(ip) {
    const [a, b] = ip.split('.').map(Number);
    let cls = a <= 127 ? 'A' : a <= 191 ? 'B' : a <= 223 ? 'C' : a <= 239 ? 'D (multicast)' : 'E (research)';
    let kind = 'Public';
    if (a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)) kind = 'Private (RFC 1918)';
    if (a === 127) kind = 'Loopback (this computer)';
    if (a === 169 && b === 254) kind = 'Link-local / APIPA';
    if (a === 0) kind = '“This network / any” (0.x.x.x)';
    if (a >= 224) kind = 'Not for normal devices';
    return { cls, kind, def: a <= 127 ? 8 : a <= 191 ? 16 : a <= 223 ? 24 : null };
  }
  A.demo('subnet', el => {
    const d = box(el, `<div class="row" style="gap:8px;align-items:center"><input data-ip value="10.0.1.0/24" spellcheck="false" aria-label="IP address with CIDR" style="${inputCss};width:220px">
      ${['10.0.0.0/16', '172.31.0.0/20', '192.168.1.0/24', '10.0.1.0/28', '8.8.8.8/32'].map(x => `<button class="btn ghost" type="button" data-x="${x}">${x}</button>`).join('')}</div>
      <div data-o style="margin-top:10px"></div>`);
    const inp = $('[data-ip]', d), out = $('[data-o]', d);
    const run = () => {
      const m = inp.value.trim().match(/^(\d{1,3}(?:\.\d{1,3}){3})(?:\/(\d{1,2}))?$/);
      if (!m || m[1].split('.').some(o => +o > 255)) { out.innerHTML = '<p class="note-s">⚠ Type an address like <code>10.0.1.0/24</code> (four numbers 0–255, then / and 0–32).</p>'; return; }
      const info = classify(m[1]); const p = m[2] !== undefined ? +m[2] : (info.def ?? 32);
      if (p > 32) { out.innerHTML = '<p class="note-s">⚠ The prefix must be between /0 and /32.</p>'; return; }
      const size = 2 ** (32 - p), ip = ipToInt(m[1]), net = Math.floor(ip / size) * size, bc = net + size - 1;
      const mask = intToIp(2 ** 32 - size), usable = size >= 4 ? size - 2 : size === 2 ? 2 : 1;
      const awsOk = p >= 16 && p <= 28, aws = awsOk ? size - 5 : null;
      const rows = [['Class', info.cls], ['Type', info.kind], ['Subnet mask', mask], ['Network ID (first)', intToIp(net)], ['Broadcast (last)', intToIp(bc)],
        ['Total addresses', size.toLocaleString('en-US')], ['Usable hosts (normal network)', usable.toLocaleString('en-US') + (size >= 4 ? '  (total − 2)' : '')],
        ['Usable in an AWS subnet', awsOk ? `${aws.toLocaleString('en-US')}  (total − 5 reserved by AWS)` : 'AWS subnets must be /16 to /28']];
      out.innerHTML = '<div class="tw"><table><tbody>' + rows.map(r => `<tr><td>${r[0]}</td><td style="font-family:var(--mono)">${esc(r[1])}</td></tr>`).join('') + '</tbody></table></div>';
    };
    inp.oninput = run; d.querySelectorAll('[data-x]').forEach(b => b.onclick = () => { inp.value = b.dataset.x; run(); }); run();
  });

  // ---------- EC2 instance type decoder ----------
  const FAM = { t: 'General purpose, burstable (cheap; earns CPU credits)', m: 'General purpose (balanced CPU and memory)', c: 'Compute optimized (more CPU)', r: 'Memory optimized (more RAM)', x: 'Memory optimized (very large RAM)', z: 'High-frequency CPU + memory', i: 'Storage optimized (fast local NVMe disks)', d: 'Storage optimized (dense HDD storage)', h: 'Storage optimized (HDD, big data)', p: 'Accelerated: NVIDIA GPUs for ML training', g: 'Accelerated: GPUs for graphics / ML inference', inf: 'Accelerated: AWS Inferentia chips (ML inference)', trn: 'Accelerated: AWS Trainium chips (ML training)', f: 'Accelerated: FPGA', u: 'High memory (terabytes of RAM)', hpc: 'High-performance computing' };
  const ATTR = { g: 'AWS Graviton (ARM) processor', a: 'AMD processor', i: 'Intel processor', d: 'local NVMe instance-store disk', n: 'extra network bandwidth', e: 'extra memory or storage', b: 'extra EBS bandwidth', z: 'high CPU frequency', flex: 'Flex: cheaper, for apps that don’t need full CPU all the time' };
  A.demo('ec2name', el => {
    const d = box(el, `<div class="row" style="gap:8px;align-items:center"><input data-t value="m7g.large" spellcheck="false" aria-label="Instance type" style="${inputCss};width:170px">
      ${['t3.micro', 'c7i.2xlarge', 'r6gd.xlarge', 'g5.xlarge', 'm7i-flex.large'].map(x => `<button class="btn ghost" type="button" data-x="${x}">${x}</button>`).join('')}</div><div data-o style="margin-top:10px"></div>`);
    const inp = $('[data-t]', d), out = $('[data-o]', d);
    const run = () => {
      const m = inp.value.trim().toLowerCase().match(/^(inf|trn|hpc|[a-z])(\d+)([a-z]*)(-flex)?\.([a-z0-9]+)$/);
      if (!m || !FAM[m[1]]) { out.innerHTML = '<p class="note-s">⚠ Try a name like <code>t3.micro</code> or <code>c7g.large</code>.</p>'; return; }
      const attrs = [...m[3]].map(ch => ATTR[ch] ? `<code>${ch}</code> = ${ATTR[ch]}` : `<code>${ch}</code> = extra capability`);
      if (m[4]) attrs.push(ATTR.flex);
      const rows = [['Family <code>' + m[1] + '</code>', FAM[m[1]]], ['Generation <code>' + m[2] + '</code>', 'higher = newer, usually better price-performance'], ['Attributes', attrs.length ? attrs.join('<br>') : 'none (default Intel or AMD processor)'], ['Size <code>' + m[5] + '</code>', 'nano &lt; micro &lt; small &lt; medium &lt; large &lt; xlarge &lt; 2xlarge… (each step up roughly doubles CPU and RAM)']];
      out.innerHTML = '<div class="tw"><table><tbody>' + rows.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('') + '</tbody></table></div>';
    };
    inp.oninput = run; d.querySelectorAll('[data-x]').forEach(b => b.onclick = () => { inp.value = b.dataset.x; run(); }); run();
  });

  // ---------- scaling: buy for the peak vs pay per hour ----------
  A.demo('scale', el => {
    const d = box(el, `<label class="note-s" style="display:block">Sale days per year: <b data-v>4</b></label>
      <input type="range" min="0" max="60" value="4" data-r style="width:100%;max-width:520px;accent-color:var(--ac)">
      <label class="note-s" style="display:block;margin-top:8px">Servers needed on a sale day: <b data-pv>100</b> (normal days need 10)</label>
      <input type="range" min="10" max="300" step="10" value="100" data-p style="width:100%;max-width:520px;accent-color:var(--ac)"><div data-o style="margin-top:10px"></div>`);
    const r = $('[data-r]', d), pk = $('[data-p]', d), out = $('[data-o]', d);
    const run = () => {
      const days = +r.value, peak = +pk.value, base = 10;
      $('[data-v]', d).textContent = days; $('[data-pv]', d).textContent = peak;
      const own = peak * 365 * 24, cloud = (base * (365 - days) + peak * days) * 24;
      const pct = Math.round((1 - cloud / own) * 100), used = Math.round(cloud / own * 100);
      out.innerHTML = `<div class="bars"><div class="bar"><span>Own servers (buy for the peak)</span><div class="track"><div class="fill" style="width:100%"></div></div><span class="v">${own.toLocaleString('en-US')} server-hours</span></div>
        <div class="bar top"><span>Cloud (pay per hour)</span><div class="track"><div class="fill" style="width:${Math.max(1, cloud / own * 100).toFixed(1)}%"></div></div><span class="v">${cloud.toLocaleString('en-US')} server-hours</span></div></div>
        <p class="note-s">If you buy hardware, you pay for ${peak} servers all year, but use only <b>${used}%</b> of them. In the cloud you pay for about <b>${pct}% fewer</b> server-hours. (Same price per server-hour assumed, to keep it simple.)</p>`;
    };
    r.oninput = pk.oninput = run; run();
  });

  // ---------- practice Linux terminal ----------
  A.demo('shell', el => {
    const home = '/home/ubuntu';
    const fs = { '/': ['bin', 'etc', 'home', 'root', 'tmp', 'var'], '/home': ['ubuntu'], '/home/ubuntu': ['.bashrc', 'notes.txt'], '/root': ['.bashrc'], '/var': ['log', 'www'], '/var/log': ['syslog', 'auth.log'], '/var/www': ['html'], '/var/www/html': ['index.html'], '/etc': ['hostname', 'passwd'], '/tmp': [], '/bin': ['ls', 'cat', 'bash'] };
    const files = { '/home/ubuntu/notes.txt': 'AWS SAA practice notes', '/home/ubuntu/.bashrc': '# shell settings', '/var/www/html/index.html': '<h1>Apache default page</h1>', '/etc/hostname': 'ip-172-31-11-229' };
    let cwd = home, user = 'ubuntu', prev = home; const hist = [];
    const d = box(el, `<p class="note-s">A safe practice terminal (nothing real is changed). Try: <code>whoami</code>, <code>pwd</code>, <code>ls -a</code>, <code>cd /var/log</code>, <code>cd ..</code>, <code>mkdir site</code>, <code>touch site/index.html</code>, <code>cat notes.txt</code>, <code>sudo -i</code>, <code>exit</code>, <code>history</code>, <code>clear</code>, <code>help</code>.</p>
      <div data-term style="background:#0b1220;color:#d6deeb;border-radius:10px;padding:10px 12px;font:13.5px/1.6 var(--mono);height:260px;overflow-y:auto;white-space:pre-wrap;word-break:break-word" aria-live="polite"></div>
      <div style="display:flex;gap:8px;margin-top:8px;align-items:center"><span data-pr style="font:13px var(--mono);color:var(--muted);white-space:nowrap"></span><input data-in spellcheck="false" autocomplete="off" aria-label="Type a Linux command" style="${inputCss};flex:1"><button class="btn" type="button" data-go>Run</button></div>`);
    const term = $('[data-term]', d), inp = $('[data-in]', d), pr = $('[data-pr]', d);
    const prompt = () => `${user}@ip-172-31-11-229:${cwd === (user === 'root' ? '/root' : home) ? '~' : cwd}${user === 'root' ? '#' : '$'}`;
    const norm = p => { const parts = []; p.split('/').forEach(x => { if (!x || x === '.') return; if (x === '..') parts.pop(); else parts.push(x); }); return '/' + parts.join('/'); };
    const abs = p => norm(p.startsWith('/') ? p : (p.startsWith('~') ? (user === 'root' ? '/root' : home) + p.slice(1) : cwd + '/' + p));
    const isDir = p => p in fs, parent = p => p.split('/').slice(0, -1).join('/') || '/', base = p => p.split('/').pop();
    const canWrite = p => user === 'root' || p.startsWith(home) || p.startsWith('/tmp');
    const say = (t, c = '') => { term.innerHTML += `<span style="${c}">${esc(t)}</span>\n`; term.scrollTop = term.scrollHeight; };
    const cmds = {
      help: () => 'Commands: whoami pwd ls [-a|-l|-la] ll cd mkdir [-p] rmdir touch cat echo rm [-r] cp mv sudo -i / sudo su - exit history clear',
      whoami: () => user, pwd: () => cwd, clear: () => { term.innerHTML = ''; return null; },
      history: () => hist.map((h, i) => `${String(i + 1).padStart(4)}  ${h}`).join('\n'),
      ls: a => { const flags = a.filter(x => x.startsWith('-')).join(''); const t = a.find(x => !x.startsWith('-')); const p = t ? abs(t) : cwd;
        if (!isDir(p)) return files[p] !== undefined ? base(p) : `ls: cannot access '${t}': No such file or directory`;
        if (p === '/root' && user !== 'root') return "ls: cannot open directory '/root': Permission denied";
        let items = fs[p].filter(n => flags.includes('a') || !n.startsWith('.')); if (flags.includes('a')) items = ['.', '..', ...items];
        if (flags.includes('l')) return items.map(n => { const q = p === '/' ? '/' + n : p + '/' + n; const dir = isDir(q) || n === '.' || n === '..'; const own = (n === '..' ? p : q).startsWith(home) ? 'ubuntu' : 'root'; return `${dir ? 'drwxr-xr-x' : '-rw-r--r--'} 1 ${own} ${own} ${String(dir ? 4096 : (files[q] || '').length).padStart(4)} Oct 27 10:15 ${n}`; }).join('\n');
        return items.join('  '); },
      cd: a => { const t = a[0]; let p = !t || t === '~' ? (user === 'root' ? '/root' : home) : t === '-' ? prev : abs(t);
        if (!isDir(p)) return `cd: ${t}: No such file or directory`; if (p === '/root' && user !== 'root') return 'cd: /root: Permission denied'; prev = cwd; cwd = p; return t === '-' ? cwd : null; },
      mkdir: a => { const deep = a.includes('-p'); for (const t of a.filter(x => x !== '-p')) { const p = abs(t); if (!canWrite(p)) return `mkdir: cannot create directory '${t}': Permission denied`;
          const chain = []; let q = p; while (!isDir(q)) { chain.unshift(q); q = parent(q); } if (chain.length > 1 && !deep) return `mkdir: cannot create directory '${t}': No such file or directory (use mkdir -p)`;
          if (!chain.length) return `mkdir: cannot create directory '${t}': File exists`; chain.forEach(c => { fs[c] = []; fs[parent(c)].push(base(c)); }); } return null; },
      rmdir: a => { const p = abs(a[0] || ''); if (!isDir(p)) return `rmdir: failed to remove '${a[0]}': No such file or directory`; if (fs[p].length) return `rmdir: failed to remove '${a[0]}': Directory not empty`;
        if (!canWrite(p)) return `rmdir: failed to remove '${a[0]}': Permission denied`; delete fs[p]; fs[parent(p)] = fs[parent(p)].filter(n => n !== base(p)); return null; },
      touch: a => { for (const t of a) { const p = abs(t); if (!isDir(parent(p))) return `touch: cannot touch '${t}': No such file or directory`; if (!canWrite(p)) return `touch: cannot touch '${t}': Permission denied`; if (files[p] === undefined && !isDir(p)) { files[p] = ''; fs[parent(p)].push(base(p)); } } return null; },
      cat: a => a.map(t => { const p = abs(t); return isDir(p) ? `cat: ${t}: Is a directory` : files[p] !== undefined ? files[p] : `cat: ${t}: No such file or directory`; }).join('\n'),
      echo: (a, raw) => { const m = raw.match(/^echo\s+(.*?)\s*(>>?)\s*(\S+)$/); if (!m) return raw.replace(/^echo\s*/, '').replace(/^["']|["']$/g, '');
        const p = abs(m[3]), text = m[1].replace(/^["']|["']$/g, ''); if (!isDir(parent(p))) return `bash: ${m[3]}: No such file or directory`; if (!canWrite(p)) return `bash: ${m[3]}: Permission denied`;
        if (files[p] === undefined) { files[p] = ''; fs[parent(p)].push(base(p)); } files[p] = m[2] === '>>' && files[p] ? files[p] + '\n' + text : text; return null; },
      rm: a => { const rec = a.some(x => /^-[a-z]*r/.test(x)); for (const t of a.filter(x => !x.startsWith('-'))) { const p = abs(t);
          if (!canWrite(p)) return `rm: cannot remove '${t}': Permission denied`; if (isDir(p)) { if (!rec) return `rm: cannot remove '${t}': Is a directory (use rm -r)`; Object.keys(fs).filter(k => k === p || k.startsWith(p + '/')).forEach(k => delete fs[k]); Object.keys(files).filter(k => k.startsWith(p + '/')).forEach(k => delete files[k]); }
          else if (files[p] !== undefined) delete files[p]; else return `rm: cannot remove '${t}': No such file or directory`; fs[parent(p)] = fs[parent(p)].filter(n => n !== base(p)); } return null; },
      cp: a => { const rec = a.includes('-r'); const [s, t] = a.filter(x => x !== '-r'); if (!s || !t) return 'cp: missing file operand'; const ps = abs(s); let pt = abs(t); if (isDir(pt)) pt = pt + '/' + base(ps);
        if (!canWrite(pt)) return `cp: cannot create '${t}': Permission denied`;
        if (isDir(ps)) { if (!rec) return `cp: -r not specified; omitting directory '${s}'`; Object.keys(fs).filter(k => k === ps || k.startsWith(ps + '/')).forEach(k => { fs[pt + k.slice(ps.length)] = [...fs[k]]; }); Object.keys(files).filter(k => k.startsWith(ps + '/')).forEach(k => { files[pt + k.slice(ps.length)] = files[k]; }); }
        else if (files[ps] !== undefined) files[pt] = files[ps]; else return `cp: cannot stat '${s}': No such file or directory`;
        if (!fs[parent(pt)].includes(base(pt))) fs[parent(pt)].push(base(pt)); return null; },
      mv: a => { const out = cmds.cp(['-r', ...a]); if (out) return out.replace(/^cp/, 'mv'); return cmds.rm(['-r', a[0]]); },
      sudo: a => { if (a.join(' ') === '-i' || a.join(' ') === 'su -' || a.join(' ') === 'su') { if (a.join(' ') !== 'su') { prev = cwd; cwd = '/root'; } user = 'root'; return null; } return a.length ? run(a.join(' '), true) : 'usage: sudo -i'; },
      exit: () => { if (user === 'root') { user = 'ubuntu'; cwd = home; return 'logout'; } return 'logout (in a real terminal this closes your SSH session)'; },
      ll: a => cmds.ls(['-la', ...a])
    };
    function run(line, elevated) {
      const parts = line.trim().split(/\s+/), c = parts[0], args = parts.slice(1);
      if (!c) return null; const f = cmds[c]; if (!f) return `${c}: command not found (type help)`;
      if (elevated) { const u = user; user = 'root'; const r = f(args, line.trim().replace(/^sudo\s+/, '')); user = u; return r; }
      return f(args, line.trim());
    }
    const go = () => { const line = inp.value; if (!line.trim()) return; hist.push(line.trim()); say(`${prompt()} ${line}`, 'color:#9ecbff'); const out = run(line); if (out) say(out); inp.value = ''; pr.textContent = prompt(); };
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') go(); }); $('[data-go]', d).onclick = go;
    say('Welcome to Ubuntu (practice terminal). Type help to see the commands.', 'color:#8b9ab3'); pr.textContent = prompt();
  });
})();
