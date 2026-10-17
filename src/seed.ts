// SIGAP · dados de demonstração. Tudo aqui é fictício.
import { daysAgo, daysAhead, RUBRICAS, CRITERIA_DEFAULT, MODULES, CHECK_HAB, CHECK_LEGAL, CHECK_AUDIT, notaFinal, sha256, unidadeDe, fmtBRL } from './lib';

const rng = (seed: number) => { let s = seed >>> 0; return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296; };
const pad = (n: number, l = 4) => String(n).padStart(l, '0');
const slug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '');

export const hashEvent = (e: any) => sha256([e.seq, e.ts, e.userId, e.action, e.entity, e.entityId, e.detail, e.prev].join('|'));

const all = () => Object.fromEntries(MODULES.map(m => [m.id, [...m.actions]]));
const readOnly = () => Object.fromEntries(MODULES.map(m => [m.id, m.actions.filter((a: string) => a === 'ver' || a === 'exportar')]));

function roles() {
  const gestor: any = all(); gestor.permissoes = ['ver']; gestor.auditoria = ['ver', 'exportar'];
  const adm: any = all(); adm.auditoria = ['ver', 'exportar'];
  const aud: any = readOnly(); aud.auditoria = ['ver', 'aprovar', 'exportar'];
  return [
    { id: 'admin', name: 'Administrador do sistema', desc: 'Configura a plataforma, os perfis, os usuários e as integrações.', scope: 'nacional', system: true, perms: adm, special: { homologar: false, dados_pessoais: true, midia_restrita: true, publicar: true, ia: true } },
    { id: 'gestor', name: 'Gestor nacional', desc: 'Abre chamadas, distribui análises, homologa seleções e publica no portal.', scope: 'nacional', perms: gestor, special: { homologar: true, dados_pessoais: true, midia_restrita: true, publicar: true, ia: true } },
    { id: 'procurador', name: 'Procurador(a)', desc: 'Consulta o banco, julga projetos e destina recursos dos instrumentos da sua unidade.', scope: 'unidade', perms: { inicio: ['ver'], chamadas: ['ver'], projetos: ['ver', 'exportar'], banco: ['ver', 'exportar'], analises: ['ver'], diligencias: ['ver'], recursos: ['ver', 'criar', 'aprovar', 'exportar'], monitoramento: ['ver'], contas: ['ver'], midias: ['ver', 'criar'], instituicoes: ['ver'], auditoria: ['ver'], integracoes: ['ver'] }, special: { homologar: true, midia_restrita: true, ia: true } },
    { id: 'analista', name: 'Analista técnico', desc: 'Confere a habilitação, emite parecer, atesta relatórios e analisa a prestação de contas.', scope: 'nacional', perms: { inicio: ['ver'], chamadas: ['ver'], projetos: ['ver', 'editar', 'exportar'], banco: ['ver'], analises: ['ver', 'editar', 'aprovar'], diligencias: ['ver', 'criar'], recursos: ['ver'], monitoramento: ['ver', 'aprovar'], contas: ['ver', 'aprovar', 'exportar'], midias: ['ver', 'criar', 'editar'], instituicoes: ['ver', 'editar', 'aprovar'], integracoes: ['ver'] }, special: { dados_pessoais: true, midia_restrita: true, ia: true } },
    { id: 'proponente', name: 'Proponente', desc: 'Inscreve projetos da própria instituição, responde diligências, relata a execução e presta contas.', scope: 'proprio', perms: { inicio: ['ver'], chamadas: ['ver'], projetos: ['ver', 'criar', 'editar'], diligencias: ['ver', 'editar'], monitoramento: ['ver', 'editar'], contas: ['ver', 'criar'], midias: ['ver', 'criar', 'editar', 'excluir'], instituicoes: ['ver', 'editar'] }, special: {} },
    { id: 'auditor', name: 'Auditoria e controle', desc: 'Consulta tudo em modo leitura, audita a conformidade dos projetos, emite o parecer de auditoria e exporta a trilha.', scope: 'nacional', perms: aud, special: { dados_pessoais: true, midia_restrita: true } },
  ];
}

const INST: any[] = [
  ['raizes', 'Instituto Raízes do Vale', 'OSC', 'MG', 'Governador Valadares', 'Marina Lopes', 2009],
  ['tapajos', 'Associação Vozes do Tapajós', 'Associação comunitária', 'PA', 'Itaituba', 'Iracema Tavares', 2011],
  ['aurora', 'Fundação Aurora de Tecnologia Cívica', 'Fundação', 'DF', 'Brasília', 'Daniel Prado', 2015],
  ['semiarido', 'Instituto Semiárido Vivo', 'OSC', 'BA', 'Juazeiro', 'Joana Bispo', 2004],
  ['horizonte', 'Associação Horizonte Jovem', 'OSC', 'PE', 'Caruaru', 'Paulo Guimarães', 2012],
  ['trilhos', 'Instituto Trilhos da Memória', 'OSC', 'MG', 'São João del-Rei', 'Clara Assunção', 2011],
  ['recomeco', 'Instituto Recomeço', 'OSC', 'RS', 'Porto Alegre', 'Vítor Scherer', 2016],
  ['mare', 'Coletivo Maré Alta', 'Associação comunitária', 'RJ', 'Magé', 'Luana Farias', 2014],
  ['rede', 'Associação Cidadania em Rede', 'OSC', 'SP', 'Campinas', 'Sérgio Matsuda', 2007],
  ['pantanal', 'Instituto Pantanal em Pé', 'OSC', 'MS', 'Corumbá', 'Helga Arruda', 2010],
  ['floresta', 'Fundação Saúde da Floresta', 'Fundação de apoio', 'AM', 'São Gabriel da Cachoeira', 'Tomás Arantes', 2002],
  ['ceara', 'Rede Cidadã do Ceará', 'OSC', 'CE', 'Sobral', 'Fátima Holanda', 2018],
  ['serra', 'Associação Caminhos da Serra', 'Associação comunitária', 'PR', 'Morretes', 'Ivo Kowalski', 2013],
  ['sertao', 'Centro de Convivência com o Sertão', 'OSC', 'PI', 'Picos', 'Antônia Moura', 2008],
  ['serraviva', 'Associação Serra Viva de Agricultores Familiares', 'Associação comunitária', 'MG', 'Conselheiro Pena', 'José Aleixo', 2006],
];
const INST_DOCS = ['Estatuto social e ata de eleição', 'Cartão do CNPJ', 'Certidão negativa de débitos federais', 'Certificado de regularidade do FGTS', 'Certidão negativa de débitos trabalhistas', 'Comprovante de experiência na área'];

const FORN: Record<string, string[]> = {
  'Equipe técnica': ['Folha de pagamento', 'Bolsas da equipe de campo'],
  'Materiais e insumos': ['Agroflora Insumos Ltda.', 'Casa do Produtor Ltda.', 'Cooperativa Mãos da Terra'],
  'Serviços de terceiros': ['Geotec Serviços Técnicos', 'Ponto Certo Consultoria', 'Estúdio Maré Comunicação'],
  'Equipamentos': ['Lume Equipamentos', 'Norte Sat Tecnologia'],
  'Logística e deslocamento': ['TransNorte Logística', 'Posto Rota 116', 'Barqueiros do Rio Ltda.'],
  'Comunicação e mobilização': ['Gráfica Aurora', 'Rádio Comunitária Vale FM'],
  'Custos administrativos': ['Ponto Certo Contabilidade', 'Aluguel da sede'],
};

// n, ano, título, instituição, eixo, UF, municípios, valor, prazo (meses), beneficiários, ODS, status
const P: any[] = [
  { n: 3, y: 2026, title: 'Viveiros comunitários do Rio Doce', inst: 'raizes', eixo: 'ambiente', uf: 'MG', mun: 'Governador Valadares, Resplendor e Aimorés', valor: 1280000, prazo: 18, benef: 2400, ods: [15, 6, 13], status: 'execucao', ch: 'c1', an: 'u_rafael', instr: 'i1', fin: 49, t: { c: 240, e: 232, h: 222, p: 205, s: 190, g: 180 }, notas: [9, 8.5, 8, 9, 9, 8], sh: [34, 22, 12, 14, 8, 4, 6],
    resumo: 'Três viveiros geridos por famílias ribeirinhas vão produzir 180 mil mudas nativas e recuperar 120 hectares de mata ciliar em afluentes do Rio Doce.', objetivo: 'Recuperar áreas de preservação permanente e gerar renda local com a produção e o plantio de mudas nativas.', publico: 'Famílias ribeirinhas e agricultores familiares de três municípios do médio Rio Doce.',
    metas: [['Produzir mudas de espécies nativas', 'mudas', 180000, 112000], ['Recuperar mata ciliar', 'hectares', 120, 61], ['Formar viveiristas da comunidade', 'pessoas', 90, 74]] },
  { n: 4, y: 2026, title: 'Saúde na aldeia: telessaúde no Alto Rio Negro', inst: 'floresta', eixo: 'social', uf: 'AM', mun: 'São Gabriel da Cachoeira', valor: 1380000, prazo: 24, benef: 6500, ods: [3, 10], status: 'execucao', an: 'u_sofia', instr: 'i5', fin: 18, t: { c: 150, e: 141, h: 130, p: 112, s: 95, g: 84 }, notas: [9.5, 8, 8, 8.5, 9, 7], sh: [30, 10, 14, 30, 10, 2, 4],
    resumo: 'Pontos de telessaúde em 14 comunidades do Alto Rio Negro, com conexão via satélite, energia solar e agentes indígenas de saúde formados para o primeiro atendimento.', objetivo: 'Reduzir o tempo até o primeiro atendimento e evitar remoções desnecessárias.', publico: 'Cerca de 6.500 moradores de comunidades indígenas atendidas pelo polo-base.',
    metas: [['Instalar pontos de telessaúde', 'pontos', 14, 3], ['Formar agentes indígenas de saúde', 'agentes', 42, 12], ['Realizar teleatendimentos', 'atendimentos', 3600, 410]] },
  { n: 5, y: 2026, title: 'Guardiões do Tapajós: vigilância territorial comunitária', inst: 'tapajos', eixo: 'povos', uf: 'PA', mun: 'Itaituba e Jacareacanga', valor: 940000, prazo: 6, benef: 1150, ods: [15, 16, 10], status: 'execucao', ch: 'c2', an: 'u_sofia', instr: 'i2', fin: 47, t: { c: 200, e: 190, h: 181, p: 160, s: 140, g: 128 }, notas: [9, 8, 7.5, 8, 8.5, 8], sh: [32, 8, 12, 24, 16, 4, 4],
    resumo: 'Formação de 60 monitores comunitários e uso de drones e aplicativos de registro para vigiar o território e documentar invasões e garimpo ilegal.', objetivo: 'Fortalecer a proteção territorial com dados produzidos pelas próprias comunidades.', publico: 'Comunidades tradicionais e indígenas do médio Tapajós.',
    metas: [['Formar monitores comunitários', 'monitores', 60, 24], ['Realizar expedições de monitoramento', 'expedições', 36, 11], ['Publicar relatórios de ocorrências', 'relatórios', 12, 4]] },
  { n: 6, y: 2026, title: 'Memória viva: restauro do acervo ferroviário', inst: 'trilhos', eixo: 'patrimonio', uf: 'MG', mun: 'São João del-Rei e Tiradentes', valor: 860000, prazo: 14, benef: 9000, ods: [11, 4], status: 'selecionado', an: 'u_rafael', instr: 'i4', t: { c: 120, e: 110, h: 100, p: 80, s: 6 }, notas: [8.5, 8.5, 8, 8, 8, 7.5], sh: [36, 18, 22, 10, 4, 4, 6],
    resumo: 'Restauro e digitalização de 4.200 documentos e 18 peças do acervo ferroviário regional, com abertura de sala de consulta pública.', objetivo: 'Preservar o acervo e torná-lo acessível a pesquisadores, escolas e à comunidade.', publico: 'Estudantes, pesquisadores e moradores da região das Vertentes.',
    metas: [['Restaurar e digitalizar documentos', 'documentos', 4200, 0], ['Restaurar peças do acervo', 'peças', 18, 0], ['Receber visitas escolares', 'visitas', 60, 0]] },
  { n: 7, y: 2026, title: 'Nascentes do Alto Rio Doce', inst: 'serraviva', eixo: 'ambiente', uf: 'MG', mun: 'Conselheiro Pena e Galileia', valor: 680000, prazo: 16, benef: 1240, ods: [6, 15, 2], status: 'banco', ch: 'c1', an: 'u_rafael', t: { c: 95, e: 88, h: 77, p: 58 }, notas: [9.5, 9, 8.5, 8.5, 9, 8.5], sh: [28, 30, 12, 10, 10, 4, 6], dil: { st: 'habilitacao', open: 84, ans: 80, text: 'Anexar a ata de eleição da diretoria atual, pois a enviada venceu em março.', resp: 'Ata registrada em cartório anexada. A nova diretoria tomou posse em abril.' },
    resumo: 'Cercamento e recuperação de 85 nascentes em propriedades de agricultura familiar, com pagamento por serviços ambientais durante a implantação.', objetivo: 'Aumentar a disponibilidade de água e reduzir o assoreamento em microbacias degradadas.', publico: '310 famílias de agricultores familiares.',
    metas: [['Cercar e recuperar nascentes', 'nascentes', 85, 0], ['Implantar sistemas agroflorestais', 'hectares', 40, 0], ['Capacitar famílias agricultoras', 'famílias', 310, 0]] },
  { n: 8, y: 2026, title: 'Laboratório de dados abertos para o controle social', inst: 'aurora', eixo: 'integridade', uf: 'DF', mun: 'Brasília e 35 municípios parceiros', valor: 620000, prazo: 12, benef: 800, ods: [16, 17], status: 'banco', an: 'u_sofia', t: { c: 110, e: 100, h: 90, p: 70 }, notas: [9, 8.5, 9, 8.5, 8, 8.5], sh: [48, 4, 20, 10, 8, 6, 4],
    resumo: 'Ferramentas livres e formação para que conselhos municipais acompanhem contratos, obras e repasses usando dados públicos.', objetivo: 'Ampliar a capacidade de fiscalização de conselhos de saúde, educação e assistência social.', publico: 'Conselheiros municipais de 35 cidades.',
    metas: [['Formar conselheiros municipais', 'conselheiros', 800, 0], ['Publicar painéis de dados abertos', 'painéis', 35, 0], ['Realizar oficinas presenciais', 'oficinas', 24, 0]] },
  { n: 9, y: 2026, title: 'Água Boa: saneamento rural em comunidades quilombolas', inst: 'semiarido', eixo: 'cidadania', uf: 'BA', mun: 'Juazeiro, Curaçá e Sento Sé', valor: 1750000, prazo: 24, benef: 3200, ods: [6, 3, 10], status: 'banco', an: 'u_rafael', t: { c: 85, e: 80, h: 70, p: 49 }, notas: [9.5, 9, 9, 9, 9.5, 8], sh: [22, 34, 20, 12, 6, 2, 4],
    resumo: 'Sistemas simplificados de abastecimento e módulos sanitários em 11 comunidades quilombolas do semiárido, com gestão comunitária da água.', objetivo: 'Garantir acesso regular à água tratada e ao esgotamento sanitário.', publico: '3.200 moradores de comunidades quilombolas certificadas.',
    metas: [['Implantar sistemas de abastecimento', 'sistemas', 11, 0], ['Construir módulos sanitários', 'módulos', 240, 0], ['Formar gestores comunitários da água', 'gestores', 44, 0]] },
  { n: 10, y: 2026, title: 'Brigadas comunitárias do Pantanal', inst: 'pantanal', eixo: 'ambiente', uf: 'MS', mun: 'Corumbá, Ladário e Miranda', valor: 1120000, prazo: 18, benef: 1900, ods: [15, 13], status: 'banco', an: 'u_sofia', t: { c: 130, e: 121, h: 110, p: 92 }, notas: [9, 8, 8, 8, 8.5, 7], sh: [26, 14, 10, 34, 10, 2, 4],
    resumo: 'Formação e equipagem de 8 brigadas comunitárias para prevenção e primeiro combate a incêndios florestais.', objetivo: 'Reduzir o tempo de resposta a focos de incêndio em áreas de difícil acesso.', publico: 'Comunidades pantaneiras e ribeirinhas de três sub-regiões.',
    metas: [['Formar brigadistas comunitários', 'brigadistas', 120, 0], ['Equipar brigadas', 'brigadas', 8, 0], ['Abrir aceiros preventivos', 'km', 180, 0]] },
  { n: 11, y: 2026, title: 'Recomeço: rede de apoio a egressos do sistema prisional', inst: 'recomeco', eixo: 'prisional', uf: 'RS', mun: 'Porto Alegre e região metropolitana', valor: 540000, prazo: 18, benef: 600, ods: [8, 10, 16], status: 'diligencia', an: 'u_rafael', t: { c: 60, e: 52, h: 40 }, sh: [46, 8, 20, 6, 6, 6, 8], dil: { st: 'analise', open: 6, prazo: 4, text: 'Detalhar a memória de cálculo das bolsas de qualificação e anexar o termo de parceria com a Secretaria de Trabalho.' },
    resumo: 'Acolhimento, qualificação profissional e encaminhamento ao trabalho para pessoas egressas do sistema prisional e suas famílias.', objetivo: 'Reduzir a reincidência por meio de trabalho, renda e acompanhamento psicossocial.', publico: '600 pessoas egressas e familiares na região metropolitana.',
    metas: [['Atender pessoas egressas', 'pessoas', 600, 0], ['Concluir cursos de qualificação', 'certificados', 380, 0], ['Encaminhar ao mercado de trabalho', 'contratações', 180, 0]] },
  { n: 12, y: 2026, title: 'Trilhas da Mata Atlântica: turismo de base comunitária', inst: 'serra', eixo: 'ambiente', uf: 'PR', mun: 'Morretes, Antonina e Guaraqueçaba', valor: 560000, prazo: 15, benef: 420, ods: [8, 15, 12], status: 'banco', an: 'u_sofia', t: { c: 140, e: 133, h: 120, p: 101 }, notas: [7.5, 7.5, 7, 7.5, 7.5, 7], sh: [30, 16, 22, 8, 10, 8, 6],
    resumo: 'Estruturação de 4 roteiros de turismo de base comunitária, com sinalização, formação de condutores e manejo de trilhas.', objetivo: 'Gerar renda com conservação em comunidades do entorno de unidades de conservação.', publico: 'Famílias caiçaras e agricultores da Serra do Mar.',
    metas: [['Estruturar roteiros comunitários', 'roteiros', 4, 0], ['Formar condutores locais', 'condutores', 50, 0], ['Sinalizar e manejar trilhas', 'km', 38, 0]] },
  { n: 13, y: 2026, title: 'Escola que protege: prevenção ao trabalho infantil', inst: 'horizonte', eixo: 'cidadania', uf: 'PE', mun: 'Caruaru, Bezerros e Gravatá', valor: 480000, prazo: 12, benef: 5000, ods: [4, 8, 16], status: 'analise', an: 'u_rafael', t: { c: 34, e: 28, h: 14 }, sh: [50, 8, 16, 4, 8, 8, 6],
    resumo: 'Formação de professores e busca ativa em 48 escolas públicas para identificar e encaminhar situações de trabalho infantil.', objetivo: 'Fortalecer a rede de proteção a partir da escola.', publico: '5.000 estudantes e 420 profissionais da educação.',
    metas: [['Formar profissionais da educação', 'profissionais', 420, 0], ['Implantar protocolo de busca ativa', 'escolas', 48, 0], ['Acompanhar casos encaminhados', 'casos', 300, 0]] },
  { n: 14, y: 2026, title: 'Cisternas nas escolas do sertão', inst: 'sertao', eixo: 'social', uf: 'PI', mun: 'Picos, Oeiras e Jaicós', valor: 730000, prazo: 14, benef: 4100, ods: [6, 4, 2], status: 'habilitacao', t: { c: 12, e: 5 }, sh: [20, 44, 20, 4, 6, 2, 4],
    resumo: 'Cisternas de 52 mil litros e hortas pedagógicas em 30 escolas rurais sem abastecimento regular de água.', objetivo: 'Garantir água para consumo e manter as aulas durante a estiagem.', publico: '4.100 estudantes de escolas rurais.',
    metas: [['Construir cisternas escolares', 'cisternas', 30, 0], ['Implantar hortas pedagógicas', 'hortas', 30, 0], ['Formar merendeiras e professores', 'pessoas', 150, 0]] },
  { n: 15, y: 2026, title: 'Observatório da merenda escolar', inst: 'ceara', eixo: 'integridade', uf: 'CE', mun: 'Sobral e 19 municípios da região norte', valor: 390000, prazo: 12, benef: 2000, ods: [2, 16], status: 'rascunho', t: { c: 3 }, sh: [44, 6, 20, 6, 10, 8, 6],
    resumo: 'Rede de mães, pais e estudantes para acompanhar a qualidade e a compra da alimentação escolar em 20 municípios.', objetivo: 'Tornar o gasto com merenda visível e fiscalizável pela comunidade escolar.', publico: 'Conselhos de alimentação escolar e famílias.',
    metas: [['Formar monitores da merenda', 'monitores', 200, 0], ['Publicar boletins municipais', 'boletins', 40, 0]] },
  { n: 16, y: 2026, title: 'Juventude conectada: inclusão digital em assentamentos', inst: 'horizonte', eixo: 'cidadania', uf: 'PE', mun: 'Caruaru e Brejo da Madre de Deus', valor: 350000, prazo: 10, benef: 900, ods: [4, 9, 10], status: 'habilitacao', an: 'u_sofia', t: { c: 20, e: 11 }, sh: [40, 6, 14, 26, 6, 4, 4],
    resumo: 'Salas de informática comunitárias e formação em letramento digital para jovens de seis assentamentos rurais.', objetivo: 'Ampliar o acesso de jovens rurais a serviços públicos digitais e a oportunidades de estudo.', publico: '900 jovens de 15 a 24 anos.',
    metas: [['Montar salas comunitárias', 'salas', 6, 0], ['Formar jovens em letramento digital', 'jovens', 900, 0]] },
  { n: 18, y: 2026, title: 'Quintais agroflorestais do Vale', inst: 'raizes', eixo: 'ambiente', uf: 'MG', mun: 'Resplendor e Itueta', valor: 520000, prazo: 14, benef: 680, ods: [2, 15, 5], status: 'diligencia', ch: 'c1', an: 'u_rafael', t: { c: 25, e: 18 }, sh: [30, 32, 12, 8, 8, 4, 6], dil: { st: 'habilitacao', open: 6, prazo: 4, text: 'Anexar a certidão negativa de débitos trabalhistas atualizada e os termos de anuência dos proprietários das áreas.' },
    resumo: 'Implantação de 170 quintais agroflorestais conduzidos por mulheres agricultoras, com assistência técnica e venda coletiva da produção.', objetivo: 'Recuperar solo e gerar renda com sistemas agroflorestais de pequena escala.', publico: '170 famílias chefiadas por mulheres agricultoras.',
    metas: [['Implantar quintais agroflorestais', 'quintais', 170, 0], ['Prestar assistência técnica', 'visitas', 1360, 0], ['Organizar feiras de venda coletiva', 'feiras', 24, 0]] },
  { n: 19, y: 2026, title: 'Sementes do Vale: banco comunitário de sementes', inst: 'raizes', eixo: 'ambiente', uf: 'MG', mun: 'Governador Valadares', valor: 420000, prazo: 12, benef: 500, ods: [2, 15], status: 'rascunho', t: { c: 2 }, sh: [34, 24, 14, 14, 6, 4, 4],
    resumo: 'Banco comunitário de sementes crioulas e nativas para abastecer viveiros e roças de agricultores familiares.', objetivo: 'Garantir material genético local para a restauração e para a agricultura familiar.', publico: 'Agricultores familiares e viveiristas.',
    metas: [['Implantar casas de sementes', 'casas', 3, 0], ['Coletar e armazenar sementes', 'kg', 1200, 0]] },
  { n: 2, y: 2026, title: 'Festival Maré de Cultura', inst: 'mare', eixo: 'patrimonio', uf: 'RJ', mun: 'Magé', valor: 250000, prazo: 4, benef: 8000, ods: [11], status: 'inabilitado', an: 'u_sofia', t: { c: 170, e: 160, h: 150 }, sh: [10, 10, 60, 6, 4, 6, 4],
    resumo: 'Três dias de apresentações e feira de artesanato na orla de Magé.', objetivo: 'Valorizar a cultura popular local.', publico: 'Moradores e visitantes.',
    metas: [['Realizar apresentações', 'apresentações', 30, 0]] },
  { n: 21, y: 2025, title: 'Mangue vivo: recuperação de manguezais urbanos', inst: 'mare', eixo: 'ambiente', uf: 'RJ', mun: 'Magé e Guapimirim', valor: 720000, prazo: 12, benef: 1300, ods: [14, 13, 11], status: 'contas', an: 'u_rafael', instr: 'i3', fin: 97, t: { c: 520, e: 510, h: 498, p: 480, s: 460, g: 450, ct: 20 }, notas: [9, 8.5, 8.5, 8, 9, 8], sh: [38, 18, 12, 10, 12, 4, 6],
    resumo: 'Replantio de 32 hectares de manguezal e retirada de resíduos em áreas urbanas do fundo da Baía de Guanabara, com catadores de caranguejo.', objetivo: 'Recuperar o manguezal e a renda de quem vive dele.', publico: 'Catadores de caranguejo e pescadores artesanais.',
    metas: [['Replantar manguezal', 'hectares', 32, 32], ['Retirar resíduos sólidos', 'toneladas', 140, 151], ['Formar agentes ambientais', 'agentes', 45, 45]] },
  { n: 20, y: 2025, title: 'Horta na escola: alimentação saudável no semiárido', inst: 'semiarido', eixo: 'social', uf: 'BA', mun: 'Juazeiro e Casa Nova', valor: 460000, prazo: 11, benef: 3600, ods: [2, 4, 3], status: 'auditoria', an: 'u_rafael', instr: 'i5', fin: 100, t: { c: 430, e: 421, h: 410, p: 396, s: 382, g: 372, ct: 36, ok: 9 }, notas: [9, 8.5, 8.5, 8.5, 9, 8.5], sh: [34, 30, 12, 8, 6, 4, 6],
    resumo: 'Hortas pedagógicas em 24 escolas municipais, com formação de merendeiras e professores e uso da produção na merenda.', objetivo: 'Melhorar a alimentação escolar e ensinar práticas de convivência com o semiárido.', publico: '3.600 estudantes da rede municipal.',
    metas: [['Implantar hortas pedagógicas', 'escolas', 24, 24], ['Formar merendeiras e professores', 'pessoas', 180, 196], ['Produzir hortaliças para a merenda', 'toneladas', 18, 21]] },
  { n: 17, y: 2025, title: 'Consumidor 60+: educação financeira para pessoas idosas', inst: 'rede', eixo: 'consumidor', uf: 'SP', mun: 'Campinas, Sumaré e Hortolândia', valor: 310000, prazo: 10, benef: 4800, ods: [10, 12], status: 'concluido', ch: 'c4', an: 'u_sofia', instr: 'i6', fin: 100, t: { c: 470, e: 462, h: 452, p: 436, s: 420, g: 410, ct: 80, ok: 62, au: 48 }, notas: [8.5, 9, 8.5, 9, 8.5, 8], sh: [46, 10, 16, 4, 6, 12, 6],
    resumo: 'Oficinas e plantão de orientação sobre crédito consignado, golpes digitais e superendividamento para pessoas idosas.', objetivo: 'Prevenir o superendividamento e fraudes contra pessoas idosas.', publico: '4.800 pessoas com 60 anos ou mais.',
    metas: [['Realizar oficinas de educação financeira', 'oficinas', 96, 96], ['Atender no plantão de orientação', 'atendimentos', 2400, 2630], ['Distribuir guias impressos', 'guias', 10000, 10000]] },
];

const INSTR: any[] = [
  { id: 'i1', tipo: 'TAC', numero: 'TAC nº 014/2025', unidade: 'PR-MG', membroId: 'u_helena', tema: 'ambiente', uf: 'MG', valor: 4200000, ago: 330, objeto: 'Reparação de danos socioambientais em afluentes do Rio Doce.' },
  { id: 'i2', tipo: 'Acordo judicial', numero: 'Acordo em ACP nº 1002/2025', unidade: 'PR-PA', membroId: 'u_caio', tema: 'povos', uf: 'PA', valor: 1500000, ago: 260, objeto: 'Compensação por danos a territórios tradicionais no médio Tapajós.' },
  { id: 'i3', tipo: 'Sentença em ACP', numero: 'Sentença em ACP nº 0871/2024', unidade: 'PR-RJ', membroId: 'u_livia', tema: 'ambiente', uf: 'RJ', valor: 900000, ago: 600, objeto: 'Indenização por lançamento irregular de efluentes na Baía de Guanabara.' },
  { id: 'i4', tipo: 'TAC', numero: 'TAC nº 009/2026', unidade: 'PR-MG', membroId: 'u_helena', tema: 'patrimonio', uf: 'MG', valor: 1000000, ago: 150, objeto: 'Compensação por dano a bem ferroviário tombado.' },
  { id: 'i5', tipo: 'Acordo de leniência', numero: 'Acordo de leniência nº 03/2024', unidade: '5ª CCR', membroId: 'u_augusto', tema: 'livre', uf: 'BR', valor: 6800000, ago: 540, objeto: 'Parcela destinada a projetos sociais, sem vinculação temática.' },
  { id: 'i6', tipo: 'ANPC', numero: 'ANPC nº 008/2025', unidade: 'PR-SP', membroId: 'u_beatriz', tema: 'consumidor', uf: 'SP', valor: 400000, ago: 500, objeto: 'Reparação por práticas abusivas em crédito consignado.' },
  { id: 'i7', tipo: 'TAC', numero: 'TAC nº 027/2026', unidade: 'PR-BA', membroId: 'u_jonas', tema: 'cidadania', uf: 'BA', valor: 2400000, ago: 70, objeto: 'Compensação por falhas no abastecimento de água em comunidades rurais.' },
  { id: 'i8', tipo: 'ANPP', numero: 'ANPP nº 112/2026', unidade: 'PR-MS', membroId: 'u_ines', tema: 'ambiente', uf: 'MS', valor: 350000, ago: 40, objeto: 'Prestação pecuniária por crime ambiental.' },
];

const IMGS: Record<number, string[]> = {
  3: ['Mutirão de plantio em Resplendor', 'Viveiro comunitário de Aimorés', 'Formação de viveiristas'],
  4: ['Instalação do primeiro ponto de telessaúde', 'Formação de agentes indígenas de saúde'],
  5: ['Oficina de drones com monitores', 'Expedição de monitoramento no rio'],
  21: ['Replantio no manguezal', 'Retirada de resíduos da margem', 'Agentes ambientais formados'],
  17: ['Oficina de educação financeira', 'Plantão de orientação'],
  20: ['Horta pedagógica em Casa Nova', 'Colheita para a merenda', 'Formação de merendeiras'],
};
const REL: Record<number, any[]> = {
  3: [['Relatório parcial nº 1', '1º trimestre', 96, 'atestado', 88], ['Relatório parcial nº 2', '2º trimestre', 9, 'aguardando']],
  4: [['Relatório parcial nº 1', '1º trimestre', 4, 'aguardando']],
  5: [['Relatório parcial nº 1', '1º trimestre', 44, 'atestado', 38]],
  21: [['Relatório parcial nº 1', '1º semestre', 270, 'atestado', 262], ['Relatório parcial nº 2', '2º semestre', 110, 'atestado', 101], ['Relatório final', 'Encerramento', 20, 'aguardando']],
  17: [['Relatório parcial nº 1', '1º semestre', 250, 'atestado', 243], ['Relatório final', 'Encerramento', 80, 'atestado', 70]],
  20: [['Relatório parcial nº 1', '1º semestre', 260, 'atestado', 252], ['Relatório parcial nº 2', '2º semestre', 120, 'atestado', 112], ['Relatório final', 'Encerramento', 38, 'atestado', 30]],
};

export function buildSeed() {
  const users: any[] = [
    { id: 'u_helena', name: 'Helena Duarte', title: 'Procuradora da República', org: 'PR-MG', unit: 'PR-MG', roleId: 'procurador', persona: 'Julga projetos do banco e destina recursos de TACs e acordos.' },
    { id: 'u_rafael', name: 'Rafael Monteiro', title: 'Analista técnico', org: 'Núcleo de Análise de Projetos', unit: 'PGR', roleId: 'analista', persona: 'Confere a habilitação, emite parecer e analisa prestações de contas.' },
    { id: 'u_marina', name: 'Marina Lopes', title: 'Coordenadora de projetos', org: 'Instituto Raízes do Vale', roleId: 'proponente', instId: 'raizes', persona: 'Inscreve projetos, responde diligências e presta contas.' },
    { id: 'u_cecilia', name: 'Cecília Andrade', title: 'Gestora nacional', org: 'Coordenação Nacional de Projetos', unit: 'PGR', roleId: 'gestor', persona: 'Abre chamadas, distribui análises e homologa seleções.' },
    { id: 'u_otavio', name: 'Otávio Brandão', title: 'Auditor', org: 'Auditoria Interna', unit: 'PGR', roleId: 'auditor', persona: 'Audita a prestação de contas, emite o parecer de auditoria e confere a trilha.' },
    { id: 'u_tiago', name: 'Tiago Nogueira', title: 'Administrador do sistema', org: 'Tecnologia da Informação', unit: 'PGR', roleId: 'admin', persona: 'Define perfis, permissões, usuários e integrações.' },
    { id: 'u_sofia', name: 'Sofia Reis', title: 'Analista técnica', org: 'Núcleo de Análise de Projetos', unit: 'PGR', roleId: 'analista' },
    { id: 'u_caio', name: 'Caio Barreto', title: 'Procurador da República', org: 'PR-PA', unit: 'PR-PA', roleId: 'procurador' },
    { id: 'u_livia', name: 'Lívia Sampaio', title: 'Procuradora da República', org: 'PR-RJ', unit: 'PR-RJ', roleId: 'procurador' },
    { id: 'u_augusto', name: 'Augusto Ferraz', title: 'Subprocurador-Geral da República', org: '5ª CCR', unit: '5ª CCR', roleId: 'procurador' },
    { id: 'u_beatriz', name: 'Beatriz Nakamura', title: 'Procuradora da República', org: 'PR-SP', unit: 'PR-SP', roleId: 'procurador' },
    { id: 'u_jonas', name: 'Jonas Pimentel', title: 'Procurador da República', org: 'PR-BA', unit: 'PR-BA', roleId: 'procurador' },
    { id: 'u_ines', name: 'Inês Valadão', title: 'Procuradora da República', org: 'PR-MS', unit: 'PR-MS', roleId: 'procurador' },
  ];
  users.forEach(u => { u.email = slug(u.name.split(' ')[0]) + '.' + slug(u.name.split(' ').slice(-1)[0]) + (u.instId ? '@raizesdovale.example' : '@mpf.example'); u.active = true; });

  const instituicoes = INST.map(([id, name, tipo, uf, cidade, resp, ano], i) => {
    const pend = id === 'ceara';
    if (id !== 'raizes') users.push({ id: 'u_i_' + id, name: resp, title: 'Responsável legal', org: name, roleId: 'proponente', instId: id, email: slug(resp.split(' ')[0]) + '@' + slug(name.split(' ').slice(-2).join('')) + '.example', active: true });
    return { id, name, tipo, uf, cidade, responsavel: resp, respUserId: id === 'raizes' ? 'u_marina' : 'u_i_' + id, fundacao: ano, cnpj: `99.${pad(101 + i * 37, 3)}.${pad(201 + i * 53, 3)}/0001-${pad(11 + i * 3, 2)}`, email: 'contato@' + slug(name.split(' ').slice(-2).join('')) + '.example', telefone: `(${31 + i}) 9${pad(8123 + i * 211)}-${pad(4410 + i * 97)}`, situacao: pend ? 'pendente' : 'habilitada', docs: INST_DOCS.map((d, j) => ({ name: d, ok: !(pend && j >= 3), validade: daysAhead(40 + j * 60) })), createdAt: daysAgo(700 - i * 30) };
  });
  const respOf = (instId: string) => instituicoes.find(i => i.id === instId)!.respUserId;

  const ev: any[] = []; const media: any[] = [];
  const log = (ago: number, userId: string, action: string, entity: string, entityId: string, detail: string, h = 10) => ev.push({ ts: daysAgo(ago, h + (ev.length % 7), (ev.length * 13) % 60), userId, action, entity, entityId, detail });
  const instrumentos = INSTR.map(({ ago, ...i }) => { log(ago, i.membroId, 'Instrumento registrado', 'instrumento', i.id, `${i.numero} registrado com ${fmtBRL(i.valor)} disponíveis para destinação.`); return { ...i, date: daysAgo(ago) }; });

  const chamadas = [
    { id: 'c1', code: 'Chamada 01/2026', title: 'Recuperação de bacias e nascentes', eixo: 'ambiente', unidade: 'PR-MG', ufs: ['MG', 'ES'], abertura: daysAgo(120), encerramento: daysAhead(18), valor: 3000000, teto: 1500000, desc: 'Seleciona projetos de restauração florestal, proteção de nascentes e geração de renda associada em municípios das bacias atingidas. Os projetos aprovados entram no banco e podem receber recursos de termos de ajustamento de conduta firmados na região.', requisitos: ['Três anos de atuação comprovada na área', 'Atuação nos municípios listados no edital', 'Plano de trabalho com metas mensuráveis', 'Custos administrativos de até 15% do orçamento'] },
    { id: 'c2', code: 'Chamada 02/2026', title: 'Proteção territorial de povos e comunidades tradicionais', eixo: 'povos', unidade: '6ª CCR', ufs: ['PA', 'AM', 'MT', 'RO'], abertura: daysAgo(60), encerramento: daysAhead(45), valor: 2500000, teto: 1000000, desc: 'Apoia iniciativas de vigilância, gestão territorial e fortalecimento de organizações de povos indígenas e comunidades tradicionais na Amazônia Legal.', requisitos: ['Organização representativa ou parceira formal das comunidades', 'Consulta prévia às comunidades documentada', 'Plano de segurança para as equipes de campo'] },
    { id: 'c3', code: 'Chamada 03/2026', title: 'Controle social e dados abertos', eixo: 'integridade', unidade: '5ª CCR', ufs: ['BR'], abertura: daysAhead(12), encerramento: daysAhead(72), valor: 2000000, teto: 700000, desc: 'Financia ferramentas, formação e redes que ampliem a capacidade da sociedade de acompanhar o gasto público. Abrangência nacional.', requisitos: ['Uso de software livre e dados em formato aberto', 'Parceria com ao menos um conselho municipal ou estadual', 'Plano de continuidade após o projeto'] },
    { id: 'c4', code: 'Chamada 04/2025', title: 'Educação para o consumo', eixo: 'consumidor', unidade: 'PR-SP', ufs: ['SP'], abertura: daysAgo(520), encerramento: daysAgo(465), valor: 400000, teto: 400000, desc: 'Projetos de educação financeira e prevenção a fraudes contra consumidores vulneráveis no estado de São Paulo.', requisitos: ['Experiência com o público atendido', 'Material didático acessível'] },
  ].map(c => ({ ...c, anexos: [{ title: 'Edital completo', ext: 'pdf' }, { title: 'Modelo de plano de trabalho', ext: 'pdf' }, { title: 'Planilha de orçamento', ext: 'csv' }] }));
  chamadas.forEach(c => log(Math.max(1, Math.round((Date.now() - new Date(c.abertura).getTime()) / 86400000) + 6), 'u_cecilia', 'Chamada publicada', 'chamada', c.id, `${c.code} publicada: ${c.title}.`));

  const projects = P.map((s: any) => {
    const r = rng(s.n * 7919); const id = 'p' + s.n; const code = `SIGAP-${s.y}-${pad(s.n)}`; const t = s.t; const st = s.status;
    const resp = respOf(s.inst); const an = s.an || null; const sent = st !== 'rascunho';
    let acc = 0;
    const orcamento = RUBRICAS.map((rb, i) => { const v = i === RUBRICAS.length - 1 ? s.valor - acc : Math.round(s.valor * s.sh[i] / 100 / 100) * 100; acc += v; return { id: 'r' + (i + 1), rubrica: rb, valor: v }; });
    const metas = s.metas.map((m: any, i: number) => ({ id: 'm' + (i + 1), title: m[0], unidade: m[1], alvo: m[2], realizado: m[3], prazoMes: Math.round(s.prazo * (i + 2) / (s.metas.length + 1)) }));
    const p: any = { id, code, n: s.n, title: s.title, instId: s.inst, eixo: s.eixo, uf: s.uf, unidade: unidadeDe(s.uf), municipios: s.mun, valor: s.valor, prazo: s.prazo, beneficiarios: s.benef, ods: s.ods, resumo: s.resumo, objetivo: s.objetivo, publico: s.publico, status: st, chamadaId: s.ch || null, analistaId: an, metas, orcamento, diligencias: [], relatorios: [], despesas: [], createdAt: daysAgo(t.c), updatedAt: daysAgo(t.c), art: s.n, publico_portal: ['selecionado', 'execucao', 'contas', 'auditoria', 'concluido'].includes(st) };
    log(t.c, resp, 'Projeto criado', 'projeto', id, `Rascunho de “${s.title}” criado.`);
    media.push({ id: `md_${s.n}_pt`, projectId: id, kind: 'doc', title: 'Plano de trabalho assinado', ext: 'pdf', visibility: 'interno', etapa: 'Inscrição', by: resp, date: daysAgo(t.c - 1), size: 184000 + s.n * 911, text: `PLANO DE TRABALHO\n\n${s.title}\n\nObjetivo\n${s.objetivo}\n\nPúblico\n${s.publico}\n\nMetas\n${s.metas.map((m: any) => `- ${m[0]}: ${m[2].toLocaleString('pt-BR')} ${m[1]}`).join('\n')}\n\nValor pleiteado: ${fmtBRL(s.valor)}\nPrazo: ${s.prazo} meses\n\nDocumento de demonstração gerado pelo protótipo.` });
    if (sent) {
      p.sei = `SEI ${s.y}.${pad(4200 + s.n * 37, 6)}`; p.updatedAt = daysAgo(t.e);
      log(t.e, resp, 'Inscrição enviada', 'projeto', id, `Inscrição enviada para habilitação. Processo ${p.sei} gerado.`);
      media.push({ id: `md_${s.n}_cert`, projectId: id, kind: 'doc', title: 'Certidões da instituição', ext: 'pdf', visibility: 'restrito', etapa: 'Habilitação', by: resp, date: daysAgo(t.e), size: 420000 + s.n * 500 });
      if (an) log(t.e - 1, 'u_cecilia', 'Análise distribuída', 'projeto', id, `Distribuído para ${users.find(u => u.id === an).name}.`);
    }
    if (s.dil) {
      const d: any = { id: 'dl' + s.n, stage: s.dil.st, openedAt: daysAgo(s.dil.open), by: an, text: s.dil.text, prazo: s.dil.prazo != null ? daysAhead(s.dil.prazo) : daysAgo(s.dil.open - 10) };
      log(s.dil.open, an, 'Diligência aberta', 'projeto', id, s.dil.text);
      if (s.dil.ans != null) { d.resposta = s.dil.resp; d.respondedAt = daysAgo(s.dil.ans); log(s.dil.ans, resp, 'Diligência respondida', 'projeto', id, s.dil.resp); }
      p.diligencias.push(d); if (st === 'diligencia') { p.diligStage = s.dil.st; p.updatedAt = d.openedAt; }
    }
    if (t.h != null) {
      const ok = st !== 'inabilitado';
      p.hab = { by: an, date: daysAgo(t.h), checklist: CHECK_HAB.map((_, i) => ok || i < 1), decisao: ok ? 'habilitar' : 'inabilitar', texto: ok ? 'Documentação conferida e válida.' : 'O objeto é a realização de evento, sem relação com reparação de dano ou com os eixos financiáveis. Faltam comprovação de experiência e plano de trabalho assinado.' };
      p.updatedAt = p.hab.date;
      log(t.h, an, ok ? 'Projeto habilitado' : 'Projeto inabilitado', 'projeto', id, ok ? 'Documentação conferida. Projeto segue para análise técnica.' : p.hab.texto);
    }
    if (t.p != null) {
      const notas = Object.fromEntries(CRITERIA_DEFAULT.map((c, i) => [c.id, s.notas[i]])); const nota = notaFinal(notas, CRITERIA_DEFAULT);
      p.parecer = { by: an, date: daysAgo(t.p), notas, nota, legal: CHECK_LEGAL.map(() => true), decisao: 'aprovar', texto: `O projeto responde a um problema bem delimitado e apresenta metas mensuráveis. A instituição comprova experiência compatível e o orçamento está coerente com as entregas. Recomenda-se a inclusão no banco de projetos.` };
      p.updatedAt = p.parecer.date;
      log(t.p, an, 'Parecer técnico emitido', 'projeto', id, `Nota ${String(nota).replace('.', ',')}. Projeto aprovado e incluído no banco de projetos.`);
    }
    if (t.s != null) {
      const ins = INSTR.find(i => i.id === s.instr);
      p.selecao = { by: ins.membroId, instrumentoId: ins.id, valor: s.valor, date: daysAgo(t.s), justificativa: `Projeto aderente ao objeto do instrumento (${ins.objeto.replace(/\.$/, '').toLowerCase()}) e com a melhor avaliação técnica entre os compatíveis.` };
      p.simp = `ÚNICO ${s.y}.${pad(900 + s.n * 11, 7)}`; p.updatedAt = p.selecao.date;
      log(t.s, ins.membroId, 'Projeto selecionado', 'projeto', id, `${fmtBRL(s.valor)} destinados via ${ins.numero}. Movimentação ${p.simp} registrada.`);
    }
    if (t.g != null) {
      const fim = new Date(daysAgo(t.g)); fim.setMonth(fim.getMonth() + s.prazo);
      p.homolog = { by: 'u_cecilia', date: daysAgo(t.g), termo: `Termo de destinação nº ${pad(s.n, 3)}/${s.y}` };
      p.exec = { inicio: daysAgo(t.g), fim: fim.toISOString() }; p.updatedAt = p.homolog.date;
      log(t.g, 'u_cecilia', 'Seleção homologada', 'projeto', id, `${p.homolog.termo} assinado. Execução iniciada.`);
      // despesas
      const desp: any[] = [];
      orcamento.forEach((rb, ri) => {
        const target = rb.valor * s.fin / 100; const k = Math.max(1, Math.round(1 + r() * 2)); let a = 0;
        for (let j = 0; j < k; j++) {
          const v = j === k - 1 ? Math.round((target - a) / 10) * 10 : Math.round(target / k * (0.7 + r() * 0.6) / 10) * 10; if (v <= 0) continue; a += v;
          const span = Math.min(t.g, s.prazo * 30) - 6; const ago = Math.max(t.ct != null ? t.ct + 2 : 2, Math.round(t.g - 4 - span * (j + 0.4 + ri * 0.11) / (k + 0.5)));
          const f = FORN[rb.rubrica]; desp.push({ id: `d${s.n}_${ri}_${j}`, date: daysAgo(ago), rubrica: rb.rubrica, fornecedor: f[Math.floor(r() * f.length)], descricao: `${rb.rubrica} · parcela ${j + 1}`, valor: v, doc: 'NF ' + Math.floor(1000 + r() * 8999), status: 'aprovada' });
        }
      });
      desp.sort((a, b) => a.date.localeCompare(b.date));
      if (st === 'execucao') desp.slice(-3).forEach(d => { d.status = 'pendente'; });
      if (st === 'contas') { desp.slice(-5).forEach(d => { d.status = 'pendente'; }); const g = desp[Math.floor(desp.length / 2)]; g.status = 'glosada'; g.obs = 'Nota fiscal emitida antes do início da vigência.'; }
      desp.filter(d => d.status === 'pendente').forEach(d => log(Math.max(1, Math.round((Date.now() - new Date(d.date).getTime()) / 86400000) - 1), resp, 'Despesa lançada', 'projeto', id, `${d.fornecedor}: ${fmtBRL(d.valor)} (${d.rubrica}).`));
      p.despesas = desp;
      (IMGS[s.n] || []).forEach((title, i) => media.push({ id: `md_${s.n}_im${i}`, projectId: id, kind: 'image', title, visibility: 'publico', etapa: 'Monitoramento', by: resp, date: daysAgo(Math.max(3, Math.round(t.g * (0.75 - i * 0.22)))), art: { eixo: s.eixo, seed: s.n * 10 + i + 1 }, desc: 'Imagem de demonstração gerada pelo protótipo.' }));
      media.push({ id: `md_${s.n}_lk`, projectId: id, kind: 'link', title: 'Página do projeto', url: `https://www.example.org/projetos/${slug(s.title).slice(0, 18)}`, visibility: 'publico', etapa: 'Monitoramento', by: resp, date: daysAgo(t.g - 2) });
      if (IMGS[s.n]) media.push({ id: `md_${s.n}_vd`, projectId: id, kind: 'link', title: 'Vídeo: relato de campo', url: `https://www.example.org/videos/${slug(s.title).slice(0, 14)}.mp4`, visibility: 'publico', etapa: 'Monitoramento', by: resp, date: daysAgo(Math.max(2, Math.round(t.g * 0.4))) });
      (REL[s.n] || []).forEach(([title, periodo, ago, status, atAgo], i) => {
        const mid = `md_${s.n}_rl${i}`;
        const text = `${title.toUpperCase()} · ${periodo}\n${s.title}\n\nResumo do período\nAs atividades seguiram o cronograma do plano de trabalho. ${metas.map((m: any) => `${m.title}: ${m.realizado.toLocaleString('pt-BR')} de ${m.alvo.toLocaleString('pt-BR')} ${m.unidade}.`).join(' ')}\n\nDificuldades\nAtrasos pontuais de fornecedores e períodos de chuva exigiram remanejamento de datas, sem impacto no prazo final.\n\nPróximos passos\nManter o ritmo de execução e registrar as evidências de cada entrega.\n\nDocumento de demonstração gerado pelo protótipo.`;
        media.push({ id: mid, projectId: id, kind: 'doc', title: `${title} (${periodo})`, ext: 'pdf', visibility: 'interno', etapa: 'Monitoramento', by: resp, date: daysAgo(ago), size: 260000 + i * 31000, text });
        const imgIds = (IMGS[s.n] || []).slice(0, i + 1).map((_, k) => `md_${s.n}_im${k}`);
        p.relatorios.push({ id: `rl${s.n}_${i}`, title, periodo, date: daysAgo(ago), text: 'Atividades do período, evolução das metas e evidências anexas.', mediaIds: [mid, ...imgIds], status, atestadoPor: status === 'atestado' ? an : null, atestadoEm: status === 'atestado' ? daysAgo(atAgo) : null });
        log(ago, resp, 'Relatório enviado', 'projeto', id, `${title} (${periodo}) enviado com ${1 + imgIds.length} anexos.`);
        if (status === 'atestado') log(atAgo, an, 'Relatório atestado', 'projeto', id, `${title}: regularidade atestada.`);
      });
    }
    if (t.ct != null) { p.contas = { enviadaEm: daysAgo(t.ct) }; p.updatedAt = p.contas.enviadaEm; log(t.ct, resp, 'Prestação de contas enviada', 'projeto', id, 'Prestação de contas final enviada para análise.'); }
    if (t.ok != null) { p.contas.aprovadaEm = daysAgo(t.ok); p.contas.by = an; p.contas.parecer = 'Despesas comprovadas e compatíveis com o plano de trabalho. Metas cumpridas. Prestação de contas aprovada.'; p.updatedAt = p.contas.aprovadaEm; log(t.ok, an, 'Prestação de contas aprovada', 'projeto', id, 'Contas aprovadas. Projeto segue para auditoria de conformidade.'); }
    if (t.au != null) {
      const amostra = p.despesas.filter((_: any, i: number) => i % 3 === 0).slice(0, 6).map((d: any) => d.id);
      p.auditoria = { by: 'u_otavio', date: daysAgo(t.au), checklist: Object.fromEntries(CHECK_AUDIT.map(c => [c.id, true])), amostra, conclusao: 'regular', achados: 'Nenhuma impropriedade relevante na amostra examinada.', texto: 'Amostra de despesas conferida com os comprovantes, metas comprovadas por evidências e trilha íntegra. A aplicação dos recursos é regular. Projeto encerrado.' };
      p.updatedAt = p.auditoria.date;
      log(t.au, 'u_otavio', 'Auditoria concluída', 'projeto', id, `Parecer de auditoria: regular. ${amostra.length} despesas examinadas. Projeto encerrado e publicado no portal.`);
    }
    return p;
  });

  log(400, 'u_tiago', 'Perfil alterado', 'perfil', 'analista', 'Permissão “Decidir” em Prestação de contas concedida ao perfil Analista técnico.');
  log(30, 'u_tiago', 'Usuário convidado', 'usuario', 'u_ines', 'Inês Valadão convidada com o perfil Procurador(a), unidade PR-MS.');
  ev.sort((a, b) => a.ts.localeCompare(b.ts));
  const rl = roles(); let prev = 'GENESIS';
  const audit = ev.map((e, i) => { const u = users.find(x => x.id === e.userId); const x: any = { seq: i + 1, ts: e.ts, userId: e.userId, userName: u?.name || 'Sistema', roleName: rl.find(r => r.id === u?.roleId)?.name || '—', action: e.action, entity: e.entity, entityId: e.entityId, detail: e.detail, prev }; x.hash = hashEvent(x); prev = x.hash; return x; });

  return {
    v: 4, session: null as any, roles: rl, users, instituicoes, projects, instrumentos, chamadas, media, audit,
    config: { criteria: CRITERIA_DEFAULT.map(c => ({ ...c })), notaMinima: 6, limiteAdm: 15, prazoDiligencia: 10 },
    seq: { project: 30, termo: 30 }, tamper: null as any,
  };
}
