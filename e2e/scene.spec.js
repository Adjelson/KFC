import { test, expect } from "@playwright/test";
import {
  openApp,
  startGame,
  enterHome,
  expectFits,
  stockKitchen,
} from "./helpers.js";
for (const viewport of [
  { width: 740, height: 360 },
  { width: 1280, height: 720 },
])
  test(`landscape scene uses the full screen and both sides of the counter at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await stockKitchen(page);
    await page.clock.install();
    await openApp(page, { training: false, unlocked: false });
    await page.evaluate(() => (Math.random = () => 0.55));
    await startGame(page, { button: "Jogar nível 1", clock: true });
    await page.clock.runFor(8500);
    await expect(page.locator(".customer-card")).toHaveCount(3);
    await expectFits(page);
    const space = await page.evaluate(() => {
      const rect = (selector) =>
        document.querySelector(selector).getBoundingClientRect();
      const main = rect("main"),
        header = rect(".topbar"),
        assembly = rect(".assembly"),
        left = rect('[data-ingredient="mini"]'),
        right = rect('[data-ingredient="mayo"]');
      return {
        height: main.height,
        width: main.width,
        headerHeight: header.height,
        headerOverlay: getComputedStyle(document.querySelector(".topbar"))
          .position,
        left: left.right < assembly.left,
        right: right.left > assembly.right,
        panLeft: left.width,
        panRight: right.width,
      };
    });
    expect(space.height).toBe(viewport.height);
    expect(space.width).toBe(viewport.width);
    expect(space.headerOverlay).toBe("absolute");
    expect(space.headerHeight).toBeLessThan(45);
    expect(space.left && space.right).toBe(true);
    expect(Math.min(space.panLeft, space.panRight)).toBeGreaterThan(65);
    for (let i = 0; i < 3; i++) {
      await page.locator(".customer-card").nth(i).click();
      await expectFits(page);
      await expect(page.locator(".service-ticket")).toBeVisible();
    }
    await page.getByRole("button", { name: "Abrir ajuda" }).click();
    await expectFits(page);
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Abrir definições" }).click();
    await expectFits(page);
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Abandonar treino" }).click();
    await expect(page.getByRole("navigation")).toBeVisible();
  });
test("the first round waits for local scene artwork before starting its clock", async ({
  page,
}) => {
  let release;
  const gate = new Promise((resolve) => (release = resolve));
  let requested = false;
  await page.route("**/*customer-atlas*.webp", async (route) => {
    requested = true;
    await gate;
    await route.continue();
  });
  await page.clock.install();
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await enterHome(page, { training: false });
  await expect.poll(() => requested).toBe(true);
  await page
    .getByRole("button", { name: "Jogar nível 1", exact: true })
    .click();
  await page.clock.fastForward(20000);
  await expect(page.locator(".loading-screen")).toBeVisible();
  await expect(page.getByRole("timer")).toHaveCount(0);
  const response = page.waitForResponse(
    (response) => response.url().includes("customer-atlas") && response.ok(),
  );
  release();
  await (await response).finished();
  await page.clock.runFor(800);
  await expect(page.getByRole("timer").first()).toBeVisible();
});
