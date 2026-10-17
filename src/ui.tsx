import React, { useEffect, useMemo, useState } from 'react';
import { X, ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, Info, TriangleAlert, CircleCheck, FileSpreadsheet, FileText, ArrowLeft } from 'lucide-react';
import { STATUS, csv, initials } from './lib';
import { tablePdf } from './pdf';
import { useApp } from './store';

export function Btn({ variant = 'ghost', size, icon: I, children, className = '', ...p }: any) {
  return <button type="button" className={`btn btn-${variant} ${size === 'sm' ? 'btn-sm' : ''} ${children == null ? 'btn-icon' : ''} ${className}`} {...p}>{I && <I size={size === 'sm' ? 15 : 17} aria-hidden />}{children}</button>;
}
export const Pill = ({ tone = 'neutral', icon: I, children }: any) => <span className={`pill t-${tone}`}>{I ? <I size={13} aria-hidden /> : <i className="dot" />}{children}</span>;
export const StatusPill = ({ status }: { status: string }) => { const s = STATUS[status] || { label: status, tone: 'neutral' }; return <Pill tone={s.tone}>{s.label}</Pill>; };
export const Avatar = ({ name, className = '' }: any) => <span className={`avatar ${className}`} aria-hidden>{initials(name)}</span>;
export const Bar = ({ value, tone = '', thin }: any) => <div className={`bar ${tone} ${thin ? 'thin' : ''}`} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}><i style={{ width: Math.max(0, Math.min(100, value)) + '%' }} /></div>;
export const Switch = ({ on, onChange, label, disabled }: any) => <button type="button" role="switch" aria-checked={!!on} aria-label={label} disabled={disabled} className="switch" onClick={() => onChange(!on)} />;
export const Seg = ({ value, onChange, options }: any) => <div className="seg" role="group">{options.map((o: any) => <button key={o.id} type="button" className={value === o.id ? 'is-on' : ''} aria-pressed={value === o.id} onClick={() => onChange(o.id)}>{o.icon && <o.icon size={14} aria-hidden />}{o.label}</button>)}</div>;
export const Field = ({ label, hint, children, span }: any) => <label className={`field ${span ? 'span-2' : ''}`}><span className="field-l">{label}</span>{children}{hint && <span className="hint">{hint}</span>}</label>;
export const Group = ({ label, hint, children, span }: any) => <div className={`field ${span ? 'span-2' : ''}`} role="group" aria-label={label}><span className="field-l">{label}</span>{children}{hint && <span className="hint">{hint}</span>}</div>;
export const Note = ({ tone = '', children }: any) => { const I = tone === 'warn' || tone === 'danger' ? TriangleAlert : tone === 'ok' ? CircleCheck : Info; return <div className={`note ${tone}`}><I size={17} aria-hidden /><div>{children}</div></div>; };
export const Empty = ({ title, children, action }: any) => <div className="empty"><h3>{title}</h3>{children && <p>{children}</p>}{action}</div>;
export const Stat = ({ v, l, d }: any) => <div className="stat"><div className="stat-v">{v}</div><div className="stat-l">{l}</div>{d && <div className="stat-d">{d}</div>}</div>;

export function PageHead({ title, sub, back, children }: any) {
  const { go } = useApp();
  return <div className="page-head"><div>{back && <button className="crumb" onClick={() => go(back.to)}><ArrowLeft size={15} aria-hidden />{back.label}</button>}<h1>{title}</h1>{sub && <p>{sub}</p>}</div>{children && <div className="row wrap">{children}</div>}</div>;
}
export function Tabs({ tabs, value, onChange }: any) {
  return <div className="tabs" role="tablist">{tabs.map((t: any) => <button key={t.id} type="button" role="tab" aria-selected={value === t.id} className={`tab ${value === t.id ? 'is-active' : ''}`} onClick={() => onChange(t.id)}>{t.label}{t.count ? <span className="tab-n">{t.count}</span> : null}</button>)}</div>;
}
function useEsc(onClose: any) { useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose?.(); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [onClose]); }
export function Modal({ title, sub, onClose, children, footer, size = '' }: any) {
  useEsc(onClose);
  return <div className="scrim" onMouseDown={e => { if (e.target === e.currentTarget) onClose?.(); }}>
    <div className={`modal ${size}`} role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal-head"><div><h2>{title}</h2>{sub && <p className="muted small" style={{ marginTop: 2 }}>{sub}</p>}</div><Btn variant="quiet" size="sm" icon={X} aria-label="Fechar" onClick={onClose} /></div>
      <div className="modal-body">{children}</div>
      {footer && <div className="modal-foot">{footer}</div>}
    </div></div>;
}
export function Drawer({ title, sub, onClose, children, footer }: any) {
  useEsc(onClose);
  return <div className="scrim side" onMouseDown={e => { if (e.target === e.currentTarget) onClose?.(); }}>
    <div className="drawer" role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal-head"><div><h2>{title}</h2>{sub && <p className="muted small" style={{ marginTop: 2 }}>{sub}</p>}</div><Btn variant="quiet" size="sm" icon={X} aria-label="Fechar" onClick={onClose} /></div>
      <div className="modal-body grow">{children}</div>
      {footer && <div className="modal-foot">{footer}</div>}
    </div></div>;
}
export function Confirm({ title, children, cta, variant = 'cta', onConfirm, onClose }: any) {
  return <Modal title={title} onClose={onClose} footer={<><Btn onClick={onClose}>Cancelar</Btn><Btn variant={variant} onClick={() => { onConfirm(); onClose(); }}>{cta}</Btn></>}><div className="prose">{children}</div></Modal>;
}

/* Tabela de dados: ordenação por coluna, paginação e exportação CSV/PDF */
export function DataTable({ rows, columns, onRow, pageSize = 10, toolbar, empty, exportName, exportTitle, exportSub, canExport }: any) {
  const { exportFile } = useApp();
  const [sort, setSort] = useState<{ key: string; dir: number } | null>(null); const [page, setPage] = useState(0);
  const sorted = useMemo(() => {
    if (!sort) return rows; const col = columns.find((c: any) => c.key === sort.key); const f = col?.sort || col?.exp; if (!f) return rows;
    return [...rows].sort((a, b) => { const x = f(a), y = f(b); return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x ?? '').localeCompare(String(y ?? ''), 'pt-BR', { numeric: true })) * sort.dir; });
  }, [rows, sort, columns]);
  const pages = Math.max(1, Math.ceil(sorted.length / pageSize)); const pg = Math.min(page, pages - 1);
  useEffect(() => { setPage(0); }, [rows.length]);
  const view = sorted.slice(pg * pageSize, pg * pageSize + pageSize);
  const expCols = columns.filter((c: any) => c.exp); const cols = columns.filter((c: any) => !c.exportOnly);
  const doCsv = () => { const text = csv([expCols.map((c: any) => c.label), ...sorted.map((r: any) => expCols.map((c: any) => c.exp(r)))]); exportFile(`${exportName}.csv`, text, text); };
  const doPdf = () => exportFile(`${exportName}.pdf`, tablePdf({ title: exportTitle || exportName, subtitle: `${exportSub ? exportSub + ' · ' : ''}${sorted.length} registros`, columns: expCols.map((c: any) => ({ label: c.label, w: c.w || 1, align: c.align })), rows: sorted.map((r: any) => expCols.map((c: any) => c.exp(r))) }));
  const click = (key: string) => setSort(s => !s || s.key !== key ? { key, dir: 1 } : s.dir === 1 ? { key, dir: -1 } : null);
  return <div className="card">
    {(toolbar || (exportName && canExport)) && <div className="toolbar">{toolbar}{exportName && canExport && <div className="row gap-6" style={{ marginLeft: 'auto' }}><Btn size="sm" icon={FileSpreadsheet} onClick={doCsv}>CSV</Btn><Btn size="sm" icon={FileText} onClick={doPdf}>PDF</Btn></div>}</div>}
    {sorted.length === 0 ? empty : <div className="dt-wrap"><table className="dt">
      <thead><tr>{cols.map((c: any) => { const on = sort?.key === c.key; const I = on ? (sort!.dir === 1 ? ChevronUp : ChevronDown) : ChevronsUpDown;
        return <th key={c.key} className={c.align === 'right' ? 'right' : ''} aria-sort={on ? (sort!.dir === 1 ? 'ascending' : 'descending') : undefined}>{(c.sort || c.exp) && c.label ? <button className={`th-sort ${on ? 'is-on' : ''}`} onClick={() => click(c.key)}>{c.label}<I size={13} aria-hidden /></button> : c.label}</th>; })}</tr></thead>
      <tbody>{view.map((r: any) => <tr key={r.id || r.key} className={onRow ? 'is-click' : ''} onClick={onRow ? () => onRow(r) : undefined}>{cols.map((c: any) => <td key={c.key} className={`${c.align === 'right' ? 'right num' : ''} ${c.nowrap ? 'nowrap' : ''}`} onClick={c.stop ? e => e.stopPropagation() : undefined}>{c.render ? c.render(r) : c.exp?.(r)}</td>)}</tr>)}</tbody>
    </table></div>}
    {sorted.length > pageSize && <div className="dt-foot"><span>{pg * pageSize + 1}–{Math.min(sorted.length, (pg + 1) * pageSize)} de {sorted.length}</span><span className="grow" /><Btn size="sm" icon={ChevronLeft} aria-label="Página anterior" disabled={pg === 0} onClick={() => setPage(pg - 1)} /><span className="num">{pg + 1} / {pages}</span><Btn size="sm" icon={ChevronRight} aria-label="Próxima página" disabled={pg >= pages - 1} onClick={() => setPage(pg + 1)} /></div>}
  </div>;
}
