import React from "react";
import { recipes } from "./game.js";
import { Burger } from "./FoodArt.jsx";

export function OrderLines({ lines, current, onChoose, disabled }) {
  return (
    <div className="order-lines" aria-label="Sanduíches pedidos">
      {lines.map((line) => {
        const recipe = recipes.find((r) => r.id === line.recipeId),
          done = line.prepared === line.quantity;
        return (
          <button
            key={line.recipeId}
            className={`order-line ${current === line.recipeId ? "current" : ""} ${done ? "fulfilled" : ""}`}
            aria-label={`${recipe.name}: ${line.prepared} de ${line.quantity} preparados`}
            aria-pressed={current === line.recipeId}
            disabled={disabled || done}
            onClick={() => onChoose(line.recipeId)}
          >
            <span className="order-line-art" aria-hidden="true">
              <Burger items={recipe.items} compact />
            </span>
            <span className="order-line-name">{recipe.name}</span>
            <strong>
              {line.prepared}/{line.quantity}
              <i aria-hidden="true">{done ? "✓" : ""}</i>
            </strong>
          </button>
        );
      })}
    </div>
  );
}
export function PreparedTray({ lines }) {
  return (
    <div
      className="prepared-tray"
      style={{
        "--products": Math.max(
          1,
          lines.filter((line) => line.prepared > 0).length,
        ),
      }}
      role="img"
      aria-label="Bandeja de sanduíches preparados"
    >
      {lines
        .filter((line) => line.prepared > 0)
        .map((line) => {
          const recipe = recipes.find((r) => r.id === line.recipeId);
          return (
            <div className="tray-product" key={line.recipeId}>
              <div aria-hidden="true">
                <Burger items={recipe.items} compact />
              </div>
              <strong>{line.prepared}×</strong>
              <small>{recipe.name}</small>
            </div>
          );
        })}
    </div>
  );
}
export function OrderReview({ lines }) {
  return (
    <div className="order-review" aria-label="Contagem por sanduíche">
      {lines.map((line) => {
        const recipe = recipes.find((r) => r.id === line.recipeId);
        return (
          <div
            className={`order-review-line ${line.prepared === line.quantity ? "complete" : ""}`}
            key={line.recipeId}
          >
            <div className="review-burger" aria-hidden="true">
              <Burger items={recipe.items} compact />
            </div>
            <span>{recipe.name}</span>
            <strong>
              {line.prepared}/{line.quantity}
            </strong>
          </div>
        );
      })}
    </div>
  );
}
