import React, { useId } from "react";
import { FoodArt } from "./FoodArt.jsx";

export function ingredientContainer(item) {
  if (["mayo", "bbq", "cheddar"].includes(item.id)) return "bowl";
  return ["seeds", "mini", "brioche"].includes(item.id) ? "basket" : "tray";
}

export function IngredientStock({ item }) {
  const paint = useId().replace(/:/g, "");
  const kind = ingredientContainer(item);
  const sauce = { mayo: "#fff0c0", bbq: "#6e3020", cheddar: "#f6a61b" }[
    item.id
  ];
  return (
    <svg
      className={`ingredient-stock stock-${kind}`}
      viewBox="0 0 112 78"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${paint}-vessel`} x2="0" y2="1">
          <stop stopColor={kind === "basket" ? "#e2b76d" : "#edf1e9"} />
          <stop
            offset="1"
            stopColor={kind === "basket" ? "#9b6836" : "#859795"}
          />
        </linearGradient>
      </defs>
      <ellipse cx="56" cy="68" rx="48" ry="6" fill="#452b1d" opacity=".25" />
      {kind === "bowl" ? (
        <>
          <path
            d="M9 32Q12 68 56 70Q100 68 103 32Z"
            fill={`url(#${paint}-vessel)`}
            stroke="#6d807d"
            strokeWidth="1.5"
          />
          <ellipse
            cx="56"
            cy="32"
            rx="47"
            ry="24"
            fill="#fffae9"
            stroke="#b6c2b7"
            strokeWidth="2"
          />
          <ellipse
            cx="56"
            cy="32"
            rx="39"
            ry="18"
            fill={sauce}
            stroke="#9a7d4e"
            strokeWidth="1"
          />
          <path
            d="M29 31Q43 18 79 29M37 38Q55 30 74 37"
            fill="none"
            stroke={item.id === "bbq" ? "#b46b43" : "#fff9dc"}
            strokeWidth="3"
            strokeLinecap="round"
            opacity=".65"
          />
          <path
            d="M79 22L101 7"
            stroke="#869a96"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <ellipse
            cx="78"
            cy="23"
            rx="7"
            ry="4"
            fill="#bcc9bd"
            transform="rotate(-30 78 23)"
          />
          <path
            d="M17 48Q26 61 46 64"
            fill="none"
            stroke="#fff7df"
            strokeWidth="3"
            opacity=".8"
          />
        </>
      ) : (
        <>
          <path
            d="M5 28L14 67Q56 77 98 67L107 28Z"
            fill={`url(#${paint}-vessel)`}
            stroke={kind === "basket" ? "#a7773d" : "#687d7d"}
            strokeWidth="2"
          />
          {kind === "basket" && (
            <path
              d="M20 38L28 69M38 41L43 72M56 42V73M75 41L70 72M93 38L85 69M11 49Q56 64 101 49M14 59Q56 72 99 59"
              fill="none"
              stroke="#79542f"
              strokeWidth="2"
              opacity=".6"
            />
          )}
          <ellipse
            cx="56"
            cy="29"
            rx="51"
            ry="22"
            fill={kind === "basket" ? "#fff3d5" : "#c4cebf"}
            stroke={kind === "basket" ? "#d0a668" : "#edf1df"}
            strokeWidth="3"
          />
          <ellipse
            cx="56"
            cy="29"
            rx="43"
            ry="16"
            fill={kind === "basket" ? "#eee0ba" : "#819c8e"}
            opacity=".65"
          />
          <svg x="6" y="0" width="100" height="60" viewBox="0 0 104 64">
            <FoodArt id={item.id} />
          </svg>
        </>
      )}
    </svg>
  );
}
