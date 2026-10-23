import { recipes, trainingRecipes, pickRecipe, productById } from "./game.js";
export const MAX_ORDER_SIZE = 4;
const TOTALS_KEY = "montagem-totals";
const safeCount = (n) => (Number.isSafeInteger(n) && n >= 0 ? n : 0);

export function makeOrder(
  {
    choice = "random",
    quantity = 1,
    assortment = "same",
    variant = "single",
    side = "none",
    friesSize = "small",
    allowedRecipeIds = recipes.map((r) => r.id),
  } = {},
  previous,
  random = Math.random,
) {
  const count = Number.isInteger(quantity)
    ? Math.max(1, Math.min(MAX_ORDER_SIZE, quantity))
    : 1;
  const available = trainingRecipes.filter((r) =>
    allowedRecipeIds.includes(r.id),
  );
  if (!available.length) return [];
  const first =
    available.find((r) => r.id === choice) ||
    pickRecipe(previous, random, available);
  const ids = [first.id];
  for (let i = 1; i < count; i++) {
    const pool =
      i === 1 && available.length > 1
        ? available.filter((r) => r.id !== first.id)
        : available;
    ids.push(
      assortment === "mixed"
        ? pool[Math.floor(random() * pool.length)].id
        : first.id,
    );
  }
  if (side === "only") ids.length = 0;
  else
    for (let i = 0; i < ids.length; i++)
      if (
        recipes.some((r) => r.id === ids[i]) &&
        (variant === "double" || (variant === "mixed" && random() < 0.5))
      )
        ids[i] += "-double";
  if (side !== "none") {
    const size = ["small", "medium", "large"].includes(friesSize)
      ? friesSize
      : "small";
    ids.push(...Array(count).fill(`fries-${size}`));
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
  return line ? productById(line.recipeId) : null;
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
      fries: safeCount(saved?.fries),
    };
  } catch {
    return { orders: 0, sandwiches: 0, fries: 0 };
  }
}
export function saveTotals(totals) {
  try {
    localStorage.setItem(TOTALS_KEY, JSON.stringify(totals));
  } catch {}
}
export function addTotals(totals, { orders = 0, sandwiches = 0, fries = 0 }) {
  return {
    fries: Math.min(
      Number.MAX_SAFE_INTEGER,
      safeCount(totals.fries) + safeCount(fries),
    ),
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

export function orderDuration(order, limit) {
  return order.reduce(
    (total, line) =>
      total +
      line.quantity *
        (["fries", "drink"].includes(productById(line.recipeId)?.kind)
          ? Math.max(10, Math.round(limit * 0.4))
          : limit),
    0,
  );
}
