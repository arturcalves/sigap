import os
from playwright.sync_api import sync_playwright
url='file://'+os.path.abspath('dist/sigap-dev.html')
def login(pg,name):
    pg.goto(url+'#/acesso'); pg.wait_for_timeout(250); pg.locator('button.persona',has_text=name).click(); pg.wait_for_timeout(250)
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':1440,'height':900}); errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else None)
    pg.goto(url); pg.wait_for_timeout(400)
    # analista aprova despesas pendentes e contas de p21
    login(pg,'Rafael Monteiro'); pg.goto(url+'#/projetos/p21/contas'); pg.wait_for_timeout(400)
    for _ in range(10):
        bt=pg.get_by_role('button',name='Aprovar',exact=True)
        if bt.count()==0: break
        bt.first.click(); pg.wait_for_timeout(120)
    pg.get_by_role('button',name='Aprovar prestação de contas').first.click(); pg.wait_for_timeout(200)
    pg.locator('.modal textarea').fill('Despesas comprovadas e compatíveis com o plano de trabalho. Metas superadas.')
    pg.locator('.modal').get_by_role('button',name='Aprovar prestação de contas').click(); pg.wait_for_timeout(300)
    print('p21 status:', pg.evaluate("JSON.parse(localStorage.getItem('sigap:v4')).projects.find(p=>p.id==='p21').status"))
    # auditor audita p20
    login(pg,'Otávio Brandão'); pg.goto(url+'#/auditar/p20'); pg.wait_for_timeout(400)
    pg.get_by_role('button',name='Sugerir amostra pelos maiores valores').click()
    for c in pg.locator('.ck').all(): c.click()
    pg.locator('.aud-form textarea').nth(1).fill('Amostra de cinco despesas conferida com as notas fiscais. Metas comprovadas por relatórios atestados e imagens. Trilha íntegra.')
    pg.wait_for_timeout(200); pg.screenshot(path='dist/v2_aud_form.png')
    pg.get_by_role('button',name='Emitir parecer de auditoria').click(); pg.wait_for_timeout(400)
    st=pg.evaluate("JSON.parse(localStorage.getItem('sigap:v4')).projects.find(p=>p.id==='p20')")
    print('p20', st['status'], st['auditoria']['conclusao'], len(st['auditoria']['amostra']))
    pg.screenshot(path='dist/v2_aud_done.png')
    pg.goto(url+'#/etapa/7/encerrados'); pg.wait_for_timeout(400); pg.screenshot(path='dist/v2_encerrados.png')
    pg.goto(url+'#/p/p20'); pg.wait_for_timeout(500); pg.screenshot(path='dist/v2_pub.png',full_page=True)
    pg.goto(url+'#/auditoria'); pg.wait_for_timeout(500); pg.screenshot(path='dist/v2_trilha.png')
    # proponente view
    login(pg,'Marina Lopes'); pg.goto(url+'#/etapa/1'); pg.wait_for_timeout(400); pg.screenshot(path='dist/v2_marina_e1.png')
    pg.goto(url+'#/etapa/7'); pg.wait_for_timeout(400); pg.screenshot(path='dist/v2_marina_e7.png')
    print('errors',errs[:5])
    b.close()
