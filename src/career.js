import { products, productById } from './game.js';
export const CAREER_KEY='montagem-career';
export const UPGRADES=[
 {id:'tray',name:'Bandeja maior',icon:'tray',costs:[40,100],description:'Espaço para 4 e depois 6 produtos prontos.'},
 {id:'bench',name:'Bancada organizada',icon:'bench',costs:[50,120],description:'Mais 8% de tempo por melhoria para atender cada cliente.'},
];
export const RENOVATIONS=[
 {id:'garden',name:'Esplanada florida',coins:30,stars:3,description:'Flores, vasos e luzes no exterior.'},
 {id:'diner',name:'Sala renovada',coins:70,stars:6,description:'Balcões e mesas com novas cores e iluminação.'},
 {id:'chef',name:'Cozinha do chef',coins:120,stars:10,description:'Acabamentos dourados e um letreiro especial.'},
];
const count=n=>Number.isSafeInteger(n)&&n>=0?Math.min(n,1e9):0;
export const emptyCareer=()=>({coins:0,lifetimeCoins:0,spentStars:0,upgrades:{tray:0,bench:0},renovations:[],mastery:{},records:{}});
export function validPlan(plan){
 return plan&&Number.isInteger(plan.levelId)&&plan.levelId>=1&&plan.levelId<=12&&Array.isArray(plan.customers)&&plan.customers.length>=2&&plan.customers.length<=8&&new Set(plan.customers.map(c=>c.id)).size===plan.customers.length&&plan.customers.every((c,i)=>c.id===`c${i+1}`&&['regular','rushed','family','foodie'].includes(c.type)&&Number.isFinite(c.duration)&&c.duration>=10&&c.duration<=1500&&Array.isArray(c.order)&&c.order.length>0&&c.order.length<=5&&new Set(c.order.map(l=>l.recipeId)).size===c.order.length&&c.order.every(l=>productById(l.recipeId)&&Number.isInteger(l.quantity)&&l.quantity>=1&&l.quantity<=4));
}
export function loadCareer(storage=globalThis.localStorage){
 const base=emptyCareer();try{
  const raw=JSON.parse(storage?.getItem(CAREER_KEY)||'{}');
  for(const k of ['coins','lifetimeCoins','spentStars'])base[k]=count(raw?.[k]);
  for(const u of UPGRADES)base.upgrades[u.id]=Math.min(u.costs.length,count(raw?.upgrades?.[u.id]));
  base.renovations=RENOVATIONS.filter(r=>raw?.renovations?.includes?.(r.id)).map(r=>r.id);
  base.mastery=Object.fromEntries(products.filter(p=>count(raw?.mastery?.[p.id])>0).map(p=>[p.id,count(raw.mastery[p.id])]));
  for(const [key,record] of Object.entries(raw?.records||{}))if(validPlan(record?.plan)&&String(record.plan.levelId)===key&&Number.isFinite(record.duration)&&record.duration>0&&record.duration<=12000&&Array.isArray(record.milestones)&&record.milestones.length===record.plan.customers.length&&record.milestones.every((m,i,a)=>Number.isFinite(m)&&m>=0&&m<=record.duration&&(i===0||m>=a[i-1])))base.records[key]=record;
  return base;
 }catch{return base;}
}
export function saveCareer(career){try{localStorage.setItem(CAREER_KEY,JSON.stringify(career));}catch{}}
export const starsAvailable=(career,progress)=>Math.max(0,Object.values(progress).reduce((n,s)=>n+(Number.isInteger(s)&&s>=0&&s<=3?s:0),0)-career.spentStars);
export const trayCapacity=career=>2+career.upgrades.tray*2;
export const medalTier=n=>n>=30?3:n>=10?2:n>=1?1:0;
export const medalNames=['Por descobrir','Aprendiz','Especialista','Mestre'];
export function recordProduct(career,id){if(!productById(id))return career;return {...career,mastery:{...career.mastery,[id]:count(career.mastery[id])+1}};}
export function earnCoins(career,n){const earned=count(n);return {...career,coins:Math.min(1e9,career.coins+earned),lifetimeCoins:Math.min(1e9,career.lifetimeCoins+earned)};}
export function buyUpgrade(career,id){
 const upgrade=UPGRADES.find(u=>u.id===id),level=career.upgrades[id];
 if(!upgrade||!Number.isInteger(level)||level>=upgrade.costs.length||career.coins<upgrade.costs[level])return {career,bought:false};
 return {career:{...career,coins:career.coins-upgrade.costs[level],upgrades:{...career.upgrades,[id]:level+1}},bought:true};
}
export function buyRenovation(career,progress,id){
 const item=RENOVATIONS.find(r=>r.id===id);
 if(!item||career.renovations.includes(id)||career.coins<item.coins||starsAvailable(career,progress)<item.stars)return {career,bought:false};
 return {career:{...career,coins:career.coins-item.coins,spentStars:career.spentStars+item.stars,renovations:[...career.renovations,id]},bought:true};
}
export function saveServiceRecord(career,summary){
 if(!summary.passed||!validPlan(summary.plan)||!Number.isFinite(summary.duration)||summary.duration<=0||!Array.isArray(summary.milestones)||summary.milestones.length!==summary.plan.customers.length)return career;
 const old=career.records[summary.plan.levelId];
 if(old&&old.duration<=summary.duration)return career;
 return {...career,records:{...career.records,[summary.plan.levelId]:{duration:summary.duration,plan:summary.plan,milestones:summary.milestones}}};
}
