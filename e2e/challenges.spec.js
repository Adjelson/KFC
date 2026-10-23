import { test, expect } from "@playwright/test";
import {
  openApp,
  openTraining,
  enterHome,
  chooseRecipe,
  chooseCombo,
  startGame,
  expectFits,
  serveServiceClient,
} from "./helpers.js";
async function setupTab(page, name) {
  await openTraining(page);
  await page
    .getByRole("button", { name: "Escolher receita", exact: true })
    .click();
  await page.getByRole("tab", { name, exact: true }).click();
}
async function close(page) {
  await page
    .getByRole("button", { name: "Fechar painel", exact: true })
    .click();
}
async function assemble(page, ids) {
  for (const id of ids) await page.locator(`[data-ingredient="${id}"]`).click();
}
async function productRecipe(page) {
  const id = await page.locator(".assembly").getAttribute("data-recipe");
  return page.evaluate(
    async (id) => (await import("/src/game.js")).productById(id),
    id,
  );
}
async function serveClient(page, { clock = false } = {}) {
  if (await page.locator(".service-game").isVisible())
    return serveServiceClient(page, { clock });
  while (
    await page
      .getByRole("button", { name: "Adicionar à bandeja", exact: true })
      .isVisible()
  ) {
    const recipe = await productRecipe(page);
    await assemble(page, recipe.items);
    await page
      .getByRole("button", { name: "Adicionar à bandeja", exact: true })
      .click();
    if (clock) await page.clock.runFor(500);
    await expect(page.locator(".kitchen")).not.toHaveClass(/is-serving/);
  }
  if (!(await page.locator(".prepared-tray").isVisible())) {
    const recipe = await productRecipe(page);
    await assemble(page, recipe.items);
  }
  await page
    .getByRole("button", { name: "Servir pedido", exact: true })
    .click();
  if (clock) await page.clock.runFor(600);
  await expect(
    page.locator(".outcome-screen").or(page.locator(".completion-banner")),
  ).toBeVisible();
}
test("Double enforces quantity, renders both filets and rejects cheese above them", async ({
  page,
}) => {
  await openApp(page);
  await chooseRecipe(page, "cheddar");
  await setupTab(page, "Receita");
  await page.getByRole("button", { name: "Double", exact: true }).click();
  await close(page);
  await chooseCombo(page, 2, false);
  await startGame(page);
  await assemble(page, [
    "brioche",
    "fillet",
    "fillet",
    "cheese",
    "bacon",
    "cheddar",
    "mayo",
  ]);
  await expect(page.locator(".assembly .layer-fillet")).toHaveCount(2);
  await page.getByRole("button", { name: "Adicionar à bandeja" }).click();
  await expect(page.getByRole("alert")).toContainText("queijo entre");
  for (let i = 0; i < 5; i++)
    await page
      .getByRole("button", { name: "Retirar último ingrediente" })
      .click();
  await assemble(page, ["cheese", "fillet", "bacon", "cheddar", "mayo"]);
  await page.getByRole("button", { name: "Adicionar à bandeja" }).click();
  await expect(page.locator(".kitchen")).not.toHaveClass(/is-serving/);
  await expect(page.getByLabel("1 de 2 produtos preparados")).toBeVisible();
  await assemble(page, [
    "brioche",
    "fillet",
    "cheese",
    "bacon",
    "cheddar",
    "mayo",
  ]);
  await page.getByRole("button", { name: "Adicionar à bandeja" }).click();
  await expect(page.getByRole("alert")).toContainText("faltam 1");
  await page.getByRole("button", { name: "Filete", exact: true }).click();
  await page.getByRole("button", { name: "Adicionar à bandeja" }).click();
  await expect(page.locator(".kitchen")).not.toHaveClass(/is-serving/);
  await page.getByRole("button", { name: "Servir pedido" }).click();
  await expect(
    page.getByRole("heading", { name: "Pedido perfeito!" }),
  ).toBeVisible();
});
for (const size of ["small", "medium", "large"])
  test(`fries ${size} work alone and in a menu without counting as sandwiches`, async ({
    page,
  }) => {
    await openApp(page);
    await chooseRecipe(page, "krunch");
    await setupTab(page, "Batatas");
    await page.getByRole("button", { name: /Só batatas/ }).click();
    await page
      .locator(".fries-options button")
      .nth(["small", "medium", "large"].indexOf(size))
      .click();
    await close(page);
    await startGame(page);
    await expect(page.locator(".assembly")).toHaveAttribute(
      "data-recipe",
      `fries-${size}`,
    );
    const wrong = size === "small" ? "large" : "small";
    await assemble(page, [`fries-${wrong}`]);
    await page.getByRole("button", { name: "Servir pedido" }).click();
    await expect(
      page.getByRole("heading", { name: "Vamos aperfeiçoar?" }),
    ).toBeVisible();
    await startGame(page, { button: "Treinar novamente" });
    await serveClient(page);
    expect(
      await page.evaluate(() =>
        JSON.parse(localStorage.getItem("montagem-totals")),
      ),
    ).toEqual({ orders: 1, sandwiches: 0, fries: 1 });
    await page
      .getByRole("button", { name: "Voltar aos níveis", exact: true })
      .click();
    await setupTab(page, "Batatas");
    await page.getByRole("button", { name: /Sandes \+ batatas/ }).click();
    await close(page);
    await startGame(page);
    await serveClient(page);
    expect(
      await page.evaluate(() =>
        JSON.parse(localStorage.getItem("montagem-totals")),
      ),
    ).toEqual({ orders: 2, sandwiches: 1, fries: 2 });
  });
test("new player unlocks training and recipes by completing randomized levels", async ({
  page,
}) => {
  await openApp(page, { unlocked: false, training: false });
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Treino", exact: true })
    .click();
  await expect(
    page.getByText("Conclui o nível 1 para desbloquear.", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Níveis", exact: true })
    .click();
  await page.evaluate(() => (Math.random = () => 0));
  await startGame(page, { button: "Jogar nível 1" });
  await expect(page.locator(".ticket-caption")).toContainText("1/2");
  const first = await page.locator(".assembly").getAttribute("data-recipe");
  await serveClient(page);
  await page.evaluate(() => (Math.random = () => 0.999));
  await expect(page.locator(".ticket-caption")).toContainText("2/2");
  expect(await page.locator(".assembly").getAttribute("data-recipe")).toBe(
    first,
  );
  await serveClient(page);
  await expect(
    page.getByRole("heading", { name: "Nível 1 concluído!", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Treino", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Começar treino", exact: true }),
  ).toBeVisible();
  await setupTab(page, "Receita");
  await expect(
    page.getByRole("button", { name: "Pão simples", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Receitas anteriores" }).click();
  await expect(
    page.getByRole("button", { name: "Krunch Clássico", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Krunch BBQ", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Double", exact: true }),
  ).toBeDisabled();
  await close(page);
  await page.reload();
  await enterHome(page, { training: false });
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Níveis", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Jogar nível 2" }),
  ).toBeEnabled();
  await page.evaluate(() => (Math.random = () => 0.999));
  await startGame(page, { button: "Jogar nível 2" });
  await expect(page.locator(".ticket-caption")).toContainText("1/4");
});
test("failed customer does not unlock training or the next level", async ({
  page,
}) => {
  await page.clock.install();
  await openApp(page, { unlocked: false, training: false });
  await page.evaluate(() => (Math.random = () => 0));
  await startGame(page, { button: "Jogar nível 1" });
  await serveClient(page);
  await page.clock.fastForward(300000);
  await expect(
    page.getByRole("heading", { name: "Nível 1 por concluir" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("montagem-levels") || "{}")["1"] || 0,
    ),
  ).toBe(0);
});
for (const viewport of [
  { width: 320, height: 568 },
  { width: 740, height: 360 },
])
  test(`all chapters and a maximal menu fit at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.setViewportSize(viewport);
    await page.addInitScript(() =>
      localStorage.setItem(
        "montagem-levels",
        JSON.stringify(
          Object.fromEntries(Array.from({ length: 11 }, (_, i) => [i + 1, 3])),
        ),
      ),
    );
    await openApp(page);
    await page
      .getByRole("navigation")
      .getByRole("button", { name: "Níveis", exact: true })
      .click();
    await expectFits(page);
    for (const id of [1, 5, 9, 12]) {
      const node = page.getByRole("button", {
        name: new RegExp(`^Nível ${id}:`),
      });
      await node.scrollIntoViewIfNeeded();
      await node.click();
      await expect(node).toBeInViewport();
      await expectFits(page);
    }
    expect(
      await page
        .locator(".stage-scroll")
        .evaluate((e) => e.scrollHeight > e.clientHeight),
    ).toBe(true);
    await startGame(page, { button: "Jogar nível 12" });
    await expectFits(page);
    await page.getByRole("button", { name: "Abandonar treino" }).click();
    await chooseRecipe(page, "krunch");
    await chooseCombo(page, 4, true);
    await setupTab(page, "Batatas");
    await page.getByRole("button", { name: /Sandes \+ batatas/ }).click();
    await close(page);
    await page.evaluate(() => {
      const samples = [0, 0.6, 0.99];
      let i = 0;
      Math.random = () => samples[i++ % samples.length];
    });
    await startGame(page);
    await expect(page.locator(".order-line")).toHaveCount(4);
    await expectFits(page);
    await page.getByRole("button", { name: "Produtos seguintes" }).click();
    await expectFits(page);
    await serveClient(page);
    await expectFits(page);
    await page.getByRole("tab", { name: "Revisão", exact: true }).click();
    await expectFits(page);
    await page.getByRole("button", { name: "Revisão seguinte" }).click();
    await expectFits(page);
    await page
      .getByRole("button", { name: "Voltar aos níveis", exact: true })
      .click();
    await page.getByRole("button", { name: "Abrir ajuda" }).click();
    await page.getByRole("tab", { name: "Receitas", exact: true }).click();
    await expect(page.locator("select")).toHaveCount(0);
    for (let i = 0; i < 11; i++) {
      await expectFits(page);
      await page.getByRole("button", { name: "Receita seguinte" }).click();
    }
  });

test("recipe book stays locked outside a phase and helps with the current random order", async ({
  page,
}) => {
  await openApp(page, { unlocked: false, training: false });
  await page.getByRole("button", { name: "Abrir ajuda" }).click();
  await page.getByRole("tab", { name: "Receitas", exact: true }).click();
  await expect(page.locator(".locked-recipe")).toBeVisible();
  await expect(page.locator(".reference-ingredients")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Fechar painel", exact: true }),
  ).toHaveText("×");
  await expect(page.locator(".support-footer")).toHaveCount(0);
  await close(page);
  await startGame(page, { button: "Jogar nível 1" });
  const recipe = await productRecipe(page);
  await page.getByRole("button", { name: "Abrir ajuda" }).click();
  await page.getByRole("tab", { name: "Receitas", exact: true }).click();
  await expect(page.locator(".reference-selector strong")).toHaveText(
    recipe.name,
  );
  await expect(page.locator(".reference-ingredients li")).toHaveCount(
    recipe.items.length,
  );
  await page.getByRole("button", { name: "Receita seguinte" }).click();
  await expect(page.locator(".locked-recipe")).toBeVisible();
  await close(page);
  await expect(page.getByRole("timer").first()).toBeVisible();
});

test("only levels and training remain; completing a phase reveals the next one without starting it", async ({
  page,
}) => {
  const epoch = new Date("2026-01-01T12:00:00Z");
  await page.clock.install({ time: epoch });
  await page.clock.pauseAt(new Date(epoch.getTime() + 1000));
  await openApp(page, { unlocked: false, training: false });
  await expect(page.getByRole("navigation").getByRole("button")).toHaveCount(2);
  await expect(
    page
      .getByRole("navigation")
      .getByRole("button", { name: "Início", exact: true }),
  ).toHaveCount(0);
  await page.evaluate(() => (Math.random = () => 0));
  await startGame(page, { button: "Jogar nível 1", clock: true });
  await serveClient(page, { clock: true });
  await serveClient(page, { clock: true });
  await expect(page.locator(".completion-banner")).toContainText(
    "Nível 1 concluído!",
  );
  await expect(page.locator(".completion-rewards")).toContainText(
    "Treino livre",
  );
  await expect(
    page.getByRole("button", { name: "Nível bloqueado", exact: true }),
  ).toBeDisabled();
  await expect(page.locator(".map-node.unlocking")).toHaveCount(1);
  await page.clock.runFor(900);
  const next = page.getByRole("button", { name: /^Nível 2:/ });
  await expect(next).toHaveClass(/newly-unlocked/);
  await expect(next).toBeInViewport();
  await expect(page.locator(".completion-banner")).toContainText(
    "Nível 2 desbloqueado",
  );
  await expect(
    page.getByRole("button", { name: "Jogar nível 2", exact: true }),
  ).toBeEnabled();
  await page.clock.fastForward(5000);
  await expect(page.getByRole("timer")).toHaveCount(0);
  await expect(page.locator(".loading-screen")).toHaveCount(0);
  await page.getByRole("button", { name: "Fechar celebração" }).click();
  await expect(page.locator(".completion-banner")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Jogar nível 2", exact: true }),
  ).toBeEnabled();
  await startGame(page, { button: "Jogar nível 2", clock: true });
  await expect(page.locator(".ticket-caption")).toContainText("NÍVEL 2");
});
test("the last phase returns to the completed map with reduced motion and no phantom level", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "montagem-levels",
      JSON.stringify(
        Object.fromEntries(Array.from({ length: 11 }, (_, i) => [i + 1, 3])),
      ),
    );
    localStorage.setItem(
      "montagem-settings",
      JSON.stringify({ animations: false, enabled: false }),
    );
  });
  await openApp(page, { training: false });
  await page.evaluate(() => (Math.random = () => 0));
  await startGame(page, { button: "Jogar nível 12" });
  for (let i = 1; i <= 4; i++) {
    await serveClient(page);
  }
  await expect(page.locator(".completion-banner")).toContainText(
    "Percurso completo!",
  );
  await expect(page.locator(".new-level-badge")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Jogar nível 12", exact: true }),
  ).toBeEnabled();
  await expect(page.locator(".map-node")).toHaveCount(12);
  await expect(page.getByRole("timer")).toHaveCount(0);
});

for (const viewport of [
  { width: 320, height: 568 },
  { width: 740, height: 360 },
])
  test(`completion and the new world stay usable at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.addInitScript(() => {
      localStorage.setItem(
        "montagem-levels",
        JSON.stringify({ 1: 3, 2: 3, 3: 3 }),
      );
      localStorage.setItem(
        "montagem-settings",
        JSON.stringify({ animations: false, enabled: false }),
      );
    });
    await openApp(page, { training: false });
    await page.evaluate(() => (Math.random = () => 0));
    await startGame(page, { button: "Jogar nível 4" });
    await serveClient(page);
    await serveClient(page);
    await expectFits(page);
    await expect(page.locator(".completion-banner")).toContainText(
      "Nível 5 desbloqueado",
    );
    await expect(
      page.getByRole("button", { name: "Jogar nível 5", exact: true }),
    ).toBeEnabled();
    const fits = await page
      .locator(".map-node.newly-unlocked")
      .evaluate((node) => {
        const r = node.getBoundingClientRect(),
          v = node.closest(".stage-scroll").getBoundingClientRect();
        return r.top >= v.top && r.bottom <= v.bottom;
      });
    expect(fits).toBe(true);
    await page.getByRole("button", { name: "Fechar celebração" }).click();
    await expectFits(page);
    await expect(
      page.getByRole("button", { name: "Jogar nível 5", exact: true }),
    ).toBeEnabled();
  });
test("replaying a completed phase keeps the chosen next level when the celebration is closed", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "montagem-settings",
      JSON.stringify({ animations: false, enabled: false }),
    ),
  );
  await openApp(page, { training: false });
  const node = page.getByRole("button", { name: /^Nível 1:/ });
  await node.scrollIntoViewIfNeeded();
  await node.click();
  await page.evaluate(() => (Math.random = () => 0));
  await startGame(page, { button: "Jogar nível 1" });
  await serveClient(page);
  await serveClient(page);
  await expect(page.locator(".new-level-badge")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Jogar nível 2", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Fechar celebração" }).click();
  await expect(
    page.getByRole("button", { name: "Jogar nível 2", exact: true }),
  ).toBeEnabled();
});
