import React from 'react';
import {
  Check, Play, RotateCcw, TriangleAlert, Database, FileSearch, Scale,
  SlidersHorizontal, Rocket, Repeat, FlaskConical, Inbox, Eye,
  type LucideIcon,
} from 'lucide-react';

/* ================= section shell ================= */
export function Section({ id, step, icon: Icon, title, sub, right, children }: {
  id?: string; step: string; icon: LucideIcon; title: string; sub?: string;
  right?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <section id={id} aria-label={title} className="nx-card scroll-mt-24">
      <div className="nx-sechead flex items-start justify-between gap-3 border-b px-5 pb-3.5 pt-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-300 ring-1 ring-white/10" aria-hidden>
            <Icon size={18} strokeWidth={2} />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="nx-step-tag">{step}</span>
              <h2 className="nx-h-display text-lg font-semibold">{title}</h2>
            </div>
            {sub && <p className="nx-muted mt-0.5 text-[13px]">{sub}</p>}
          </div>
        </div>
        {right}
      </div>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

export function Stat({ icon: Icon, value, label, accent }: { icon: LucideIcon; value: string; label: string; accent?: string }) {
  return (
    <div className="nx-inset p-3.5 text-center">
      <Icon size={20} className="mx-auto text-slate-400" aria-hidden />
      <div className={`nx-h-display mt-1.5 text-xl font-bold ${accent || ''}`}>{value}</div>
      <div className="nx-muted mt-0.5 text-[10px] font-bold uppercase tracking-[0.12em]">{label}</div>
    </div>
  );
}

export function ConfBar({ v, tone }: { v: number; tone?: 'gold' | 'violet' | 'cyan' }) {
  const grad = tone === 'gold' ? 'from-amber-300 to-orange-500'
    : tone === 'violet' ? 'from-violet-400 to-fuchsia-500' : 'from-cyan-400 to-indigo-500';
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-500/20" role="img" aria-label={`Score ${Math.round(v * 100)} out of 100`}>
      <div className={`nx-bar-fill h-full rounded-full bg-gradient-to-r ${grad}`} style={{ width: `${Math.round(v * 100)}%` }} />
    </div>
  );
}

/* ================= stepper ================= */
const STAGES = [
  { id: 'understanding', label: 'Understand' }, { id: 'investigating', label: 'Investigate' },
  { id: 'analyzing', label: 'Analyze' }, { id: 'hypothesis', label: 'Hypothesize' },
  { id: 'simulation', label: 'Simulate' }, { id: 'action', label: 'Act' },
];
export function Stepper({ log }: { log: any[] }) {
  const done = new Set((log || []).map((l) => l.stage));
  return (
    <ol className="flex items-start gap-0.5" aria-label="Pipeline progress">
      {STAGES.map((s, i) => {
        const on = done.has(s.id);
        return (
          <React.Fragment key={s.id}>
            <li className="flex w-full flex-col items-center gap-1.5 text-center">
              <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs ring-2 ${on ? 'bg-emerald-500 text-white ring-emerald-400/40' : 'bg-white/5 text-slate-500 ring-white/10'}`} aria-hidden>
                {on ? <Check size={15} strokeWidth={3} /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${on ? 'text-emerald-400' : 'nx-muted'}`}>
                {on ? <span className="sr-only">Completed: </span> : <span className="sr-only">Pending: </span>}{s.label}
              </span>
            </li>
            {i < STAGES.length - 1 && <li className={`mt-4 h-0.5 min-w-[8px] flex-1 rounded ${[...done].length > i ? 'bg-emerald-400/60' : 'bg-white/10'}`} aria-hidden />}
          </React.Fragment>
        );
      })}
    </ol>
  );
}

export const PIPE_STAGES: { id: string; n: string; title: string; desc: string; icon: LucideIcon }[] = [
  { id: 'understanding', n: '01', title: 'Evidence', desc: 'Profiled, cleaned and organized into findings.', icon: Database },
  { id: 'hypothesis', n: '02', title: 'Hypotheses', desc: 'Competing explanations, ranked with scores.', icon: Scale },
  { id: 'simulation', n: '03', title: 'Simulation', desc: 'Interventions compared before acting.', icon: SlidersHorizontal },
  { id: 'action', n: '04', title: 'Action', desc: 'Executable plan with metrics and rationale.', icon: Rocket },
  { id: 'feedback', n: '05', title: 'Feedback', desc: 'Outcomes measured; recommendations adapt.', icon: Repeat },
];

export function PipelineCards({ log }: { log?: any[] }) {
  const done = new Set((log || []).map((l: any) => l.stage));
  const activeIdx = log ? PIPE_STAGES.findIndex((s) => !done.has(s.id)) : -1;
  return (
    <ol className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
      {PIPE_STAGES.map((s) => {
        const state = !log ? 'idle' : done.has(s.id) ? 'done' : PIPE_STAGES.indexOf(s) === activeIdx ? 'active' : 'pending';
        return (
          <li key={s.id} className={`nx-card nx-card-hover relative overflow-hidden p-4 ${state === 'active' ? 'border-cyan-300/40' : ''}`}>
            {state === 'active' && <span className="nx-shimmer absolute inset-x-0 top-0 h-0.5" aria-hidden />}
            <div className="flex items-center justify-between">
              <s.icon size={20} className={state === 'done' ? 'text-emerald-400' : state === 'active' ? 'text-cyan-300' : 'text-slate-500'} aria-hidden />
              <span className="nx-h-display text-xs font-bold text-slate-500">{s.n}</span>
            </div>
            <div className="nx-h-display mt-2.5 text-[15px] font-semibold">{s.title}</div>
            <p className="nx-muted mt-1 text-xs leading-relaxed">{s.desc}</p>
            {log && <div className="mt-2.5 text-[11px] font-bold uppercase tracking-wider" aria-live="polite">
              {state === 'done' && <span className="inline-flex items-center gap-1 text-emerald-400"><Check size={12} />Done</span>}
              {state === 'active' && <span className="inline-flex items-center gap-1.5 text-cyan-300"><span className="nx-live-dot h-1.5 w-1.5 rounded-full bg-cyan-300" />Working</span>}
              {state === 'pending' && <span className="nx-muted">Pending</span>}
            </div>}
          </li>
        );
      })}
    </ol>
  );
}

/* ================= evidence card ================= */
export function EvidenceCard({ item, onInspect }: { item: any; onInspect: (n: any) => void }) {
  return (
    <article className="nx-inset nx-card-hover flex flex-col gap-2 p-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="nx-chip"><FileSearch size={12} aria-hidden />{item.kind || 'finding'}</span>
        <span className="nx-h-display text-sm font-bold text-cyan-300">{Math.round((item.confidence ?? 0.5) * 100)}%</span>
      </div>
      <h3 className="text-[13px] font-semibold leading-snug">{item.title}</h3>
      <p className="nx-muted line-clamp-3 text-xs leading-relaxed">{item.detail}</p>
      <div className="nx-muted mt-auto flex items-center justify-between pt-1 text-[11px]">
        <span>Source: {item.source || 'dataset'}</span>
        <button className="inline-flex items-center gap-1 font-semibold text-indigo-300 hover:text-indigo-200" onClick={() => onInspect({ id: `ev-${item.id}`, type: 'Evidence', label: item.title, confidence: item.confidence, detail: item })}>
          <Eye size={12} aria-hidden />Inspect</button>
      </div>
    </article>
  );
}

/* ================= evidence graph ================= */
const ORDER = ['Problem', 'Evidence', 'Hypothesis', 'Cause', 'Recommendation', 'Outcome'];
const NCOLOR: Record<string, string> = { Problem: '#22d3ee', Evidence: '#38bdf8', Observation: '#38bdf8', Hypothesis: '#a78bfa', Cause: '#fb7185', Recommendation: '#34d399', Outcome: '#fbbf24' };
const shortLabel = (s: string, n = 13) => { s = (s || '').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
export function EvidenceGraph({ graph, onSelect, selected }: { graph: any; onSelect: (n: any) => void; selected: any }) {
  if (!graph?.nodes?.length) return <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-white/15 py-10 text-center"><Inbox size={28} className="text-slate-500" aria-hidden /><p className="nx-muted text-sm">No graph yet — run an investigation.</p></div>;
  const cols = ORDER.map((t) => ({ type: t, nodes: graph.nodes.filter((n: any) => n.type === t || (t === 'Evidence' && n.type === 'Observation')) }));
  const W = 1100, colW = W / ORDER.length, rowH = 62, topPad = 42;
  const pos: Record<string, { x: number; y: number }> = {};
  cols.forEach((c, ci) => c.nodes.forEach((n: any, i: number) => { pos[n.id] = { x: 30 + ci * colW + (colW - 60) / 2, y: topPad + 24 + i * rowH }; }));
  const maxRows = Math.max(1, ...cols.map((c) => c.nodes.length));
  const H = topPad + maxRows * rowH + 28;
  const path = (a: { x: number; y: number }, b: { x: number; y: number }) => { const mx = (a.x + b.x) / 2; return `M ${a.x} ${a.y} C ${mx} ${a.y}, ${mx} ${b.y}, ${b.x} ${b.y}`; };
  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1">
        {ORDER.map((t) => <span key={t} className="nx-muted flex items-center gap-1.5 text-[11px] font-medium"><span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: NCOLOR[t] }} aria-hidden />{t}</span>)}
      </div>
      <div className="overflow-x-auto rounded-2xl bg-[#080c16] ring-1 ring-white/10">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[720px]" role="img" aria-label="Evidence relationship graph">
          <defs><marker id="nx-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 1 L 9 5 L 0 9" fill="none" stroke="#64748b" strokeWidth="1.5" /></marker></defs>
          {cols.map((c, ci) => <text key={c.type} x={30 + ci * colW + (colW - 60) / 2} y={20} textAnchor="middle" fontSize={11} fontWeight={700} fill="#7d8aa5" letterSpacing={2}>{c.type.toUpperCase()}</text>)}
          {(graph.edges || []).map((e: any, i: number) => { const a = pos[e.from], b = pos[e.to]; if (!a || !b) return null; return <path key={i} d={path({ x: a.x + 48, y: a.y }, { x: b.x - 48, y: b.y })} fill="none" stroke="rgba(148,163,184,0.4)" strokeWidth={1.4} markerEnd="url(#nx-arrow)" />; })}
          {graph.nodes.map((n: any) => {
            const p = pos[n.id]; if (!p) return null;
            const active = selected?.id === n.id;
            const conf = typeof n.confidence === 'number' ? n.confidence : typeof n.detail?.confidence === 'number' ? n.detail.confidence : null;
            return <g key={n.id} onClick={() => onSelect(n)} className="cursor-pointer" tabIndex={0} role="button" aria-label={`${n.type}: ${n.label}`} onKeyDown={(ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); onSelect(n); } }}>
              <rect x={p.x - 48} y={p.y - 19} width={96} height={38} rx={11} fill="#111827" stroke={active ? '#22d3ee' : 'rgba(255,255,255,0.16)'} strokeWidth={active ? 2 : 1.2} />
              <circle cx={p.x - 32} cy={p.y} r={4.5} fill={NCOLOR[n.type] || '#64748b'} />
              <text x={p.x + 18} y={p.y - 1} textAnchor="middle" fontSize={9.5} fontWeight={600} fill="#e2e8f0">{shortLabel(n.label || n.id)}</text>
              <text x={p.x + 18} y={p.y + 11} textAnchor="middle" fontSize={8.5} fill="#7d8aa5">{conf !== null ? `${Math.round(conf * 100)}% score` : n.type}</text>
            </g>;
          })}
        </svg>
      </div>
    </div>
  );
}

/* ================= comparison table ================= */
export function ComparisonTable({ hyps, onReason }: { hyps: any[]; onReason: (h: any) => void }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full text-left text-sm">
        <thead className="bg-white/[0.04] text-[11px] uppercase tracking-wider text-slate-400">
          <tr><th className="px-3 py-2">Rank</th><th className="px-3 py-2">Hypothesis</th><th className="px-3 py-2">Supporting</th><th className="px-3 py-2">Contradicting</th><th className="px-3 py-2">Score</th><th className="px-3 py-2">Uncertainty</th><th className="px-3 py-2" /></tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {hyps.map((h: any, i: number) => (
            <tr key={i} className="hover:bg-white/[0.02]">
              <td className="px-3 py-2 font-bold">#{i + 1}</td>
              <td className="px-3 py-2 font-medium">{h.title}</td>
              <td className="px-3 py-2 text-emerald-300">{h.support}</td>
              <td className="px-3 py-2 text-rose-300">{h.contradiction}</td>
              <td className="px-3 py-2 font-bold text-cyan-300">{Math.round(h.confidence * 100)}</td>
              <td className="px-3 py-2 text-slate-400">{h.uncertainty}</td>
              <td className="px-3 py-2"><button className="nx-btn nx-btn-ghost !py-1 !text-xs" onClick={() => onReason(h)}>View reasoning</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ================= action center ================= */
export function ActionCenter({ recs, statuses, setStatus }: { recs: any[]; statuses: Record<number, string>; setStatus: (i: number, s: string) => void }) {
  const opts = ['Recommended', 'Under Review', 'Testing', 'Completed', 'Rejected'];
  const color: Record<string, string> = { Recommended: 'bg-slate-500/20 text-slate-300', 'Under Review': 'bg-amber-500/20 text-amber-300', Testing: 'bg-cyan-500/20 text-cyan-300', Completed: 'bg-emerald-500/20 text-emerald-300', Rejected: 'bg-rose-500/20 text-rose-300' };
  return (
    <ul className="space-y-2">
      {recs.map((r: any, i: number) => {
        const s = statuses[i] || 'Recommended';
        return (
          <li key={i} className="nx-inset flex flex-wrap items-center gap-2 p-3 text-sm">
            <span className="nx-chip">P{i + 1}</span>
            <span className="font-medium">{r.action}</span>
            <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-bold ${color[s]}`}>{s}</span>
            <select aria-label={`Status for action ${i + 1}`} value={s} onChange={(e) => setStatus(i, e.target.value)} className="nx-field !w-auto !py-1 text-xs">
              {opts.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </li>
        );
      })}
    </ul>
  );
}

/* ================= timeline ================= */
export function Timeline({ log }: { log: any[] }) {
  if (!log?.length) return <p className="nx-muted text-sm">No timeline yet.</p>;
  return (
    <ol className="relative border-l border-white/10 pl-6" aria-label="Investigation timeline">
      {log.map((e: any, i: number) => (
        <li key={i} className="pb-4 last:pb-0">
          <span className="absolute -left-[5px] h-2.5 w-2.5 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20" aria-hidden />
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-300">{e.stage}</p>
          <p className="mt-0.5 text-sm">{e.msg}</p>
        </li>
      ))}
    </ol>
  );
}

/* ================= investigation receipt ================= */
export function Receipt({ data, pid }: { data: any; pid: number | null }) {
  const blob = {
    problem: data.parsed?.problem || data.parsed?.title || '—',
    evidence: data.evidence?.length || 0,
    hypotheses: data.hypotheses?.length || 0,
    interventions: 3,
    recommendation: data.recommendations?.[0]?.action || '—',
    uncertainty: data.root_cause?.unknowns?.[0] || '—',
    status: 'Human review required',
    generated: new Date().toISOString(),
    graphNodes: data.graph?.nodes?.length || 0,
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(blob, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = `nexus-receipt-${pid || 'demo'}.json`; a.click(); URL.revokeObjectURL(url);
  };
  return (
    <div className="nx-inset p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="nx-h-display font-semibold">Investigation receipt</h3>
        <button className="nx-btn nx-btn-secondary !py-1.5 !text-xs" onClick={download}>Download JSON</button>
      </div>
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        {Object.entries(blob).map(([k, v]) => <div key={k} className="flex justify-between gap-2 border-b border-white/5 py-1"><dt className="nx-muted capitalize">{k.replace(/([A-Z])/g, ' $1')}</dt><dd className="font-medium">{String(v).slice(0, 80)}</dd></div>)}
      </dl>
      <p className="nx-muted mt-2 text-[11px]">Audit-style summary — share with stakeholders. Estimates never presented as facts; data marked demo where applicable.</p>
    </div>
  );
}

/* ================= states ================= */
export function EmptyState({ onStart, busy }: { onStart: () => void; busy: boolean }) {
  return (
    <div className="nx-card flex flex-col items-center px-6 py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-300 ring-1 ring-white/10" aria-hidden><FlaskConical size={26} /></span>
      <h2 className="nx-h-display mt-4 text-xl font-semibold">No investigation yet</h2>
      <p className="nx-muted mt-1.5 max-w-md text-sm leading-relaxed">Start with a real-world problem and NEXUS will build an investigation — evidence, hypotheses, simulation, actions and learning.</p>
      <button className="nx-btn nx-btn-primary mt-5" onClick={onStart} disabled={busy}><Play size={16} aria-hidden />Start Investigation</button>
    </div>
  );
}
export function LoadingInvestigation({ phase }: { phase: 'creating' | 'investigating' }) {
  return (
    <div className="nx-card px-6 py-8" role="status" aria-live="polite">
      <div className="flex items-center gap-3"><span className="nx-live-dot h-2.5 w-2.5 rounded-full bg-cyan-300" aria-hidden /><h2 className="nx-h-display text-xl font-semibold">NEXUS is investigating</h2></div>
      <ul className="mx-auto mt-5 max-w-md space-y-2.5">
        {[
          ['Structuring problem', 'done'], ['Gathering evidence', phase === 'investigating' ? 'active' : 'pending'],
          ['Evaluating hypotheses', phase === 'investigating' ? 'active' : 'pending'], ['Simulating interventions', 'pending'], ['Preparing recommendations', 'pending'],
        ].map(([label, state]) => (
          <li key={label} className="nx-inset flex items-center gap-3 px-4 py-2.5 text-sm">
            {state === 'done' && <Check size={16} className="flex-none text-emerald-400" aria-hidden />}
            {state === 'active' && <span className="nx-live-dot h-2 w-2 flex-none rounded-full bg-cyan-300" aria-hidden />}
            {state === 'pending' && <span className="h-2 w-2 flex-none rounded-full bg-slate-600" aria-hidden />}
            <span className={state === 'pending' ? 'nx-muted' : ''}>{label}</span>
          </li>
        ))}
      </ul>
      <div className="nx-shimmer mx-auto mt-5 h-1.5 max-w-md rounded-full" aria-hidden />
    </div>
  );
}
export function ErrorState({ message, onRetry, onReset }: { message: string; onRetry: () => void; onReset: () => void }) {
  return (
    <div className="nx-card flex flex-col items-center border-rose-400/30 px-6 py-12 text-center" role="alert">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/30" aria-hidden><TriangleAlert size={26} /></span>
      <h2 className="nx-h-display mt-4 text-xl font-semibold">Investigation interrupted</h2>
      <p className="nx-muted mt-1.5 max-w-md text-sm">We couldn&apos;t complete this investigation. {message || 'The service may be unreachable.'}</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2"><button className="nx-btn nx-btn-primary" onClick={onRetry}><RotateCcw size={16} aria-hidden />Retry</button><button className="nx-btn nx-btn-secondary" onClick={onReset}>Return to problem</button></div>
    </div>
  );
}
export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return <label className="block"><span className="nx-label">{label}</span>{children}{hint && <span className="nx-muted mt-1 block text-[11px]">{hint}</span>}</label>;
}
