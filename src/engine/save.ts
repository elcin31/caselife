import { fresh, type Save } from './state'
const slot = 'casefile.archive'
export interface Slot {
  getItem(k: string): string | null
  setItem(k: string, v: string): void
}
export function decode(raw: string, id: string): Save {
  const data = JSON.parse(raw),
    base = fresh(id)
  if (data.v !== 1 && data.v !== 2) throw Error('Неизвестная версия сохранения')
  if (!data.game || data.game.caseId !== id) throw Error('Неизвестное дело')
  const game = { ...base.game, ...data.game }
  for (const k of Object.keys(base.game) as (keyof typeof base.game)[]) {
    const def = base.game[k]
    if (Array.isArray(def) ? !Array.isArray(game[k]) : typeof game[k] !== typeof def)
      throw Error('Повреждено поле ' + k)
  }
  return {
    v: 2,
    game,
    settings: { ...base.settings, ...data.settings },
    archive: Array.isArray(data.archive) ? data.archive : [],
  }
}
export function load(storage: Slot, id: string): Save {
  for (const key of [slot, slot + '.previous']) {
    const raw = storage.getItem(key)
    if (raw)
      try {
        return decode(raw, id)
      } catch {
        /* try previous completed save */
      }
  }
  return fresh(id)
}
export function save(storage: Slot, state: Save) {
  const raw = JSON.stringify(state),
    old = storage.getItem(slot)
  if (old === raw) return
  if (old) {
    try {
      decode(old, state.game.caseId)
      storage.setItem(slot + '.previous', old)
    } catch {
      /* preserve last readable copy */
    }
  }
  storage.setItem(slot, raw)
}
