import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider, useApp } from './store';
import { PortalHome, PubChamada, PubProject, Login } from './views/portal';
import { Shell, Denied } from './views/shell';
import { Inicio, Chamadas, Instituicoes } from './views/inicio';
import { Projetos, Wizard } from './views/projetos';
import { Projeto } from './views/detalhe';
import { Analise } from './views/analise';
import { Banco, Fila, Diligencias, Recursos } from './views/fluxo';
import { Monitoramento, Relatorios, Midias } from './views/monitor';
import { Permissoes, Auditoria, Integracoes } from './views/governanca';
import { DesignSystem, Config } from './views/sistema';
import { Etapa, Auditar } from './views/etapas';
import { Empty, Btn } from './ui';

function Router() {
  const { seg, user, can, go } = useApp(); const [v, a, b] = seg;
  if (!v || v === 'portal') return <PortalHome />;
  if (v === 'chamada') return <PubChamada id={a} />;
  if (v === 'p') return <PubProject id={a} />;
  if (v === 'acesso' || !user) return <Login />;
  const g = (mod: string, el: any, action = 'ver') => can(mod, action) ? el : <Denied />;
  const page = v === 'inicio' ? <Inicio />
    : v === 'etapa' ? <Etapa key={a} n={a} tab={b} />
    : v === 'auditar' ? (can('auditoria') || can('contas', 'aprovar') ? <Auditar key={a} id={a} /> : <Denied />)
    : v === 'chamadas' ? g('chamadas', <Chamadas id={a} />)
    : v === 'projetos' ? g('projetos', a && a !== 'etapa' ? <Projeto key={a} id={a} tab={b} /> : <Projetos key={b || 'all'} etapa={a === 'etapa' ? b : undefined} />)
    : v === 'inscricao' ? g('projetos', <Wizard key={'n' + a} chamadaId={a} />, 'criar')
    : v === 'rascunho' ? g('projetos', <Wizard key={a} projectId={a} stepIn={b} />, 'editar')
    : v === 'banco' ? g('banco', <Banco />)
    : v === 'fila' ? g('analises', <Fila tab={a} />)
    : v === 'analise' ? g('analises', <Analise key={a} id={a} />)
    : v === 'diligencias' ? g('diligencias', <Diligencias />)
    : v === 'recursos' ? g('recursos', <Recursos />)
    : v === 'monitoramento' ? g('monitoramento', <Monitoramento />)
    : v === 'relatorios' ? (can('contas') || can('monitoramento') ? <Relatorios tab={a} /> : <Denied />)
    : v === 'midias' ? g('midias', <Midias />)
    : v === 'instituicoes' ? g('instituicoes', <Instituicoes />)
    : v === 'permissoes' ? g('permissoes', <Permissoes tab={a} />)
    : v === 'auditoria' ? g('auditoria', <Auditoria />)
    : v === 'integracoes' ? g('integracoes', <Integracoes />)
    : v === 'design' ? <DesignSystem />
    : v === 'config' ? g('config', <Config />)
    : <div className="card"><Empty title="Tela não encontrada" action={<Btn onClick={() => go('inicio')}>Ir para o início</Btn>} /></div>;
  return <Shell>{page}</Shell>;
}

try { const t = localStorage.getItem('sigap:theme'); if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t); } catch { /* segue o tema do visualizador */ }
createRoot(document.getElementById('root')!).render(<Provider><Router /></Provider>);
