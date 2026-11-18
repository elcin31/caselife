import './style.css'
import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { game, go, btn, nav, icon, esc, photo, pic, modal, dlg, persist, toast } from './ui/kit'
import { menu, office, casesView, closed, about } from './ui/home'
import { mapView, placeView, peopleView, personView, documents, inspect, answer } from './ui/scenes'
import { boardView, boardAction, bindDrag, selectPin } from './ui/board'
import { journal, timeline, finale, result } from './ui/notebook'
import { sound } from './ui/audio'
import { install, installOptions } from './ui/install'
import { decode } from './engine/save'

const root = document.querySelector<HTMLElement>('#app')!
const routes: Record<string, () => string> = {
  home: menu,
  office,
  cases: casesView,
  closed,
  about,
  map: mapView,
  people: peopleView,
  docs: documents,
  board: boardView,
  journal,
  timeline,
  final: finale,
}
const free = ['home', 'about', 'closed', 'cases']
const route = () => location.hash.slice(1) || 'home'
const publicRoute = () => free.includes(route().split('/')[0])
let previous = ''
function render() {
  let [page, id] = route().split('/')
  if (!game.g.active && !free.includes(page)) {
    location.replace('#home')
    return
  }
  if (!routes[page] && !['place', 'person'].includes(page)) {
    location.replace('#home')
    return
  }
  const scroll = document.querySelector('.boardscroll')?.scrollLeft || 0
  const content =
    page === 'place' ? placeView(id) : page === 'person' ? personView(id) : routes[page]()
  const active = !publicRoute()
  const tab = (r: string, name: string, i: string) =>
    nav(r, name, (page === r ? 'current ' : '') + 'navitem', i)
  root.innerHTML = `<header><div class="top"><button data-act="go:home" class="brand" aria-label="CASEFILE — главное меню"><span class="brand-icon">${icon('folder')}</span><span>CASEFILE<span class="brand-sub">АРХИВ НЕРАСКРЫТЫХ ДЕЛ</span></span></button><nav class="topnav">${tab(game.g.active ? 'office' : 'home', game.g.active ? 'Кабинет' : 'Рабочий стол', 'folder')}${tab('cases', 'Дела', 'file')}${tab('closed', 'Архив', 'archive')}</nav><div class="righttools"><button data-act="audio" class="square sound" aria-label="${game.data.settings.sound ? 'Выключить' : 'Включить'} звуки">${icon(game.data.settings.sound ? 'sound' : 'mute')}</button><button data-act="settings" class="square" aria-label="Настройки">${icon('gear')}</button><button data-act="navigation" class="square mobile-nav" aria-label="Навигация">${icon('menu')}</button></div></div></header>
 <main class="${page === 'home' ? 'home' : 'inner'}">${page === 'home' ? '' : `<div class="crumb">${nav(active && page !== 'office' ? 'office' : 'home', active && page !== 'office' ? 'Кабинет' : 'Главное меню', '', 'back')}<span>АРХИВ / 001</span></div>`}${content}</main><footer><span class="footbrand">${icon('folder')} CASEFILE</span><span>Частное детективное бюро · Реченск</span><button data-act="go:about">Об игре ↗</button></footer>${active ? `<nav class="dock">${tab('office', 'Кабинет', 'folder')}${tab('map', 'Места', 'pin')}${tab('people', 'Допросы', 'person')}${tab('board', 'Доска', 'board')}${tab('journal', 'Журнал', 'book')}</nav>` : ''}`
  document.body.classList.toggle('playing', active)
  document.body.classList.toggle('large', game.data.settings.large)
  if (page === 'board') {
    bindDrag(render)
    const s = document.querySelector('.boardscroll')
    if (s) s.scrollLeft = scroll
  }
  if (previous !== route()) {
    window.scrollTo(0, 0)
    previous = route()
  }
  persist()
}
function settings() {
  const s = game.data.settings
  modal(
    'Настройки',
    `<div class="rows">${(
      [
        ['sound', 'Звуки действий'],
        ['rain', 'Фоновый дождь'],
        ['large', 'Крупный текст документов'],
      ] as const
    )
      .map(
        ([key, label]) =>
          `<button data-act="toggle:${key}" class="row" role="switch" aria-checked="${s[key]}"><b>${label}</b><span class="switch ${s[key] ? 'on' : ''}">${s[key] ? 'Вкл' : 'Выкл'}</span></button>`,
      )
      .join(
        '',
      )}</div>${installOptions()}${game.g.active ? btn('reset', 'Сбросить текущее расследование', '', 'archive') : ''}`,
  )
}
function brief() {
  modal(
    'Первичный протокол',
    `<div class="dialogue">${photo('orlov', 'Виктор Орлов')}<div><small>ДЕЛО № 001 · ПОГИБШИЙ</small><h3>Виктор Орлов</h3><p>Предприниматель, 55 лет</p></div></div><article class="paper"><small>РЕЧЕНСК · 14 НОЯБРЯ 1998</small><h3>Последний свидетель</h3><p>${game.file.intro}</p><p>В папке есть сообщение о крупном переводе. У дома видели постороннего. Осмотрите кабинет и поговорите с семьёй.</p></article>${game.g.active ? nav('office', 'В кабинет', 'primary', 'arrow') : btn('begin', 'Принять дело', 'primary', 'folder')}`,
  )
}
function begin() {
  game.start()
  persist()
  dlg().close()
  go('office')
  if (route() === 'office') render()
}
function back() {
  if (dlg().open) {
    dlg().close()
    return
  }
  if (history.state?.casefileDepth > 0) {
    history.back()
    return
  }
  if (route() !== 'home') {
    go('home')
    return
  }
  if (Capacitor.isNativePlatform()) void App.minimizeApp()
}
document.addEventListener('click', (ev) => {
  const el = (ev.target as Element).closest<HTMLElement>('[data-act]')
  if (!el) return
  const [act, arg = ''] = el.dataset.act!.split(':')
  const s = game.data.settings
  sound(s.sound, s.rain, ['inspect', 'deep', 'brief', 'collect'].includes(act) ? 'paper' : 'click')
  switch (act) {
    case 'go':
      go(arg)
      return
    case 'close':
      dlg().close()
      return
    case 'start':
    case 'brief':
      brief()
      return
    case 'begin':
      begin()
      return
    case 'new':
    case 'reset':
      modal(
        'Начать дело заново?',
        `<p>Текущие улики, связи, записи и заключения будут очищены. Архив раскрытых дел сохранится.</p><div class="actions">${btn('begin', 'Да, начать заново', 'primary')}${btn('close', 'Отмена')}</div>`,
      )
      return
    case 'install':
      void install()
      return
    case 'settings':
      settings()
      return
    case 'audio':
      s.sound = !s.sound
      persist()
      render()
      toast(s.sound ? 'Звуки включены' : 'Звуки выключены')
      return
    case 'toggle': {
      if (arg === 'sound' || arg === 'rain' || arg === 'large') s[arg] = !s[arg]
      sound(false, s.rain)
      persist()
      render()
      settings()
      return
    }
    case 'navigation':
      modal(
        'Навигация',
        `<div class="rows">${nav('home', 'Главное меню', 'row', 'folder')}${game.g.active ? nav('office', 'Кабинет', 'row', 'folder') : ''}${nav('cases', 'Выбор дела', 'row', 'file')}${nav('closed', 'Архив раскрытых дел', 'row', 'archive')}${nav('about', 'Информация об игре', 'row', 'info')}</div>`,
      )
      return
    case 'readclosed':
      modal(
        'Архивное заключение',
        `<article class="paper"><h3>${game.file.name}</h3><p>${game.file.assessment.ending}</p></article>`,
      )
      return
    case 'inspect':
    case 'deep':
      inspect(arg, act === 'deep')
      return
    case 'zoom':
      modal(
        'Увеличенный снимок',
        `<label>Масштаб<input id="zoom" type="range" min="100" max="300" value="150" step="25"></label><div class="zoomframe"><img src="${pic(arg)}" style="width:150%" alt="Увеличенный снимок"></div>`,
      )
      return
    case 'collect':
      if (game.collect(arg)) {
        toast('Улика приобщена к делу')
        persist()
      }
      dlg().close()
      render()
      return
    case 'ask': {
      const [p, t] = arg.split('/')
      answer(p, t)
      persist()
      render()
      return
    }
    case 'idea':
      modal(
        'Своя гипотеза',
        `<form id="hypothesis"><label>Формулировка<textarea name="title" required maxlength="180"></textarea></label><button class="btn primary">Закрепить гипотезу</button></form>`,
      )
      return
    case 'event':
      if (!game.addEvent((document.querySelector('#event') as HTMLSelectElement).value))
        toast('Выберите доступное событие')
      break
    case 'earlier':
    case 'later':
      game.reorder(Number(arg), act === 'earlier' ? -1 : 1)
      break
    case 'removeevent':
      game.g.timeline.splice(Number(arg), 1)
      break
    case 'defer':
      result(game.assess({ who: '', motive: '', method: '', proofs: [] }, true))
      break
    case 'decision':
      result(game.g.decisions[Number(arg)])
      return
    default:
      if (!boardAction(act, arg)) return
  }
  persist()
  render()
})
document.addEventListener('submit', (e) => {
  e.preventDefault()
  const form = e.target as HTMLFormElement,
    data = new FormData(form)
  if (form.id === 'hypothesis') {
    game.idea(String(data.get('title')))
    dlg().close()
  }
  if (form.id === 'accusation') {
    const t = {
      who: String(data.get('who')),
      motive: String(data.get('motive')),
      method: String(data.get('method')),
      proofs: data.getAll('proof').map(String),
    }
    result(game.assess(t))
  }
  persist()
  render()
})
document.addEventListener('input', (e) => {
  const t = e.target as HTMLInputElement
  if (t.id === 'notes') {
    game.g.notes = t.value
    persist()
  }
  if (t.id === 'zoom') {
    const img = dlg().querySelector<HTMLImageElement>('.zoomframe img')
    if (img) img.style.width = t.value + '%'
  }
})
document.addEventListener('change', (e) => {
  const t = e.target as HTMLSelectElement
  if (t.id === 'pinA') {
    selectPin(t.value)
    render()
  }
  if (t.dataset.proof !== undefined) game.g.timeline[Number(t.dataset.proof)].proof = t.value
  if (t.dataset.confidence !== undefined)
    game.g.timeline[Number(t.dataset.confidence)].confidence = t.value
  persist()
})
window.addEventListener('hashchange', () => {
  if (dlg().open) dlg().close()
  render()
})
window.addEventListener('storage', (e) => {
  if (e.key === 'casefile.archive' && e.newValue) {
    try {
      Object.assign(game.data, decode(e.newValue, game.file.id))
      if (dlg().open) dlg().close()
      render()
    } catch {
      toast('Не удалось прочитать изменения из другой вкладки.')
    }
  }
})
window.addEventListener('pagehide', persist)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) persist()
})
if (Capacitor.isNativePlatform()) {
  void App.addListener('backButton', back)
  void App.addListener('appStateChange', ({ isActive }) => {
    if (!isActive) persist()
  })
} else if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker
      .register('./sw.js')
      .catch(() =>
        toast('Не удалось подготовить офлайн-версию. Откройте игру ещё раз при подключении.'),
      )
  })
}
render()
