import React, { useMemo, useState } from 'react';
import { ArrowRight, ArrowUpRight, Check, CircleCheck, Square, ShieldCheck, ShieldAlert, Users, LogIn, LogOut, ListChecks, Plus, Megaphone, Library, Activity, ScrollText, FilePen, Stamp, Gavel, Search } from 'lucide-react';
import { STAGES, STATUS, CHECK_HAB, CHECK_LEGAL, CHECK_AUDIT, AUD_CONCL, eixo, fmtBRL, fmtCompact, fmtDate, fisico, despesas, saldoInstr, matchScore, daysUntil, sum, chamadaStatus, pct } from '../lib';
import { useApp, useQueues, verifyChain } from '../store';
import { Btn, PageHead, Empty, StatusPill, Pill, Tabs, Field, Note, Bar, Stat, DataTable, Confirm, Seg } from '../ui';
import { Stepper, Dual } from '../viz';
import { DestinarModal } from './detalhe';

/* ---------- O que cada etapa faz: objetivo, quem atua, entrada, saída e controles ---------- */
export const STAGE_INFO: any[] = [
  { sub: 'A instituição escolhe uma chamada aberta, preenche a proposta em cinco passos e envia. O rascunho fica salvo a cada passo e nada é enviado incompleto.',
    atores: ['Proponente', 'Gestão nacional (publica as chamadas)'], entrada: 'Chamada publicada, com edital, cronograma e modelos', saida: 'Inscrição enviada, com processo aberto no SEI',
    controles: ['Cinco passos: identificação, dados do projeto, plano de trabalho, orçamento e anexos', 'Rascunho salvo automaticamente', 'Conferência de completude antes do envio', 'Imagens, vídeos, documentos e links, cada um com sua visibilidade', 'Processo no SEI gerado no envio'] },
  { sub: 'A equipe técnica confere os documentos da instituição e da proposta. O projeto é habilitado, segue em diligência com prazo ou é inabilitado, sempre com fundamentação registrada.',
    atores: ['Analista técnico', 'Gestão nacional (distribui)', 'Proponente (responde diligências)'], entrada: 'Inscrição enviada', saida: 'Projeto habilitado para a análise técnica',
    controles: CHECK_HAB },
  { sub: 'Parecer técnico e jurídico em uma única tela: a proposta de um lado e, do outro, as verificações automáticas, a pontuação por critério e o checklist de conformidade legal.',
    atores: ['Analista técnico', 'Proponente (responde diligências)', 'IA de apoio: sugere, não decide'], entrada: 'Projeto habilitado', saida: 'Parecer com nota; aprovado segue para o banco de projetos',
    controles: ['Verificações automáticas de cadastro, orçamento, metas e anexos', 'Pontuação por critério, com pesos definidos pela gestão', ...CHECK_LEGAL.slice(0, 3), 'Diligência com prazo quando falta informação', 'Pré-análise com IA como apoio; a decisão é sempre humana'] },
  { sub: 'O membro do MPF consulta o banco de projetos aprovados, filtra por território, tema e valor e vê a compatibilidade de cada projeto com o instrumento. A destinação exige justificativa.',
    atores: ['Membro do MPF (procurador ou procuradora)'], entrada: 'Projeto aprovado no banco e instrumento com saldo', saida: 'Projeto selecionado, com valor, instrumento e justificativa',
    controles: ['Compatibilidade calculada por tema, território e saldo', 'Saldo do instrumento conferido no momento da decisão', 'Justificativa obrigatória e registrada', 'Decisão registrada no Sistema Único', 'Rastro do recurso, da origem ao projeto'] },
  { sub: 'A seleção é homologada por quem tem a permissão especial. O termo de destinação é gerado, o valor fica comprometido no instrumento e a execução começa com o projeto publicado no portal.',
    atores: ['Gestão nacional ou membro com permissão especial'], entrada: 'Projeto selecionado', saida: 'Termo assinado, vigência iniciada e projeto publicado',
    controles: ['Permissão especial “Homologar seleção e assinar termo”', 'Termo de destinação numerado e juntado ao SEI', 'Valor comprometido no instrumento', 'Vigência calculada pelo prazo do projeto', 'Publicação automática no portal de transparência'] },
  { sub: 'A instituição atualiza as metas, envia relatórios com evidências e lança as despesas. A equipe técnica atesta a regularidade e o painel executivo alerta sobre prazos e desvios.',
    atores: ['Proponente', 'Analista técnico (atesta)', 'Gestão (painel executivo)'], entrada: 'Termo assinado e vigência iniciada', saida: 'Execução encerrada e prestação de contas final enviada',
    controles: ['Metas com indicador, alvo e prazo', 'Relatórios com evidências anexadas', 'Ateste de regularidade ou devolução com motivo', 'Despesas lançadas por rubrica, com nota fiscal', 'Alertas de vigência e de gasto à frente da execução física'] },
  { sub: 'Ao fim da execução, a instituição envia a prestação de contas final. A equipe técnica aprova ou glosa cada despesa e emite o parecer de contas. Depois, a auditoria examina uma amostra, confere as evidências e a trilha do projeto e emite o parecer que encerra o ciclo.',
    atores: ['Proponente (envia as contas)', 'Analista técnico (parecer de contas)', 'Auditoria e controle (parecer de auditoria)'], entrada: 'Prestação de contas final enviada', saida: 'Parecer de auditoria, projeto encerrado e resultado publicado',
    controles: CHECK_AUDIT.map(c => c.label), novo: true },
];
const FASES7 = [['7.1', 'Envio das contas', 'Proponente'], ['7.2', 'Análise das despesas', 'Analista técnico'], ['7.3', 'Auditoria de conformidade', 'Auditoria e controle'], ['7.4', 'Encerramento e publicação', 'Sistema']];

export function StageRail({ cur }: { cur: number }) {
  const { go } = useApp();
  return <nav className="stage-rail" aria-label="Etapas do ciclo">{STAGES.map((s, i) => <button key={s.id} className={`sr ${i === cur ? 'is-on' : i < cur ? 'is-past' : ''}`} aria-current={i === cur ? 'step' : undefined} onClick={() => go('etapa/' + (i + 1))}><b>{s.n}</b><span>{s.short || s.label}</span></button>)}</nav>;
}

function Side({ i, children }: any) {
  const S = STAGE_INFO[i];
  return <aside className="stack">
    <div className="card"><div className="card-head"><h3>Como funciona esta etapa</h3></div>
      <div className="card-pad stack-sm">
        <div className="kv"><span className="kv-ic"><Users size={16} aria-hidden /></span><div><b>Quem atua</b><div className="chips" style={{ marginTop: 6 }}>{S.atores.map((a: string) => <span key={a} className="tagpill">{a}</span>)}</div></div></div>
        <div className="kv"><span className="kv-ic"><LogIn size={16} aria-hidden /></span><div><b>Entrada</b><p className="small muted">{S.entrada}</p></div></div>
        <div className="kv"><span className="kv-ic"><LogOut size={16} aria-hidden /></span><div><b>Saída</b><p className="small muted">{S.saida}</p></div></div>
      </div></div>
    <div className="card"><div className="card-head"><ListChecks size={17} aria-hidden /><h3>Controles da etapa</h3></div>
      <ul className="ctl">{S.controles.map((c: string) => <li key={c}><Check size={15} aria-hidden />{c}</li>)}</ul></div>
    {children}
  </aside>;
}

const dias = (p: any) => Math.max(0, Math.floor((Date.now() - new Date(p.updatedAt).getTime()) / 864e5));
const colProj = (inst: any) => ({ key: 'title', label: 'Projeto', w: 3, exp: (p: any) => p.title, render: (p: any) => <><div className="cell-main">{p.title}</div><div className="cell-sub num">{p.code} · {inst(p.instId)?.name}</div></> });
const colDias = { key: 'dias', label: 'Na etapa', w: 1, exp: (p: any) => dias(p), sort: (p: any) => dias(p), render: (p: any) => { const d = dias(p); return <Pill tone={d >= 10 ? 'danger' : d >= 5 ? 'warn' : 'neutral'}>{d === 0 ? 'hoje' : `${d} ${d === 1 ? 'dia' : 'dias'}`}</Pill>; } };
const colSit = { key: 'st', label: 'Situação', w: 1.4, exp: (p: any) => STATUS[p.status].label, render: (p: any) => <StatusPill status={p.status} /> };

export function Etapa({ n, tab }: { n: string; tab?: string }) {
  const app = useApp(); const { state, go, can, special, act, toast, inst, userById, role, scoped, user } = app; const q = useQueues();
  const i = Math.max(0, Math.min(6, (+n || 1) - 1)); const S = STAGES[i]; const info = STAGE_INFO[i];
  const [modal, setModal] = useState<any>(null); const chain = useMemo(() => verifyChain(state.audit), [state.audit]);
  const own = role.scope === 'proprio'; const ps = own ? scoped : state.projects;
  const analistas = state.users.filter((u: any) => state.roles.find((r: any) => r.id === u.roleId)?.perms?.analises?.includes('aprovar') && u.active && !['admin', 'gestor'].includes(u.roleId));
  const colAn = { key: 'an', label: 'Analista', w: 1.6, stop: true, exp: (p: any) => userById(p.analistaId)?.name || '', render: (p: any) => can('analises', 'editar') ? <select className="select input-sm" style={{ minWidth: 140 }} value={p.analistaId || ''} aria-label={`Analista de ${p.title}`} onChange={e => { if (e.target.value) { act.assign(p.id, e.target.value); toast('Análise distribuída.'); } }}><option value="">Distribuir para…</option>{analistas.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}</select> : <span className="small">{userById(p.analistaId)?.name || <span className="muted">Sem analista</span>}</span> };
  let body: any = null; let side: any = null; let cta: any = null;

  if (i === 0) {
    const abertas = state.chamadas.filter((c: any) => chamadaStatus(c) === 'aberta');
    const rows = ps.filter((p: any) => p.status === 'rascunho' || (p.submittedAt || p.status === 'habilitacao')).filter((p: any) => ['rascunho', 'habilitacao'].includes(p.status));
    cta = own && can('projetos', 'criar') ? <Btn variant="cta" icon={Plus} onClick={() => go('chamadas')}>Inscrever projeto</Btn> : can('chamadas', 'criar') ? <Btn variant="cta" icon={Megaphone} onClick={() => go('chamadas')}>Publicar chamada</Btn> : null;
    body = <>
      <div className="stats"><Stat v={abertas.length} l="Chamadas com inscrições abertas" /><Stat v={ps.filter((p: any) => p.status === 'rascunho').length} l="Rascunhos salvos" /><Stat v={ps.filter((p: any) => p.status !== 'rascunho').length} l="Inscrições enviadas" /><Stat v={fmtCompact(sum(abertas, (c: any) => c.valor))} l="Em chamadas abertas" /></div>
      <div className="card"><div className="card-head"><h3>Chamadas abertas</h3><Btn size="sm" variant="quiet" onClick={() => go('chamadas')}>Todas as chamadas</Btn></div>
        {abertas.map((c: any) => <button key={c.id} className="list-btn" onClick={() => go('chamadas/' + c.id)}><span className="ico-badge t-info"><Megaphone size={16} aria-hidden /></span><span className="grow" style={{ minWidth: 0 }}><b className="cell-main" style={{ display: 'block' }}>{c.title}</b><span className="cell-sub">{c.code} · {c.unidade} · encerra em {daysUntil(c.encerramento)} dias · teto {fmtCompact(c.teto)}</span></span><span className="tab-n">{state.projects.filter((p: any) => p.chamadaId === c.id && p.status !== 'rascunho').length} inscritos</span></button>)}</div>
      <DataTable rows={rows} onRow={(p: any) => go(p.status === 'rascunho' && can('projetos', 'editar') ? 'rascunho/' + p.id : 'projetos/' + p.id)} toolbar={<h3 className="grow">Inscrições em andamento</h3>} empty={<Empty title="Nenhuma inscrição em andamento" />}
        columns={[colProj(inst), { key: 'eixo', label: 'Eixo', w: 1.6, exp: (p: any) => eixo(p.eixo).label }, { key: 'valor', label: 'Valor', w: 1.1, align: 'right', exp: (p: any) => fmtBRL(p.valor), sort: (p: any) => p.valor, nowrap: true }, colSit,
          { key: 'act', label: '', stop: true, render: (p: any) => p.status === 'rascunho' && can('projetos', 'editar') ? <Btn size="sm" variant="primary" icon={FilePen} onClick={() => go('rascunho/' + p.id)}>Continuar</Btn> : <Btn size="sm" onClick={() => go('projetos/' + p.id)}>Ver</Btn> }]} />
    </>;
  }
  if (i === 1 || i === 2) {
    const st = i === 1 ? 'habilitacao' : 'analise';
    const rows = ps.filter((p: any) => p.status === st || (p.status === 'diligencia' && (p.diligStage === 'habilitacao') === (i === 1)));
    const done = ps.filter((p: any) => i === 1 ? p.hab : p.parecer);
    const neg = ps.filter((p: any) => p.status === (i === 1 ? 'inabilitado' : 'reprovado')).length;
    const media = i === 2 ? (done.length ? (sum(done, (p: any) => p.parecer.nota) / done.length) : 0) : 0;
    body = <>
      <div className="stats"><Stat v={rows.filter((p: any) => p.status === st).length} l={i === 1 ? 'Aguardam conferência' : 'Aguardam parecer'} /><Stat v={rows.filter((p: any) => p.status === 'diligencia').length} l="Em diligência" d="aguardando a instituição" />
        <Stat v={i === 1 ? done.filter((p: any) => p.hab.decisao === 'habilitar').length : String(media.toFixed(1)).replace('.', ',')} l={i === 1 ? 'Habilitados' : 'Nota média dos pareceres'} /><Stat v={neg} l={i === 1 ? 'Inabilitados' : 'Não aprovados'} /></div>
      <DataTable rows={rows} onRow={(p: any) => go(can('analises', 'aprovar') && p.status === st ? 'analise/' + p.id : 'projetos/' + p.id)} toolbar={<h3 className="grow">{i === 1 ? 'Fila de habilitação' : 'Fila de análise técnica'}</h3>}
        empty={<Empty title="Fila vazia nesta etapa">Nada aguardando decisão aqui.</Empty>}
        columns={[colProj(inst), { key: 'un', label: 'Unidade', w: 0.9, exp: (p: any) => p.unidade, nowrap: true }, colDias, ...(own ? [colSit] : [colAn]),
          { key: 'act', label: '', stop: true, render: (p: any) => p.status === 'diligencia' ? (own ? <Btn size="sm" variant="cta" onClick={() => go('diligencias')}>Responder</Btn> : <Pill tone="warn">Em diligência</Pill>) : can('analises', 'aprovar') ? <Btn size="sm" variant="primary" onClick={() => go('analise/' + p.id)}>{i === 1 ? 'Conferir' : 'Emitir parecer'}</Btn> : <Btn size="sm" onClick={() => go('projetos/' + p.id)}>Ver</Btn> }]} />
    </>;
    if (i === 2) side = <div className="card"><div className="card-head"><h3>Critérios e pesos</h3></div><ul className="list">{state.config.criteria.map((c: any) => <li key={c.id}><span className="grow small">{c.label}</span><b className="num small">{c.peso}%</b></li>)}</ul></div>;
  }
  if (i === 3) {
    const rows = state.projects.filter((p: any) => p.status === 'banco');
    const instrs = q.meusInstr; const saldo = sum(instrs, (x: any) => saldoInstr(state, x.id));
    const best = (p: any) => instrs.map((x: any) => ({ x, m: matchScore(p, x, saldoInstr(state, x.id)) })).sort((a: any, b: any) => b.m - a.m)[0];
    cta = <Btn variant="primary" icon={Library} onClick={() => go('banco')}>Abrir banco de projetos</Btn>;
    body = <>
      <div className="stats"><Stat v={rows.length} l="Projetos aprovados no banco" /><Stat v={fmtCompact(saldo)} l="Saldo para destinar" d={`em ${instrs.filter((x: any) => saldoInstr(state, x.id) > 0).length} instrumentos`} /><Stat v={fmtCompact(sum(state.projects.filter((p: any) => p.selecao), (p: any) => p.selecao.valor))} l="Já destinado" /><Stat v={state.projects.filter((p: any) => p.status === 'selecionado').length} l="Selecionados, aguardando homologação" /></div>
      <DataTable rows={rows} onRow={(p: any) => go('projetos/' + p.id)} toolbar={<h3 className="grow">Projetos aguardando julgamento</h3>} empty={<Empty title="Banco vazio" />}
        columns={[colProj(inst), { key: 'nota', label: 'Nota', w: 0.7, align: 'right', exp: (p: any) => p.parecer?.nota, render: (p: any) => <b className="num">{String(p.parecer?.nota ?? '—').replace('.', ',')}</b> }, { key: 'valor', label: 'Valor', w: 1.1, align: 'right', exp: (p: any) => fmtBRL(p.valor), sort: (p: any) => p.valor, nowrap: true },
          { key: 'comp', label: 'Melhor compatibilidade', w: 2, exp: (p: any) => best(p)?.m || 0, render: (p: any) => { const b = best(p); return b ? <><div className="row gap-6"><div className="grow"><Bar value={b.m} thin tone={b.m >= 70 ? 'ok' : ''} /></div><b className="num small">{b.m}%</b></div><div className="cell-sub">{b.x.numero}</div></> : '—'; } },
          { key: 'act', label: '', stop: true, render: (p: any) => can('recursos', 'aprovar') ? <Btn size="sm" variant="cta" icon={Gavel} onClick={() => setModal({ destinar: p })}>Julgar</Btn> : <Btn size="sm" onClick={() => go('projetos/' + p.id)}>Ver</Btn> }]} />
    </>;
  }
  if (i === 4) {
    const rows = state.projects.filter((p: any) => p.status === 'selecionado'); const hom = state.projects.filter((p: any) => p.homolog);
    const prazo = hom.length ? Math.round(sum(hom, (p: any) => (new Date(p.homolog.date).getTime() - new Date(p.selecao.date).getTime()) / 864e5) / hom.length) : 0;
    body = <>
      <div className="stats"><Stat v={rows.length} l="Seleções aguardando homologação" /><Stat v={hom.length} l="Termos de destinação assinados" /><Stat v={fmtCompact(sum(hom, (p: any) => p.selecao.valor))} l="Valor homologado" /><Stat v={`${prazo} dias`} l="Prazo médio entre seleção e termo" /></div>
      <DataTable rows={rows} onRow={(p: any) => go(`projetos/${p.id}/destinacao`)} toolbar={<h3 className="grow">Seleções para homologar</h3>} empty={<Empty title="Nenhuma seleção pendente" />}
        columns={[colProj(inst), { key: 'instr', label: 'Instrumento', w: 1.8, exp: (p: any) => state.instrumentos.find((x: any) => x.id === p.selecao?.instrumentoId)?.numero }, { key: 'valor', label: 'Valor destinado', w: 1.2, align: 'right', exp: (p: any) => fmtBRL(p.selecao?.valor), nowrap: true },
          { key: 'por', label: 'Selecionado por', w: 1.4, exp: (p: any) => userById(p.selecao?.by)?.name },
          { key: 'act', label: '', stop: true, render: (p: any) => special('homologar') ? <Btn size="sm" variant="cta" icon={Stamp} onClick={() => setModal({ homologar: p })}>Homologar</Btn> : <Btn size="sm" onClick={() => go(`projetos/${p.id}/destinacao`)}>Ver</Btn> }]} />
      <div className="card"><div className="card-head"><h3>Termos assinados recentemente</h3></div><ul className="list">{[...hom].sort((a: any, b: any) => b.homolog.date.localeCompare(a.homolog.date)).slice(0, 4).map((p: any) => <li key={p.id}><span className="ico-badge t-ok"><Stamp size={16} aria-hidden /></span><span className="grow" style={{ minWidth: 0 }}><b className="small">{p.homolog.termo}</b><div className="tiny muted truncate">{p.title} · {fmtBRL(p.selecao.valor)}</div></span><span className="tiny muted nowrap">{fmtDate(p.homolog.date)}</span></li>)}</ul></div>
    </>;
  }
  if (i === 5) {
    const rows = ps.filter((p: any) => p.status === 'execucao'); const relAg = q.relatorios.filter((x: any) => !own || x.p.instId === user.instId);
    const vence = rows.filter((p: any) => daysUntil(p.exec?.fim) <= 60).length;
    cta = !own && can('monitoramento') ? <Btn variant="primary" icon={Activity} onClick={() => go('monitoramento')}>Painel executivo</Btn> : null;
    body = <>
      <div className="stats"><Stat v={rows.length} l="Projetos em execução" /><Stat v={relAg.length} l="Relatórios aguardando ateste" /><Stat v={`${rows.length ? Math.round(sum(rows, fisico) / rows.length) : 0}%`} l="Execução física média" /><Stat v={vence} l="Vigência termina em até 60 dias" /></div>
      <DataTable rows={rows} onRow={(p: any) => go(`projetos/${p.id}/monitoramento`)} toolbar={<h3 className="grow">Execução por projeto</h3>} empty={<Empty title="Nenhum projeto em execução" />}
        columns={[colProj(inst), { key: 'dual', label: 'Físico e financeiro', w: 2.2, exp: (p: any) => fisico(p), render: (p: any) => <Dual p={p} /> }, { key: 'vig', label: 'Vigência', w: 1.1, exp: (p: any) => fmtDate(p.exec?.fim), sort: (p: any) => p.exec?.fim, render: (p: any) => <><div className="small num">{fmtDate(p.exec?.fim)}</div><div className="cell-sub">{daysUntil(p.exec?.fim) < 0 ? 'encerrada' : `faltam ${daysUntil(p.exec?.fim)} dias`}</div></> },
          { key: 'rel', label: 'Relatórios', w: 1.1, exp: (p: any) => p.relatorios.filter((r: any) => r.status === 'aguardando').length, render: (p: any) => { const n = p.relatorios.filter((r: any) => r.status === 'aguardando').length; return n ? <Pill tone="warn">{n} aguarda ateste</Pill> : <Pill tone="ok">Em dia</Pill>; } },
          { key: 'act', label: '', stop: true, render: (p: any) => <Btn size="sm" onClick={() => go(`projetos/${p.id}/monitoramento`)}>Acompanhar</Btn> }]} />
    </>;
  }
  if (i === 6) {
    const cont = ps.filter((p: any) => p.status === 'contas'), aud = ps.filter((p: any) => p.status === 'auditoria'), fim = ps.filter((p: any) => p.status === 'concluido');
    const glos = sum(ps.filter((p: any) => p.exec), (p: any) => despesas(p).glosado);
    const t = ['contas', 'auditoria', 'encerrados'].includes(tab || '') ? tab! : (can('auditoria', 'aprovar') ? 'auditoria' : 'contas');
    body = <>
      <div className="fases7">{FASES7.map(([k, l, r], j) => <div key={k} className={`f7 ${(t === 'contas' && j < 2) || (t === 'auditoria' && j === 2) || (t === 'encerrados' && j === 3) ? 'is-on' : ''}`}><b>{k}</b><span>{l}</span><i>{r}</i>{j < 3 && <ArrowRight size={15} aria-hidden className="f7-a" />}</div>)}</div>
      <div className="stats"><Stat v={cont.length} l="Prestações de contas em análise" /><Stat v={aud.length} l="Projetos em auditoria" /><Stat v={fim.length} l="Projetos encerrados" /><Stat v={fmtBRL(glos)} l="Despesas glosadas" /></div>
      <Tabs tabs={[{ id: 'contas', label: 'Prestação de contas', count: cont.length }, { id: 'auditoria', label: 'Auditoria de conformidade', count: aud.length }, { id: 'encerrados', label: 'Encerrados', count: 0 }]} value={t} onChange={(x: string) => go('etapa/7/' + x)} />
      {t === 'contas' && <DataTable rows={cont} onRow={(p: any) => go(`projetos/${p.id}/contas`)} empty={<Empty title="Nenhuma prestação de contas em análise" />}
        columns={[colProj(inst), { key: 'dest', label: 'Destinado', w: 1.1, align: 'right', exp: (p: any) => fmtBRL(p.selecao.valor), nowrap: true }, { key: 'apr', label: 'Aprovado', w: 1.1, align: 'right', exp: (p: any) => fmtBRL(despesas(p).aprovado), nowrap: true }, { key: 'pen', label: 'Em análise', w: 1, align: 'right', exp: (p: any) => fmtBRL(despesas(p).pendente), nowrap: true }, { key: 'glo', label: 'Glosado', w: 1, align: 'right', exp: (p: any) => fmtBRL(despesas(p).glosado), nowrap: true },
          { key: 'act', label: '', stop: true, render: (p: any) => can('contas', 'aprovar') ? <Btn size="sm" variant="primary" onClick={() => go(`projetos/${p.id}/contas`)}>Analisar contas</Btn> : <Btn size="sm" onClick={() => go(`projetos/${p.id}/contas`)}>Ver</Btn> }]} />}
      {t === 'auditoria' && <DataTable rows={aud} onRow={(p: any) => go('auditar/' + p.id)} empty={<Empty title="Nenhum projeto aguardando auditoria" />}
        columns={[colProj(inst), { key: 'contas', label: 'Contas aprovadas em', w: 1.2, exp: (p: any) => fmtDate(p.contas?.aprovadaEm), nowrap: true }, { key: 'apr', label: 'Despesas aprovadas', w: 1.2, align: 'right', exp: (p: any) => fmtBRL(despesas(p).aprovado), nowrap: true }, { key: 'n', label: 'Despesas', w: 0.8, align: 'right', exp: (p: any) => p.despesas.length }, colDias,
          { key: 'act', label: '', stop: true, render: (p: any) => can('auditoria', 'aprovar') ? <Btn size="sm" variant="cta" icon={Search} onClick={() => go('auditar/' + p.id)}>Auditar</Btn> : <Btn size="sm" onClick={() => go('auditar/' + p.id)}>Ver</Btn> }]} />}
      {t === 'encerrados' && <DataTable rows={fim} onRow={(p: any) => go('auditar/' + p.id)} empty={<Empty title="Nenhum projeto encerrado" />}
        columns={[colProj(inst), { key: 'conc', label: 'Parecer de auditoria', w: 1.5, exp: (p: any) => AUD_CONCL[p.auditoria?.conclusao]?.label || '—', render: (p: any) => p.auditoria ? <Pill tone={AUD_CONCL[p.auditoria.conclusao].tone}>{AUD_CONCL[p.auditoria.conclusao].label}</Pill> : <span className="muted small">—</span> }, { key: 'em', label: 'Encerrado em', w: 1, exp: (p: any) => fmtDate(p.auditoria?.date || p.contas?.aprovadaEm), nowrap: true }, { key: 'benef', label: 'Beneficiários', w: 1, align: 'right', exp: (p: any) => p.beneficiarios.toLocaleString('pt-BR') },
          { key: 'act', label: '', stop: true, render: (p: any) => <Btn size="sm" onClick={() => go('p/' + p.id)} icon={ArrowUpRight}>Página pública</Btn> }]} />}
    </>;
    side = can('auditoria') ? <div className="card"><div className="card-head"><h3>Integridade da trilha</h3></div><div className="card-pad stack-sm">
      {chain.ok ? <Note tone="ok"><b>Trilha íntegra.</b> {chain.n.toLocaleString('pt-BR')} registros encadeados por hash, sem alteração.</Note> : <Note tone="danger"><b>Cadeia quebrada no registro nº {chain.at}.</b> Tudo a partir dele deve ser tratado como suspeito.</Note>}
      <Btn size="sm" icon={ScrollText} onClick={() => go('auditoria')}>Abrir trilha de auditoria</Btn></div></div> : null;
  }

  return <>
    <PageHead title={<><span className="stage-n">{S.n}</span>{S.label}{info.novo && <span className="novo">Nova etapa</span>}</>} sub={info.sub}>{cta}</PageHead>
    <StageRail cur={i} />
    <div className="split stage-split">
      <div className="stack">{body}</div>
      <Side i={i}>{side}</Side>
    </div>
    {modal?.destinar && <DestinarModal p={modal.destinar} onClose={() => setModal(null)} />}
    {modal?.homologar && <Confirm title="Homologar seleção?" cta="Homologar e assinar termo" onConfirm={() => { act.homologar(modal.homologar.id); toast('Seleção homologada. Execução iniciada.'); }} onClose={() => setModal(null)}><p>O termo de destinação será gerado, {fmtBRL(modal.homologar.selecao.valor)} ficam comprometidos no instrumento e o projeto entra em monitoramento com vigência de {modal.homologar.prazo} meses.</p></Confirm>}
  </>;
}

/* ---------- 07 · Auditoria de conformidade de um projeto ---------- */
export function Auditar({ id }: { id: string }) {
  const { state, go, can, act, toast, inst, userById, instr } = useApp();
  const p = state.projects.find((x: any) => x.id === id);
  const sugest = useMemo(() => p ? [...p.despesas].filter((d: any) => d.status !== 'glosada').sort((a: any, b: any) => b.valor - a.valor).slice(0, 5).map((d: any) => d.id) : [], [p?.id]);
  const [ck, setCk] = useState<any>(() => Object.fromEntries(CHECK_AUDIT.map(c => [c.id, false])));
  const [amostra, setAmostra] = useState<string[]>([]); const [conc, setConc] = useState('regular'); const [achados, setAchados] = useState(''); const [txt, setTxt] = useState('');
  const chain = useMemo(() => verifyChain(state.audit), [state.audit]);
  if (!p) return <div className="card"><Empty title="Projeto não encontrado" action={<Btn onClick={() => go('etapa/7')}>Voltar para a etapa 07</Btn>} /></div>;
  const d = despesas(p); const evs = state.audit.filter((e: any) => e.entityId === p.id); const I = inst(p.instId);
  const editavel = p.status === 'auditoria' && can('auditoria', 'aprovar'); const A = p.auditoria;
  const tudo = CHECK_AUDIT.every(c => ck[c.id]);
  const okEnviar = amostra.length >= 3 && txt.trim().length >= 30 && (conc === 'regular' ? tudo : achados.trim().length >= 15);
  const amostraVer = A ? A.amostra : amostra;
  return <>
    <PageHead title="Auditoria de conformidade" sub={`${p.title} · ${p.code} · ${I?.name}`} back={{ to: 'etapa/7/auditoria', label: '07 · Prestação de contas e auditoria' }}>{A ? <Pill tone={AUD_CONCL[A.conclusao].tone}>Parecer: {AUD_CONCL[A.conclusao].label}</Pill> : <StatusPill status={p.status} />}</PageHead>
    <div className="stack">
      <div className="card card-pad"><Stepper p={p} /></div>
      <div className="split aud">
        <div className="stack aud-main">
          <div className="stats"><Stat v={fmtBRL(p.selecao?.valor)} l="Valor destinado" d={instr(p.selecao?.instrumentoId)?.numero} /><Stat v={fmtBRL(d.aprovado)} l="Despesas aprovadas" /><Stat v={fmtBRL(d.glosado)} l="Glosado" /><Stat v={`${fisico(p)}%`} l="Execução física" /></div>
          {p.contas?.aprovadaEm && <Note tone="ok"><b>Parecer de contas em {fmtDate(p.contas.aprovadaEm)}</b>, por {userById(p.contas.by)?.name}. {p.contas.parecer}</Note>}
          <DataTable rows={p.despesas} pageSize={8} toolbar={<><h3 className="grow">Amostra de despesas {editavel && <span className="tiny muted">· {amostra.length} selecionadas</span>}</h3>{editavel && <Btn size="sm" onClick={() => setAmostra(sugest)}>Sugerir amostra pelos maiores valores</Btn>}</>}
            columns={[
              { key: 'sel', label: '', w: 0.4, stop: true, render: (r: any) => { const on = amostraVer.includes(r.id); return editavel ? <button type="button" className="ckbox" aria-pressed={on} aria-label={`Incluir ${r.fornecedor} na amostra`} onClick={() => setAmostra(on ? amostra.filter(x => x !== r.id) : [...amostra, r.id])}>{on ? <Check size={14} /> : null}</button> : on ? <Check size={15} className="ok-ink" aria-label="Na amostra" /> : null; } },
              { key: 'date', label: 'Data', w: 0.9, exp: (r: any) => fmtDate(r.date), sort: (r: any) => r.date, nowrap: true },
              { key: 'forn', label: 'Fornecedor e documento', w: 2.6, exp: (r: any) => r.fornecedor, render: (r: any) => <><div className="cell-main">{r.fornecedor}</div><div className="cell-sub">{r.rubrica} · {r.doc}{r.obs ? ' · ' + r.obs : ''}</div></> },
              { key: 'valor', label: 'Valor', w: 1, align: 'right', exp: (r: any) => fmtBRL(r.valor), sort: (r: any) => r.valor, nowrap: true },
              { key: 'st', label: 'Contas', w: 1, exp: (r: any) => r.status, render: (r: any) => <Pill tone={r.status === 'aprovada' ? 'ok' : r.status === 'glosada' ? 'danger' : 'warn'}>{r.status === 'aprovada' ? 'Aprovada' : r.status === 'glosada' ? 'Glosada' : 'Em análise'}</Pill> }]} />
          <div className="split even">
            <div className="card"><div className="card-head"><h3>Metas e evidências</h3></div><ul className="list">{p.metas.map((m: any) => <li key={m.id} style={{ flexWrap: 'wrap' }}><span className="grow" style={{ minWidth: 180 }}><b className="small">{m.title}</b><div className="row gap-6" style={{ marginTop: 6 }}><div className="grow"><Bar value={pct(m.realizado, m.alvo)} thin tone={m.realizado >= m.alvo ? 'ok' : ''} /></div><span className="tiny muted num nowrap">{m.realizado.toLocaleString('pt-BR')} de {m.alvo.toLocaleString('pt-BR')}</span></div></span></li>)}</ul>
              <div className="card-pad" style={{ paddingTop: 0 }}><p className="tiny muted">{p.relatorios.filter((r: any) => r.status === 'atestado').length} de {p.relatorios.length} relatórios atestados · {state.media.filter((m: any) => m.projectId === p.id).length} evidências no projeto</p></div></div>
            <div className="card"><div className="card-head"><h3>Trilha do projeto</h3></div><div className="card-pad stack-sm">
              {chain.ok ? <Note tone="ok"><span><b>Íntegra.</b> {evs.length} registros deste projeto, encadeados por hash.</span></Note> : <Note tone="danger"><b>Cadeia quebrada no registro nº {chain.at}.</b></Note>}
              <ul className="mini-tl">{evs.slice(-5).reverse().map((e: any) => <li key={e.seq}><b className="tiny">{e.action}</b><span className="tiny muted">{fmtDate(e.ts)} · {e.userName.split(' ')[0]} · <span className="hash">#{e.seq} {e.hash.slice(0, 8)}</span></span></li>)}</ul>
              <Btn size="sm" variant="quiet" onClick={() => go(`projetos/${p.id}/historico`)}>Histórico completo</Btn></div></div>
          </div>
        </div>
        <aside className="card aud-form">
          <div className="card-head">{A ? <ShieldCheck size={18} aria-hidden /> : <ShieldAlert size={18} aria-hidden />}<h3>{A ? 'Parecer de auditoria' : 'Checklist e parecer'}</h3></div>
          <div className="card-pad stack-sm">
            {A ? <>
              <Pill tone={AUD_CONCL[A.conclusao].tone}>{AUD_CONCL[A.conclusao].label}</Pill>
              <p className="small muted">Emitido por {userById(A.by)?.name} em {fmtDate(A.date)} · {A.amostra.length} despesas examinadas</p>
              <ul className="ctl tight">{CHECK_AUDIT.map(c => <li key={c.id}>{A.checklist?.[c.id] ? <CircleCheck size={15} className="ok-ink" aria-hidden /> : <Square size={15} aria-hidden />}{c.label}</li>)}</ul>
              {A.achados && <div><b className="small">Achados</b><p className="small">{A.achados}</p></div>}
              <div><b className="small">Parecer</b><p className="small">{A.texto}</p></div>
            </> : !editavel ? <Empty title={p.status === 'auditoria' ? 'Aguardando a auditoria' : 'A auditoria começa depois do parecer de contas'}>{p.status === 'auditoria' ? 'Só o perfil Auditoria e controle emite o parecer de auditoria.' : 'O projeto chega aqui quando a equipe técnica aprova a prestação de contas.'}</Empty> : <>
              <div className="ck-list" role="group" aria-label="Checklist de conformidade">{CHECK_AUDIT.map(c => <button type="button" key={c.id} className={`ck ${ck[c.id] ? 'is-on' : ''}`} aria-pressed={ck[c.id]} onClick={() => setCk({ ...ck, [c.id]: !ck[c.id] })}><span className="ckbox">{ck[c.id] ? <Check size={14} /> : null}</span>{c.label}</button>)}</div>
              <Field label="Conclusão"><Seg value={conc} onChange={setConc} options={Object.entries(AUD_CONCL).map(([id, v]: any) => ({ id, label: v.label }))} /></Field>
              <Field label="Achados" hint={conc === 'regular' ? 'Opcional quando a conclusão é regular.' : 'Obrigatório para ressalvas ou irregularidade.'}><textarea className="textarea" style={{ minHeight: 70 }} value={achados} onChange={e => setAchados(e.target.value)} placeholder="Descreva o que foi encontrado na amostra." /></Field>
              <Field label="Parecer de auditoria" hint="Mínimo de 30 caracteres. O resumo fica público no portal."><textarea className="textarea" style={{ minHeight: 90 }} value={txt} onChange={e => setTxt(e.target.value)} placeholder="Amostra conferida com os comprovantes, metas comprovadas por evidências…" /></Field>
              {conc === 'irregular' && <Note tone="danger">Com parecer irregular, a prestação de contas volta para correção e o projeto não é encerrado.</Note>}
              <Btn variant="cta" disabled={!okEnviar} title={!okEnviar ? 'Selecione ao menos 3 despesas, complete o checklist (ou registre os achados) e escreva o parecer' : ''} onClick={() => { act.auditar(p.id, { checklist: ck, amostra, conclusao: conc, achados: achados.trim(), texto: txt.trim() }); toast(conc === 'irregular' ? 'Parecer emitido. Prestação de contas reaberta.' : 'Parecer de auditoria emitido. Projeto encerrado.'); }}>Emitir parecer de auditoria</Btn>
              {!okEnviar && <p className="tiny muted">Para emitir: ao menos 3 despesas na amostra, {conc === 'regular' ? 'todos os itens do checklist' : 'os achados registrados'} e o parecer escrito.</p>}
            </>}
          </div>
        </aside>
      </div>
    </div>
  </>;
}
