import { test, expect } from "@playwright/test";
import {
  openApp,
  enterHome,
  startGame,
  expectFits,
  serveServiceClient,
  stockKitchen,
  closeLevelResult,
} from "./helpers.js";
const plan = {
  levelId: 12,
  customers: [
    {
      id: "c1",
      number: 1,
      type: "regular",
      duration: 200,
      order: [{ recipeId: "krunch", quantity: 3 }],
    },
    {
      id: "c2",
      number: 2,
      type: "foodie",
      duration: 160,
      order: [{ recipeId: "bbq", quantity: 1 }],
    },
  ],
};
async function seedRecord(page, custom = plan) {
  await page.addInitScript(
    (plan) =>
      localStorage.setItem(
        "montagem-career",
        JSON.stringify({
          records: {
            12: {
              plan,
              duration: 40,
              milestones: plan.customers.map((_, i) => 20 + i * 10),
            },
          },
        }),
      ),
    custom,
  );
}
async function fixedClock(page) {
  const epoch = new Date("2026-01-01T12:00:00Z");
  await page.clock.install({ time: epoch });
  await page.clock.pauseAt(new Date(epoch.getTime() + 1000));
}
async function assemble(page, items) {
  for (const id of items)
    await page.locator(`[data-ingredient="${id}"]`).click();
}
async function prepare(page) {
  await page.clock.runFor(400);
}
async function deliver(page) {
  await page.locator(".delivery-surface").press("Enter");
  await page.clock.runFor(600);
}

test("customers keep independent drafts and every clock pauses with help", async ({
  page,
}) => {
  await fixedClock(page);
  await stockKitchen(page);
  await openApp(page, { training: false, unlocked: false });
  await page.evaluate(() => (Math.random = () => 0.55));
  await startGame(page, { button: "Jogar nível 1", clock: true });
  await page.getByRole("button", { name: "Pão H1", exact: true }).click();
  await page.locator(".customer-card").nth(1).click();
  await page.getByRole("button", { name: "Queijo", exact: true }).click();
  await page.locator(".customer-card").nth(0).click();
  await expect(
    page.getByRole("button", { name: "Pão H1", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: "Queijo", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  await page.clock.runFor(8500);
  await expect(page.locator(".customer-card")).toHaveCount(3);
  const patience = await page
    .getByRole("progressbar")
    .evaluateAll((es) => es.map((e) => e.getAttribute("aria-valuenow")));
  await page.getByRole("button", { name: "Abrir ajuda" }).click();
  await page.clock.fastForward(120000);
  expect(
    await page
      .getByRole("progressbar")
      .evaluateAll((es) => es.map((e) => e.getAttribute("aria-valuenow"))),
  ).toEqual(patience);
  await page.keyboard.press("Escape");
  await page.clock.runFor(2200);
  const after = await page
    .getByRole("progressbar")
    .evaluateAll((es) =>
      es.map((e) => Number(e.getAttribute("aria-valuenow"))),
    );
  expect(after.every((v, i) => v < Number(patience[i]))).toBe(true);
  await page.locator(".customer-card").nth(1).click();
  await expect(
    page.getByRole("button", { name: "Queijo", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.clock.fastForward(300000);
  await expect(page.locator(".level-result")).toBeVisible();
  await closeLevelResult(page);
  await expect(page.locator(".completion-banner")).toContainText(
    "por concluir",
  );
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("montagem-career") || "{}").coins || 0,
    ),
  ).toBe(0);
});

test("a full tray requires partial delivery and coins are earned once per completed customer", async ({
  page,
}) => {
  await fixedClock(page);
  await seedRecord(page);
  await openApp(page, { training: false });
  await startGame(page, {
    button: "Desafiar recorde do nível 12",
    clock: true,
  });
  await expect(page.getByLabel("Comparação com o recorde")).toBeVisible();
  await page.clock.runFor(25000);
  await expect(page.locator(".ghost-pace")).toContainText("Recorde 1");
  for (let i = 0; i < 2; i++) {
    await assemble(page, ["mini", "tender", "lettuce", "mayo"]);
    await prepare(page);
  }
  await expect(page.getByLabel("Bandeja: 2 de 2 espaços")).toBeVisible();
  await assemble(page, ["mini", "tender", "lettuce", "mayo"]);
  await expect(page.getByRole("alert")).toContainText("Bandeja cheia");
  await deliver(page);
  await expect(page.locator(".order-line")).toContainText("2/3");
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("montagem-career")).coins,
    ),
  ).toBe(0);
  await expect(page.getByLabel("Bandeja: 0 de 2 espaços")).toBeVisible();
  await assemble(page, ["mini", "tender", "lettuce", "mayo"]);
  await prepare(page);
  await deliver(page);
  const earned = await page.evaluate(
    () => JSON.parse(localStorage.getItem("montagem-career")).coins,
  );
  expect(earned).toBeGreaterThan(0);
  await serveServiceClient(page, { clock: true });
  await expect(page.locator(".completion-banner")).toContainText(
    "Nível 12 concluído!",
  );
  const saved = await page.evaluate(() => ({
    career: JSON.parse(localStorage.getItem("montagem-career")),
    totals: JSON.parse(localStorage.getItem("montagem-totals")),
  }));
  expect(saved.totals).toEqual({ orders: 2, sandwiches: 4, fries: 0 });
  expect(saved.career.mastery).toMatchObject({ krunch: 3, bbq: 1 });
  expect(saved.career.records[12].plan).toEqual(plan);
  expect(saved.career.records[12].duration).toBeLessThan(40);
  expect(saved.career.records[12].milestones).toHaveLength(2);
  const coins = saved.career.coins;
  await page.clock.fastForward(10000);
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("montagem-career")).coins,
    ),
  ).toBe(coins);
});

test("preparation and service animate while duplicate actions stay blocked", async ({
  page,
}) => {
  await fixedClock(page);
  await openApp(page, { training: false, unlocked: false });
  await page.evaluate(() => (Math.random = () => 0));
  await startGame(page, { button: "Jogar nível 1", clock: true });
  await page.getByRole("button", { name: "Pão H1", exact: true }).click();
  await expect(page.locator(".ingredient-flight")).toHaveCount(1);
  await expect(page.locator(".ingredient-flight")).toHaveCount(1);
  await expect(page.locator(".package-prepare")).toBeVisible();
  await expect(page.locator(".customer-card").first()).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Abrir ajuda" }),
  ).toBeDisabled();
  await expect(page.locator(".mastery-toast")).toContainText("Aprendiz");
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("montagem-totals")).sandwiches,
    ),
  ).toBe(1);
  await page.clock.runFor(400);
  await page.locator(".delivery-surface").evaluate((b) => {
    b.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
    );
    b.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
    );
  });
  await expect(page.locator(".package-serve")).toBeVisible();
  await page.clock.runFor(600);
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("montagem-totals")).orders,
    ),
  ).toBe(1);
  await serveServiceClient(page, { clock: true });
  await expect(page.locator(".completion-banner")).toContainText("concluído");
});

for (const viewport of [
  { width: 320, height: 568 },
  { width: 740, height: 360 },
]) {
  test(`restaurant purchases, decoration and album fit and persist at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.addInitScript(() => {
      if (!localStorage.getItem("montagem-career"))
        localStorage.setItem(
          "montagem-career",
          JSON.stringify({
            coins: 400,
            mastery: { krunch: 30, bbq: 10, classic: 1 },
          }),
        );
    });
    await openApp(page, { training: false });
    await page.getByRole("button", { name: "Abrir restaurante" }).click();
    await page.getByRole("tab", { name: "Melhorias", exact: true }).click();
    await expectFits(page);
    await page
      .getByRole("button", { name: "Melhorar Bandeja maior por 40 moedas" })
      .click();
    await page
      .getByRole("button", { name: "Melhorar Bandeja maior por 100 moedas" })
      .click();
    await expect(
      page.getByRole("button", { name: "Bandeja maior ao máximo" }),
    ).toBeDisabled();
    await page
      .getByRole("button", {
        name: "Melhorar Bancada organizada por 50 moedas",
      })
      .click();
    await page.getByRole("tab", { name: "Decoração", exact: true }).click();
    await expectFits(page);
    await page
      .getByRole("button", { name: "Renovar Esplanada florida" })
      .click();
    await expect(page.locator(".renovation-card")).toHaveClass(/renovated/);
    await expect(
      page.getByRole("button", { name: "Renovar Esplanada florida" }),
    ).toBeDisabled();
    for (let i = 0; i < 2; i++) {
      await page.getByRole("button", { name: "Página seguinte" }).click();
      await expectFits(page);
    }
    await page.getByRole("tab", { name: "Álbum", exact: true }).click();
    await expect(page.locator(".medal-3")).toContainText("Mestre");
    await expectFits(page);
    await page.getByRole("button", { name: "Página seguinte" }).click();
    await expectFits(page);
    await page.keyboard.press("Escape");
    await expect(page.locator(".renovation-details")).not.toHaveCount(0);
    await page.reload();
    await enterHome(page, { training: false });
    const saved = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("montagem-career")),
    );
    expect(saved.coins).toBe(180);
    expect(saved.upgrades).toEqual({ tray: 2, bench: 1 });
    expect(saved.spentStars).toBe(3);
    expect(saved.renovations).toEqual(["garden"]);
    await page.getByRole("button", { name: "Abrir definições" }).click();
    await page.getByRole("tab", { name: "Movimento", exact: true }).click();
    await expectFits(page);
    await page.getByRole("switch", { name: "Cozinha horizontal" }).uncheck();
    await page.keyboard.press("Escape");
    await page.reload();
    await enterHome(page, { training: false });
    await page.getByRole("button", { name: "Abrir definições" }).click();
    await page.getByRole("tab", { name: "Movimento", exact: true }).click();
    await expect(
      page.getByRole("switch", { name: "Cozinha horizontal" }),
    ).not.toBeChecked();
  });
  test(`three customers and a five-line record order fit without scrolling at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await fixedClock(page);
    await page.setViewportSize(viewport);
    const custom = {
      levelId: 12,
      customers: [
        {
          ...plan.customers[0],
          order: [
            "krunch-double",
            "bbq-double",
            "cheddar-double",
            "classic-double",
            "fries-large",
          ].map((recipeId) => ({ recipeId, quantity: 4 })),
        },
        { ...plan.customers[1] },
        { ...plan.customers[1], id: "c3", number: 3, type: "family" },
      ],
    };
    await seedRecord(page, custom);
    await openApp(page, { training: false });
    await startGame(page, {
      button: "Desafiar recorde do nível 12",
      clock: true,
    });
    await page.clock.runFor(8500);
    await expect(page.locator(".customer-card")).toHaveCount(3);
    await expectFits(page);
    await page.getByRole("button", { name: "Produtos seguintes" }).click();
    await expectFits(page);
    await page.locator(".order-line").click();
    await expect(page.locator(".fries-grid")).toBeVisible();
    await expectFits(page);
  });
}

test("reduced motion cannot prepare the same assembly twice", async ({
  page,
}) => {
  await fixedClock(page);
  await seedRecord(page);
  await page.addInitScript(() =>
    localStorage.setItem(
      "montagem-settings",
      JSON.stringify({ animations: false, enabled: false }),
    ),
  );
  await openApp(page, { training: false });
  await startGame(page, {
    button: "Desafiar recorde do nível 12",
    clock: true,
  });
  await assemble(page, ["mini", "tender", "lettuce"]);
  await page.locator('[data-ingredient="mayo"]').evaluate((b) => {
    b.click();
    b.click();
  });
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("montagem-totals")).sandwiches,
    ),
  ).toBe(1);
  await expect(page.getByLabel("Bandeja: 1 de 2 espaços")).toBeVisible();
  await expect(page.locator(".service-package")).toHaveCount(0);
  await expect(page.locator(".ingredient-flight")).toHaveCount(0);
});
