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
test("challenge path introduces quantities, fries, doubles and faster customer sequences", () => {
  assert.equal(levels.length, 12);
  for (const level of levels)
    for (let customer = 1; customer <= level.clients; customer++) {
      const order = challengeOrder(level, customer, null, () => 0.3);
      assert.ok(
        order.every((line) => productById(line.recipeId) && line.quantity > 0),
      );
      assert.ok(orderProgress(order).total > 0);
      assert.ok(orderDuration(order, level.limit) > 0);
    }
  assert.equal(challengeOrder(levels[4], 3)[0].recipeId, "fries-large");
  assert.ok(levels[11].clients > levels[0].clients);
  assert.ok(levels[11].limit < levels[0].limit);
});
