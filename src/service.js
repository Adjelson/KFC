import { challengeOrder } from './challenges.js';
import { orderDuration, orderProgress } from './orders.js';
import { productById } from './game.js';
export const CUSTOMER_TYPES={
 regular:{name:'Habitual',patience:1.2,bonus:1,icon:'♡',tag:'Tem o seu favorito'},
 rushed:{name:'Com pressa',patience:.8,bonus:1.35,icon:'ϟ',tag:'Menos espera, melhor gorjeta'},
 family:{name:'Família',patience:1.4,bonus:1.1,icon:'♧',tag:'Um pedido para partilhar'},
 foodie:{name:'Gourmet',patience:1,bonus:1.2,icon:'★',tag:'Valoriza uma boa montagem'},
};
const draw=random=>Math.min(.999999999,Math.max(0,Number(random())||0));
export function createServicePlan(run,career,random=Math.random){
 let previous;
 const types=Object.keys(CUSTOMER_TYPES);
 const customers=Array.from({length:run.clients},(_,i)=>{
  const type=types[Math.floor(draw(random)*types.length)],person=CUSTOMER_TYPES[type];
  const config=type==='rushed'?{...run,maxQuantity:1}:type==='family'?{...run,maxQuantity:Math.max(2,run.maxQuantity)}:run;
  let order=challengeOrder(config,i+1,previous,random);previous=order[0].recipeId;
  return {id:`c${i+1}`,type,number:i+1,order,duration:Math.round(orderDuration(order,run.limit)*person.patience*(1+career.upgrades.bench*.08))};
 });
 return {levelId:run.challengeId,customers};
}
export function startService(plan,now){
 return {plan,startedAt:now,customers:plan.customers.map((c,i)=>({...c,status:i<2?'active':'queued',deadline:i<2?now+c.duration*1000:null,arrivedAt:i<2?now:null,prepared:{},delivered:{},drafts:{},current:c.order[0].recipeId})),selected:plan.customers[0].id,nextArrivalAt:now+8000,served:0,lost:0,earned:0,streak:0,milestones:[],ratios:[],done:false};
}
export const customerProgress=c=>orderProgress(c.order,Object.fromEntries(c.order.map(l=>[l.recipeId,(c.prepared[l.recipeId]||0)+(c.delivered[l.recipeId]||0)])));
export const trayUsed=state=>state.customers.filter(c=>c.status==='active').reduce((n,c)=>n+Object.values(c.prepared).reduce((a,b)=>a+b,0),0);
export const activeCustomers=state=>state.customers.filter(c=>c.status==='active');
export function updateCustomer(state,id,update){return {...state,customers:state.customers.map(c=>c.id===id?update(c):c)};}
export function chooseCustomer(state,id){return state.customers.some(c=>c.id===id&&c.status==='active')?{...state,selected:id}:state;}
export function selectProduct(state,id){const c=state.customers.find(c=>c.id===state.selected);return c?.status==='active'&&c.order.some(l=>l.recipeId===id)?updateCustomer(state,c.id,c=>({...c,current:id})):state;}
export function setDraft(state,items){return updateCustomer(state,state.selected,c=>({...c,drafts:{...c.drafts,[c.current]:items}}));}
export function addPrepared(state,id,capacity,now){
 const c=state.customers.find(c=>c.id===state.selected),line=c?.order.find(l=>l.recipeId===id);
 if(!c||c.status!=='active'||now>=c.deadline||!line||trayUsed(state)>=capacity||(c.prepared[id]||0)+(c.delivered[id]||0)>=line.quantity)return {state,added:false};
 const next=updateCustomer(state,c.id,c=>{const prepared={...c.prepared,[id]:(c.prepared[id]||0)+1},nextLine=c.order.find(l=>(prepared[l.recipeId]||0)+(c.delivered[l.recipeId]||0)<l.quantity);return {...c,prepared,current:nextLine?.recipeId||id,drafts:{...c.drafts,[id]:[]}};});
 return {state:next,added:true};
}
function settle(state,now){
 let customers=state.customers;
 if(now>=state.nextArrivalAt&&customers.filter(c=>c.status==='active').length<3){const next=customers.find(c=>c.status==='queued');if(next)customers=customers.map(c=>c.id===next.id?{...c,status:'active',arrivedAt:now,deadline:now+c.duration*1000}:c);}
 const selected=customers.some(c=>c.id===state.selected&&c.status==='active')?state.selected:customers.find(c=>c.status==='active')?.id||null;
 return {...state,customers,selected,nextArrivalAt:customers!==state.customers?now+8000:state.nextArrivalAt,done:customers.every(c=>['served','lost'].includes(c.status))};
}
export function advanceService(state,now){
 const expired=state.customers.filter(c=>c.status==='active'&&now>=c.deadline);
 const next=expired.length?{...state,customers:state.customers.map(c=>expired.includes(c)?{...c,status:'lost',prepared:{},drafts:{}}:c),lost:state.lost+expired.length,streak:0,nextArrivalAt:Math.min(state.nextArrivalAt,now+1000)}:state;
 return settle(next,now);
}
export function deliverCustomer(state,id,now){
 const c=state.customers.find(c=>c.id===id);
 if(!c||c.status!=='active'||now>=c.deadline||!Object.values(c.prepared).some(n=>n>0))return {state,delivered:false,reward:0,complete:false};
 const delivered=Object.fromEntries(c.order.map(l=>[l.recipeId,(c.delivered[l.recipeId]||0)+(c.prepared[l.recipeId]||0)]));
 const complete=c.order.every(l=>delivered[l.recipeId]===l.quantity),ratio=Math.max(0,Math.min(1,(now-c.arrivedAt)/(c.duration*1000))),streak=complete?state.streak+1:state.streak;
 const reward=complete?Math.round((8+c.order.reduce((n,l)=>n+l.quantity,0)*3+Math.round((1-ratio)*5))*CUSTOMER_TYPES[c.type].bonus)+Math.min(streak-1,4)*2:0;
 let next=updateCustomer(state,id,c=>({...c,delivered,prepared:{},status:complete?'served':'active'}));
 if(complete)next={...next,served:state.served+1,earned:state.earned+reward,streak,milestones:[...state.milestones,(now-state.startedAt)/1000],ratios:[...state.ratios,ratio],nextArrivalAt:Math.min(state.nextArrivalAt,now+1000)};
 return {state:settle(next,now),delivered:true,reward,complete};
}
export function pauseService(state,delta){return {...state,startedAt:state.startedAt+delta,nextArrivalAt:state.nextArrivalAt+delta,customers:state.customers.map(c=>c.status==='active'?{...c,deadline:c.deadline+delta,arrivedAt:c.arrivedAt+delta}:c)};}
export function serviceSummary(state,now){const passed=state.served===state.plan.customers.length;return {plan:state.plan,passed,stars:passed?(state.ratios.every(r=>r<=.5)?3:state.ratios.every(r=>r<=.8)?2:1):0,served:state.served,total:state.plan.customers.length,earned:state.earned,duration:Math.max(.1,(now-state.startedAt)/1000),milestones:state.milestones};}
export const ghostServed=(record,elapsed)=>record?.milestones.filter(at=>at<=elapsed).length||0;
