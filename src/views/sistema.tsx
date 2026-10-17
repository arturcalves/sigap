import React, { useEffect, useState } from 'react';
import { Braces, RotateCcw, Check, Plus, Send, Trash2 } from 'lucide-react';
import { STATUS, sum } from '../lib';
import { useApp } from '../store';
import { Btn, PageHead, Pill, StatusPill, Field, Note, Bar, Switch, Seg, Confirm, Stat } from '../ui';
import { Stepper, ProjectCard, ChamadaCard, SysChips } from '../viz';
import { LOGO_FULL } from '../assets';
import { toggleTheme } from './portal';

const TOK: any[] = [
  ['Marca', [['--primary', 'Primária', 'Navegação, cabeçalhos e ações principais'], ['--accent', 'Acento', 'CTA, progresso e links ativos'], ['--accent-hi', 'Acento claro', 'Realce e foco do CTA'], ['--nav-bg', 'Barra de navegação', 'Menu lateral e topo do portal']]],
  ['Situações', [['--ok-fill', 'Esmeralda', 'Aprovado, vigente'], ['--warn-fill', 'Âmbar', 'Em análise, pendência'], ['--danger-fill', 'Carmim', 'Rejeitado, prazo vencido'], ['--accent-soft', 'Informação', 'No banco, selecionado']]],
  ['Superfícies e texto', [['--bg', 'Fundo', 'Fundo das telas'], ['--surface', 'Cartão', 'Cartões, tabelas e modais'], ['--surface-2', 'Apoio', 'Áreas secundárias'], ['--line', 'Divisória', 'Bordas e linhas'], ['--ink', 'Texto', 'Títulos e corpo'], ['--muted', 'Texto de apoio', 'Legendas e metadados']]],
];
const ALL = ['--bg', '--surface', '--surface-2', '--hover', '--sunken', '--line', '--line-2', '--ink', '--ink-2', '--muted', '--primary', '--on-primary', '--primary-soft', '--accent', '--accent-hi', '--on-accent', '--accent-ink', '--accent-soft', '--ok', '--ok-fill', '--ok-soft', '--warn', '--warn-fill', '--warn-soft', '--danger', '--danger-fill', '--danger-soft', '--nav-bg', '--focus', '--r-ctl', '--r-card', '--r-pop'];
const read = (n: string) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const curTheme = () => document.documentElement.getAttribute('data-theme') || (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
function bothThemes() { const el = document.documentElement; const prev = el.getAttribute('data-theme'); const out: any = {}; for (const t of ['light', 'dark']) { el.setAttribute('data-theme', t); out[t] = Object.fromEntries(ALL.map(n => [n.slice(2), read(n)])); } if (prev) el.setAttribute('data-theme', prev); else el.removeAttribute('data-theme'); return out; }

export function DesignSystem() {
  const { state, exportFile } = useApp(); const [, tick] = useState(0); const [sw, setSw] = useState(true); const theme = curTheme();
  useEffect(() => { const mo = new MutationObserver(() => tick(x => x + 1)); mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] }); return () => mo.disconnect(); }, []);
  const p = state.projects.find((x: any) => x.status === 'execucao') || state.projects[0]; const b = state.projects.find((x: any) => x.status === 'banco') || p; const c = state.chamadas[0];
  const css = `:root {\n${ALL.map(n => `  ${n}: ${read(n)};`).join('\n')}\n}`;
  return <>
    <PageHead title="Design system" sub="Fonte única de tokens e componentes do SIGAP para design e desenvolvimento. Esta página usa os mesmos estilos do sistema: o que aparece aqui é o que está em produção no protótipo.">
      <Seg value={theme} onChange={(t: string) => { if (t !== theme) toggleTheme(); tick(x => x + 1); }} options={[{ id: 'light', label: 'Claro' }, { id: 'dark', label: 'Escuro' }]} />
      <Btn icon={Braces} onClick={() => { const x = JSON.stringify({ nome: 'SIGAP', fonte: 'Public Sans', temas: bothThemes() }, null, 2); exportFile('sigap-tokens.json', x, x); }}>Baixar tokens (JSON)</Btn>
    </PageHead>
    <div className="stack">
      <div className="card card-pad split" style={{ alignItems: 'center' }}>
        <div className="stack-sm"><h2>Princípios</h2><ul className="col gap-6 prose">{['Um botão ciano por tela: a ação que faz o projeto avançar.', 'Situação sempre com texto e ícone, nunca só com cor.', 'Dados densos com números tabulares e hierarquia por peso, sem caixa alta.', 'Azul profundo para navegação; superfícies claras para leitura longa.', 'Tudo o que muda um registro aparece na trilha de auditoria.'].map(x => <li key={x} className="row top gap-6"><Check size={16} aria-hidden style={{ color: 'var(--accent-ink)', marginTop: 4, flex: 'none' }} /><span>{x}</span></li>)}</ul></div>
        <div className="center"><span className="logo-plate"><img src={LOGO_FULL} alt="Logo do SIGAP" style={{ width: 260 }} /></span><p className="tiny muted" style={{ marginTop: 8 }}>A marca sempre sobre fundo branco. No menu, ícone em placa branca e nome em branco.</p></div>
      </div>

      <div className="card card-pad stack"><h2>Cores</h2>{TOK.map(([g, items]: any) => <div key={g}><h3 style={{ marginBottom: 10 }}>{g}</h3><div className="swatches">{items.map(([n, l, d]: any) => <div key={n} className="swatch"><i style={{ background: `var(${n})` }} /><div><b>{l}</b><span className="mono muted">{read(n)}</span><div className="tiny muted">{d}</div><div className="mono muted">{n}</div></div></div>)}</div></div>)}</div>

      <div className="card card-pad"><h2 style={{ marginBottom: 6 }}>Tipografia</h2><p className="small muted" style={{ marginBottom: 12 }}>Public Sans em pesos de 400 a 750. Números tabulares em tabelas e valores.</p>
        {[['Título de página', <h1>Banco de projetos</h1>, '25.6 px · 700'], ['Título de seção', <h2>Execução física e financeira</h2>, '18.4 px · 650'], ['Título de cartão', <h3>Verificações automáticas</h3>, '15.6 px · 650'], ['Corpo', <p>O projeto responde a um problema bem delimitado e apresenta metas mensuráveis.</p>, '15 px · 400 · 1.5'], ['Apoio', <p className="small muted">SIGAP-2026-0003 · Instituto Raízes do Vale</p>, '13 px · 400'], ['Rótulo de campo', <span className="field-l">Valor a destinar (R$)</span>, '13 px · 600'], ['Valores', <b className="num" style={{ fontSize: '1.55rem', letterSpacing: '-.02em' }}>R$ 1.280.000</b>, '24.8 px · 700 · tabular']].map(([l, el, spec]: any) => <div key={l} className="type-row"><div><b className="small">{l}</b><div className="mono muted">{spec}</div></div><div>{el}</div></div>)}</div>

      <div className="card card-pad stack"><h2>Componentes</h2>
        <div><h3 style={{ marginBottom: 10 }}>Botões</h3><div className="ds-demo"><Btn variant="cta" icon={Send}>Enviar inscrição</Btn><Btn variant="primary" icon={Plus}>Nova chamada</Btn><Btn>Ver detalhes</Btn><Btn variant="quiet">Cancelar</Btn><Btn variant="danger" icon={Trash2}>Excluir</Btn><Btn variant="ok" size="sm" icon={Check}>Atestar</Btn><Btn size="sm">Pequeno</Btn><Btn disabled>Desabilitado</Btn></div><p className="tiny muted" style={{ marginTop: 8 }}>CTA (ciano): avanço no ciclo. Primário (azul profundo): ação principal da tela. Neutro: ações secundárias.</p></div>
        <div><h3 style={{ marginBottom: 10 }}>Situações do projeto</h3><div className="ds-demo">{Object.keys(STATUS).map(s => <StatusPill key={s} status={s} />)}</div></div>
        <div><h3 style={{ marginBottom: 10 }}>Indicadores de integração</h3><div className="ds-demo"><SysChips p={p} /><SysChips p={{ sei: 'SEI 2026.004718', status: 'analise' }} /></div></div>
        <div><h3 style={{ marginBottom: 10 }}>Linha do tempo do ciclo de vida</h3><Stepper p={p} /><p className="tiny muted" style={{ marginTop: 8 }}>Etapas concluídas em azul profundo; a etapa atual leva a seta da marca.</p></div>
        <div className="split even"><div><h3 style={{ marginBottom: 10 }}>Campos</h3><div className="col gap-16"><Field label="Título do projeto" hint="Texto de ajuda fica abaixo do campo."><input className="input" defaultValue="Viveiros comunitários do Rio Doce" /></Field><Field label="Eixo temático"><select className="select"><option>Meio ambiente (4ª CCR)</option></select></Field><label className="row gap-6 small"><Switch on={sw} onChange={setSw} label="Exemplo de chave" />Publicar no portal</label></div></div>
          <div><h3 style={{ marginBottom: 10 }}>Avisos e progresso</h3><div className="col"><Note>Informação de contexto para a tarefa.</Note><Note tone="ok">Cadeia íntegra. 138 registros conferidos.</Note><Note tone="warn">Diligência com prazo em 4 dias.</Note><Note tone="danger">Prazo vencido. A análise está parada.</Note><Bar value={62} /><Bar value={48} tone="navy" /><Bar value={88} tone="ok" /></div></div></div>
        <div><h3 style={{ marginBottom: 10 }}>Cartões de projeto e de chamada</h3><div className="auto-cards"><ProjectCard p={p} /><ProjectCard p={b} match={86} /><ChamadaCard c={c} n={3} onOpen={() => { }} /></div></div>
        <div><h3 style={{ marginBottom: 10 }}>Indicadores</h3><div className="stats"><Stat v="R$ 5,49 mi" l="Destinado a projetos" d="6 projetos em 5 estados" /><Stat v="38%" l="Execução física média" d={<Bar value={38} thin tone="navy" />} /><Stat v="5" l="Projetos no banco" /></div></div>
      </div>

      <div className="card card-pad stack-sm"><h2>Forma e espaçamento</h2>
        <div className="ds-demo">{[['6 px', 'Controles', 6], ['10 px', 'Cartões', 10], ['14 px', 'Modais', 14], ['999 px', 'Situações', 999]].map(([v, l, r]: any) => <div key={l} className="center"><div style={{ width: 86, height: 54, border: '2px solid var(--accent)', borderRadius: r, background: 'var(--accent-soft)' }} /><b className="small">{l}</b><div className="mono muted">{v}</div></div>)}</div>
        <div className="ds-demo" style={{ alignItems: 'flex-end' }}>{[4, 8, 12, 16, 20, 28].map(s => <div key={s} className="center"><div style={{ width: s, height: s, background: 'var(--primary)', borderRadius: 2, margin: '0 auto 4px' }} /><span className="mono muted">{s}</span></div>)}<span className="small muted">Escala de espaçamento em pixels.</span></div>
      </div>
      <div className="card card-pad stack-sm"><h2>Tokens em CSS ({theme === 'dark' ? 'modo escuro' : 'modo claro'})</h2><pre className="docprev" style={{ background: 'var(--sunken)', borderRadius: 8, maxHeight: 280 }}>{css}</pre></div>
    </div>
  </>;
}

export function Config() {
  const { state, can, act, toast } = useApp(); const edit = can('config', 'editar'); const [crit, setCrit] = useState<any[]>(state.config.criteria); const [c, setC] = useState<any>({ notaMinima: state.config.notaMinima, limiteAdm: state.config.limiteAdm, prazoDiligencia: state.config.prazoDiligencia }); const [reset, setReset] = useState(false);
  const total = sum(crit, x => +x.peso); const theme = curTheme(); const [, tick] = useState(0);
  return <>
    <PageHead title="Configurações" sub="Regras que valem para todas as análises e preferências deste navegador." />
    <div className="split even">
      <div className="card"><div className="card-head"><h3>Critérios do parecer técnico</h3><Pill tone={total === 100 ? 'ok' : 'danger'}>Soma dos pesos: {total}</Pill></div><div className="card-body stack-sm">
        {crit.map((x, i) => <div key={x.id} className="row"><span className="grow small"><b>{x.label}</b><div className="tiny muted">{x.help}</div></span><input className="input input-sm num" style={{ width: 76 }} type="number" min="0" max="100" disabled={!edit} value={x.peso} aria-label={`Peso de ${x.label}`} onChange={e => setCrit(crit.map((y, j) => j === i ? { ...y, peso: +e.target.value } : y))} /></div>)}
        {total !== 100 && <Note tone="danger">Os pesos precisam somar 100. Faltam ou sobram {Math.abs(100 - total)} pontos.</Note>}
        {edit && <div><Btn variant="primary" disabled={total !== 100} onClick={() => { act.setConfig({ criteria: crit }); toast('Critérios salvos.'); }}>Salvar critérios</Btn></div>}
      </div></div>
      <div className="stack">
        <div className="card"><div className="card-head"><h3>Regras de análise</h3></div><div className="card-body stack-sm"><div className="form-grid">
          <Field label="Nota mínima para aprovação" hint="De 0 a 10."><input className="input num" type="number" min="0" max="10" step="0.5" disabled={!edit} value={c.notaMinima} onChange={e => setC({ ...c, notaMinima: +e.target.value })} /></Field>
          <Field label="Limite de custos administrativos (%)"><input className="input num" type="number" min="0" max="100" disabled={!edit} value={c.limiteAdm} onChange={e => setC({ ...c, limiteAdm: +e.target.value })} /></Field>
          <Field label="Prazo para responder diligência (dias)"><input className="input num" type="number" min="1" max="90" disabled={!edit} value={c.prazoDiligencia} onChange={e => setC({ ...c, prazoDiligencia: +e.target.value })} /></Field></div>
          {edit && <div><Btn variant="primary" onClick={() => { act.setConfig(c); toast('Regras salvas.'); }}>Salvar regras</Btn></div>}</div></div>
        <div className="card card-pad stack-sm"><h3>Aparência</h3><Seg value={theme} onChange={(t: string) => { if (t !== theme) toggleTheme(); tick(x => x + 1); }} options={[{ id: 'light', label: 'Claro' }, { id: 'dark', label: 'Escuro' }]} /></div>
        <div className="card card-pad stack-sm"><h3>Dados de demonstração</h3><p className="small muted">Tudo o que você altera fica salvo neste navegador. Restaurar apaga as alterações e volta ao conjunto inicial.</p><div><Btn icon={RotateCcw} onClick={() => setReset(true)}>Restaurar dados de demonstração</Btn></div></div>
      </div>
    </div>
    {reset && <Confirm title="Restaurar dados de demonstração?" cta="Restaurar dados" variant="danger" onConfirm={() => { act.resetDemo(); toast('Dados de demonstração restaurados.'); }} onClose={() => setReset(false)}><p>Projetos, pareceres, destinações, mídias e perfis criados neste navegador serão apagados.</p></Confirm>}
  </>;
}
