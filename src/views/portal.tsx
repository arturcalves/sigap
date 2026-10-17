import React, { useMemo, useRef, useState } from 'react';
import { Sun, Moon, LogIn, Download, FileText, FileSpreadsheet, ArrowLeft, Landmark, MapPin, Braces, ShieldCheck } from 'lucide-react';
import { LOGO_FULL, LOGO_ICON, WORDMARK_WHITE } from '../assets';
import { UF, eixo, fmtBRL, fmtCompact, fmtDate, fmtNum, sum, chamadaStatus, CH_STATUS, EIXOS, RUBRICAS, csv, despesas, fisico, daysUntil, STATUS, APOIADOS, AUD_CONCL } from '../lib';
import { useApp, totals } from '../store';
import { Btn, Seg, Stat, Pill, StatusPill, Empty, Note, Bar, Avatar } from '../ui';
import { BrMap, MapLegend, BarList, ProjectCard, ChamadaCard, Stepper, Dual } from '../viz';
import { MediaGrid, MediaViewer } from '../media';
import { textPdf, tablePdf } from '../pdf';

export function toggleTheme() {
  const el = document.documentElement; const cur = el.getAttribute('data-theme') || (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const next = cur === 'dark' ? 'light' : 'dark'; el.setAttribute('data-theme', next); try { localStorage.setItem('sigap:theme', next); } catch { /* preferência só nesta sessão */ } return next;
}
export const ThemeBtn = ({ nav }: any) => { const [, force] = useState(0); const dark = (document.documentElement.getAttribute('data-theme') || (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')) === 'dark'; return <Btn variant={nav ? 'nav' : 'quiet'} size="sm" icon={dark ? Sun : Moon} aria-label={dark ? 'Usar tema claro' : 'Usar tema escuro'} onClick={() => { toggleTheme(); force(x => x + 1); }} />; };
export const Brand = () => <><span className="brand-tile"><img src={LOGO_ICON} alt="" /></span><img className="brand-word" src={WORDMARK_WHITE} alt="SIGAP" /></>;

export function PubShell({ children, onNav }: any) {
  const { go, user } = useApp();
  return <div className="pub" id="pub-scroll">
    <header className="pub-top"><div className="pub-top-in">
      <button className="row" style={{ border: 0, background: 'none', padding: 0 }} onClick={() => go('')} aria-label="Início do portal"><Brand /></button>
      <nav className="pub-nav" aria-label="Seções do portal">{[['chamadas', 'Chamadas'], ['mapa', 'Recursos no mapa'], ['projetos', 'Projetos apoiados'], ['dados', 'Dados abertos']].map(([id, l]) => <button key={id} onClick={() => onNav ? onNav(id) : go('')}>{l}</button>)}</nav>
      <span className="grow" /><span className="proto hide-sm">Protótipo · dados fictícios</span><ThemeBtn nav />
      <Btn variant="cta" icon={LogIn} onClick={() => go(user ? 'inicio' : 'acesso')}>{user ? 'Voltar ao sistema' : 'Acessar sistema'}</Btn>
    </div></header>
    {children}
    <footer className="pub-in"><div className="pub-foot row wrap between">
      <span>SIGAP · Sistema de Gestão de Projetos e Chamadas. Protótipo navegável; instituições, pessoas, valores e números de processo são fictícios.</span>
      <span>Mapa: @svg-maps/brazil, CC BY 4.0.</span>
    </div></footer>
  </div>;
}

export function PortalHome() {
  const { state, go, exportFile, inst, instr } = useApp(); const [uf, setUf] = useState(''); const [tab, setTab] = useState('aberta');
  const t = totals(state); const apoiados = state.projects.filter((p: any) => p.selecao && p.publico_portal);
  const byUf = useMemo(() => { const o: Record<string, number> = {}; apoiados.forEach((p: any) => { o[p.uf] = (o[p.uf] || 0) + p.selecao.valor; }); return o; }, [state.projects]);
  const byEixo = EIXOS.map(e => ({ label: e.label, value: sum(apoiados.filter((p: any) => p.eixo === e.id), (p: any) => p.selecao.valor) })).filter(x => x.value).sort((a, b) => b.value - a.value);
  const ch = state.chamadas.filter((c: any) => chamadaStatus(c) === tab);
  const nav = (id: string) => document.getElementById('sec-' + id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const ufProj = uf ? state.projects.filter((p: any) => p.uf === uf && (APOIADOS.includes(p.status) || p.status === 'banco')) : [];
  const rowsDest = apoiados.map((p: any) => { const i = instr(p.selecao.instrumentoId); return [p.code, p.title, inst(p.instId)?.name, p.uf, p.unidade, eixo(p.eixo).label, i?.numero, p.selecao.valor, fmtDate(p.selecao.date), STATUS[p.status].label]; });
  const head = ['Código', 'Projeto', 'Instituição', 'UF', 'Unidade', 'Eixo', 'Instrumento de origem', 'Valor destinado (R$)', 'Data', 'Situação'];
  const openData = { geradoEm: new Date().toISOString(), aviso: 'Dados fictícios de demonstração', destinacoes: apoiados.map((p: any) => ({ codigo: p.code, projeto: p.title, instituicao: inst(p.instId)?.name, uf: p.uf, unidade: p.unidade, eixo: eixo(p.eixo).label, instrumento: instr(p.selecao.instrumentoId)?.numero, valorDestinado: p.selecao.valor, valorComprovado: despesas(p).aprovado, execucaoFisicaPct: fisico(p), situacao: STATUS[p.status].label })) };
  return <PubShell onNav={nav}>
    <div className="pub-in">
      <section className="pub-hero">
        <div>
          <span className="logo-plate"><img src={LOGO_FULL} alt="SIGAP, Sistema de Gestão de Projetos e Chamadas, Ministério Público Federal" /></span>
          <h1 style={{ marginTop: 22 }}>Do edital ao resultado, cada recurso à vista</h1>
          <p className="lead">O SIGAP reúne as chamadas de projetos, o banco de projetos habilitados e a destinação de recursos de acordos e termos de ajustamento. A execução e a prestação de contas ficam abertas para consulta.</p>
          <div className="row wrap" style={{ marginTop: 20 }}><Btn variant="cta" onClick={() => nav('chamadas')}>Ver chamadas abertas</Btn><Btn onClick={() => nav('projetos')}>Conhecer os projetos apoiados</Btn></div>
        </div>
        <div className="mapbox" id="sec-mapa">
          <div className="row between wrap" style={{ marginBottom: 6 }}><h2>Onde os recursos chegam</h2><MapLegend /></div>
          <BrMap values={byUf} sel={uf} onSel={setUf} />
          <div className="map-info">
            {uf ? <><div><div className="tiny muted">{UF[uf]} · PR-{uf}</div><b className="num" style={{ fontSize: '1.15rem' }}>{fmtCompact(byUf[uf] || 0)}</b> <span className="small muted">destinados</span></div>
              <div className="grow col gap-4">{ufProj.length ? ufProj.slice(0, 4).map((p: any) => <button key={p.id} className="linkbtn small truncate" onClick={() => go(p.selecao ? 'p/' + p.id : '')}>{p.title} <span className="muted" style={{ fontWeight: 400 }}>· {STATUS[p.status].label.toLowerCase()}</span></button>) : <span className="small muted">Nenhum projeto apoiado ou no banco neste estado.</span>}</div></>
              : <span className="small muted">Selecione um estado para ver a unidade do MPF, os valores e os projetos. São {t.ufs} estados com recursos destinados.</span>}
          </div>
        </div>
      </section>
      <div className="stats">
        <Stat v={fmtCompact(t.destinado)} l="Recursos destinados a projetos" /><Stat v={fmtCompact(t.comprovado)} l="Execução já comprovada" d={<Bar value={t.comprovado / (t.destinado || 1) * 100} thin tone="ok" />} />
        <Stat v={t.apoiados} l="Projetos apoiados" /><Stat v={t.banco} l="Projetos habilitados no banco" /><Stat v={fmtNum(t.benef)} l="Pessoas beneficiadas (previsão)" />
      </div>

      <section className="pub-sec" id="sec-chamadas">
        <div className="pub-sec-head"><div className="grow"><h2>Chamadas de projetos</h2><p>Editais para instituições que queiram inscrever projetos.</p></div>
          <Seg value={tab} onChange={setTab} options={[{ id: 'aberta', label: 'Abertas' }, { id: 'breve', label: 'Em breve' }, { id: 'encerrada', label: 'Encerradas' }]} /></div>
        {ch.length ? <div className="auto-cards">{ch.map((c: any) => <ChamadaCard key={c.id} c={c} n={state.projects.filter((p: any) => p.chamadaId === c.id && p.status !== 'rascunho').length} onOpen={() => go('chamada/' + c.id)} />)}</div> : <div className="card"><Empty title="Nenhuma chamada nesta situação">Consulte as outras abas ou volte em breve.</Empty></div>}
      </section>

      <section className="pub-sec" id="sec-projetos">
        <div className="pub-sec-head"><div className="grow"><h2>Projetos apoiados</h2><p>Cada projeto mostra de qual instrumento veio o recurso e como está a execução.</p></div></div>
        <div className="split">
          <div className="auto-cards" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))' }}>{apoiados.map((p: any) => <ProjectCard key={p.id} p={p} to={'p/' + p.id} />)}</div>
          <div className="card card-pad"><h3 style={{ marginBottom: 14 }}>Destinação por eixo temático</h3><BarList items={byEixo} /></div>
        </div>
      </section>

      <section className="pub-sec" id="sec-dados">
        <div className="pub-sec-head"><div className="grow"><h2>Dados abertos</h2><p>Baixe as destinações em formato aberto para conferir, cruzar e reutilizar.</p></div></div>
        <div className="card card-pad row wrap">
          <Btn icon={FileSpreadsheet} onClick={() => { const x = csv([head, ...rowsDest]); exportFile('sigap-destinacoes.csv', x, x); }}>Destinações (CSV)</Btn>
          <Btn icon={Braces} onClick={() => { const x = JSON.stringify(openData, null, 2); exportFile('sigap-destinacoes.json', x, x); }}>Destinações (JSON)</Btn>
          <Btn icon={FileText} onClick={() => exportFile('sigap-destinacoes.pdf', tablePdf({ title: 'Destinações de recursos', subtitle: 'Portal público', columns: [{ label: 'Código', w: 1.3 }, { label: 'Projeto', w: 3.2 }, { label: 'Instituição', w: 2.2 }, { label: 'UF', w: 0.5 }, { label: 'Instrumento', w: 2 }, { label: 'Valor', w: 1.2, align: 'right' }], rows: apoiados.map((p: any) => [p.code, p.title, inst(p.instId)?.name, p.uf, instr(p.selecao.instrumentoId)?.numero, fmtBRL(p.selecao.valor)]) }))}>Relatório (PDF)</Btn>
          <span className="small muted grow">{apoiados.length} destinações publicadas.</span>
        </div>
      </section>
    </div>
  </PubShell>;
}

/* Corpo do edital: usado no portal e dentro do sistema */
export function ChamadaBody({ c }: { c: any }) {
  const { state, go, user, can, exportFile, scoped, role } = useApp(); const st = chamadaStatus(c); const enc = new Date(c.encerramento).getTime(); const D = 86400000;
  const marcos = [['Publicação do edital', c.abertura], ['Fim das inscrições', c.encerramento], ['Resultado da habilitação', new Date(enc + 15 * D).toISOString()], ['Resultado da análise técnica', new Date(enc + 45 * D).toISOString()], ['Projetos no banco', new Date(enc + 60 * D).toISOString()]];
  const nowIdx = marcos.findIndex(m => new Date(m[1]).getTime() > Date.now());
  const inscritos = state.projects.filter((p: any) => p.chamadaId === c.id && p.status !== 'rascunho');
  const meus = user ? scoped.filter((p: any) => p.chamadaId === c.id && (p.status !== 'rascunho' || role.scope === 'proprio')) : [];
  const baixar = (a: any) => a.ext === 'csv' ? (() => { const x = csv([['Rubrica', 'Descrição', 'Valor (R$)'], ...RUBRICAS.map(r => [r, '', ''])]); exportFile(`${c.code.replace(/[ /]/g, '-')}-planilha-orcamento.csv`, x, x); })()
    : exportFile(`${c.code.replace(/[ /]/g, '-')}-${a.title.toLowerCase().replace(/\s+/g, '-')}.pdf`, textPdf({ title: `${c.code} · ${a.title}`, subtitle: c.title, body: a.title.startsWith('Edital') ? `Objeto\n${c.desc}\n\nQuem pode participar\n${c.requisitos.map((r: string) => '- ' + r).join('\n')}\n\nValores\nValor previsto para a chamada: ${fmtBRL(c.valor)}. Teto por projeto: ${fmtBRL(c.teto)}.\n\nCronograma\n${marcos.map(m => `- ${m[0]}: ${fmtDate(m[1])}`).join('\n')}\n\nComo se inscrever\nA inscrição é feita no SIGAP, em cinco etapas: identificação, dados do projeto, plano de trabalho, orçamento e anexos.\n\nDocumento de demonstração gerado pelo protótipo.` : `Identificação do projeto\nTítulo, instituição proponente, eixo temático e território.\n\nObjetivo\nDescreva o problema e o resultado esperado.\n\nMetas\n- Meta, indicador, alvo e prazo.\n\nCronograma\n- Atividades por mês.\n\nEquipe\n- Funções e dedicação.\n\nDocumento de demonstração gerado pelo protótipo.` }));
  return <div className="split">
    <div className="stack">
      <div className="card card-pad stack-sm">
        <div className="row wrap"><Pill tone={CH_STATUS[st].tone}>{CH_STATUS[st].label}</Pill><span className="tag"><Landmark size={14} aria-hidden />{c.unidade}</span><span className="tag">{eixo(c.eixo).label}</span><span className="tag"><MapPin size={14} aria-hidden />{c.ufs.includes('BR') ? 'Abrangência nacional' : c.ufs.map((u: string) => UF[u]).join(', ')}</span></div>
        <h2 style={{ fontSize: '1.3rem' }}>Edital</h2>
        <p className="prose">{c.desc}</p>
        <div><h3 style={{ margin: '6px 0 8px' }}>Quem pode participar</h3><ul className="col gap-6">{c.requisitos.map((r: string) => <li key={r} className="row top gap-6"><ShieldCheck size={16} aria-hidden style={{ color: 'var(--ok)', marginTop: 3, flex: 'none' }} /><span>{r}</span></li>)}</ul></div>
      </div>
      <div className="card card-pad"><h3 style={{ marginBottom: 14 }}>Cronograma</h3>
        <div className="timeline-h">{marcos.map((m, i) => <div key={m[0]} className={`tlh ${nowIdx === -1 || i < nowIdx ? 'is-past' : i === nowIdx ? 'is-now' : ''}`}><b className="small">{m[0]}</b><div className="small muted num">{fmtDate(m[1])}</div></div>)}</div>
      </div>
      {can('projetos', 'ver') && user && <div className="card"><div className="card-head"><h3>{role.scope === 'proprio' ? 'Projetos da sua instituição nesta chamada' : 'Projetos inscritos nesta chamada'}</h3><span className="tab-n">{meus.length}</span></div>
        {meus.length ? <div>{meus.map((p: any) => <button key={p.id} className="list-btn" onClick={() => go('projetos/' + p.id)}><span className="grow"><b className="cell-main">{p.title}</b><span className="cell-sub"> · {p.code}</span></span><StatusPill status={p.status} /></button>)}</div> : <Empty title="Sem inscrições até agora" />}</div>}
    </div>
    <div className="stack">
      <div className="card card-pad stack-sm">
        <dl className="kv" style={{ gridTemplateColumns: '1fr 1fr' }}><div><dt>Valor previsto</dt><dd className="num">{fmtBRL(c.valor)}</dd></div><div><dt>Teto por projeto</dt><dd className="num">{fmtBRL(c.teto)}</dd></div><div><dt>Inscrições até</dt><dd className="num">{fmtDate(c.encerramento)}</dd></div><div><dt>Inscritos</dt><dd className="num">{inscritos.length}</dd></div></dl>
        {st === 'aberta' ? <>
          <Btn variant="cta" style={{ width: '100%' }} onClick={() => go(user && can('projetos', 'criar') ? 'inscricao/' + c.id : 'acesso')} disabled={!!user && !can('projetos', 'criar')}>Inscrever projeto</Btn>
          <p className="small muted">{user ? (can('projetos', 'criar') ? `Faltam ${daysUntil(c.encerramento)} dias para o fim das inscrições.` : 'Seu perfil não inscreve projetos. A inscrição é feita pela instituição proponente.') : 'Você entra com a conta da instituição e preenche a inscrição em cinco etapas. O rascunho fica salvo.'}</p></>
          : st === 'breve' ? <Note>As inscrições abrem em {fmtDate(c.abertura)}.</Note> : <Note>Inscrições encerradas em {fmtDate(c.encerramento)}.</Note>}
        {!user && <Btn style={{ width: '100%' }} icon={LogIn} onClick={() => go('acesso')}>Acessar sistema</Btn>}
      </div>
      <div className="card"><div className="card-head"><h3>Anexos</h3></div>
        <ul className="list">{c.anexos.map((a: any) => <li key={a.title}><span className="ico-badge">{a.ext === 'csv' ? <FileSpreadsheet size={17} aria-hidden /> : <FileText size={17} aria-hidden />}</span><span className="grow"><b className="small">{a.title}</b><div className="tiny muted">{a.ext.toUpperCase()}</div></span><Btn size="sm" icon={Download} onClick={() => baixar(a)} aria-label={`Baixar ${a.title}`}>Baixar</Btn></li>)}</ul>
      </div>
    </div>
  </div>;
}
export function PubChamada({ id }: { id: string }) {
  const { state, go } = useApp(); const c = state.chamadas.find((x: any) => x.id === id);
  return <PubShell><div className="pub-in" style={{ paddingTop: 28 }}>
    <button className="crumb" onClick={() => go('')}><ArrowLeft size={15} aria-hidden />Portal</button>
    {c ? <><div className="page-head"><div><span className="small muted strong">{c.code}</span><h1>{c.title}</h1></div></div><ChamadaBody c={c} /></> : <div className="card"><Empty title="Chamada não encontrada" action={<Btn onClick={() => go('')}>Voltar ao portal</Btn>} /></div>}
  </div></PubShell>;
}
export function PubProject({ id }: { id: string }) {
  const { state, go, inst, instr } = useApp(); const p = state.projects.find((x: any) => x.id === id); const [open, setOpen] = useState<any>(null);
  if (!p || !p.publico_portal) return <PubShell><div className="pub-in" style={{ paddingTop: 28 }}><div className="card"><Empty title="Projeto não publicado" action={<Btn onClick={() => go('')}>Voltar ao portal</Btn>}>Este projeto ainda não está no portal público.</Empty></div></div></PubShell>;
  const i = instr(p.selecao?.instrumentoId); const d = despesas(p); const media = state.media.filter((m: any) => m.projectId === p.id && m.visibility === 'publico');
  const evs = state.audit.filter((e: any) => e.entityId === p.id && ['Inscrição enviada', 'Projeto habilitado', 'Parecer técnico emitido', 'Projeto selecionado', 'Seleção homologada', 'Relatório atestado', 'Prestação de contas aprovada', 'Auditoria concluída'].includes(e.action)).reverse();
  return <PubShell><div className="pub-in" style={{ paddingTop: 28 }}>
    <button className="crumb" onClick={() => go('')}><ArrowLeft size={15} aria-hidden />Portal</button>
    <div className="page-head"><div><span className="small muted strong num">{p.code}</span><h1>{p.title}</h1><p>{inst(p.instId)?.name} · {p.municipios} ({p.uf})</p></div><StatusPill status={p.status} /></div>
    <div className="stack">
      <div className="card card-pad"><Stepper p={p} /></div>
      <div className="stats"><Stat v={fmtBRL(p.selecao.valor)} l="Valor destinado" d={i?.numero} /><Stat v={fmtBRL(d.aprovado)} l="Despesas comprovadas" /><Stat v={fisico(p) + '%'} l="Execução física" /><Stat v={fmtNum(p.beneficiarios)} l="Pessoas beneficiadas (previsão)" /></div>
      <div className="split">
        <div className="stack">
          <div className="card card-pad stack-sm"><h3>O projeto</h3><p className="prose">{p.resumo}</p><p className="prose"><b>Objetivo.</b> {p.objetivo}</p><p className="prose"><b>Público.</b> {p.publico}</p></div>
          <div className="card card-pad"><h3 style={{ marginBottom: 12 }}>Metas</h3><div className="col gap-16">{p.metas.map((m: any) => <div key={m.id}><div className="row between small"><span>{m.title}</span><b className="num nowrap">{fmtNum(m.realizado)} de {fmtNum(m.alvo)} {m.unidade}</b></div><Bar value={m.realizado / m.alvo * 100} thin tone={m.realizado >= m.alvo ? 'ok' : ''} /></div>)}</div></div>
          <div className="card card-pad"><h3 style={{ marginBottom: 12 }}>Imagens, vídeos e links</h3><MediaGrid items={media} onOpen={setOpen} empty={<Empty title="Sem mídias públicas por enquanto" />} /></div>
        </div>
        <div className="stack">
          <div className="card card-pad stack-sm"><h3>Origem do recurso</h3><p className="small"><b>{i?.numero}</b> · {i?.unidade}</p><p className="small muted">{i?.objeto}</p><div><div className="tiny muted">Justificativa da destinação</div><p className="small">{p.selecao.justificativa}</p></div><Dual p={p} /></div>
          {(p.contas?.aprovadaEm || p.auditoria) && <div className="card card-pad stack-sm"><h3>Prestação de contas e auditoria</h3>{p.contas?.aprovadaEm && <p className="small"><b>Contas aprovadas</b> em {fmtDate(p.contas.aprovadaEm)}. {fmtBRL(d.aprovado)} comprovados{d.glosado ? `, ${fmtBRL(d.glosado)} glosados` : ''}.</p>}{p.auditoria ? <><Pill tone={AUD_CONCL[p.auditoria.conclusao].tone}>Auditoria: {AUD_CONCL[p.auditoria.conclusao].label}</Pill><p className="small muted">{p.auditoria.texto}</p></> : <Pill tone="warn">Auditoria de conformidade em andamento</Pill>}</div>}
          <div className="card card-pad"><h3 style={{ marginBottom: 12 }}>Linha do tempo</h3><div className="timeline">{evs.map((e: any) => <div key={e.seq} className="tl"><b className="small">{e.action}</b><div className="tiny muted">{fmtDate(e.ts)}</div></div>)}</div></div>
        </div>
      </div>
    </div>
    {open && <MediaViewer m={open} onClose={() => setOpen(null)} />}
  </div></PubShell>;
}

export function Login() {
  const { state, act, go } = useApp(); const personas = state.users.filter((u: any) => u.persona && u.active);
  return <div className="pub"><div className="login">
    <div className="login-brand">
      <div className="row"><Brand /></div>
      <h1>Sistema de Gestão de Projetos e Chamadas</h1>
      <p>Chamadas, banco de projetos, análise técnica, destinação de recursos, monitoramento e prestação de contas em um só fluxo, com trilha de auditoria.</p>
      <div className="row wrap"><Btn variant="nav" icon={ArrowLeft} onClick={() => go('')}>Portal público</Btn><ThemeBtn nav /></div>
    </div>
    <div className="login-main">
      <div><h2 style={{ fontSize: '1.35rem' }}>Escolha um perfil para explorar</h2><p className="muted" style={{ marginTop: 4 }}>Cada perfil vê telas e ações diferentes, conforme as permissões. Você pode trocar a qualquer momento pelo menu do usuário.</p></div>
      <div className="col">{personas.map((u: any) => { const r = state.roles.find((x: any) => x.id === u.roleId); return <button key={u.id} className="persona" onClick={() => { act.login(u.id); go('inicio'); }}>
        <Avatar name={u.name} className="lg" /><span className="grow"><b>{u.name} <span className="muted" style={{ fontWeight: 400 }}>· {u.title}, {u.org}</span></b><span className="small muted">{u.persona}</span></span><Pill tone="navy">{r?.name}</Pill></button>; })}</div>
      <details className="card" style={{ padding: '12px 16px' }}>
        <summary className="small strong" style={{ cursor: 'pointer' }}>Roteiro para percorrer o ciclo completo</summary>
        <ol className="col gap-6 small" style={{ marginTop: 10, listStyle: 'decimal', paddingLeft: 20 }}>
          <li><b>Marina, proponente:</b> inscreva um projeto em Editais e chamadas e responda a diligência pendente.</li>
          <li><b>Rafael, analista:</b> na Fila de trabalho, avalie a habilitação e emita o parecer técnico.</li>
          <li><b>Helena, procuradora:</b> no Banco de projetos, julgue um projeto e destine o recurso de um TAC.</li>
          <li><b>Cecília, gestora:</b> homologue a seleção na Fila de trabalho.</li>
          <li><b>Marina:</b> atualize metas, lance despesas e envie um relatório com evidências.</li>
          <li><b>Rafael:</b> ateste o relatório e analise a prestação de contas.</li>
          <li><b>Otávio, auditoria:</b> verifique a integridade da trilha. <b>Tiago, administrador:</b> ajuste perfis e permissões.</li>
        </ol>
      </details>
      <Note>Ambiente de demonstração. Em produção, proponentes entram com gov.br e membros e servidores, com a conta institucional.</Note>
    </div>
  </div></div>;
}
