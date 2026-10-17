import React, { useMemo, useState } from 'react';
import { Plus, Search, ShieldCheck, ShieldAlert, Fingerprint, Lock, UserPlus, Trash2, LogIn, RotateCcw, FlaskConical } from 'lucide-react';
import { MODULES, ACTIONS, SPECIALS, SCOPES, fmtDateTime, maskEmail, norm, csv } from '../lib';
import { useApp, verifyChain } from '../store';
import { Btn, PageHead, Empty, Pill, Tabs, Modal, Field, DataTable, Note, Switch, Avatar, Confirm, Stat } from '../ui';
import { tablePdf } from '../pdf';

export function Permissoes({ tab }: { tab?: string }) {
  const { state, can, special, act, go, toast, user } = useApp(); const t = tab === 'usuarios' ? 'usuarios' : 'perfis'; const edit = can('permissoes', 'editar');
  const [sel, setSel] = useState(state.roles[2]?.id || state.roles[0].id); const r = state.roles.find((x: any) => x.id === sel) || state.roles[0]; const [novo, setNovo] = useState<any>(null); const [conv, setConv] = useState<any>(null); const [del, setDel] = useState(false); const [q, setQ] = useState('');
  const nUsers = (id: string) => state.users.filter((u: any) => u.roleId === id).length; const locked = !edit || r.system; const pd = special('dados_pessoais');
  const users = state.users.filter((u: any) => !q || norm(u.name + u.org + u.email).includes(norm(q)));
  return <>
    <PageHead title="Perfis e permissões" sub="Cada perfil define o que a pessoa vê e o que pode fazer em cada módulo, e sobre quais registros. As mudanças valem na hora.">
      {edit && (t === 'perfis' ? <Btn variant="primary" icon={Plus} onClick={() => setNovo({ name: '', desc: '', from: sel })}>Novo perfil</Btn> : <Btn variant="primary" icon={UserPlus} onClick={() => setConv({ name: '', email: '', org: '', roleId: 'analista' })}>Convidar usuário</Btn>)}
    </PageHead>
    <div className="stack-sm">
      <Tabs tabs={[{ id: 'perfis', label: 'Perfis', count: state.roles.length }, { id: 'usuarios', label: 'Usuários', count: state.users.length }]} value={t} onChange={(x: string) => go('permissoes/' + x)} />
      {!edit && <Note>Você está em modo leitura. Só quem tem a permissão “Editar” em Perfis e permissões pode alterar.</Note>}
      {t === 'perfis' ? <div className="split" style={{ gridTemplateColumns: 'minmax(230px,300px) minmax(0,1fr)' }}>
        <div className="card" style={{ padding: 8 }}>{state.roles.map((x: any) => <button key={x.id} className={`role-item ${sel === x.id ? 'is-on' : ''}`} onClick={() => setSel(x.id)}><span className="grow" style={{ minWidth: 0 }}><b className="small" style={{ display: 'block' }}>{x.name}</b><span className="tiny muted">{SCOPES[x.scope]} · {nUsers(x.id)} {nUsers(x.id) === 1 ? 'usuário' : 'usuários'}</span></span>{x.system && <Lock size={14} aria-hidden className="muted" />}</button>)}</div>
        <div className="stack">
          <div className="card card-pad stack-sm">
            <div className="row between wrap"><div className="grow"><h2>{r.name}</h2><p className="small muted">{r.desc}</p></div>
              {state.users.find((u: any) => u.roleId === r.id && u.active && u.id !== user.id) && <Btn size="sm" icon={LogIn} onClick={() => { const u = state.users.find((u: any) => u.roleId === r.id && u.active && u.id !== user.id); act.login(u.id); go('inicio'); toast(`Agora você vê o sistema como ${u.name}.`); }}>Ver o sistema com este perfil</Btn>}
              {edit && !r.system && nUsers(r.id) === 0 && <Btn size="sm" variant="danger" icon={Trash2} onClick={() => setDel(true)}>Excluir perfil</Btn>}</div>
            {r.system && <Note>Perfil do sistema. Fica bloqueado para que sempre exista alguém capaz de administrar a plataforma.</Note>}
            <Field label="Alcance dos dados" hint="Define sobre quais registros as permissões valem."><select className="select" style={{ maxWidth: 340 }} disabled={locked} value={r.scope} onChange={e => act.setRole(r.id, { scope: e.target.value })}>{Object.entries(SCOPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
          </div>
          <div className="card"><div className="card-head"><h3>Permissões por módulo</h3><span className="small muted">“Ver” é exigido pelas demais ações.</span></div>
            <div className="dt-wrap"><table className="dt matrix"><thead><tr><th>Módulo</th>{Object.entries(ACTIONS).map(([k, v]) => <th key={k}>{v}</th>)}</tr></thead>
              <tbody>{MODULES.map((m: any) => <tr key={m.id}><td><b className="small">{m.label}</b>{m.notes && <div className="tiny muted">{m.notes}</div>}</td>{Object.keys(ACTIONS).map(a => <td key={a}>{m.actions.includes(a) ? <input type="checkbox" className="mx" disabled={locked} checked={!!r.perms[m.id]?.includes(a)} aria-label={`${ACTIONS[a]} em ${m.label}`} onChange={() => act.togglePerm(r.id, m.id, a)} /> : <span className="muted" aria-hidden>·</span>}</td>)}</tr>)}</tbody></table></div></div>
          <div className="card"><div className="card-head"><h3>Permissões especiais</h3></div><ul className="list">{SPECIALS.map(s => <li key={s.id}><span className="grow"><b className="small">{s.label}</b><div className="tiny muted">{s.desc}</div></span><Switch on={!!r.special?.[s.id]} disabled={locked} label={s.label} onChange={() => act.toggleSpecial(r.id, s.id)} /></li>)}</ul></div>
        </div>
      </div> : <DataTable rows={users} pageSize={12} exportName="sigap-usuarios" exportTitle="Usuários e perfis" canExport={edit}
        toolbar={<div className="search"><Search size={15} aria-hidden /><input className="input" placeholder="Buscar por nome, unidade ou e-mail" value={q} onChange={e => setQ(e.target.value)} aria-label="Buscar usuários" /></div>}
        columns={[
          { key: 'name', label: 'Usuário', w: 2.4, exp: (u: any) => u.name, render: (u: any) => <div className="row"><Avatar name={u.name} /><div><div className="cell-main">{u.name}</div><div className="cell-sub">{u.title}</div></div></div> },
          { key: 'org', label: 'Unidade ou instituição', w: 2.4, exp: (u: any) => u.org },
          { key: 'email', label: 'E-mail', w: 2.2, exp: (u: any) => pd ? u.email : maskEmail(u.email) },
          { key: 'role', label: 'Perfil', w: 1.6, stop: true, exp: (u: any) => state.roles.find((x: any) => x.id === u.roleId)?.name, render: (u: any) => edit && u.id !== user.id ? <select className="select input-sm" value={u.roleId} aria-label={`Perfil de ${u.name}`} onChange={e => { act.setUserRole(u.id, e.target.value); toast('Perfil do usuário alterado.'); }}>{state.roles.map((x: any) => <option key={x.id} value={x.id}>{x.name}</option>)}</select> : <Pill tone="navy">{state.roles.find((x: any) => x.id === u.roleId)?.name}</Pill> },
          { key: 'active', label: 'Ativo', w: 0.6, stop: true, exp: (u: any) => u.active ? 'Sim' : 'Não', render: (u: any) => <Switch on={u.active} disabled={!edit || u.id === user.id} label={`${u.name} ativo`} onChange={() => act.toggleUser(u.id)} /> },
        ]} />}
    </div>
    {novo && <Modal title="Novo perfil" sub="Comece copiando as permissões de um perfil existente e ajuste na matriz." onClose={() => setNovo(null)} footer={<><Btn onClick={() => setNovo(null)}>Cancelar</Btn><Btn variant="primary" disabled={!novo.name.trim()} onClick={() => { const id = act.addRole(novo.name.trim(), novo.desc.trim(), novo.from); setSel(id); setNovo(null); toast('Perfil criado.'); }}>Criar perfil</Btn></>}>
      <div className="col gap-16"><Field label="Nome do perfil"><input className="input" value={novo.name} onChange={e => setNovo({ ...novo, name: e.target.value })} placeholder="Ex.: Assessoria de câmara" /></Field><Field label="Descrição"><input className="input" value={novo.desc} onChange={e => setNovo({ ...novo, desc: e.target.value })} /></Field>
        <Field label="Copiar permissões de"><select className="select" value={novo.from} onChange={e => setNovo({ ...novo, from: e.target.value })}>{state.roles.map((x: any) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></Field></div></Modal>}
    {conv && <Modal title="Convidar usuário" onClose={() => setConv(null)} footer={<><Btn onClick={() => setConv(null)}>Cancelar</Btn><Btn variant="primary" disabled={!conv.name.trim() || !/\S+@\S+\.\S+/.test(conv.email)} onClick={() => { act.addUser(conv); setConv(null); toast('Convite registrado.'); }}>Convidar usuário</Btn></>}>
      <div className="form-grid"><Field label="Nome" span><input className="input" value={conv.name} onChange={e => setConv({ ...conv, name: e.target.value })} /></Field><Field label="E-mail"><input className="input" type="email" value={conv.email} onChange={e => setConv({ ...conv, email: e.target.value })} /></Field><Field label="Unidade ou instituição"><input className="input" value={conv.org} onChange={e => setConv({ ...conv, org: e.target.value, unit: e.target.value })} /></Field>
        <Field label="Perfil" span><select className="select" value={conv.roleId} onChange={e => setConv({ ...conv, roleId: e.target.value })}>{state.roles.map((x: any) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></Field></div></Modal>}
    {del && <Confirm title="Excluir perfil?" cta="Excluir perfil" variant="danger" onConfirm={() => { act.removeRole(r.id); setSel(state.roles[0].id); toast('Perfil excluído.'); }} onClose={() => setDel(false)}><p>O perfil “{r.name}” não tem usuários e será removido. A exclusão fica registrada na auditoria.</p></Confirm>}
  </>;
}

export function Auditoria() {
  const { state, can, act, go, exportFile } = useApp(); const [q, setQ] = useState(''); const [acao, setAcao] = useState(''); const [quem, setQuem] = useState(''); const [res, setRes] = useState<any>(null);
  const acoes = useMemo(() => Array.from(new Set(state.audit.map((e: any) => e.action))).sort() as string[], [state.audit]); const pessoas = useMemo(() => Array.from(new Set(state.audit.map((e: any) => e.userName))).sort() as string[], [state.audit]);
  const rows = useMemo(() => [...state.audit].reverse().filter((e: any) => (!acao || e.action === acao) && (!quem || e.userName === quem) && (!q || norm(e.detail + e.action + e.entityId).includes(norm(q)))).map((e: any) => ({ ...e, id: e.seq })), [state.audit, q, acao, quem]);
  const head = ['Nº', 'Data e hora', 'Usuário', 'Perfil', 'Ação', 'Registro', 'Detalhe', 'Hash anterior', 'Hash'];
  return <>
    <PageHead title="Auditoria" sub="Cada ação gera um registro encadeado por hash SHA-256. Se um registro for alterado depois, a cadeia quebra a partir dele.">
      <Btn variant="primary" icon={Fingerprint} onClick={() => setRes(verifyChain(state.audit))}>Verificar integridade</Btn>
      {can('auditoria', 'exportar') && <><Btn onClick={() => { const x = csv([head, ...[...state.audit].reverse().map((e: any) => [e.seq, fmtDateTime(e.ts), e.userName, e.roleName, e.action, `${e.entity}:${e.entityId}`, e.detail, e.prev, e.hash])]); exportFile('sigap-trilha-de-auditoria.csv', x, x); }}>CSV</Btn>
        <Btn onClick={() => exportFile('sigap-trilha-de-auditoria.pdf', tablePdf({ title: 'Trilha de auditoria', subtitle: `${rows.length} registros`, columns: [{ label: 'Nº', w: 0.4 }, { label: 'Data e hora', w: 1.2 }, { label: 'Usuário', w: 1.5 }, { label: 'Ação', w: 1.8 }, { label: 'Detalhe', w: 4.4 }, { label: 'Hash', w: 1 }], rows: rows.map((e: any) => [e.seq, fmtDateTime(e.ts), e.userName, e.action, e.detail, e.hash.slice(0, 12)]) }))}>PDF</Btn></>}
    </PageHead>
    <div className="stack-sm">
      {res && (res.ok ? <Note tone="ok"><b>Cadeia íntegra.</b> {res.n} registros conferidos, do primeiro ao último, sem divergência de hash.</Note> : <Note tone="danger"><b>Cadeia quebrada no registro nº {res.at}.</b> O conteúdo não confere com o hash gravado. Tudo a partir dele deve ser tratado como suspeito.</Note>)}
      <div className="card card-pad row wrap"><span className="ico-badge"><FlaskConical size={17} aria-hidden /></span><span className="grow small" style={{ minWidth: 220 }}><b>Demonstração de adulteração.</b> Altere um registro sem recalcular o hash e verifique a integridade para ver a detecção.</span>
        {state.tamper ? <Btn size="sm" icon={RotateCcw} onClick={() => { act.untamper(); setRes(null); }}>Desfazer adulteração</Btn> : <Btn size="sm" icon={ShieldAlert} onClick={() => { act.tamper(); setRes(null); }}>Simular adulteração</Btn>}</div>
      <DataTable rows={rows} pageSize={15} onRow={(e: any) => e.entity === 'projeto' && state.projects.some((p: any) => p.id === e.entityId) ? go(`projetos/${e.entityId}/historico`) : undefined}
        toolbar={<><div className="search"><Search size={15} aria-hidden /><input className="input" placeholder="Buscar no detalhe" value={q} onChange={e => setQ(e.target.value)} aria-label="Buscar na trilha" /></div>
          <select className="select" value={acao} onChange={e => setAcao(e.target.value)} aria-label="Ação"><option value="">Todas as ações</option>{acoes.map(a => <option key={a}>{a}</option>)}</select>
          <select className="select" value={quem} onChange={e => setQuem(e.target.value)} aria-label="Usuário"><option value="">Todos os usuários</option>{pessoas.map(a => <option key={a}>{a}</option>)}</select></>}
        empty={<Empty title="Nenhum registro com esses filtros" />}
        columns={[
          { key: 'seq', label: 'Nº', exp: (e: any) => e.seq, sort: (e: any) => e.seq, render: (e: any) => <span className="num muted">{e.seq}</span> },
          { key: 'ts', label: 'Data e hora', exp: (e: any) => fmtDateTime(e.ts), sort: (e: any) => e.ts, nowrap: true },
          { key: 'user', label: 'Quem', exp: (e: any) => e.userName, render: (e: any) => <><div className="cell-main">{e.userName}</div><div className="cell-sub">{e.roleName}</div></> },
          { key: 'action', label: 'Ação', exp: (e: any) => e.action, render: (e: any) => <><div className="cell-main">{e.action}</div><div className="cell-sub clamp-2" style={{ maxWidth: 460 }}>{e.detail}</div></> },
          { key: 'hash', label: 'Hash', exp: (e: any) => e.hash, render: (e: any) => <span className="hash" title={`anterior: ${e.prev}\natual: ${e.hash}`}>{res && !res.ok && e.seq >= res.at ? <Pill tone="danger" icon={ShieldAlert}>{e.seq === res.at ? 'não confere' : 'após a quebra'}</Pill> : e.hash.slice(0, 12)}</span> },
        ]} />
    </div>
  </>;
}

const MOV: Record<string, [string, string][]> = { 'Inscrição enviada': [['SEI', 'Processo autuado']], 'Projeto habilitado': [['SEI', 'Despacho de habilitação juntado']], 'Projeto inabilitado': [['SEI', 'Despacho de inabilitação juntado']], 'Parecer técnico emitido': [['SEI', 'Parecer técnico juntado']], 'Projeto selecionado': [['Sistema Único', 'Decisão de destinação registrada']], 'Seleção homologada': [['SEI', 'Termo de destinação assinado'], ['Sistema Único', 'Homologação registrada']], 'Prestação de contas aprovada': [['SEI', 'Parecer conclusivo juntado'], ['Painéis de Transparência', 'Projeto atualizado no painel']] };
export function Integracoes() {
  const { state, go, can, toast } = useApp();
  const movs = [...state.audit].reverse().flatMap((e: any) => (MOV[e.action] || []).map(([sis, txt], i) => ({ id: e.seq + '_' + i, e, sis, txt, p: state.projects.find((p: any) => p.id === e.entityId) }))).filter((m: any) => m.p);
  const SIS = [['gov.br', 'Login de proponentes e cidadãos, com nível de conta e assinatura eletrônica.', 'Autenticação'], ['Conta institucional do MPF', 'Acesso de membros e servidores com as credenciais da rede.', 'Autenticação'], ['SEI', 'Autuação do processo na inscrição e juntada de pareceres, termos e decisões.', 'Processo'], ['Sistema Único', 'Registro das decisões de destinação e da homologação.', 'Processo'], ['MPF Serviços', 'Entrada do cidadão para consultar chamadas e protocolar pedidos.', 'Atendimento'], ['Painéis de Transparência', 'Publicação das destinações e da execução em dados abertos.', 'Transparência']];
  const n = (s: string) => movs.filter((m: any) => m.sis === s).length;
  return <>
    <PageHead title="Integrações" sub="Como o SIGAP conversa com os sistemas corporativos. No protótipo as integrações são simuladas: os números de processo e as movimentações são gerados localmente." />
    <div className="stack">
      <div className="grid g3">{SIS.map(([nome, desc, tipo]) => <div key={nome} className="card card-pad stack-sm"><div className="row between"><h3>{nome}</h3><Pill tone="warn">Simulada</Pill></div><p className="small muted">{desc}</p><div className="row between small"><span className="muted">{tipo}</span>{n(nome) > 0 && <b className="num">{n(nome)} movimentações</b>}</div></div>)}</div>
      <DataTable rows={movs} pageSize={10} onRow={(m: any) => go(`projetos/${m.p.id}/historico`)} toolbar={<h3 className="grow">Movimentações geradas pelo SIGAP</h3>} exportName="sigap-movimentacoes" exportTitle="Movimentações nos sistemas corporativos" canExport={can('integracoes', 'editar')}
        columns={[
          { key: 'ts', label: 'Data e hora', w: 1.2, exp: (m: any) => fmtDateTime(m.e.ts), sort: (m: any) => m.e.ts, nowrap: true },
          { key: 'sis', label: 'Sistema', w: 1, exp: (m: any) => m.sis, render: (m: any) => <span className="sys"><i className="dot" /><b>{m.sis}</b></span> },
          { key: 'txt', label: 'Movimentação', w: 2.4, exp: (m: any) => m.txt, render: (m: any) => <span className="cell-main">{m.txt}</span> },
          { key: 'prot', label: 'Protocolo', w: 1.4, exp: (m: any) => (m.sis === 'Sistema Único' ? m.p.simp : m.p.sei) || '', render: (m: any) => <span className="num small">{(m.sis === 'Sistema Único' ? m.p.simp : m.p.sei) || '—'}</span>, nowrap: true },
          { key: 'proj', label: 'Projeto', w: 3, exp: (m: any) => m.p.title, render: (m: any) => <><div>{m.p.title}</div><div className="cell-sub">{m.p.code}</div></> },
        ]} />
    </div>
  </>;
}
