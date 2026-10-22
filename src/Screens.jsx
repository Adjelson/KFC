import React, { useEffect, useState } from "react";
import { Burger, FoodArt, Customer } from "./FoodArt.jsx";
import { Icon } from "./Icons.jsx";
import { ingredients, recipes, ingredientName } from "./game.js";
import { PreparedTray, OrderReview } from "./OrderViews.jsx";

export function Intro({ loading = false, recipe, onEnter, orderSize = 1 }) {
  return (
    <section
      className={`intro-screen ${loading ? "loading-screen" : "splash-screen"}`}
      aria-label={loading ? "A preparar o pedido" : "Abertura animada"}
    >
      <div className="intro-grain" aria-hidden="true" />
      <div className="intro-ring ring-one" aria-hidden="true" />
      <div className="intro-ring ring-two" aria-hidden="true" />
      <div className="intro-copy">
        <span className="intro-kicker">A TUA COZINHA DE TREINO</span>
        <h1>
          MONTA<span>& TREINA</span>
        </h1>
      </div>
      <div className="intro-art" aria-hidden="true">
        <div className="intro-halo" />
        <div className="intro-spark spark-one">✦</div>
        <div className="intro-spark spark-two">✧</div>
        <div className="intro-spark spark-three">✦</div>
        <div className="intro-orbit orbit-one">
          <FoodArt id="tomato" />
        </div>
        <div className="intro-orbit orbit-two">
          <FoodArt id="lettuce" />
        </div>
        <div className="intro-orbit orbit-three">
          <FoodArt id="cheese" />
        </div>
        <Burger items={(recipe || recipes[2]).items} />
        <div className="intro-shadow" />
      </div>
      <div className="intro-bottom">
        {loading ? (
          <>
            <h2>
              {orderSize > 1 ? `Pedido de ${orderSize} produtos` : recipe.name}
            </h2>
            <p role="status">
              A preparar a tua bancada
              <span className="loading-dots" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
            </p>
            <div className="loading-track" aria-hidden="true">
              <span />
            </div>
            <button className="loading-cancel" onClick={onEnter}>
              Cancelar
            </button>
          </>
        ) : (
          <>
            <p>Toca. Monta. Serve.</p>
            <button className="primary intro-enter" onClick={onEnter}>
              Entrar na cozinha <span aria-hidden="true">→</span>
            </button>
          </>
        )}
      </div>
      <span className="intro-signature">
        FEITO PARA TREINAR. PRONTO PARA JOGAR.
      </span>
    </section>
  );
}

export function Home({
  choice,
  limit,
  mode,
  quantity = 1,
  onStart,
  onSetup,
  onChallenges,
  levelProgress,
}) {
  const recipe = recipes.find((r) => r.id === choice) || recipes[0];
  return (
    <section className="home-screen">
      <div className="home-heading">
        <span className="eyebrow">VAMOS A MAIS UM PEDIDO?</span>
        <h1 tabIndex="-1">A cozinha é tua.</h1>
      </div>
      <div className="home-hero" aria-hidden="true">
        <div className="hero-tiles" />
        <div className="hero-order">
          <Customer number={1} />
          <span>
            {choice === "random" ? "Qual será o próximo?" : recipe.name}
          </span>
        </div>
        <Burger items={recipe.items} />
        <span className="hero-stamp">
          100%<small>OFFLINE</small>
        </span>
      </div>
      <button className="challenge-entry" onClick={onChallenges}>
        <span aria-hidden="true">🏆</span>
        <span>
          <strong>Percurso de desafios</strong>
          <small>
            {Object.values(levelProgress).filter((s) => s > 0).length}/12 níveis
            concluídos
          </small>
        </span>
        <b>→</b>
      </button>
      <div className="training-badges with-order-size">
        <button aria-label="Escolher receita" onClick={() => onSetup("recipe")}>
          <span aria-hidden="true">🍔</span>
          <small>{choice === "random" ? "Surpresa" : recipe.name}</small>
        </button>
        <button
          aria-label="Escolher modo de treino"
          onClick={() => onSetup("mode")}
        >
          <span aria-hidden="true">{mode === 1 ? "👤" : "👥"}</span>
          <small>{mode === 1 ? "1 pedido" : "5 pedidos"}</small>
        </button>
        <button
          aria-label="Escolher tamanho do pedido"
          onClick={() => onSetup("order")}
        >
          <span aria-hidden="true">🥪</span>
          <small>
            {quantity} {quantity === 1 ? "sanduíche" : "sanduíches"}
          </small>
        </button>
        <button
          aria-label="Escolher tempo de treino"
          onClick={() => onSetup("time")}
        >
          <span aria-hidden="true">◷</span>
          <small>{limit}s / un.</small>
        </button>
      </div>
      <button
        className="primary play-button"
        aria-label="Começar treino"
        onClick={onStart}
      >
        <span className="play-triangle" aria-hidden="true" />
        Treino livre<span aria-hidden="true">→</span>
      </button>
    </section>
  );
}

export function Outcome({
  result,
  recipe,
  selected,
  stars,
  bestTime,
  limit,
  round,
  mode,
  served,
  sandwichesMade,
  onNext,
  onHome,
}) {
  const [tab, setTab] = useState("summary"),
    [group, setGroup] = useState(result.isCombo ? "order" : "missing"),
    [page, setPage] = useState(0);
  const finished = mode > 1 && round === mode;
  const groups = [
    ...(result.isCombo
      ? [{ id: "order", title: "Pedido", items: [], mark: "🍔" }]
      : []),
    { id: "correct", title: "Corretos", items: result.correct, mark: "✓" },
    { id: "missing", title: "Faltaram", items: result.missing, mark: "−" },
    { id: "extra", title: "A mais", items: result.extra, mark: "+" },
  ];
  const current = groups.find((g) => g.id === group),
    pages = Math.max(1, Math.ceil(current.items.length / 6));
  function changeGroup(id) {
    setGroup(id);
    setPage(0);
  }
  return (
    <section
      className={`outcome-screen ${result.isCombo ? "combo-outcome" : ""}`}
    >
      <div className="outcome-heading">
        <span className="eyebrow">
          {result.isCombo ? `Pedido de ${result.total} produtos` : recipe.name}
          {mode > 1 ? ` · ${round}/${mode}` : ""}
        </span>
        <h1 tabIndex="-1">
          {result.timeout
            ? "O tempo acabou!"
            : result.perfect
              ? "Pedido perfeito!"
              : "Vamos aperfeiçoar?"}
        </h1>
      </div>
      <div
        className="segmented outcome-tabs"
        role="tablist"
        aria-label="Resultados"
      >
        {[
          ["summary", "Resumo"],
          ["review", "Revisão"],
        ].map(([id, title]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            aria-controls={`outcome-${id}`}
            id={`result-${id}`}
            onClick={() => setTab(id)}
          >
            {title}
          </button>
        ))}
      </div>
      {tab === "summary" ? (
        <div
          className="outcome-body summary-body"
          role="tabpanel"
          id="outcome-summary"
          aria-labelledby="result-summary"
        >
          {result.perfect && !result.timeout && (
            <div className="confetti" aria-hidden="true">
              {Array.from({ length: 14 }, (_, i) => (
                <i key={i} style={{ "--n": i }} />
              ))}
            </div>
          )}
          <div className="result-stars" aria-label={`${stars} de 3 estrelas`}>
            {[1, 2, 3].map((n) => (
              <span
                key={n}
                className={n <= stars ? "earned" : ""}
                style={{ "--n": n }}
              >
                ★
              </span>
            ))}
          </div>
          <div className="result-burger">
            {result.isCombo && result.made > 0 ? (
              <PreparedTray lines={result.lines} />
            ) : (
              <Burger items={selected} compact />
            )}
          </div>
          <div className="stats">
            <div>
              <span aria-hidden="true">◷</span>
              <strong>
                {result.elapsed.toFixed(1)}
                <small>s</small>
              </strong>
              <small>Tempo</small>
            </div>
            <div>
              <span aria-hidden="true">✓</span>
              <strong>
                {result.isCombo
                  ? `${result.made}/${result.total}`
                  : `${result.correct.length}/${recipe.items.length}`}
              </strong>
              <small>{result.isCombo ? "Preparados" : "Acertos"}</small>
            </div>
          </div>
          {bestTime != null && (
            <p className="record">
              ★ Melhor tempo {result.isCombo ? "neste pedido" : "neste produto"}{" "}
              · {Number(bestTime).toFixed(1)}s · limite {limit}s
            </p>
          )}
          {finished && (
            <div className="shift-summary" role="status">
              <h2>
                {result.challengeId
                  ? result.levelPassed
                    ? "Nível concluído!"
                    : "Tenta novamente o nível"
                  : "Turno concluído!"}
              </h2>
              <span>
                {served} de {mode} pedidos perfeitos
              </span>
              <small>
                {result.challengeId
                  ? result.levelPassed
                    ? `${"★".repeat(result.levelStars)} · ${result.challengeId < 12 ? "Próximo nível desbloqueado" : "Percurso completo!"}`
                    : "Serve todos os clientes para avançar."
                  : `${sandwichesMade} sanduíches preparados`}
              </small>
            </div>
          )}
        </div>
      ) : (
        <div
          className="outcome-body review-body"
          role="tabpanel"
          id="outcome-review"
          aria-labelledby="result-review"
        >
          <div className="review-groups" aria-label="Tipo de revisão">
            {groups.map((g) => (
              <button
                key={g.id}
                aria-pressed={g.id === group}
                onClick={() => changeGroup(g.id)}
              >
                <span>{g.mark}</span>
                {g.title}
                <b>
                  {g.id === "order"
                    ? `${result.made}/${result.total}`
                    : g.items.length}
                </b>
              </button>
            ))}
          </div>
          {group === "order" ? (
            <OrderReview lines={result.lines} />
          ) : (
            <div className="review-items" aria-label={current.title}>
              {current.items.length ? (
                current.items.slice(page * 6, page * 6 + 6).map((id, index) => (
                  <div className="visual-ingredient" key={`${id}-${index}`}>
                    <FoodArt id={id} />
                    <span>{ingredientName(id)}</span>
                  </div>
                ))
              ) : (
                <div className="nothing-here">
                  <span aria-hidden="true">✓</span>
                  <p>Nenhum</p>
                </div>
              )}
            </div>
          )}
          {pages > 1 && (
            <div className="pager">
              <button
                aria-label="Ingredientes anteriores"
                disabled={page === 0}
                onClick={() => setPage((n) => n - 1)}
              >
                ←
              </button>
              <span>
                {page + 1} / {pages}
              </span>
              <button
                aria-label="Ingredientes seguintes"
                disabled={page === pages - 1}
                onClick={() => setPage((n) => n + 1)}
              >
                →
              </button>
            </div>
          )}
          <p className="review-note">
            {result.isCombo
              ? "Cada unidade só conta quando a montagem está correta."
              : result.stackError
                ? "No Double, coloca o queijo entre os dois filetes."
                : recipe.double
                  ? "Double: dois filetes e queijo entre eles quando incluído."
                  : "Confere os ingredientes e o tamanho indicados no pedido."}
          </p>
        </div>
      )}
      <div className="outcome-actions">
        <button
          className="primary"
          aria-label={
            mode > 1 && !finished
              ? "Próximo cliente"
              : result.challengeId
                ? result.levelPassed && result.challengeId < 12
                  ? "Próximo nível"
                  : "Repetir nível"
                : "Treinar novamente"
          }
          onClick={onNext}
        >
          {mode > 1 && !finished
            ? "Próximo cliente"
            : result.challengeId
              ? result.levelPassed && result.challengeId < 12
                ? "Próximo nível"
                : "Repetir nível"
              : "Treinar novamente"}
          <span aria-hidden="true">→</span>
        </button>
        <button className="text-button" onClick={onHome}>
          {result.challengeId ? "Percurso de desafios" : "Voltar ao início"}
        </button>
      </div>
    </section>
  );
}
