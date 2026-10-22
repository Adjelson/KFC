import { test, expect } from "@playwright/test";
import { openApp, chooseRecipe, startGame, expectFits } from "./helpers.js";

for (const viewport of [
  { width: 390, height: 844 },
  { width: 320, height: 568 },
  { width: 740, height: 360 },
  { width: 1024, height: 768 },
]) {
  test(`every page fits without clipping important controls at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await openApp(page);
    await expectFits(page);
    await page
      .getByRole("button", { name: "Escolher receita", exact: true })
      .click();
    await expectFits(page);
    for (const name of ["Modo", "Pedido", "Batatas", "Tempo"]) {
      await page.getByRole("tab", { name, exact: true }).click();
      await expectFits(page);
    }
    await page.getByRole("button", { name: "Fechar", exact: true }).click();
    await page
      .getByRole("button", { name: "Abrir ajuda", exact: true })
      .click();
    await expectFits(page);
    for (let i = 0; i < 3; i++) {
      await page.getByRole("button", { name: "Passo seguinte" }).click();
      await expectFits(page);
    }
    await page.getByRole("tab", { name: "Receitas", exact: true }).click();
    for (let i = 0; i < 6; i++)
      await page
        .getByRole("button", { name: "Receita seguinte", exact: true })
        .click();
    await expectFits(page);
    await page.getByRole("tab", { name: "Contadores", exact: true }).click();
    await expectFits(page);
    await page.getByRole("tab", { name: "Sobre", exact: true }).click();
    await expectFits(page);
    await page.getByRole("button", { name: "Fechar", exact: true }).click();
    await page
      .getByRole("button", { name: "Abrir definições", exact: true })
      .click();
    await expectFits(page);
    await page.getByRole("tab", { name: "Movimento", exact: true }).click();
    await expectFits(page);
    await page.getByRole("button", { name: "Fechar", exact: true }).click();
    await startGame(page);
    await expectFits(page);
    for (const button of await page.locator(".ingredient").all())
      await expect(button).toBeInViewport();
    await page.getByRole("button", { name: "Servir pedido" }).click();
    await expect(page.locator(".outcome-screen")).toBeVisible();
    await expectFits(page);
    await page.getByRole("tab", { name: "Revisão", exact: true }).click();
    await expectFits(page);
  });
}

test("animated opening and loading finish before the round timer starts", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/");
  await expect(
    page.getByRole("region", { name: "Abertura animada" }),
  ).toBeVisible();
  expect(
    await page
      .locator(".intro-screen")
      .evaluate((e) => e.getBoundingClientRect().height),
  ).toBe(844);
  await expect(
    page.getByRole("button", { name: "Entrar na cozinha" }),
  ).toBeInViewport();
  await page.clock.runFor(2100);
  await expect(
    page.getByRole("button", { name: "Começar treino", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Começar treino", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "A preparar o pedido" }),
  ).toBeVisible();
  await expect(page.getByRole("timer")).toHaveCount(0);
  await page.clock.runFor(400);
  await expect(page.getByRole("timer")).toHaveCount(0);
  await page.clock.runFor(300);
  await expect(page.getByRole("timer")).toHaveText("60seg");
  await page.clock.fastForward(2000);
  await expect(page.getByRole("timer")).toHaveText("58seg");
});

test("all extra ingredients remain available through review pages", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await openApp(page);
  await chooseRecipe(page, "krunch");
  await startGame(page);
  for (const button of await page.locator(".ingredient").all())
    await button.click();
  await page.getByRole("button", { name: "Servir pedido" }).click();
  await page.getByRole("tab", { name: "Revisão", exact: true }).click();
  await page.getByRole("button", { name: /A mais/ }).click();
  await expect(page.locator(".visual-ingredient")).toHaveCount(6);
  await expectFits(page);
  const first = await page.locator(".visual-ingredient").allTextContents();
  await page.getByRole("button", { name: "Ingredientes seguintes" }).click();
  await expect(page.locator(".visual-ingredient")).toHaveCount(2);
  await expectFits(page);
  const second = await page.locator(".visual-ingredient").allTextContents();
  expect(new Set([...first, ...second]).size).toBe(8);
  await page.getByRole("button", { name: /Faltaram/ }).click();
  await expect(page.getByText("Nenhum", { exact: true })).toBeVisible();
});
