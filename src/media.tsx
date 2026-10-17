import React, { useEffect, useRef, useState } from 'react';
import { Image as ImageIcon, Film, FileText, Link2, Music, Upload, Lock, Globe, Building2, Trash2, Download, ExternalLink, Play, Plus } from 'lucide-react';
import { STAGES, fmtDate, fmtBytes, kindOfFile, linkMeta, uid } from './lib';
import { useApp, useBlobUrl, getBlob, putBlob, blobToDataUrl } from './store';
import { Btn, Modal, Field, Group, Seg, Empty, Note, Pill } from './ui';
import { Cover } from './viz';
import { textPdf } from './pdf';

export const KIND: Record<string, any> = { image: { label: 'Imagem', plural: 'Imagens', icon: ImageIcon }, video: { label: 'Vídeo', plural: 'Vídeos', icon: Film }, audio: { label: 'Áudio', plural: 'Áudios', icon: Music }, doc: { label: 'Documento', plural: 'Documentos', icon: FileText }, link: { label: 'Link', plural: 'Links', icon: Link2 } };
export const VIS: Record<string, any> = { publico: { label: 'Público', desc: 'Aparece no portal de transparência.', icon: Globe, tone: 'ok' }, interno: { label: 'Interno', desc: 'Visível para usuários do sistema.', icon: Building2, tone: 'neutral' }, restrito: { label: 'Restrito', desc: 'Exige a permissão “Abrir mídias restritas”.', icon: Lock, tone: 'warn' } };

export function useCanSee() { const { special, user, proj } = useApp(); return (m: any) => m.visibility !== 'restrito' || special('midia_restrita') || m.by === user?.id || (user?.instId && proj(m.projectId)?.instId === user.instId); }

function BlobMedia({ id, kind, alt }: { id: string; kind: string; alt: string }) {
  const { url, missing } = useBlobUrl(id); const [src, setSrc] = useState(''); const [fail, setFail] = useState(false);
  useEffect(() => { setSrc(url); setFail(false); }, [url]);
  const onErr = async () => { if (!src || src.startsWith('data:')) return setFail(true); const b = await getBlob(id); if (!b || b.size > 30e6) return setFail(true); try { setSrc(await blobToDataUrl(b)); } catch { setFail(true); } };
  if (missing || fail) return <div className="empty small">O arquivo não está disponível neste navegador.<br />Arquivos enviados no protótipo ficam guardados só no navegador de quem enviou.</div>;
  if (!src) return <div className="muted small">Carregando…</div>;
  return kind === 'image' ? <img src={src} alt={alt} onError={onErr} /> : kind === 'video' ? <video src={src} controls onError={onErr} /> : <audio src={src} controls onError={onErr} style={{ width: '90%' }} />;
}
function Thumb({ m }: { m: any }) {
  const K = KIND[m.kind]; const V = VIS[m.visibility]; const meta = m.kind === 'link' ? linkMeta(m.url) : null;
  return <div className={`mthumb ${m.kind === 'video' ? 'is-video' : ''} ${m.kind === 'link' ? 'is-link' : ''}`}>
    {m.kind === 'image' && m.art ? <Cover eixoId={m.art.eixo} seed={m.art.seed} /> : m.kind === 'image' && m.blob ? <BlobThumb id={m.id} alt={m.title} /> : m.kind === 'video' ? <Play size={30} aria-hidden /> : <K.icon size={30} aria-hidden />}
    <span className="badge"><K.icon size={12} aria-hidden />{meta ? meta.tipo : m.ext ? m.ext.toUpperCase() : K.label}</span>
    {m.visibility !== 'interno' && <span className="vis" title={V.label}><V.icon size={13} aria-hidden /></span>}
  </div>;
}
function BlobThumb({ id, alt }: any) { const { url } = useBlobUrl(id); const [bad, setBad] = useState(false); return url && !bad ? <img src={url} alt={alt} onError={() => setBad(true)} /> : <ImageIcon size={30} aria-hidden />; }

export function MediaGrid({ items, onOpen, empty }: any) {
  const see = useCanSee(); const { userById } = useApp();
  if (!items.length) return empty || <Empty title="Nenhuma mídia aqui ainda">Imagens, vídeos, documentos e links enviados aparecem nesta área.</Empty>;
  return <div className="media-grid">{items.map((m: any) => { const ok = see(m); return <button key={m.id} className="mtile" onClick={() => onOpen(m)} aria-label={`Abrir ${m.title}`}>
    {ok ? <Thumb m={m} /> : <div className="mthumb"><Lock size={26} aria-hidden /><span className="badge">Restrito</span></div>}
    <div className="mmeta"><b className="clamp-2">{m.title}</b><span className="tiny muted">{userById(m.by)?.name?.split(' ')[0] || '—'} · {fmtDate(m.date)}</span></div>
  </button>; })}</div>;
}

export function MediaAdd({ projectId, etapa, onClose, onAdded }: any) {
  const { act, scoped, toast } = useApp();
  const [mode, setMode] = useState('file'); const [files, setFiles] = useState<File[]>([]); const [over, setOver] = useState(false); const [busy, setBusy] = useState(false);
  const [f, setF] = useState<any>({ projectId: projectId || '', etapa: etapa || 'Monitoramento', visibility: 'interno', desc: '', url: '', title: '' }); const input = useRef<HTMLInputElement>(null);
  const set = (k: string, v: any) => setF((x: any) => ({ ...x, [k]: v }));
  const pick = (list: FileList | null) => { if (!list) return; const ok = Array.from(list).filter(x => x.size <= 200e6); if (ok.length < list.length) toast('Arquivos acima de 200 MB foram ignorados.', 'danger'); setFiles(p => [...p, ...ok]); };
  const validUrl = /^https?:\/\/\S+\.\S+/.test(f.url);
  const submit = async () => {
    setBusy(true); const base = { projectId: f.projectId || null, etapa: f.etapa, visibility: f.visibility, desc: f.desc }; let items: any[] = [];
    if (mode === 'file') { for (const file of files) { const id = uid('md'); await putBlob(id, file); const dot = file.name.lastIndexOf('.'); items.push({ id, kind: kindOfFile(file), title: dot > 0 ? file.name.slice(0, dot) : file.name, ext: dot > 0 ? file.name.slice(dot + 1).toLowerCase() : '', mime: file.type, size: file.size, blob: true, ...base }); } }
    else items = [{ id: uid('md'), kind: 'link', title: f.title || linkMeta(f.url).host, url: f.url, ...base }];
    act.addMedia(items); toast(items.length === 1 ? 'Mídia adicionada.' : `${items.length} mídias adicionadas.`); onAdded?.(items.map(i => i.id)); onClose();
  };
  return <Modal title="Adicionar mídia" sub="Imagens, vídeos, áudios, documentos ou links externos." onClose={onClose} size="wide"
    footer={<><Btn onClick={onClose}>Cancelar</Btn><Btn variant="primary" disabled={busy || (mode === 'file' ? !files.length : !validUrl)} onClick={submit}>{mode === 'file' ? (files.length > 1 ? `Adicionar ${files.length} arquivos` : 'Adicionar arquivo') : 'Adicionar link'}</Btn></>}>
    <div className="stack-sm">
      <Seg value={mode} onChange={setMode} options={[{ id: 'file', label: 'Arquivos', icon: Upload }, { id: 'link', label: 'Link externo', icon: Link2 }]} />
      {mode === 'file' ? <>
        <div className={`drop ${over ? 'is-over' : ''}`} onDragOver={e => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={e => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files); }}>
          <Upload size={26} aria-hidden /><b style={{ color: 'var(--ink)' }}>Arraste arquivos para cá</b><span className="small">Imagens, vídeos, áudios, PDF, planilhas e textos, até 200 MB cada.</span>
          <Btn size="sm" icon={Plus} onClick={() => input.current?.click()}>Escolher arquivos</Btn>
          <input ref={input} type="file" multiple className="sr-only" tabIndex={-1} onChange={e => { pick(e.target.files); e.target.value = ''; }} />
        </div>
        {files.length > 0 && <ul className="card list">{files.map((x, i) => { const K = KIND[kindOfFile(x)]; return <li key={i} style={{ padding: '8px 14px' }}><K.icon size={16} aria-hidden /><span className="grow truncate small">{x.name}</span><span className="tiny muted">{fmtBytes(x.size)}</span><Btn size="sm" variant="quiet" icon={Trash2} aria-label={`Remover ${x.name}`} onClick={() => setFiles(p => p.filter((_, j) => j !== i))} /></li>; })}</ul>}
      </> : <div className="form-grid">
        <Field label="Endereço do link" span hint={f.url && validUrl ? `Reconhecido como ${linkMeta(f.url).tipo.toLowerCase()} em ${linkMeta(f.url).host}` : 'Cole o endereço completo, começando com https://'}><input className="input" type="url" placeholder="https://" value={f.url} onChange={e => set('url', e.target.value)} /></Field>
        <Field label="Título" span><input className="input" value={f.title} onChange={e => set('title', e.target.value)} placeholder="Como o link aparece na lista" /></Field>
      </div>}
      <div className="form-grid">
        {!projectId && <Field label="Projeto"><select className="select" value={f.projectId} onChange={e => set('projectId', e.target.value)}><option value="">Sem vínculo com projeto</option>{scoped.map((p: any) => <option key={p.id} value={p.id}>{p.code} · {p.title}</option>)}</select></Field>}
        <Field label="Etapa do ciclo"><select className="select" value={f.etapa} onChange={e => set('etapa', e.target.value)}>{STAGES.map(s => <option key={s.id}>{s.label}</option>)}</select></Field>
        <Group label="Quem pode ver" span hint={VIS[f.visibility].desc}><Seg value={f.visibility} onChange={(v: string) => set('visibility', v)} options={Object.entries(VIS).map(([id, v]: any) => ({ id, label: v.label, icon: v.icon }))} /></Group>
        <Field label="Descrição (opcional)" span><input className="input" value={f.desc} onChange={e => set('desc', e.target.value)} /></Field>
      </div>
    </div>
  </Modal>;
}

export function MediaViewer({ m, onClose }: any) {
  const { can, act, exportFile, proj, userById, go, toast, state, canDownload } = useApp(); const see = useCanSee();
  const live = state.media.find((x: any) => x.id === m.id) || m; const p = live.projectId ? proj(live.projectId) : null; const K = KIND[live.kind]; const [text, setText] = useState<string>(live.text || '');
  useEffect(() => { if (live.text || live.kind !== 'doc' || !live.blob) return; if (!/^(txt|md|csv|json)$/.test(live.ext || '') && !(live.mime || '').startsWith('text/')) return; getBlob(live.id).then(b => b?.slice(0, 20000).text().then(setText)); }, [live.id]);
  if (!see(live)) return <Modal title="Mídia restrita" onClose={onClose} footer={<Btn variant="primary" onClick={onClose}>Entendi</Btn>}><Note tone="warn">Seu perfil não tem a permissão “Abrir mídias restritas”. Peça acesso ao administrador do sistema.</Note></Modal>;
  const download = async () => {
    if (live.blob) { const b = await getBlob(live.id); if (!b) return toast('O arquivo não está disponível neste navegador.', 'danger'); return exportFile(`${live.title}.${live.ext || 'bin'}`, b); }
    if (live.text) return exportFile(`${live.title}.pdf`, textPdf({ title: live.title, subtitle: p ? `${p.code} · ${p.title}` : '', body: live.text }));
    toast('Este item de demonstração não tem arquivo para baixar.', 'danger');
  };
  const meta = live.kind === 'link' ? linkMeta(live.url) : null;
  return <Modal title={live.title} sub={`${K.label}${live.ext ? ' · ' + live.ext.toUpperCase() : ''}${live.size ? ' · ' + fmtBytes(live.size) : ''}`} onClose={onClose} size="xl"
    footer={<>{can('midias', 'excluir') && <Btn variant="danger" icon={Trash2} onClick={() => { act.removeMedia(live.id); toast('Mídia excluída.'); onClose(); }}>Excluir</Btn>}<span className="grow" />{live.kind !== 'link' && (live.blob || live.text) && canDownload && <Btn icon={Download} onClick={download}>Baixar</Btn>}<Btn variant="primary" onClick={onClose}>Fechar</Btn></>}>
    <div className="viewer">
      <div className="viewer-stage">
        {live.kind === 'image' && live.art ? <Cover eixoId={live.art.eixo} seed={live.art.seed} /> : ['image', 'video', 'audio'].includes(live.kind) && live.blob ? <BlobMedia id={live.id} kind={live.kind} alt={live.title} />
          : live.kind === 'link' ? <div className="col center" style={{ padding: 24, alignItems: 'center' }}><Link2 size={34} aria-hidden /><b>{meta!.host}</b><span className="small muted" style={{ wordBreak: 'break-all', userSelect: 'all' }}>{live.url}</span><a className="btn btn-primary" href={live.url} target="_blank" rel="noopener noreferrer"><ExternalLink size={16} aria-hidden />Abrir {meta!.tipo.toLowerCase()} em nova aba</a></div>
            : text ? <pre className="docprev">{text}</pre> : <div className="empty"><FileText size={34} aria-hidden /><p style={{ marginTop: 8 }}>{live.blob ? 'Este formato não tem pré-visualização. Baixe o arquivo para abrir.' : 'Documento de demonstração, sem conteúdo anexado.'}</p></div>}
      </div>
      <div className="stack-sm">
        {live.desc && <p className="small">{live.desc}</p>}
        <dl className="kv" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div><dt>Enviado por</dt><dd>{userById(live.by)?.name || '—'}</dd></div><div><dt>Data</dt><dd>{fmtDate(live.date)}</dd></div>
          <div><dt>Etapa</dt><dd>{live.etapa || '—'}</dd></div><div><dt>Tipo</dt><dd>{meta ? meta.tipo : K.label}</dd></div>
        </dl>
        {p && <div><div className="tiny muted">Projeto</div><button className="linkbtn" onClick={() => { onClose(); go('projetos/' + p.id + '/midias'); }}>{p.code} · {p.title}</button></div>}
        <Group label="Quem pode ver" hint={VIS[live.visibility].desc}>
          {can('midias', 'editar') ? <Seg value={live.visibility} onChange={(v: string) => act.updateMedia(live.id, { visibility: v })} options={Object.entries(VIS).map(([id, v]: any) => ({ id, label: v.label, icon: v.icon }))} /> : <div><Pill tone={VIS[live.visibility].tone} icon={VIS[live.visibility].icon}>{VIS[live.visibility].label}</Pill></div>}
        </Group>
      </div>
    </div>
  </Modal>;
}
