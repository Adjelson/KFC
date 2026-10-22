import { expect } from "@playwright/test";
const names = {
  krunch: "Krunch Clássico",
  bbq: "Krunch BBQ",
  cheddar: "O’Cheddar",
  classic: "Clássica",
};
export async function enterHome(page) {
  const enter = page.getByRole("button", { name: "Entrar na cozinha" }),
    start = page.getByRole("button", { name: "Começar treino" });
  await expect(enter.or(start)).toBeVisible();
  if (await enter.isVisible()) await enter.click();
  await expect(start).toBeVisible();
}
export async function openApp(page) {
  await page.goto("/");
  await enterHome(page);
}
export async function chooseRecipe(page, id) {
  await page
    .getByRole("button", { name: "Escolher receita", exact: true })
    .click();
  await page.getByRole("button", { name: names[id], exact: true }).click();
  await page.getByRole("button", { name: "Fechar", exact: true }).click();
}
export async function chooseTime(page, n) {
  await page.getByRole("button", { name: "Escolher tempo de treino" }).click();
  await page
    .getByRole("button", { name: `${n} segundos`, exact: true })
    .click();
  await page.getByRole("button", { name: "Fechar", exact: true }).click();
}
export async function chooseMode(page) {
  await page.getByRole("button", { name: "Escolher modo de treino" }).click();
  await page.getByRole("button", { name: "Turno · 5 pedidos" }).click();
  await page.getByRole("button", { name: "Fechar", exact: true }).click();
}
export async function startGame(
  page,
  { clock = false, button = "Começar treino" } = {},
) {
  await page.getByRole("button", { name: button, exact: true }).click();
  if (clock) await page.clock.runFor(700);
  await expect(page.getByRole("timer")).toBeVisible();
}
