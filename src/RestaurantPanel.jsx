import React, { useEffect, useRef, useState } from "react";
import {
  UPGRADES,
  RENOVATIONS,
  starsAvailable,
  trayCapacity,
  medalNames,
  medalTier,
} from "./career.js";
import { products } from "./game.js";
import { productUnlocked } from "./challenges.js";
import { Burger } from "./FoodArt.jsx";
import { SceneArt } from "./MapScenery.jsx";
import { Icon } from "./Icons.jsx";
export function RestaurantPanel({
  career,
  progress,
  onUpgrade,
  onRenovate,
  onClose,
}) {
  const dialog = useRef(null),
    [tab, setTab] = useState("upgrades"),
    [page, setPage] = useState(0),
    [notice, setNotice] = useState(""),
    [purchase, setPurchase] = useState(0);
  useEffect(() => {
    const node = dialog.current,
      opener = document.activeElement;
    node.showModal();
    return () => {
      node.close();
      if (opener?.isConnected) opener.focus();
    };
  }, []);
  function change(id) {
    setTab(id);
    setPage(0);
    setNotice("");
  }
  function buy(id, renovation) {
    const ok = renovation ? onRenovate(id) : onUpgrade(id);
    setNotice(ok ? "Melhoria concluída!" : "Ainda faltam moedas ou estrelas.");
    if (ok) setPurchase((n) => n + 1);
  }
  const renovation = RENOVATIONS[page],
    available = starsAvailable(career, progress);
  return (
    <dialog
      ref={dialog}
      className="restaurant-dialog"
      aria-label="O meu restaurante"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="support-header">
        <h2>O meu restaurante</h2>
        <button
          className="dialog-close"
          aria-label="Fechar restaurante"
          onClick={onClose}
        >
          ×
        </button>
      </div>
      <div className="restaurant-wallet">
        <span>
          <Icon name="coin" />
          {career.coins} moedas
        </span>
        <span>★ {available} estrelas</span>
      </div>
      <div className="subtabs" role="tablist" aria-label="Restaurante">
        {[
          ["upgrades", "Melhorias"],
          ["decor", "Decoração"],
          ["album", "Álbum"],
        ].map(([id, label]) => (
          <button
            role="tab"
            key={id}
            aria-selected={tab === id}
            onClick={() => change(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className={`restaurant-body tab-${tab}`} key={`${tab}-${purchase}`}>
        {tab === "upgrades" && (
          <div className="upgrade-cards">
            {UPGRADES.map((u) => {
              const tier = career.upgrades[u.id],
                max = tier === u.costs.length;
              return (
                <div
                  key={u.id}
                  className={`upgrade-card ${tier ? "owned" : ""}`}
                >
                  <div className={`upgrade-art art-${u.id}`} aria-hidden="true">
                    <Icon name={u.icon} />
                    <span>
                      {u.id === "tray" ? trayCapacity(career) : `+${tier * 8}%`}
                    </span>
                  </div>
                  <div>
                    <h3>{u.name}</h3>
                    <p>{u.description}</p>
                    <span
                      className="upgrade-dots"
                      aria-label={`Melhoria ${tier} de 2`}
                    >
                      {[1, 2].map((n) => (
                        <i key={n} className={tier >= n ? "filled" : ""} />
                      ))}
                    </span>
                  </div>
                  <button
                    className="shop-buy"
                    disabled={max || career.coins < u.costs[tier]}
                    aria-label={
                      max
                        ? `${u.name} ao máximo`
                        : `Melhorar ${u.name} por ${u.costs[tier]} moedas`
                    }
                    onClick={() => buy(u.id, false)}
                  >
                    {max ? (
                      "✓"
                    ) : (
                      <>
                        <Icon name="coin" />
                        {u.costs[tier]}
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
        {tab === "decor" && (
          <div
            className={`renovation-card ${career.renovations.includes(renovation.id) ? "renovated" : ""}`}
          >
            <div className="renovation-scene" aria-hidden="true">
              <SceneArt
                kind={["restaurant", "diner", "kitchen"][page]}
                upgraded={career.renovations.includes(renovation.id)}
              />
              <span className="renovation-spark">✦</span>
            </div>
            <h3>{renovation.name}</h3>
            <p>{renovation.description}</p>
            <button
              className="shop-buy"
              disabled={
                career.renovations.includes(renovation.id) ||
                career.coins < renovation.coins ||
                available < renovation.stars
              }
              aria-label={`Renovar ${renovation.name}`}
              onClick={() => buy(renovation.id, true)}
            >
              {career.renovations.includes(renovation.id) ? (
                "✓ Renovado"
              ) : (
                <>
                  <Icon name="coin" />
                  {renovation.coins}
                  <span>· ★ {renovation.stars}</span>
                </>
              )}
            </button>
          </div>
        )}
        {tab === "album" && (
          <div className="medal-grid">
            {products.slice(page * 6, page * 6 + 6).map((product) => {
              const n = career.mastery[product.id] || 0,
                tier = medalTier(n),
                target = tier < 1 ? 1 : tier < 2 ? 10 : 30;
              return (
                <div className={`medal-card medal-${tier}`} key={product.id}>
                  <div className="medal-food" aria-hidden="true">
                    <Burger items={product.items} compact />
                  </div>
                  <strong>{product.name}</strong>
                  <span className="medal-ribbon">
                    {tier ? "✦" : "◇"} {medalNames[tier]}
                  </span>
                  <small>
                    {productUnlocked(product.id, progress)
                      ? tier === 3
                        ? `${n} preparados`
                        : `${n}/${target} preparados`
                      : "🔒 Por desbloquear"}
                  </small>
                  <div className="medal-progress">
                    <i
                      style={{ width: `${Math.min(100, (n / target) * 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className="restaurant-footer">
        {tab !== "upgrades" && (
          <div className="pager">
            <button
              aria-label="Página anterior"
              disabled={page === 0}
              onClick={() => setPage((n) => n - 1)}
            >
              ←
            </button>
            <span>
              {page + 1}/{tab === "decor" ? 3 : Math.ceil(products.length / 6)}
            </span>
            <button
              aria-label="Página seguinte"
              disabled={
                page ===
                (tab === "decor" ? 2 : Math.ceil(products.length / 6) - 1)
              }
              onClick={() => setPage((n) => n + 1)}
            >
              →
            </button>
          </div>
        )}
        <p role="status">
          {notice ||
            (tab === "album"
              ? "Medalhas aos 1, 10 e 30 produtos corretos."
              : "As melhorias ficam guardadas neste dispositivo.")}
        </p>
      </div>
    </dialog>
  );
}
