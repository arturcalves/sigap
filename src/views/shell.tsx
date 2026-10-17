import React, { useEffect, useMemo, useRef, useState } from 'react';
import { LayoutDashboard, Megaphone, FolderKanban, Library, Inbox, MessageSquareWarning, HandCoins, Activity, FileCheck2, Images, Building2, ShieldCheck, ScrollText, Cable, Palette, Settings, Search, Bell, Menu, PanelLeftClose, PanelLeftOpen, LogOut, Globe, Repeat, ChevronDown, UserPlus, ClipboardCheck, Stamp, FilePen, Clock, Receipt, Wallet, SearchCheck, ListOrdered } from 'lucide-react';
import { fmtCompact, saldoInstr, sum, daysUntil, norm, fisico, STAGES } from '../lib';
import { useApp, useQueues } from '../store';
import { Btn, Avatar, Empty } from '../ui';
import { Brand, ThemeBtn } from './portal';

export const NAV: any[] = [
  { group: '', items: [{ id: 'inicio', label: 'Início', icon: LayoutDashboard, mod: 'inicio' }] },
  { group: 'Ciclo do projeto', items: STAGES.map((s, i) => ({ id: 'etapa/' + (i + 1), label: s.short || s.label, full: s.label, n: s.n })) },
  { group: 'Gestão', items: [{ id: 'chamadas', label: 'Editais e chamadas', icon: Megaphone, mod: 'chamadas' }, { id: 'projetos', label: 'Projetos', icon: FolderKanban, mod: 'projetos' }, { id: 'banco', label: 'Banco de projetos', icon: Library, mod: 'banco' }, { id: 'recursos', label: 'Recursos e destinações', icon: HandCoins, mod: 'recursos' }, { id: 'monitoramento', label: 'Painel executivo', icon: Activity, mod: 'monitoramento' }, { id: 'midias', label: 'Mídias', icon: Images, mod: 'midias' }] },
  { group: 'Governança', items: [{ id: 'instituicoes', label: 'Instituições', icon: Building2, mod: 'instituicoes' }, { id: 'permissoes', label: 'Perfis e permissões', icon: ShieldCheck, mod: 'permissoes' }, { id: 'auditoria', label: 'Trilha de auditoria', icon: ScrollText, mod: 'auditoria' }, { id: 'integracoes', label: 'Integrações', icon: Cable, mod: 'integracoes' }, { id: 'config', label: 'Configurações', icon: Settings, mod: 'config' }] },
];
const MORE = [{ id: 'fila', label: 'Fila de trabalho', icon: Inbox, mod: 'analises' }, { id: 'diligencias', label: 'Diligências', icon: MessageSquareWarning, mod: 'diligencias' }, { id: 'relatorios', label: 'Relatórios e contas', icon: FileCheck2, mod: 'contas' }, { id: 'design', label: 'Design system', icon: Palette }];

/* O que cada perfil precisa resolver agora */
export function usePendencias() {
  const { state, user, role, can, special } = useApp(); const q = useQueues();
  return useMemo(() => {
    const out: any[] = []; const n = (k: number, s: string, p: string) => `${k} ${k === 1 ? s : p}`;
    if (!user) return out;
    if (role.scope === 'proprio') {
      q.diligencias.forEach(({ p, d }: any) => out.push({ icon: MessageSquareWarning, tone: daysUntil(d.prazo) <= 3 ? 'danger' : 'warn', title: `Responder diligência de “${p.title}”`, sub: `Prazo: ${daysUntil(d.prazo) < 0 ? 'vencido' : daysUntil(d.prazo) + ' dias'}`, to: 'diligencias' }));
      q.rascunhos.forEach((p: any) => out.push({ icon: FilePen, tone: 'neutral', title: `Concluir a inscrição de “${p.title}”`, sub: 'Rascunho salvo', to: 'rascunho/' + p.id }));
      state.projects.filter((p: any) => p.instId === user.instId && p.status === 'execucao').forEach((p: any) => { const dev = p.relatorios.filter((r: any) => r.status === 'devolvido').length; out.push({ icon: Activity, tone: dev ? 'warn' : 'info', title: dev ? `Reenviar relatório devolvido de “${p.title}”` : `Atualizar metas e despesas de “${p.title}”`, sub: `Execução física em ${fisico(p)}%`, to: `projetos/${p.id}/monitoramento` }); });
      return out;
    }
    if (can('analises', 'editar') && q.distribuir.length) out.push({ icon: UserPlus, tone: 'warn', title: `${n(q.distribuir.length, 'projeto aguarda', 'projetos aguardam')} distribuição`, sub: 'Sem analista responsável', to: 'etapa/2' });
    if (can('analises', 'aprovar')) {
      const h = q.habilitacao.filter((p: any) => !p.analistaId || p.analistaId === user.id), a = q.analise.filter((p: any) => !p.analistaId || p.analistaId === user.id);
      if (h.length) out.push({ icon: ClipboardCheck, tone: 'warn', title: `${n(h.length, 'habilitação', 'habilitações')} para conferir`, sub: h.map((p: any) => p.title).slice(0, 2).join(' · '), to: 'etapa/2' });
      if (a.length) out.push({ icon: FilePen, tone: 'warn', title: `${n(a.length, 'parecer técnico', 'pareceres técnicos')} para emitir`, sub: a.map((p: any) => p.title).slice(0, 2).join(' · '), to: 'etapa/3' });
    }
    if (can('monitoramento', 'aprovar') && q.relatorios.length) out.push({ icon: FileCheck2, tone: 'info', title: `${n(q.relatorios.length, 'relatório aguarda', 'relatórios aguardam')} ateste`, sub: q.relatorios.map((x: any) => x.p.title).slice(0, 2).join(' · '), to: 'etapa/6' });
    if (can('contas', 'aprovar') && q.contas.length) out.push({ icon: Receipt, tone: 'warn', title: `${n(q.contas.length, 'prestação de contas', 'prestações de contas')} em análise`, sub: q.contas.map((p: any) => p.title).join(' · '), to: 'etapa/7/contas' });
    if (can('auditoria', 'aprovar') && q.auditoria.length) out.push({ icon: SearchCheck, tone: 'warn', title: `${n(q.auditoria.length, 'projeto aguarda', 'projetos aguardam')} auditoria de conformidade`, sub: q.auditoria.map((p: any) => p.title).join(' · '), to: 'etapa/7/auditoria' });
    if (can('recursos', 'aprovar')) {
      const saldo = sum(q.meusInstr, (i: any) => saldoInstr(state, i.id));
      if (saldo > 0 && q.julgamento.length) out.push({ icon: Wallet, tone: 'info', title: `${fmtCompact(saldo)} disponíveis para destinar`, sub: `${n(q.julgamento.length, 'projeto habilitado', 'projetos habilitados')} no banco aguardam julgamento`, to: 'etapa/4' });
    }
    if (special('homologar') && q.homologacao.length) out.push({ icon: Stamp, tone: 'info', title: `${n(q.homologacao.length, 'seleção aguarda', 'seleções aguardam')} homologação`, sub: q.homologacao.map((p: any) => p.title).join(' · '), to: 'etapa/5' });
    if (can('diligencias', 'criar')) { const v = q.diligencias.filter(({ d }: any) => daysUntil(d.prazo) < 0).length; if (v) out.push({ icon: Clock, tone: 'danger', title: `${n(v, 'diligência com prazo vencido', 'diligências com prazo vencido')}`, sub: 'Sem resposta da instituição', to: 'diligencias' }); }
    return out;
  }, [state, user, role, q]);
}

function Palette_({ onClose }: any) {
  const { state, scoped, can, go } = useApp(); const [q, setQ] = useState(''); const [i, setI] = useState(0);
  const items = useMemo(() => {
    const nav = [...NAV.flatMap(g => g.items), ...MORE].filter((x: any) => !x.mod || can(x.mod)).map((x: any) => ({ k: 'n' + x.id, icon: x.icon || ListOrdered, label: x.n ? `${x.n} · ${x.full}` : x.label, sub: x.n ? 'Etapa' : 'Tela', to: x.id }));
    const ps = (can('projetos') ? scoped : []).map((p: any) => ({ k: p.id, icon: FolderKanban, label: p.title, sub: p.code, to: 'projetos/' + p.id }));
    const cs = state.chamadas.map((c: any) => ({ k: c.id, icon: Megaphone, label: c.title, sub: c.code, to: 'chamadas/' + c.id }));
    const t = norm(q); return [...nav, ...ps, ...cs].filter(x => !t || norm(x.label + ' ' + x.sub).includes(t)).slice(0, 12);
  }, [q, state, scoped]);
  useEffect(() => setI(0), [q]);
  const pick = (x: any) => { if (x) { go(x.to); onClose(); } };
  return <div className="scrim" style={{ placeItems: 'start center' }} onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="palette" role="dialog" aria-modal="true" aria-label="Buscar">
      <input autoFocus placeholder="Buscar telas, projetos e chamadas" value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => { if (e.key === 'ArrowDown') { e.preventDefault(); setI(Math.min(items.length - 1, i + 1)); } else if (e.key === 'ArrowUp') { e.preventDefault(); setI(Math.max(0, i - 1)); } else if (e.key === 'Enter') pick(items[i]); else if (e.key === 'Escape') onClose(); }} />
      {items.length ? <ul>{items.map((x, k) => <li key={x.k}><button className={k === i ? 'is-on' : ''} onMouseEnter={() => setI(k)} onClick={() => pick(x)}><x.icon size={16} aria-hidden /><span className="grow truncate">{x.label}</span><span className="tiny muted">{x.sub}</span></button></li>)}</ul> : <Empty title="Nada encontrado">Tente outro termo.</Empty>}
    </div></div>;
}

export function Shell({ children }: any) {
  const { state, seg, path, go, user, role, can, special, act, toast, proj } = useApp(); const q = useQueues(); const pend = usePendencias();
  const [collapsed, setCollapsed] = useState(false); const [open, setOpen] = useState(false); const [menu, setMenu] = useState(''); const [pal, setPal] = useState(false); const content = useRef<HTMLElement>(null);
  useEffect(() => { content.current?.scrollTo(0, 0); setOpen(false); setMenu(''); }, [path]);
  useEffect(() => { const k = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPal(true); } }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, []);
  useEffect(() => { if (!menu) return; const c = () => setMenu(''); window.addEventListener('click', c); return () => window.removeEventListener('click', c); }, [menu]);
  const own = role.scope === 'proprio';
  const counts: Record<string, number> = { 'etapa/1': own ? q.rascunhos.length : 0, 'etapa/2': can('analises', 'aprovar') ? q.habilitacao.length : can('analises', 'editar') ? q.distribuir.length : 0, 'etapa/3': can('analises', 'aprovar') ? q.analise.length : own ? q.diligencias.length : 0,
    'etapa/4': can('recursos', 'aprovar') ? q.julgamento.length : 0, 'etapa/5': special('homologar') ? q.homologacao.length : 0, 'etapa/6': can('monitoramento', 'aprovar') ? q.relatorios.length : 0, 'etapa/7': (can('contas', 'aprovar') ? q.contas.length : 0) + (can('auditoria', 'aprovar') ? q.auditoria.length : 0) };
  const ap = seg[0] === 'analise' ? proj(seg[1]) : null;
  const cur = seg[0] === 'etapa' ? 'etapa/' + (seg[1] || '1') : seg[0] === 'auditar' ? 'etapa/7' : ap ? (ap.status === 'analise' || (ap.status === 'diligencia' && ap.diligStage !== 'habilitacao') ? 'etapa/3' : 'etapa/2') : ['inscricao', 'rascunho'].includes(seg[0]) ? 'etapa/1' : seg[0];
  const personas = state.users.filter((u: any) => u.persona && u.id !== user.id);
  return <div className={`app ${collapsed ? 'is-collapsed' : ''} ${open ? 'nav-open' : ''}`}>
    <aside className="side" aria-label="Menu principal">
      <div className="side-brand"><Brand /></div>
      <nav className="side-nav">{NAV.map(g => { const items = g.items.filter((x: any) => !x.mod || can(x.mod) || (x.id === 'relatorios' && can('monitoramento'))); if (!items.length) return null;
        return <div key={g.group || 'top'} className={`nav-group ${g.group === 'Ciclo do projeto' ? 'is-cycle' : ''}`}>{g.group && <span className="nav-group-l">{g.group}</span>}{items.map((x: any) => <button key={x.id} className={`nav-item ${cur === x.id ? 'is-active' : ''}`} aria-current={cur === x.id ? 'page' : undefined} title={collapsed || x.n ? (x.full || x.label) : undefined} onClick={() => go(x.id)}>{x.n ? <b className="nav-n" aria-hidden>{x.n}</b> : <x.icon size={18} aria-hidden />}<span>{x.id === 'projetos' && role.scope === 'proprio' ? 'Meus projetos' : x.label}</span>{counts[x.id] ? <i className="nav-count" style={{ fontStyle: 'normal' }}>{counts[x.id]}</i> : null}</button>)}</div>; })}</nav>
      <div className="side-foot"><button className="nav-item" onClick={() => go('')} title="Portal público"><Globe size={18} aria-hidden /><span>Portal público</span></button></div>
    </aside>
    <button className="side-scrim" aria-label="Fechar menu" onClick={() => setOpen(false)} />
    <div className="main">
      <header className="topbar">
        <Btn className="only-sm" variant="quiet" icon={Menu} aria-label="Abrir menu" onClick={() => setOpen(true)} />
        <Btn className="hide-sm" variant="quiet" icon={collapsed ? PanelLeftOpen : PanelLeftClose} aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'} onClick={() => setCollapsed(!collapsed)} />
        <button className="top-search" onClick={() => setPal(true)}><Search size={15} aria-hidden /><span>Buscar telas, projetos e chamadas</span><span className="kbd hide-sm">Ctrl K</span></button>
        <span className="grow" /><span className="proto hide-sm">Protótipo · dados fictícios</span>
        <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
          <Btn variant="quiet" icon={Bell} aria-label={`Pendências: ${pend.length}`} aria-expanded={menu === 'bell'} onClick={() => setMenu(menu === 'bell' ? '' : 'bell')} />
          {pend.length > 0 && <i className="nav-count" style={{ position: 'absolute', right: 0, top: 0, fontStyle: 'normal', pointerEvents: 'none' }}>{pend.length}</i>}
          {menu === 'bell' && <div className="menu" style={{ width: 360, maxWidth: '88vw' }}><div className="menu-label">Precisa da sua atenção</div>{pend.length ? pend.slice(0, 7).map((x: any, i: number) => <button key={i} className="menu-item" onClick={() => go(x.to)}><span className={`ico-badge t-${x.tone}`}><x.icon size={16} aria-hidden /></span><span className="grow" style={{ minWidth: 0 }}><b className="small" style={{ display: 'block' }}>{x.title}</b><span className="tiny muted truncate" style={{ display: 'block' }}>{x.sub}</span></span></button>) : <div className="empty small">Nada pendente para o seu perfil.</div>}</div>}
        </div>
        <ThemeBtn />
        <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
          <button className="row gap-6" style={{ border: 0, background: 'none', padding: '4px 6px', borderRadius: 8 }} aria-expanded={menu === 'user'} aria-label="Menu do usuário" onClick={() => setMenu(menu === 'user' ? '' : 'user')}><Avatar name={user.name} /><span className="hide-sm" style={{ textAlign: 'left', lineHeight: 1.2 }}><b className="small" style={{ display: 'block' }}>{user.name}</b><span className="tiny muted">{role.name}</span></span><ChevronDown size={15} aria-hidden className="hide-sm" /></button>
          {menu === 'user' && <div className="menu">
            <div style={{ padding: '8px 10px' }}><b>{user.name}</b><div className="small muted">{user.title} · {user.org}</div></div><hr className="rule" style={{ margin: '4px 0' }} />
            <div className="menu-label">Trocar de perfil</div>
            {personas.map((u: any) => <button key={u.id} className="menu-item" onClick={() => { act.login(u.id); go('inicio'); toast(`Agora você vê o sistema como ${u.name}.`); }}><Repeat size={15} aria-hidden /><span className="grow"><span style={{ display: 'block' }}>{u.name}</span><span className="tiny muted">{state.roles.find((r: any) => r.id === u.roleId)?.name}</span></span></button>)}
            <hr className="rule" style={{ margin: '4px 0' }} />
            <button className="menu-item" onClick={() => go('')}><Globe size={15} aria-hidden />Portal público</button>
            <button className="menu-item" onClick={() => { act.logout(); go('acesso'); }}><LogOut size={15} aria-hidden />Sair</button>
          </div>}
        </div>
      </header>
      <main className="content" ref={content}><div className="page">{children}</div></main>
    </div>
    {pal && <Palette_ onClose={() => setPal(false)} />}
  </div>;
}
export const Denied = () => <div className="card"><Empty title="Seu perfil não tem acesso a esta tela">O acesso é definido em Perfis e permissões pelo administrador do sistema.</Empty></div>;
