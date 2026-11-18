import type { Case, Topic } from '../content/types'
import { blank, type Save, type Theory, type Outcome, type Decision } from './state'
export class Investigation {
  constructor(
    readonly file: Case,
    readonly data: Save,
  ) {}
  get g() {
    return this.data.game
  }
  get facts() {
    return new Set([...this.g.items, ...this.g.talk, ...this.g.findings])
  }
  ready(ids: string[] = []) {
    return ids.every((id) => this.facts.has(id))
  }
  start() {
    this.data.game = blank(this.file.id)
    this.g.active = true
    this.log('Принято дело «' + this.file.name + '». В папку вложен первичный протокол.')
  }
  log(line: string) {
    this.g.journal.push(line)
  }
  visit(id: string) {
    const p = this.file.places.find((p) => p.id === id)
    if (!this.g.active || !p || !this.ready(p.needs)) return false
    if (!this.g.locations.includes(id)) {
      this.g.locations.push(id)
      this.log('Осмотр места: ' + p.name)
    }
    return true
  }
  collect(id: string) {
    const e = this.file.evidence.find((e) => e.id === id)
    if (
      !e ||
      !this.g.locations.includes(e.place) ||
      !this.ready(e.needs) ||
      this.g.items.includes(id)
    )
      return false
    this.g.items.push(id)
    this.log('Приобщено: ' + e.name)
    return true
  }
  contact(id: string) {
    const p = this.file.people.find((p) => p.id === id)
    if (!this.g.active || !p) return false
    if (!this.g.people.includes(id)) {
      this.g.people.push(id)
      this.log('Заведено досье: ' + p.name)
    }
    return true
  }
  available(t: Topic) {
    return this.ready(t.needs) && (!t.exhibit || this.g.items.includes(t.exhibit))
  }
  ask(person: string, id: string) {
    const t = this.file.people.find((p) => p.id === person)?.topics.find((t) => t.id === id)
    if (!this.g.people.includes(person) || !t || !this.available(t)) return false
    if (!this.g.talk.includes(id)) {
      this.g.talk.push(id)
      this.log(t.note || 'Показания: ' + t.ask)
    }
    return true
  }
  entries() {
    return [
      ...this.file.evidence
        .filter((e) => this.g.items.includes(e.id))
        .map((e) => ({ ...e, type: 'Улика' })),
      ...this.file.people
        .filter((p) => this.g.people.includes(p.id))
        .map((p) => ({ ...p, type: 'Лицо' })),
      ...this.file.people.flatMap((p) =>
        p.topics
          .filter((t) => this.g.talk.includes(t.id))
          .map((t) => ({ id: t.id, name: t.ask, art: p.art, text: t.answer, type: 'Показание' })),
      ),
      ...this.file.deductions
        .filter((d) => this.g.findings.includes(d.id))
        .map((d) => ({ ...d, type: 'Вывод' })),
      ...this.g.ideas.map((i) => ({ ...i, art: 'letter', text: i.name, type: 'Гипотеза' })),
    ]
  }
  idea(title: string) {
    if (!title.trim()) return
    const id = 'idea-' + (this.g.ideas.length + 1)
    this.g.ideas.push({ id, name: title.trim().slice(0, 180) })
    this.pin(id)
    this.log('Гипотеза: ' + title.trim().slice(0, 180))
  }
  pin(id: string) {
    if (!this.entries().some((x) => x.id === id) || this.g.pins.some((p) => p.id === id))
      return false
    const i = this.g.pins.length
    this.g.pins.push({ id, x: 18 + (i % 4) * 176, y: 18 + (Math.floor(i / 4) % 4) * 130 })
    return true
  }
  move(id: string, x: number, y: number) {
    const p = this.g.pins.find((p) => p.id === id)
    if (p && Number.isFinite(x) && Number.isFinite(y)) {
      p.x = Math.max(0, Math.min(566, x))
      p.y = Math.max(0, Math.min(416, y))
    }
  }
  unpin(id: string) {
    this.g.pins = this.g.pins.filter((p) => p.id !== id)
    this.g.links = this.g.links.filter((l) => !l.includes(id))
  }
  link(a: string, b: string) {
    if (
      a === b ||
      ![a, b].every((id) => this.g.pins.some((p) => p.id === id)) ||
      this.g.links.some((l) => l.includes(a) && l.includes(b))
    )
      return false
    this.g.links.push([a, b])
    for (const d of this.file.deductions) {
      if (this.g.findings.includes(d.id) || !this.ready(d.facts)) continue
      const reached = new Set([d.facts[0]])
      for (let i = 0; i < d.facts.length; i++)
        for (const [x, y] of this.g.links) {
          if (d.facts.includes(x) && d.facts.includes(y) && (reached.has(x) || reached.has(y))) {
            reached.add(x)
            reached.add(y)
          }
        }
      if (reached.size === d.facts.length) {
        this.g.findings.push(d.id)
        this.log('Сопоставление: ' + d.name)
      }
    }
    return true
  }
  addEvent(id: string) {
    const e = this.file.events.find((e) => e.id === id)
    if (!e || !this.ready([e.requires]) || this.g.timeline.some((x) => x.id === id)) return false
    this.g.timeline.push({ id, proof: '', confidence: 'Предположение' })
    return true
  }
  reorder(index: number, delta: number) {
    const line = this.g.timeline,
      j = index + delta
    if (!line[index] || !line[j]) return
    ;[line[index], line[j]] = [line[j], line[index]]
  }
  assess(t: Theory, defer = false): Decision {
    const a = this.file.assessment,
      timeline = this.g.timeline.map((e) => e.id),
      feedback: string[] = []
    const chron =
      this.g.timeline.every((row, i) => {
        const k = [...a.order, ...a.optionalOrder].indexOf(row.id)
        return i === 0 || [...a.order, ...a.optionalOrder].indexOf(this.g.timeline[i - 1].id) < k
      }) && a.order.every((id) => timeline.includes(id))
    let result: Outcome = 'open'
    if (defer) {
      feedback.push(
        'Материалы останутся в кабинете. В журнале зафиксировано решение продолжить поиск.',
      )
    } else if (t.who !== a.who) {
      result = 'wrong'
      feedback.push(
        a.rebuttals[t.who] || 'Представленных материалов недостаточно.',
        'Следователь вернул папку. Вы можете пересмотреть показания и представить другую версию.',
      )
    } else {
      if (t.motive !== a.motive) feedback.push(a.motiveGap)
      if (t.method !== a.method) feedback.push(a.methodGap)
      if (!chron)
        feedback.push(
          'В хронологии нет согласованной последовательности банковских и домашних событий.',
        )
      for (const id of a.proofs)
        if (!t.proofs.includes(id) || !this.g.findings.includes(id)) feedback.push(a.gaps[id])
      result = feedback.length ? 'weak' : 'solved'
      if (result === 'solved') feedback.push(a.ending)
    }
    const decision = {
      ...t,
      proofs: [...t.proofs],
      order: timeline,
      result,
      feedback,
      at: new Date().toISOString(),
    }
    this.g.decisions.push(decision)
    this.log('Подшито заключение № ' + this.g.decisions.length)
    if (result === 'solved' && !this.data.archive.some((x) => x.caseId === this.file.id))
      this.data.archive.push({ caseId: this.file.id, name: this.file.name, at: decision.at })
    return decision
  }
}
