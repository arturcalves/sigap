from playwright.sync_api import sync_playwright
import os
url = os.environ.get('SIGAP_URL', 'file://' + os.path.abspath('dist/sigap-dev.html'))
FAKE = """
window.__saved = [];
const sample = Object.assign(async (input, opts) => { await new Promise(r => setTimeout(r, 50)); opts && opts.onText && opts.onText({text:'Resumo de teste gerado.', delta:'Resumo de teste gerado.'}); return {text:'Resumo de teste gerado.', truncated:false, modelTierApplied:'default'}; },
  { json: async (input) => { window.__prompt = input; return {notas:{relevancia:8.5,viabilidade:8,orcamento:7.5,capacidade:8,impacto:9,continuidade:7}, pontos_fortes:['Metas claras'], riscos:['Prazo curto'], diligencias:['Detalhar equipe'], sintese:'Projeto sólido e bem delimitado.'}; }, limits: async () => ({maxPromptBytes:262144}) });
window.claude = { use: (name) => Promise.resolve(name === 'downloads' ? Object.freeze({ save: async (r) => { const d = r.data; window.__saved.push([r.filename, typeof d === 'string' ? 'string' : d.constructor.name, d.length || d.size || d.byteLength]); return {status:'saved'}; } }) : name === 'sample' ? sample : null) };
"""
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 1440, 'height': 900}); ctx.add_init_script(FAKE); pg = ctx.new_page(); errs = []
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None); pg.on('pageerror', lambda e: errs.append('PAGEERROR ' + str(e)))
    def login(n): pg.goto(url + '#/acesso'); pg.wait_for_timeout(200); pg.locator('button.persona', has_text=n).click(); pg.wait_for_timeout(250)
    def go(r): pg.goto(url + '#/' + r); pg.wait_for_timeout(350)
    pg.goto(url); pg.wait_for_timeout(400)
    # portal: dados abertos
    pg.get_by_role('button', name='Destinações (CSV)').click(); pg.get_by_role('button', name='Destinações (JSON)').click(); pg.get_by_role('button', name='Relatório (PDF)').click(); pg.wait_for_timeout(300)
    go('chamada/c1'); pg.get_by_role('button', name='Baixar Edital completo').click(); pg.get_by_role('button', name='Baixar Planilha de orçamento').click(); pg.wait_for_timeout(200)
    login('Rafael Monteiro'); go('analise/p13'); pg.get_by_role('button', name='Gerar pré-análise').click(); pg.wait_for_timeout(300); pg.get_by_role('button', name='Aplicar notas sugeridas').click(); pg.wait_for_timeout(200)
    print('nota após IA:', pg.locator('.score b').first.inner_text(), '| prompt bytes:', pg.evaluate('window.__prompt.length')); pg.screenshot(path='dist/c_ia.png')
    go('projetos'); pg.get_by_role('button', name='CSV', exact=True).click(); pg.get_by_role('button', name='PDF', exact=True).click(); pg.wait_for_timeout(200)
    go('projetos/p3/midias'); pg.locator('.mtile', has_text='Plano de trabalho assinado').click(); pg.wait_for_timeout(300); pg.get_by_role('button', name='Baixar').click(); pg.wait_for_timeout(300); pg.keyboard.press('Escape')
    login('Helena Duarte'); go('projetos/p7'); pg.get_by_role('button', name='Gerar resumo').click(); pg.wait_for_timeout(400); print('resumo IA:', pg.locator('.card', has_text='Resumo executivo com IA').locator('p').first.inner_text())
    login('Tiago Nogueira'); go('design'); pg.get_by_role('button', name='Baixar tokens (JSON)').click(); pg.wait_for_timeout(200)
    for s in pg.evaluate('window.__saved'): print('salvo:', s)
    print('theme attr after token export:', pg.evaluate("document.documentElement.getAttribute('data-theme')"))
    print('console errors:', len(errs)); [print('ERR', e[:300]) for e in errs[:8]]
    b.close()
