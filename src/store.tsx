import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { buildSeed, hashEvent } from './seed';
import { nowIso, uid, fmtBRL, daysAhead, unidadeDe, notaFinal, sum } from './lib';

const KEY = 'sigap:v4';
const clone = <T,>(o: T): T => typeof structuredClone === 'function' ? structuredClone(o) : JSON.parse(JSON.stringify(o));
function load() { try { const raw = localStorage.getItem(KEY); if (raw) { const s = JSON.parse(raw); if (s?.v === 4 && Array.isArray(s.projects)) return s; } } catch { /* sem armazenamento */ } return buildSeed(); }
function save(s: any) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* cota ou bloqueio: segue em memória */ } }

export function verifyChain(audit: any[]) { let prev = 'GENESIS'; for (const e of audit) { if (e.prev !== prev || hashEvent(e) !== e.hash) return { ok: false, at: e.seq, n: audit.length }; prev = e.hash; } return { ok: true, at: 0, n: audit.length }; }

/* ---------- arquivos enviados (IndexedDB, por navegador) ---------- */
const mem = new Map<string, Blob>(); const urls = new Map<string, string>();
const openDb = (): Promise<IDBDatabase | null> => new Promise(res => { try { const r = indexedDB.open('sigap-media', 1); r.onupgradeneeded = () => r.result.createObjectStore('blobs'); r.onsuccess = () => res(r.result); r.onerror = () => res(null); } catch { res(null); } });
export async function putBlob(id: string, blob: Blob) { mem.set(id, blob); const db = await openDb(); if (!db) return; try { await new Promise((ok, no) => { const tx = db.transaction('blobs', 'readwrite'); tx.objectStore('blobs').put(blob, id); tx.oncomplete = () => ok(1); tx.onerror = tx.onabort = () => no(tx.error); }); } catch { /* fica só na sessão */ } }
export async function getBlob(id: string): Promise<Blob | null> { if (mem.has(id)) return mem.get(id)!; const db = await openDb(); if (!db) return null; try { return await new Promise(res => { const rq = db.transaction('blobs').objectStore('blobs').get(id); rq.onsuccess = () => { if (rq.result) mem.set(id, rq.result); res(rq.result || null); }; rq.onerror = () => res(null); }); } catch { return null; } }
export async function delBlob(id: string) { mem.delete(id); urls.delete(id); const db = await openDb(); if (!db) return; try { db.transaction('blobs', 'readwrite').objectStore('blobs').delete(id); } catch { /* nada */ } }
export function useBlobUrl(id?: string) {
  const [url, setUrl] = useState(id ? urls.get(id) || '' : ''); const [missing, setMissing] = useState(false);
  useEffect(() => { let alive = true; setMissing(false); if (!id) { setUrl(''); return; } if (urls.has(id)) { setUrl(urls.get(id)!); return; }
    getBlob(id).then(b => { if (!alive) return; if (!b) { setMissing(true); return; } let u = ''; try { u = URL.createObjectURL(b); } catch { /* sem blob: */ } if (u) { urls.set(id, u); setUrl(u); } else setMissing(true); });
    return () => { alive = false; }; }, [id]);
  return { url, missing };
}
export const blobToDataUrl = (b: Blob): Promise<string> => new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.onerror = () => no(r.error); r.readAsDataURL(b); });

/* ---------- capacidades do runtime (downloads, IA) ---------- */
export function useCap(name: string) {
  const [cap, setCap] = useState<any>(null);
  useEffect(() => { let alive = true; const c = (window as any).claude; if (!c?.use) return; Promise.resolve(c.use(name)).then((v: any) => { if (alive && v) setCap(() => v); }).catch(() => { /* ausente */ }); return () => { alive = false; }; }, [name]);
  return cap;
}

const Ctx = createContext<any>(null);
export const useApp = () => useContext(Ctx);
const readHash = () => { try { return decodeURIComponent((window.location.hash || '').replace(/^#\/?/, '')); } catch { return ''; } };

export function Provider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<any>(load); const ref = useRef(state); ref.current = state;
  const [path, setPath] = useState<string>(readHash);
  const [toasts, setToasts] = useState<any[]>([]);
  const [copyBox, setCopyBox] = useState<any>(null);
  const downloads = useCap('downloads'); const sample = useCap('sample'); const [aiOff, setAiOff] = useState(false);

  const commit = useCallback((fn: (s: any) => void) => { const next = clone(ref.current); fn(next); ref.current = next; setState(next); save(next); }, []);
  const toast = useCallback((text: string, tone = 'ok') => { const id = uid('t'); setToasts(t => [...t.slice(-2), { id, text, tone }]); setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3800); }, []);
  const go = useCallback((p: string) => { setPath(p); try { if (readHash() !== p) window.location.hash = '/' + p; } catch { /* rota só em memória */ } }, []);
  useEffect(() => { const h = () => setPath(readHash()); window.addEventListener('hashchange', h); return () => window.removeEventListener('hashchange', h); }, []);

  const user = state.session ? state.users.find((u: any) => u.id === state.session.userId) : null;
  const role = user ? state.roles.find((r: any) => r.id === user.roleId) : null;
  const can = useCallback((mod: string, action = 'ver') => !!role?.perms?.[mod]?.includes(action), [role]);
  const special = useCallback((k: string) => !!role?.special?.[k], [role]);

  const exportFile = useCallback(async (filename: string, data: any, fallbackText?: string) => {
    const fb = () => fallbackText != null ? setCopyBox({ filename, text: fallbackText }) : toast('O download não está disponível nesta visualização.', 'danger');
    if (!downloads) return fb();
    try { await downloads.save({ filename, data }); toast('Arquivo salvo: ' + filename); }
    catch (e: any) { if (e?.code === 'declined') return; if (['unavailable', 'not_granted', 'capability_disabled', 'capability_removed', 'extension_not_enabled'].includes(e?.code)) fb(); else toast('Não foi possível salvar o arquivo.', 'danger'); }
  }, [downloads, toast]);

  const act = useMemo(() => {
    const me = (s: any) => s.users.find((u: any) => u.id === s.session?.userId);
    const log = (s: any, action: string, entity: string, entityId: string, detail: string) => {
      const u = me(s); const r = u && s.roles.find((x: any) => x.id === u.roleId);
      const e: any = { seq: s.audit.length + 1, ts: nowIso(), userId: u?.id || 'sistema', userName: u?.name || 'Sistema', roleName: r?.name || '—', action, entity, entityId, detail, prev: s.audit.length ? s.audit[s.audit.length - 1].hash : 'GENESIS' };
      e.hash = hashEvent(e); s.audit.push(e);
    };
    const P = (s: any, id: string) => { const p = s.projects.find((x: any) => x.id === id); if (p) p.updatedAt = nowIso(); return p; };
    const yr = new Date().getFullYear();
    const openDil = (s: any, p: any, stage: string, text: string) => { p.diligencias.push({ id: uid('dl'), stage, openedAt: nowIso(), by: me(s)?.id, text, prazo: daysAhead(s.config.prazoDiligencia) }); p.status = 'diligencia'; p.diligStage = stage; log(s, 'Diligência aberta', 'projeto', p.id, text); };
    return {
      login: (userId: string) => commit(s => { s.session = { userId }; }),
      logout: () => commit(s => { s.session = null; }),
      resetDemo: () => { const fresh: any = buildSeed(); fresh.session = ref.current.session; ref.current = fresh; setState(fresh); save(fresh); },

      saveDraft(data: any, id?: string) {
        let pid = id || '';
        commit(s => {
          if (pid) { const p = P(s, pid); Object.assign(p, data); }
          else { const n = ++s.seq.project; pid = 'p' + n; s.projects.unshift({ id: pid, n, code: `SIGAP-${yr}-${String(n).padStart(4, '0')}`, status: 'rascunho', analistaId: null, diligencias: [], relatorios: [], despesas: [], createdAt: nowIso(), updatedAt: nowIso(), art: n, publico_portal: false, unidade: unidadeDe(data.uf), ...data }); log(s, 'Projeto criado', 'projeto', pid, `Rascunho de “${data.title}” criado.`); }
          const p = s.projects.find((x: any) => x.id === pid); p.unidade = unidadeDe(p.uf);
        });
        return pid;
      },
      deleteProject: (id: string) => commit(s => { const p = s.projects.find((x: any) => x.id === id); s.projects = s.projects.filter((x: any) => x.id !== id); s.media = s.media.filter((m: any) => m.projectId !== id); log(s, 'Rascunho excluído', 'projeto', id, `Rascunho “${p?.title}” excluído.`); }),
      submitProject: (id: string) => commit(s => { const p = P(s, id); p.status = 'habilitacao'; p.sei = p.sei || `SEI ${yr}.${String(4200 + p.n * 37).padStart(6, '0')}`; p.submittedAt = nowIso(); log(s, 'Inscrição enviada', 'projeto', id, `Inscrição enviada para habilitação. Processo ${p.sei} gerado.`); }),
      assign: (id: string, analistaId: string) => commit(s => { const p = P(s, id); p.analistaId = analistaId; log(s, 'Análise distribuída', 'projeto', id, `Distribuído para ${s.users.find((u: any) => u.id === analistaId)?.name}.`); }),
      decideHab: (id: string, d: any) => commit(s => {
        const p = P(s, id); p.analistaId = p.analistaId || me(s)?.id;
        if (d.decisao === 'diligencia') return openDil(s, p, 'habilitacao', d.texto);
        p.hab = { by: me(s)?.id, date: nowIso(), checklist: d.checklist, decisao: d.decisao, texto: d.texto };
        if (d.decisao === 'habilitar') { p.status = 'analise'; log(s, 'Projeto habilitado', 'projeto', id, 'Documentação conferida. Projeto segue para análise técnica.'); }
        else { p.status = 'inabilitado'; log(s, 'Projeto inabilitado', 'projeto', id, d.texto); }
      }),
      decideParecer: (id: string, d: any) => commit(s => {
        const p = P(s, id); p.analistaId = p.analistaId || me(s)?.id;
        if (d.decisao === 'diligencia') return openDil(s, p, 'analise', d.texto);
        const nota = notaFinal(d.notas, s.config.criteria);
        p.parecer = { by: me(s)?.id, date: nowIso(), notas: d.notas, nota, legal: d.legal, decisao: d.decisao, texto: d.texto };
        if (d.decisao === 'aprovar') { p.status = 'banco'; log(s, 'Parecer técnico emitido', 'projeto', id, `Nota ${String(nota).replace('.', ',')}. Projeto aprovado e incluído no banco de projetos.`); }
        else { p.status = 'reprovado'; log(s, 'Parecer técnico emitido', 'projeto', id, `Nota ${String(nota).replace('.', ',')}. Projeto não aprovado.`); }
      }),
      answerDiligencia: (id: string, dilId: string, resposta: string, mediaIds: string[] = []) => commit(s => {
        const p = P(s, id); const d = p.diligencias.find((x: any) => x.id === dilId); d.resposta = resposta; d.respondedAt = nowIso(); d.mediaIds = mediaIds;
        p.status = d.stage === 'habilitacao' ? 'habilitacao' : 'analise'; delete p.diligStage; log(s, 'Diligência respondida', 'projeto', id, resposta);
      }),
      selectProject: (id: string, d: any) => commit(s => {
        const p = P(s, id); const i = s.instrumentos.find((x: any) => x.id === d.instrumentoId);
        p.selecao = { by: me(s)?.id, instrumentoId: i.id, valor: d.valor, date: nowIso(), justificativa: d.justificativa }; p.status = 'selecionado';
        p.simp = p.simp || `ÚNICO ${yr}.${String(900 + p.n * 11).padStart(7, '0')}`;
        log(s, 'Projeto selecionado', 'projeto', id, `${fmtBRL(d.valor)} destinados via ${i.numero}. Movimentação ${p.simp} registrada.`);
      }),
      homologar: (id: string) => commit(s => {
        const p = P(s, id); const fim = new Date(); fim.setMonth(fim.getMonth() + (p.prazo || 12)); const n = ++s.seq.termo;
        p.homolog = { by: me(s)?.id, date: nowIso(), termo: `Termo de destinação nº ${String(n).padStart(3, '0')}/${yr}` }; p.exec = { inicio: nowIso(), fim: fim.toISOString() }; p.status = 'execucao'; p.publico_portal = true;
        log(s, 'Seleção homologada', 'projeto', id, `${p.homolog.termo} assinado. Execução iniciada.`);
      }),
      updateMeta: (id: string, metaId: string, realizado: number) => commit(s => { const p = P(s, id); const m = p.metas.find((x: any) => x.id === metaId); const antes = m.realizado; m.realizado = realizado; log(s, 'Meta atualizada', 'projeto', id, `${m.title}: de ${antes.toLocaleString('pt-BR')} para ${realizado.toLocaleString('pt-BR')} ${m.unidade}.`); }),
      addRelatorio: (id: string, d: any) => commit(s => { const p = P(s, id); p.relatorios.push({ id: uid('rl'), title: d.title, periodo: d.periodo, date: nowIso(), text: d.text, mediaIds: d.mediaIds || [], status: 'aguardando', atestadoPor: null, atestadoEm: null }); log(s, 'Relatório enviado', 'projeto', id, `${d.title} (${d.periodo}) enviado com ${(d.mediaIds || []).length} anexos.`); }),
      atestar: (id: string, relId: string, ok: boolean, obs = '') => commit(s => { const p = P(s, id); const r = p.relatorios.find((x: any) => x.id === relId); r.status = ok ? 'atestado' : 'devolvido'; r.atestadoPor = me(s)?.id; r.atestadoEm = nowIso(); r.obs = obs; log(s, ok ? 'Relatório atestado' : 'Relatório devolvido', 'projeto', id, ok ? `${r.title}: regularidade atestada.` : `${r.title} devolvido: ${obs}`); }),
      addDespesa: (id: string, d: any) => commit(s => { const p = P(s, id); p.despesas.push({ id: uid('d'), status: 'pendente', date: nowIso(), ...d }); log(s, 'Despesa lançada', 'projeto', id, `${d.fornecedor}: ${fmtBRL(d.valor)} (${d.rubrica}).`); }),
      reviewDespesa: (id: string, dId: string, status: string, obs = '') => commit(s => { const p = P(s, id); const d = p.despesas.find((x: any) => x.id === dId); d.status = status; d.obs = obs; log(s, status === 'aprovada' ? 'Despesa aprovada' : 'Despesa glosada', 'projeto', id, `${d.fornecedor}: ${fmtBRL(d.valor)}${obs ? '. ' + obs : ''}`); }),
      submitContas: (id: string) => commit(s => { const p = P(s, id); p.status = 'contas'; p.contas = { enviadaEm: nowIso() }; log(s, 'Prestação de contas enviada', 'projeto', id, 'Prestação de contas final enviada para análise.'); }),
      approveContas: (id: string, texto: string) => commit(s => { const p = P(s, id); p.status = 'auditoria'; p.contas = { ...(p.contas || {}), aprovadaEm: nowIso(), by: me(s)?.id, parecer: texto }; log(s, 'Prestação de contas aprovada', 'projeto', id, 'Contas aprovadas. Projeto segue para auditoria de conformidade.'); }),
      auditar: (id: string, d: any) => commit(s => {
        const p = P(s, id); p.auditoria = { by: me(s)?.id, date: nowIso(), checklist: d.checklist, amostra: d.amostra, conclusao: d.conclusao, achados: d.achados, texto: d.texto };
        const L: any = { regular: 'regular', ressalvas: 'regular com ressalvas', irregular: 'irregular' };
        if (d.conclusao === 'irregular') { p.status = 'contas'; log(s, 'Auditoria concluída', 'projeto', id, `Parecer de auditoria: irregular. ${d.amostra.length} despesas examinadas. Prestação de contas reaberta para correção.`); return; }
        p.status = 'concluido'; p.publico_portal = true;
        log(s, 'Auditoria concluída', 'projeto', id, `Parecer de auditoria: ${L[d.conclusao]}. ${d.amostra.length} despesas examinadas. Projeto encerrado e publicado no portal.`);
      }),
      togglePortal: (id: string) => commit(s => { const p = P(s, id); p.publico_portal = !p.publico_portal; log(s, p.publico_portal ? 'Publicado no portal' : 'Retirado do portal', 'projeto', id, p.title); }),

      addInstrumento: (d: any) => commit(s => { const id = uid('i'); s.instrumentos.unshift({ id, date: nowIso(), membroId: me(s)?.id, ...d }); log(s, 'Instrumento registrado', 'instrumento', id, `${d.numero} registrado com ${fmtBRL(d.valor)} disponíveis para destinação.`); }),
      addChamada: (d: any) => commit(s => { const id = uid('c'); const n = s.chamadas.length + 1; s.chamadas.unshift({ id, code: `Chamada ${String(n).padStart(2, '0')}/${yr}`, anexos: [{ title: 'Edital completo', ext: 'pdf' }, { title: 'Modelo de plano de trabalho', ext: 'pdf' }, { title: 'Planilha de orçamento', ext: 'csv' }], ...d }); log(s, 'Chamada publicada', 'chamada', id, `${d.title} publicada.`); }),
      addInst: (d: any) => commit(s => { const id = uid('in'); s.instituicoes.unshift({ id, situacao: 'pendente', createdAt: nowIso(), docs: ['Estatuto social e ata de eleição', 'Cartão do CNPJ', 'Certidão negativa de débitos federais', 'Certificado de regularidade do FGTS', 'Certidão negativa de débitos trabalhistas', 'Comprovante de experiência na área'].map(name => ({ name, ok: false })), ...d }); log(s, 'Instituição cadastrada', 'instituicao', id, d.name); }),
      toggleInstDoc: (id: string, idx: number) => commit(s => { const i = s.instituicoes.find((x: any) => x.id === id); i.docs[idx].ok = !i.docs[idx].ok; i.situacao = i.docs.every((x: any) => x.ok) ? 'habilitada' : 'pendente'; log(s, 'Documento conferido', 'instituicao', id, `${i.docs[idx].name}: ${i.docs[idx].ok ? 'válido' : 'pendente'}.`); }),

      addMedia: (items: any[]) => commit(s => { const u = me(s); items.forEach(m => { s.media.unshift({ date: nowIso(), by: u?.id, ...m }); }); log(s, 'Mídia adicionada', items[0]?.projectId ? 'projeto' : 'midia', items[0]?.projectId || items[0]?.id, items.length === 1 ? `“${items[0].title}” adicionada.` : `${items.length} mídias adicionadas.`); }),
      updateMedia: (id: string, patch: any) => commit(s => { const m = s.media.find((x: any) => x.id === id); Object.assign(m, patch); log(s, 'Mídia alterada', m.projectId ? 'projeto' : 'midia', m.projectId || id, `“${m.title}”: ${Object.keys(patch).join(', ')}.`); }),
      removeMedia: (id: string) => { delBlob(id); commit(s => { const m = s.media.find((x: any) => x.id === id); s.media = s.media.filter((x: any) => x.id !== id); log(s, 'Mídia excluída', m?.projectId ? 'projeto' : 'midia', m?.projectId || id, `“${m?.title}” excluída.`); }); },

      togglePerm: (roleId: string, mod: string, action: string) => commit(s => { const r = s.roles.find((x: any) => x.id === roleId); const a: string[] = r.perms[mod] || []; const on = a.includes(action); r.perms[mod] = on ? a.filter(x => x !== action && (action !== 'ver' || false)) : [...a, ...(action !== 'ver' && !a.includes('ver') ? ['ver'] : []), action]; log(s, 'Perfil alterado', 'perfil', roleId, `${on ? 'Removida' : 'Concedida'} a permissão “${action}” em ${mod} para ${r.name}.`); }),
      toggleSpecial: (roleId: string, key: string) => commit(s => { const r = s.roles.find((x: any) => x.id === roleId); r.special = { ...r.special, [key]: !r.special?.[key] }; log(s, 'Perfil alterado', 'perfil', roleId, `Permissão especial “${key}” ${r.special[key] ? 'concedida' : 'removida'} para ${r.name}.`); }),
      setRole: (roleId: string, patch: any) => commit(s => { const r = s.roles.find((x: any) => x.id === roleId); Object.assign(r, patch); log(s, 'Perfil alterado', 'perfil', roleId, `${r.name}: ${Object.keys(patch).join(', ')} atualizado.`); }),
      addRole(name: string, desc: string, fromId: string) { const id = uid('r'); commit(s => { const f = s.roles.find((x: any) => x.id === fromId); s.roles.push({ id, name, desc, scope: f?.scope || 'nacional', perms: clone(f?.perms || { inicio: ['ver'] }), special: { ...(f?.special || {}) } }); log(s, 'Perfil criado', 'perfil', id, `${name} criado a partir de ${f?.name || 'um perfil vazio'}.`); }); return id; },
      removeRole: (roleId: string) => commit(s => { const r = s.roles.find((x: any) => x.id === roleId); s.roles = s.roles.filter((x: any) => x.id !== roleId); log(s, 'Perfil excluído', 'perfil', roleId, r?.name); }),
      setUserRole: (userId: string, roleId: string) => commit(s => { const u = s.users.find((x: any) => x.id === userId); u.roleId = roleId; log(s, 'Usuário alterado', 'usuario', userId, `${u.name} passou ao perfil ${s.roles.find((r: any) => r.id === roleId)?.name}.`); }),
      toggleUser: (userId: string) => commit(s => { const u = s.users.find((x: any) => x.id === userId); u.active = !u.active; log(s, 'Usuário alterado', 'usuario', userId, `${u.name} ${u.active ? 'reativado' : 'desativado'}.`); }),
      addUser: (d: any) => commit(s => { const id = uid('u'); s.users.push({ id, active: true, title: 'Convidado', ...d }); log(s, 'Usuário convidado', 'usuario', id, `${d.name} convidado com o perfil ${s.roles.find((r: any) => r.id === d.roleId)?.name}.`); }),
      setConfig: (patch: any) => commit(s => { Object.assign(s.config, patch); log(s, 'Configuração alterada', 'config', 'config', Object.keys(patch).join(', ')); }),
      tamper: () => commit(s => { const e = [...s.audit].reverse().find((x: any) => x.action === 'Projeto selecionado') || s.audit[Math.floor(s.audit.length / 2)]; s.tamper = { seq: e.seq, original: e.detail }; e.detail = e.detail.replace(/R\$\s?[\d.]+/, 'R$ 9.999.999'); }),
      untamper: () => commit(s => { if (!s.tamper) return; const e = s.audit.find((x: any) => x.seq === s.tamper.seq); if (e) e.detail = s.tamper.original; s.tamper = null; }),
    };
  }, [commit]);

  const scoped = useMemo(() => role?.scope === 'proprio' ? state.projects.filter((p: any) => p.instId === user?.instId) : state.projects, [state.projects, role, user]);
  const value = { state, path, seg: path.split('/').filter(Boolean), go, user, role, can, special, act, toast, exportFile, sample: aiOff ? null : sample, setAiOff, scoped,
    inst: (id: string) => state.instituicoes.find((i: any) => i.id === id), userById: (id: string) => state.users.find((u: any) => u.id === id),
    instr: (id: string) => state.instrumentos.find((i: any) => i.id === id), proj: (id: string) => state.projects.find((p: any) => p.id === id),
    mediaOf: (pid: string) => state.media.filter((m: any) => m.projectId === pid), canDownload: !!downloads };

  return <Ctx.Provider value={value}>
    {children}
    <div className="toasts" role="status" aria-live="polite">{toasts.map(t => <div key={t.id} className={`toast ${t.tone === 'danger' ? 'is-danger' : ''}`}>{t.text}</div>)}</div>
    {copyBox && <div className="scrim" onMouseDown={e => { if (e.target === e.currentTarget) setCopyBox(null); }}>
      <div className="modal wide" role="dialog" aria-modal="true" aria-label="Copiar conteúdo">
        <div className="modal-head"><div><h2>{copyBox.filename}</h2><p className="muted small">O download não está disponível nesta visualização. Copie o conteúdo abaixo.</p></div></div>
        <div className="modal-body"><textarea className="textarea mono" style={{ minHeight: 320 }} readOnly value={copyBox.text} onFocus={e => e.currentTarget.select()} /></div>
        <div className="modal-foot"><button className="btn btn-primary" onClick={() => setCopyBox(null)}>Fechar</button></div>
      </div></div>}
  </Ctx.Provider>;
}

/* ---------- filas e pendências por perfil ---------- */
export function useQueues() {
  const { state, scoped, user, role } = useApp();
  return useMemo(() => {
    const ps = state.projects; const mine = scoped;
    const dil = (list: any[]) => list.flatMap((p: any) => p.diligencias.filter((d: any) => !d.resposta).map((d: any) => ({ p, d })));
    return {
      distribuir: ps.filter((p: any) => ['habilitacao', 'analise'].includes(p.status) && !p.analistaId),
      habilitacao: ps.filter((p: any) => p.status === 'habilitacao'),
      analise: ps.filter((p: any) => p.status === 'analise'),
      julgamento: ps.filter((p: any) => p.status === 'banco'),
      homologacao: ps.filter((p: any) => p.status === 'selecionado'),
      contas: ps.filter((p: any) => p.status === 'contas'),
      auditoria: ps.filter((p: any) => p.status === 'auditoria'),
      concluidos: ps.filter((p: any) => p.status === 'concluido'),
      execucao: ps.filter((p: any) => p.status === 'execucao'),
      relatorios: ps.flatMap((p: any) => p.relatorios.filter((r: any) => r.status === 'aguardando').map((r: any) => ({ p, r }))),
      diligencias: dil(role?.scope === 'proprio' ? mine : ps),
      rascunhos: mine.filter((p: any) => p.status === 'rascunho'),
      meusInstr: state.instrumentos.filter((i: any) => role?.scope !== 'unidade' || i.unidade === user?.unit),
    };
  }, [state, scoped, user, role]);
}
export const totals = (s: any) => {
  const ap = s.projects.filter((p: any) => p.selecao);
  const total = sum(s.instrumentos, (i: any) => i.valor); const destinado = sum(ap, (p: any) => p.selecao.valor);
  const comprovado = sum(ap, (p: any) => sum(p.despesas.filter((d: any) => d.status === 'aprovada'), (d: any) => d.valor));
  return { total, destinado, saldo: total - destinado, comprovado, apoiados: ap.length, ufs: new Set(ap.map((p: any) => p.uf)).size, benef: sum(ap, (p: any) => p.beneficiarios), banco: s.projects.filter((p: any) => p.status === 'banco').length };
};
