import { case001 as file } from '../content/case'
import { Investigation } from '../engine/investigation'
import { load, save } from '../engine/save'
export const game = new Investigation(file, load(localStorage, file.id))
export const esc = (v: unknown) =>
  String(v ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  )
export const pic = (name: string) => './art/' + encodeURIComponent(name) + '.webp'
export const photo = (art: string, alt = '', cls = '') =>
  `<img class="${cls}" src="${pic(art)}" loading="lazy" alt="${esc(alt)}">`
const paths: Record<string, string> = {
  folder: 'M3 7h7l2 2h9v10H3z M3 7V5h7l2 2h7v2',
  archive: 'M3 4h18v5H3z M5 9v11h14V9 M10 13h4',
  pin: 'M12 21s7-6 7-12a7 7 0 1 0-14 0c0 6 7 12 7 12z M14 9a2 2 0 1 1-4 0 2 2 0 0 1 4 0z',
  person: 'M16 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0z M4 21v-2a8 8 0 0 1 16 0v2',
  arrow: 'M4 12h15m-6-6 6 6-6 6',
  up: 'M6 17 18 5 M7 5h11v11',
  back: 'M20 12H5m6-6-6 6 6 6',
  gear: 'M10 3h4l1 3 3-1 2 3-2 3 2 2-1 4-4 1-1 3h-4l-1-3-4-1-1-4 2-2-2-3 2-3 3 1z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
  sound: 'M3 10h4l5-5v14l-5-5H3z M16 8q4 4 0 8 M19 5q7 7 0 14',
  mute: 'M3 10h4l5-5v14l-5-5H3z M16 9l6 6m0-6-6 6',
  file: 'M5 3h10l4 4v14H5z M14 3v5h5 M8 12h8 M8 16h6',
  clock: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z M12 6v6l4 2',
  board: 'M3 4h18v16H3z M7 8h3v3H7z M14 13h3v3h-3z M10 10l4 4',
  book: 'M5 3h14v18H5z M8 3v18 M11 8h5',
  phone: 'M5 3l4 1 1 5-3 2a14 14 0 0 0 6 6l2-3 5 1 1 4c-2 6-11 0-14-3C4 13 0 5 5 3z',
  play: 'M7 4l13 8-13 8z',
  check: 'M4 12l5 5L20 6',
  close: 'M5 5l14 14m0-14L5 19',
  info: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z M12 11v6 M12 7v1',
  lock: 'M5 10h14v11H5z M8 10V7a4 4 0 1 1 8 0v3',
  grid: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
  menu: 'M3 6h18 M3 12h18 M3 18h18',
  scale: 'M12 3v17 M4 7h16 M6 7l-4 7h8z M18 7l-4 7h8z M8 21h8',
}
export const icon = (name: string) =>
  `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"><path d="${paths[name] || paths.file}"/></svg>`
export const btn = (act: string, label: string, cls = '', ico = '') =>
  `<button type="button" data-act="${esc(act)}" class="btn ${cls}">${ico ? icon(ico) : ''}${esc(label)}</button>`
export const nav = (route: string, label: string, cls = '', ico = '') =>
  btn('go:' + route, label, cls, ico)
export const options = (rows: { id: string; name: string }[], current = '') =>
  rows
    .map(
      (x) =>
        `<option value="${esc(x.id)}"${x.id === current ? ' selected' : ''}>${esc(x.name)}</option>`,
    )
    .join('')
export const head = (k: string, title: string, sub = '') =>
  `<div class="pagehead"><div class="kicker">${esc(k)}</div><h1>${esc(title)}</h1>${sub ? `<p>${esc(sub)}</p>` : ''}</div>`
export const card = (route: string, art: string, k: string, title: string, sub = '') =>
  `<button type="button" class="visual-card" data-act="${esc(route)}">${photo(art)}<div><small>${esc(k)}</small><h3>${esc(title)}</h3>${sub ? `<p>${esc(sub)}</p>` : ''}</div><span>${icon('up')}</span></button>`
export function persist() {
  try {
    save(localStorage, game.data)
  } catch {
    toast('Память устройства недоступна. Прогресс этой сессии может быть потерян.')
  }
}
let timer: number
export function toast(text: string) {
  const box = document.querySelector<HTMLElement>('#toast')!
  box.textContent = text
  box.classList.add('show')
  clearTimeout(timer)
  timer = window.setTimeout(() => box.classList.remove('show'), 3300)
}
export const dlg = () => document.querySelector<HTMLDialogElement>('#dialog')!
export function modal(title: string, body: string) {
  const el = dlg()
  el.innerHTML = `<div class="modalhead"><h2>${esc(title)}</h2><button data-act="close" aria-label="Закрыть">${icon('close')}</button></div><div class="modalbody">${body}</div>`
  if (!el.open) el.showModal()
  el.scrollTop = 0
}
export const go = (route: string) => {
  if (dlg().open) dlg().close()
  if ((location.hash.slice(1) || 'home') === route) return
  history.pushState({ casefileDepth: (history.state?.casefileDepth || 0) + 1 }, '', '#' + route)
  window.dispatchEvent(new HashChangeEvent('hashchange'))
}
