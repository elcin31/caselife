import { game, head, btn, icon, options, photo, esc, persist, modal, toast } from './kit'
export let selected = ''
export function boardView() {
  const g = game.g,
    entries = game.entries(),
    unpinned = entries.filter((e) => !g.pins.some((p) => p.id === e.id))
  if (!g.pins.some((p) => p.id === selected)) selected = ''
  return (
    head(
      'АНАЛИТИЧЕСКИЙ ОТДЕЛ',
      'Доска расследования',
      'Закрепите материалы и свяжите два факта. Карточки можно двигать пальцем или кнопками.',
    ) +
    `<div class="boardbar"><label>Материал<select id="addpin"><option value="">Выберите материал</option>${options(unpinned)}</select></label>${btn('pin', 'Закрепить', '', 'board')}${btn('idea', 'Своя гипотеза', '', 'book')}</div>
 <div class="boardscroll" tabindex="0" aria-label="Рабочая поверхность доски"><div class="pinboard"><svg class="threads" viewBox="0 0 720 530" aria-hidden="true">${g.links
   .map(([a, b]) => {
     const p = g.pins.find((x) => x.id === a)!,
       q = g.pins.find((x) => x.id === b)!
     return `<line data-a="${esc(a)}" data-b="${esc(b)}" x1="${p.x + 70}" y1="${p.y + 12}" x2="${q.x + 70}" y2="${q.y + 12}"/>`
   })
   .join('')}</svg>${g.pins
   .map((p) => {
     const e = entries.find((e) => e.id === p.id)!
     return `<button class="pincard ${p.id === selected ? 'chosen' : ''}" data-pin="${esc(p.id)}" style="transform:translate(${p.x}px,${p.y}px)"><i></i>${photo(e.art)}<small>${e.type}</small><b>${esc(e.name)}</b></button>`
   })
   .join(
     '',
   )}${!g.pins.length ? '<p class="boardhint">Закрепите первую карточку</p>' : ''}</div></div>
 <div class="boardbar"><label>Карточка<select id="pinA"><option value="">Первый факт</option>${options(
   entries.filter((e) => g.pins.some((p) => p.id === e.id)),
   selected,
 )}</select></label><label>Связать с<select id="pinB"><option value="">Второй факт</option>${options(entries.filter((e) => g.pins.some((p) => p.id === e.id)))}</select></label>${btn('link', 'Соединить', 'primary', 'board')}</div>
 ${selected ? `<div class="actions">${btn('pinread', 'Прочесть')}${['←', '→', '↑', '↓'].map((x, i) => btn('shift:' + i, x, 'direction')).join('')}${btn('unpin', 'Снять карточку')}</div>` : ''}
 ${g.links.length ? `<details><summary>Связи · ${g.links.length}</summary>${g.links.map(([a, b], i) => `<div class="row"><span>${esc(entries.find((e) => e.id === a)?.name)} ↔ ${esc(entries.find((e) => e.id === b)?.name)}</span>${btn('unlink:' + i, 'Убрать')}</div>`).join('')}</details>` : ''}
 <div class="sectiontitle"><h2>Выводы</h2></div>${
   g.findings.length
     ? game.file.deductions
         .filter((d) => g.findings.includes(d.id))
         .map(
           (d) =>
             `<article class="paper"><small>СОПОСТАВЛЕНИЕ</small><h3>${d.name}</h3><p>${d.text}</p></article>`,
         )
         .join('')
     : '<p class="muted">Какие документы объясняют судьбу денег? Что связывает выдачу копии с голосом в доме? Чем подтверждается порядок шагов у двери?</p>'
 }`
  )
}
export function selectPin(id: string) {
  selected = id
}
export function connect(a: string, b: string) {
  const before = game.g.findings.length
  if (!game.link(a, b)) {
    toast('Выберите две разные закреплённые карточки без общей связи.')
    return
  }
  toast(game.g.findings.length > before ? 'В журнал внесён новый вывод' : 'Связь закреплена')
}
export function boardAction(action: string, id: string) {
  const value = (k: string) => (document.getElementById(k) as HTMLSelectElement)?.value
  switch (action) {
    case 'pin':
      if (!game.pin(value('addpin'))) toast('Выберите материал для доски')
      break
    case 'pinread': {
      const e = game.entries().find((e) => e.id === selected)
      if (e) modal(e.name, `${photo(e.art, '', 'exhibit')}<p>${esc(e.text)}</p>`)
      return true
    }
    case 'link':
      connect(value('pinA'), value('pinB'))
      break
    case 'shift': {
      const p = game.g.pins.find((p) => p.id === selected)
      if (p) {
        const [x, y] = [
          [-30, 0],
          [30, 0],
          [0, -30],
          [0, 30],
        ][Number(id)]
        game.move(p.id, p.x + x, p.y + y)
      }
      break
    }
    case 'unpin':
      game.unpin(selected)
      selected = ''
      break
    case 'unlink':
      game.g.links.splice(Number(id), 1)
      break
    default:
      return false
  }
  persist()
  return true
}
export function bindDrag(refresh: () => void) {
  for (const el of document.querySelectorAll<HTMLButtonElement>('.pincard')) {
    let drag: { x: number; y: number; left: number; top: number; moved: boolean } | undefined
    const id = el.dataset.pin!
    el.onpointerdown = (e) => {
      if (e.button !== 0) return
      const p = game.g.pins.find((p) => p.id === id)!
      drag = { x: e.clientX, y: e.clientY, left: p.x, top: p.y, moved: false }
      el.setPointerCapture(e.pointerId)
    }
    el.onpointermove = (e) => {
      if (!drag) return
      const dx = e.clientX - drag.x,
        dy = e.clientY - drag.y
      if (Math.abs(dx) + Math.abs(dy) < 5 && !drag.moved) return
      drag.moved = true
      game.move(id, drag.left + dx, drag.top + dy)
      const p = game.g.pins.find((p) => p.id === id)!
      el.style.transform = `translate(${p.x}px,${p.y}px)`
      for (const line of document.querySelectorAll<SVGLineElement>('line[data-a]')) {
        const n = line.dataset.a === id ? '1' : line.dataset.b === id ? '2' : ''
        if (n) {
          line.setAttribute('x' + n, String(p.x + 70))
          line.setAttribute('y' + n, String(p.y + 12))
        }
      }
    }
    el.onpointercancel = () => {
      drag = undefined
      persist()
    }
    el.onpointerup = () => {
      if (!drag) return
      const moved = drag.moved
      drag = undefined
      if (!moved && selected && selected !== id) {
        connect(selected, id)
        selected = ''
      } else selected = id
      persist()
      refresh()
    }
    el.onclick = (e) => {
      if (e.detail === 0) {
        if (selected && selected !== id) {
          connect(selected, id)
          selected = ''
        } else selected = id
        persist()
        refresh()
      }
    }
  }
}
