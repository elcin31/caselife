export interface Pin {id:string;x:number;y:number}
export interface TimelineItem {id:string;proof:string;confidence:string}
export interface Theory {who:string;motive:string;method:string;proofs:string[]}
export type Outcome='solved'|'weak'|'wrong'|'open'
export interface Decision extends Theory {result:Outcome;order:string[];feedback:string[];at:string}
export interface Progress {
 caseId:string;active:boolean;locations:string[];people:string[];items:string[];talk:string[];findings:string[];
 pins:Pin[];links:[string,string][];ideas:{id:string;name:string}[];timeline:TimelineItem[];notes:string;journal:string[];decisions:Decision[]
}
export interface Save {v:2;game:Progress;settings:{sound:boolean;rain:boolean;large:boolean};archive:{caseId:string;name:string;at:string}[]}
export function blank(caseId:string):Progress{return {caseId,active:false,locations:[],people:[],items:[],talk:[],findings:[],pins:[],links:[],ideas:[],timeline:[],notes:'',journal:[],decisions:[]}}
export const fresh=(id:string):Save=>({v:2,game:blank(id),settings:{sound:true,rain:false,large:false},archive:[]})
