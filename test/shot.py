import sys
from playwright.sync_api import sync_playwright
NAMES = {'u_helena':'Helena Duarte','u_rafael':'Rafael Monteiro','u_marina':'Marina Lopes','u_cecilia':'Cecília Andrade','u_otavio':'Otávio Brandão','u_tiago':'Tiago Nogueira'}
args = [a for a in sys.argv[1:] if not a.startswith('--')]
W = 390 if '--mobile' in sys.argv else 1440; H = 844 if '--mobile' in sys.argv else 900
dark = '--dark' in sys.argv; full = '--full' in sys.argv
import os
url = os.environ.get('SIGAP_URL', 'file://' + os.path.abspath('dist/sigap-dev.html'))
with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': W, 'height': H}, device_scale_factor=1, color_scheme='dark' if dark else 'light')
    pg = ctx.new_page(); errs = []
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.on('pageerror', lambda e: errs.append('PAGEERROR ' + str(e)))
    pg.goto(url); pg.wait_for_timeout(500); cur = None
    for r in args:
        route, _, persona = r.partition('@')
        if persona and persona != cur:
            pg.goto(url + '#/acesso'); pg.wait_for_timeout(250)
            pg.locator('button.persona', has_text=NAMES[persona]).click(); pg.wait_for_timeout(250); cur = persona
        pg.goto(url + '#/' + route); pg.wait_for_timeout(550)
        name = (route.replace('/', '_') or 'portal') + ('_' + persona if persona else '') + ('_m' if W < 500 else '') + ('_dark' if dark else '')
        pg.screenshot(path=f'dist/s_{name}.png', full_page=full)
        print('shot', name, '| errors:', len(errs))
    for e in errs[:15]: print('ERR', e[:500])
    b.close()
