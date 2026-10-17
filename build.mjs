import * as esbuild from 'esbuild';
import fs from 'node:fs';
const dev = process.argv.includes('--dev');
const out = process.env.SIGAP_OUT || (dev ? 'dist/sigap-dev.html' : 'dist/sigap.html');
fs.mkdirSync('dist', { recursive: true });
const res = await esbuild.build({
  entryPoints: ['src/main.tsx'], bundle: true, minify: !dev, format: 'iife', target: ['es2020'],
  write: false, jsx: 'automatic', legalComments: 'none', charset: 'utf8',
  define: { 'process.env.NODE_ENV': '"production"' },
});
const js = res.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const base = fs.readFileSync('src/styles.css', 'utf8');
const dark = fs.readFileSync('src/dark.css', 'utf8');
const css = `${base}\n@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){${dark}}}\n:root[data-theme="dark"]{${dark}}\n`;
const nm = 'file://' + process.cwd() + '/node_modules/';
const fonts = dev
  ? `<style>@font-face{font-family:"Public Sans";src:url(${nm}@fontsource-variable/public-sans/files/public-sans-latin-wght-normal.woff2) format('woff2');font-weight:100 900}@font-face{font-family:"Public Sans";font-style:italic;src:url(${nm}@fontsource-variable/public-sans/files/public-sans-latin-wght-italic.woff2) format('woff2');font-weight:100 900}</style>`
  : `<link href="https://fonts.googleapis.com/css2?family=Public+Sans:ital,wght@0,300..800;1,300..800&display=swap" rel="stylesheet">`;
const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>SIGAP — Sistema de Gestão de Projetos e Chamadas</title>
<meta name="description" content="Protótipo navegável do SIGAP: chamadas, banco de projetos, análise, destinação de recursos, monitoramento e prestação de contas.">
${fonts}
<style>${css}</style>
</head>
<body>
<div id="root"></div>
<script>${js}</script>
</body>
</html>`;
fs.writeFileSync(out, html);
console.log(out, (html.length / 1024).toFixed(0) + ' KB');
