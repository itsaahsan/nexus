import { useEffect, useMemo, useState, useRef } from 'react';
import {
  Menu, X, Moon, Sun, Play, FlaskConical, FileSearch, Scale, SlidersHorizontal,
  Rocket, Repeat, Upload, ArrowRight, Eye, Info, Target, Lightbulb, Activity,
  ClipboardList, CircleCheck, ChevronDown, History, ShieldCheck, Network, HeartHandshake,
  Search, Sparkles, BarChart3, TrendingUp, Layers, Settings, BookOpen, Database, Filter,
  Command, Zap, LineChart as LineChartIcon, CheckCircle2, AlertTriangle, Beaker,
} from 'lucide-react';
import { api } from './api';
import {
  Section, Stat, ConfBar, Stepper, PipelineCards, EvidenceGraph, EvidenceCard,
  EmptyState, LoadingInvestigation, ErrorState, Field, ComparisonTable, ActionCenter,
  Timeline, Receipt,
} from './components/ui';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, CartesianGrid, Cell,
  LineChart, Line, AreaChart, Area,
} from 'recharts';

const DEMO = {
  title: 'Community service prioritization',
  description: 'A community organization has limited resources and needs to determine which neighborhoods should receive additional outreach support. Several neighborhoods have different levels of reported need and engagement.',
  objective: 'Determine where limited community resources may have the greatest potential impact.',
  constraints: 'Limited staff and budget.',
  resources: 'Volunteers, 2 field teams, small grant.',
  community: 'Several neighborhoods with different levels of reported need and engagement; focus on food, education and outreach.',
  timeframe: 'Previous 3 months — 180 records (DEMO DATASET, synthetic)',
};

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000/api';

type HistItem = { id: number; title: string; at: string; rec: string; outcome?: string };

const SIDENAV = [
  { id: 'overview', label: 'Overview', icon: Layers, href: '#results' },
  { id: 'investigations', label: 'Investigations', icon: FlaskConical, href: '#investigation' },
  { id: 'evidence', label: 'Evidence', icon: FileSearch, href: '#evidence' },
  { id: 'hypotheses', label: 'Hypotheses', icon: Scale, href: '#hypotheses' },
  { id: 'simulations', label: 'Simulations', icon: SlidersHorizontal, href: '#simulation' },
  { id: 'actions', label: 'Actions', icon: Rocket, href: '#actions' },
  { id: 'outcomes', label: 'Outcomes', icon: Activity, href: '#feedback' },
  { id: 'datasets', label: 'Datasets', icon: Database, href: '#datasets' },
];

function HeroGraph() {
  return (
    <div className="nx-card overflow-hidden p-4" aria-hidden>
      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-slate-400"><span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Intelligence graph — live</span><span className="nx-chip">Deterministic</span></div>
      <svg viewBox="0 0 640 120" className="mt-3 w-full">
        {[
          { x: 50, label: 'Problem', c: '#22d3ee' }, { x: 155, label: 'Evidence', c: '#38bdf8' },
          { x: 265, label: 'Hypotheses', c: '#a78bfa' }, { x: 375, label: 'Simulation', c: '#f59e0b' },
          { x: 485, label: 'Action', c: '#34d399' }, { x: 590, label: 'Outcome', c: '#f472b6' },
        ].map((n, i, arr) => (
          <g key={n.label}>
            {i < arr.length - 1 && <line x1={n.x + 42} y1={60} x2={arr[i + 1].x - 42} y2={60} stroke="rgba(148,163,184,0.35)" strokeWidth={1.6} strokeDasharray={i % 2 ? '0' : '6 6'} className={i % 2 === 0 ? 'nx-dash' : ''} />}
            <circle cx={n.x} cy={60} r={18} fill={n.c} opacity={0.14} /><circle cx={n.x} cy={60} r={7} fill={n.c} />
            <text x={n.x} y={98} textAnchor="middle" fontSize={10} fontWeight={700} fill="#94a3b8">{n.label}</text>
          </g>
        ))}
      </svg>
      <p className="nx-muted mt-1 text-center text-xs">Problem → Investigate → Evidence → Hypotheses → Simulation → Action → Outcome → Learn</p>
    </div>
  );
}

export default function App() {
  const [dark, setDark] = useState(true);
  const [menu, setMenu] = useState(false);
  const [palette, setPalette] = useState(false);
  const [health, setHealth] = useState<'live' | 'down' | 'unknown'>('unknown');
  const [form, setForm] = useState(DEMO);
  const [pid, setPid] = useState<number | null>(null);
  const [data, setData] = useState<any>(null);
  const [phase, setPhase] = useState<'idle' | 'creating' | 'investigating'>('idle');
  const [err, setErr] = useState('');
  const [sel, setSel] = useState<any>(null);
  const [sim, setSim] = useState<any>(null);
  const [simBusy, setSimBusy] = useState(false);
  const [alloc, setAlloc] = useState(65);
  const [cover, setCover] = useState(70);
  const [resp, setResp] = useState(4);
  const [fb, setFb] = useState({ baseline: 100, observed: 82, note: 'Pilot completed in target district.' });
  const [fbOut, setFbOut] = useState<any>(null);
  const [why, setWhy] = useState<any>(null);
  const [reasonH, setReasonH] = useState<any>(null);
  const [review, setReview] = useState<'pending' | 'accepted' | 'modified' | 'rejected'>('pending');
  const [actionStatuses, setActionStatuses] = useState<Record<number, string>>({});
  const [showHistory, setShowHistory] = useState(false);
  const [evQuery, setEvQuery] = useState('');
  const [evFilter, setEvFilter] = useState<'all' | 'supporting' | 'contradicting' | 'high' | 'low'>('all');
  const [evSort, setEvSort] = useState<'confidence' | 'source'>('confidence');
  const [history, setHistory] = useState<HistItem[]>(() => { try { return JSON.parse(localStorage.getItem('nexus_history') || '[]'); } catch { return []; } });
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.classList.toggle('light-root', !dark);
  }, [dark]);

  useEffect(() => {
    let alive = true;
    fetch(`${API_BASE}/health`).then((r) => { if (alive) setHealth(r.ok ? 'live' : 'down'); }).catch(() => { if (alive) setHealth('down'); });
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette((v) => !v); }
      if (e.key === 'Escape') { setPalette(false); setShowHistory(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => { alive = false; window.removeEventListener('keydown', onKey); };
  }, []);

  const persistHist = (next: HistItem[]) => { setHistory(next); localStorage.setItem('nexus_history', JSON.stringify(next)); };
  const busy = phase !== 'idle';
  const NEEDS_DATA = ['results', 'evidence', 'hypotheses', 'simulation', 'actions', 'feedback', 'datasets'];
  const pendingScroll = useRef<string | null>(null);
  const scrollTo = (id: string, opts?: { autoDemo?: boolean }) => {
    setMenu(false); setPalette(false); setShowHistory(false);
    const el = document.getElementById(id);
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); return true; }
    // Target doesn't exist yet (results render only after an investigation) — run one, then land there.
    if ((opts?.autoDemo ?? true) && NEEDS_DATA.includes(id) && !busy) {
      pendingScroll.current = id;
      runDemo();
      return true;
    }
    return false;
  };

  async function runDemo() {
    setErr(''); setPhase('creating'); setSim(null); setFbOut(null); setSel(null); setWhy(null); setReasonH(null); setReview('pending'); setActionStatuses({});
    try {
      const p = await api('/projects', { method: 'POST', body: JSON.stringify(form) });
      setPid(p.id);
      setPhase('investigating');
      const out = await api(`/projects/${p.id}/investigate`, { method: 'POST' });
      setData(out);
      persistHist([{ id: p.id, title: form.title, at: new Date().toLocaleString(), rec: out.recommendations?.[0]?.action || '' }, ...history].slice(0, 20));
      setPhase('idle');
      const target = pendingScroll.current || 'results';
      pendingScroll.current = null;
      // Wait a tick so results sections mount before scrolling.
      setTimeout(() => document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
    } catch (e: any) { pendingScroll.current = null; setErr(e?.message || 'Request failed'); setPhase('idle'); }
  }

  async function runSim() {
    if (!pid) return; setSimBusy(true); setErr('');
    try { setSim(await api(`/projects/${pid}/simulate`, { method: 'POST', body: JSON.stringify({ allocation_pct: alloc, coverage_pct: cover, response_days_target: resp }) })); }
    catch (e: any) { setErr(e?.message || 'Simulation failed'); } setSimBusy(false);
  }

  async function sendFeedback() {
    if (!pid) return;
    try {
      const r = await api(`/projects/${pid}/feedback`, { method: 'POST', body: JSON.stringify(fb) });
      setFbOut(r);
      if (history[0]?.id === pid) { const next = [...history]; next[0] = { ...next[0], outcome: `${r.change_pct}% — ${r.verdict}` }; persistHist(next); }
    } catch (e: any) { setErr(e?.message || 'Feedback failed'); }
  }

  async function uploadCsv(f: File) {
    try {
      const fd = new FormData(); fd.append('file', f);
      const r = await fetch(`${API_BASE}/datasets/upload`, { method: 'POST', body: fd });
      if (!r.ok) throw new Error(await r.text());
      const j = await r.json();
      setData((d: any) => ({ ...(d || {}), profile: j.profile, evidence: j.evidence, log: [...((d?.log) || []), { stage: 'analyzing', status: 'done', msg: `CSV analyzed: ${j.profile.rows} rows` }] }));
    } catch (e: any) { setErr(e?.message || 'Upload failed'); }
  }

  const hyps = data?.hypotheses || [];
  const evidence = data?.evidence || [];
  const profile = data?.profile || data?._uploadProfile || null;
  const simRows: any[] = sim?.scenarios || [];
  const after = simRows[1] || null;
  const before = data?.baseline_sim || null;
  const topRec = data?.recommendations?.[0] || null;

  const filteredEvidence = useMemo(() => {
    let arr = [...evidence];
    if (evQuery) { const q = evQuery.toLowerCase(); arr = arr.filter((e: any) => (e.title + ' ' + e.detail).toLowerCase().includes(q)); }
    if (evFilter === 'high') arr = arr.filter((e: any) => (e.confidence ?? 0) >= 0.7);
    if (evFilter === 'low') arr = arr.filter((e: any) => (e.confidence ?? 0) < 0.6);
    if (evFilter === 'supporting') arr = arr.filter((e: any) => (e.kind || '').toLowerCase().includes('observ') || (e.title || '').toLowerCase().includes('associat'));
    if (evFilter === 'contradicting') arr = arr.filter((e: any) => (e.kind || '').toLowerCase().includes('anomal'));
    arr.sort((a: any, b: any) => evSort === 'confidence' ? (b.confidence - a.confidence) : String(a.source).localeCompare(String(b.source)));
    return arr;
  }, [evidence, evQuery, evFilter, evSort]);

  const hypothesisChartData = hyps.map((h: any) => ({ name: h.title.split(' ').slice(0, 2).join(' '), score: Math.round(h.confidence * 100), impact: Math.round((h.impact || 0) * 100) }));
  const simChartData = simRows.length ? simRows.map((s: any) => ({ name: s.name, impact: s.result.expected_impact_pct, cost: Math.round(s.result.resource_cost_index * 100) })) : [];
  const trendData = profile?.trend ? [{ x: 0, y: 100 }, { x: 50, y: 100 - (profile.trend.slope_per_row || 0) * 10 }, { x: 100, y: Math.max(60, 100 - (profile.trend.slope_per_row || 0) * 20) }] : [];

  return (
    <div className={dark ? 'dark' : 'light-root'}>
      <a href="#main" className="nx-skip">Skip to main content</a>
      <div className="nx-page flex min-h-screen text-slate-100 transition-colors">
        {dark && <div className="nx-aurora pointer-events-none fixed inset-0" aria-hidden />}

        {/* SIDEBAR — desktop */}
        <aside className="hidden w-[260px] shrink-0 flex-col border-r border-white/10 bg-[#06080f]/80 backdrop-blur-xl lg:flex" aria-label="Sidebar">
          <div className="flex items-center gap-2.5 px-4 py-4">
            <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-[#0e1320] ring-1 ring-white/15" aria-hidden>
              <svg viewBox="0 0 32 32" className="h-7 w-7"><circle cx="16" cy="8" r="3.2" fill="#22d3ee" /><circle cx="7" cy="20" r="2.8" fill="#6366f1" /><circle cx="25" cy="20" r="2.8" fill="#a78bfa" /><circle cx="16" cy="24" r="2.4" fill="#fff" opacity={0.9} /><path d="M16 11 L7 18 M16 11 L25 18 M7 20 L16 24 M25 20 L16 24" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" /></svg>
            </span>
            <span className="leading-none"><span className="nx-h-display block text-[15px] font-bold tracking-tight">NEXUS</span><span className="nx-muted block text-[10px] font-medium">Intelligence Command</span></span>
          </div>
          <nav aria-label="Sections" className="flex-1 space-y-1 px-2 py-2">
            {SIDENAV.map((s) => <a key={s.id} href={s.href} onClick={(e) => { e.preventDefault(); scrollTo(s.href.slice(1)); }} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white"><s.icon size={16} />{s.label}</a>)}
          </nav>
          <div className="space-y-1 border-t border-white/10 p-3">
            <button onClick={() => setPalette(true)} className="flex w-full items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-xs font-medium text-slate-400 ring-1 ring-white/10 hover:bg-white/10"><Command size={14} />Command <span className="ml-auto rounded bg-white/10 px-1.5 py-0.5 text-[10px]">⌘K</span></button>
            <div className="flex items-center gap-2 px-2 pt-2 text-xs text-slate-400"><span className={`h-2 w-2 rounded-full ${health === 'live' ? 'bg-emerald-400' : 'bg-rose-400'}`} />{health === 'live' ? 'System online' : health === 'down' ? 'Offline' : 'Checking…'}</div>
            <div className="flex items-center gap-2 px-2 text-[11px] text-slate-500"><Settings size={12} />Settings · <a href="#architecture" onClick={(e) => { e.preventDefault(); scrollTo('architecture'); }} className="underline">Docs</a></div>
          </div>
        </aside>

        {/* MAIN */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="nx-header sticky top-0 z-20 flex items-center gap-2 border-b px-4 py-3 backdrop-blur-xl lg:px-6">
            <button className="lg:hidden nx-btn nx-btn-ghost !p-2" onClick={() => setMenu(!menu)} aria-label={menu ? 'Close menu' : 'Open menu'}>{menu ? <X size={18} /> : <Menu size={18} />}</button>
            <div className="lg:hidden flex items-center gap-2"><span className="nx-h-display text-sm font-bold">NEXUS</span><span className="nx-muted text-[11px]">Command Center</span></div>
            <div className="hidden items-center gap-2 lg:flex text-sm"><span className="nx-muted">Investigation Command Center</span><span className="nx-chip"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />System online</span></div>
            <div className="ml-auto flex items-center gap-2">
              <div className="relative hidden sm:block">
                <Search size={14} className="pointer-events-none absolute left-2.5 top-2.5 text-slate-400" />
                <input ref={searchRef} placeholder="Search…  ⌘K" onFocus={() => setPalette(true)} className="nx-field !py-2 !pl-8 !pr-3 text-sm" style={{ width: 220 }} readOnly />
              </div>
              <button className="nx-btn nx-btn-ghost !px-2.5" onClick={() => setDark(!dark)} aria-label="Toggle theme">{dark ? <Sun size={16} /> : <Moon size={16} />}</button>
              <button className="nx-btn nx-btn-primary !hidden sm:!inline-flex" onClick={runDemo} disabled={busy}><Zap size={14} />New Investigation</button>
            </div>
          </header>
          {menu && (
            <div className="border-b border-white/10 bg-[#06080f] p-3 lg:hidden">
              {SIDENAV.map((s) => <a key={s.id} href={s.href} onClick={(e) => { e.preventDefault(); scrollTo(s.href.slice(1)); }} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm hover:bg-white/5"><s.icon size={16} />{s.label}</a>)}
              <button onClick={() => setPalette(true)} className="mt-2 flex w-full items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm"><Command size={14} />Command palette</button>
            </div>
          )}

          <main id="main" className="relative mx-auto grid w-full max-w-7xl gap-10 px-4 pb-10 pt-6 md:pt-8 lg:px-6">

            {/* LANDING */}
            <section aria-label="Landing" className="nx-rise grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
              <div>
                <p className="nx-chip"><Sparkles size={12} />Global Innovation Build Challenge V2 · Track 03</p>
                <h1 className="nx-h-display mt-4 text-[40px] font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-[54px]">
                  NEXUS<br />
                  <span className="text-slate-400">AUTONOMOUS<br />INTELLIGENCE</span>
                </h1>
                <p className="mt-3 bg-gradient-to-r from-cyan-300 via-indigo-300 to-fuchsia-300 bg-clip-text text-lg font-semibold text-transparent">Turn uncertainty into evidence-backed action.</p>
                <p className="nx-muted mt-2 max-w-xl text-sm leading-relaxed">Investigate complex problems, test competing explanations, simulate interventions, and continuously learn from outcomes.</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button className="nx-btn nx-btn-primary !px-7 !py-3" onClick={runDemo} disabled={busy}><Play size={16} />{busy ? 'Investigating…' : 'Run Demo'}</button>
                  <button className="nx-btn nx-btn-secondary !px-7 !py-3" onClick={() => scrollTo('how')}>Explore system<ChevronDown size={14} /></button>
                </div>
                <p className="nx-muted mt-3 text-xs">● Deterministic demo · No API key · ~10 seconds · Synthetic data clearly labeled</p>
              </div>
              <HeroGraph />
            </section>

            <section id="how" aria-label="How it works" className="scroll-mt-24"><PipelineCards /></section>

            <section aria-label="Why NEXUS" className="grid gap-3 md:grid-cols-3">
              {[
                { n: '01', t: 'Investigate', d: 'Structures messy problems into evidence-backed questions instead of guessing an answer.', icon: Beaker },
                { n: '02', t: 'Simulate', d: 'Compares interventions against the current state before resources are committed.', icon: LineChartIcon },
                { n: '03', t: 'Adapt', d: 'Measures outcomes and updates recommendations — the loop that makes intelligence continuous.', icon: Repeat },
              ].map((c) => <article key={c.t} className="nx-card p-5"><div className="flex items-center justify-between"><c.icon size={20} className="text-cyan-300" /><span className="nx-h-display text-xs font-bold text-slate-500">{c.n}</span></div><h3 className="nx-h-display mt-3 font-semibold">{c.t}</h3><p className="nx-muted mt-1 text-sm leading-relaxed">{c.d}</p></article>)}
            </section>

            <section aria-label="Why not just ask AI" className="nx-card p-6">
              <h2 className="nx-h-display text-lg font-bold">Why not just ask AI?</h2>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="nx-inset p-4"><p className="text-xs font-bold uppercase tracking-widest text-slate-400">Question → Answer</p><p className="nx-muted mt-2 text-sm">Waits for a perfect question, returns one answer, hides how it got there.</p></div>
                <div className="nx-inset !border-cyan-300/30 p-4"><p className="text-xs font-bold uppercase tracking-widest text-cyan-300">Problem → Investigation → Evidence → Action</p><p className="mt-2 text-sm">NEXUS shows its work: evidence, competing hypotheses, simulations and the receipt — so humans decide with context.</p></div>
              </div>
            </section>

            {/* PROBLEM INTAKE */}
            <Section id="investigation" step="Intake" icon={ClipboardList} title="What problem are you investigating?" sub="Through the lens of community service prioritization — messy, real-world, resource-constrained.">
              <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                <div className="space-y-4">
                  <Field label="Problem title"><input className="nx-field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
                  <Field label="Problem description"><textarea className="nx-field" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
                  <Field label="Community / context"><textarea className="nx-field" rows={2} value={form.community} onChange={(e) => setForm({ ...form, community: e.target.value })} /></Field>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="Objective"><textarea className="nx-field" rows={2} value={form.objective} onChange={(e) => setForm({ ...form, objective: e.target.value })} /></Field>
                    <Field label="Constraints"><textarea className="nx-field" rows={2} value={form.constraints} onChange={(e) => setForm({ ...form, constraints: e.target.value })} /></Field>
                    <Field label="Available resources"><input className="nx-field" value={form.resources} onChange={(e) => setForm({ ...form, resources: e.target.value })} /></Field>
                  </div>
                  <Field label="Time period / evidence window"><input className="nx-field" value={form.timeframe} onChange={(e) => setForm({ ...form, timeframe: e.target.value })} /></Field>
                  <div className="flex flex-wrap gap-3">
                    <button className="nx-btn nx-btn-primary" onClick={runDemo} disabled={busy}>{busy ? 'Investigating…' : <>Start investigation<ArrowRight size={16} /></>}</button>
                    <label className="nx-btn nx-btn-secondary cursor-pointer"><Upload size={14} />Attach CSV<input type="file" accept=".csv" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCsv(f); }} /></label>
                    <button className="nx-btn nx-btn-ghost" onClick={() => setForm(DEMO)}>Reset to demo</button>
                  </div>
                </div>
                <aside className="nx-inset h-fit p-4 space-y-3">
                  <h3 className="nx-h-display text-sm font-semibold flex items-center gap-2"><BookOpen size={14} />What happens next</h3>
                  <ol className="space-y-2 text-[13px]">
                    {[[FileSearch, 'Evidence profiled'], [Scale, 'Hypotheses ranked'], [SlidersHorizontal, 'Interventions simulated'], [Rocket, 'Action plan with metrics']].map(([I, t]: any, i) => <li key={i} className="flex gap-2"><I size={14} className="mt-0.5 text-cyan-300 flex-none" /><span className="nx-muted">{t}</span></li>)}
                  </ol>
                  <p className="rounded-lg bg-amber-500/10 p-2.5 text-xs leading-relaxed text-amber-200">DEMO DATASET is synthetic — engineered trends, anomalies and category gaps for the investigation to discover. Never presented as real research.</p>
                </aside>
              </div>
            </Section>

            {phase !== 'idle' && <LoadingInvestigation phase={phase === 'creating' ? 'creating' : 'investigating'} />}
            {err && phase === 'idle' && <ErrorState message={err} onRetry={runDemo} onReset={() => { setErr(''); setData(null); scrollTo('investigation'); }} />}
            {!data && phase === 'idle' && !err && <EmptyState onStart={runDemo} busy={busy} />}

            {data && phase === 'idle' && (
              <div className="grid gap-10">
                {/* OVERVIEW DASHBOARD */}
                <section id="results" aria-label="Overview" className="nx-card scroll-mt-24 p-6 md:p-8">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30"><CircleCheck size={22} /></span>
                    <div><p className="nx-step-tag inline-block">Investigation complete</p><h2 className="nx-h-display mt-1 text-2xl font-bold tracking-tight">{data.parsed?.problem || form.title}</h2><p className="nx-muted text-xs">Investigation #{pid} · {data.ai?.provider || 'demo'} · deterministic</p></div>
                    <span className="nx-chip ml-auto hidden sm:inline-flex"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Analysis complete</span>
                  </div>
                  <div className="mt-5"><Stepper log={data.log} /></div>
                  <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
                    <Stat icon={FileSearch} value={String(evidence.length)} label="Evidence" />
                    <Stat icon={Scale} value={String(hyps.length)} label="Hypotheses" />
                    <Stat icon={Target} value={hyps[0] ? `${Math.round(hyps[0].confidence * 100)}` : '—'} label="Top score" accent="text-cyan-300" />
                    <Stat icon={Rocket} value={String(data.recommendations?.length || 0)} label="Actions" />
                    <Stat icon={TrendingUp} value={after ? `+${after.result.expected_impact_pct}%` : '—'} label="Sim. lift" accent="text-fuchsia-300" />
                    <Stat icon={BarChart3} value={profile ? `${profile.rows}` : '—'} label="Rows" />
                  </div>
                  {/* mini trend + confidence */}
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="nx-inset p-3">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Hypothesis ranking</p>
                      <div className="mt-2 h-[120px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={hypothesisChartData}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" /><XAxis dataKey="name" fontSize={11} tick={{ fill: '#94a3b8' }} /><YAxis fontSize={11} /><RTooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }} /><Bar dataKey="score" radius={[6, 6, 0, 0]}>{hypothesisChartData.map((_: any, i: number) => <Cell key={i} fill={['#22d3ee', '#a78bfa', '#f59e0b', '#64748b', '#475569'][i] || '#64748b'} />)}</Bar></BarChart></ResponsiveContainer></div>
                    </div>
                    <div className="nx-inset p-3">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Evidence trend (demo)</p>
                      <div className="mt-2 h-[120px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={trendData}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" /><XAxis dataKey="x" hide /><YAxis hide /><RTooltip /><Area type="monotone" dataKey="y" stroke="#22d3ee" fill="rgba(34,211,238,0.15)" strokeWidth={2} /></AreaChart></ResponsiveContainer></div>
                      <p className="nx-muted mt-1 text-[11px]">Profile: {profile ? String(profile.rows) + ' rows · ' + String(profile.missing ? (Object.values(profile.missing as any) as number[]).reduce((a: number, b: number) => a + b, 0) : 0) + ' missing' : '—'}</p>
                    </div>
                  </div>
                </section>

                {/* PROBLEM STRUCTURED */}
                <Section step="Structured" icon={ClipboardList} title="Problem structured" sub="Objective · constraints · unknowns · investigation questions">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="nx-inset p-4 text-sm"><p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Objective</p><p className="mt-1 leading-relaxed">{data.parsed.objective}</p></div>
                    <div className="nx-inset p-4 text-sm"><p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Constraints</p><p className="mt-1 leading-relaxed">{data.parsed.constraints}</p></div>
                    <div className="nx-inset p-4 text-sm"><p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Decision required</p><p className="mt-1 leading-relaxed">Where should outreach resources be prioritized under limited capacity?</p></div>
                    <div className="nx-inset p-4 text-sm"><p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Unknowns</p><p className="mt-1 leading-relaxed">{(data.parsed.unknowns || []).join(' · ')}</p></div>
                  </div>
                  <h3 className="nx-h-display mt-4 text-sm font-semibold">Investigation questions</h3>
                  <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm marker:text-slate-400">{(data.parsed.investigation_questions || []).map((q: string, i: number) => <li key={i}>{q}</li>)}</ol>
                </Section>

                {/* EVIDENCE EXPLORER */}
                <Section id="evidence" step="Evidence" icon={FileSearch} title="Evidence explorer" sub={`${evidence.length} findings — DEMO DATASET (synthetic)`} right={<span className="nx-chip">{filteredEvidence.length} shown</span>}>
                  <div className="flex flex-wrap gap-2">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search size={14} className="pointer-events-none absolute left-2.5 top-2.5 text-slate-400" />
                      <input placeholder="Search evidence…" value={evQuery} onChange={(e) => setEvQuery(e.target.value)} className="nx-field !pl-8" />
                    </div>
                    <select aria-label="Filter" value={evFilter} onChange={(e) => setEvFilter(e.target.value as any)} className="nx-field !w-auto"><option value="all">All</option><option value="supporting">Supporting</option><option value="contradicting">Anomalies</option><option value="high">High score</option><option value="low">Low score</option></select>
                    <select aria-label="Sort" value={evSort} onChange={(e) => setEvSort(e.target.value as any)} className="nx-field !w-auto"><option value="confidence">Sort: score</option><option value="source">Sort: source</option></select>
                  </div>
                  <div className="mt-3 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredEvidence.slice(0, 9).map((e: any, i: number) => <EvidenceCard key={i} item={e} onInspect={setSel} />)}
                  </div>
                  {!filteredEvidence.length && <p className="nx-muted py-6 text-center text-sm">No evidence matches that filter.</p>}
                  <h3 className="nx-h-display mt-6 text-[15px] font-semibold flex items-center gap-2"><Network size={16} />Relationship graph</h3>
                  <p className="nx-muted mb-3 text-xs">Supports / contradicts links; click a node to inspect. Animated on entry; respects reduced motion.</p>
                  <EvidenceGraph graph={data.graph} onSelect={setSel} selected={sel} />
                  {sel && <div className="nx-inset nx-rise mt-3 border-cyan-300/25 p-4" role="dialog" aria-label="Node details"><div className="flex items-start justify-between gap-2"><p className="text-sm font-semibold">{sel.type}: {sel.label}</p><button className="nx-btn nx-btn-ghost !p-1.5" onClick={() => setSel(null)} aria-label="Close"><X size={15} /></button></div><pre className="nx-muted mt-2 max-h-52 overflow-auto whitespace-pre-wrap text-[11px] leading-relaxed">{JSON.stringify(sel.detail || sel, null, 2)}</pre></div>}
                </Section>

                {/* DATASET LAB */}
                <Section id="datasets" step="Dataset" icon={Database} title="Dataset lab" sub="Schema · missing · outliers · distributions — from the actual data">
                  {!profile ? <p className="nx-muted py-6 text-center text-sm">No dataset profile yet — run an investigation or upload a CSV.</p> : (
                    <>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                        <div className="nx-inset p-3 text-center"><p className="nx-h-display text-xl font-bold">{profile.rows}</p><p className="nx-muted text-[11px] uppercase tracking-widest">Rows</p></div>
                        <div className="nx-inset p-3 text-center"><p className="nx-h-display text-xl font-bold">{profile.columns?.length || 0}</p><p className="nx-muted text-[11px] uppercase tracking-widest">Columns</p></div>
                        <div className="nx-inset p-3 text-center"><p className="nx-h-display text-xl font-bold">{String(profile.missing ? (Object.values(profile.missing as any) as number[]).reduce((a: number, b: number) => a + b, 0) : 0)}</p><p className="nx-muted text-[11px] uppercase tracking-widest">Missing</p></div>
                        <div className="nx-inset p-3 text-center"><p className="nx-h-display text-xl font-bold">{profile.numeric?.length || 0}</p><p className="nx-muted text-[11px] uppercase tracking-widest">Numeric</p></div>
                        <div className="nx-inset p-3 text-center"><p className="nx-h-display text-xl font-bold">{profile.categorical?.length || 0}</p><p className="nx-muted text-[11px] uppercase tracking-widest">Categorical</p></div>
                      </div>
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <div className="nx-inset p-3"><p className="text-xs font-bold uppercase tracking-widest text-slate-400">Numeric summary</p><div className="mt-2 space-y-1 text-xs">{Object.entries(profile.descriptive || {}).slice(0, 4).map(([k, v]: any) => <div key={k} className="flex justify-between"><span className="nx-muted">{k}</span><span>mean {v.mean} · outliers {v.outliers_iqr}</span></div>)}</div></div>
                        <div className="nx-inset p-3"><p className="text-xs font-bold uppercase tracking-widest text-slate-400">Categorical distribution</p><div className="mt-2 space-y-1 text-xs">{Object.entries(profile.category_dist || {}).slice(0, 2).map(([k, arr]: any) => <div key={k}><span className="font-semibold">{k}:</span> {(arr as any[]).slice(0, 3).map((r: any) => `${r.value} (${r.count})`).join(' · ')}</div>)}</div></div>
                      </div>
                      <p className="nx-muted mt-3 flex items-center gap-1.5 text-[11px]"><Filter size={12} />Upload a CSV in the intake to replace the demo profile; same pipeline re-runs.</p>
                    </>
                  )}
                </Section>

                    {/* HYPOTHESIS LAB */}
                <Section id="hypotheses" step="Hypotheses" icon={Scale} title="Hypothesis lab" sub="Competing explanations — investigation scores, not probabilities">
                  <ul className="grid gap-2.5 lg:grid-cols-2">
                    {hyps.map((h: any, i: number) => (
                      <li key={i} className={`nx-inset nx-card-hover p-4 ${i === 0 ? '!border-amber-300/30' : ''}`}>
                        <div className="flex items-center justify-between gap-2">
                          <p className="nx-h-display flex items-center gap-2 text-[15px] font-semibold"><span className={`flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br text-[11px] font-bold text-white ${['from-amber-300 to-orange-500','from-slate-300 to-slate-500','from-orange-300 to-amber-600'][i] || 'from-slate-500 to-slate-700'}`}>{i + 1}</span>{String(h.title).slice(0, 48)}</p>
                          <span className="nx-h-display text-xl font-bold text-cyan-300">{Math.round(h.confidence * 100)}<span className="text-xs font-medium text-slate-500">/100</span></span>
                        </div>
                        <div className="mt-2.5"><ConfBar v={h.confidence} tone={i === 0 ? 'gold' : 'violet'} /></div>
                        <p className="nx-muted mt-2 text-[13px] leading-relaxed">{h.statement}</p>
                        <div className="mt-2 grid grid-cols-4 gap-1.5 text-center text-[11px]">
                          <span className="nx-inset !p-1.5"><b>{h.support}</b><br /><span className="nx-muted">support</span></span>
                          <span className="nx-inset !p-1.5"><b>{h.contradiction}</b><br /><span className="nx-muted">contradict</span></span>
                          <span className="nx-inset !p-1.5"><b>{String(h.impact)}</b><br /><span className="nx-muted">impact</span></span>
                          <span className="nx-inset !p-1.5"><b>{String(h.uncertainty)}</b><br /><span className="nx-muted">uncertainty</span></span>
                        </div>
                        <button className="nx-btn nx-btn-ghost !px-0 !py-1 mt-2 text-xs" onClick={() => setReasonH(h)}>View reasoning →</button>
                      </li>
                    ))}
                  </ul>
                  <h3 className="nx-h-display mt-6 text-sm font-semibold">Ranking comparison</h3>
                  <div className="mt-2"><ComparisonTable hyps={hyps} onReason={setReasonH} /></div>
                  {reasonH && <div className="nx-inset nx-rise mt-3 p-4" role="dialog" aria-label="Reasoning"><div className="flex justify-between gap-2"><h4 className="font-semibold">Why #{hyps.indexOf(reasonH) + 1} — {reasonH.title}</h4><button className="nx-btn nx-btn-ghost !p-1" onClick={() => setReasonH(null)}><X size={14} /></button></div><p className="nx-muted mt-2 text-sm leading-relaxed">{reasonH.statement}</p><p className="mt-2 text-sm">Evidence support <b>{reasonH.support}</b> · contradict <b>{reasonH.contradiction}</b> · impact {reasonH.impact}</p><p className="nx-muted mt-1 text-xs">User-facing explanation only — no chain-of-thought.</p></div>}
                  {data.root_cause && (
                    <div className="mt-6">
                      <h3 className="nx-h-display text-sm font-semibold flex items-center gap-2"><Target size={14} />Root-cause map</h3>
                      <div className="nx-inset mt-2 border-l-2 !border-l-rose-400/60 p-4 text-sm"><p className="text-[11px] font-bold uppercase tracking-[0.12em] text-rose-300">Leading explanation · estimate</p><p className="mt-1 leading-relaxed">{data.root_cause.likely_root.wording}</p></div>
                      <div className="mt-2 grid gap-2 md:grid-cols-2">
                        {[['Direct causes', (data.root_cause.direct_causes || []).join(' · ') || '—'], ['Contributing factors', (data.root_cause.contributing_factors || []).join(' · ') || '—'], ['Observed correlations', (data.root_cause.correlations || []).map((c: any) => `${c.pair} (r=${c.r})`).join('; ') || 'none ≥ 0.35'], ['Confounders & unknowns', [...(data.root_cause.confounders || []), ...(data.root_cause.unknowns || [])].join(' · ')]].map(([k, v]) => <div key={k as string} className="nx-inset p-3 text-[13px]"><dt className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">{k}</dt><dd className="nx-muted mt-1 leading-relaxed">{v}</dd></div>)}
                      </div>
                      <p className="nx-muted mt-2 text-[11px] italic">Evidence suggests · Potential contributing factor · Insufficient evidence — never correlation proves causation.</p>
                    </div>
                  )}
                </Section>

                {/* SCENARIO LAB */}
                <Section id="simulation" step="Scenario lab" icon={SlidersHorizontal} title="Scenario lab" sub="Explore possible outcomes before committing resources — simulated, not guaranteed">
                  <div className="grid gap-2.5 md:grid-cols-3">
                    {[
                      ['Intervention intensity', alloc, setAlloc, 0, 100, '%'],
                      ['Resource allocation', cover, setCover, 0, 100, '%'],
                      ['Time horizon', resp, setResp, 0.5, 15, ' days'],
                    ].map(([label, v, set, mn, mx, unit]: any) => (
                      <div key={label as string} className="nx-inset p-4">
                        <div className="flex items-baseline justify-between gap-2">
                          <label htmlFor={`sim-${label}`} className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">{label}</label>
                          <span className="nx-h-display text-xl font-bold text-cyan-300">{v}<span className="text-xs font-medium text-slate-500">{unit}</span></span>
                        </div>
                        <input id={`sim-${label}`} type="range" min={mn} max={mx} step={label === 'Time horizon' ? 0.5 : 1} value={v} onChange={(e) => set(Number(e.target.value))} className="nx-range mt-3 w-full" />
                      </div>
                    ))}
                  </div>
                  <button className="nx-btn nx-btn-primary mt-3" onClick={runSim} disabled={simBusy}><Play size={14} />{simBusy ? 'Simulating…' : 'Run simulation'}</button>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div className="nx-inset p-4"><p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Scenario comparison</p><div className="mt-2 h-[160px]">{simChartData.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={simChartData}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" /><XAxis dataKey="name" fontSize={11} /><YAxis fontSize={11} /><RTooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }} /><Bar dataKey="impact" fill="#22d3ee" radius={[6, 6, 0, 0]} name="Impact %" /><Bar dataKey="cost" fill="#6366f1" radius={[6, 6, 0, 0]} name="Cost" /></BarChart></ResponsiveContainer> : <p className="nx-muted py-10 text-center text-sm">Run a simulation to see baseline vs A vs B.</p>}</div></div>
                    <div className="nx-inset p-4"><p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Confidence band (illustrative)</p><div className="mt-2 h-[160px]">{simRows.length ? <ResponsiveContainer width="100%" height="100%"><LineChart data={simRows.map((s: any, i: number) => ({ name: s.name, impact: s.result.expected_impact_pct, lo: s.result.expected_impact_pct - s.result.uncertainty * 20, hi: s.result.expected_impact_pct + s.result.uncertainty * 10 }))}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" /><XAxis dataKey="name" fontSize={11} /><YAxis fontSize={11} /><RTooltip /><Line type="monotone" dataKey="impact" stroke="#a78bfa" strokeWidth={2} dot /><Line type="monotone" dataKey="hi" stroke="rgba(167,139,250,0.3)" strokeDasharray="4 4" dot={false} /><Line type="monotone" dataKey="lo" stroke="rgba(167,139,250,0.3)" strokeDasharray="4 4" dot={false} /></LineChart></ResponsiveContainer> : <p className="nx-muted py-10 text-center text-sm">Uncertainty bands appear after simulation.</p>}</div></div>
                  </div>
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    <div className="nx-inset p-4"><p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Baseline · SIMULATED</p><p className="nx-h-display mt-1 text-2xl font-bold">{before ? before.baseline : '—'}</p><p className="nx-muted text-xs">Current state from demo data{before ? ` · impact ${before.expected_impact_pct}%` : ''}</p></div>
                    <div className="nx-inset !border-emerald-400/30 p-4"><p className="text-[11px] font-bold uppercase tracking-widest text-emerald-300">Scenario A · SIMULATED</p><p className="nx-h-display mt-1 text-2xl font-bold text-emerald-300">{after ? `${after.result.expected_impact_pct > 0 ? '+' : ''}${after.result.expected_impact_pct}%` : '—'}</p><p className="nx-muted text-xs">{after ? `Projected ${after.result.projected_value} · cost ${after.result.resource_cost_index} · risk ${after.result.risk} · ±${after.result.uncertainty}` : 'Run simulation — model estimates, not guarantees.'}</p></div>
                  </div>
                  {!!simRows.length && <div className="mt-2 grid gap-2 md:grid-cols-3">{simRows.map((s: any, i: number) => <div key={i} className="nx-inset p-3 text-sm"><p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{s.name}</p><p className="nx-h-display text-lg font-bold">{s.result.expected_impact_pct > 0 ? '+' : ''}{s.result.expected_impact_pct}%</p><p className="nx-muted text-[11px]">cost {s.result.resource_cost_index} · risk {s.result.risk} · ±{s.result.uncertainty}</p></div>)}</div>}
                  {before?.assumptions && <p className="nx-muted mt-3 text-[11px]"><span className="font-bold text-slate-400">Assumptions:</span> {before.assumptions.join(' · ')}</p>}
                  {after && <p className="nx-muted mt-2 text-[11px] flex gap-1.5"><Info size={12} className="mt-0.5 flex-none" />Why this scenario? Evidence-weighted lift from allocation+coverage with response-time elasticity; trade-off is higher cost and the uncertainty above.</p>}
                </Section>

                {/* ACTION CENTER */}
                <Section id="actions" step="Action center" icon={Rocket} title="Action center" sub="Priority · why · expected benefit · effort · risk · success metric">
                  {topRec && (
                    <article className="nx-inset !border-indigo-400/30 p-5">
                      <div className="flex flex-wrap items-center gap-2"><span className="nx-step-tag">Priority 1 · HIGH</span><h3 className="nx-h-display text-lg font-semibold">{topRec.action}</h3></div>
                      <dl className="mt-4 grid gap-2.5 sm:grid-cols-2">
                        {[[Lightbulb, 'Why?', topRec.rationale], [BarChart3, 'Expected benefit', `Benefit ${topRec.benefit} · score ${topRec.score} — SIMULATED`], [ShieldCheck, 'Risk & effort', `Risk ${topRec.risk} · effort ${topRec.effort}${topRec.deps?.length ? ` · depends on ${topRec.deps.join(', ')}` : ''}`], [Target, 'Success metric', `${topRec.metric} — ${topRec.method}`]].map(([I, k, v]: any) => <div key={k} className="nx-row flex gap-2.5 rounded-xl p-3"><I size={16} className="nx-hl mt-0.5 flex-none" /><div className="text-[13px]"><dt className="font-bold">{k}</dt><dd className="nx-muted mt-0.5 leading-relaxed">{v}</dd></div></div>)}
                      </dl>
                      <div className="mt-4 rounded-xl bg-amber-500/10 p-3 text-sm text-amber-200"><b>Human review:</b> Recommendation generated by NEXUS. Final decisions should be reviewed by responsible community stakeholders.</div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button className={`nx-btn ${review === 'accepted' ? '!bg-emerald-600' : 'nx-btn-primary'}`} onClick={() => setReview('accepted')}><CheckCircle2 size={15} />{review === 'accepted' ? 'Accepted ✓' : 'Accept for testing'}</button>
                        <button className={`nx-btn ${review === 'modified' ? '!bg-amber-600 text-white' : 'nx-btn-secondary'}`} onClick={() => setReview('modified')}>Modify</button>
                        <button className={`nx-btn ${review === 'rejected' ? '!bg-rose-600 text-white' : 'nx-btn-ghost'}`} onClick={() => setReview('rejected')}>Reject</button>
                        <button className="nx-btn nx-btn-secondary" onClick={() => scrollTo('evidence')}><Eye size={15} />Review evidence</button>
                        <button className="nx-btn nx-btn-ghost" onClick={() => setWhy(why ? null : topRec)}>View rationale</button>
                      </div>
                      {why && <ol className="nx-rise mt-3 space-y-1.5 text-[13px]">{[['Evidence', evidence.slice(0, 3).map((e: any) => e.title).join(' · ')], ['Analysis', why.rationale], ['Assumptions', 'Linear response · stable demand · consistent measurement'], ['Uncertainty', 'Provisional — see scores'], ['Recommendation', why.action]].map(([k, v]) => <li key={k as string} className="nx-row rounded-lg p-2.5"><b className="nx-hl">{k}: </b><span className="nx-muted">{v}</span></li>)}</ol>}
                    </article>
                  )}
                  <h3 className="nx-h-display mt-6 text-sm font-semibold">All actions</h3>
                  <div className="mt-2"><ActionCenter recs={data.recommendations || []} statuses={actionStatuses} setStatus={(i, s) => setActionStatuses({ ...actionStatuses, [i]: s })} /></div>
                </Section>

                {/* OUTCOME */}
                <Section id="feedback" step="Outcomes" icon={Activity} title="Outcome center" sub="Plan → Action → Measure → Learn → Adapt">
                  <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
                    <ol aria-label="Learning loop" className="space-y-0">
                      {[['Investigation', FlaskConical], ['Action', Rocket], ['Outcome', Activity], ['Learning', Lightbulb], ['Next investigation', Repeat]].map(([t, I]: any, i, arr) => (
                        <li key={t as string} className="relative flex gap-3 pb-5 last:pb-0">
                          {i < (arr as any[]).length - 1 && <span className="absolute left-[15px] top-8 h-[calc(100%-2rem)] w-px bg-white/10" aria-hidden />}
                          <span className="z-10 flex h-8 w-8 flex-none items-center justify-center rounded-full bg-indigo-500/15 text-indigo-300 ring-1 ring-white/10"><I size={15} /></span>
                          <span className="text-sm font-semibold">{t as string}</span>
                        </li>
                      ))}
                    </ol>
                    <div>
                      <div className="grid grid-cols-3 gap-2">
                        <Field label="Baseline"><input type="number" className="nx-field" value={fb.baseline} onChange={(e) => setFb({ ...fb, baseline: Number(e.target.value) })} /></Field>
                        <Field label="Observed"><input type="number" className="nx-field" value={fb.observed} onChange={(e) => setFb({ ...fb, observed: Number(e.target.value) })} /></Field>
                        <Field label="Note"><input className="nx-field" value={fb.note} onChange={(e) => setFb({ ...fb, note: e.target.value })} /></Field>
                      </div>
                      <button className="nx-btn nx-btn-primary mt-3 w-full" onClick={sendFeedback} disabled={!pid}><Activity size={15} />Record outcome</button>
                      {fbOut && <div className={`nx-rise mt-3 rounded-2xl border p-4 text-sm ${fbOut.change_pct <= -3 ? 'border-emerald-400/30 bg-emerald-400/[0.07]' : fbOut.change_pct <= 3 ? 'border-amber-300/30 bg-amber-400/[0.07]' : 'border-rose-400/30 bg-rose-400/[0.07]'}`} role="status"><dl className="grid grid-cols-3 gap-2 text-center">{[['Expected', fbOut.baseline], ['Actual', fbOut.observed], ['Change', `${fbOut.change_pct}%`]].map(([k, v]) => <div key={k as string}><dt className="nx-muted text-[10px] font-bold uppercase tracking-widest">{k}</dt><dd className="nx-h-display text-xl font-bold">{v}</dd></div>)}</dl><p className="mt-2 font-medium">{fbOut.verdict}</p><p className="nx-muted mt-1 text-xs">{fbOut.next}</p></div>}
                    </div>
                  </div>
                </Section>

                <div className="grid gap-6 lg:grid-cols-2">
                  <Section step="Timeline" icon={History} title="Investigation timeline" sub="Structured log from the orchestrator"><Timeline log={data.log} /></Section>
                  <Section step="Receipt" icon={ClipboardList} title="Investigation receipt" sub="Audit summary — share with stakeholders"><Receipt data={data} pid={pid} /></Section>
                </div>
              </div>
            )}

            {/* SYSTEM ARCHITECTURE */}
            <section id="architecture" aria-label="System architecture" className="nx-card scroll-mt-24 p-6">
              <h2 className="nx-h-display flex items-center gap-2 text-lg font-bold"><Network size={18} className="text-cyan-300" />System architecture</h2>
              <div className="mt-3 overflow-x-auto rounded-xl bg-[#080c16] p-4 ring-1 ring-white/10">
                <pre className="text-center text-xs leading-6 text-slate-300">{`User → React Application → FastAPI → Investigation Orchestrator
                              ├─ Evidence Engine ─┐
                              ├─ Hypothesis Engine ├─→ Recommendation → PostgreSQL → Feedback → Learning Loop
                              └─ Simulation Engine┘`}</pre>
              </div>
              <p className="nx-muted mt-3 text-xs">AI abstraction (Deterministic ↔ LLM),Pandas/NumPy analysis, SQLAlchemy, Recharts. Never hard-coded keys; demo works fully offline.</p>
            </section>

            <section id="impact" aria-label="Social impact" className="nx-card p-6">
              <h2 className="nx-h-display flex items-center gap-2 text-lg font-bold"><HeartHandshake size={18} className="text-emerald-300" />Social impact</h2>
              <p className="nx-muted mt-2 text-sm leading-relaxed">For community organizations choosing where limited outreach should go — turning conflicting, incomplete demand signals into a transparent investigation that humans can review, not a black-box directive.</p>
              <ol className="mt-3 flex flex-wrap items-center gap-2 text-sm">{['Problem', 'Evidence', 'Transparent decisions', 'Measurable outcomes', 'Learning'].map((t, i, a) => <span key={t} className="flex items-center gap-2"><span className="nx-chip">{t}</span>{i < a.length - 1 && <ArrowRight size={12} className="text-slate-500" />}</span>)}</ol>
            </section>

            <footer className="nx-sechead border-t pt-6 text-center">
              <p className="nx-h-display text-sm font-bold">NEXUS <span className="nx-muted font-normal">· Autonomous Intelligence Command Center</span></p>
              <p className="nx-muted mt-1 text-[11px] tracking-wide">Evidence → Hypothesis → Simulation → Action → Feedback → Learning</p>
              <p className="nx-muted mt-1 text-[11px]">Deterministic demo · synthetic data clearly marked · estimates never facts · human review required</p>
            </footer>
          </main>
        </div>
      </div>

      {/* COMMAND PALETTE */}
      {palette && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-[20vh]" onClick={() => setPalette(false)} role="dialog" aria-label="Command palette">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0f172a] p-2 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 border-b border-white/10 px-3 pb-2"><Search size={16} className="text-slate-400" /><input autoFocus placeholder="Type a command…" className="flex-1 bg-transparent py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none" /><span className="nx-chip">ESC</span></div>
            <ul className="py-1 text-sm">
              {[
                ['New Investigation', () => scrollTo('investigation')],
                ['Run Demo', runDemo],
                ['Open Evidence', () => scrollTo('evidence')],
                ['Open Hypotheses', () => scrollTo('hypotheses')],
                ['Open Simulator', () => scrollTo('simulation')],
                ['Open Actions', () => scrollTo('actions')],
                ['Open Outcomes', () => scrollTo('feedback')],
                ['Upload Dataset', () => scrollTo('investigation')],
                ['History', () => setShowHistory(true)],
              ].map(([label, fn]: any) => <li key={label as string}><button onClick={() => { setPalette(false); fn(); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left hover:bg-white/5"><Command size={14} className="text-slate-400" />{label as string}</button></li>)}
            </ul>
          </div>
        </div>
      )}

      {showHistory && (
        <div className="fixed inset-0 z-40 flex flex-col bg-[#06080f]/95 p-4 backdrop-blur-xl" role="dialog" aria-label="History">
          <div className="mx-auto flex w-full max-w-3xl items-center justify-between"><h2 className="nx-h-display text-xl font-bold">Investigation history</h2><button className="nx-btn nx-btn-ghost" onClick={() => setShowHistory(false)}><X size={18} /></button></div>
          <div className="mx-auto w-full max-w-3xl flex-1 overflow-auto py-6">
            {!history.length ? <p className="nx-muted py-12 text-center text-sm">No investigations yet — stored locally.</p> :
              <ul className="space-y-2">{history.map((h) => <li key={`${h.id}-${h.at}`} className="nx-card p-4 text-sm"><div className="flex justify-between gap-2"><b>{h.title}</b><span className="nx-muted text-xs">{h.at}</span></div><p className="nx-muted mt-1 text-xs">Rec: {h.rec.slice(0, 120)}</p>{h.outcome && <p className="mt-1 text-xs text-emerald-300">Outcome: {h.outcome}</p>}</li>)}</ul>}
            {!!history.length && <button className="nx-btn nx-btn-ghost mt-4" onClick={() => persistHist([])}>Clear history</button>}
          </div>
        </div>
      )}
    </div>
  );
}
