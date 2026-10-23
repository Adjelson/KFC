import { basicRecipes, productById } from "./game.js";
import { canMake, ownsIngredient } from "./pantry.js";
import { makeOrder } from "./orders.js";
export const chapters = [
  { name: "Primeiros passos", icon: "🌱" },
  { name: "Hora do menu", icon: "🍟" },
  { name: "Cozinha a todo o gás", icon: "🔥" },
];
const configs = [
  ["Primeiro serviço", 1, 60, "single", "none"],
  ["Novos sabores", 1, 60, "single", "none"],
  ["Dose a dobrar", 2, 55, "single", "none"],
  ["Cada cliente, um gosto", 2, 50, "single", "none"],
  ["Hora das batatas", 2, 50, "single", "random"],
  ["O primeiro menu", 2, 50, "single", "random"],
  ["Mesa para dois", 3, 45, "single", "random"],
  ["Menu grande", 3, 40, "single", "random"],
  ["Primeiro Double", 2, 50, "mixed", "random"],
  ["Queijo no meio", 3, 45, "mixed", "random"],
  ["Pedidos de todo o tipo", 3, 35, "mixed", "random"],
  ["Mestre da bancada", 4, 25, "mixed", "random"],
];
export const levels = configs.map(
  ([name, maxQuantity, limit, variant, side], index) => ({
    id: index + 1,
    chapter: Math.floor(index / 4),
    name,
    maxQuantity,
    limit,
    variant,
    side,
    clientRange: index < 4 ? [2, 4] : index < 8 ? [3, 6] : [4, 8],
  }),
);
const KEY = "montagem-levels";
export function loadProgress(storage = globalThis.localStorage) {
  try {
    const raw = JSON.parse(storage?.getItem(KEY) || "{}");
    return Object.fromEntries(
      levels.map((l) => [
        l.id,
        Number.isInteger(raw?.[l.id]) ? Math.max(0, Math.min(3, raw[l.id])) : 0,
      ]),
    );
  } catch {
    return {};
  }
}
export function isUnlocked(id, progress) {
  return (
    id === 1 ||
    (id > 1 && levels.some((l) => l.id === id) && progress[id - 1] > 0)
  );
}
export function completeLevel(progress, id, stars) {
  return isUnlocked(id, progress) &&
    Number.isInteger(stars) &&
    stars >= 1 &&
    stars <= 3
    ? { ...progress, [id]: Math.max(progress[id] || 0, stars) }
    : progress;
}
export function saveProgress(progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(progress));
  } catch {}
}
export const recipeUnlocks = { krunch: 1, bbq: 2, classic: 3, cheddar: 4 };
export function productUnlockLevel(id) {
  if (id.startsWith("drink-")) return 3;
  if (id.startsWith("fries-")) return 5;
  return id.endsWith("-double")
    ? Math.max(9, recipeUnlocks[id.replace("-double", "")] || 1)
    : recipeUnlocks[id] || 1;
}
export function productUnlocked(id, progress, career) {
  return (
    progress[productUnlockLevel(id)] > 0 &&
    (!career || canMake(career, productById(id)))
  );
}
export function trainingAccess(progress, career) {
  return {
    training: progress[1] > 0,
    recipeIds: [
      ...(career ? basicRecipes.map((p) => p.id) : []),
      ...Object.keys(recipeUnlocks),
    ].filter((id) => productUnlocked(id, progress, career)),
    fries: progress[5] > 0 && ownsIngredient(career, "fries"),
    double: progress[9] > 0,
  };
}
const draw = (random) =>
  Math.min(0.999999999, Math.max(0, Number(random()) || 0));
export function createChallengeRun(level, random = Math.random) {
  const [min, max] = level.clientRange;
  return {
    ...level,
    challengeId: level.id,
    clients: min + Math.floor(draw(random) * (max - min + 1)),
  };
}
export function challengeOrder(
  level,
  customer,
  previous,
  random = Math.random,
) {
  const side =
    level.side === "random"
      ? ["none", "with", "only"][Math.floor(draw(random) * 3)]
      : level.side;
  return makeOrder(
    {
      choice: "random",
      allowedRecipeIds: level.allowedRecipeIds,
      quantity: 1 + Math.floor(draw(random) * level.maxQuantity),
      assortment: "mixed",
      variant: level.variant,
      side,
      friesSize: ["small", "medium", "large"][Math.floor(draw(random) * 3)],
    },
    previous,
    random,
  );
}

export function resolveLevelCompletion(progress, id, stars, career) {
  const next = completeLevel(progress, id, stars);
  const passed =
    Number.isInteger(stars) &&
    stars > 0 &&
    stars <= 3 &&
    isUnlocked(id, progress);
  const previousAccess = trainingAccess(progress, career),
    access = trainingAccess(next, career);
  const rewards = [
    ...(!previousAccess.training && access.training ? ["training"] : []),
    ...access.recipeIds
      .filter((recipeId) => !previousAccess.recipeIds.includes(recipeId))
      .map((recipeId) => `recipe:${recipeId}`),
    ...(!previousAccess.fries && access.fries ? ["fries"] : []),
    ...(!previousAccess.double && access.double ? ["double"] : []),
  ];
  return {
    progress: next,
    arrival: {
      completedId: id,
      passed,
      stars: passed ? stars : 0,
      focusId: passed ? Math.min(id + 1, levels.length) : id,
      unlockedId:
        passed && id < levels.length && !isUnlocked(id + 1, progress)
          ? id + 1
          : null,
      finishedAll: passed && levels.every((level) => next[level.id] > 0),
      rewards,
    },
  };
}
