"""Black-box walkthrough. Run against a production build served on localhost."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
url = os.getenv('CASEFILE_TEST_URL','http://127.0.0.1:4173')
def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=os.getenv('CASEFILE_CHROMIUM') or None, args=['--no-sandbox'])
        context = browser.new_context(viewport={'width':390,'height':844},reduced_motion='reduce')
        page = context.new_page()
        page.set_default_timeout(5000)
        errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        def act(action):
            target=page.locator('[data-act="'+action+'"]:visible').first
            target.click()
        def goto(route):
            page.goto(url+'/#'+route)
            page.wait_for_selector('main')
            expect(page).to_have_url(url+'/#'+route)
        def item(key):
            act('inspect:'+key)
            if page.locator('dialog [data-act="deep:'+key+'"]').count():act('deep:'+key)
            act('collect:'+key)
        def ask(person,key):
            goto('person/'+person)
            act('ask:'+person+'/'+key)
            act('close')
        def no_overflow():
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),page.url
        page.goto(url)
        expect(page.get_by_role('heading',level=1)).to_contain_text('свидетель')
        act('settings');act('toggle:rain');act('toggle:rain');act('toggle:large');act('close')
        goto('cases');act('brief');act('begin')
        expect(page).to_have_url(url+'/#office')
        act('go:map');act('go:place/study')
        for e in ['letter','machine','expert']:item(e)
        goto('place/hall')
        for e in ['key','clock','scrap']:item(e)
        goto('place/parlor')
        for e in ['photo','call','coat']:item(e)
        ask('nina','n_lida');ask('lida','l_tape')
        goto('place/parlor');item('tape')
        ask('lida','l_key');goto('place/hall');item('plan')
        goto('place/street');item('ticket');item('receipt')
        ask('petr','p_visit')
        goto('place/records')
        for e in ['old','original','crew']:item(e)
        goto('place/bank')
        for e in ['order','issue','share']:item(e)
        ask('raisa','r_phrase')
        goto('board')
        proof_groups=[['order','old','share'],['issue','tape','r_phrase','plan'],['expert','key','l_key']]
        for group in proof_groups:
            for e in group:
                page.locator('#addpin').select_option(e)
                act('pin')
            for e in group[1:]:
                page.locator('#pinA').select_option(group[0])
                page.locator('#pinB').select_option(e)
                act('link')
        expect(page.locator('main .paper')).to_have_count(3)
        act('idea');page.locator('textarea[name=title]').fill('Проверить время у кассы')
        page.locator('#hypothesis button').click()
        page.locator('#pinA').select_option('order');act('shift:1')
        pos=page.locator('[data-pin="order"]').get_attribute('style')
        page.reload()
        expect(page.locator('[data-pin="order"]')).to_have_attribute('style',pos)
        goto('journal');page.locator('#notes').fill('Сопоставить даты в обеих копиях.')
        page.close();page=context.new_page()
        page.on('pageerror',lambda e:errors.append(str(e)))
        goto('journal');expect(page.locator('#notes')).to_have_value('Сопоставить даты в обеих копиях.')
        goto('timeline')
        for e in ['copy','payment','sound','latch','ambulance']:
            page.locator('#event').select_option(e);act('event')
        expect(page.locator('.callout')).to_contain_text('банковском журнале')
        act('earlier:1')
        page.locator('[data-proof="0"]').select_option('order')
        page.locator('[data-confidence="0"]').select_option('Уверен')
        goto('final');act('defer');expect(page.locator('dialog h2')).to_have_text('Заключение отложено');act('close')
        def accuse(who,proofs,title):
            for field,value in [('who',who),('method','outside'),('motive','revision')]:
                page.locator('[name='+field+']').select_option(value)
            for proof in proofs:page.locator('[name=proof][value='+proof+']').check()
            page.locator('#accusation [type=submit]').click()
            expect(page.locator('dialog h2')).to_have_text(title);act('close')
        accuse('sergey',[],'Обвинение отклонено')
        accuse('raisa',[],'Доказательств недостаточно')
        accuse('raisa',['meeting','door','fund'],'Дело раскрыто')
        goto('closed');act('readclosed');expect(page.locator('dialog')).to_contain_text('шесть имён');act('close')
        goto('docs');act('deep:old');act('zoom:ledger');page.locator('#zoom').fill('250');act('close')
        print('PASS: all 19 evidence cards, evidence-gated dialogue, manual deductions, notes, reopen, chronology and four endings',flush=True)
        for width in [320,360,375,390,430,768,1440]:
            page.set_viewport_size({'width':width,'height':900})
            for route in ['home','office','cases','map','place/hall','people','person/raisa','docs','board','timeline','journal','final','closed','about']:
                goto(route);no_overflow()
            if os.getenv('CASEFILE_SCREENSHOTS') and width in (390,1440):
                goto('home');page.screenshot(path=str(Path(os.environ['CASEFILE_SCREENSHOTS'])/('casefile-'+str(width)+'.png')),full_page=True)
        page.evaluate('navigator.serviceWorker.ready')
        page.wait_for_function('!!navigator.serviceWorker.controller')
        manifest=context.new_cdp_session(page).send('Page.getAppManifest')
        assert not manifest['errors'],manifest
        context.set_offline(True)
        page.reload()
        goto('place/study');act('inspect:letter')
        expect(page.locator('dialog')).to_contain_text('Семьям команды')
        assert page.locator('dialog img').evaluate('(i)=>i.complete && i.naturalWidth>0')
        act('close')
        goto('home');act('new');act('close')
        expect(page.locator('.hero')).to_contain_text('Продолжить')
        assert not errors,errors
        print('PASS: 98 responsive route checks, valid manifest, cached offline reload and offline exhibit',flush=True)
        browser.close()
if __name__=='__main__':run()

