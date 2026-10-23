import { test, expect } from "@playwright/test";
import { openApp, startGame, expectFits } from "./helpers.js";

async function fixed(page) {
  const time = new Date("2026-01-01T12:00:00Z");
  await page.clock.install({ time });
  await page.clock.pauseAt(new Date(time.getTime() + 1000));
}
async function swipe(page, target, { cancel = false, touch = false } = {}) {
  const plate = await page.locator(".delivery-surface").boundingBox();
  const to = await target.boundingBox();
  const from = { x: plate.x + plate.width / 2, y: plate.y + plate.height / 2 };
  const end = { x: to.x + to.width / 2, y: to.y + to.height / 2 };
  if (touch) {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [from],
    });
    for (let i = 1; i <= 8; i++)
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [
          {
            x: from.x + ((end.x - from.x) * i) / 8,
            y: from.y + ((end.y - from.y) * i) / 8,
          },
        ],
      });
    await cdp.send("Input.dispatchTouchEvent", {
      type: cancel ? "touchCancel" : "touchEnd",
      touchPoints: [],
    });
    await cdp.detach();
  } else {
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(end.x, end.y, { steps: 10 });
    await expect(page.locator(".delivery-ghost .plate")).toBeVisible();
    expect(
      (await page.locator(".delivery-ghost .plate").boundingBox()).width,
    ).toBeLessThan(170);
    if (cancel)
      await page.locator(".delivery-surface").dispatchEvent("pointercancel");
    await page.mouse.up();
  }
}
async function bread(page) {
  await page.locator('[data-ingredient="mini"]').click();
  await page.clock.runFor(500);
}
async function fresh(page) {
  await fixed(page);
  await openApp(page, { training: false, unlocked: false });
  await page.evaluate(async () => {
    Math.random = () => 0;
    window.gameSounds = [];
    const { sound } = await import("/src/audio.js");
    sound.play = (name) => window.gameSounds.push(name);
    sound.reaction = (mood) => window.gameSounds.push(`reaction:${mood}`);
  });
  await startGame(page, { button: "Jogar nível 1", clock: true });
}

test("automatic preparation and swipe delivery show a paid result before revealing the next level", async ({
  page,
}) => {
  await page.setViewportSize({ width: 740, height: 360 });
  await fresh(page);
  await expect(
    page.getByRole("button", { name: "Adicionar à bandeja" }),
  ).toHaveCount(0);
  await expect(
    page.locator(".prepare-button,.deliver-button,.serve-button"),
  ).toHaveCount(0);
  for (let i = 0; i < 2; i++) {
    await bread(page);
    await expect(page.getByLabel("Bandeja: 1 de 2 espaços")).toBeVisible();
    await swipe(page, page.locator('.customer-card[aria-pressed="true"]'));
    await page.clock.runFor(600);
  }
  const dialog = page.getByRole("dialog", { name: "Parabéns, chef!" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel("3 de 3 estrelas")).toBeVisible();
  await expect(dialog).toContainText("2/2");
  await expectFits(page);
  const coins = await page.evaluate(
    () => JSON.parse(localStorage.getItem("montagem-career")).coins,
  );
  await expect(dialog).toContainText(`＋${coins}`);
  expect(coins).toBeGreaterThan(0);
  await page.clock.runFor(5000);
  await expect(dialog).toBeVisible();
  await page.getByRole("button", { name: "Ver níveis", exact: true }).click();
  await page.clock.runFor(900);
  await expect(page.locator(".newly-unlocked")).toContainText("2");
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("montagem-career")).coins,
    ),
  ).toBe(coins);
  expect(await page.evaluate(() => window.gameSounds)).toEqual(
    expect.arrayContaining(["start", "ready", "orderComplete", "levelWin"]),
  );
});

test("a failed level shows zero stars and keeps the coins already earned", async ({
  page,
}) => {
  await fresh(page);
  await bread(page);
  await swipe(page, page.locator('.customer-card[aria-pressed="true"]'));
  await page.clock.runFor(600);
  const earned = await page.evaluate(
    () => JSON.parse(localStorage.getItem("montagem-career")).coins,
  );
  await page.clock.fastForward(300000);
  const result = page.locator(".level-result");
  await expect(result).toContainText("Vamos tentar outra vez?");
  await expect(result.getByLabel("0 de 3 estrelas")).toBeVisible();
  await expect(result).toContainText(`＋${earned}`);
  await expectFits(page);
  expect(await page.evaluate(() => window.gameSounds)).toContain("levelLose");
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Jogar nível 1", exact: true }),
  ).toBeEnabled();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("montagem-career")).coins,
    ),
  ).toBe(earned);
});

for (const viewport of [
  { width: 320, height: 568 },
  { width: 740, height: 360 },
]) {
  test(`touch delivery rejects the wrong client and cancelled gestures at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await fixed(page);
    await page.addInitScript(() => {
      localStorage.setItem(
        "montagem-levels",
        JSON.stringify(
          Object.fromEntries(Array.from({ length: 11 }, (_, i) => [i + 1, 3])),
        ),
      );
      const plan = {
        levelId: 12,
        customers: [
          {
            id: "c1",
            number: 1,
            type: "regular",
            duration: 100,
            order: [{ recipeId: "bread", quantity: 2 }],
          },
          {
            id: "c2",
            number: 2,
            type: "foodie",
            duration: 120,
            order: [{ recipeId: "bread", quantity: 1 }],
          },
        ],
      };
      localStorage.setItem(
        "montagem-career",
        JSON.stringify({
          pantryVersion: 1,
          ingredients: ["mini"],
          records: { 12: { plan, duration: 40, milestones: [20, 40] } },
        }),
      );
    });
    await openApp(page, { training: false });
    await startGame(page, {
      button: "Desafiar recorde do nível 12",
      clock: true,
    });
    await bread(page);
    await page.clock.runFor(10000);
    const current = page.locator('.customer-card[data-delivery-customer="c1"]');
    const wrong = page.locator('.customer-card[data-delivery-customer="c2"]');
    await swipe(page, wrong, { touch: true });
    await expect(page.getByRole("alert")).toContainText("cliente 1");
    await expect(page.locator(".order-line")).toContainText("1/2");
    await expect(page.getByLabel("Bandeja: 1 de 2 espaços")).toBeVisible();
    await swipe(page, current, { touch: true, cancel: true });
    await expect(page.locator(".delivery-ghost,[data-drop-state]")).toHaveCount(
      0,
    );
    await expect(page.getByLabel("Bandeja: 1 de 2 espaços")).toBeVisible();
    await swipe(page, current, { touch: true });
    await page.clock.runFor(600);
    await expect(page.getByLabel("Bandeja: 0 de 2 espaços")).toBeVisible();
    await expect(page.locator(".patience-gain")).toHaveText("＋3s");
    await bread(page);
    await swipe(page, current, { touch: true });
    await page.clock.runFor(600);
    await expect(page.locator(".customer-goodbye svg")).toHaveCount(0);
    await expect(
      page.locator('.customer-card[data-delivery-customer="c1"]'),
    ).toHaveCount(0);
    expect(
      await page.evaluate(() =>
        JSON.parse(localStorage.getItem("montagem-totals")),
      ),
    ).toEqual({ orders: 1, sandwiches: 2, fries: 0 });
    await expectFits(page);
  });
}

test("customer expression sounds occur on state changes and every portrait has a unique crop", async ({
  page,
}) => {
  await page.setViewportSize({ width: 740, height: 360 });
  await fresh(page);
  await page.clock.runFor(55000);
  const portraits = page.locator(".queue-avatar .customer-render");
  const crops = await portraits.evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute("clip-path")),
  );
  expect(new Set(crops).size).toBe(crops.length);
  expect(
    crops.every(
      (crop) => crop?.startsWith("url(#") && crop.endsWith("-portrait)"),
    ),
  ).toBe(true);
  const before = await page.evaluate(() =>
    window.gameSounds.filter((event) => event.startsWith("reaction:")),
  );
  expect(before).toContain("reaction:waiting");
  expect(before).toContain("reaction:angry");
  await page.clock.runFor(1000);
  expect(
    await page.evaluate(() =>
      window.gameSounds.filter((event) => event.startsWith("reaction:")),
    ),
  ).toEqual(before);
  await expect(page.locator(".ingredient-stock.stock-basket")).toHaveCount(1);
});
