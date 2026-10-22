import test from "node:test";
import assert from "node:assert/strict";
import { doubles, productById, evaluate } from "../src/game.js";
import {
  makeOrder,
  orderProgress,
  nextRecipe,
  orderDuration,
  addTotals,
  loadTotals,
} from "../src/orders.js";
import {
  levels,
  isUnlocked,
  completeLevel,
  loadProgress,
  challengeOrder,
  createChallengeRun,
  trainingAccess,
  productUnlocked,
} from "../src/challenges.js";
test("Double requires two proteins, with cheese between them when present", () => {
  for (const recipe of doubles) {
    assert.equal(evaluate(recipe, recipe.items).perfect, true);
    const protein = recipe.items.includes("fillet") ? "fillet" : "tender";
    const one = [...recipe.items];
    one.splice(one.indexOf(protein), 1);
    assert.deepEqual(evaluate(recipe, one).missing, [protein]);
    if (recipe.items.includes("cheese")) {
      const wrong = [...recipe.items.filter((id) => id !== "cheese"), "cheese"];
      assert.equal(evaluate(recipe, wrong).stackError, true);
      assert.equal(evaluate(recipe, wrong).perfect, false);
    }
  }
});
test("fries can be ordered alone, in menus and tracked independently", () => {
  assert.deepEqual(
    makeOrder({ side: "only", quantity: 2, friesSize: "large" }),
    [{ recipeId: "fries-large", quantity: 2 }],
  );
  const menu = makeOrder({
    choice: "cheddar",
    variant: "double",
    side: "with",
    quantity: 2,
    friesSize: "medium",
  });
  assert.deepEqual(menu, [
    { recipeId: "cheddar-double", quantity: 2 },
    { recipeId: "fries-medium", quantity: 2 },
  ]);
  assert.equal(orderDuration(menu, 30), 84);
  assert.equal(
    orderProgress(menu, { "cheddar-double": 2, "fries-medium": 1 }).complete,
    false,
  );
  assert.equal(nextRecipe(menu, { "cheddar-double": 2 }).id, "fries-medium");
  assert.equal(
    evaluate(productById("fries-small"), ["fries-large"]).perfect,
    false,
  );
  assert.deepEqual(
    addTotals(loadTotals({ getItem: () => '{"orders":5,"sandwiches":9}' }), {
      fries: 2,
    }),
    { orders: 5, sandwiches: 9, fries: 2 },
  );
});
test("levels unlock sequentially and preserve better stars across restarts", () => {
  let progress = loadProgress({ getItem: () => '{"1":2,"2":-2,"3":"3"}' });
  assert.equal(isUnlocked(2, progress), true);
  assert.equal(isUnlocked(3, progress), false);
  assert.deepEqual(completeLevel(progress, 3, 3), progress);
  progress = completeLevel(progress, 2, 2);
  assert.equal(isUnlocked(3, progress), true);
  assert.equal(completeLevel(progress, 2, 1)[2], 2);
  assert.equal(isUnlocked(13, progress), false);
});
test('random clients stay within each difficulty range, with a fresh draw per run',()=>{
 for(const level of levels){
   assert.equal(createChallengeRun(level,()=>0).clients,level.clientRange[0]);
   assert.equal(createChallengeRun(level,()=>.999).clients,level.clientRange[1]);
 }
 assert.ok(levels[11].clientRange[1]>levels[0].clientRange[1]);
});
test('every level draws different products and quantities instead of a fixed recipe',()=>{
 for(const level of levels){
   let seed=149;const random=()=>((seed=(seed*16807)%2147483647)/2147483647);
   const signatures=new Set(),types=new Set();
   for(let i=0;i<60;i++){
     const order=challengeOrder(level,i+1,null,random);
     assert.ok(order.every(line=>productById(line.recipeId)&&line.quantity>0));
     assert.ok(orderDuration(order,level.limit)>0);
     signatures.add(JSON.stringify(order));order.forEach(line=>types.add(line.recipeId));
     if(level.id<5)assert.ok(order.every(line=>!line.recipeId.startsWith('fries-')));
     if(level.id<9)assert.ok(order.every(line=>!line.recipeId.endsWith('-double')));
   }
   assert.ok(signatures.size>1);assert.ok(types.size>=4);
 }
});
test('training, recipes and advanced products unlock progressively without resetting saved stars',()=>{
 assert.equal(trainingAccess({}).training,false);
 const first=trainingAccess({1:2});assert.equal(first.training,true);assert.deepEqual(first.recipeIds,['krunch']);
 assert.equal(productUnlocked('bbq',{1:3}),false);
 assert.equal(productUnlocked('bbq',{1:3,2:1}),true);
 assert.equal(productUnlocked('fries-large',{1:3,4:3}),false);
 assert.equal(productUnlocked('fries-large',{5:1}),true);
 assert.equal(productUnlocked('krunch-double',{9:1}),true);
 assert.deepEqual(productById('krunch').items,['mini','tender','lettuce','mayo']);
 const order=makeOrder({choice:'cheddar',quantity:4,assortment:'mixed',allowedRecipeIds:['krunch']},'krunch');
 assert.deepEqual(order,[{recipeId:'krunch',quantity:4}]);
});
