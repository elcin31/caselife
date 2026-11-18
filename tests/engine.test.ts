import { test } from 'node:test'
import assert from 'node:assert/strict'
import { case001 as file } from '../src/content/case'
import { Investigation } from '../src/engine/investigation'
import { fresh } from '../src/engine/state'
import { decode, load, save } from '../src/engine/save'
function setup() {
  const m = new Investigation(file, fresh(file.id))
  m.start()
  return m
}
function discover(m: Investigation) {
  for (let pass = 0; pass < 8; pass++) {
    for (const p of file.places) {
      if (m.visit(p.id))
        for (const e of file.evidence.filter((x) => x.place === p.id)) m.collect(e.id)
    }
    for (const p of file.people) {
      m.contact(p.id)
      for (const t of p.topics) m.ask(p.id, t.id)
    }
  }
}
function complete() {
  const m = setup()
  discover(m)
  for (const d of file.deductions) {
    for (const id of d.facts) m.pin(id)
    for (const f of d.facts.slice(1)) m.link(d.facts[0], f)
  }
  for (const id of file.assessment.order) m.addEvent(id)
  return m
}
const thesis = () => ({ ...file.assessment, proofs: [...file.assessment.proofs] })
test('locked places, unseen exhibits and repeated collections', () => {
  const m = setup()
  assert.equal(m.visit('bank'), false)
  assert.equal(m.collect('letter'), false)
  m.visit('study')
  assert(m.collect('letter'))
  assert(!m.collect('letter'))
  assert(m.visit('bank'))
  assert(!m.collect('issue'))
})
test('confrontation needs both exhibit and prior statement', () => {
  const m = setup()
  m.contact('lida')
  assert(!m.ask('lida', 'l_tape'))
  m.visit('parlor')
  m.collect('photo')
  assert(!m.ask('lida', 'l_tape'))
  m.contact('nina')
  assert(m.ask('nina', 'n_lida'))
  assert(m.ask('lida', 'l_tape'))
  assert(m.collect('tape'))
})
test('all locations, interviews and papers are reachable without injected facts', () => {
  const m = setup()
  discover(m)
  assert.equal(m.g.items.length, file.evidence.length)
  assert.equal(m.g.talk.length, file.people.flatMap((p) => p.topics).length)
  assert.equal(m.g.locations.length, 6)
  assert.deepEqual(m.g.decisions, [])
  assert.deepEqual(m.g.findings, [])
  assert.deepEqual(m.data.archive, [])
})
test('false connections, self-links and duplicate links yield no inference', () => {
  const m = setup()
  discover(m)
  for (const id of ['ticket', 'letter', 'order']) m.pin(id)
  assert(m.link('ticket', 'order'))
  assert(!m.link('order', 'ticket'))
  assert(!m.link('letter', 'letter'))
  assert(!m.link('old', 'order'))
  assert.deepEqual(m.g.findings, [])
})
test('connected independent facts open all six deductions', () => {
  const m = complete()
  assert.equal(m.g.findings.length, file.deductions.length)
  assert.equal(m.g.decisions.length, 0)
})
test('accusation requires evidence in the actual file and correct chronology', () => {
  const m = setup()
  assert.equal(m.assess(thesis()).result, 'weak')
  const done = complete()
  done.reorder(1, 1)
  assert.equal(done.assess(thesis()).result, 'weak')
  done.reorder(1, 1)
  assert.equal(done.assess({ ...thesis(), proofs: [] }).result, 'weak')
  assert.equal(done.assess({ ...thesis(), method: 'spare' }).result, 'weak')
  assert.equal(done.assess({ ...thesis(), motive: 'debt' }).result, 'weak')
  assert.equal(done.assess(thesis()).result, 'solved')
})
test('wrong accusation and deferral leave the case open for revision', () => {
  const m = complete()
  for (const p of file.people.filter((p) => p.id !== file.assessment.who))
    assert.equal(m.assess({ ...thesis(), who: p.id }).result, 'wrong')
  assert.equal(m.assess(thesis(), true).result, 'open')
  assert.equal(m.data.archive.length, 0)
  m.assess(thesis())
  m.assess(thesis())
  assert.equal(m.data.archive.length, 1)
  assert.equal(m.g.decisions.length, 7)
})
test('save/load round trip preserves cards, witnesses, conclusions and notes', () => {
  const m = complete(),
    mem = new Map<string, string>()
  const slot = {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => {
      mem.set(k, v)
    },
  }
  m.move('issue', 107, 209)
  m.g.notes = 'Сверить время'
  m.g.timeline[0].proof = 'order'
  m.data.settings.large = true
  m.assess(thesis())
  save(slot, m.data)
  const restored = load(slot, file.id)
  assert.deepEqual(restored, m.data)
  m.g.notes = 'Ещё запись'
  save(slot, m.data)
  mem.set('casefile.archive', '{')
  assert.deepEqual(load(slot, file.id), restored)
})
test('older save acquires new defaults; new game retains closed archive and settings', () => {
  const m = complete()
  m.assess(thesis())
  const old = JSON.parse(JSON.stringify(m.data))
  old.v = 1
  delete old.game.ideas
  delete old.settings.large
  const current = decode(JSON.stringify(old), file.id)
  assert.deepEqual(current.game.ideas, [])
  assert.equal(current.settings.large, false)
  m.data.settings.rain = true
  m.start()
  assert.equal(m.data.archive.length, 1)
  assert.equal(m.data.settings.rain, true)
  assert.equal(m.g.items.length, 0)
})
test('removing a pin clears its links and keeps recorded discoveries', () => {
  const m = complete()
  const count = m.g.findings.length
  m.unpin('issue')
  assert(!m.g.links.some((l) => l.includes('issue')))
  assert.equal(m.g.findings.length, count)
  assert(m.pin('issue'))
  assert(!m.pin('issue'))
})
