import React, { useEffect, useRef, useState } from "react";
import { ingredients, recipes } from "./game.js";
import { Burger, Customer, FoodArt } from "./FoodArt.jsx";
import { Icon } from "./Icons.jsx";

const guide = [
  {
    title: "Lê o pedido",
    text: "O talão mostra os produtos e as quantidades. Nos combos, cada cartão indica preparados/total.",
    art: "customer",
  },
  {
    title: "Toca para montar",
    text: "Escolhe os ingredientes na bancada. Toca novamente para retirar.",
    art: "ingredients",
  },
  {
    title: "Serve a tempo",
    text: "Nos combos, adiciona cada sanduíche correto à bandeja. Depois serve o pedido completo.",
    art: "burger",
  },
  {
    title: "Treina um turno",
    text: "No início, escolhe 1 ou 5 pedidos. Repete e melhora o teu tempo.",
    art: "shift",
  },
];
export function SupportPanel({
  page,
  onPage,
  onClose,
  settings,
  onSettings,
  inGame,
  onPreview,
  training,
  onTraining,
  initialSection,
  allowSetup = true,
  totals,
  sandwichesMade = 0,
  served = 0,
  currentRecipe = "krunch",
}) {
  const dialog = useRef(null),
    [section, setSection] = useState(
      initialSection ||
        (page === "help" ? "guide" : page === "settings" ? "audio" : "recipe"),
    );
  const [recipeId, setRecipeId] = useState(currentRecipe),
    [step, setStep] = useState(0);
  useEffect(() => {
    const node = dialog.current,
      opener = document.activeElement;
    node.showModal();
    return () => {
      if (node.open) node.close();
      if (opener?.isConnected) opener.focus();
    };
  }, []);
  function changePage(id) {
    onPage(id);
    setSection(
      id === "help" ? "guide" : id === "settings" ? "audio" : "recipe",
    );
  }
  const recipe = recipes.find((r) => r.id === recipeId);
  const tabs =
    page === "help"
      ? [
          ["guide", "Como jogar"],
          ["recipes", "Receitas"],
          ["stats", "Contadores"],
          ["about", "Sobre"],
        ]
      : page === "settings"
        ? [
            ["audio", "Áudio"],
            ["motion", "Movimento"],
          ]
        : [
            ["recipe", "Receita"],
            ["mode", "Modo"],
            ["order", "Pedido"],
            ["time", "Tempo"],
          ];
  const title =
    page === "help"
      ? "Uma ajuda na cozinha"
      : page === "settings"
        ? "À tua maneira"
        : "Prepara o teu treino";
  return (
    <dialog
      className="support-dialog"
      ref={dialog}
      aria-label="Ajuda e definições"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="support-header">
        <h2>{title}</h2>
        <button
          className="dialog-close"
          aria-label="Fechar painel"
          onClick={onClose}
        >
          ×
        </button>
      </div>
      <div className="support-navigation">
        <div className="segmented" role="tablist" aria-label="Opções do painel">
          {[
            ["setup", "Treino"],
            ["help", "Ajuda"],
            ["settings", "Definições"],
          ]
            .filter(([id]) => allowSetup || id !== "setup")
            .map(([id, text]) => (
              <button
                role="tab"
                key={id}
                aria-selected={page === id}
                onClick={() => changePage(id)}
              >
                {text}
              </button>
            ))}
        </div>
        {inGame && (
          <span className="pause-notice" role="status">
            Ⅱ Treino em pausa
          </span>
        )}
      </div>
      <div className="subtabs" role="tablist" aria-label={title}>
        {tabs.map(([id, text]) => (
          <button
            role="tab"
            key={id}
            aria-selected={section === id}
            onClick={() => setSection(id)}
          >
            {text}
          </button>
        ))}
      </div>
      <div
        className={`support-content section-${section}`}
        role="tabpanel"
        aria-label={tabs.find(([id]) => id === section)?.[1]}
      >
        {page === "help" && section === "guide" && (
          <div className="guide-page">
            <div
              className={`guide-art guide-${guide[step].art}`}
              aria-hidden="true"
            >
              {step === 0 ? (
                <>
                  <Customer number={1} />
                  <span className="mini-receipt">
                    🍔
                    <i />
                    <i />
                  </span>
                </>
              ) : step === 1 ? (
                <>
                  {["fillet", "lettuce", "cheese"].map((id) => (
                    <FoodArt id={id} key={id} />
                  ))}
                </>
              ) : step === 2 ? (
                <Burger items={recipes[0].items} />
              ) : (
                <div className="guide-customers">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Customer number={n} key={n} />
                  ))}
                </div>
              )}
            </div>
            <h3>{guide[step].title}</h3>
            <p>{guide[step].text}</p>
            <div className="pager">
              <button
                aria-label="Passo anterior"
                disabled={step === 0}
                onClick={() => setStep((n) => n - 1)}
              >
                ←
              </button>
              <div className="page-dots" aria-label={`Passo ${step + 1} de 4`}>
                {guide.map((_, i) => (
                  <i className={step === i ? "active" : ""} key={i} />
                ))}
              </div>
              <button
                aria-label="Passo seguinte"
                disabled={step === 3}
                onClick={() => setStep((n) => n + 1)}
              >
                →
              </button>
            </div>
          </div>
        )}
        {page === "help" && section === "recipes" && (
          <div className="recipe-reference">
            <label className="sr-only" htmlFor="help-recipe">
              Sanduíche
            </label>
            <select
              id="help-recipe"
              value={recipeId}
              onChange={(e) => setRecipeId(e.target.value)}
            >
              {recipes.map((r) => (
                <option value={r.id} key={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <ul className="reference-ingredients">
              {recipe.items.map((id) => (
                <li key={id}>
                  <FoodArt id={id} />
                  <span>{ingredients.find((i) => i.id === id).name}</span>
                </li>
              ))}
            </ul>
            <p className="tiny-note">
              Ingredientes ilustrados. Sem quantidades ou ordem oficial.
            </p>
          </div>
        )}
        {page === "help" && section === "stats" && (
          <div className="counter-page">
            <div className="counter-card">
              <span aria-hidden="true">✓</span>
              <strong>{totals.orders}</strong>
              <small>Pedidos concluídos</small>
            </div>
            <div className="counter-card">
              <span aria-hidden="true">🍔</span>
              <strong>{totals.sandwiches}</strong>
              <small>Sanduíches preparados</small>
            </div>
            <p className="counter-session">
              Neste turno: {served} pedidos · {sandwichesMade} sanduíches
            </p>
            <p className="tiny-note">
              Totais guardados neste dispositivo. Sanduíches contam ao entrar na
              bandeja; pedidos contam ao servir o cliente.
            </p>
          </div>
        )}
        {page === "help" && section === "about" && (
          <div className="about-page">
            <span className="about-mark" aria-hidden="true">
              M
            </span>
            <h3>Monta & Treina</h3>
            <p>Treino independente de produtos KFC, sem afiliação à marca.</p>
            <div className="info-card">
              <span aria-hidden="true">◷</span>
              <p>
                O painel pausa o treino. Ao sair da aplicação, o relógio
                continua.
              </p>
            </div>
            <div className="info-card">
              <Icon name="settings" />
              <p>
                Receitas baseadas nas descrições fornecidas. Tempos definidos
                como regras do jogo.
              </p>
            </div>
          </div>
        )}
        {page === "settings" && section === "audio" && (
          <div className="audio-settings">
            <div className="audio-switches">
              {[
                ["enabled", "Som da aplicação", "sound"],
                ["effects", "Efeitos sonoros", "help"],
                ["music", "Música de fundo", "music"],
              ].map(([key, text, icon]) => (
                <label className="setting-row" key={key}>
                  <span>
                    <Icon name={icon} />
                    <strong>{text}</strong>
                  </span>
                  <input
                    type="checkbox"
                    role="switch"
                    aria-label={text}
                    checked={settings[key]}
                    disabled={key !== "enabled" && !settings.enabled}
                    onChange={(e) =>
                      onSettings({ ...settings, [key]: e.target.checked })
                    }
                  />
                </label>
              ))}
            </div>
            <div className="audio-volume">
              <label className="volume-label" htmlFor="volume">
                Volume<output>{settings.volume}%</output>
              </label>
              <input
                id="volume"
                className="volume-slider"
                aria-label="Volume"
                type="range"
                min="0"
                max="100"
                step="5"
                value={settings.volume}
                disabled={!settings.enabled}
                onChange={(e) =>
                  onSettings({ ...settings, volume: Number(e.target.value) })
                }
              />
              <button
                className="secondary-button"
                onClick={onPreview}
                disabled={
                  !settings.enabled ||
                  !settings.effects ||
                  settings.volume === 0
                }
              >
                <Icon name="sound" />
                Testar som
              </button>
              <p className="tiny-note">
                Preferências guardadas · áudio offline
              </p>
            </div>
          </div>
        )}
        {page === "settings" && section === "motion" && (
          <div className="motion-settings">
            <div className="motion-art" aria-hidden="true">
              <FoodArt id="lettuce" />
              <FoodArt id="fillet" />
              <FoodArt id="cheese" />
            </div>
            <label className="setting-row">
              <span>
                <strong>Animações</strong>
              </span>
              <input
                type="checkbox"
                role="switch"
                aria-label="Animações"
                checked={settings.animations}
                onChange={(e) =>
                  onSettings({ ...settings, animations: e.target.checked })
                }
              />
            </label>
            <p className="tiny-note">
              Voo dos ingredientes, entregas e celebrações.
              <br />A preferência do sistema para reduzir movimento é
              respeitada.
            </p>
          </div>
        )}
        {page === "setup" && section === "recipe" && (
          <div className="recipe-picker">
            <button
              className={`random-recipe ${training.choice === "random" ? "chosen" : ""}`}
              aria-pressed={training.choice === "random"}
              onClick={() => onTraining({ choice: "random" })}
            >
              <span aria-hidden="true">⚄</span>Surpreende-me
            </button>
            <div className="recipe-options">
              {recipes.map((r) => (
                <button
                  key={r.id}
                  aria-pressed={training.choice === r.id}
                  aria-label={r.name}
                  className={training.choice === r.id ? "chosen" : ""}
                  onClick={() => onTraining({ choice: r.id })}
                >
                  <div aria-hidden="true">
                    <Burger items={r.items} compact />
                  </div>
                  <span>{r.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {page === "setup" && section === "mode" && (
          <div className="mode-picker">
            {[
              [1, "Pedido único"],
              [5, "Turno · 5 pedidos"],
            ].map(([n, text]) => (
              <button
                key={n}
                aria-pressed={training.mode === n}
                className={training.mode === n ? "chosen" : ""}
                onClick={() => onTraining({ mode: n })}
              >
                <div className="mode-illustration" aria-hidden="true">
                  {Array.from({ length: n }, (_, i) => (
                    <Customer key={i} number={i + 1} />
                  ))}
                </div>
                <strong>{text}</strong>
                <small>
                  {n === 1 ? "Um pedido de cada vez" : "Atende cinco clientes"}
                </small>
              </button>
            ))}
          </div>
        )}
        {page === "setup" && section === "order" && (
          <div className="order-settings">
            <h3>Sanduíches por cliente</h3>
            <div className="quantity-options">
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  className={training.quantity === n ? "chosen" : ""}
                  aria-label={`${n} ${n === 1 ? "sanduíche" : "sanduíches"}`}
                  aria-pressed={training.quantity === n}
                  onClick={() => onTraining({ quantity: n })}
                >
                  <span aria-hidden="true">🍔</span>
                  <strong>{n}</strong>
                </button>
              ))}
            </div>
            <div className="assortment-options">
              {[
                ["same", "Iguais"],
                ["mixed", "Variados"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  disabled={training.quantity === 1}
                  aria-pressed={training.assortment === id}
                  className={training.assortment === id ? "chosen" : ""}
                  onClick={() => onTraining({ assortment: id })}
                >
                  <span aria-hidden="true">
                    {id === "same" ? "🍔 🍔" : "🍔 🥪"}
                  </span>
                  <strong>{label}</strong>
                </button>
              ))}
            </div>
            <p className="tiny-note">
              Variados inclui pelo menos dois tipos.
              <br />
              {training.limit}s por sanduíche ·{" "}
              {training.limit * training.quantity}s por cliente
            </p>
          </div>
        )}
        {page === "setup" && section === "time" && (
          <div className="time-picker">
            {[30, 60, 90].map((t) => (
              <button
                key={t}
                aria-label={`${t} segundos`}
                aria-pressed={training.limit === t}
                className={training.limit === t ? "chosen" : ""}
                onClick={() => onTraining({ limit: t })}
              >
                <span className="clock-art" aria-hidden="true">
                  <i />
                </span>
                <strong>
                  {t}
                  <small>seg</small>
                </strong>
              </button>
            ))}
            <p className="tiny-note">
              Tempo por sanduíche. O total aumenta nos combos.
            </p>
          </div>
        )}
      </div>
      <div className="support-footer">
        <button
          className="primary"
          aria-label={inGame ? "Voltar ao treino" : "Fechar"}
          onClick={onClose}
        >
          {inGame
            ? "Voltar ao treino"
            : page === "setup"
              ? "Guardar e voltar"
              : "Fechar"}
          <span>→</span>
        </button>
      </div>
    </dialog>
  );
}
