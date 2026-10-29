// Learn24 live AI jobs: a Vercel serverless function that fetches one job source, keeps only AI-related roles,
// normalises the fields and lets Vercel's CDN cache the result (each source has its own refresh interval,
// chosen to respect that source's usage terms).   GET /api/jobs?source=remotive|jobicy|remoteok|adzuna
// Adzuna (India) needs two Vercel environment variables: ADZUNA_APP_ID and ADZUNA_APP_KEY (free at developer.adzuna.com).

const AI = /\b(ai|a\.i\.|ml|llms?|genai|gen ai|generative|machine learning|deep learning|nlp|natural language|computer vision|data scien\w*|mlops|llmops|prompt|rag|langchain|artificial intelligence|neural|pytorch|tensorflow|transformers?|agentic|ai agents?|chatbot|conversational ai|recommendation|data engineer\w*|analytics engineer|applied scientist|research scientist)\b/i;
const NOT = /\b(sales|account executive|recruiter|marketing manager|customer success|paralegal|nurse)\b/i;

const SOURCES = {
  remotive: { ttl: 21600, name: 'Remotive', home: 'https://remotive.com', async fetch() {           // terms: ~4 fetches a day
      const r = await get('https://remotive.com/api/remote-jobs');          // one request for the whole board, filtered here
      return (r.jobs || []).map(j => ({
        id: 'rm-' + j.id, title: j.title, company: j.company_name, logo: j.company_logo, location: j.candidate_required_location || 'Remote',
        remote: true, type: nice(j.job_type), posted: j.publication_date, url: j.url, salary: j.salary || '', tags: [j.category].filter(Boolean) }));
    } },
  jobicy: { ttl: 3600, name: 'Jobicy', home: 'https://jobicy.com', async fetch() {                  // terms: sync at most hourly
      const out = [];
      for (const q of ['industry=engineering', 'industry=data-science', 'tag=machine%20learning']) {
        let r; try { r = await get('https://jobicy.com/api/jobs?count=100&' + q); } catch (e) { r = await get('https://jobicy.com/api/v2/remote-jobs?count=50&' + q); }
        out.push(...(r.jobs || []));
      }
      return out.map(j => ({
        id: 'jc-' + j.id, title: j.jobTitle, company: j.companyName, logo: j.companyLogo, location: j.jobGeo || 'Remote', remote: true,
        type: nice(Array.isArray(j.jobType) ? j.jobType[0] : j.jobType), posted: j.pubDate, url: j.url,
        salary: money(j.salaryMin ?? j.annualSalaryMin, j.salaryMax ?? j.annualSalaryMax, j.salaryCurrency, j.salaryPeriod),
        tags: [].concat(j.jobIndustry || [], j.jobLevel || []).map(String).slice(0, 4) }));
    } },
  remoteok: { ttl: 3600, name: 'Remote OK', home: 'https://remoteok.com', async fetch() {           // terms: link back to Remote OK
      const r = await get('https://remoteok.com/api');
      return (Array.isArray(r) ? r : []).filter(j => j && j.id && j.position).map(j => ({
        id: 'ro-' + j.id, title: j.position, company: j.company, logo: j.company_logo || j.logo, location: j.location || 'Remote', remote: true,
        type: '', posted: j.date || (j.epoch ? new Date(j.epoch * 1000).toISOString() : ''), url: j.url || j.apply_url,
        salary: money(j.salary_min, j.salary_max, 'USD', 'year'), tags: (j.tags || []).slice(0, 5) }));
    } },
  adzuna: { ttl: 1800, name: 'Adzuna', home: 'https://www.adzuna.in', async fetch() {               // terms: "Jobs by Adzuna" attribution
      const id = process.env.ADZUNA_APP_ID, key = process.env.ADZUNA_APP_KEY;
      if (!id || !key) { const e = new Error('Adzuna keys not set'); e.code = 'NOKEY'; throw e; }
      const out = [];
      for (const what of ['generative ai', 'machine learning', 'data scientist', 'llm']) {
        const u = `https://api.adzuna.com/v1/api/jobs/in/search/1?app_id=${id}&app_key=${key}&results_per_page=50&sort_by=date&max_days_old=30&what=${encodeURIComponent(what)}&content-type=application/json`;
        const r = await get(u); out.push(...(r.results || []));
      }
      return out.map(j => ({
        id: 'az-' + j.id, title: strip(j.title), company: j.company && j.company.display_name, logo: '', location: (j.location && j.location.display_name) || 'India',
        remote: /remote|work from home/i.test(j.title + ' ' + (j.description || '')), type: nice(j.contract_time || j.contract_type), posted: j.created, url: j.redirect_url,
        salary: j.salary_is_predicted == 1 ? '' : money(j.salary_min, j.salary_max, 'INR', 'year'), tags: [j.category && j.category.label].filter(Boolean) }));
    } },
};

async function get(url) {
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 9000);
  try {
    const r = await fetch(url, { signal: ctl.signal, headers: { 'User-Agent': 'Learn24-jobs/1.0 (+https://learn24-lilac.vercel.app/jobs)', Accept: 'application/json' } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally { clearTimeout(t); }
}
const strip = s => String(s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const nice = s => String(s || '').replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim();
function money(a, b, cur, per) {
  a = +a || 0; b = +b || 0; if (!a && !b) return '';
  const f = n => cur === 'INR' ? (n >= 1e5 ? `₹${(n / 1e5).toFixed(n >= 1e6 ? 0 : 1)} LPA` : `₹${Math.round(n).toLocaleString('en-IN')}`) : `${cur === 'USD' || !cur ? '$' : cur + ' '}${n >= 1000 ? Math.round(n / 1000) + 'k' : n}`;
  return (a && b && a !== b ? `${f(a)} – ${f(b)}` : f(a || b)) + (per && cur !== 'INR' && !/year|annual/i.test(per) ? ` / ${per}` : '');
}
function category(title, tags) {
  const t = (title + ' ' + tags.join(' ')).toLowerCase();
  if (/genai|gen ai|generative|llm|prompt|rag|langchain|agentic|ai agent|conversational|chatbot|nlp|natural language/.test(t)) return 'genai';
  if (/mlops|llmops|platform|infrastructure|devops|cloud/.test(t)) return 'mlops';
  if (/data engineer|analytics engineer|etl|big data|spark/.test(t)) return 'data-eng';
  if (/data scien|machine learning|\bml\b|deep learning|computer vision|research scientist|applied scientist|statistic/.test(t)) return 'ml';
  return 'ai';
}

module.exports = async function handler(req, res) {
  const name = String((req.query && req.query.source) || new URL(req.url, 'http://x').searchParams.get('source') || '');
  const src = SOURCES[name];
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (!src) { res.statusCode = 400; return res.end(JSON.stringify({ error: 'Use ?source=' + Object.keys(SOURCES).join('|') })); }
  try {
    const seen = new Set(), jobs = [];
    for (const j of await src.fetch()) {
      if (!j.title || !j.url || seen.has(j.id)) continue;
      const tags = (j.tags || []).map(String);
      if (!AI.test(j.title + ' ' + tags.join(' ')) || NOT.test(j.title)) continue;
      seen.add(j.id);
      const posted = j.posted ? new Date(j.posted) : null;
      jobs.push({ ...j, title: strip(j.title), company: strip(j.company) || 'Company not named', location: strip(j.location), tags,
                  posted: posted && !isNaN(posted) ? posted.toISOString() : '', cat: category(j.title, tags), source: name });
    }
    jobs.sort((a, b) => (b.posted || '').localeCompare(a.posted || ''));
    res.setHeader('Cache-Control', `public, s-maxage=${src.ttl}, stale-while-revalidate=86400`);
    res.end(JSON.stringify({ source: name, sourceName: src.name, sourceHome: src.home, fetchedAt: new Date().toISOString(), refreshSeconds: src.ttl, count: jobs.length, jobs: jobs.slice(0, 300) }));
  } catch (e) {
    res.statusCode = e.code === 'NOKEY' ? 200 : 502;
    res.setHeader('Cache-Control', 'public, s-maxage=300');
    res.end(JSON.stringify({ source: name, sourceName: src.name, sourceHome: src.home, fetchedAt: new Date().toISOString(), count: 0, jobs: [], error: e.code === 'NOKEY' ? 'not-configured' : String(e.message || e) }));
  }
};
module.exports.SOURCES = SOURCES;
