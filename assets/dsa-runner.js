/* Learn24 DSA code runner (Web Worker). Python runs in Pyodide (loaded on first use), JavaScript runs natively.
   The test harness below is the same one used to verify every reference solution. */
const PY_PRELUDE = "\nimport json, time, traceback, sys\nfrom typing import *\nfrom collections import *\nimport collections, heapq, math, bisect, itertools, functools, string, re\nfrom heapq import heappush, heappop, heapify, heappushpop, nlargest, nsmallest\nfrom bisect import bisect_left, bisect_right, insort\nfrom functools import lru_cache, cache, reduce\nfrom math import inf\nclass ListNode:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next\nclass TreeNode:\n    def __init__(self, val=0, left=None, right=None):\n        self.val = val\n        self.left = left\n        self.right = right\ndef _l24_mkl(a):\n    d = ListNode(); c = d\n    for x in a:\n        c.next = ListNode(x); c = c.next\n    return d.next\ndef _l24_mkt(a):\n    if not a or a[0] is None: return None\n    root = TreeNode(a[0]); q = deque([root]); i = 1\n    while q and i < len(a):\n        n = q.popleft()\n        if i < len(a) and a[i] is not None: n.left = TreeNode(a[i]); q.append(n.left)\n        i += 1\n        if i < len(a) and a[i] is not None: n.right = TreeNode(a[i]); q.append(n.right)\n        i += 1\n    return root\ndef _l24_in(v, t):\n    if t == 'list': return _l24_mkl(v)\n    if t == 'tree': return _l24_mkt(v)\n    if t == 'list[]': return [_l24_mkl(x) for x in v]\n    return json.loads(json.dumps(v))\ndef _l24_out(v, t):\n    if t == 'list':\n        a = []; n = 0\n        while v is not None and n < 100000: a.append(v.val); v = v.next; n += 1\n        return a\n    if t == 'tree':\n        a = []; q = deque([v])\n        while q:\n            n = q.popleft()\n            if n is None: a.append(None); continue\n            a.append(n.val); q.append(n.left); q.append(n.right)\n        while a and a[-1] is None: a.pop()\n        return a\n    return v\ndef _l24_run(spec):\n    S = json.loads(spec); res = []\n    if 'Solution' not in globals(): raise NameError('Define class Solution with a method named ' + S['fn'])\n    for args in S['tests']:\n        a = [_l24_in(x, t) for x, t in zip(args, S['types'])]\n        try:\n            t0 = time.perf_counter(); r = getattr(Solution(), S['fn'])(*a); ms = (time.perf_counter() - t0) * 1000\n            if S.get('inplace') is not None: r, rt = a[S['inplace']], S['types'][S['inplace']]\n            else: rt = S['ret']\n            res.append({'out': json.loads(json.dumps(_l24_out(r, rt))), 'ms': round(ms, 2)})\n        except Exception:\n            tb = traceback.format_exc().strip().split('\\n')\n            res.append({'err': '\\n'.join([l for l in tb if 'File \"<exec>\"' in l or not l.startswith('  File')][-3:])})\n    return json.dumps(res)\n";

function ListNode(val, next) { this.val = val === undefined ? 0 : val; this.next = next === undefined ? null : next; }
function TreeNode(val, left, right) { this.val = val === undefined ? 0 : val; this.left = left === undefined ? null : left; this.right = right === undefined ? null : right; }
const _mkl = a => { const d = new ListNode(); let c = d; for (const x of a) { c.next = new ListNode(x); c = c.next; } return d.next; };
const _mkt = a => { if (!a.length || a[0] === null) return null; const root = new TreeNode(a[0]), q = [root]; let i = 1, h = 0;
  while (h < q.length && i < a.length) { const n = q[h++]; if (i < a.length && a[i] !== null) { n.left = new TreeNode(a[i]); q.push(n.left); } i++;
    if (i < a.length && a[i] !== null) { n.right = new TreeNode(a[i]); q.push(n.right); } i++; } return root; };
const _in = (v, t) => t === 'list' ? _mkl(v) : t === 'tree' ? _mkt(v) : t === 'list[]' ? v.map(_mkl) : JSON.parse(JSON.stringify(v));
const _out = (v, t) => { if (t === 'list') { const a = []; let n = 0; while (v && n++ < 100000) { a.push(v.val); v = v.next; } return a; }
  if (t === 'tree') { const a = [], q = [v]; let h = 0; while (h < q.length) { const n = q[h++]; if (!n) { a.push(null); continue; } a.push(n.val); q.push(n.left, n.right); }
    while (a.length && a[a.length - 1] === null) a.pop(); return a; } return v === undefined ? null : v; };
function _l24_run(code, S) {
  const f = new Function('ListNode', 'TreeNode', code + `\n;return typeof ${S.fn} === 'function' ? ${S.fn} : undefined;`)(ListNode, TreeNode);
  if (!f) throw new Error('Define a function named ' + S.fn);
  return S.tests.map(args => { const a = args.map((x, i) => _in(x, S.types[i]));
    try { const t0 = Date.now(); let r = f(...a); const ms = Date.now() - t0; let rt = S.ret;
      if (S.inplace !== null && S.inplace !== undefined) { r = a[S.inplace]; rt = S.types[S.inplace]; }
      return { out: JSON.parse(JSON.stringify(_out(r, rt))), ms };
    } catch (e) { return { err: String(e && e.stack ? e.stack.split('\n').slice(0, 2).join('\n') : e) }; } });
}

let py = null;
async function loadPy() {
  if (py) return py;
  postMessage({ type: 'status', msg: 'Loading Python (first run only, about 5–10 seconds)…' });
  importScripts('https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js');
  py = await loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/' });
  return py;
}
onmessage = async e => {
  const { id, lang, code, spec } = e.data, out = [];
  try {
    if (lang === 'py') {
      const P = await loadPy();
      postMessage({ type: 'ready', id });
      P.setStdout({ batched: s => out.push(s) }); P.setStderr({ batched: s => out.push(s) });
      const ns = P.globals.get('dict')();
      P.runPython(PY_PRELUDE, { globals: ns });
      try { P.runPython(code, { globals: ns }); }
      catch (err) { const m = String(err.message || err).split('\n'); postMessage({ type: 'done', id, error: m.filter(l => !/^\s*File "\/lib/.test(l)).slice(-4).join('\n'), stdout: out.join('\n') }); ns.destroy(); return; }
      ns.set('_spec', JSON.stringify(spec));
      const r = P.runPython('_l24_run(_spec)', { globals: ns });
      ns.destroy();
      postMessage({ type: 'done', id, results: JSON.parse(r), stdout: out.join('\n') });
    } else {
      postMessage({ type: 'ready', id });
      const log = console.log; console.log = (...a) => out.push(a.map(x => typeof x === 'string' ? x : JSON.stringify(x)).join(' '));
      try { const results = _l24_run(code, spec); postMessage({ type: 'done', id, results, stdout: out.join('\n') }); }
      finally { console.log = log; }
    }
  } catch (err) {
    postMessage({ type: 'done', id, error: String(err && err.message || err).split('\n').slice(-4).join('\n'), stdout: out.join('\n') });
  }
};
