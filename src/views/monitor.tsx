import React, { useMemo, useState } from 'react';
import { Search, Upload, Clock, TriangleAlert, FileCheck2, Check, Receipt } from 'lucide-react';
import { fmtBRL, fmtCompact, fmtDate, sum, despesas, fisico, financeiro, daysUntil, norm, linkMeta, STATUS, clamp } from '../lib';
import { useApp } from '../store';
import { Btn, PageHead, Empty, StatusPill, Pill, Tabs, DataTable, Stat, Bar, Seg } from '../ui';
import { Dual, AreaChart, monthly } from '../viz';
import { MediaGrid, MediaAdd, MediaViewer, KIND, VIS } from '../media';

export function Monitoramento() {
  const { scoped, go, can, inst } = useApp();
  const ex = scoped.filter((p: any) => ['execucao', 'contas'].includes(p.status)); const todos = scoped.filter((p: any) => p.exec);
  const metas = todos.flatMap((p: any) => p.metas); const cumpridas = metas.filter((m: any) => m.realizado >= m.alvo).length;
  const dest = sum(ex, (p: any) => p.selecao.valor); const lanc = sum(ex, (p: any) => despesas(p).lancado); const fisMed = ex.length ? Math.round(sum(ex, fisico) / ex.length) : 0;
  const alertas = useMemo(() => {
    const a: any[] = [];
    ex.forEach((p: any) => {
      const du = daysUntil(p.exec?.fim); const f = fisico(p), fi = financeiro(p);
      if (p.status === 'execucao' && du <= 60) a.push({ p, tone: du < 0 ? 'danger' : 'warn', icon: Clock, t: du < 0 ? `Vigência vencida há ${-du} dias` : `Vigência termina em ${du} dias`, s: `Execução física em ${f}%` });
      if (p.status === 'execucao' && fi > f + 10) a.push({ p, tone: 'warn', icon: TriangleAlert, t: 'Gasto à frente da execução física', s: `Financeiro ${fi}% · físico ${f}%` });
      const ag = p.relatorios.filter((r: any) => r.status === 'aguardando').length; if (ag) a.push({ p, tone: 'info', icon: FileCheck2, t: `${ag} ${ag === 1 ? 'relatório aguarda' : 'relatórios aguardam'} ateste`, s: 'Enviado pela instituição' });
      if (p.status === 'contas') a.push({ p, tone: 'warn', icon: Receipt, t: 'Prestação de contas final em análise', s: `Enviada em ${fmtDate(p.contas?.enviadaEm)}` });
    });
    return a.sort((x, y) => (x.tone === 'danger' ? 0 : x.tone === 'warn' ? 1 : 2) - (y.tone === 'danger' ? 0 : y.tone === 'warn' ? 1 : 2));
  }, [scoped]);
  return <>
    <PageHead title="Painel executivo" sub="Execução física e financeira dos projetos homologados, metas cumpridas e alertas de vigência." />
    <div className="stack">
      <div className="stats"><Stat v={ex.length} l="Projetos em monitoramento" /><Stat v={fisMed + '%'} l="Execução física média" d={<Bar value={fisMed} thin tone="navy" />} /><Stat v={Math.round(lanc / (dest || 1) * 100) + '%'} l="Execução financeira" d={`${fmtCompact(lanc)} de ${fmtCompact(dest)}`} /><Stat v={`${cumpridas} de ${metas.length}`} l="Metas cumpridas" /><Stat v={alertas.filter(a => a.icon === Clock).length} l="Alertas de vigência" /></div>
      <div className="split">
        <div className="card"><div className="card-head"><h3>Execução física e financeira por projeto</h3></div>{ex.length ? <div>{ex.map((p: any) => <button key={p.id} className="list-btn" style={{ alignItems: 'flex-start' }} onClick={() => go(`projetos/${p.id}/monitoramento`)}><span className="grow" style={{ minWidth: 0 }}><b className="cell-main truncate" style={{ display: 'block' }}>{p.title}</b><span className="cell-sub">{p.unidade} · {fmtCompact(p.selecao.valor)} · vigência até {fmtDate(p.exec?.fim)}</span></span><span style={{ width: 'min(46%, 300px)' }}><Dual p={p} /></span></button>)}</div> : <Empty title="Nenhum projeto em execução" />}</div>
        <div className="stack">
          <div className="card card-pad"><h3 style={{ marginBottom: 6 }}>Desembolso mensal</h3><p className="small muted" style={{ marginBottom: 8 }}>Despesas lançadas pelas instituições, sem as glosadas.</p><AreaChart points={monthly(todos)} height={200} /></div>
          <div className="card"><div className="card-head"><h3>Alertas</h3>{alertas.length > 0 && <span className="tab-n">{alertas.length}</span>}</div>{alertas.length ? <div>{alertas.map((a, i) => <button key={i} className="list-btn" onClick={() => go(`projetos/${a.p.id}/${a.icon === Receipt ? 'contas' : 'monitoramento'}`)}><span className={`ico-badge t-${a.tone}`}><a.icon size={16} aria-hidden /></span><span className="grow" style={{ minWidth: 0 }}><b className="small" style={{ display: 'block' }}>{a.t}</b><span className="tiny muted truncate" style={{ display: 'block' }}>{a.p.title} · {a.s}</span></span></button>)}</div> : <Empty title="Sem alertas" />}</div>
        </div>
      </div>
      <DataTable rows={todos} onRow={(p: any) => go(`projetos/${p.id}/monitoramento`)} exportName="sigap-monitoramento" exportTitle="Monitoramento de projetos" canExport={can('projetos', 'exportar') || can('contas', 'exportar')} toolbar={<h3 className="grow">Projetos homologados</h3>}
        columns={[
          { key: 'code', label: 'Código', w: 1.4, exp: (p: any) => p.code, exportOnly: true },
          { key: 'title', label: 'Projeto', w: 3, exp: (p: any) => p.title, render: (p: any) => <><div className="cell-main">{p.title}</div><div className="cell-sub">{p.code} · {inst(p.instId)?.name}</div></> },
          { key: 'un', label: 'Unidade', w: 0.8, exp: (p: any) => p.unidade, nowrap: true },
          { key: 'dest', label: 'Destinado', w: 1.2, align: 'right', exp: (p: any) => fmtBRL(p.selecao.valor), sort: (p: any) => p.selecao.valor, nowrap: true },
          { key: 'fis', label: 'Físico', w: 0.7, align: 'right', exp: (p: any) => fisico(p) + '%', sort: fisico },
          { key: 'fin', label: 'Financeiro', w: 0.8, align: 'right', exp: (p: any) => financeiro(p) + '%', sort: financeiro },
          { key: 'fim', label: 'Vigência até', w: 1, exp: (p: any) => fmtDate(p.exec?.fim), sort: (p: any) => p.exec?.fim, nowrap: true },
          { key: 'st', label: 'Situação', w: 1.4, exp: (p: any) => STATUS[p.status].label, render: (p: any) => <StatusPill status={p.status} /> },
        ]} />
    </div>
  </>;
}

export function Relatorios({ tab }: { tab?: string }) {
  const { scoped, go, can, act, toast, inst, userById } = useApp(); const t = tab === 'contas' ? 'contas' : 'relatorios'; const [sit, setSit] = useState('');
  const rels = scoped.flatMap((p: any) => p.relatorios.map((r: any) => ({ id: r.id, p, r }))).filter((x: any) => !sit || x.r.status === sit).sort((a: any, b: any) => b.r.date.localeCompare(a.r.date));
  const contas = scoped.filter((p: any) => p.exec); const SIT: any = { aguardando: ['Aguarda ateste', 'warn'], atestado: ['Regularidade atestada', 'ok'], devolvido: ['Devolvido', 'danger'] };
  return <>
    <PageHead title="Relatórios e contas" sub="As instituições enviam relatórios e comprovantes da execução. A equipe atesta a regularidade e analisa a prestação de contas, para fins de auditoria." />
    <div className="stack-sm">
      <Tabs tabs={[{ id: 'relatorios', label: 'Repositório de relatórios', count: scoped.flatMap((p: any) => p.relatorios).filter((r: any) => r.status === 'aguardando').length }, { id: 'contas', label: 'Prestação de contas', count: scoped.filter((p: any) => p.status === 'contas').length }]} value={t} onChange={(x: string) => go('relatorios/' + x)} />
      {t === 'relatorios' ? <DataTable rows={rels} onRow={(x: any) => go(`projetos/${x.p.id}/monitoramento`)} exportName="sigap-relatorios" exportTitle="Relatórios de execução" canExport={can('contas', 'exportar')}
        toolbar={<select className="select" value={sit} onChange={e => setSit(e.target.value)} aria-label="Situação"><option value="">Todas as situações</option><option value="aguardando">Aguardando ateste</option><option value="atestado">Atestados</option><option value="devolvido">Devolvidos</option></select>}
        empty={<Empty title="Nenhum relatório nesta situação" />}
        columns={[
          { key: 'rel', label: 'Relatório', w: 2, exp: (x: any) => `${x.r.title} · ${x.r.periodo}`, render: (x: any) => <><div className="cell-main">{x.r.title}</div><div className="cell-sub">{x.r.periodo} · {x.r.mediaIds.length} anexos</div></> },
          { key: 'proj', label: 'Projeto', w: 3, exp: (x: any) => x.p.title, render: (x: any) => <><div>{x.p.title}</div><div className="cell-sub">{x.p.code} · {inst(x.p.instId)?.name}</div></> },
          { key: 'date', label: 'Enviado em', w: 1, exp: (x: any) => fmtDate(x.r.date), sort: (x: any) => x.r.date, nowrap: true },
          { key: 'sit', label: 'Situação', w: 1.6, exp: (x: any) => SIT[x.r.status][0], render: (x: any) => <><Pill tone={SIT[x.r.status][1]}>{SIT[x.r.status][0]}</Pill>{x.r.atestadoEm && <div className="cell-sub">{userById(x.r.atestadoPor)?.name?.split(' ')[0]} · {fmtDate(x.r.atestadoEm)}</div>}</> },
          { key: 'act', label: '', stop: true, render: (x: any) => x.r.status === 'aguardando' && can('monitoramento', 'aprovar') ? <Btn size="sm" variant="ok" icon={Check} onClick={() => { act.atestar(x.p.id, x.r.id, true); toast('Regularidade atestada.'); }}>Atestar</Btn> : null },
        ]} />
        : <DataTable rows={contas} onRow={(p: any) => go(`projetos/${p.id}/contas`)} exportName="sigap-prestacao-de-contas" exportTitle="Prestação de contas" canExport={can('contas', 'exportar')} empty={<Empty title="Nenhum projeto com despesas" />}
          columns={[
            { key: 'code', label: 'Código', w: 1.4, exp: (p: any) => p.code, exportOnly: true },
            { key: 'title', label: 'Projeto', w: 3, exp: (p: any) => p.title, render: (p: any) => <><div className="cell-main">{p.title}</div><div className="cell-sub">{p.code} · {inst(p.instId)?.name}</div></> },
            { key: 'dest', label: 'Destinado', w: 1.2, align: 'right', exp: (p: any) => fmtBRL(p.selecao.valor), sort: (p: any) => p.selecao.valor, nowrap: true },
            { key: 'apr', label: 'Aprovado', w: 1.2, align: 'right', exp: (p: any) => fmtBRL(despesas(p).aprovado), sort: (p: any) => despesas(p).aprovado, nowrap: true },
            { key: 'pen', label: 'Em análise', w: 1.2, align: 'right', exp: (p: any) => fmtBRL(despesas(p).pendente), sort: (p: any) => despesas(p).pendente, nowrap: true },
            { key: 'glo', label: 'Glosado', w: 1.1, align: 'right', exp: (p: any) => fmtBRL(despesas(p).glosado), sort: (p: any) => despesas(p).glosado, nowrap: true },
            { key: 'st', label: 'Situação', w: 1.5, exp: (p: any) => STATUS[p.status].label, render: (p: any) => <StatusPill status={p.status} /> },
            { key: 'act', label: '', stop: true, render: (p: any) => p.status === 'contas' && can('contas', 'aprovar') ? <Btn size="sm" variant="primary" onClick={() => go(`projetos/${p.id}/contas`)}>Analisar</Btn> : null },
          ]} />}
    </div>
  </>;
}

export function Midias() {
  const { state, scoped, role, can, user } = useApp(); const [kind, setKind] = useState(''); const [q, setQ] = useState(''); const [pid, setPid] = useState(''); const [vis, setVis] = useState(''); const [add, setAdd] = useState(false); const [open, setOpen] = useState<any>(null);
  const ids = new Set(scoped.map((p: any) => p.id)); const base = state.media.filter((m: any) => role.scope !== 'proprio' || ids.has(m.projectId) || m.by === user.id);
  const isKind = (m: any, k: string) => k === 'video' ? m.kind === 'video' || (m.kind === 'link' && linkMeta(m.url).tipo === 'Vídeo') : k === 'link' ? m.kind === 'link' && linkMeta(m.url).tipo !== 'Vídeo' : m.kind === k;
  const items = base.filter((m: any) => (!kind || isKind(m, kind)) && (!pid || m.projectId === pid) && (!vis || m.visibility === vis) && (!q || norm(m.title + (m.desc || '')).includes(norm(q))));
  const count = (k: string) => base.filter((m: any) => isKind(m, k)).length;
  return <>
    <PageHead title="Mídias" sub="Imagens, vídeos, áudios, documentos e links de todos os projetos, com visibilidade definida item a item.">{can('midias', 'criar') && <Btn variant="primary" icon={Upload} onClick={() => setAdd(true)}>Adicionar mídia</Btn>}</PageHead>
    <div className="stack-sm">
      <div className="card"><div className="toolbar" style={{ border: 0 }}>
        <div className="search"><Search size={15} aria-hidden /><input className="input" placeholder="Buscar por título ou descrição" value={q} onChange={e => setQ(e.target.value)} aria-label="Buscar mídias" /></div>
        <select className="select" value={pid} onChange={e => setPid(e.target.value)} aria-label="Projeto" style={{ maxWidth: 260 }}><option value="">Todos os projetos</option>{scoped.filter((p: any) => base.some((m: any) => m.projectId === p.id)).map((p: any) => <option key={p.id} value={p.id}>{p.title}</option>)}</select>
        <select className="select" value={vis} onChange={e => setVis(e.target.value)} aria-label="Visibilidade"><option value="">Qualquer visibilidade</option>{Object.entries(VIS).map(([k, v]: any) => <option key={k} value={k}>{v.label}</option>)}</select>
      </div><div className="toolbar" style={{ border: 0, borderTop: '1px solid var(--line)' }}><div className="chips"><button className={`chip ${!kind ? 'is-on' : ''}`} aria-pressed={!kind} onClick={() => setKind('')}>Todas · {base.length}</button>{['image', 'video', 'doc', 'link', 'audio'].map(k => { const K = KIND[k]; return <button key={k} className={`chip ${kind === k ? 'is-on' : ''}`} aria-pressed={kind === k} onClick={() => setKind(kind === k ? '' : k)}><K.icon size={14} aria-hidden />{K.plural} · {count(k)}</button>; })}</div></div></div>
      <MediaGrid items={items} onOpen={setOpen} empty={<div className="card"><Empty title="Nenhuma mídia com esses filtros" action={can('midias', 'criar') ? <Btn icon={Upload} onClick={() => setAdd(true)}>Adicionar mídia</Btn> : undefined}>Envie arquivos ou registre links de vídeos, páginas e documentos.</Empty></div>} />
    </div>
    {add && <MediaAdd onClose={() => setAdd(false)} />}
    {open && <MediaViewer m={open} onClose={() => setOpen(null)} />}
  </>;
}
