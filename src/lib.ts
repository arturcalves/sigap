// SIGAP · utilitários, constantes de domínio e seletores puros

export const DAY = 86400000;
export const nowIso = () => new Date().toISOString();
export const daysAgo = (n: number, h = 10, m = 0) => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(h, m, 0, 0); return d.toISOString(); };
export const daysAhead = (n: number) => daysAgo(-n, 18, 0);
export const daysUntil = (iso?: string) => iso ? Math.ceil((new Date(iso).getTime() - Date.now()) / DAY) : 0;
export const fmtBRL = (v: number) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
export const fmtNum = (v: number) => (v || 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 });
export const fmtCompact = (v: number) => {
  v = v || 0;
  if (Math.abs(v) >= 1e6) return 'R$ ' + (v / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + ' mi';
  if (Math.abs(v) >= 1e3) return 'R$ ' + Math.round(v / 1e3).toLocaleString('pt-BR') + ' mil';
  return fmtBRL(v);
};
export const fmtDate = (iso?: string) => iso ? new Date(iso).toLocaleDateString('pt-BR') : '—';
export const fmtDateTime = (iso?: string) => iso ? new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
export const fmtAgo = (iso?: string) => {
  if (!iso) return '—';
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / DAY);
  if (d <= 0) return 'hoje'; if (d === 1) return 'ontem'; if (d < 30) return `há ${d} dias`;
  const m = Math.floor(d / 30); return m < 12 ? `há ${m} ${m === 1 ? 'mês' : 'meses'}` : `há ${Math.floor(m / 12)} ano(s)`;
};
export const fmtBytes = (b?: number) => !b ? '' : b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(0) + ' KB' : (b / 1048576).toFixed(1) + ' MB';
export const pct = (a: number, b: number) => b ? Math.round((a / b) * 100) : 0;
export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const uid = (p = 'x') => p + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3);
export const initials = (name = '') => name.split(/\s+/).filter(w => w.length > 2 || /^[A-Z]/.test(w)).slice(0, 2).map(w => w[0]).join('').toUpperCase();
export const sum = (arr: any[], f: (x: any) => number) => arr.reduce((s, x) => s + (f(x) || 0), 0);
export const norm = (s = '') => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/* ---------- SHA-256 síncrono (trilha de auditoria encadeada) ---------- */
const K = new Uint32Array([0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2]);
export function sha256(msg: string): string {
  const bytes = new TextEncoder().encode(msg); const l = bytes.length;
  const buf = new Uint8Array(((l + 9 + 63) >> 6) << 6); buf.set(bytes); buf[l] = 0x80;
  const dv = new DataView(buf.buffer);
  dv.setUint32(buf.length - 4, (l * 8) >>> 0); dv.setUint32(buf.length - 8, Math.floor(l / 0x20000000));
  const H = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);
  const w = new Uint32Array(64); const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n));
  for (let i = 0; i < buf.length; i += 64) {
    for (let t = 0; t < 16; t++) w[t] = dv.getUint32(i + t * 4);
    for (let t = 16; t < 64; t++) { const a = w[t - 15], b = w[t - 2]; w[t] = (w[t - 16] + (rotr(a, 7) ^ rotr(a, 18) ^ (a >>> 3)) + w[t - 7] + (rotr(b, 17) ^ rotr(b, 19) ^ (b >>> 10))) | 0; }
    let a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
    for (let t = 0; t < 64; t++) {
      const t1 = (h + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + K[t] + w[t]) | 0;
      const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    H[0] += a; H[1] += b; H[2] += c; H[3] += d; H[4] += e; H[5] += f; H[6] += g; H[7] += h;
  }
  return Array.from(H).map(x => x.toString(16).padStart(8, '0')).join('');
}

/* ---------- ciclo de vida ---------- */
export const STAGES = [
  { id: 'inscricao', n: '01', label: 'Inscrição', desc: 'A instituição preenche e envia a proposta.' },
  { id: 'habilitacao', n: '02', label: 'Habilitação', desc: 'Conferência documental da instituição e da proposta.' },
  { id: 'analise', n: '03', label: 'Análise técnica', desc: 'Parecer técnico e jurídico com pontuação.' },
  { id: 'julgamento', n: '04', label: 'Julgamento', desc: 'O projeto fica no banco até um membro selecioná-lo e destinar recurso.' },
  { id: 'homologacao', n: '05', label: 'Homologação', desc: 'A seleção é homologada e o termo é assinado.' },
  { id: 'monitoramento', n: '06', label: 'Monitoramento', desc: 'Execução acompanhada por metas, relatórios e evidências.' },
  { id: 'contas', n: '07', label: 'Prestação de contas e auditoria', short: 'Contas e auditoria', desc: 'Análise das despesas, parecer de contas, auditoria de conformidade e encerramento.' },
];
export const STATUS: Record<string, any> = {
  rascunho: { label: 'Rascunho', stage: 0, tone: 'neutral' },
  habilitacao: { label: 'Em habilitação', stage: 1, tone: 'warn' },
  analise: { label: 'Em análise técnica', stage: 2, tone: 'warn' },
  diligencia: { label: 'Em diligência', stage: 2, tone: 'warn' },
  banco: { label: 'No banco de projetos', stage: 3, tone: 'info' },
  selecionado: { label: 'Aguarda homologação', stage: 4, tone: 'info' },
  execucao: { label: 'Em execução', stage: 5, tone: 'ok' },
  contas: { label: 'Prestação de contas', stage: 6, tone: 'warn' },
  auditoria: { label: 'Em auditoria', stage: 6, tone: 'warn' },
  concluido: { label: 'Concluído', stage: 6, tone: 'navy', done: true },
  inabilitado: { label: 'Inabilitado', stage: 1, tone: 'danger', stop: true },
  reprovado: { label: 'Não aprovado', stage: 2, tone: 'danger', stop: true },
};
export const stageOf = (p: any) => p.status === 'diligencia' ? (p.diligStage === 'habilitacao' ? 1 : 2) : STATUS[p.status].stage;
export const APOIADOS = ['selecionado', 'execucao', 'contas', 'auditoria', 'concluido'];
export const EXEC = ['execucao', 'contas', 'auditoria', 'concluido'];

export const EIXOS = [
  { id: 'ambiente', label: 'Meio ambiente', ref: '4ª CCR', c: ['#D4EFE2', '#86C9A6', '#3E9C78', '#1E6B55'] },
  { id: 'patrimonio', label: 'Patrimônio cultural', ref: '4ª CCR', c: ['#F3E4CC', '#D9AC6E', '#B17A40', '#7A4E26'] },
  { id: 'povos', label: 'Povos e comunidades tradicionais', ref: '6ª CCR', c: ['#F8DCCB', '#E89465', '#C35F3A', '#8A3A24'] },
  { id: 'cidadania', label: 'Direitos do cidadão', ref: 'PFDC', c: ['#DEE0F7', '#A2A6E6', '#676BC8', '#3E4196'] },
  { id: 'integridade', label: 'Integridade e controle social', ref: '5ª CCR', c: ['#D3E4F7', '#86B3EA', '#3F80D2', '#12508F'] },
  { id: 'consumidor', label: 'Consumidor e ordem econômica', ref: '3ª CCR', c: ['#D0EEF2', '#78C9D4', '#2F9BAB', '#166F7E'] },
  { id: 'social', label: 'Educação e saúde', ref: '1ª CCR', c: ['#FADFE8', '#EE9DB7', '#D2628A', '#983763'] },
  { id: 'prisional', label: 'Sistema prisional', ref: '7ª CCR', c: ['#E3E6EC', '#A7B0C0', '#727D93', '#465066'] },
];
export const eixo = (id: string) => EIXOS.find(e => e.id === id) || { id, label: id === 'livre' ? 'Sem vinculação temática' : id, ref: '', c: ['#E3E6EC', '#A7B0C0', '#727D93', '#465066'] };

export const UF: Record<string, string> = { AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia', CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás', MA: 'Maranhão', MT: 'Mato Grosso', MS: 'Mato Grosso do Sul', MG: 'Minas Gerais', PA: 'Pará', PB: 'Paraíba', PR: 'Paraná', PE: 'Pernambuco', PI: 'Piauí', RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte', RS: 'Rio Grande do Sul', RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina', SP: 'São Paulo', SE: 'Sergipe', TO: 'Tocantins' };
export const ODS = ['', 'Erradicação da pobreza', 'Fome zero e agricultura sustentável', 'Saúde e bem-estar', 'Educação de qualidade', 'Igualdade de gênero', 'Água potável e saneamento', 'Energia limpa e acessível', 'Trabalho decente e crescimento econômico', 'Indústria, inovação e infraestrutura', 'Redução das desigualdades', 'Cidades e comunidades sustentáveis', 'Consumo e produção responsáveis', 'Ação contra a mudança global do clima', 'Vida na água', 'Vida terrestre', 'Paz, justiça e instituições eficazes', 'Parcerias e meios de implementação'];
export const RUBRICAS = ['Equipe técnica', 'Materiais e insumos', 'Serviços de terceiros', 'Equipamentos', 'Logística e deslocamento', 'Comunicação e mobilização', 'Custos administrativos'];
export const INSTR_TIPOS = ['TAC', 'ANPP', 'ANPC', 'Acordo de leniência', 'Acordo judicial', 'Sentença em ACP', 'Transação penal'];
export const TIPOS_INST = ['OSC', 'Associação comunitária', 'Fundação', 'Fundação de apoio', 'Universidade', 'Órgão público'];

export const CHECK_HAB = ['Estatuto social e ata de eleição vigentes', 'CNPJ ativo e compatível com o objeto', 'Certidões negativas (Receita/PGFN, FGTS e trabalhista)', 'Comprovação de experiência na área', 'Plano de trabalho assinado pelo representante legal', 'Declaração de ausência de impedimentos e de conflito de interesses'];
export const CHECK_LEGAL = ['Objeto compatível com a finalidade da chamada ou do instrumento', 'Sem finalidade lucrativa ou promoção pessoal', 'Orçamento sem despesas vedadas', 'Custos administrativos dentro do limite', 'Metas mensuráveis e cronograma compatível', 'Previsão de publicidade dos resultados'];
export const CHECK_AUDIT = [
  { id: 'plano', label: 'Despesas compatíveis com o plano de trabalho e as rubricas aprovadas' },
  { id: 'docs', label: 'Notas fiscais e recibos válidos, emitidos dentro da vigência' },
  { id: 'metas', label: 'Metas cumpridas e comprovadas por evidências' },
  { id: 'relatorios', label: 'Relatórios de execução atestados pela equipe técnica' },
  { id: 'glosas', label: 'Glosas fundamentadas e valores devolvidos ou compensados' },
  { id: 'publicidade', label: 'Resultados publicados no portal de transparência' },
  { id: 'trilha', label: 'Trilha de auditoria do projeto íntegra' },
];
export const AUD_CONCL: Record<string, any> = { regular: { label: 'Regular', tone: 'ok' }, ressalvas: { label: 'Regular com ressalvas', tone: 'warn' }, irregular: { label: 'Irregular', tone: 'danger' } };
export const CRITERIA_DEFAULT = [
  { id: 'relevancia', label: 'Relevância e aderência ao eixo', peso: 25, help: 'O problema é real, delimitado e ligado ao eixo temático?' },
  { id: 'viabilidade', label: 'Viabilidade técnica', peso: 20, help: 'Método, equipe e cronograma sustentam as metas?' },
  { id: 'orcamento', label: 'Adequação do orçamento', peso: 20, help: 'Os custos são compatíveis com as metas e com o mercado?' },
  { id: 'capacidade', label: 'Capacidade da instituição', peso: 15, help: 'Há experiência e estrutura para executar?' },
  { id: 'impacto', label: 'Impacto e mensuração', peso: 15, help: 'Os resultados são mensuráveis e alcançam o público certo?' },
  { id: 'continuidade', label: 'Continuidade após o projeto', peso: 5, help: 'O que permanece quando o recurso acabar?' },
];

/* ---------- permissões ---------- */
export const ACTIONS: Record<string, string> = { ver: 'Ver', criar: 'Criar', editar: 'Editar', excluir: 'Excluir', aprovar: 'Decidir', exportar: 'Exportar' };
export const MODULES: any[] = [
  { id: 'inicio', label: 'Início', actions: ['ver'] },
  { id: 'chamadas', label: 'Editais e chamadas', actions: ['ver', 'criar', 'editar', 'excluir'] },
  { id: 'projetos', label: 'Projetos', actions: ['ver', 'criar', 'editar', 'excluir', 'exportar'] },
  { id: 'banco', label: 'Banco de projetos', actions: ['ver', 'exportar'] },
  { id: 'analises', label: 'Análises', actions: ['ver', 'editar', 'aprovar'], notes: 'Editar: distribuir. Decidir: habilitar e emitir parecer.' },
  { id: 'diligencias', label: 'Diligências', actions: ['ver', 'criar', 'editar'], notes: 'Criar: abrir diligência. Editar: responder.' },
  { id: 'recursos', label: 'Recursos e destinações', actions: ['ver', 'criar', 'aprovar', 'exportar'], notes: 'Criar: registrar instrumento. Decidir: julgar e destinar.' },
  { id: 'monitoramento', label: 'Monitoramento', actions: ['ver', 'editar', 'aprovar'], notes: 'Editar: metas e relatórios. Decidir: atestar regularidade.' },
  { id: 'contas', label: 'Prestação de contas', actions: ['ver', 'criar', 'aprovar', 'exportar'], notes: 'Criar: lançar despesas. Decidir: aprovar ou glosar.' },
  { id: 'midias', label: 'Mídias', actions: ['ver', 'criar', 'editar', 'excluir'] },
  { id: 'instituicoes', label: 'Instituições', actions: ['ver', 'criar', 'editar', 'aprovar'], notes: 'Decidir: validar documentos.' },
  { id: 'permissoes', label: 'Perfis e permissões', actions: ['ver', 'editar'] },
  { id: 'auditoria', label: 'Auditoria', actions: ['ver', 'aprovar', 'exportar'], notes: 'Decidir: emitir parecer de auditoria e encerrar o projeto.' },
  { id: 'integracoes', label: 'Integrações', actions: ['ver', 'editar'] },
  { id: 'config', label: 'Configurações', actions: ['ver', 'editar'] },
];
export const SPECIALS = [
  { id: 'homologar', label: 'Homologar seleção e assinar termo', desc: 'Formaliza a destinação e inicia o monitoramento.' },
  { id: 'dados_pessoais', label: 'Ver dados pessoais sem máscara', desc: 'E-mail e telefone de responsáveis (LGPD).' },
  { id: 'midia_restrita', label: 'Abrir mídias restritas', desc: 'Arquivos marcados como restritos.' },
  { id: 'publicar', label: 'Publicar no portal público', desc: 'Define o que aparece na transparência.' },
  { id: 'ia', label: 'Usar pré-análise com IA', desc: 'Sugestões de apoio; a decisão continua humana.' },
];
export const SCOPES: Record<string, string> = { nacional: 'Nacional', unidade: 'Unidade do usuário', proprio: 'Apenas a própria instituição' };

/* ---------- seletores ---------- */
export const fisico = (p: any) => p.metas?.length ? Math.round(sum(p.metas, (m: any) => clamp(m.realizado / (m.alvo || 1))) / p.metas.length * 100) : 0;
export const despesas = (p: any) => {
  const d = p.despesas || [];
  const aprovado = sum(d.filter((x: any) => x.status === 'aprovada'), (x: any) => x.valor);
  const pendente = sum(d.filter((x: any) => x.status === 'pendente'), (x: any) => x.valor);
  const glosado = sum(d.filter((x: any) => x.status === 'glosada'), (x: any) => x.valor);
  return { aprovado, pendente, glosado, lancado: aprovado + pendente };
};
export const valorDestinado = (p: any) => p.selecao?.valor || 0;
export const financeiro = (p: any) => pct(despesas(p).lancado, valorDestinado(p) || p.valor);
export const saldoInstr = (s: any, id: string) => { const i = s.instrumentos.find((x: any) => x.id === id); return i ? i.valor - sum(s.projects.filter((p: any) => p.selecao?.instrumentoId === id), (p: any) => p.selecao.valor) : 0; };
export const notaFinal = (notas: any, criteria: any[]) => { const tot = sum(criteria, c => c.peso) || 1; return Math.round(sum(criteria, c => (notas?.[c.id] || 0) * c.peso) / tot * 10) / 10; };
export const chamadaStatus = (c: any) => { const n = Date.now(); return n < new Date(c.abertura).getTime() ? 'breve' : n > new Date(c.encerramento).getTime() ? 'encerrada' : 'aberta'; };
export const CH_STATUS: Record<string, any> = { aberta: { label: 'Inscrições abertas', tone: 'ok' }, breve: { label: 'Em breve', tone: 'warn' }, encerrada: { label: 'Encerrada', tone: 'neutral' } };
export const unidadeDe = (uf: string) => uf === 'BR' ? 'PGR' : 'PR-' + uf;

export function matchScore(p: any, i: any, saldo: number) {
  const tema = i.tema === 'livre' ? 34 : i.tema === p.eixo ? 50 : 0;
  const terr = i.uf === 'BR' ? 18 : i.uf === p.uf ? 30 : 0;
  const val = saldo >= p.valor ? 20 : Math.round(clamp(saldo / p.valor) * 12);
  return clamp(tema + terr + val, 0, 100);
}
export function autoChecks(p: any, inst: any, nDocs: number, limiteAdm = 15) {
  const total = sum(p.orcamento || [], (r: any) => r.valor);
  const adm = sum((p.orcamento || []).filter((r: any) => r.rubrica === 'Custos administrativos'), (r: any) => r.valor);
  const admPct = total ? Math.round(adm / total * 1000) / 10 : 0;
  return [
    { label: 'Cadastro da instituição validado', ok: inst?.situacao === 'habilitada', detail: inst?.situacao === 'habilitada' ? 'Documentos conferidos' : 'Há documentos pendentes' },
    { label: `Custos administrativos até ${limiteAdm}%`, ok: admPct <= limiteAdm, detail: `${String(admPct).replace('.', ',')}% do orçamento` },
    { label: 'Orçamento fecha com o valor pleiteado', ok: total === p.valor, detail: total === p.valor ? 'Sem diferença' : `Diferença de ${fmtBRL(Math.abs(total - p.valor))}` },
    { label: 'Metas com indicador e alvo', ok: (p.metas || []).length >= 2 && p.metas.every((m: any) => m.alvo > 0 && m.unidade), detail: `${(p.metas || []).length} metas` },
    { label: 'Anexos enviados', ok: nDocs > 0, detail: `${nDocs} ${nDocs === 1 ? 'arquivo' : 'arquivos'}` },
  ];
}
export const csv = (rows: any[][]) => '\uFEFF' + rows.map(r => r.map(c => { const s = String(c ?? ''); return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(';')).join('\n');
export const maskEmail = (e = '') => e.replace(/^(.{2}).*(@.*)$/, '$1•••$2');
export const maskPhone = (t = '') => t.replace(/\d(?=\d{2})/g, '•');
export function linkMeta(url = '') {
  let host = ''; try { host = new URL(url).hostname.replace(/^www\./, ''); } catch { host = url; }
  const video = /youtu\.?be|vimeo|\.mp4($|\?)/i.test(url); const doc = /\.(pdf|docx?|xlsx?|pptx?)($|\?)|drive\.google|docs\.google/i.test(url);
  return { host, tipo: video ? 'Vídeo' : doc ? 'Documento' : 'Página' };
}
export function kindOfFile(f: { type?: string; name?: string }) {
  const t = f.type || ''; if (t.startsWith('image/')) return 'image'; if (t.startsWith('video/')) return 'video'; if (t.startsWith('audio/')) return 'audio'; return 'doc';
}
