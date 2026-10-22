import React, { useState, useEffect } from "react";
import { productById } from "./game.js";
import { Burger } from "./FoodArt.jsx";

export function OrderLines({ lines, current, onChoose, disabled }) {
  const [page, setPage] = useState(0);
  useEffect(() => {
    const index = lines.findIndex((l) => l.recipeId === current);
    if (index >= 0) setPage(Math.floor(index / 4));
  }, [current]);
  return (
    <div className="order-lines-wrap">
      <div className="order-lines" aria-label="Produtos pedidos">
        {lines.slice(page * 4, page * 4 + 4).map((line) => {
          const recipe = productById(line.recipeId),
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
      {lines.length > 4 && (
        <div className="line-pager">
          <button
            aria-label="Produtos anteriores"
            disabled={!page}
            onClick={() => setPage((p) => p - 1)}
          >
            ←
          </button>
          <span>
            {page + 1}/{Math.ceil(lines.length / 4)}
          </span>
          <button
            aria-label="Produtos seguintes"
            disabled={(page + 1) * 4 >= lines.length}
            onClick={() => setPage((p) => p + 1)}
          >
            →
          </button>
        </div>
      )}
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
      aria-label="Bandeja de produtos preparados"
    >
      {lines
        .filter((line) => line.prepared > 0)
        .map((line) => {
          const recipe = productById(line.recipeId);
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
  const [page, setPage] = useState(0);
  return (
    <div className="order-review-wrap">
      <div className="order-review" aria-label="Contagem por produto">
        {lines.slice(page * 4, page * 4 + 4).map((line) => {
          const recipe = productById(line.recipeId);
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
      {lines.length > 4 && (
        <div className="line-pager">
          <button
            aria-label="Revisão anterior"
            disabled={!page}
            onClick={() => setPage((p) => p - 1)}
          >
            ←
          </button>
          <span>
            {page + 1}/{Math.ceil(lines.length / 4)}
          </span>
          <button
            aria-label="Revisão seguinte"
            disabled={(page + 1) * 4 >= lines.length}
            onClick={() => setPage((p) => p + 1)}
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
