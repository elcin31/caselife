export interface Entry {id:string; name:string; art:string; text:string}
export interface Place extends Entry {area:string; needs?:string[]}
export interface Evidence extends Entry {
  place:string; x:number; y:number; object:string; observation:string; detail?:string; needs?:string[]; source:string
}
export type Reliability='Ложь'|'Ошибка памяти'|'Умолчание'|'Добросовестное заблуждение'|'Подтверждённый факт'
export interface Topic {id:string; ask:string; answer:string; needs?:string[]; exhibit?:string; note?:string; quality?:Reliability}
export interface Person extends Entry {role:string; interest:string; topics:Topic[]}
export interface Deduction extends Entry {facts:string[]}
export interface Incident {id:string; name:string; requires:string}
export interface Choice {id:string; name:string}
export interface Case {
  id:string; name:string; city:string; date:string; intro:string; places:Place[]; evidence:Evidence[]; people:Person[]; deductions:Deduction[]; events:Incident[];
  motives:Choice[]; methods:Choice[]; assessment:{who:string; motive:string; method:string; order:string[]; proofs:string[]; ending:string}
}
