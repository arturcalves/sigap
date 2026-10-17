import React, { useMemo, useState } from 'react';
import { Plus, Search, LayoutGrid, Table2, Trash2, Check, Send, Save, Upload, X } from 'lucide-react';
import { EIXOS, UF, STATUS, STAGES, ODS, RUBRICAS, eixo, stageOf, fmtBRL, fmtDate, fmtAgo, norm, sum, chamadaStatus, uid } from '../lib';
import { useApp } from '../store';
import { Btn, PageHead, Empty, StatusPill, Seg, Field, Group, DataTable, Note, Confirm } from '../ui';
import { ProjectCard } from '../viz';
import { MediaGrid, MediaAdd, MediaViewer } from '../media';

/* Ação rápida do cartão conforme a situação do projeto e o perfil */
export function useQuick() {
  const { can, special, go, user } = useApp();
  return (p: any) => {
    const mk = (label: string, to: string, variant = 'primary') => <Btn size="sm" variant={variant} onClick={() => go(to)}>{label}</Btn>;
    if (p.status === 'rascunho' && can('projetos', 'editar') && (user.instId ? user.instId === p.instId : true)) return mk('Continuar', 'rascunho/' + p.id);
    if (p.status === 'habilitacao' && can('analises', 'aprovar')) return mk('Avaliar', 'analise/' + p.id);
    if (p.status === 'analise' && can('analises', 'aprovar')) return mk('Emitir parecer', 'analise/' + p.id);
    if (p.status === 'banco' && can('recursos', 'aprovar')) return mk('Julgar', `projetos/${p.id}/destinacao`, 'cta');
    if (p.status === 'selecionado' && special('homologar')) return mk('Homologar', `projetos/${p.id}/destinacao`, 'cta');
    if (p.status === 'contas' && can('contas', 'aprovar')) return mk('Analisar contas', `projetos/${p.id}/contas`);
    if (p.status === 'auditoria' && can('auditoria', 'aprovar')) return mk('Auditar', `auditar/${p.id}`);
    return undefined;
  };
}

export function Projetos({ etapa }: { etapa?: string }) {
  const { state, scoped, go, can, inst, role } = useApp(); const quick = useQuick();
  const [q, setQ] = useState(''); const [uf, setUf] = useState(''); const [un, setUn] = useState(''); const [st, setSt] = useState(''); const [ex, setEx] = useState(''); const [view, setView] = useState('tabela'); const [stage, setStage] = useState(etapa ?? '');
  const unidades = useMemo(() => Array.from(new Set(scoped.map((p: any) => p.unidade))).sort() as string[], [scoped]);
  const rows = useMemo(() => scoped.filter((p: any) => (!uf || p.uf === uf) && (!un || p.unidade === un) && (!st || p.status === st) && (!ex || p.eixo === ex) && (stage === '' || (stageOf(p) === +stage && !STATUS[p.status].stop)) && (!q || norm(p.title + p.code + inst(p.instId)?.name + p.municipios).includes(norm(q)))), [scoped, q, uf, un, st, ex, stage]);
  const filtros = [uf && UF[uf], un, st && STATUS[st].label, ex && eixo(ex).label, stage !== '' && 'etapa ' + STAGES[+stage].label].filter(Boolean).join(' · ');
  const toolbar = <>
    <div className="search"><Search size={15} aria-hidden /><input className="input" placeholder="Buscar por título, código, instituição ou município" value={q} onChange={e => setQ(e.target.value)} aria-label="Buscar projetos" /></div>
    <select className="select" value={uf} onChange={e => setUf(e.target.value)} aria-label="Estado"><option value="">Todos os estados</option>{Object.keys(UF).map(u => <option key={u} value={u}>{u} · {UF[u]}</option>)}</select>
    <select className="select" value={un} onChange={e => setUn(e.target.value)} aria-label="Procuradoria"><option value="">Todas as unidades</option>{unidades.map(u => <option key={u}>{u}</option>)}</select>
    <select className="select" value={st} onChange={e => setSt(e.target.value)} aria-label="Situação"><option value="">Todas as situações</option>{Object.entries(STATUS).map(([k, v]: any) => <option key={k} value={k}>{v.label}</option>)}</select>
    <select className="select" value={ex} onChange={e => setEx(e.target.value)} aria-label="Eixo temático"><option value="">Todos os eixos</option>{EIXOS.map(e => <option key={e.id} value={e.id}>{e.label}</option>)}</select>
    <select className="select" value={stage} onChange={e => setStage(e.target.value)} aria-label="Etapa do ciclo"><option value="">Todas as etapas</option>{STAGES.map((s, i) => <option key={s.id} value={i}>{s.label}</option>)}</select>
  </>;
  const empty = <Empty title="Nenhum projeto com esses filtros" action={<Btn onClick={() => { setQ(''); setUf(''); setUn(''); setSt(''); setEx(''); setStage(''); }}>Limpar filtros</Btn>}>Ajuste a busca ou remova algum filtro.</Empty>;
  return <>
    <PageHead title={role.scope === 'proprio' ? 'Meus projetos' : 'Projetos'} sub={role.scope === 'proprio' ? 'Propostas enviadas, rascunhos e projetos em execução da sua instituição.' : 'Todos os projetos, da inscrição ao monitoramento. Filtre por estado, procuradoria, situação ou eixo.'}>
      <Seg value={view} onChange={setView} options={[{ id: 'tabela', label: 'Tabela', icon: Table2 }, { id: 'cartoes', label: 'Cartões', icon: LayoutGrid }]} />
      {can('projetos', 'criar') && <Btn variant="cta" icon={Plus} onClick={() => go('inscricao/livre')}>Inscrever projeto</Btn>}
    </PageHead>
    {view === 'tabela' ? <DataTable rows={rows} onRow={(r: any) => go('projetos/' + r.id)} toolbar={toolbar} empty={empty} exportName="sigap-projetos" exportTitle="Projetos" exportSub={filtros} canExport={can('projetos', 'exportar')}
      columns={[
        { key: 'code', label: 'Código', w: 1.5, exp: (r: any) => r.code, exportOnly: true },
        { key: 'title', label: 'Projeto', w: 3.2, exp: (r: any) => r.title, render: (r: any) => <><div className="cell-main">{r.title}</div><div className="cell-sub num">{r.code}</div></> },
        { key: 'inst', label: 'Instituição', w: 2.4, exp: (r: any) => inst(r.instId)?.name },
        { key: 'un', label: 'Unidade', w: 0.8, exp: (r: any) => r.unidade, nowrap: true },
        { key: 'eixo', label: 'Eixo', w: 1.8, exp: (r: any) => eixo(r.eixo).label },
        { key: 'valor', label: 'Valor', w: 1.2, align: 'right', exp: (r: any) => fmtBRL(r.selecao?.valor || r.valor), sort: (r: any) => r.selecao?.valor || r.valor, nowrap: true },
        { key: 'status', label: 'Situação', w: 1.6, exp: (r: any) => STATUS[r.status].label, sort: (r: any) => stageOf(r) * 10 + Object.keys(STATUS).indexOf(r.status), render: (r: any) => <StatusPill status={r.status} /> },
        { key: 'upd', label: 'Atualizado', w: 1, exp: (r: any) => fmtDate(r.updatedAt), sort: (r: any) => r.updatedAt, render: (r: any) => <span className="small muted nowrap">{fmtAgo(r.updatedAt)}</span> },
      ]} />
      : <div className="stack-sm"><div className="card"><div className="toolbar" style={{ border: 0 }}>{toolbar}</div></div>{rows.length ? <div className="auto-cards">{rows.map((p: any) => <ProjectCard key={p.id} p={p} action={quick(p)} />)}</div> : <div className="card">{empty}</div>}</div>}
  </>;
}

/* Inscrição em cinco etapas */
const WZ = ['Identificação', 'Dados do projeto', 'Plano de trabalho', 'Orçamento', 'Anexos e envio'];
export function Wizard({ chamadaId, projectId, stepIn }: any) {
  const { state, user, role, act, go, toast, inst, mediaOf } = useApp(); const draft = projectId ? state.projects.find((p: any) => p.id === projectId) : null; const ch0 = state.chamadas.find((c: any) => c.id === chamadaId);
  const [step, setStep] = useState(Math.min(4, Math.max(0, +(stepIn || 0)))); const [pid, setPid] = useState<string>(projectId || ''); const [add, setAdd] = useState(false); const [open, setOpen] = useState<any>(null); const [conf, setConf] = useState(false);
  const [d, setD] = useState<any>(() => draft ? { title: draft.title, instId: draft.instId, chamadaId: draft.chamadaId || '', eixo: draft.eixo, uf: draft.uf, municipios: draft.municipios, resumo: draft.resumo, objetivo: draft.objetivo, publico: draft.publico, beneficiarios: draft.beneficiarios, prazo: draft.prazo, ods: draft.ods || [], metas: draft.metas, orcamento: draft.orcamento }
    : { title: '', instId: user.instId || '', chamadaId: ch0?.id || '', eixo: ch0?.eixo || 'ambiente', uf: ch0 && !ch0.ufs.includes('BR') ? ch0.ufs[0] : (user.instId ? inst(user.instId)?.uf : 'MG'), municipios: '', resumo: '', objetivo: '', publico: '', beneficiarios: 0, prazo: 12, ods: [], metas: [{ id: uid('m'), title: '', unidade: '', alvo: 0, realizado: 0, prazoMes: 6 }], orcamento: [{ id: uid('r'), rubrica: RUBRICAS[0], descricao: '', valor: 0 }] });
  const set = (k: string, v: any) => setD((x: any) => ({ ...x, [k]: v })); const setRow = (list: string, id: string, k: string, v: any) => setD((x: any) => ({ ...x, [list]: x[list].map((r: any) => r.id === id ? { ...r, [k]: v } : r) }));
  if (projectId && (!draft || draft.status !== 'rascunho')) return <div className="card"><Empty title="Este projeto já foi enviado" action={<Btn onClick={() => go('projetos/' + projectId)}>Abrir projeto</Btn>}>Só rascunhos podem ser editados.</Empty></div>;
  const ch = state.chamadas.find((c: any) => c.id === d.chamadaId); const total = sum(d.orcamento, (r: any) => +r.valor); const adm = sum(d.orcamento.filter((r: any) => r.rubrica === 'Custos administrativos'), (r: any) => +r.valor); const admPct = total ? adm / total * 100 : 0;
  const ok = [!!(d.title.trim() && d.instId && d.municipios.trim()), !!(d.resumo.trim() && d.objetivo.trim() && d.prazo > 0), d.metas.some((m: any) => m.title.trim() && +m.alvo > 0 && m.unidade.trim()), total > 0 && (!ch || total <= ch.teto), true];
  const payload = () => ({ ...d, beneficiarios: +d.beneficiarios || 0, prazo: +d.prazo || 12, valor: total, metas: d.metas.filter((m: any) => m.title.trim()).map((m: any) => ({ ...m, alvo: +m.alvo, prazoMes: +m.prazoMes })), orcamento: d.orcamento.filter((r: any) => +r.valor > 0).map((r: any) => ({ ...r, valor: +r.valor })), chamadaId: d.chamadaId || null });
  const save = (silent?: boolean) => { const id = act.saveDraft(payload(), pid || undefined); if (!pid) setPid(id); if (!silent) toast('Rascunho salvo.'); return id; };
  const goStep = (i: number) => { if (i === 4 && d.title.trim() && d.instId) save(true); setStep(i); };
  const enviar = () => { const id = save(true); act.submitProject(id); toast('Inscrição enviada. O projeto segue para habilitação.'); go('projetos/' + id); };
  const media = pid ? mediaOf(pid) : [];
  return <>
    <PageHead title={draft ? 'Continuar inscrição' : 'Inscrever projeto'} sub={ch ? `${ch.code} · ${ch.title}` : 'Fluxo contínuo, sem chamada específica'} back={{ to: 'projetos', label: role.scope === 'proprio' ? 'Meus projetos' : 'Projetos' }}><Btn icon={Save} onClick={() => save()} disabled={!d.title.trim() || !d.instId}>Salvar rascunho</Btn></PageHead>
    <div className="wz">
      <nav className="wz-steps" aria-label="Etapas da inscrição">{WZ.map((l, i) => <button key={l} className={`wz-step ${i === step ? 'is-on' : ''} ${i !== step && ok[i] && i < 4 ? 'is-done' : ''}`} aria-current={i === step ? 'step' : undefined} onClick={() => goStep(i)}><i>{i !== step && ok[i] && i < 4 ? <Check size={13} /> : i + 1}</i><span>{l}</span></button>)}</nav>
      <div className="card"><div className="card-head"><h3>{step + 1}. {WZ[step]}</h3><span className="small muted">Etapa {step + 1} de 5</span></div><div className="card-body stack-sm">
        {step === 0 && <div className="form-grid">
          <Field label="Instituição proponente" span>{user.instId ? <input className="input" readOnly value={inst(d.instId)?.name || ''} /> : <select className="select" value={d.instId} onChange={e => set('instId', e.target.value)}><option value="">Selecione</option>{state.instituicoes.map((i: any) => <option key={i.id} value={i.id}>{i.name}</option>)}</select>}</Field>
          <Field label="Chamada" span hint={ch ? `Teto por projeto: ${fmtBRL(ch.teto)}. Inscrições até ${fmtDate(ch.encerramento)}.` : 'Sem chamada, o projeto entra pelo fluxo contínuo.'}><select className="select" value={d.chamadaId} onChange={e => set('chamadaId', e.target.value)}><option value="">Fluxo contínuo (sem chamada)</option>{state.chamadas.filter((c: any) => chamadaStatus(c) === 'aberta' || c.id === d.chamadaId).map((c: any) => <option key={c.id} value={c.id}>{c.code} · {c.title}</option>)}</select></Field>
          <Field label="Título do projeto" span><input className="input" value={d.title} onChange={e => set('title', e.target.value)} placeholder="Nome curto que identifique a entrega" /></Field>
          <Field label="Eixo temático"><select className="select" value={d.eixo} onChange={e => set('eixo', e.target.value)}>{EIXOS.map(e => <option key={e.id} value={e.id}>{e.label} ({e.ref})</option>)}</select></Field>
          <Field label="Estado" hint={`Unidade responsável: PR-${d.uf}`}><select className="select" value={d.uf} onChange={e => set('uf', e.target.value)}>{Object.entries(UF).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
          <Field label="Municípios atendidos" span><input className="input" value={d.municipios} onChange={e => set('municipios', e.target.value)} placeholder="Separe por vírgula" /></Field>
        </div>}
        {step === 1 && <div className="form-grid">
          <Field label="Resumo" span hint="Em até três frases: o que será feito, onde e para quem."><textarea className="textarea" value={d.resumo} onChange={e => set('resumo', e.target.value)} /></Field>
          <Field label="Objetivo" span><textarea className="textarea" style={{ minHeight: 64 }} value={d.objetivo} onChange={e => set('objetivo', e.target.value)} /></Field>
          <Field label="Público atendido" span><input className="input" value={d.publico} onChange={e => set('publico', e.target.value)} /></Field>
          <Field label="Pessoas beneficiadas"><input className="input num" type="number" min="0" value={d.beneficiarios} onChange={e => set('beneficiarios', e.target.value)} /></Field>
          <Field label="Prazo de execução (meses)"><input className="input num" type="number" min="1" max="60" value={d.prazo} onChange={e => set('prazo', e.target.value)} /></Field>
          <Group label="Objetivos de Desenvolvimento Sustentável" span hint="Marque os ODS para os quais o projeto contribui."><div className="chips">{ODS.slice(1).map((n, i) => { const k = i + 1; const on = d.ods.includes(k); return <button key={k} type="button" className={`chip ${on ? 'is-on' : ''}`} aria-pressed={on} title={n} onClick={() => set('ods', on ? d.ods.filter((x: number) => x !== k) : [...d.ods, k])}>ODS {k}</button>; })}</div></Group>
        </div>}
        {step === 2 && <>
          <p className="small muted">Cada meta precisa de um indicador e de um alvo numérico. É por elas que a execução será acompanhada.</p>
          {d.metas.map((m: any, i: number) => <div key={m.id} className="rowedit" style={{ gridTemplateColumns: 'minmax(0,2.4fr) minmax(0,1fr) 96px 86px 30px' }}>
            <input className="input" placeholder={`Meta ${i + 1}: o que será entregue`} value={m.title} onChange={e => setRow('metas', m.id, 'title', e.target.value)} aria-label={`Descrição da meta ${i + 1}`} />
            <input className="input" placeholder="Unidade" value={m.unidade} onChange={e => setRow('metas', m.id, 'unidade', e.target.value)} aria-label="Unidade de medida" />
            <input className="input num" type="number" min="0" placeholder="Alvo" value={m.alvo || ''} onChange={e => setRow('metas', m.id, 'alvo', e.target.value)} aria-label="Alvo" />
            <input className="input num" type="number" min="1" placeholder="Mês" value={m.prazoMes || ''} onChange={e => setRow('metas', m.id, 'prazoMes', e.target.value)} aria-label="Mês de conclusão" title="Mês de conclusão" />
            <Btn size="sm" variant="quiet" icon={X} aria-label="Remover meta" disabled={d.metas.length < 2} onClick={() => set('metas', d.metas.filter((x: any) => x.id !== m.id))} />
          </div>)}
          <div><Btn size="sm" icon={Plus} onClick={() => set('metas', [...d.metas, { id: uid('m'), title: '', unidade: '', alvo: 0, realizado: 0, prazoMes: d.prazo }])}>Adicionar meta</Btn></div>
        </>}
        {step === 3 && <>
          {d.orcamento.map((r: any) => <div key={r.id} className="rowedit" style={{ gridTemplateColumns: 'minmax(0,1.3fr) minmax(0,1.8fr) 140px 30px' }}>
            <select className="select" value={r.rubrica} onChange={e => setRow('orcamento', r.id, 'rubrica', e.target.value)} aria-label="Rubrica">{RUBRICAS.map(x => <option key={x}>{x}</option>)}</select>
            <input className="input" placeholder="Descrição do gasto" value={r.descricao || ''} onChange={e => setRow('orcamento', r.id, 'descricao', e.target.value)} aria-label="Descrição" />
            <input className="input num" type="number" min="0" step="100" placeholder="Valor (R$)" value={r.valor || ''} onChange={e => setRow('orcamento', r.id, 'valor', e.target.value)} aria-label="Valor em reais" />
            <Btn size="sm" variant="quiet" icon={X} aria-label="Remover linha" disabled={d.orcamento.length < 2} onClick={() => set('orcamento', d.orcamento.filter((x: any) => x.id !== r.id))} />
          </div>)}
          <div className="row between wrap"><Btn size="sm" icon={Plus} onClick={() => set('orcamento', [...d.orcamento, { id: uid('r'), rubrica: RUBRICAS[1], descricao: '', valor: 0 }])}>Adicionar linha</Btn><div className="right"><div className="tiny muted">Valor pleiteado</div><b className="num" style={{ fontSize: '1.3rem' }}>{fmtBRL(total)}</b></div></div>
          {ch && total > ch.teto && <Note tone="danger">O valor passa do teto da chamada ({fmtBRL(ch.teto)}). Reduza {fmtBRL(total - ch.teto)}.</Note>}
          {admPct > state.config.limiteAdm && <Note tone="warn">Custos administrativos em {admPct.toFixed(1).replace('.', ',')}% do orçamento. O limite é {state.config.limiteAdm}%.</Note>}
        </>}
        {step === 4 && <>
          <div className="row between wrap"><p className="small muted grow">Anexe o plano de trabalho assinado, certidões e o que ajudar na análise: fotos, vídeos, documentos ou links.</p><Btn icon={Upload} disabled={!pid} onClick={() => setAdd(true)}>Adicionar mídia</Btn></div>
          {pid ? <MediaGrid items={media} onOpen={setOpen} empty={<div className="card"><Empty title="Nenhum anexo ainda">A habilitação confere os documentos anexados aqui.</Empty></div>} /> : <Note tone="warn">Preencha o título e a instituição na etapa 1 para liberar os anexos.</Note>}
          <hr className="rule" />
          <h3>Antes de enviar</h3>
          <ul className="col gap-6">{WZ.slice(0, 4).map((l, i) => <li key={l} className="row gap-6 small">{ok[i] ? <Check size={16} aria-hidden style={{ color: 'var(--ok)' }} /> : <X size={16} aria-hidden style={{ color: 'var(--danger)' }} />}<span>{l}: {ok[i] ? 'completo' : 'faltam informações'}</span>{!ok[i] && <button className="linkbtn small" onClick={() => setStep(i)}>Completar</button>}</li>)}
            <li className="row gap-6 small">{media.length ? <Check size={16} aria-hidden style={{ color: 'var(--ok)' }} /> : <X size={16} aria-hidden style={{ color: 'var(--danger)' }} />}<span>Anexos: {media.length ? `${media.length} enviados` : 'nenhum arquivo ainda'}</span></li></ul>
        </>}
        <hr className="rule" />
        <div className="row between wrap"><Btn disabled={step === 0} onClick={() => goStep(step - 1)}>Voltar</Btn>
          {step < 4 ? <Btn variant="primary" onClick={() => goStep(step + 1)}>Continuar</Btn> : <Btn variant="cta" icon={Send} disabled={!ok.every(Boolean) || !media.length} onClick={() => setConf(true)}>Enviar inscrição</Btn>}</div>
      </div></div>
    </div>
    {add && <MediaAdd projectId={pid} etapa="Inscrição" onClose={() => setAdd(false)} />}
    {open && <MediaViewer m={open} onClose={() => setOpen(null)} />}
    {conf && <Confirm title="Enviar inscrição?" cta="Enviar inscrição" onConfirm={enviar} onClose={() => setConf(false)}><p>Depois de enviada, a proposta segue para habilitação e não pode mais ser editada. Se faltar algo, a equipe técnica abre uma diligência.</p><p><b>{d.title}</b> · {fmtBRL(total)}</p></Confirm>}
  </>;
}
