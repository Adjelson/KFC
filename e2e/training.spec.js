import {
  openApp,
  chooseRecipe,
  chooseTime,
  chooseMode,
  startGame,
} from "./helpers.js";
import { test, expect } from "@playwright/test";
test("complete a correct recipe offline and retain personal best", async ({
  page,
  context,
}) => {
  await openApp(page);
  await chooseRecipe(page, "krunch");
  await context.setOffline(true);
  await startGame(page);
  for (const n of ["Pão H1", "Mini Filete", "Alface", "Maionese"])
    await page.getByRole("button", { name: n, exact: true }).click();
  await page.getByRole("button", { name: "Servir pedido" }).click();
  await expect(
    page.getByRole("heading", { name: "Pedido perfeito!" }),
  ).toBeVisible();
  await expect(page.getByText("4/4", { exact: true })).toBeVisible();
  await expect(page.getByText(/Melhor tempo neste produto/)).toBeVisible();
  expect(
    await page.evaluate(() =>
      Object.keys(JSON.parse(localStorage.getItem("montagem-best"))),
    ),
  ).toContain("krunch:60");
});
test("identify missing and extra ingredients and allow removal", async ({
  page,
}) => {
  await openApp(page);
  await chooseRecipe(page, "bbq");
  await startGame(page);
  await page.getByRole("button", { name: /Tomate/ }).click();
  await page.getByRole("button", { name: "Tomate", exact: true }).click();
  await expect(page.getByRole("img", { name: "Bandeja vazia" })).toBeAttached();
  await page.getByRole("button", { name: /Bacon/ }).click();
  await page.getByRole("button", { name: "Servir pedido" }).click();
  await expect(
    page.getByRole("heading", { name: "Vamos aperfeiçoar?" }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Revisão", exact: true }).click();
  for (const item of ["Pão H1", "Mini Filete", "Queijo", "Molho BBQ"])
    await expect(page.getByLabel("Faltaram", { exact: true })).toContainText(
      item,
    );
  await page.getByRole("button", { name: /A mais/ }).click();
  await expect(page.getByText("Bacon", { exact: true })).toBeVisible();
});
test("timeout closes the round and small screen has no overflow", async ({
  page,
}) => {
  await page.clock.install();
  await openApp(page);
  await chooseTime(page, 30);
  await startGame(page, { clock: true });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "artifacts/treino-telemovel.png",
    fullPage: true,
  });
  await page.clock.fastForward(31000);
  await expect(
    page.getByRole("heading", { name: "O tempo acabou!" }),
  ).toBeVisible();
  await startGame(page, { clock: true, button: "Treinar novamente" });
  await expect(page.getByRole("timer")).toHaveText("30seg");
});

test("sandwich layers respond to ingredients and every recipe can be served", async ({
  page,
}) => {
  const recipes = {
    krunch: ["Pão H1", "Mini Filete", "Alface", "Maionese"],
    bbq: ["Pão H1", "Mini Filete", "Queijo", "Molho BBQ"],
    cheddar: [
      "Pão brioche",
      "Filete",
      "Queijo",
      "Bacon",
      "Molho cheddar",
      "Maionese",
    ],
    classic: ["Pão Core", "Filete", "Tomate", "Alface", "Maionese"],
  };
  await openApp(page);
  for (const [id, items] of Object.entries(recipes)) {
    await chooseRecipe(page, id);
    await startGame(page);
    for (const ingredient of items)
      await page.getByRole("button", { name: ingredient, exact: true }).click();
    await expect(
      page.getByRole("img", {
        name: `Sanduíche com ${items.length} ingredientes`,
      }),
    ).toBeVisible();
    await expect(page.locator(".burger-layer")).toHaveCount(items.length + 1);
    await page.getByRole("button", { name: "Servir pedido" }).click();
    await expect(
      page.getByRole("heading", { name: "Pedido perfeito!" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Voltar aos níveis" }).click();
  }
});

test("five customer shift counts only correct orders and resets the next shift", async ({
  page,
}) => {
  await openApp(page);
  await chooseRecipe(page, "bbq");
  await chooseMode(page);
  await startGame(page);
  for (let round = 1; round <= 5; round++) {
    await expect(
      page.getByText(`PEDIDO #00${round} · ${round}/5`),
    ).toBeVisible();
    if (round !== 3 && round !== 5)
      for (const ingredient of ["Pão H1", "Mini Filete", "Queijo", "Molho BBQ"])
        await page
          .getByRole("button", { name: ingredient, exact: true })
          .click();
    await page.getByRole("button", { name: "Servir pedido" }).click();
    if (round < 5) await startGame(page, { button: "Próximo cliente" });
  }
  await expect(
    page.getByRole("heading", { name: "Turno concluído!" }),
  ).toBeVisible();
  await expect(page.getByRole("status")).toContainText("3 de 5");
  await startGame(page, { button: "Treinar novamente" });
  await expect(page.getByText("PEDIDO #001 · 1/5")).toBeVisible();
  await expect(
    page.getByLabel("0 pedidos perfeitos neste turno"),
  ).toBeVisible();
});

test("kitchen fits a mobile screen with all ingredients and serving action available", async ({
  page,
}) => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 360, height: 740 },
  ]) {
    await page.setViewportSize(viewport);
    await openApp(page);
    await chooseRecipe(page, "cheddar");
    await startGame(page);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollHeight <= innerHeight + 1,
      ),
    ).toBe(true);
    for (const button of await page.locator(".ingredient").all())
      await expect(button).toBeInViewport();
    await expect(
      page.getByRole("button", { name: "Servir pedido" }),
    ).toBeInViewport();
  }
  await page.getByRole("button", { name: "Pão brioche", exact: true }).click();
  await page.getByRole("button", { name: "Filete", exact: true }).click();
  await page.getByRole("button", { name: "Queijo", exact: true }).click();
  await page.screenshot({
    path: "artifacts/cozinha-telemovel.png",
    fullPage: true,
  });
});

test("compact kitchen leaves space for Android system bars", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await openApp(page);
  await startGame(page);
  await page.addStyleTag({
    content: ".screen-game{padding-top:24px;padding-bottom:24px}",
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollHeight <= innerHeight + 1,
    ),
  ).toBe(true);
  await expect(
    page.getByRole("button", { name: "Servir pedido" }),
  ).toBeInViewport();
});
