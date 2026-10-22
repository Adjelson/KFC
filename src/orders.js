import { recipes, pickRecipe } from "./game.js";
export const MAX_ORDER_SIZE = 4;
const TOTALS_KEY = "montagem-totals";
const safeCount = (n) => (Number.isSafeInteger(n) && n >= 0 ? n : 0);

export function makeOrder(
  { choice = "random", quantity = 1, assortment = "same" } = {},
  previous,
  random = Math.random,
) {
  const count = Number.isInteger(quantity)
    ? Math.max(1, Math.min(MAX_ORDER_SIZE, quantity))
    : 1;
  const first =
    recipes.find((r) => r.id === choice) || pickRecipe(previous, random);
  const ids = [first.id];
  for (let i = 1; i < count; i++) {
    const pool = i === 1 ? recipes.filter((r) => r.id !== first.id) : recipes;
    ids.push(
      assortment === "mixed"
        ? pool[Math.floor(random() * pool.length)].id
        : first.id,
    );
  }
  return [...new Set(ids)].map((recipeId) => ({
    recipeId,
    quantity: ids.filter((id) => id === recipeId).length,
  }));
}
export function orderProgress(order, counts = {}) {
  const lines = order.map((line) => ({
    ...line,
    prepared: Math.min(line.quantity, safeCount(counts[line.recipeId])),
  }));
  const total = lines.reduce((n, line) => n + line.quantity, 0),
    made = lines.reduce((n, line) => n + line.prepared, 0);
  return { lines, total, made, complete: total > 0 && total === made };
}
export function creditSandwich(order, counts, recipeId) {
  const line = order.find((line) => line.recipeId === recipeId);
  if (!line || safeCount(counts[recipeId]) >= line.quantity)
    return { counts, added: false };
  return {
    counts: { ...counts, [recipeId]: safeCount(counts[recipeId]) + 1 },
    added: true,
  };
}
export function nextRecipe(order, counts, preferred) {
  const remaining = orderProgress(order, counts).lines.filter(
    (line) => line.prepared < line.quantity,
  );
  const line =
    remaining.find((line) => line.recipeId === preferred) || remaining[0];
  return line ? recipes.find((r) => r.id === line.recipeId) : null;
}
export function orderBestKey(order, secondsPerSandwich) {
  if (order.length === 1 && order[0].quantity === 1)
    return `${order[0].recipeId}:${secondsPerSandwich}`;
  const signature = order
    .map((line) => `${line.recipeId}x${line.quantity}`)
    .sort()
    .join("+");
  return `combo:${signature}:${secondsPerSandwich}`;
}
export function loadTotals(storage) {
  try {
    const saved = JSON.parse(
      (storage ?? globalThis.localStorage)?.getItem(TOTALS_KEY) || "{}",
    );
    return {
      orders: safeCount(saved?.orders),
      sandwiches: safeCount(saved?.sandwiches),
    };
  } catch {
    return { orders: 0, sandwiches: 0 };
  }
}
export function saveTotals(totals) {
  try {
    localStorage.setItem(TOTALS_KEY, JSON.stringify(totals));
  } catch {}
}
export function addTotals(totals, { orders = 0, sandwiches = 0 }) {
  return {
    orders: Math.min(
      Number.MAX_SAFE_INTEGER,
      safeCount(totals.orders) + safeCount(orders),
    ),
    sandwiches: Math.min(
      Number.MAX_SAFE_INTEGER,
      safeCount(totals.sandwiches) + safeCount(sandwiches),
    ),
  };
}
