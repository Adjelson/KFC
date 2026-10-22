export const ingredients = [
  {id:'seeds', name:'Pão com sementes', icon:'🍔', type:'Pães'},
  {id:'mini', name:'Pão mini de sésamo', icon:'🍔', type:'Pães'},
  {id:'brioche', name:'Pão brioche', icon:'🥯', type:'Pães'},
  {id:'fillet', name:'Filete de frango', icon:'🍗', type:'Frango'},
  {id:'tender', name:'Tender de frango', icon:'🍗', type:'Frango'},
  {id:'lettuce', name:'Alface', icon:'🥬', type:'Vegetais'},
  {id:'tomato', name:'Tomate', icon:'🍅', type:'Vegetais'},
  {id:'cheese', name:'Queijo', icon:'🧀', type:'Extras'},
  {id:'bacon', name:'Bacon', icon:'🥓', type:'Extras'},
  {id:'mayo', name:'Maionese', icon:'🥣', type:'Molhos'},
  {id:'bbq', name:'Molho BBQ', icon:'🥣', type:'Molhos'},
  {id:'cheddar', name:'Molho cheddar', icon:'🥣', type:'Molhos'},
];
export const recipes = [
  {id:'krunch',name:'Krunch Clássico',items:['seeds','fillet','lettuce','mayo'],tag:'Um clássico crocante'},
  {id:'bbq',name:'Krunch BBQ',items:['mini','tender','cheese','bbq'],tag:'O toque fumado'},
  {id:'cheddar',name:'O’Cheddar',items:['brioche','fillet','cheese','bacon','cheddar','mayo'],tag:'Para fãs de queijo'},
  {id:'classic',name:'Clássica',items:['seeds','fillet','tomato','lettuce','mayo'],tag:'Fresca e crocante'},
];
export function evaluate(recipe, selected) {
  const missing=recipe.items.filter(id=>!selected.includes(id));
  const extra=[...new Set(selected)].filter(id=>!recipe.items.includes(id));
  const correct=recipe.items.filter(id=>selected.includes(id));
  return {missing,extra,correct,perfect:missing.length===0&&extra.length===0};
}
export const remainingSeconds=(deadline,now=Date.now())=>Math.max(0,Math.ceil((deadline-now)/1000));
export function pickRecipe(previous,random=Math.random) {
  const pool=recipes.filter(r=>r.id!==previous);
  return pool[Math.floor(random()*pool.length)];
}
