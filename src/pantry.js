import {
  ingredients,
  recipes,
  basicRecipes,
  products,
  drinks,
  productById,
} from "./game.js";
export const STARTER_INGREDIENTS = ["mini"];
const prices = {
  tender: 15,
  lettuce: 10,
  mayo: 10,
  cheese: 18,
  bbq: 18,
  seeds: 20,
  fillet: 25,
  tomato: 12,
  brioche: 25,
  bacon: 20,
  cheddar: 20,
};
const hints = {
  tender: "Começa a preparar pão com Mini Filete.",
  lettuce: "Frescura para o Krunch Clássico.",
  mayo: "Molho para as primeiras sandes.",
  cheese: "Abre caminho às receitas com queijo.",
  bbq: "O molho do Krunch BBQ.",
  seeds: "O pão da sandes Clássica.",
  fillet: "Filete inteiro para novas sandes.",
  tomato: "Completa os vegetais da Clássica.",
  brioche: "O pão do O’Cheddar.",
  bacon: "Mais sabor nas receitas de queijo.",
  cheddar: "Completa o O’Cheddar.",
};
export const PANTRY_ITEMS = [
  ...Object.keys(prices).map((id) => ({
    ...ingredients.find((i) => i.id === id),
    cost: prices[id],
    description: hints[id],
  })),
  {
    id: "fries",
    name: "Estação de batatas",
    cost: 25,
    art: "fries-medium",
    description: "Três tamanhos, nas fases a partir do nível 5.",
  },
  ...drinks.map((d) => ({
    ...d,
    cost: 20,
    art: d.id,
    description: "Bebidas nas fases a partir do nível 3.",
  })),
];
export const pantryIds = ["mini", ...PANTRY_ITEMS.map((i) => i.id)];
export const ownsIngredient = (career, id) =>
  !career || career.ingredients?.includes(id);
export const canMake = (career, product) =>
  !!product &&
  product.items.every((id) =>
    ownsIngredient(career, id.startsWith("fries-") ? "fries" : id),
  );
export const campaignRecipes = (career) => {
  const complete = recipes.filter((p) => canMake(career, p));
  if (complete.length) return complete;
  const available = basicRecipes.filter((p) => canMake(career, p));
  return available.some((p) => p.id === "mayo-bun")
    ? available.filter((p) => p.id !== "bread")
    : available;
};
export const purchasedDrinks = (career) =>
  drinks.filter((p) => canMake(career, p));
export function buyIngredient(career, id) {
  const item = PANTRY_ITEMS.find((i) => i.id === id);
  if (!item || career.ingredients.includes(id) || career.coins < item.cost)
    return { career, bought: false };
  return {
    bought: true,
    career: {
      ...career,
      coins: career.coins - item.cost,
      ingredients: [...career.ingredients, id],
    },
  };
}
export const visibleIngredients = (career) =>
  ingredients.filter((i) => ownsIngredient(career, i.id));
