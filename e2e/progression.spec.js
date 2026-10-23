import { test, expect } from "@playwright/test";
import {
  openApp,
  enterHome,
  startGame,
  serveServiceClient,
  expectFits,
} from "./helpers.js";
import { PANTRY_ITEMS } from "../src/pantry.js";
const stock = ["mini", ...PANTRY_ITEMS.map((i) => i.id)];
const plan = {
  levelId: 12,
  customers: [
    {
      id: "c1",
      number: 1,
      type: "regular",
      duration: 30,
      order: [{ recipeId: "bread", quantity: 3 }],
    },
    {
      id: "c2",
      number: 2,
      type: "foodie",
      duration: 45,
      order: [{ recipeId: "drink-pepsi", quantity: 1 }],
    },
    {
      id: "c3",
      number: 3,
      type: "family",
      duration: 60,
      order: [{ recipeId: "mini-bun", quantity: 2 }],
    },
  ],
};
async function fixed(page) {
  const time = new Date("2026-01-01T12:00:00Z");
  await page.clock.install({ time });
  await page.clock.pauseAt(new Date(time.getTime() + 1000));
}
async function seed(page, orders = plan) {
  await page.addInitScript(
    ({ stock, plan }) => {
      localStorage.setItem(
        "montagem-career",
        JSON.stringify({
          pantryVersion: 1,
          ingredients: stock,
          coins: 100,
          records: {
            12: {
              plan,
              duration: 60,
              milestones: plan.customers.map((_, i) => 20 + i * 10),
            },
          },
        }),
      );
    },
    { stock, plan: orders },
  );
}
const seconds = async (p, n) =>
  Number(
    (
      await p
        .getByRole("timer", { name: new RegExp(`^Tempo do cliente ${n}:`) })
        .getAttribute("aria-label")
    ).match(/: (\d+)/)[1],
  );
async function prepare(page, items) {
  for (const id of items)
    await page.locator(`[data-ingredient="${id}"]`).click();
  await page.clock.runFor(400);
}

test("new player earns coins with bread, buys ingredients and receives recipes using those purchases", async ({
  page,
}) => {
  await fixed(page);
  await openApp(page, { unlocked: false, training: false });
  await page.evaluate(() => (Math.random = () => 0));
  await startGame(page, { button: "Jogar nível 1", clock: true });
  await expect(page.locator(".assembly")).toHaveAttribute(
    "data-recipe",
    "bread",
  );
  await expect(page.locator(".ingredient")).toHaveCount(1);
  await expect(page.getByRole("timer")).toHaveCount(2);
  await serveServiceClient(page, { clock: true });
  await serveServiceClient(page, { clock: true });
  await expect(page.locator(".completion-banner")).toContainText("concluído");
  const earned = await page.evaluate(
    () => JSON.parse(localStorage.getItem("montagem-career")).coins,
  );
  expect(earned).toBeGreaterThanOrEqual(25);
  await page.getByRole("button", { name: "Abrir restaurante" }).click();
  await expect(
    page.getByRole("tab", { name: "Ingredientes", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await page
    .getByRole("button", { name: "Comprar Mini Filete por 15 moedas" })
    .click();
  await expect(
    page.getByRole("button", { name: "Mini Filete comprado" }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Comprar Maionese por 10 moedas" })
    .click();
  await page.keyboard.press("Escape");
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("montagem-career")),
  );
  expect(saved.coins).toBe(earned - 25);
  expect(saved.ingredients).toEqual(["mini", "tender", "mayo"]);
  await page.clock.runFor(900);
  await page.evaluate(() => (Math.random = () => 0.999));
  await startGame(page, { button: "Jogar nível 2", clock: true });
  await expect(page.locator(".assembly")).toHaveAttribute(
    "data-recipe",
    "mayo-bun",
  );
  await expect(page.locator(".ingredient")).toHaveCount(3);
  await page.getByRole("button", { name: "Abandonar treino" }).click();
  await page.reload();
  await enterHome(page, { training: false });
  expect(
    (
      await page.evaluate(() =>
        JSON.parse(localStorage.getItem("montagem-career")),
      )
    ).ingredients,
  ).toEqual(saved.ingredients);
});

test("every customer has a ticking clock and an expression, with capped relief after a partial delivery", async ({
  page,
}) => {
  await fixed(page);
  await seed(page);
  await openApp(page, { training: false });
  await startGame(page, {
    button: "Desafiar recorde do nível 12",
    clock: true,
  });
  await page.clock.runFor(24000);
  await expect(page.getByRole("timer")).toHaveCount(3);
  await expect(page.locator(".customer-card").nth(0)).toHaveAttribute(
    "data-mood",
    "angry",
  );
  await expect(page.locator(".customer-card").nth(1)).toHaveAttribute(
    "data-mood",
    "waiting",
  );
  await expect(page.locator(".customer-card").nth(2)).toHaveAttribute(
    "data-mood",
    "happy",
  );
  await expect(
    page.locator(".customer-card").nth(0).locator(".customer-render"),
  ).toHaveAttribute("href", /customer-emotions/);
  await prepare(page, ["mini"]);
  const before = await seconds(page, 1),
    other = await seconds(page, 2);
  await page.locator(".delivery-surface").press("Enter");
  await expect.poll(() => seconds(page, 1)).toBe(before + 3);
  expect(await seconds(page, 2)).toBe(other);
  await expect(page.locator(".patience-gain")).toHaveText("＋3s");
  await expect(page.locator(".customer-card").nth(0)).toHaveAttribute(
    "data-mood",
    "happy",
  );
  await page.clock.runFor(600);
  await page.getByRole("button", { name: "Melhorar restaurante" }).click();
  const clocks = await page.getByRole("timer").allTextContents();
  await page.clock.fastForward(60000);
  expect(await page.getByRole("timer").allTextContents()).toEqual(clocks);
  await page.keyboard.press("Escape");
  await page.clock.runFor(500);
  await expect(page.locator(".customer-card").nth(0)).toHaveAttribute(
    "data-mood",
    "happy",
  );
});

test("beverage brands are distinct and a wrong drink cannot fill the order or add sandwich totals", async ({
  page,
}) => {
  await fixed(page);
  await seed(page);
  await openApp(page, { training: false });
  await startGame(page, {
    button: "Desafiar recorde do nível 12",
    clock: true,
  });
  await page.locator(".customer-card").nth(1).click();
  await expect(page.locator(".drinks-grid")).toBeVisible();
  for (const id of ["drink-coke", "drink-pepsi", "drink-sumol"])
    await expect(page.locator(`[data-ingredient="${id}"]`)).toBeVisible();
  await prepare(page, ["drink-coke"]);
  await expect(page.getByRole("alert")).toContainText("Revê");
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("montagem-career")).mastery?.[
          "drink-coke"
        ] || 0,
    ),
  ).toBe(0);
  await prepare(page, ["drink-pepsi"]);
  await page.locator(".delivery-surface").press("Enter");
  await page.clock.runFor(600);
  const saved = await page.evaluate(() => ({
    career: JSON.parse(localStorage.getItem("montagem-career")),
    totals: JSON.parse(
      localStorage.getItem("montagem-totals") ||
        '{"orders":0,"sandwiches":0,"fries":0}',
    ),
  }));
  expect(saved.career.mastery["drink-pepsi"]).toBe(1);
  expect(saved.totals).toMatchObject({ orders: 1, sandwiches: 0, fries: 0 });
  await page.getByRole("button", { name: "Abrir ajuda" }).click();
  await page.getByRole("tab", { name: "Contadores", exact: true }).click();
  await expect(
    page.locator(".counter-card").filter({ hasText: "Bebidas preparadas" }),
  ).toContainText("1");
  await expectFits(page);
});

for (const viewport of [
  { width: 320, height: 568 },
  { width: 740, height: 360 },
])
  test(`ingredient shop and six-product menus fit without scrolling at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await fixed(page);
    await page.setViewportSize(viewport);
    const custom = {
      levelId: 12,
      customers: [
        {
          ...plan.customers[0],
          duration: 200,
          order: [
            "krunch-double",
            "bbq-double",
            "cheddar-double",
            "classic-double",
            "fries-large",
            "drink-sumol",
          ].map((recipeId) => ({ recipeId, quantity: 1 })),
        },
        plan.customers[1],
        plan.customers[2],
      ],
    };
    await seed(page, custom);
    await openApp(page, { training: false });
    await page.getByRole("button", { name: "Abrir restaurante" }).click();
    for (let i = 0; i < 5; i++) {
      await expectFits(page);
      if (i < 4)
        await page.getByRole("button", { name: "Página seguinte" }).click();
    }
    await page.keyboard.press("Escape");
    await startGame(page, {
      button: "Desafiar recorde do nível 12",
      clock: true,
    });
    await page.clock.runFor(8500);
    await expectFits(page);
    await page.getByRole("button", { name: "Produtos seguintes" }).click();
    await expectFits(page);
    await page
      .getByRole("button", { name: "Sumol: 0 de 1 preparados", exact: true })
      .click();
    await expect(page.locator(".drinks-grid")).toBeVisible();
    await expectFits(page);
    await page.getByRole("button", { name: "Melhorar restaurante" }).click();
    await expectFits(page);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("timer")).toHaveCount(3);
  });

test("buying the three beverages spends real coins and adds drink requests to later phases", async ({
  page,
}) => {
  await fixed(page);
  await page.addInitScript(() =>
    localStorage.setItem("montagem-career", JSON.stringify({ coins: 100 })),
  );
  await openApp(page, { training: false });
  await page.getByRole("button", { name: "Abrir restaurante" }).click();
  for (let i = 0; i < 4; i++)
    await page.getByRole("button", { name: "Página seguinte" }).click();
  for (const brand of ["Coca-Cola", "Pepsi", "Sumol"])
    await page
      .getByRole("button", { name: `Comprar ${brand} por 20 moedas` })
      .click();
  await expect(
    page.getByRole("button", { name: "Coca-Cola comprado" }),
  ).toBeDisabled();
  await page.keyboard.press("Escape");
  const career = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("montagem-career")),
  );
  expect(career.coins).toBe(40);
  expect(career.ingredients).toEqual(
    expect.arrayContaining(["drink-coke", "drink-pepsi", "drink-sumol"]),
  );
  const node = page.getByRole("button", { name: /^Nível 3:/ });
  await node.scrollIntoViewIfNeeded();
  await node.click();
  await page.evaluate(() => (Math.random = () => 0));
  await startGame(page, { button: "Jogar nível 3", clock: true });
  await page
    .getByRole("button", { name: "Coca-Cola: 0 de 1 preparados", exact: true })
    .click();
  await expect(page.locator(".drinks-grid .ingredient")).toHaveCount(3);
  await prepare(page, ["drink-coke"]);
  await page.locator(".delivery-surface").press("Enter");
  await page.clock.runFor(600);
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("montagem-career")).mastery[
          "drink-coke"
        ],
    ),
  ).toBe(1);
  expect(
    await page.evaluate(() =>
      JSON.parse(
        localStorage.getItem("montagem-totals") ||
          '{"orders":0,"sandwiches":0,"fries":0}',
      ),
    ),
  ).toEqual({ orders: 0, sandwiches: 0, fries: 0 });
});
