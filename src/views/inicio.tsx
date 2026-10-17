import React, { useMemo, useState } from 'react';
import { Plus, ArrowUpRight, Search, FilePen, MessageSquareWarning, CircleCheck, Circle } from 'lucide-react';
import { EIXOS, UF, eixo, fmtCompact, fmtBRL, fmtDateTime, fmtDate, chamadaStatus, STATUS, TIPOS_INST, maskEmail, maskPhone, norm, daysUntil } from '../lib';
import { useApp, useQueues, totals } from '../store';
import { Btn, PageHead, Stat, Empty, Pill, StatusPill, Seg, Modal, Drawer, Field, DataTable, Note, Switch } from '../ui';
import { Pipeline, ChamadaCard, ProjectCard } from '../viz';
import { usePendencias } from './shell';
import { ChamadaBody } from './portal';

export function Inicio() {
  const { state, user, role, go, can, scoped } = useApp(); const pend = usePendencias(); const q = useQueues(); const t = totals(state);
  const hora = new Date().getHours(); const oi = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'; const nome = user.name.split(' ')[0];
  const abertas = state.chamadas.filter((c: any) => chamadaStatus(c) === 'aberta');
  const Pend = <div className="card"><div className="card-head"><h3>Precisa da sua atenção</h3>{pend.length > 0 && <span className="tab-n">{pend.length}</span>}</div>
    {pend.length ? <div>{pend.map((x: any, i: number) => <button key={i} className="list-btn" onClick={() => go(x.to)}><span className={`ico-badge t-${x.tone}`}><x.icon size={17} aria-hidden /></span><span className="grow" style={{ minWidth: 0 }}><b className="cell-main" style={{ display: 'block' }}>{x.title}</b><span className="cell-sub truncate" style={{ display: 'block' }}>{x.sub}</span></span><ArrowUpRight size={16} aria-hidden className="muted" /></button>)}</div> : <Empty title="Tudo em dia">Nenhuma pendência para o seu perfil agora.</Empty>}</div>;

  if (role.scope === 'proprio') {
    const inst = state.instituicoes.find((i: any) => i.id === user.instId); const enviados = scoped.filter((p: any) => p.status !== 'rascunho');
    return <>
      <PageHead title={`${oi}, ${nome}`} sub={`${inst?.name}. Aqui ficam as propostas enviadas, os rascunhos e o que depende de você.`}>{can('projetos', 'criar') && <Btn variant="cta" icon={Plus} onClick={() => go('chamadas')}>Inscrever projeto</Btn>}</PageHead>
      <div className="stack">
        <div className="stats"><Stat v={enviados.length} l="Propostas enviadas" /><Stat v={q.rascunhos.length} l="Rascunhos salvos" /><Stat v={q.diligencias.length} l="Diligências a responder" /><Stat v={scoped.filter((p: any) => p.status === 'execucao').length} l="Projetos em execução" /></div>
        <div className="split">{Pend}
          <div className="card"><div className="card-head"><h3>Chamadas com inscrições abertas</h3></div>{abertas.length ? <div>{abertas.map((c: any) => <button key={c.id} className="list-btn" onClick={() => go('chamadas/' + c.id)}><span className="grow"><b className="cell-main" style={{ display: 'block' }}>{c.title}</b><span className="cell-sub">{c.code} · encerra em {daysUntil(c.encerramento)} dias</span></span></button>)}</div> : <Empty title="Nenhuma chamada aberta" />}</div>
        </div>
        <div><h2 style={{ marginBottom: 12 }}>Meus projetos</h2><div className="auto-cards">{scoped.map((p: any) => <ProjectCard key={p.id} p={p} action={p.status === 'rascunho' ? <Btn size="sm" variant="primary" icon={FilePen} onClick={() => go('rascunho/' + p.id)}>Continuar</Btn> : p.status === 'diligencia' ? <Btn size="sm" variant="cta" icon={MessageSquareWarning} onClick={() => go('diligencias')}>Responder</Btn> : undefined} />)}</div></div>
      </div>
    </>;
  }
  const sub = role.id === 'procurador' ? `Unidade ${user.unit}. Você julga projetos do banco e destina os recursos dos instrumentos da sua unidade.` : role.id === 'analista' ? 'Sua fila reúne habilitações, pareceres, relatórios e prestações de contas.' : 'Visão geral do ciclo de projetos, dos recursos e das pendências.';
  return <>
    <PageHead title={`${oi}, ${nome}`} sub={sub} />
    <div className="stack">
      <div className="card"><div className="card-head"><h3>Projetos por etapa do ciclo de vida</h3><span className="tiny muted">7 etapas · clique para abrir</span><span className="grow" /><Btn size="sm" variant="quiet" onClick={() => go('projetos')}>Ver todos</Btn></div><Pipeline projects={state.projects} onPick={(i: number) => go('etapa/' + (i + 1))} /></div>
      <div className="stats">
        <Stat v={fmtCompact(t.saldo)} l="Disponível para destinar" d={`em ${state.instrumentos.length} instrumentos`} /><Stat v={fmtCompact(t.destinado)} l="Destinado a projetos" d={`${t.apoiados} projetos em ${t.ufs} estados`} />
        <Stat v={fmtCompact(t.comprovado)} l="Execução comprovada" d={`${Math.round(t.comprovado / (t.destinado || 1) * 100)}% do destinado`} /><Stat v={t.banco} l="Projetos no banco" d="habilitados, aguardando julgamento" />
      </div>
      <div className="split">{Pend}
        <div className="stack">
          {can('auditoria') && <div className="card"><div className="card-head"><h3>Atividade recente</h3><Btn size="sm" variant="quiet" onClick={() => go('auditoria')}>Trilha completa</Btn></div><ul className="list">{[...state.audit].reverse().slice(0, 5).map((e: any) => <li key={e.seq} style={{ alignItems: 'flex-start' }}><span className="grow" style={{ minWidth: 0 }}><b className="small">{e.action}</b><div className="tiny muted clamp-2">{e.detail}</div></span><span className="tiny muted nowrap">{e.userName.split(' ')[0]} · {fmtDate(e.ts)}</span></li>)}</ul></div>}
          <div className="card"><div className="card-head"><h3>Chamadas abertas</h3><Btn size="sm" variant="quiet" onClick={() => go('chamadas')}>Ver todas</Btn></div>{abertas.map((c: any) => <button key={c.id} className="list-btn" onClick={() => go('chamadas/' + c.id)}><span className="grow"><b className="cell-main" style={{ display: 'block' }}>{c.title}</b><span className="cell-sub">{c.code} · {c.unidade} · encerra em {daysUntil(c.encerramento)} dias</span></span><span className="tab-n">{state.projects.filter((p: any) => p.chamadaId === c.id && p.status !== 'rascunho').length} inscritos</span></button>)}</div>
        </div>
      </div>
    </div>
  </>;
}

export function Chamadas({ id }: { id?: string }) {
  const { state, go, can, act, toast, user } = useApp(); const [f, setF] = useState('todas'); const [novo, setNovo] = useState(false);
  const [d, setD] = useState<any>({ title: '', eixo: 'ambiente', unidade: user?.unit || 'PGR', ufs: 'BR', abertura: new Date().toISOString().slice(0, 10), encerramento: new Date(Date.now() + 45 * 864e5).toISOString().slice(0, 10), valor: 1000000, teto: 500000, desc: '', requisitos: '' }); const set = (k: string, v: any) => setD((x: any) => ({ ...x, [k]: v }));
  if (id) { const c = state.chamadas.find((x: any) => x.id === id); return c ? <><PageHead title={c.title} sub={c.code} back={{ to: 'chamadas', label: 'Editais e chamadas' }} /><ChamadaBody c={c} /></> : <div className="card"><Empty title="Chamada não encontrada" action={<Btn onClick={() => go('chamadas')}>Voltar</Btn>} /></div>; }
  const list = state.chamadas.filter((c: any) => f === 'todas' || chamadaStatus(c) === f);
  const criar = () => { act.addChamada({ title: d.title, eixo: d.eixo, unidade: d.unidade, ufs: d.ufs.split(/[,\s]+/).map((x: string) => x.toUpperCase()).filter(Boolean), abertura: new Date(d.abertura + 'T09:00').toISOString(), encerramento: new Date(d.encerramento + 'T18:00').toISOString(), valor: +d.valor, teto: +d.teto, desc: d.desc, requisitos: d.requisitos.split('\n').map((x: string) => x.trim()).filter(Boolean) }); setNovo(false); toast('Chamada publicada.'); };
  return <>
    <PageHead title="Editais e chamadas" sub="Chamadas publicam oportunidades e organizam a entrada de projetos por eixo e território.">{can('chamadas', 'criar') && <Btn variant="primary" icon={Plus} onClick={() => setNovo(true)}>Nova chamada</Btn>}</PageHead>
    <div className="stack-sm"><Seg value={f} onChange={setF} options={[{ id: 'todas', label: 'Todas' }, { id: 'aberta', label: 'Abertas' }, { id: 'breve', label: 'Em breve' }, { id: 'encerrada', label: 'Encerradas' }]} />
      {list.length ? <div className="auto-cards" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))' }}>{list.map((c: any) => <ChamadaCard key={c.id} c={c} n={state.projects.filter((p: any) => p.chamadaId === c.id && p.status !== 'rascunho').length} onOpen={() => go('chamadas/' + c.id)} />)}</div> : <div className="card"><Empty title="Nenhuma chamada nesta situação" /></div>}</div>
    {novo && <Modal title="Nova chamada" sub="A chamada aparece no portal público assim que for publicada." size="wide" onClose={() => setNovo(false)} footer={<><Btn onClick={() => setNovo(false)}>Cancelar</Btn><Btn variant="primary" disabled={!d.title.trim() || !d.desc.trim()} onClick={criar}>Publicar chamada</Btn></>}>
      <div className="form-grid">
        <Field label="Título" span><input className="input" value={d.title} onChange={e => set('title', e.target.value)} /></Field>
        <Field label="Eixo temático"><select className="select" value={d.eixo} onChange={e => set('eixo', e.target.value)}>{EIXOS.map(e => <option key={e.id} value={e.id}>{e.label} ({e.ref})</option>)}</select></Field>
        <Field label="Unidade responsável"><input className="input" value={d.unidade} onChange={e => set('unidade', e.target.value)} /></Field>
        <Field label="Estados alcançados" hint="Siglas separadas por vírgula. Use BR para abrangência nacional."><input className="input" value={d.ufs} onChange={e => set('ufs', e.target.value)} /></Field>
        <Field label="Valor previsto (R$)"><input className="input num" type="number" min="0" step="10000" value={d.valor} onChange={e => set('valor', e.target.value)} /></Field>
        <Field label="Abertura das inscrições"><input className="input" type="date" value={d.abertura} onChange={e => set('abertura', e.target.value)} /></Field>
        <Field label="Fim das inscrições"><input className="input" type="date" value={d.encerramento} onChange={e => set('encerramento', e.target.value)} /></Field>
        <Field label="Teto por projeto (R$)"><input className="input num" type="number" min="0" step="10000" value={d.teto} onChange={e => set('teto', e.target.value)} /></Field>
        <Field label="Objeto do edital" span><textarea className="textarea" value={d.desc} onChange={e => set('desc', e.target.value)} /></Field>
        <Field label="Requisitos" span hint="Um por linha."><textarea className="textarea" value={d.requisitos} onChange={e => set('requisitos', e.target.value)} /></Field>
      </div>
    </Modal>}
  </>;
}

export function Instituicoes() {
  const { state, can, special, act, go, user, role, toast } = useApp(); const [q, setQ] = useState(''); const [uf, setUf] = useState(''); const [sit, setSit] = useState(''); const [open, setOpen] = useState(''); const [novo, setNovo] = useState(false);
  const [d, setD] = useState<any>({ name: '', tipo: 'OSC', cnpj: '', uf: 'MG', cidade: '', responsavel: '', email: '', telefone: '' }); const set = (k: string, v: any) => setD((x: any) => ({ ...x, [k]: v }));
  const rows = useMemo(() => state.instituicoes.filter((i: any) => (role.scope !== 'proprio' || i.id === user.instId) && (!uf || i.uf === uf) && (!sit || i.situacao === sit) && (!q || norm(i.name + i.cidade + i.cnpj).includes(norm(q)))), [state.instituicoes, q, uf, sit, role, user]);
  const nProj = (id: string) => state.projects.filter((p: any) => p.instId === id).length; const o = state.instituicoes.find((i: any) => i.id === open); const pd = special('dados_pessoais') || o?.id === user.instId;
  return <>
    <PageHead title="Instituições" sub="Cadastro das instituições proponentes e situação dos documentos que valem para todas as inscrições.">{can('instituicoes', 'criar') && <Btn variant="primary" icon={Plus} onClick={() => setNovo(true)}>Cadastrar instituição</Btn>}</PageHead>
    <DataTable rows={rows} onRow={(r: any) => setOpen(r.id)} exportName="sigap-instituicoes" exportTitle="Instituições" canExport={can('projetos', 'exportar')}
      toolbar={<><div className="search"><Search size={15} aria-hidden /><input className="input" placeholder="Buscar por nome, cidade ou CNPJ" value={q} onChange={e => setQ(e.target.value)} aria-label="Buscar instituições" /></div>
        <select className="select" value={uf} onChange={e => setUf(e.target.value)} aria-label="Estado"><option value="">Todos os estados</option>{Object.keys(UF).map(u => <option key={u} value={u}>{u}</option>)}</select>
        <select className="select" value={sit} onChange={e => setSit(e.target.value)} aria-label="Situação"><option value="">Todas as situações</option><option value="habilitada">Documentos válidos</option><option value="pendente">Com pendência</option></select></>}
      empty={<Empty title="Nenhuma instituição encontrada">Ajuste a busca ou os filtros.</Empty>}
      columns={[
        { key: 'name', label: 'Instituição', w: 3, exp: (r: any) => r.name, render: (r: any) => <><div className="cell-main">{r.name}</div><div className="cell-sub">{r.tipo} · desde {r.fundacao || '—'}</div></> },
        { key: 'cidade', label: 'Cidade', w: 2, exp: (r: any) => `${r.cidade}/${r.uf}` },
        { key: 'cnpj', label: 'CNPJ', w: 1.6, exp: (r: any) => r.cnpj, nowrap: true },
        { key: 'sit', label: 'Documentos', w: 1.3, exp: (r: any) => r.situacao === 'habilitada' ? 'Válidos' : 'Com pendência', render: (r: any) => <Pill tone={r.situacao === 'habilitada' ? 'ok' : 'warn'}>{r.situacao === 'habilitada' ? 'Válidos' : 'Com pendência'}</Pill> },
        { key: 'proj', label: 'Projetos', w: 0.8, align: 'right', exp: (r: any) => nProj(r.id), sort: (r: any) => nProj(r.id) },
      ]} />
    {o && <Drawer title={o.name} sub={`${o.tipo} · ${o.cidade}/${o.uf}`} onClose={() => setOpen('')}>
      <div className="stack">
        <dl className="kv" style={{ gridTemplateColumns: '1fr 1fr' }}><div><dt>CNPJ</dt><dd className="num">{o.cnpj}</dd></div><div><dt>Responsável legal</dt><dd>{o.responsavel}</dd></div><div><dt>E-mail</dt><dd>{pd ? o.email : maskEmail(o.email)}</dd></div><div><dt>Telefone</dt><dd className="num">{pd ? o.telefone : maskPhone(o.telefone)}</dd></div></dl>
        {!pd && <Note>E-mail e telefone aparecem mascarados. Seu perfil não tem a permissão “Ver dados pessoais sem máscara”.</Note>}
        <div><h3 style={{ marginBottom: 8 }}>Documentos da instituição</h3><ul className="card list">{o.docs.map((doc: any, i: number) => <li key={doc.name} style={{ padding: '10px 14px' }}>{doc.ok ? <CircleCheck size={18} aria-hidden style={{ color: 'var(--ok)' }} /> : <Circle size={18} aria-hidden className="muted" />}<span className="grow small">{doc.name}{doc.validade && doc.ok && <span className="tiny muted"> · válido até {fmtDate(doc.validade)}</span>}</span>{can('instituicoes', 'aprovar') && <Switch on={doc.ok} label={`Marcar ${doc.name} como válido`} onChange={() => act.toggleInstDoc(o.id, i)} />}</li>)}</ul></div>
        <div><h3 style={{ marginBottom: 8 }}>Projetos</h3>{state.projects.filter((p: any) => p.instId === o.id).length ? <div className="card">{state.projects.filter((p: any) => p.instId === o.id).map((p: any) => <button key={p.id} className="list-btn" style={{ padding: '10px 14px' }} onClick={() => go('projetos/' + p.id)}><span className="grow small"><b>{p.title}</b><div className="tiny muted">{p.code} · {fmtBRL(p.valor)}</div></span><StatusPill status={p.status} /></button>)}</div> : <p className="small muted">Nenhum projeto inscrito.</p>}</div>
      </div>
    </Drawer>}
    {novo && <Modal title="Cadastrar instituição" size="wide" onClose={() => setNovo(false)} footer={<><Btn onClick={() => setNovo(false)}>Cancelar</Btn><Btn variant="primary" disabled={!d.name.trim() || !d.cnpj.trim()} onClick={() => { act.addInst(d); setNovo(false); toast('Instituição cadastrada. Os documentos ficam pendentes de conferência.'); }}>Cadastrar instituição</Btn></>}>
      <div className="form-grid">
        <Field label="Nome" span><input className="input" value={d.name} onChange={e => set('name', e.target.value)} /></Field>
        <Field label="Tipo"><select className="select" value={d.tipo} onChange={e => set('tipo', e.target.value)}>{TIPOS_INST.map(t => <option key={t}>{t}</option>)}</select></Field>
        <Field label="CNPJ"><input className="input num" placeholder="00.000.000/0001-00" value={d.cnpj} onChange={e => set('cnpj', e.target.value)} /></Field>
        <Field label="Cidade"><input className="input" value={d.cidade} onChange={e => set('cidade', e.target.value)} /></Field>
        <Field label="Estado"><select className="select" value={d.uf} onChange={e => set('uf', e.target.value)}>{Object.entries(UF).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
        <Field label="Responsável legal"><input className="input" value={d.responsavel} onChange={e => set('responsavel', e.target.value)} /></Field>
        <Field label="E-mail"><input className="input" type="email" value={d.email} onChange={e => set('email', e.target.value)} /></Field>
      </div>
    </Modal>}
  </>;
}
