import test from "node:test";
import assert from "node:assert/strict";
import {
  emptyCareer,
  loadCareer,
  earnCoins,
  validPlan,
} from "../src/career.js";
import {
  PANTRY_ITEMS,
  buyIngredient,
  campaignRecipes,
  canMake,
} from "../src/pantry.js";
import { productById, drinks } from "../src/game.js";
import {
  createServicePlan,
  startService,
  addPrepared,
  deliverCustomer,
  customerSeconds,
  customerMood,
  customerPatience,
  advanceService,
  pauseService,
} from "../src/service.js";
import {
  levels,
  createChallengeRun,
  trainingAccess,
} from "../src/challenges.js";
const storage = (map) => ({ getItem: (key) => JSON.stringify(map[key] || {}) });
const allStock = () =>
  PANTRY_ITEMS.reduce(
    (c, i) => buyIngredient(c, i.id).career,
    earnCoins(emptyCareer(), 1000),
  );
test("a new restaurant serves bread and each paid ingredient changes available recipes exactly once", () => {
  let c = emptyCareer();
  assert.deepEqual(
    campaignRecipes(c).map((p) => p.id),
    ["bread"],
  );
  assert.equal(buyIngredient(c, "tender").bought, false);
  c = earnCoins(c, 40);
  let purchase = buyIngredient(c, "tender");
  assert.equal(purchase.bought, true);
  c = purchase.career;
  assert.equal(c.coins, 25);
  assert.ok(campaignRecipes(c).some((p) => p.id === "mini-bun"));
  assert.equal(buyIngredient(c, "tender").bought, false);
  c = buyIngredient(c, "mayo").career;
  assert.ok(campaignRecipes(c).some((p) => p.id === "mayo-bun"));
  assert.equal(canMake(c, productById("krunch")), false);
  c = buyIngredient(c, "lettuce").career;
  assert.equal(canMake(c, productById("krunch")), true);
  assert.ok(trainingAccess({ 1: 3 }, c).recipeIds.includes("krunch"));
});
test("pantry persistence does not grant free food to a new player and older progress keeps its original ingredients", () => {
  const c = emptyCareer();
  const own = loadCareer(
    storage({
      "montagem-career": c,
      "montagem-levels": { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3 },
    }),
  );
  assert.deepEqual(own.ingredients, ["mini"]);
  const older = loadCareer(
    storage({
      "montagem-career": { coins: 20 },
      "montagem-levels": { 1: 3, 5: 3 },
    }),
  );
  assert.equal(older.coins, 20);
  for (const id of ["tender", "cheddar", "fries"])
    assert.ok(older.ingredients.includes(id));
  assert.equal(older.ingredients.includes("drink-coke"), false);
  assert.deepEqual(
    loadCareer(
      storage({
        "montagem-career": { ...c, ingredients: ["unknown", "mini", "mini"] },
      }),
    ).ingredients,
    ["mini"],
  );
});
test("new phases never request unpurchased ingredients and owned drinks enter from level three", () => {
  let seed = 99;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (const career of [
    emptyCareer(),
    buyIngredient(earnCoins(emptyCareer(), 40), "tender").career,
    allStock(),
  ])
    for (const l of levels) {
      const plan = createServicePlan(
        createChallengeRun(l, random),
        career,
        random,
      );
      assert.equal(validPlan(plan), true);
      for (const c of plan.customers)
        for (const line of c.order)
          assert.equal(canMake(career, productById(line.recipeId)), true);
      if (l.id < 3)
        assert.equal(
          plan.customers.some((c) =>
            c.order.some((l) => l.recipeId.startsWith("drink-")),
          ),
          false,
        );
      else if (career.ingredients.includes("drink-coke"))
        assert.ok(
          plan.customers.some((c) =>
            c.order.some((l) => l.recipeId.startsWith("drink-")),
          ),
        );
    }
});
const plan = {
  levelId: 1,
  customers: [
    {
      id: "c1",
      number: 1,
      type: "regular",
      duration: 30,
      order: [{ recipeId: "bread", quantity: 4 }],
    },
    {
      id: "c2",
      number: 2,
      type: "regular",
      duration: 40,
      order: [{ recipeId: "drink-coke", quantity: 1 }],
    },
  ],
};
test("partial delivery restores a small capped amount of time only for the customer receiving fresh products", () => {
  let s = startService(plan, 0);
  for (let i = 0; i < 2; i++) s = addPrepared(s, "bread", 2, 20000).state;
  const d = deliverCustomer(s, "c1", 21000);
  assert.equal(d.complete, false);
  assert.equal(d.patienceGain, 6);
  assert.equal(customerSeconds(d.state.customers[0], 21000), 15);
  assert.equal(d.state.customers[1].deadline, s.customers[1].deadline);
  assert.equal(deliverCustomer(d.state, "c1", 22000).patienceGain, undefined);
  s = addPrepared(d.state, "bread", 2, 23000).state;
  const again = deliverCustomer(s, "c1", 24000);
  assert.equal(again.patienceGain, 0);
  s = addPrepared(again.state, "bread", 2, 25000).state;
  const done = deliverCustomer(s, "c1", 26000);
  assert.equal(done.complete, true);
  assert.equal(done.patienceGain, 0);
  assert.equal(done.state.customers[0].bonusSeconds, 6);
});
test("visible seconds, moods and pause use each individual deadline, including delivery relief", () => {
  let s = startService(plan, 0);
  assert.equal(customerMood(s.customers[0], 0), "happy");
  assert.equal(customerMood(s.customers[0], 16000), "waiting");
  assert.equal(customerMood(s.customers[0], 24000), "angry");
  s = addPrepared(s, "bread", 2, 24000).state;
  s = deliverCustomer(s, "c1", 24000).state;
  assert.equal(customerMood(s.customers[0], 24000), "happy");
  assert.equal(customerMood(s.customers[0], 26000), "angry");
  assert.ok(customerPatience(s.customers[0], 0) <= 1);
  const p = pauseService(s, 10000);
  assert.equal(
    customerSeconds(p.customers[0], 34000),
    customerSeconds(s.customers[0], 24000),
  );
  assert.equal(customerMood(p.customers[0], 34000), "happy");
  assert.equal(advanceService(p, 43000).customers[0].status, "lost");
});
test("all three beverages validate as distinct order products", () => {
  assert.equal(new Set(drinks.map((d) => d.id)).size, 3);
  for (const d of drinks) assert.deepEqual(productById(d.id).items, [d.id]);
});

test("complete recipes replace introductory bread requests as ingredients are bought", () => {
  const c = allStock();
  assert.ok(campaignRecipes(c).length >= 4);
  assert.equal(
    campaignRecipes(c).some((p) => p.kind === "basic"),
    false,
  );
});
