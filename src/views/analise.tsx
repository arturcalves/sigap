import React, { useRef, useState } from 'react';
import { Sparkles, CircleCheck, CircleAlert, Check, ShieldCheck, FilePen, MessageSquareWarning, Ban } from 'lucide-react';
import { CHECK_HAB, CHECK_LEGAL, eixo, fmtBRL, fmtDate, fmtNum, notaFinal, autoChecks, pct, maskEmail } from '../lib';
import { useApp } from '../store';
import { Btn, PageHead, Empty, StatusPill, Pill, Tabs, Field, Note, Bar, Seg } from '../ui';
import { SysChips } from '../viz';
import { MediaGrid, MediaViewer } from '../media';
import { aiError, projBrief } from './detalhe';

export function Analise({ id }: { id: string }) {
  const app = useApp(); const { state, go, can, special, act, toast, inst, user } = app; const p = state.projects.find((x: any) => x.id === id);
  const [tab, setTab] = useState('resumo'); const [open, setOpen] = useState<any>(null);
  const crit = state.config.criteria; const hab = p?.status === 'habilitacao';
  const [chk, setChk] = useState<boolean[]>(() => (hab ? CHECK_HAB : CHECK_LEGAL).map(() => false)); const [notas, setNotas] = useState<any>(() => Object.fromEntries(crit.map((c: any) => [c.id, 7])));
  const [texto, setTexto] = useState(''); const [dec, setDec] = useState(hab ? 'habilitar' : 'aprovar'); const [ai, setAi] = useState<any>(null); const ctl = useRef<AbortController | null>(null);
  if (!p) return <div className="card"><Empty title="Projeto não encontrado" action={<Btn onClick={() => go('fila')}>Voltar para a fila</Btn>} /></div>;
  const I = inst(p.instId); const media = state.media.filter((m: any) => m.projectId === p.id); const checks = autoChecks(p, I, media.filter((m: any) => m.kind === 'doc').length, state.config.limiteAdm);
  const nota = notaFinal(notas, crit); const minima = state.config.notaMinima; const allChk = chk.every(Boolean); const pd = special('dados_pessoais');
  const emAnalise = ['habilitacao', 'analise'].includes(p.status) && can('analises', 'aprovar');
  const ok = dec === 'diligencia' ? texto.trim().length >= 15 : hab ? (dec === 'habilitar' ? allChk : texto.trim().length >= 15) : texto.trim().length >= 30 && (dec !== 'aprovar' || (allChk && nota >= minima));
  const label = dec === 'diligencia' ? 'Abrir diligência' : hab ? (dec === 'habilitar' ? 'Habilitar projeto' : 'Inabilitar projeto') : dec === 'aprovar' ? 'Aprovar e enviar ao banco' : 'Registrar não aprovação';
  const submit = () => {
    if (hab) act.decideHab(p.id, { checklist: chk, decisao: dec, texto: texto.trim() || 'Documentação conferida e válida.' }); else act.decideParecer(p.id, { notas, legal: chk, decisao: dec, texto: texto.trim() });
    toast(dec === 'diligencia' ? 'Diligência aberta. A instituição foi notificada.' : hab ? (dec === 'habilitar' ? 'Projeto habilitado. Segue para análise técnica.' : 'Projeto inabilitado.') : dec === 'aprovar' ? 'Parecer emitido. Projeto incluído no banco.' : 'Parecer emitido. Projeto não aprovado.');
    go(dec === 'habilitar' && hab ? 'fila/analise' : 'fila');
  };
  const preAnalise = async () => {
    setAi({ busy: true }); ctl.current = new AbortController();
    try {
      const r = await app.sample.json(`Você apoia analistas técnicos de uma plataforma do Ministério Público Federal que destina recursos de acordos a projetos sociais. Faça uma pré-análise do projeto abaixo. Você não decide: sugere, e a decisão é do analista. Seja específico e não invente dados.\n\nCritérios, com nota de 0 a 10 (aceita meio ponto):\n${crit.map((c: any) => `- ${c.id}: ${c.label}. ${c.help}`).join('\n')}\n\nResponda apenas com um JSON neste formato: {"notas":{${crit.map((c: any) => `"${c.id}":7.5`).join(',')}},"pontos_fortes":["..."],"riscos":["..."],"diligencias":["..."],"sintese":"duas frases"}. Use no máximo 3 itens por lista, em português do Brasil.\n\nProjeto:\n${projBrief(p, I)}`, { signal: ctl.current.signal });
      setAi({ data: r });
    } catch (e: any) { setAi(null); aiError(e, app); }
  };
  return <>
    <PageHead title={hab ? 'Habilitação' : 'Análise técnica e jurídica'} sub={`${p.code} · ${p.title}`} back={{ to: 'fila', label: 'Fila de trabalho' }}><StatusPill status={p.status} /></PageHead>
    <div className="analysis">
      <div className="card analysis-left">
        <div style={{ padding: '6px 12px 0' }}><Tabs tabs={[{ id: 'resumo', label: 'Projeto' }, { id: 'plano', label: 'Plano de trabalho' }, { id: 'orc', label: 'Orçamento' }, { id: 'anexos', label: 'Anexos', count: media.length }, { id: 'inst', label: 'Instituição' }]} value={tab} onChange={setTab} /></div>
        <div className="card-body stack-sm">
          {tab === 'resumo' && <><p className="prose">{p.resumo}</p><p className="prose"><b>Objetivo.</b> {p.objetivo}</p><p className="prose"><b>Público.</b> {p.publico}</p>
            <dl className="kv"><div><dt>Valor pleiteado</dt><dd className="num">{fmtBRL(p.valor)}</dd></div><div><dt>Prazo</dt><dd>{p.prazo} meses</dd></div><div><dt>Beneficiários</dt><dd className="num">{fmtNum(p.beneficiarios)}</dd></div><div><dt>Custo por beneficiário</dt><dd className="num">{p.beneficiarios ? fmtBRL(p.valor / p.beneficiarios) : '—'}</dd></div><div><dt>Eixo</dt><dd>{eixo(p.eixo).label}</dd></div><div><dt>Território</dt><dd>{p.municipios} ({p.uf})</dd></div></dl></>}
          {tab === 'plano' && <div className="dt-wrap"><table className="dt"><thead><tr><th>Meta</th><th className="right">Alvo</th><th className="right">Conclusão</th></tr></thead><tbody>{p.metas.map((m: any) => <tr key={m.id}><td className="cell-main">{m.title}</td><td className="right num nowrap">{fmtNum(m.alvo)} {m.unidade}</td><td className="right small muted nowrap">mês {m.prazoMes}</td></tr>)}</tbody></table></div>}
          {tab === 'orc' && <div className="col gap-16">{p.orcamento.map((r: any) => <div key={r.id}><div className="row between small"><span>{r.rubrica}</span><b className="num nowrap">{fmtBRL(r.valor)} · {pct(r.valor, p.valor)}%</b></div><Bar value={pct(r.valor, p.valor)} thin tone={r.rubrica === 'Custos administrativos' && pct(r.valor, p.valor) > state.config.limiteAdm ? 'danger' : 'navy'} /></div>)}</div>}
          {tab === 'anexos' && <MediaGrid items={media} onOpen={setOpen} empty={<Empty title="Nenhum anexo enviado" />} />}
          {tab === 'inst' && <><dl className="kv"><div><dt>Instituição</dt><dd>{I?.name}</dd></div><div><dt>Tipo</dt><dd>{I?.tipo}</dd></div><div><dt>Atua desde</dt><dd>{I?.fundacao}</dd></div><div><dt>CNPJ</dt><dd className="num">{I?.cnpj}</dd></div><div><dt>Responsável</dt><dd>{I?.responsavel}</dd></div><div><dt>E-mail</dt><dd>{pd ? I?.email : maskEmail(I?.email)}</dd></div></dl>
            <ul className="col gap-6">{I?.docs.map((d: any) => <li key={d.name} className="row gap-6 small">{d.ok ? <CircleCheck size={16} aria-hidden style={{ color: 'var(--ok)' }} /> : <CircleAlert size={16} aria-hidden style={{ color: 'var(--warn)' }} />}{d.name}{d.ok && d.validade ? <span className="tiny muted">· válido até {fmtDate(d.validade)}</span> : !d.ok && <span className="tiny muted">· pendente</span>}</li>)}</ul></>}
        </div>
      </div>

      <div className="analysis-right stack-sm">
        <div className="card card-pad stack-sm"><div className="row between wrap"><h3>Integrações</h3><SysChips p={p} /></div><p className="tiny muted">O processo e as movimentações são registrados nos sistemas corporativos a cada decisão. No protótipo, a integração é simulada.</p></div>
        <div className="card"><div className="card-head"><h3>Verificações automáticas</h3><span className="tab-n">{checks.filter(c => c.ok).length}/{checks.length}</span></div><ul className="list">{checks.map(c => <li key={c.label} style={{ padding: '8px 20px' }}>{c.ok ? <CircleCheck size={16} aria-hidden style={{ color: 'var(--ok)', flex: 'none' }} /> : <CircleAlert size={16} aria-hidden style={{ color: 'var(--warn)', flex: 'none' }} />}<span className="grow small">{c.label} <span className="tiny muted">· {c.detail}</span></span></li>)}</ul></div>
        {!emAnalise ? <div className="card"><Empty title={can('analises', 'aprovar') ? 'Este projeto não está em análise' : 'Seu perfil não emite pareceres'} action={<Btn onClick={() => go('projetos/' + p.id + '/analises')}>Ver análises do projeto</Btn>}>{can('analises', 'aprovar') ? 'A decisão já foi registrada ou o projeto aguarda resposta de diligência.' : 'Você pode consultar o projeto e as análises já emitidas.'}</Empty></div> : <div className="card card-pad stack-sm">
          {!hab && <>
            <div className="row between wrap"><h3>Pontuação</h3><div className="score"><b style={{ color: nota >= minima ? 'var(--ink)' : 'var(--danger)' }}>{String(nota).replace('.', ',')}</b><span className="small muted">de 10 · mínimo {String(minima).replace('.', ',')}</span></div></div>
            <div>{crit.map((c: any) => <div key={c.id} className="crit"><label htmlFor={'c_' + c.id}><b>{c.label}</b> <span className="tiny muted">peso {c.peso}</span><span className="tiny muted" style={{ display: 'block' }}>{c.help}</span></label><span className="v">{String(notas[c.id]).replace('.', ',')}</span><input id={'c_' + c.id} style={{ gridColumn: '1/-1', margin: '6px 0 2px', background: `linear-gradient(to right, var(--accent) ${notas[c.id] * 10}%, var(--sunken) ${notas[c.id] * 10}%)` }} type="range" min="0" max="10" step="0.5" value={notas[c.id]} onChange={e => setNotas({ ...notas, [c.id]: +e.target.value })} /></div>)}</div>
            {app.sample && special('ia') && <div className="stack-sm" style={{ borderTop: '1px solid var(--line)', paddingTop: 12 }}>
              <div className="row between wrap"><span className="small strong row gap-6"><Sparkles size={15} aria-hidden />Pré-análise com IA</span>{ai?.busy ? <Btn size="sm" onClick={() => ctl.current?.abort()}>Parar</Btn> : <Btn size="sm" onClick={preAnalise}>{ai?.data ? 'Gerar de novo' : 'Gerar pré-análise'}</Btn>}</div>
              {ai?.busy && <p className="small muted">Pensando… pode levar até um minuto.</p>}
              {ai?.data && <div className="note" style={{ display: 'block' }}><p className="small">{String(ai.data.sintese || '')}</p>
                {[['Pontos fortes', ai.data.pontos_fortes], ['Riscos', ai.data.riscos], ['Diligências sugeridas', ai.data.diligencias]].map(([t, l]: any) => Array.isArray(l) && l.length ? <div key={t} style={{ marginTop: 8 }}><b className="tiny">{t}</b><ul className="small" style={{ listStyle: 'disc', paddingLeft: 18 }}>{l.slice(0, 3).map((x: any, k: number) => <li key={k}>{String(x)}</li>)}</ul></div> : null)}
                <div className="row wrap" style={{ marginTop: 10 }}><Btn size="sm" onClick={() => { const n: any = { ...notas }; crit.forEach((c: any) => { const v = +ai.data.notas?.[c.id]; if (v >= 0 && v <= 10) n[c.id] = Math.round(v * 2) / 2; }); setNotas(n); toast('Notas sugeridas aplicadas. Revise antes de decidir.'); }}>Aplicar notas sugeridas</Btn><span className="tiny muted">Sugestão de apoio. A decisão é sua.</span></div></div>}
            </div>}
            <hr className="rule" />
          </>}
          <h3 className="row gap-6"><ShieldCheck size={16} aria-hidden />{hab ? 'Conformidade documental' : 'Conformidade legal'}</h3>
          <div className="col gap-6">{(hab ? CHECK_HAB : CHECK_LEGAL).map((c, k) => <label key={c} className="check"><input type="checkbox" checked={chk[k]} onChange={e => setChk(chk.map((v, j) => j === k ? e.target.checked : v))} />{c}</label>)}</div>
          <div><Btn size="sm" variant="quiet" icon={Check} onClick={() => setChk(chk.map(() => true))}>Marcar todos como conferidos</Btn></div>
          <hr className="rule" />
          <div className="field"><span className="field-l">Decisão</span><Seg value={dec} onChange={setDec} options={hab ? [{ id: 'habilitar', label: 'Habilitar', icon: Check }, { id: 'diligencia', label: 'Diligência', icon: MessageSquareWarning }, { id: 'inabilitar', label: 'Inabilitar', icon: Ban }] : [{ id: 'aprovar', label: 'Aprovar', icon: Check }, { id: 'diligencia', label: 'Diligência', icon: MessageSquareWarning }, { id: 'reprovar', label: 'Não aprovar', icon: Ban }]} /></div>
          <Field label={dec === 'diligencia' ? 'O que a instituição precisa esclarecer ou enviar' : hab ? (dec === 'habilitar' ? 'Observações (opcional)' : 'Motivo da inabilitação') : 'Parecer'} hint={dec === 'diligencia' ? `A instituição terá ${state.config.prazoDiligencia} dias para responder.` : hab ? '' : 'Mínimo de 30 caracteres. O parecer fica registrado no processo.'}><textarea className="textarea" style={{ minHeight: hab ? 80 : 130 }} value={texto} onChange={e => setTexto(e.target.value)} /></Field>
          {dec === 'habilitar' && !allChk && <Note tone="warn">Para habilitar, todos os itens de conformidade precisam estar conferidos. Se faltar algo, abra uma diligência.</Note>}
          {dec === 'aprovar' && !hab && (nota < minima || !allChk) && <Note tone="warn">{nota < minima ? `A nota está abaixo do mínimo de ${String(minima).replace('.', ',')}. ` : ''}{!allChk ? 'Há itens de conformidade legal sem conferência.' : ''}</Note>}
          <Btn variant={dec === 'inabilitar' || dec === 'reprovar' ? 'danger' : 'cta'} icon={FilePen} disabled={!ok} onClick={submit}>{label}</Btn>
          <p className="tiny muted">Assinado por {user.name}. A decisão entra na trilha de auditoria.</p>
        </div>}
      </div>
    </div>
    {open && <MediaViewer m={open} onClose={() => setOpen(null)} />}
  </>;
}
