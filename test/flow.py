from playwright.sync_api import sync_playwright
from PIL import Image
NAMES = {'u_helena':'Helena Duarte','u_rafael':'Rafael Monteiro','u_marina':'Marina Lopes','u_cecilia':'Cecília Andrade','u_otavio':'Otávio Brandão','u_tiago':'Tiago Nogueira'}
import os
url = os.environ.get('SIGAP_URL', 'file://' + os.path.abspath('dist/sigap-dev.html'))
Image.new('RGB', (640, 400), (30, 140, 190)).save('/tmp/foto-campo.png')
open('/tmp/nota.txt', 'w').write('Certidão de exemplo\nlinha 2')
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_context(viewport={'width': 1440, 'height': 900}).new_page(); errs = []
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None); pg.on('pageerror', lambda e: errs.append('PAGEERROR ' + str(e)))
    def login(u): pg.goto(url + '#/acesso'); pg.wait_for_timeout(200); pg.locator('button.persona', has_text=NAMES[u]).click(); pg.wait_for_timeout(200)
    def go(r): pg.goto(url + '#/' + r); pg.wait_for_timeout(300)
    def st(pid): return pg.evaluate("(id) => JSON.parse(localStorage.getItem('sigap:v4')).projects.find(p => p.id === id)?.status", pid)
    def click(t, exact=False, nth=0): pg.get_by_role('button', name=t, exact=exact).nth(nth).click(); pg.wait_for_timeout(200)
    pg.goto(url); pg.wait_for_timeout(400)

    # 1. Marina responde a diligência do projeto p18
    login('u_marina'); go('diligencias'); click('Responder diligência'); pg.locator('.modal textarea').fill('Certidão atualizada anexada e termos de anuência assinados por todos os proprietários.')
    pg.locator('.modal .chip').first.click(); click('Enviar resposta'); print('1 diligência respondida → p18:', st('p18'))

    # 2. Marina inscreve um projeto novo pelo wizard
    go('inscricao/c1'); pg.get_by_placeholder('Nome curto que identifique a entrega').fill('Corredores verdes do Vale'); pg.get_by_placeholder('Separe por vírgula').fill('Aimorés e Itueta')
    click('Continuar'); tas = pg.locator('.card-body textarea'); tas.nth(0).fill('Plantio de corredores ecológicos ligando fragmentos de mata em 40 propriedades.'); tas.nth(1).fill('Conectar fragmentos florestais e proteger nascentes.')
    pg.locator('.card-body input.input').nth(0).fill('Agricultores familiares'); click('ODS 15'); click('Continuar')
    pg.get_by_label('Descrição da meta 1').fill('Plantar corredores ecológicos'); pg.get_by_label('Unidade de medida').fill('hectares'); pg.get_by_label('Alvo').fill('60'); click('Continuar')
    pg.get_by_label('Valor em reais').fill('420000'); click('Adicionar linha'); pg.get_by_label('Rubrica').nth(1).select_option('Custos administrativos'); pg.get_by_label('Valor em reais').nth(1).fill('30000'); click('Continuar')
    pg.wait_for_timeout(300); click('Adicionar mídia'); click('Link externo'); pg.locator('.modal input[type=url]').fill('https://www.example.org/plano-de-trabalho.pdf'); pg.locator('.modal input.input').nth(1).fill('Plano de trabalho assinado'); click('Adicionar link')
    pg.wait_for_timeout(200); click('Adicionar mídia'); pg.locator('.modal input[type=file]').set_input_files(['/tmp/foto-campo.png', '/tmp/nota.txt']); pg.wait_for_timeout(200); click('Adicionar 2 arquivos'); pg.wait_for_timeout(500)
    print('  anexos no wizard:', pg.locator('.mtile').count()); pg.screenshot(path='dist/f_wizard5.png')
    click('Enviar inscrição'); click('Enviar inscrição', nth=1); pg.wait_for_timeout(300)
    new = pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('sigap:v4')); const p = s.projects[0]; return [p.id, p.code, p.status, p.valor, p.sei, s.media.filter(m => m.projectId === p.id).length] }"); print('2 novo projeto:', new); nid = new[0]
    go(f'projetos/{nid}/midias'); pg.locator('.mtile').first.click(); pg.wait_for_timeout(500); pg.screenshot(path='dist/f_viewer.png'); pg.keyboard.press('Escape')

    # 3. Rafael habilita o novo projeto e emite parecer
    login('u_rafael'); go('analise/' + nid); click('Marcar todos como conferidos'); click('Habilitar projeto'); print('3a habilitado →', st(nid))
    go('analise/' + nid); click('Marcar todos como conferidos'); pg.locator('.analysis textarea').fill('Projeto consistente, com metas mensuráveis e orçamento compatível. Recomenda-se a inclusão no banco de projetos.')
    pg.screenshot(path='dist/f_parecer.png'); click('Aprovar e enviar ao banco'); print('3b parecer →', st(nid), pg.evaluate("(id) => JSON.parse(localStorage.getItem('sigap:v4')).projects.find(p => p.id === id).parecer.nota", nid))

    # 4. Helena julga e destina recurso
    login('u_helena'); go(f'projetos/{nid}/destinacao'); click('Julgar e destinar recurso', nth=0); pg.wait_for_timeout(200); pg.screenshot(path='dist/f_destinar.png')
    pg.locator('.modal textarea').fill('Projeto na bacia do Rio Doce, aderente ao objeto do TAC e com boa avaliação técnica.'); click('Selecionar e destinar'); print('4 selecionado →', st(nid))
    click('Homologar e assinar termo', nth=0); click('Homologar e assinar termo', nth=-1) if False else None
    pg.get_by_role('dialog').get_by_role('button', name='Homologar e assinar termo').click(); pg.wait_for_timeout(250); print('5 homologado →', st(nid))

    # 6. Marina executa: meta, despesa, relatório, contas
    login('u_marina'); go(f'projetos/{nid}/monitoramento'); m = pg.get_by_label('Realizado em Plantar corredores ecológicos'); m.fill('60'); m.blur(); pg.wait_for_timeout(200)
    go(f'projetos/{nid}/contas'); click('Lançar despesa'); pg.locator('.modal input.input').nth(0).fill('150000'); pg.locator('.modal input.input').nth(1).fill('Agroflora Insumos Ltda.'); pg.get_by_role('dialog').get_by_role('button', name='Lançar despesa').click(); pg.wait_for_timeout(200)
    go(f'projetos/{nid}/monitoramento'); click('Enviar relatório', nth=0); pg.locator('.modal input.input').nth(0).fill('Relatório parcial nº 1'); pg.locator('.modal input.input').nth(1).fill('1º trimestre'); pg.locator('.modal textarea').fill('Plantio concluído em 60 hectares.'); pg.locator('.modal .chip').first.click()
    pg.get_by_role('dialog').get_by_role('button', name='Enviar relatório').click(); pg.wait_for_timeout(200)
    go(f'projetos/{nid}/contas'); click('Enviar prestação de contas final'); pg.get_by_role('dialog').get_by_role('button', name='Enviar prestação de contas').click(); pg.wait_for_timeout(200); print('6 contas enviadas →', st(nid))

    # 7. Rafael atesta, aprova despesa e aprova contas
    login('u_rafael'); go(f'projetos/{nid}/monitoramento'); click('Atestar'); go(f'projetos/{nid}/contas'); click('Aprovar', exact=True); pg.wait_for_timeout(200)
    click('Aprovar prestação de contas', nth=0); pg.locator('.modal textarea').fill('Despesas comprovadas e compatíveis com o plano de trabalho.'); pg.get_by_role('dialog').get_by_role('button', name='Aprovar prestação de contas').click(); pg.wait_for_timeout(250); print('7 concluído →', st(nid))
    pg.screenshot(path='dist/f_concluido.png')

    # 8. Tiago altera permissão e cria perfil
    login('u_tiago'); go('permissoes'); pg.get_by_label('Criar em Editais e chamadas').check(); pg.wait_for_timeout(150); click('Novo perfil'); pg.locator('.modal input.input').nth(0).fill('Assessoria de câmara'); click('Criar perfil')
    print('8 perfis:', pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('sigap:v4')); return [s.roles.length, s.roles.find(r => r.id === 'procurador').perms.chamadas] }"))

    # 9. Otávio verifica integridade, simula adulteração, exporta
    login('u_otavio'); go('auditoria'); click('Verificar integridade'); print('9a', pg.locator('.note').first.inner_text()[:70]); click('Simular adulteração'); click('Verificar integridade'); print('9b', pg.locator('.note').first.inner_text()[:80]); pg.screenshot(path='dist/f_auditoria.png')
    click('Desfazer adulteração'); click('Verificar integridade'); print('9c', pg.locator('.note').first.inner_text()[:40]); click('CSV', exact=True); pg.wait_for_timeout(200); print('9d fallback de exportação:', pg.locator('.modal h2').last.inner_text())
    # portal público mostra o projeto concluído
    pg.keyboard.press('Escape'); go('p/' + nid); print('10 página pública:', pg.locator('h1').inner_text())
    print('audit len', pg.evaluate("() => JSON.parse(localStorage.getItem('sigap:v4')).audit.length"), '| console errors:', len(errs))
    for e in errs[:10]: print('ERR', e[:300])
    b.close()
