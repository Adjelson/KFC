import { test, expect } from "@playwright/test";
import {
  openApp,
  enterHome,
  chooseRecipe,
  chooseCombo,
  chooseTime,
  chooseMode,
  startGame,
  expectFits,
} from "./helpers.js";
const items = {
  krunch: ["Pão com sementes", "Filete de frango", "Alface", "Maionese"],
  bbq: ["Pão mini de sésamo", "Tender de frango", "Queijo", "Molho BBQ"],
  cheddar: [
    "Pão brioche",
    "Filete de frango",
    "Queijo",
    "Bacon",
    "Molho cheddar",
    "Maionese",
  ],
  classic: [
    "Pão com sementes",
    "Filete de frango",
    "Tomate",
    "Alface",
    "Maionese",
  ],
};
async function assemble(page, id) {
  for (const name of items[id])
    await page.getByRole("button", { name, exact: true }).click();
}
async function addToTray(page, clock = false) {
  await page.getByRole("button", { name: "Adicionar à bandeja" }).click();
  if (clock) await page.clock.runFor(500);
  await expect(page.locator(".ingredient[aria-pressed=true]")).toHaveCount(0);
}

test("duplicate sandwiches are counted once per valid assembly and persist after serving", async ({
  page,
}) => {
  await openApp(page);
  await chooseRecipe(page, "krunch");
  await chooseCombo(page, 2, false);
  await startGame(page);
  await page.getByRole("button", { name: "Adicionar à bandeja" }).click();
  await expect(page.getByRole("alert")).toContainText("faltam 4");
  await expect(page.getByLabel("0 de 2 sanduíches preparados")).toBeVisible();
  await assemble(page, "krunch");
  await page.getByRole("button", { name: "Adicionar à bandeja" }).dblclick();
  await expect(page.locator(".ingredient[aria-pressed=true]")).toHaveCount(0);
  await expect(page.getByLabel("1 de 2 sanduíches preparados")).toBeVisible();
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("montagem-totals")),
    ),
  ).toEqual({ orders: 0, sandwiches: 1 });
  await assemble(page, "krunch");
  await addToTray(page);
  await expect(
    page.getByRole("button", {
      name: "Krunch Clássico: 2 de 2 preparados",
      exact: true,
    }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Servir pedido" }).click();
  await expect(
    page.getByRole("heading", { name: "Pedido perfeito!" }),
  ).toBeVisible();
  await expect(page.getByText("2/2", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Voltar ao início" }).click();
  await page.reload();
  await enterHome(page);
  await page.getByRole("button", { name: "Ver contadores" }).click();
  await expect(
    page
      .locator(".counter-card")
      .filter({ hasText: "Pedidos concluídos" })
      .locator("strong"),
  ).toHaveText("1");
  await expect(
    page
      .locator(".counter-card")
      .filter({ hasText: "Sanduíches preparados" })
      .locator("strong"),
  ).toHaveText("2");
});

test("a mixed order supports choosing a product and advances to the remaining duplicate portions", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Math.random = () => 0.01;
  });
  await openApp(page);
  await chooseRecipe(page, "krunch");
  await chooseCombo(page, 3, true);
  await chooseMode(page);
  await startGame(page);
  await page
    .getByRole("button", { name: "Krunch BBQ: 0 de 1 preparados", exact: true })
    .click();
  await expect(page.locator(".assembly")).toHaveAttribute("data-recipe", "bbq");
  await assemble(page, "bbq");
  await addToTray(page);
  await expect(
    page.getByRole("button", {
      name: "Krunch BBQ: 1 de 1 preparados",
      exact: true,
    }),
  ).toBeDisabled();
  await expect(page.locator(".assembly")).toHaveAttribute(
    "data-recipe",
    "krunch",
  );
  for (let i = 0; i < 2; i++) {
    await assemble(page, "krunch");
    await addToTray(page);
  }
  await expect(page.getByLabel("3 de 3 sanduíches preparados")).toBeVisible();
  await page.getByRole("button", { name: "Servir pedido" }).click();
  await expect(
    page.getByRole("heading", { name: "Pedido perfeito!" }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Revisão", exact: true }).click();
  await expect(
    page.locator(".order-review-line").filter({ hasText: "Krunch Clássico" }),
  ).toContainText("2/2");
  await expect(
    page.locator(".order-review-line").filter({ hasText: "Krunch BBQ" }),
  ).toContainText("1/1");
  await startGame(page, { button: "Próximo cliente" });
  await expect(page.getByLabel("0 de 3 sanduíches preparados")).toBeVisible();
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("montagem-totals")),
    ),
  ).toEqual({ orders: 1, sandwiches: 3 });
});

test("wrong ingredients never fill the order and correcting them allows preparation", async ({
  page,
}) => {
  await openApp(page);
  await chooseRecipe(page, "krunch");
  await chooseCombo(page, 2, false);
  await startGame(page);
  await assemble(page, "krunch");
  await page.getByRole("button", { name: "Bacon", exact: true }).click();
  await page.getByRole("button", { name: "Adicionar à bandeja" }).click();
  await expect(page.getByRole("alert")).toContainText("a mais 1");
  await expect(page.getByLabel("0 de 2 sanduíches preparados")).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem("montagem-totals")),
  ).toBeNull();
  await page.getByRole("button", { name: "Bacon", exact: true }).click();
  await addToTray(page);
  await expect(page.getByLabel("1 de 2 sanduíches preparados")).toBeVisible();
});

test("a timed-out partial order preserves the prepared count without counting a completed customer", async ({
  page,
}) => {
  await page.clock.install();
  await openApp(page);
  await chooseRecipe(page, "krunch");
  await chooseCombo(page, 3, false);
  await chooseTime(page, 30);
  await startGame(page, { clock: true });
  await expect(page.getByRole("timer")).toHaveText("90seg");
  await assemble(page, "krunch");
  await addToTray(page, true);
  await page.clock.fastForward(91000);
  await expect(
    page.getByRole("heading", { name: "O tempo acabou!" }),
  ).toBeVisible();
  await expect(page.getByText("1/3", { exact: true })).toBeVisible();
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("montagem-totals")),
    ),
  ).toEqual({ orders: 0, sandwiches: 1 });
  await page.getByRole("tab", { name: "Revisão", exact: true }).click();
  await expect(page.locator(".order-review-line")).toContainText("1/3");
});

for (const viewport of [
  { width: 320, height: 568 },
  { width: 740, height: 360 },
]) {
  test(`four product order and counters fit without scrolling at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await openApp(page);
    await chooseRecipe(page, "krunch");
    await chooseCombo(page, 4, true);
    await page.evaluate(() => {
      const values = [0, 0.6, 0.99];
      Math.random = () => (values.length ? values.shift() : 0.01);
    });
    await startGame(page);
    await expect(page.locator(".order-line")).toHaveCount(4);
    await expectFits(page);
    await page.getByRole("button", { name: "Adicionar à bandeja" }).click();
    await expect(page.getByRole("alert")).toBeVisible();
    await expectFits(page);
    for (let i = 0; i < 4; i++) {
      const id = await page.locator(".assembly").getAttribute("data-recipe");
      await assemble(page, id);
      await addToTray(page);
    }
    await expect(page.getByLabel("4 de 4 sanduíches preparados")).toBeVisible();
    await expectFits(page);
    await page.getByRole("button", { name: "Servir pedido" }).click();
    await expect(
      page.getByRole("heading", { name: "Pedido perfeito!" }),
    ).toBeVisible();
    await expectFits(page);
    await page.getByRole("tab", { name: "Revisão", exact: true }).click();
    await expect(page.locator(".order-review-line")).toHaveCount(4);
    await expectFits(page);
    await page.getByRole("button", { name: "Voltar ao início" }).click();
    await page.getByRole("button", { name: "Ver contadores" }).click();
    await expectFits(page);
  });
}

test("expiration during the last preparation keeps sandwich totals but never invents a delivered order", async ({
  page,
}) => {
  const epoch = new Date("2026-01-01T12:00:00Z");
  await page.clock.install({ time: epoch });
  await page.clock.pauseAt(new Date(epoch.getTime() + 1000));
  await openApp(page);
  await chooseRecipe(page, "krunch");
  await chooseCombo(page, 2, false);
  await chooseTime(page, 30);
  await startGame(page, { clock: true });
  await assemble(page, "krunch");
  await addToTray(page, true);
  await page.clock.fastForward(59000);
  await assemble(page, "krunch");
  await page.getByRole("button", { name: "Adicionar à bandeja" }).click();
  await page.clock.runFor(600);
  await expect(
    page.getByRole("heading", { name: "O tempo acabou!" }),
  ).toBeVisible();
  await expect(page.getByText("2/2", { exact: true })).toBeVisible();
  await page.clock.runFor(1000);
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("montagem-totals")),
    ),
  ).toEqual({ orders: 0, sandwiches: 2 });
});
