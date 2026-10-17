# SIGAP · protótipo navegável

Protótipo do Sistema de Gestão de Projetos e Chamadas. Versão 2: organizado pelo ciclo em sete etapas (01 Inscrição, 02 Habilitação, 03 Análise técnica, 04 Julgamento, 05 Homologação, 06 Monitoramento e 07 Prestação de contas e auditoria) e gera **um único arquivo HTML**, sem servidor.

Todos os dados são fictícios. Login, integrações (SEI, Sistema Único, gov.br) e armazenamento são simulados no navegador.

## Como rodar

Requer Node 20 ou mais recente.

```bash
npm install
npm run build        # gera dist/sigap.html (minificado, fonte via Google Fonts)
npm run dev          # gera dist/sigap-dev.html (sem minificar, fonte local)
npm run typecheck    # confere os tipos
```

Abra o HTML gerado no navegador. Para escolher outro destino: `SIGAP_OUT=/caminho/arquivo.html npm run build`.

## Estrutura

```
src/
  styles.css        tokens do modo claro e todos os componentes
  dark.css          tokens do modo escuro (o build aplica em prefers-color-scheme e em data-theme="dark")
  lib.ts            formatadores, SHA-256, constantes de domínio (etapas, situações, eixos, permissões) e seletores
  seed.ts           dados de demonstração e trilha de auditoria inicial
  store.tsx         estado, persistência, rotas, sessão, permissões e todas as ações de negócio
  ui.tsx            componentes base (botões, modais, campos, abas, tabela de dados)
  viz.tsx           stepper, funil, mapa, gráficos, rastro do recurso, cartões de projeto e chamada
  media.tsx         grade, envio e visualizador de mídias
  pdf.ts            gerador mínimo de PDF para as exportações
  assets.ts         logo em data URI (ícone, logo completa e nome em branco)
  views/            uma tela por arquivo ou grupo de telas
build.mjs           empacota tudo com esbuild em um HTML
test/               roteiros Playwright (Python)
```

| Arquivo em `views/` | Telas |
|---|---|
| `portal.tsx` | Portal público, detalhe da chamada, página pública do projeto, acesso |
| `shell.tsx` | Menu lateral, barra superior, pendências, paleta de comandos |
| `inicio.tsx` | Início por perfil, Editais e chamadas, Instituições |
| `projetos.tsx` | Lista de projetos e wizard de inscrição |
| `detalhe.tsx` | Projeto (abas) e modais de julgamento, relatório, despesa e contas |
| `analise.tsx` | Habilitação e análise técnica em duas colunas |
| `fluxo.tsx` | Banco de projetos, Fila de trabalho, Diligências, Recursos e destinações |
| `monitor.tsx` | Painel executivo, Relatórios e contas, Mídias |
| `governanca.tsx` | Perfis e permissões, Auditoria, Integrações |
| `sistema.tsx` | Design system e Configurações |
| `etapas.tsx` | Telas das sete etapas e auditoria de conformidade |

## Design system

- **Tokens**: variáveis CSS em `styles.css` (claro) e `dark.css` (escuro). A tela *Design system* do protótipo lê os valores em tempo de execução e exporta os dois temas em JSON.
- **Tipografia**: Public Sans, pesos de 400 a 750, números tabulares em tabelas e valores.
- **Cores**: primária `#0A2540` (navegação e ações principais), acento ciano `#0E9CC4` (CTA, progresso, links ativos), esmeralda, âmbar e carmim para situações, superfícies `#F8FAFC` e branco.
- **Regra de uso**: um botão ciano por tela, para a ação que faz o projeto avançar no ciclo. Situação sempre com texto, nunca só com cor.

## Modelo de domínio

Etapas do ciclo: 01 Inscrição → 02 Habilitação → 03 Análise técnica → 04 Julgamento → 05 Homologação → 06 Monitoramento → 07 Prestação de contas e auditoria. Cada etapa tem uma tela própria (`#/etapa/1` a `#/etapa/7`, em `views/etapas.tsx`) com objetivo, quem atua, entrada, saída, controles e a fila de trabalho.

| Situação | Etapa | Quem move |
|---|---|---|
| `rascunho` | Inscrição | Proponente envia a inscrição |
| `habilitacao` | Habilitação | Analista habilita, abre diligência ou inabilita |
| `analise` | Análise técnica | Analista aprova (vai ao banco), abre diligência ou não aprova |
| `diligencia` | Habilitação ou análise | Proponente responde e o projeto volta à etapa de origem |
| `banco` | Julgamento | Membro seleciona e destina recurso de um instrumento |
| `selecionado` | Homologação | Quem tem a permissão especial homologa e gera o termo |
| `execucao` | Monitoramento | Proponente relata e lança despesas; equipe atesta |
| `contas` | Prestação de contas e auditoria | Analista aprova ou glosa despesas e emite o parecer de contas |
| `auditoria` | Prestação de contas e auditoria | Auditoria examina amostra, evidências e trilha e emite o parecer (`#/auditar/<id>`) |
| `concluido` | Prestação de contas e auditoria | Fim do ciclo, com parecer de auditoria publicado |
| `inabilitado`, `reprovado` | Habilitação, análise | Encerrados |

As transições estão em `store.tsx` (objeto `act`). Cada ação grava um evento na trilha.

**Permissões**: matriz módulo × ação (`MODULES` e `ACTIONS` em `lib.ts`), permissões especiais (`SPECIALS`) e alcance dos dados por perfil (nacional, unidade, própria instituição). A interface consulta `can(modulo, acao)` e `special(chave)`.

**Auditoria**: cada evento guarda o hash SHA-256 do anterior (`hashEvent` em `seed.ts`, `verifyChain` em `store.tsx`).

## O que é simulado

| Item | No protótipo | Em produção |
|---|---|---|
| Dados | `localStorage`, por navegador | API e banco de dados |
| Arquivos enviados | IndexedDB, por navegador | Armazenamento de objetos com antivírus e controle de acesso |
| Login | Escolha de perfil | gov.br para proponentes, conta institucional para membros e servidores |
| SEI e Sistema Único | Números e movimentações gerados localmente | Integração com os serviços corporativos |
| Permissões | Aplicadas só na interface | Aplicadas também no servidor |
| Trilha de auditoria | Cadeia de hash no navegador | Registro imutável no servidor |
| Pré-análise com IA e downloads | Dependem do visualizador onde o HTML está publicado | Serviços próprios |

## Testes

Os roteiros usam Playwright para Python e o build de desenvolvimento.

```bash
pip install playwright pillow && playwright install chromium
npm run dev
python3 test/flow.py                       # ciclo completo com todos os perfis
python3 test/caps.py                       # exportações e IA com um runtime simulado
python3 test/shot.py 'inicio@u_cecilia'    # captura de tela de uma rota com um perfil
```

## Licenças de terceiros

React e esbuild (MIT), lucide-react (ISC), Public Sans (SIL OFL), mapa de `@svg-maps/brazil` (CC BY 4.0, exige atribuição; ela está no rodapé do portal).
