export const ingredients = [
  { id: "seeds", name: "Pão Core", icon: "🍔", type: "Pães" },
  { id: "mini", name: "Pão H1", icon: "🍔", type: "Pães" },
  { id: "brioche", name: "Pão brioche", icon: "🥯", type: "Pães" },
  { id: "fillet", name: "Filete", icon: "🍗", type: "Frango" },
  { id: "tender", name: "Mini Filete", icon: "🍗", type: "Frango" },
  { id: "lettuce", name: "Alface", icon: "🥬", type: "Vegetais" },
  { id: "tomato", name: "Tomate", icon: "🍅", type: "Vegetais" },
  { id: "cheese", name: "Queijo", icon: "🧀", type: "Extras" },
  { id: "bacon", name: "Bacon", icon: "🥓", type: "Extras" },
  { id: "mayo", name: "Maionese", icon: "🥣", type: "Molhos" },
  { id: "bbq", name: "Molho BBQ", icon: "🥣", type: "Molhos" },
  { id: "cheddar", name: "Molho cheddar", icon: "🥣", type: "Molhos" },
];
export const recipes = [
  {
    id: "krunch",
    name: "Krunch Clássico",
    items: ["seeds", "fillet", "lettuce", "mayo"],
    tag: "Um clássico crocante",
  },
  {
    id: "bbq",
    name: "Krunch BBQ",
    items: ["mini", "tender", "cheese", "bbq"],
    tag: "O toque fumado",
  },
  {
    id: "cheddar",
    name: "O’Cheddar",
    items: ["brioche", "fillet", "cheese", "bacon", "cheddar", "mayo"],
    tag: "Para fãs de queijo",
  },
  {
    id: "classic",
    name: "Clássica",
    items: ["seeds", "fillet", "tomato", "lettuce", "mayo"],
    tag: "Fresca e crocante",
  },
];
export const doubles = recipes.map((recipe) => {
  const protein = recipe.items.includes("fillet") ? "fillet" : "tender";
  return {
    ...recipe,
    id: `${recipe.id}-double`,
    name: `${recipe.name} Double`,
    double: true,
    items: recipe.items.flatMap((id) =>
      id === protein
        ? [
            protein,
            ...(recipe.items.includes("cheese") ? ["cheese"] : []),
            protein,
          ]
        : id === "cheese"
          ? []
          : [id],
    ),
  };
});
export const fries = ["small", "medium", "large"].map((size, index) => ({
  id: `fries-${size}`,
  name: `Batatas ${["pequenas", "médias", "grandes"][index]}`,
  size,
  kind: "fries",
  items: [`fries-${size}`],
}));
export const products = [...recipes, ...doubles, ...fries];
export const productById = (id) =>
  products.find((product) => product.id === id);
export const ingredientName = (id) =>
  ingredients.find((i) => i.id === id)?.name || productById(id)?.name || id;
export function evaluate(recipe, selected) {
  const left = [...selected],
    correct = [],
    missing = [];
  for (const id of recipe.items) {
    const index = left.indexOf(id);
    if (index < 0) missing.push(id);
    else {
      correct.push(id);
      left.splice(index, 1);
    }
  }
  let stackError = false;
  if (recipe.double && !missing.length && !left.length) {
    const protein = recipe.items.includes("fillet") ? "fillet" : "tender";
    const stack = selected.filter((id) => [protein, "cheese"].includes(id));
    stackError =
      stack.join(",") !==
      (recipe.items.includes("cheese")
        ? [protein, "cheese", protein]
        : [protein, protein]
      ).join(",");
  }
  return {
    missing,
    extra: left,
    correct,
    stackError,
    perfect: !missing.length && !left.length && !stackError,
  };
}
export const remainingSeconds = (deadline, now = Date.now()) =>
  Math.max(0, Math.ceil((deadline - now) / 1000));
export function pickRecipe(previous, random = Math.random) {
  const pool = recipes.filter((r) => r.id !== previous);
  return pool[
    Math.min(pool.length - 1, Math.max(0, Math.floor(random() * pool.length)))
  ];
}
