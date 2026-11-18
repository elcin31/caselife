import { game, btn, nav, card, photo, icon, head, esc } from './kit'
const tools = [
  ['map', 'pin', 'Карта мест'],
  ['people', 'phone', 'Телефон'],
  ['board', 'board', 'Доска улик'],
  ['docs', 'archive', 'Архив документов'],
  ['timeline', 'clock', 'Хронология'],
  ['journal', 'book', 'Журнал'],
  ['final', 'scale', 'Заключение'],
]
export function menu() {
  const g = game.g
  return `<div class="home-intro"><span class="kicker"><i></i> ЧАСТНОЕ ДЕТЕКТИВНОЕ БЮРО</span><span class="issue">РЕЧЕНСК <b>/</b> 1998</span></div><section class="hero">
 <div class="corner tl"></div><div class="corner br"></div><div class="hero-copy"><div class="filetag">${icon('folder')} ДЕЛО № 001</div><h1>Последний<br><em>свидетель</em></h1><p>Запертая изнутри дверь. Прерванное письмо. И один свидетель, которого не должно было быть в доме.</p><div class="hero-meta"><span>${icon('pin')} Реченск</span><span>${icon('clock')} Ноябрь 1998</span></div><div class="actions">${g.active ? nav('office', 'Продолжить', 'primary', 'arrow') : btn('start', 'Начать расследование', 'primary', 'arrow')}${btn('brief', 'О деле', 'glass', 'file')}</div></div><span class="hero-folio">АРХИВ БЮРО &nbsp; / &nbsp; 001</span></section>
 <div class="sectiontitle"><div><span class="kicker">РАБОЧИЙ СТОЛ</span><h2>Материалы бюро</h2></div><span class="rule"></span>${icon('folder')}</div>
 <div class="homecards">${card('go:cases', 'drawers', 'КАРТОТЕКА', 'Выбор дела')}${card('go:closed', 'records', 'ХРАНИЛИЩЕ', 'Архив раскрытых дел')}${card('go:about', 'office', 'СПРАВКА', 'Информация о бюро')}</div>
 <div class="utility">${g.active ? btn('new', 'Новая игра', '', 'play') : ''}${btn('settings', 'Настройки', '', 'gear')}</div>`
}
export function office() {
  return (
    head(
      'ДЕЛО № 001  /  РАБОЧИЙ СТОЛ',
      'Кабинет детектива',
      'Папка на столе, карта и телефон в вашем распоряжении.',
    ) +
    `<div class="office scene">${photo('office', 'Кабинет детектива')}${[
      ['docs', 'Папка', 37, 74],
      ['board', 'Доска', 74, 32],
      ['map', 'Карта', 17, 38],
      ['people', 'Телефон', 85, 67],
      ['journal', 'Журнал', 60, 79],
    ]
      .map(
        ([id, l, x, y]) =>
          `<button class="hot" style="left:${x}%;top:${y}%" data-act="go:${id}" aria-label="${l}">+</button>`,
      )
      .join(
        '',
      )}</div><div class="toolgrid">${tools.map(([r, i, l]) => nav(r, l, 'tool', i)).join('')}</div><div class="callout">${icon('phone')}<div><b>Автоответчик</b><p>${game.g.items.includes('letter') ? 'Дежурный передал запрос в банк и архив пристани. Обе двери для вас открыты.' : 'Вдова оставила ключи от дома дежурному. Первичный осмотр можно начать с кабинета Орлова.'}</p></div></div>`
  )
}
export function casesView() {
  return (
    head('КАРТОТЕКА', 'Выбор дела') +
    card(
      'brief',
      'cover',
      'ДЕЛО № 001 · РЕЧЕНСК, 1998',
      'Последний свидетель',
      'Материалы о смерти предпринимателя Виктора Орлова.',
    )
  )
}
export function closed() {
  return (
    head('ХРАНИЛИЩЕ', 'Архив раскрытых дел') +
    (game.data.archive.length
      ? game.data.archive
          .map((x) =>
            card(
              'readclosed',
              'drawers',
              'ЗАКЛЮЧЕНИЕ ПРИНЯТО · ' + new Date(x.at).toLocaleDateString('ru-RU'),
              esc(x.name),
            ),
          )
          .join('')
      : `<div class="empty">${icon('archive')}<h3>В архиве пока нет закрытых дел</h3><p>Здесь хранится заключение после доказанного раскрытия.</p>${nav(game.g.active ? 'office' : 'cases', 'Открыть папку', 'primary', 'folder')}</div>`)
  )
}
export function about() {
  return (
    head('СПРАВКА', 'О бюро CASEFILE') +
    `<img class="about-mark" src="./logo.svg" alt="CASEFILE"><article class="paper"><small>РЕЧЕНСК · ЧАСТНАЯ ПРАКТИКА</small><h2>Архив нераскрытых дел</h2><p>Вы ведёте дело сами. Осматривайте предметы и читайте обороты листов. Возвращайтесь к собеседникам с найденными документами. На доске соединяйте факты, которые объясняют друг друга.</p><p>В хронологии расставляйте события и отмечайте, насколько доверяете их источникам. Заключение можно отложить, а к ошибочной версии вернуться. Журнал сохраняется на этом устройстве.</p><hr><p>Оригинальная вымышленная история. Иллюстрации созданы для игры. Атмосфера и звуки синтезируются на устройстве.</p><small>ИЗДАНИЕ 1.0.0</small></article>`
  )
}
