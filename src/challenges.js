import { makeOrder } from './orders.js';
export const chapters = [
  {name:'Primeiros passos',icon:'🌱',description:'Conhece a bancada e serve os primeiros clientes.'},
  {name:'Hora do menu',icon:'🍟',description:'Combina sandes, batatas e novos tamanhos.'},
  {name:'Cozinha a todo o gás',icon:'🔥',description:'Double, pedidos variados e clientes com pressa.'},
];
const configs = [
  ['Primeiro serviço','krunch',1,'same',2,60,'single','none','small'],
  ['O toque BBQ','bbq',1,'same',3,60,'single','none','small'],
  ['Dose a dobrar','cheddar',2,'same',3,55,'single','none','small'],
  ['Cada cliente, um gosto','random',2,'mixed',3,50,'single','none','small'],
  ['Só batatas','random',1,'same',3,50,'single','only','small'],
  ['O primeiro menu','classic',1,'same',3,50,'single','with','small'],
  ['Mesa para dois','random',2,'mixed',4,45,'single','with','medium'],
  ['Menu grande','cheddar',2,'same',4,40,'single','with','large'],
  ['Primeiro Double','classic',1,'same',3,50,'double','none','small'],
  ['Queijo no meio','cheddar',1,'same',4,45,'double','with','medium'],
  ['Pedidos de todo o tipo','random',3,'mixed',4,35,'mixed','with','large'],
  ['Mestre da bancada','random',4,'mixed',5,25,'mixed','with','large'],
];
export const levels=configs.map(([name,choice,quantity,assortment,clients,limit,variant,side,friesSize],index)=>({id:index+1,chapter:Math.floor(index/4),name,choice,quantity,assortment,clients,limit,variant,side,friesSize}));
const KEY='montagem-levels';
export function loadProgress(storage=globalThis.localStorage) {
  try {const raw=JSON.parse(storage?.getItem(KEY)||'{}');return Object.fromEntries(levels.map(l=>[l.id,Number.isInteger(raw?.[l.id])?Math.max(0,Math.min(3,raw[l.id])):0]));} catch {return {};}
}
export function isUnlocked(id,progress) {return id===1 || (id>1 && levels.some(l=>l.id===id) && progress[id-1]>0);}
export function completeLevel(progress,id,stars) {
  if(!isUnlocked(id,progress)||!Number.isInteger(stars)||stars<1||stars>3)return progress;
  return {...progress,[id]:Math.max(progress[id]||0,stars)};
}
export function saveProgress(progress) {try {localStorage.setItem(KEY,JSON.stringify(progress));} catch {}}
export function challengeOrder(level,customer,previous,random=Math.random) {
  // Fries-only clients rotate through the three portions to teach each size.
  const config=level.side==='only'?{...level,friesSize:['small','medium','large'][(customer-1)%3]}:level;
  return makeOrder(config,previous,random);
}
