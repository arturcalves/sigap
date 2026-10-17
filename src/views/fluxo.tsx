import React, { useMemo, useState } from 'react';
import { Search, Plus, FileSpreadsheet, FileText, Paperclip, Check, Square } from 'lucide-react';
import { EIXOS, UF, INSTR_TIPOS, eixo, fmtBRL, fmtCompact, fmtDate, norm, sum, saldoInstr, matchScore, daysUntil, csv, STATUS } from '../lib';
import { useApp, useQueues, totals } from '../store';
import { Btn, PageHead, Empty, StatusPill, Pill, Tabs, Modal, Drawer, Field, DataTable, Note, Bar, Stat, Switch } from '../ui';
import { ProjectCard, Sankey } from '../viz';
import { tablePdf } from '../pdf';
import { MediaAdd } from '../media';
import { DestinarModal } from './detalhe';

export function Banco() {
  const { state, can, inst, exportFile, go } = useApp(); const q = useQueues();
  const [s, setS] = useState(''); const [ex, setEx] = useState(''); const [uf, setUf] = useState(''); const [fx, setFx] = useState(''); const [ins, setIns] = useState(''); const [ord, setOrd] = useState('nota'); const [dest, setDest] = useState<any>(null);
  const comSaldo = q.meusInstr.map((i: any) => ({ i, saldo: saldoInstr(state, i.id) })).filter((x: any) => x.saldo > 0); const cur = comSaldo.find((x: any) => x.i.id === ins);
  const rows = useMemo(() => q.julgamento.filter((p: any) => (!ex || p.eixo === ex) && (!uf || p.uf === uf) && (!fx || (fx === 'a' ? p.valor <= 500000 : fx === 'b' ? p.valor > 500000 && p.valor <= 1000000 : p.valor > 1000000)) && (!s || norm(p.title + p.code + inst(p.instId)?.name + p.municipios).includes(norm(s))))
    .map((p: any) => ({ p, m: cur ? matchScore(p, cur.i, cur.saldo) : null })).sort((a: any, b: any) => cur ? b.m - a.m : ord === 'nota' ? (b.p.parecer?.nota || 0) - (a.p.parecer?.nota || 0) : ord === 'maior' ? b.p.valor - a.p.valor : a.p.valor - b.p.valor), [q.julgamento, ex, uf, fx, s, ord, ins, state]);
  const head = ['Código', 'Projeto', 'Instituição', 'UF', 'Eixo', 'Nota', 'Valor pleiteado']; const data = rows.map(({ p }: any) => [p.code, p.title, inst(p.instId)?.name, p.uf, eixo(p.eixo).label, String(p.parecer?.nota ?? '').replace('.', ','), fmtBRL(p.valor)]);
  return <>
    <PageHead title="Banco de projetos" sub="Projetos habilitados e aprovados na análise técnica. Ficam aqui até um membro selecioná-los e destinar o recurso de um instrumento.">
      {can('banco', 'exportar') && <><Btn size="sm" icon={FileSpreadsheet} onClick={() => { const x = csv([head, ...data]); exportFile('sigap-banco-de-projetos.csv', x, x); }}>CSV</Btn><Btn size="sm" icon={FileText} onClick={() => exportFile('sigap-banco-de-projetos.pdf', tablePdf({ title: 'Banco de projetos', subtitle: `${rows.length} projetos aguardando julgamento`, columns: [{ label: 'Código', w: 1.4 }, { label: 'Projeto', w: 3.4 }, { label: 'Instituição', w: 2.4 }, { label: 'UF', w: 0.5 }, { label: 'Eixo', w: 1.8 }, { label: 'Nota', w: 0.6, align: 'right' }, { label: 'Valor', w: 1.2, align: 'right' }], rows: data }))}>PDF</Btn></>}
    </PageHead>
    <div className="stack-sm">
      <div className="card"><div className="toolbar" style={{ border: 0 }}>
        <div className="search"><Search size={15} aria-hidden /><input className="input" placeholder="Buscar no banco" value={s} onChange={e => setS(e.target.value)} aria-label="Buscar no banco de projetos" /></div>
        <select className="select" value={ex} onChange={e => setEx(e.target.value)} aria-label="Eixo temático"><option value="">Todos os eixos</option>{EIXOS.map(e => <option key={e.id} value={e.id}>{e.label}</option>)}</select>
        <select className="select" value={uf} onChange={e => setUf(e.target.value)} aria-label="Estado"><option value="">Todos os estados</option>{Object.keys(UF).map(u => <option key={u} value={u}>{u}</option>)}</select>
        <select className="select" value={fx} onChange={e => setFx(e.target.value)} aria-label="Faixa de valor"><option value="">Qualquer valor</option><option value="a">Até R$ 500 mil</option><option value="b">De R$ 500 mil a R$ 1 mi</option><option value="c">Acima de R$ 1 mi</option></select>
        <select className="select" value={ord} onChange={e => setOrd(e.target.value)} aria-label="Ordenar" disabled={!!cur}><option value="nota">Maior nota</option><option value="maior">Maior valor</option><option value="menor">Menor valor</option></select>
      </div>
        {can('recursos', 'aprovar') && comSaldo.length > 0 && <div className="toolbar" style={{ border: 0, borderTop: '1px solid var(--line)' }}><span className="small strong">Compatibilidade com o instrumento</span><select className="select grow" value={ins} onChange={e => setIns(e.target.value)} aria-label="Instrumento para comparar"><option value="">Escolha um instrumento com saldo</option>{comSaldo.map(({ i, saldo }: any) => <option key={i.id} value={i.id}>{i.numero} · {i.unidade} · saldo {fmtCompact(saldo)}</option>)}</select>{cur && <span className="small muted">Ordenado por eixo, território e valor que cabe no saldo.</span>}</div>}
      </div>
      {rows.length ? <div className="auto-cards">{rows.map(({ p, m }: any) => <ProjectCard key={p.id} p={p} match={m} action={can('recursos', 'aprovar') ? <Btn size="sm" variant="cta" onClick={() => setDest(p)}>Julgar</Btn> : undefined} />)}</div> : <div className="card"><Empty title="Nenhum projeto no banco com esses filtros">Projetos entram no banco quando o parecer técnico aprova.</Empty></div>}
    </div>
    {dest && <DestinarModal p={dest} onClose={() => setDest(null)} />}
  </>;
}

export function Fila({ tab }: { tab?: string }) {
  const { state, go, can, special, act, user, inst, userById, toast } = useApp(); const q = useQueues();
  const [un, setUn] = useState(''); const [ex, setEx] = useState(''); const [meus, setMeus] = useState(false);
  const analistas = state.users.filter((u: any) => state.roles.find((r: any) => r.id === u.roleId)?.perms?.analises?.includes('aprovar') && u.active && u.roleId !== 'admin' && u.roleId !== 'gestor');
  const tabs = [can('analises', 'editar') && { id: 'distribuir', label: 'Distribuição', rows: q.distribuir }, { id: 'habilitacao', label: 'Habilitação', rows: q.habilitacao }, { id: 'analise', label: 'Análise técnica', rows: q.analise }, { id: 'homologacao', label: 'Homologação', rows: q.homologacao }, { id: 'contas', label: 'Prestação de contas', rows: q.contas }].filter(Boolean) as any[];
  const t = tabs.find(x => x.id === tab) ? tab! : (can('analises', 'aprovar') ? 'habilitacao' : tabs[0].id); const cur = tabs.find(x => x.id === t);
  const rows = cur.rows.filter((p: any) => (!un || p.unidade === un) && (!ex || p.eixo === ex) && (!meus || p.analistaId === user.id));
  const dias = (p: any) => Math.max(0, Math.floor((Date.now() - new Date(p.updatedAt).getTime()) / 864e5)); const unidades = Array.from(new Set(state.projects.map((p: any) => p.unidade))).sort() as string[];
  const acao = (p: any) => t === 'habilitacao' && can('analises', 'aprovar') ? <Btn size="sm" variant="primary" onClick={() => go('analise/' + p.id)}>Avaliar</Btn> : t === 'analise' && can('analises', 'aprovar') ? <Btn size="sm" variant="primary" onClick={() => go('analise/' + p.id)}>Emitir parecer</Btn> : t === 'homologacao' && special('homologar') ? <Btn size="sm" variant="cta" onClick={() => go(`projetos/${p.id}/destinacao`)}>Homologar</Btn> : t === 'contas' && can('contas', 'aprovar') ? <Btn size="sm" variant="primary" onClick={() => go(`projetos/${p.id}/contas`)}>Analisar contas</Btn> : <Btn size="sm" onClick={() => go('projetos/' + p.id)}>Ver detalhes</Btn>;
  return <>
    <PageHead title="Fila de trabalho" sub="Projetos que aguardam distribuição ou decisão, por etapa. A fila considera a unidade responsável e o eixo temático." />
    <div className="stack-sm">
      <Tabs tabs={tabs.map(x => ({ id: x.id, label: x.label, count: x.rows.length }))} value={t} onChange={(x: string) => go('fila/' + x)} />
      <DataTable rows={rows} onRow={(p: any) => go(['habilitacao', 'analise'].includes(t) ? 'analise/' + p.id : 'projetos/' + p.id)}
        toolbar={<><select className="select" value={un} onChange={e => setUn(e.target.value)} aria-label="Unidade"><option value="">Todas as unidades</option>{unidades.map(u => <option key={u}>{u}</option>)}</select>
          <select className="select" value={ex} onChange={e => setEx(e.target.value)} aria-label="Eixo temático"><option value="">Todos os eixos</option>{EIXOS.map(e => <option key={e.id} value={e.id}>{e.label}</option>)}</select>
          {can('analises', 'aprovar') && ['habilitacao', 'analise'].includes(t) && <label className="row gap-6 small"><Switch on={meus} onChange={setMeus} label="Mostrar só os distribuídos para mim" />Só os meus</label>}</>}
        empty={<Empty title="Fila vazia nesta etapa">Nada aguardando decisão aqui.</Empty>}
        columns={[
          { key: 'title', label: 'Projeto', exp: (p: any) => p.title, render: (p: any) => <><div className="cell-main">{p.title}</div><div className="cell-sub num">{p.code} · {inst(p.instId)?.name}</div></> },
          { key: 'un', label: 'Unidade', exp: (p: any) => p.unidade, nowrap: true },
          { key: 'eixo', label: 'Eixo', exp: (p: any) => eixo(p.eixo).label },
          { key: 'valor', label: 'Valor', align: 'right', exp: (p: any) => fmtBRL(p.selecao?.valor || p.valor), sort: (p: any) => p.valor, nowrap: true },
          { key: 'dias', label: 'Na fila', exp: (p: any) => dias(p), sort: (p: any) => dias(p), render: (p: any) => { const d = dias(p); return <Pill tone={d >= 10 ? 'danger' : d >= 5 ? 'warn' : 'neutral'}>{d === 0 ? 'hoje' : `${d} ${d === 1 ? 'dia' : 'dias'}`}</Pill>; } },
          { key: 'an', label: 'Analista', stop: true, exp: (p: any) => userById(p.analistaId)?.name || '', render: (p: any) => can('analises', 'editar') && ['distribuir', 'habilitacao', 'analise'].includes(t) ? <select className="select input-sm" style={{ minWidth: 150 }} value={p.analistaId || ''} aria-label={`Analista de ${p.title}`} onChange={e => { if (e.target.value) { act.assign(p.id, e.target.value); toast('Análise distribuída.'); } }}><option value="">Distribuir para…</option>{analistas.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}</select> : <span className="small">{userById(p.analistaId)?.name || <span className="muted">Sem analista</span>}</span> },
          { key: 'act', label: '', stop: true, render: acao },
        ]} />
    </div>
  </>;
}

export function Diligencias() {
  const { state, scoped, role, can, act, go, toast, userById, inst, user } = useApp(); const [tab, setTab] = useState('abertas'); const [resp, setResp] = useState<any>(null); const [txt, setTxt] = useState(''); const [ids, setIds] = useState<string[]>([]); const [add, setAdd] = useState(false);
  const all = (role.scope === 'proprio' ? scoped : state.projects).flatMap((p: any) => p.diligencias.map((d: any) => ({ id: d.id, p, d }))); const rows = all.filter((x: any) => tab === 'abertas' ? !x.d.resposta : !!x.d.resposta).sort((a: any, b: any) => (a.d.prazo || '').localeCompare(b.d.prazo || ''));
  const live = resp ? state.projects.find((p: any) => p.id === resp.p.id) : null; const media = live ? state.media.filter((m: any) => m.projectId === live.id) : [];
  return <>
    <PageHead title="Diligências" sub={role.scope === 'proprio' ? 'Pedidos de esclarecimento ou de documentos da equipe técnica. Responda dentro do prazo para a análise continuar.' : 'Pedidos enviados às instituições durante a habilitação e a análise técnica, com prazo de resposta.'} />
    <div className="stack-sm">
      <Tabs tabs={[{ id: 'abertas', label: 'Aguardando resposta', count: all.filter((x: any) => !x.d.resposta).length }, { id: 'respondidas', label: 'Respondidas' }]} value={tab} onChange={setTab} />
      {rows.length ? rows.map(({ p, d }: any) => { const du = daysUntil(d.prazo); return <div key={d.id} className="card card-pad stack-sm">
        <div className="row between wrap"><div><button className="linkbtn" onClick={() => go('projetos/' + p.id + '/analises')}>{p.title}</button><div className="tiny muted">{p.code} · {inst(p.instId)?.name} · {d.stage === 'habilitacao' ? 'na habilitação' : 'na análise técnica'}</div></div>
          {d.resposta ? <Pill tone="ok">Respondida em {fmtDate(d.respondedAt)}</Pill> : <Pill tone={du < 0 ? 'danger' : du <= 3 ? 'warn' : 'neutral'}>{du < 0 ? `Prazo vencido há ${-du} dias` : `Prazo: ${fmtDate(d.prazo)} · faltam ${du} dias`}</Pill>}</div>
        <p className="prose"><b>{userById(d.by)?.name || 'Equipe técnica'}:</b> {d.text}</p>
        {d.resposta && <div className="note ok"><div><b className="small">Resposta da instituição</b><p className="small">{d.resposta}</p></div></div>}
        {!d.resposta && can('diligencias', 'editar') && user.instId === p.instId && <div><Btn variant="cta" onClick={() => { setResp({ p, d }); setTxt(''); setIds([]); }}>Responder diligência</Btn></div>}
      </div>; }) : <div className="card"><Empty title={tab === 'abertas' ? 'Nenhuma diligência aguardando resposta' : 'Nenhuma diligência respondida'} /></div>}
    </div>
    {resp && <Modal title="Responder diligência" sub={`${resp.p.code} · ${resp.p.title}`} size="wide" onClose={() => setResp(null)} footer={<><Btn onClick={() => setResp(null)}>Cancelar</Btn><Btn variant="cta" disabled={txt.trim().length < 10} onClick={() => { act.answerDiligencia(resp.p.id, resp.d.id, txt.trim(), ids); setResp(null); toast('Resposta enviada. O projeto voltou para a fila de análise.'); }}>Enviar resposta</Btn></>}>
      <div className="stack-sm"><Note tone="warn"><b>Pedido da equipe técnica.</b> {resp.d.text}</Note>
        <Field label="Sua resposta"><textarea className="textarea" style={{ minHeight: 120 }} value={txt} onChange={e => setTxt(e.target.value)} /></Field>
        <div className="field"><div className="row between"><span className="field-l">Anexos da resposta ({ids.length})</span><Btn size="sm" icon={Paperclip} onClick={() => setAdd(true)}>Anexar arquivo ou link</Btn></div><div className="chips">{media.map((m: any) => { const on = ids.includes(m.id); return <button key={m.id} type="button" className={`chip ${on ? 'is-on' : ''}`} aria-pressed={on} onClick={() => setIds(on ? ids.filter(x => x !== m.id) : [...ids, m.id])}>{on ? <Check size={13} aria-hidden /> : <Square size={13} aria-hidden />}{m.title}</button>; })}</div></div></div>
    </Modal>}
    {add && resp && <MediaAdd projectId={resp.p.id} etapa={resp.d.stage === 'habilitacao' ? 'Habilitação' : 'Análise técnica'} onClose={() => setAdd(false)} onAdded={(n: string[]) => setIds(x => [...x, ...n])} />}
  </>;
}

export function Recursos() {
  const { state, can, act, go, user, userById, inst, toast } = useApp(); const q = useQueues(); const t = totals(state); const [open, setOpen] = useState(''); const [novo, setNovo] = useState(false);
  const [d, setD] = useState<any>({ tipo: 'TAC', numero: '', unidade: user.unit || 'PGR', tema: 'ambiente', uf: (user.unit || '').startsWith('PR-') ? user.unit.slice(3) : 'BR', valor: 500000, objeto: '' }); const set = (k: string, v: any) => setD((x: any) => ({ ...x, [k]: v }));
  const dest = (id: string) => state.projects.filter((p: any) => p.selecao?.instrumentoId === id); const usado = (id: string) => sum(dest(id), (p: any) => p.selecao.valor);
  const ap = state.projects.filter((p: any) => p.selecao); const srcs = state.instrumentos.filter((i: any) => usado(i.id) > 0);
  const o = state.instrumentos.find((i: any) => i.id === open); const saldoO = o ? saldoInstr(state, o.id) : 0;
  const compat = o ? q.julgamento.map((p: any) => ({ p, m: matchScore(p, o, saldoO) })).filter((x: any) => x.m >= 50).sort((a: any, b: any) => b.m - a.m).slice(0, 4) : [];
  return <>
    <PageHead title="Recursos e destinações" sub="Instrumentos que geram recursos (TACs, acordos, sentenças), o saldo de cada um e para quais projetos o dinheiro foi.">{can('recursos', 'criar') && <Btn variant="primary" icon={Plus} onClick={() => setNovo(true)}>Registrar instrumento</Btn>}</PageHead>
    <div className="stack">
      <div className="stats"><Stat v={fmtCompact(t.total)} l="Total nos instrumentos" d={`${state.instrumentos.length} instrumentos`} /><Stat v={fmtCompact(t.destinado)} l="Destinado a projetos" d={<Bar value={t.destinado / (t.total || 1) * 100} thin />} /><Stat v={fmtCompact(t.saldo)} l="Saldo a destinar" /><Stat v={q.homologacao.length} l="Seleções aguardando homologação" /></div>
      <div className="card"><div className="card-head"><h3>Rastro do recurso</h3><span className="small muted">Do instrumento de origem ao projeto. A parte clara de cada barra é o saldo ainda sem destino.</span></div><div className="card-body">
        <Sankey sources={srcs.map((i: any) => ({ id: i.id, label: i.numero, sub: `${i.unidade} · ${fmtCompact(i.valor)}`, value: i.valor }))} targets={ap.map((p: any) => ({ id: p.id, label: p.title, sub: `${fmtCompact(p.selecao.valor)} · ${STATUS[p.status].label.toLowerCase()}`, value: p.selecao.valor }))} links={srcs.flatMap((i: any) => dest(i.id).map((p: any) => ({ source: i.id, target: p.id, value: p.selecao.valor })))} onTarget={(id: string) => go('projetos/' + id + '/destinacao')} /></div></div>
      <DataTable rows={state.instrumentos} onRow={(r: any) => setOpen(r.id)} exportName="sigap-instrumentos" exportTitle="Instrumentos e saldos" canExport={can('recursos', 'exportar')} toolbar={<h3 className="grow">Instrumentos</h3>}
        columns={[
          { key: 'num', label: 'Instrumento', w: 2.6, exp: (r: any) => r.numero, render: (r: any) => <><div className="cell-main">{r.numero}</div><div className="cell-sub clamp-2">{r.objeto}</div></> },
          { key: 'un', label: 'Unidade', w: 0.9, exp: (r: any) => r.unidade, nowrap: true }, { key: 'tema', label: 'Eixo', w: 1.8, exp: (r: any) => eixo(r.tema).label },
          { key: 'membro', label: 'Membro', w: 1.6, exp: (r: any) => userById(r.membroId)?.name },
          { key: 'valor', label: 'Valor', w: 1.2, align: 'right', exp: (r: any) => fmtBRL(r.valor), sort: (r: any) => r.valor, nowrap: true },
          { key: 'dest', label: 'Destinado', w: 1.2, align: 'right', exp: (r: any) => fmtBRL(usado(r.id)), sort: (r: any) => usado(r.id), nowrap: true },
          { key: 'saldo', label: 'Saldo', w: 1.2, align: 'right', exp: (r: any) => fmtBRL(r.valor - usado(r.id)), sort: (r: any) => r.valor - usado(r.id), render: (r: any) => <div style={{ minWidth: 120 }}><b className="num">{fmtBRL(r.valor - usado(r.id))}</b><Bar value={usado(r.id) / r.valor * 100} thin tone="navy" /></div> },
        ]} />
    </div>
    {o && <Drawer title={o.numero} sub={`${o.tipo} · ${o.unidade} · ${fmtDate(o.date)}`} onClose={() => setOpen('')}>
      <div className="stack">
        <p className="prose">{o.objeto}</p>
        <div className="stats"><Stat v={fmtCompact(o.valor)} l="Valor" /><Stat v={fmtCompact(saldoO)} l="Saldo" /></div>
        <dl className="kv" style={{ gridTemplateColumns: '1fr 1fr' }}><div><dt>Eixo</dt><dd>{eixo(o.tema).label}</dd></div><div><dt>Território</dt><dd>{o.uf === 'BR' ? 'Nacional' : UF[o.uf]}</dd></div><div><dt>Membro responsável</dt><dd>{userById(o.membroId)?.name}</dd></div></dl>
        <div><h3 style={{ marginBottom: 8 }}>Destinações</h3>{dest(o.id).length ? <div className="card">{dest(o.id).map((p: any) => <button key={p.id} className="list-btn" style={{ padding: '10px 14px' }} onClick={() => go('projetos/' + p.id + '/destinacao')}><span className="grow small"><b>{p.title}</b><div className="tiny muted">{fmtBRL(p.selecao.valor)} · {fmtDate(p.selecao.date)}</div></span><StatusPill status={p.status} /></button>)}</div> : <p className="small muted">Nenhum projeto recebeu recurso deste instrumento.</p>}</div>
        {saldoO > 0 && <div><h3 style={{ marginBottom: 8 }}>Projetos compatíveis no banco</h3>{compat.length ? <div className="card">{compat.map(({ p, m }: any) => <button key={p.id} className="list-btn" style={{ padding: '10px 14px' }} onClick={() => go('projetos/' + p.id + '/destinacao')}><span className="grow small"><b>{p.title}</b><div className="tiny muted">{inst(p.instId)?.name} · {fmtBRL(p.valor)} · nota {String(p.parecer?.nota).replace('.', ',')}</div></span><Pill tone="info">{m}% compatível</Pill></button>)}</div> : <p className="small muted">Nenhum projeto do banco combina com o eixo e o território deste instrumento.</p>}</div>}
      </div>
    </Drawer>}
    {novo && <Modal title="Registrar instrumento" sub="O valor fica disponível para destinação a projetos do banco." size="wide" onClose={() => setNovo(false)} footer={<><Btn onClick={() => setNovo(false)}>Cancelar</Btn><Btn variant="primary" disabled={!d.numero.trim() || !(+d.valor > 0) || !d.objeto.trim()} onClick={() => { act.addInstrumento({ ...d, valor: +d.valor }); setNovo(false); toast('Instrumento registrado.'); }}>Registrar instrumento</Btn></>}>
      <div className="form-grid">
        <Field label="Tipo"><select className="select" value={d.tipo} onChange={e => set('tipo', e.target.value)}>{INSTR_TIPOS.map(x => <option key={x}>{x}</option>)}</select></Field>
        <Field label="Número"><input className="input" value={d.numero} onChange={e => set('numero', e.target.value)} placeholder="Ex.: TAC nº 031/2026" /></Field>
        <Field label="Unidade"><input className="input" value={d.unidade} onChange={e => set('unidade', e.target.value)} /></Field>
        <Field label="Valor disponível (R$)"><input className="input num" type="number" min="0" step="10000" value={d.valor} onChange={e => set('valor', e.target.value)} /></Field>
        <Field label="Eixo temático"><select className="select" value={d.tema} onChange={e => set('tema', e.target.value)}><option value="livre">Sem vinculação temática</option>{EIXOS.map(e => <option key={e.id} value={e.id}>{e.label}</option>)}</select></Field>
        <Field label="Território"><select className="select" value={d.uf} onChange={e => set('uf', e.target.value)}><option value="BR">Nacional</option>{Object.entries(UF).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
        <Field label="Objeto" span hint="O que o instrumento repara ou compensa. Orienta a compatibilidade com os projetos."><textarea className="textarea" value={d.objeto} onChange={e => set('objeto', e.target.value)} /></Field>
      </div>
    </Modal>}
  </>;
}
