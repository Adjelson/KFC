import test from "node:test";
import assert from "node:assert/strict";
import {
  makeOrder,
  orderProgress,
  creditSandwich,
  nextRecipe,
  orderBestKey,
  loadTotals,
  addTotals,
} from "../src/orders.js";
test("repeated sandwiches become one line with an exact requested quantity", () => {
  assert.deepEqual(makeOrder({ choice: "krunch", quantity: 3 }), [
    { recipeId: "krunch", quantity: 3 },
  ]);
});
test("mixed orders guarantee different types while preserving repeated quantities", () => {
  assert.deepEqual(
    makeOrder(
      { choice: "krunch", quantity: 3, assortment: "mixed" },
      null,
      () => 0,
    ),
    [
      { recipeId: "krunch", quantity: 2 },
      { recipeId: "bbq", quantity: 1 },
    ],
  );
});
test("all four recipes can appear in one mixed order and order size is bounded", () => {
  const values = [0, 0.6, 0.99];
  const order = makeOrder(
    { choice: "krunch", quantity: 4, assortment: "mixed" },
    null,
    () => values.shift(),
  );
  assert.equal(order.length, 4);
  assert.equal(orderProgress(order).total, 4);
  assert.equal(orderProgress(makeOrder({ quantity: 99 })).total, 4);
  assert.equal(orderProgress(makeOrder({ quantity: -1 })).total, 1);
});
test("crediting respects per-product quotas, cannot mutate the input or add an unknown product", () => {
  const order = makeOrder({ choice: "bbq", quantity: 2 }),
    initial = {};
  const first = creditSandwich(order, initial, "bbq");
  assert.equal(first.added, true);
  assert.deepEqual(initial, {});
  const second = creditSandwich(order, first.counts, "bbq");
  assert.equal(orderProgress(order, second.counts).complete, true);
  assert.equal(creditSandwich(order, second.counts, "bbq").added, false);
  assert.equal(creditSandwich(order, second.counts, "classic").added, false);
});
test("progress and next product preserve unfinished duplicate portions", () => {
  const order = [
    { recipeId: "krunch", quantity: 2 },
    { recipeId: "bbq", quantity: 1 },
  ];
  assert.equal(nextRecipe(order, { krunch: 1 }).id, "krunch");
  assert.equal(nextRecipe(order, { krunch: 2 }).id, "bbq");
  assert.equal(nextRecipe(order, { krunch: 2, bbq: 1 }), null);
  assert.deepEqual(orderProgress(order, { krunch: 1, bbq: 1 }), {
    lines: [
      { recipeId: "krunch", quantity: 2, prepared: 1 },
      { recipeId: "bbq", quantity: 1, prepared: 1 },
    ],
    total: 3,
    made: 2,
    complete: false,
  });
});
test("combo records are independent of line ordering and never overwrite single-product records", () => {
  const a = [
    { recipeId: "krunch", quantity: 2 },
    { recipeId: "bbq", quantity: 1 },
  ];
  assert.equal(orderBestKey(a, 60), orderBestKey([...a].reverse(), 60));
  assert.notEqual(orderBestKey(a, 60), "krunch:60");
  assert.equal(
    orderBestKey([{ recipeId: "krunch", quantity: 1 }], 60),
    "krunch:60",
  );
});
test("accumulated counters survive loading and reject invalid saved counts", () => {
  const totals = addTotals(
    { orders: 2, sandwiches: 5 },
    { orders: 1, sandwiches: 3 },
  );
  assert.deepEqual(totals, { orders: 3, sandwiches: 8, fries: 0 });
  assert.deepEqual(
    loadTotals({ getItem: () => JSON.stringify(totals) }),
    totals,
  );
  assert.deepEqual(
    loadTotals({ getItem: () => '{"orders":-1,"sandwiches":"9"}' }),
    { orders: 0, sandwiches: 0, fries: 0 },
  );
  assert.deepEqual(
    loadTotals({
      getItem() {
        throw Error("blocked");
      },
    }),
    { orders: 0, sandwiches: 0, fries: 0 },
  );
});
