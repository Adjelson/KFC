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
export async function chooseCombo(page, n = 3, mixed = true) {
  await page
    .getByRole("button", { name: "Escolher tamanho do pedido" })
    .click();
  await page
    .getByRole("button", {
      name: `${n} ${n === 1 ? "sanduíche" : "sanduíches"}`,
      exact: true,
    })
    .click();
  if (n > 1)
    await page
      .getByRole("button", { name: mixed ? "Variados" : "Iguais", exact: true })
      .click();
  await page.getByRole("button", { name: "Fechar", exact: true }).click();
}

export async function expectFits(page) {
  const overflow = await page.evaluate(() =>
    [
      ...document.querySelectorAll(
        "main,.challenge-screen,.level-detail,.side-picker,.reference-selector,.prepared-tray,.home-screen,.support-content,.guide-page,.audio-settings,.recipe-picker,.recipe-options,.time-picker,.mode-picker,.outcome-body,.workstation,.order-settings,.quantity-options,.assortment-options,.counter-page,.order-lines,.order-review",
      ),
    ]
      .filter((e) => e.getClientRects().length)
      .filter(
        (e) =>
          e.scrollHeight > e.clientHeight + 2 ||
          e.scrollWidth > e.clientWidth + 2,
      )
      .map((e) => ({
        name: e.className || e.tagName,
        height: e.clientHeight,
        content: e.scrollHeight,
        width: e.clientWidth,
        contentWidth: e.scrollWidth,
      })),
  );
  expect(overflow).toEqual([]);
  const dialog = page.getByRole("dialog"),
    scope = (await dialog.isVisible()) ? dialog : page.locator(".app");
  const clipped = await scope
    .locator("button,input,select")
    .evaluateAll((elements) =>
      elements
        .filter((e) => e.getClientRects().length)
        .filter((e) => {
          const r = e.getBoundingClientRect(),
            hit = document.elementFromPoint(
              r.x + r.width / 2,
              r.y + r.height / 2,
            );
          return (
            r.x < -0.5 ||
            r.y < -0.5 ||
            r.right > innerWidth + 0.5 ||
            r.bottom > innerHeight + 0.5 ||
            !hit ||
            !e.contains(hit)
          );
        })
        .map((e) => e.getAttribute("aria-label") || e.textContent.trim()),
    );
  expect(clipped).toEqual([]);
}
