import { game, head, esc, btn, nav, options, icon, modal } from './kit'
import type { Decision } from '../engine/state'
export function journal() {
  return (
    head('ЛИЧНЫЕ ЗАПИСИ', 'Журнал детектива') +
    `<label class="paper">Мои заметки<textarea id="notes" maxlength="12000" placeholder="Что стоит перепроверить?">${esc(game.g.notes)}</textarea></label><div class="sectiontitle"><h2>Ход расследования</h2><span class="kicker">${game.g.journal.length} ЗАП.</span></div><ol class="journal">${[
      ...game.g.journal,
    ]
      .reverse()
      .map((x) => `<li>${esc(x)}</li>`)
      .join('')}</ol>`
  )
}
export function timeline() {
  const events = game.file.events,
    g = game.g
  const available = events.filter(
    (e) => game.ready([e.requires]) && !g.timeline.some((t) => t.id === e.id),
  )
  const index = (id: string) => g.timeline.findIndex((e) => e.id === id)
  const contradiction = [
    ['payment', 'copy', 'В банковском журнале выдача зарегистрирована после приёма платежа.'],
    ['sound', 'latch', 'На ленте ключ слышен после хлопка.'],
    ['latch', 'ambulance', 'Звонок в скорую сделан уже у запертой двери.'],
  ].filter(([a, b]) => index(a) >= 0 && index(b) >= 0 && index(a) > index(b))
  return (
    head(
      'РЕКОНСТРУКЦИЯ',
      'Хронология',
      'Добавляйте установленные события и расставляйте их по времени. Этот порядок войдёт в ваше заключение.',
    ) +
    `<div class="boardbar"><label>Доступные события<select id="event"><option value="">Выберите событие</option>${options(available)}</select></label>${btn('event', 'Добавить событие', 'primary', 'clock')}</div>${!g.timeline.length ? '<p class="empty">События станут доступны после осмотра документов и бесед.</p>' : ''}
 ${g.timeline
   .map(
     (t, i) =>
       `<section class="timeitem"><small>ПОЗИЦИЯ ${i + 1}</small><h3>${events.find((e) => e.id === t.id)?.name}</h3><div class="fields"><label>Опора на улику<select data-proof="${i}"><option value="">Без привязки</option>${options(
         game.file.evidence.filter((e) => g.items.includes(e.id)),
         t.proof,
       )}</select></label><label>Уверенность<select data-confidence="${i}">${['Предположение', 'Вероятно', 'Уверен'].map((k) => `<option${k === t.confidence ? ' selected' : ''}>${k}</option>`).join('')}</select></label></div><div class="actions">${i ? btn('earlier:' + i, 'Раньше') : ''}${i < g.timeline.length - 1 ? btn('later:' + i, 'Позже') : ''}${btn('removeevent:' + i, 'Убрать')}</div></section>`,
   )
   .join('')}
 ${contradiction.map((x) => `<p class="callout">${icon('clock')}${x[2]}</p>`).join('')}`
  )
}
export const outcomeNames = {
  solved: 'Дело раскрыто',
  weak: 'Доказательств недостаточно',
  wrong: 'Обвинение отклонено',
  open: 'Заключение отложено',
}
export function result(d: Decision) {
  modal(
    outcomeNames[d.result],
    `<article class="paper ending"><small>РЕЧЕНСК · РЕЗОЛЮЦИЯ БЮРО</small>${d.feedback.map((x) => `<p>${esc(x)}</p>`).join('')}</article>${nav('office', 'В кабинет', 'primary', 'folder')}`,
  )
}
export function finale() {
  const g = game.g,
    f = game.file
  return (
    head(
      'ДЕЛО № 001',
      'Окончательное заключение',
      'Выберите версию, приложите выводы доски и проверьте последовательность в хронологии.',
    ) +
    `<form id="accusation" class="verdict"><div class="fields">${[
      ['who', 'Кого вы обвиняете?', f.people],
      ['motive', 'Мотив', f.motives],
      ['method', 'Способ и запертая комната', f.methods],
    ]
      .map(
        (row) =>
          `<label>${row[1]}<select name="${row[0]}" required><option value="">Выберите версию</option>${options(row[2] as { id: string; name: string }[])}</select></label>`,
      )
      .join(
        '',
      )}</div><h3>Последовательность событий</h3><p>${g.timeline.map((t) => f.events.find((e) => e.id === t.id)?.name).join(' → ') || 'Хронология пока пуста.'}</p>${nav('timeline', 'Редактировать хронологию', '', 'clock')}<h3>Ключевые доказательства</h3>${
      g.findings.length
        ? f.deductions
            .filter((d) => g.findings.includes(d.id))
            .map(
              (d) =>
                `<label class="check"><input type="checkbox" name="proof" value="${d.id}"> ${d.name}</label>`,
            )
            .join('')
        : '<p>Приложить можно выводы, которые вы откроете на доске расследования.</p>'
    }<div class="actions"><button type="submit" class="btn primary">${icon('scale')}Подать заключение</button>${btn('defer', 'Отложить решение')}</div></form>
 ${g.decisions.length ? `<h2>Предыдущие заключения</h2><div class="rows">${g.decisions.map((d, i) => btn('decision:' + i, '№ ' + (i + 1) + ' · ' + outcomeNames[d.result], 'row', 'file')).join('')}</div>` : ''}`
  )
}
