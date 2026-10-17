// SIGAP · gerador mínimo de PDF (Helvetica padrão, WinAnsi). Suficiente para exportar tabelas e textos.
const WA: Record<string, number> = { '•': 0x95, '–': 0x96, '—': 0x97, '“': 0x93, '”': 0x94, '‘': 0x91, '’': 0x92, '…': 0x85, '€': 0x80, '·': 0xb7 };
const enc = (s: string) => { let o = ''; for (const ch of String(s ?? '')) { const c = ch.charCodeAt(0); const b = c < 256 && !(c >= 0x80 && c < 0xa0) ? c : WA[ch] || 63; const x = String.fromCharCode(b); o += x === '(' || x === ')' || x === '\\' ? '\\' + x : b < 32 ? ' ' : x; } return o; };
const WID = [278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584];
const width = (s: string, size: number, bold = false) => { let w = 0; for (const ch of s) { const b = ch.normalize('NFD').charCodeAt(0); w += b >= 32 && b < 127 ? WID[b - 32] : 556; } return w / 1000 * size * (bold ? 1.06 : 1); };
const fit = (s: string, max: number, size: number, bold = false) => { s = String(s ?? ''); if (width(s, size, bold) <= max) return s; while (s.length > 1 && width(s + '…', size, bold) > max) s = s.slice(0, -1); return s.trimEnd() + '…'; };
const wrap = (s: string, max: number, size: number) => { const out: string[] = []; let line = ''; for (const w of s.split(/\s+/)) { const t = line ? line + ' ' + w : w; if (width(t, size) > max && line) { out.push(line); line = w; } else line = t; } if (line) out.push(line); return out.length ? out : ['']; };
const NAVY = '0.04 0.145 0.25', GRAY = '0.34 0.4 0.48', INK = '0.07 0.12 0.2';
const txt = (x: number, y: number, s: string, size = 9, bold = false, color = INK) => `BT /F${bold ? 2 : 1} ${size} Tf ${color} rg 1 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)} Tm (${enc(s)}) Tj ET\n`;
const line = (x1: number, y1: number, x2: number, y2: number, color = '0.86 0.89 0.93', w = 0.6) => `${color} RG ${w} w ${x1.toFixed(1)} ${y1.toFixed(1)} m ${x2.toFixed(1)} ${y2.toFixed(1)} l S\n`;
const rect = (x: number, y: number, w: number, h: number, color: string) => `${color} rg ${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)} re f\n`;

function build(pages: string[], W: number, H: number): Uint8Array {
  const objs: string[] = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    `<< /Type /Pages /Kids [${pages.map((_, i) => `${5 + i * 2} 0 R`).join(' ')}] /Count ${pages.length} >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
  ];
  pages.forEach((c, i) => {
    objs.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${6 + i * 2} 0 R >>`);
    objs.push(`<< /Length ${c.length} >>\nstream\n${c}\nendstream`);
  });
  let out = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n'; const offs: number[] = [];
  objs.forEach((o, i) => { offs.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('');
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  const bytes = new Uint8Array(out.length); for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 255; return bytes;
}
const header = (W: number, H: number, M: number, title: string, subtitle = '') =>
  rect(0, H - 6, W, 6, NAVY) + rect(0, H - 8, W, 2, '0.055 0.61 0.77') + txt(M, H - 44, 'SIGAP', 9, true, '0.04 0.44 0.58') + txt(M, H - 62, fit(title, W - M * 2, 15, true), 15, true, NAVY) + (subtitle ? txt(M, H - 78, fit(subtitle, W - M * 2, 9), 9, false, GRAY) : '');
const footer = (W: number, M: number, i: number, n: number) => line(M, 34, W - M, 34) + txt(M, 22, 'SIGAP · Protótipo com dados fictícios · gerado em ' + new Date().toLocaleString('pt-BR'), 7.5, false, GRAY) + txt(W - M - 60, 22, `página ${i} de ${n}`, 7.5, false, GRAY);

export function tablePdf(o: { title: string; subtitle?: string; columns: { label: string; w: number; align?: string }[]; rows: any[][] }): Uint8Array {
  const W = 842, H = 595, M = 36, RH = 19, top = H - 100, usable = W - M * 2; const tw = o.columns.reduce((s, c) => s + c.w, 0);
  const xs: number[] = []; let x = M; o.columns.forEach(c => { xs.push(x); x += usable * c.w / tw; });
  const perPage = Math.floor((top - 20 - 46) / RH); const chunks: any[][] = []; for (let i = 0; i < Math.max(1, o.rows.length); i += perPage) chunks.push(o.rows.slice(i, i + perPage));
  const cell = (ci: number, y: number, s: string, bold: boolean, color?: string) => { const cw = usable * o.columns[ci].w / tw - 10; const t = fit(s, cw, 8.5, bold); const tx = o.columns[ci].align === 'right' ? xs[ci] + cw + 5 - width(t, 8.5, bold) : xs[ci] + 5; return txt(tx, y, t, 8.5, bold, color); };
  const pages = chunks.map((rows, pi) => {
    let c = header(W, H, M, o.title, o.subtitle) + rect(M, top - 6, usable, RH, '0.945 0.96 0.975');
    o.columns.forEach((col, ci) => { c += cell(ci, top, col.label, true, GRAY); });
    rows.forEach((r, ri) => { const y = top - RH * (ri + 1); r.forEach((v, ci) => { c += cell(ci, y, String(v ?? ''), false); }); c += line(M, y - 6, W - M, y - 6); });
    return c + footer(W, M, pi + 1, chunks.length);
  });
  return build(pages, W, H);
}
export function textPdf(o: { title: string; subtitle?: string; body: string }): Uint8Array {
  const W = 595, H = 842, M = 54, LH = 15, size = 10.5; const lines: { s: string; b: boolean }[] = [];
  o.body.split('\n').forEach(par => { if (!par.trim()) return lines.push({ s: '', b: false }); const head = par.length < 60 && !/[.:;,]$/.test(par) && !par.startsWith('-'); wrap(par.replace(/^- /, '• '), W - M * 2, size).forEach(s => lines.push({ s, b: head })); });
  const per = Math.floor((H - 110 - 60) / LH); const chunks: any[] = []; for (let i = 0; i < Math.max(1, lines.length); i += per) chunks.push(lines.slice(i, i + per));
  return build(chunks.map((ls: any[], pi: number) => header(W, H, M, o.title, o.subtitle) + ls.map((l, i) => l.s ? txt(M, H - 110 - i * LH, l.s, size, l.b, l.b ? NAVY : INK) : '').join('') + footer(W, M, pi + 1, chunks.length)), W, H);
}
