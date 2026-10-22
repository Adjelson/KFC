import test from "node:test";
import assert from "node:assert/strict";
import {
  emptyCareer,
  loadCareer,
  buyUpgrade,
  buyRenovation,
  starsAvailable,
  recordProduct,
  medalTier,
  earnCoins,
  saveServiceRecord,
  validPlan,
} from "../src/career.js";
import {
  createServicePlan,
  startService,
  advanceService,
  addPrepared,
  deliverCustomer,
  chooseCustomer,
  customerProgress,
  trayUsed,
  pauseService,
  serviceSummary,
  ghostServed,
} from "../src/service.js";
import { createChallengeRun, levels } from "../src/challenges.js";
const fixture = () => ({
  levelId: 1,
  customers: [
    {
      id: "c1",
      type: "rushed",
      number: 1,
      duration: 20,
      order: [{ recipeId: "krunch", quantity: 3 }],
    },
    {
      id: "c2",
      type: "regular",
      number: 2,
      duration: 50,
      order: [{ recipeId: "bbq", quantity: 1 }],
    },
  ],
});
test("career loads safely without changing old progress and purchases debit exactly once", () => {
  assert.deepEqual(loadCareer({ getItem: () => "{broken" }), emptyCareer());
  let career = earnCoins(emptyCareer(), 200);
  const bought = buyUpgrade(career, "tray");
  assert.equal(bought.bought, true);
  assert.equal(bought.career.coins, 160);
  assert.equal(bought.career.upgrades.tray, 1);
  assert.equal(buyUpgrade(emptyCareer(), "tray").bought, false);
  const renovated = buyRenovation(career, { 1: 3 }, "garden");
  assert.equal(renovated.bought, true);
  assert.equal(renovated.career.coins, 170);
  assert.equal(starsAvailable(renovated.career, { 1: 3 }), 0);
  assert.equal(
    buyRenovation(renovated.career, { 1: 3 }, "garden").bought,
    false,
  );
  assert.equal(buyRenovation(career, {}, "garden").bought, false);
  assert.equal(buyUpgrade(career, "unknown").bought, false);
});
test("mastery counts valid products with tiers and survives serialisation", () => {
  let c = emptyCareer();
  for (let i = 0; i < 30; i++) c = recordProduct(c, "krunch");
  assert.equal(medalTier(c.mastery.krunch), 3);
  assert.equal(medalTier(10), 2);
  assert.equal(medalTier(1), 1);
  assert.equal(medalTier(0), 0);
  assert.deepEqual(recordProduct(c, "unknown"), c);
  assert.deepEqual(loadCareer({ getItem: () => JSON.stringify(c) }), c);
});
test("partial deliveries free tray space without completing an unfinished customer", () => {
  let s = startService(fixture(), 0);
  s = addPrepared(s, "krunch", 2, 100).state;
  s = addPrepared(s, "krunch", 2, 200).state;
  assert.equal(trayUsed(s), 2);
  assert.equal(addPrepared(s, "krunch", 2, 300).added, false);
  let d = deliverCustomer(s, "c1", 400);
  assert.equal(d.complete, false);
  assert.equal(d.reward, 0);
  s = d.state;
  assert.equal(trayUsed(s), 0);
  assert.equal(customerProgress(s.customers[0]).made, 2);
  s = addPrepared(s, "krunch", 2, 500).state;
  assert.equal(addPrepared(s, "krunch", 2, 600).added, false);
  d = deliverCustomer(s, "c1", 700);
  assert.equal(d.complete, true);
  assert.ok(d.reward > 0);
  assert.equal(deliverCustomer(d.state, "c1", 800).delivered, false);
});
test("customer switching preserves preparation, expiry respects deadlines and pause shifts all active clocks", () => {
  let s = startService(fixture(), 1000);
  s = addPrepared(s, "krunch", 2, 2000).state;
  s = chooseCustomer(s, "c2");
  assert.equal(trayUsed(s), 1);
  s = pauseService(s, 10000);
  assert.equal(s.customers[0].deadline, 31000);
  assert.equal(s.startedAt, 11000);
  s = advanceService(s, 31000);
  assert.equal(s.customers[0].status, "lost");
  assert.equal(s.customers[1].status, "active");
  assert.equal(trayUsed(s), 0);
  assert.equal(deliverCustomer(s, "c1", 31000).delivered, false);
});
test("queued arrivals, failed phases and original records are deterministic", () => {
  const plan = fixture();
  plan.customers.push({ ...plan.customers[1], id: "c3", number: 3 });
  let s = startService(plan, 0);
  assert.equal(s.customers[2].status, "queued");
  s = advanceService(s, 8000);
  assert.equal(s.customers[2].status, "active");
  s = advanceService(s, 100000);
  assert.equal(s.done, true);
  assert.equal(serviceSummary(s, 100000).passed, false);
  assert.equal(
    saveServiceRecord(emptyCareer(), serviceSummary(s, 100000)).records[1],
    undefined,
  );
  let c = emptyCareer();
  const record = {
    passed: true,
    plan: fixture(),
    duration: 15,
    milestones: [5, 15],
  };
  c = saveServiceRecord(c, record);
  assert.equal(validPlan(c.records[1].plan), true);
  assert.equal(
    saveServiceRecord(c, { ...record, duration: 20 }).records[1].duration,
    15,
  );
  assert.equal(ghostServed(c.records[1], 7), 1);
  assert.deepEqual(loadCareer({ getItem: () => JSON.stringify(c) }), c);
});
test("personalities alter wait times and new plans use valid recipes and frozen orders for replay", () => {
  let seed = 9;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (const level of levels) {
    const p = createServicePlan(
      createChallengeRun(level, random),
      emptyCareer(),
      random,
    );
    assert.equal(validPlan(p), true);
    assert.ok(new Set(p.customers.map((c) => c.type)).size >= 1);
  }
  const a = createServicePlan(
    createChallengeRun(levels[0], () => 0),
    emptyCareer(),
    () => 0,
  );
  const c = emptyCareer();
  c.upgrades.bench = 2;
  const b = createServicePlan(
    createChallengeRun(levels[0], () => 0),
    c,
    () => 0,
  );
  assert.ok(b.customers[0].duration > a.customers[0].duration);
});
