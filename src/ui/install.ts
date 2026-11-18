import { btn, dlg, esc, modal } from './kit'
import { Capacitor } from '@capacitor/core'
interface InstallPrompt extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: string }>
}
let promptEvent: InstallPrompt | undefined
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  promptEvent = e as InstallPrompt
})
window.addEventListener('appinstalled', () => {
  promptEvent = undefined
  if (dlg().open)
    modal('Игра установлена', '<p>CASEFILE доступна с главного экрана устройства.</p>')
})
export function installOptions() {
  if (Capacitor.isNativePlatform()) return '<p class="muted">Игровые материалы входят в APK.</p>'
  const installed = window.matchMedia('(display-mode: standalone)').matches
  const ready = 'serviceWorker' in navigator && navigator.serviceWorker.controller
  return (
    '<div class="offline"><p>' +
    esc(
      ready
        ? 'Офлайн-материалы сохранены на устройстве.'
        : 'Офлайн-материалы подготавливаются при первом открытии.',
    ) +
    '</p>' +
    (installed ? '' : btn('install', 'Установить игру', '', 'folder')) +
    '</div>'
  )
}
export async function install() {
  if (promptEvent) {
    const event = promptEvent
    promptEvent = undefined
    await event.prompt()
    await event.userChoice
    return
  }
  modal(
    'Установка CASEFILE',
    '<p>В Chrome откройте меню браузера и выберите «Установить приложение» или «Добавить на главный экран». На iPhone откройте игру в Safari и выберите «Поделиться» → «На экран Домой».</p>',
  )
}
