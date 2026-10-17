import React, { useId } from 'react';
import brazil from '@svg-maps/brazil';
import { Check, ArrowUpRight, X, Building2, MapPin, Landmark, Star, CalendarDays } from 'lucide-react';
import { STAGES, STATUS, stageOf, eixo, fmtCompact, fmtBRL, fmtDate, pct, fisico, financeiro, chamadaStatus, CH_STATUS, daysUntil, UF } from './lib';
import { Bar, Pill, StatusPill, Btn } from './ui';
import { useApp } from './store';

/* Ciclo de vida do projeto. A etapa atual leva a seta da marca. */
export function Stepper({ p }: { p: any }) {
  const cur = stageOf(p); const st = STATUS[p.status];
  const dates = [p.submittedAt || p.createdAt, p.hab?.date, p.parecer?.date, p.selecao?.date, p.homolog?.date, p.contas?.enviadaEm, p.auditoria?.date];
  return <div className="stepper-scroll"><div className="stepper" role="list" aria-label="Ciclo de vida do projeto">
    <span className="prog" style={{ width: `calc((100% - 100% / ${STAGES.length}) * ${st.done ? STAGES.length - 1 : cur} / ${STAGES.length - 1})` }} />
    {STAGES.map((s, i) => {
      const cls = st.stop && i === cur ? 'is-stop' : i < cur || st.done ? 'is-done' : i === cur ? 'is-current' : '';
      return <div key={s.id} role="listitem" className={`step ${cls}`} aria-current={i === cur ? 'step' : undefined}>
        <span className="step-node">{cls === 'is-stop' ? <X size={15} /> : cls === 'is-done' ? <Check size={15} /> : cls === 'is-current' ? <ArrowUpRight size={16} /> : i + 1}</span>
        <span className="step-l">{s.label}</span>
        <span className="step-d">{(i < cur || st.done || (st.stop && i === cur)) && dates[i] ? fmtDate(dates[i]) : i === cur ? (st.stop ? '' : 'etapa atual') : ''}</span>
      </div>;
    })}
  </div></div>;
}
export function Pipeline({ projects, onPick }: any) {
  const active = projects.filter((p: any) => !STATUS[p.status].stop); const max = Math.max(1, ...STAGES.map((_, i) => active.filter((p: any) => stageOf(p) === i).length));
  return <div className="pipeline">{STAGES.map((s, i) => { const n = active.filter((p: any) => stageOf(p) === i).length; return <button key={s.id} className="pipe" onClick={() => onPick?.(i)} title={s.desc}><div className="pipe-n">{n}</div><div className="pipe-l"><span className="pipe-k">{s.n}</span> {s.label}</div><Bar value={n / max * 100} thin tone={i < 3 ? 'navy' : ''} /></button>; })}</div>;
}

/* Capa generativa por eixo temático (substitui fotos nos dados de demonstração). */
export function Cover({ eixoId, seed = 1, className = 'cover' }: any) {
  const id = useId().replace(/:/g, ''); const c = eixo(eixoId).c; let s = (seed * 9301 + 49297) % 233280; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  const hill = (base: number, amp: number, f: number, ph: number) => { let d = `M0,240 L0,${base}`; for (let x = 0; x <= 400; x += 20) d += ` L${x},${(base + Math.sin(x / 400 * Math.PI * f + ph) * amp + Math.sin(x / 400 * Math.PI * f * 2.3 + ph * 1.7) * amp * 0.35).toFixed(1)}`; return d + ' L400,240 Z'; };
  const cx = 70 + r() * 260, cy = 46 + r() * 34;
  return <svg className={className} viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" aria-hidden>
    <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={c[0]} /><stop offset="1" stopColor="#fff" stopOpacity=".9" /></linearGradient></defs>
    <rect width="400" height="240" fill={c[0]} /><rect width="400" height="240" fill={`url(#${id})`} opacity=".55" />
    <circle cx={cx} cy={cy} r={22 + r() * 10} fill="#fff" opacity=".78" />
    <path d={hill(128 + r() * 16, 16 + r() * 10, 2 + r() * 1.5, r() * 6)} fill={c[1]} />
    <path d={hill(160 + r() * 14, 14 + r() * 8, 2.6 + r() * 1.5, r() * 6)} fill={c[2]} />
    <path d={hill(196 + r() * 10, 10 + r() * 8, 3 + r() * 2, r() * 6)} fill={c[3]} />
  </svg>;
}

/* Mapa do Brasil por UF (formas de @svg-maps/brazil, CC BY 4.0). */
export function BrMap({ values, sel, onSel }: any) {
  const max = Math.max(1, ...Object.values(values as Record<string, number>));
  const cls = (v: number) => !v ? 'm0' : v / max > 0.6 ? 'm4' : v / max > 0.3 ? 'm3' : v / max > 0.1 ? 'm2' : 'm1';
  const b: any = (brazil as any).default || brazil;
  return <svg viewBox={b.viewBox} className="brmap" role="group" aria-label="Mapa do Brasil: recursos destinados por estado">
    {b.locations.map((l: any) => { const uf = l.id.toUpperCase(); return <path key={l.id} d={l.path} className={`${cls(values[uf])} ${sel === uf ? 'is-sel' : ''}`} tabIndex={0} role="button" aria-pressed={sel === uf} aria-label={`${l.name}: ${fmtCompact(values[uf] || 0)}`} onClick={() => onSel(sel === uf ? '' : uf)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSel(sel === uf ? '' : uf); } }}><title>{l.name}: {fmtCompact(values[uf] || 0)}</title></path>; })}
  </svg>;
}
export const MapLegend = () => <div className="map-legend"><span>menos</span>{[0, 1, 2, 3, 4].map(i => <i key={i} className={`m${i}`} style={{ background: `var(--map-${i})` }} />)}<span>mais recursos destinados</span></div>;

export function BarList({ items, fmt = fmtCompact, tone = '' }: any) {
  const max = Math.max(1, ...items.map((i: any) => i.value));
  return <div className="barlist">{items.map((i: any) => <div key={i.label} className="barlist-row"><span className="truncate">{i.label}</span><b className="num">{fmt(i.value)}</b><Bar value={i.value / max * 100} tone={tone} thin /></div>)}</div>;
}
export const Dual = ({ p }: { p: any }) => { const f = fisico(p), fi = financeiro(p); return <div className="dual"><span>Físico</span><Bar value={f} tone="navy" thin /><b>{f}%</b><span>Financeiro</span><Bar value={fi} tone={fi > f + 10 ? 'warn' : ''} thin /><b>{fi}%</b></div>; };

export function AreaChart({ points, height = 190, fmt = fmtCompact }: any) {
  const W = 440, H = height, L = 10, R = 10, T = 22, B = 26; const max = Math.max(1, ...points.map((p: any) => p.value)) * 1.12;
  const x = (i: number) => L + (W - L - R) * (points.length < 2 ? 0.5 : i / (points.length - 1)); const y = (v: number) => T + (H - T - B) * (1 - v / max);
  const d = points.map((p: any, i: number) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  return <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Evolução mensal">
    {[0.25, 0.5, 0.75].map(g => <line key={g} className="grid-l" x1={L} x2={W - R} y1={y(max * g)} y2={y(max * g)} />)}
    <line className="axis" x1={L} x2={W - R} y1={H - B} y2={H - B} />
    <path d={`${d} L${x(points.length - 1)},${H - B} L${x(0)},${H - B} Z`} fill="var(--accent)" opacity=".14" />
    <path d={d} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
    {points.map((p: any, i: number) => <g key={i}><circle cx={x(i)} cy={y(p.value)} r="3.5" fill="var(--surface)" stroke="var(--accent)" strokeWidth="2"><title>{p.label}: {fmt(p.value)}</title></circle><text x={x(i)} y={H - 8} textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'}>{p.label}</text></g>)}
    <text x={x(points.length - 1)} y={y(points[points.length - 1].value) - 9} textAnchor="end" style={{ fill: 'var(--ink)', fontWeight: 700 }}>{fmt(points[points.length - 1].value)}</text>
  </svg>;
}

/* Rastro do recurso: instrumentos (origem) → projetos (destino). */
export function Sankey({ sources, targets, links, onTarget }: any) {
  const W = 1000, PAD = 14, NODE = 12, GAP = 12, MIN = 36, LX = 300, RX = W - 340; const gid = useId().replace(/:/g, '');
  const total = Math.max(1, sources.reduce((s: number, n: any) => s + n.value, 0)); const scale = 250 / total; const hOf = (v: number) => Math.max(4, v * scale);
  const order = (id: string) => { const l = links.find((x: any) => x.target === id); return l ? sources.findIndex((n: any) => n.id === l.source) : 99; };
  const tg = [...targets].sort((a: any, b: any) => order(a.id) - order(b.id));
  const colH = (ns: any[]) => ns.reduce((s, n) => s + Math.max(MIN, hOf(n.value)), 0) + GAP * Math.max(0, ns.length - 1);
  const H = Math.max(colH(sources), colH(tg)) + PAD * 2;
  const place = (ns: any[]) => { let y = PAD + (H - PAD * 2 - colH(ns)) / 2; const o: any = {}; ns.forEach(n => { o[n.id] = { y, h: hOf(n.value), off: 0 }; y += Math.max(MIN, hOf(n.value)) + GAP; }); return o; };
  const sy = place(sources), ty = place(tg);
  const paths = sources.flatMap((n: any) => links.filter((l: any) => l.source === n.id).sort((a: any, b: any) => (ty[a.target]?.y || 0) - (ty[b.target]?.y || 0))).map((l: any, i: number) => {
    const s = sy[l.source], t = ty[l.target]; if (!s || !t) return null; const h = Math.max(2, l.value * scale); const y0 = s.y + s.off, y1 = t.y + t.off; s.off += h; t.off += h; const x0 = LX + NODE, x1 = RX, mx = (x0 + x1) / 2;
    return <path key={i} d={`M${x0},${y0} C${mx},${y0} ${mx},${y1} ${x1},${y1} L${x1},${y1 + h} C${mx},${y1 + h} ${mx},${y0 + h} ${x0},${y0 + h} Z`} fill={`url(#${gid})`}><title>{fmtBRL(l.value)}</title></path>; });
  return <div className="dt-wrap"><svg viewBox={`0 0 ${W} ${H}`} className="sankey" style={{ minWidth: 720, width: '100%' }} role="img" aria-label="Fluxo dos recursos dos instrumentos para os projetos">
    <defs><linearGradient id={gid} x1="0" x2="1"><stop offset="0" stopColor="var(--primary)" stopOpacity=".42" /><stop offset="1" stopColor="var(--accent)" stopOpacity=".5" /></linearGradient></defs>
    {paths}
    {sources.map((n: any) => { const s = sy[n.id]; const used = links.filter((l: any) => l.source === n.id).reduce((a: number, l: any) => a + l.value, 0) * scale;
      return <g key={n.id}><rect x={LX} y={s.y} width={NODE} height={s.h} rx="2" fill="var(--line-2)" /><rect x={LX} y={s.y} width={NODE} height={Math.min(s.h, used)} rx="2" fill="var(--primary)" />
        <text x={LX - 10} y={s.y + 12} textAnchor="end" style={{ fontWeight: 650 }}>{n.label}</text><text className="v" x={LX - 10} y={s.y + 27} textAnchor="end">{n.sub}</text></g>; })}
    {tg.map((n: any) => { const t = ty[n.id]; return <g key={n.id} style={{ cursor: onTarget ? 'pointer' : undefined }} onClick={() => onTarget?.(n.id)}><rect x={RX} y={t.y} width={NODE} height={t.h} rx="2" fill="var(--accent)" />
      <text x={RX + NODE + 10} y={t.y + 12} style={{ fontWeight: 650 }}>{n.label.length > 40 ? n.label.slice(0, 39) + '…' : n.label}</text><text className="v" x={RX + NODE + 10} y={t.y + 27}>{n.sub}</text></g>; })}
  </svg></div>;
}

export const SysChips = ({ p }: { p: any }) => !p.sei && !p.simp ? null : <span className="row gap-6 wrap">{p.sei && <span className="sys" title="Processo no SEI (integração simulada)"><i className="dot" /><b>SEI</b>{p.sei.replace('SEI ', '')}</span>}{p.simp ? <span className="sys" title="Movimentação no Sistema Único (integração simulada)"><i className="dot" /><b>Único</b>{p.simp.replace('ÚNICO ', '')}</span> : p.status !== 'rascunho' && <span className="sys is-pending" title="Ainda sem movimentação no SIMP"><i className="dot" /><b>Único</b>sem movimentação</span>}</span>;

/* Cartão padronizado de projeto */
export function ProjectCard({ p, action, match, to }: any) {
  const { go, inst } = useApp(); const e = eixo(p.eixo); const dest = to || 'projetos/' + p.id;
  return <article className="pcard">
    <div className="pcard-cover"><Cover eixoId={p.eixo} seed={p.art} /><StatusPill status={p.status} />{p.parecer && <span className="pcard-score" title="Nota do parecer técnico"><Star size={12} aria-hidden />{String(p.parecer.nota).replace('.', ',')}</span>}</div>
    <div className="pcard-body">
      <span className="tiny muted num">{p.code}</span>
      <button className="pcard-title clamp-2" onClick={() => go(dest)}>{p.title}</button>
      <div className="pcard-meta"><span className="row gap-4"><Building2 size={13} aria-hidden />{inst(p.instId)?.name}</span></div>
      <div className="pcard-meta"><span className="row gap-4"><Landmark size={13} aria-hidden />{p.unidade}</span><span className="row gap-4"><MapPin size={13} aria-hidden />{UF[p.uf]}</span><span>{e.label}</span></div>
      {match != null && <div className="row gap-6 small"><Bar value={match} thin /><b className="num nowrap">{match}% compatível</b></div>}
      {['execucao', 'contas', 'auditoria', 'concluido'].includes(p.status) && <Dual p={p} />}
    </div>
    <div className="pcard-foot"><div className="grow"><div className="tiny muted">{p.selecao ? 'Valor destinado' : 'Valor pleiteado'}</div><b className="num">{fmtBRL(p.selecao?.valor || p.valor)}</b></div>{action || <Btn size="sm" onClick={() => go(dest)}>Ver detalhes</Btn>}</div>
  </article>;
}
/* Cartão padronizado de edital/chamada */
export function ChamadaCard({ c, n, onOpen }: any) {
  const st = chamadaStatus(c); const s = CH_STATUS[st]; const dias = daysUntil(st === 'breve' ? c.abertura : c.encerramento);
  return <article className={`ccard ${st === 'breve' ? 'is-soon' : st === 'encerrada' ? 'is-closed' : ''}`}>
    <div className="row between wrap"><span className="small muted strong">{c.code}</span><Pill tone={s.tone}>{s.label}</Pill></div>
    <button className="pcard-title" style={{ fontSize: '1.05rem' }} onClick={onOpen}>{c.title}</button>
    <p className="small muted clamp-2">{c.desc}</p>
    <div className="pcard-meta"><span className="row gap-4"><Landmark size={13} aria-hidden />{c.unidade}</span><span>{eixo(c.eixo).label}</span><span className="row gap-4"><MapPin size={13} aria-hidden />{c.ufs.includes('BR') ? 'Nacional' : c.ufs.join(', ')}</span></div>
    <div className="row between wrap" style={{ marginTop: 'auto', paddingTop: 6 }}>
      <div><div className="tiny muted">Valor previsto</div><b className="num">{fmtCompact(c.valor)}</b></div>
      <div><div className="tiny muted">{st === 'breve' ? 'Abre em' : st === 'aberta' ? 'Encerra em' : 'Encerrada em'}</div><b className="num row gap-4"><CalendarDays size={14} aria-hidden />{st === 'encerrada' ? fmtDate(c.encerramento) : `${dias} ${dias === 1 ? 'dia' : 'dias'}`}</b></div>
      {n != null && <div><div className="tiny muted">Projetos inscritos</div><b className="num">{n}</b></div>}
      <Btn size="sm" variant={st === 'aberta' ? 'primary' : 'ghost'} onClick={onOpen}>Ver edital</Btn>
    </div>
  </article>;
}
export const monthly = (projects: any[], months = 8) => {
  const out: any[] = []; const now = new Date();
  for (let i = months; i >= 1; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; out.push({ k, label: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''), value: 0 }); }
  projects.forEach(p => (p.despesas || []).forEach((x: any) => { if (x.status === 'glosada') return; const o = out.find(m => m.k === x.date.slice(0, 7)); if (o) o.value += x.valor; }));
  return out;
};
export { pct };
