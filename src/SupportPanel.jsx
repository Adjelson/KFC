import React, { useEffect, useRef, useState } from "react";
import {
  recipes,
  trainingRecipes,
  products,
  fries,
  productById,
  ingredientName,
} from "./game.js";
import { Burger, Customer, FoodArt } from "./FoodArt.jsx";
import { productUnlocked, productUnlockLevel } from "./challenges.js";
import { Icon } from "./Icons.jsx";

const guide = [
  {
    title: "Lê o pedido",
    text: "Toca num cliente para ver o talão. Cada um tem a sua paciência; podes mudar de cliente sem perder a montagem.",
    art: "customer",
  },
  {
    title: "Toca para montar",
    text: "Escolhe os ingredientes na bancada. A montagem correta passa sozinha para a bandeja. Antes disso, toca novamente para retirar ou usa ↶. No Double, coloca o queijo entre os filetes.",
    art: "ingredients",
  },
  {
    title: "Serve a tempo",
    text: "Desliza o prato ou a bandeja até ao respetivo cliente. As entregas parciais libertam espaço e recuperam um pouco de tempo. Com teclado, seleciona o prato e carrega em Enter.",
    art: "burger",
  },
  {
    title: "Faz crescer o restaurante",
    text: "Começa com pão simples. Usa as moedas no restaurante para comprar ingredientes e bebidas e receber novas receitas nos próximos serviços.",
    art: "shift",
  },
];
export function SupportPanel({
  page,
  onClose,
  settings,
  onSettings,
  inGame,
  onPreview,
  training,
  onTraining,
  initialSection,
  totals,
  sandwichesMade = 0,
  served = 0,
  currentRecipe = "krunch",
  levelProgress,
  access,
  career,
  drinksPrepared = 0,
}) {
  const dialog = useRef(null),
    [section, setSection] = useState(
      initialSection ||
        (page === "help" ? "guide" : page === "settings" ? "audio" : "recipe"),
    );
  const [recipePage, setRecipePage] = useState(() =>
    Math.max(
      0,
      Math.floor(
        trainingRecipes.findIndex(
          (p) =>
            p.id === training?.choice ||
            (training?.choice === "random" && access?.recipeIds.includes(p.id)),
        ) / 4,
      ),
    ),
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
  const recipe = productById(recipeId) || recipes[0];
  const canRead =
    productUnlocked(recipe.id, levelProgress, career) ||
    (inGame && recipe.id === currentRecipe);
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
            ["side", "Batatas"],
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
      className="support-dialog minimal-dialog"
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
            <div className="reference-selector" aria-label="Selecionar produto">
              <button
                aria-label="Receita anterior"
                onClick={() =>
                  setRecipeId(
                    products[
                      (products.indexOf(recipe) + products.length - 1) %
                        products.length
                    ].id,
                  )
                }
              >
                ←
              </button>
              <span>
                {canRead ? (
                  <Burger items={recipe.items} compact />
                ) : (
                  <span className="reference-lock" aria-hidden="true">
                    🔒
                  </span>
                )}
                <strong>{recipe.name}</strong>
              </span>
              <button
                aria-label="Receita seguinte"
                onClick={() =>
                  setRecipeId(
                    products[(products.indexOf(recipe) + 1) % products.length]
                      .id,
                  )
                }
              >
                →
              </button>
            </div>
            {canRead ? (
              <ul className="reference-ingredients">
                {recipe.items.map((id, index) => (
                  <li key={`${id}-${index}`}>
                    <FoodArt id={id} />
                    <span>{ingredientName(id)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="locked-recipe">
                <span aria-hidden="true">🔒</span>
                <p>Conclui o nível {productUnlockLevel(recipe.id)}</p>
              </div>
            )}
            <p className="tiny-note">
              {!canRead
                ? "Receita por desbloquear"
                : recipe.double
                  ? "Dois filetes; queijo entre os dois quando incluído."
                  : recipe.kind === "fries"
                    ? "Escolhe a porção indicada no talão: pequena, média ou grande."
                    : "Ingredientes ilustrados a partir das referências fornecidas."}
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
            <div className="counter-card">
              <span aria-hidden="true">🍟</span>
              <strong>{totals.fries}</strong>
              <small>Porções de batatas</small>
            </div>
            <div className="counter-card">
              <span aria-hidden="true">🥤</span>
              <strong>{drinksPrepared}</strong>
              <small>Bebidas preparadas</small>
            </div>
            <p className="counter-session">
              Neste turno: {served} pedidos · {sandwichesMade} sanduíches
            </p>
            <p className="tiny-note">
              Totais guardados neste dispositivo. Produtos contam ao preparar;
              pedidos contam ao servir o cliente.
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
                Melodia tranquila · preferências guardadas · áudio offline
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
            <label className="setting-row">
              <span>
                <strong>Cozinha horizontal</strong>
              </span>
              <input
                type="checkbox"
                role="switch"
                aria-label="Cozinha horizontal"
                checked={settings.landscape}
                onChange={(e) =>
                  onSettings({ ...settings, landscape: e.target.checked })
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
              {trainingRecipes
                .slice(recipePage * 4, recipePage * 4 + 4)
                .map((r) => (
                  <button
                    key={r.id}
                    aria-pressed={training.choice === r.id}
                    aria-label={r.name}
                    disabled={!productUnlocked(r.id, levelProgress, career)}
                    className={training.choice === r.id ? "chosen" : ""}
                    onClick={() => onTraining({ choice: r.id })}
                  >
                    <div aria-hidden="true">
                      <Burger items={r.items} compact />
                    </div>
                    <span>
                      {r.name}
                      {!productUnlocked(r.id, levelProgress, career) && (
                        <small>
                          🔒{" "}
                          {levelProgress[productUnlockLevel(r.id)] > 0
                            ? "Ingredientes"
                            : `Nível ${productUnlockLevel(r.id)}`}
                        </small>
                      )}
                    </span>
                  </button>
                ))}
            </div>
            <div className="recipe-page-controls">
              <button
                aria-label="Receitas anteriores"
                disabled={!recipePage}
                onClick={() => setRecipePage((n) => n - 1)}
              >
                ‹
              </button>
              <span>
                {recipePage + 1}/{Math.ceil(trainingRecipes.length / 4)}
              </span>
              <button
                aria-label="Mais receitas"
                disabled={(recipePage + 1) * 4 >= trainingRecipes.length}
                onClick={() => setRecipePage((n) => n + 1)}
              >
                ›
              </button>
            </div>
            <div className="variant-options" aria-label="Tipo de sandes">
              {[
                ["single", "Simples"],
                ["double", "Double"],
                ["mixed", "Misturar"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  disabled={
                    id !== "single" &&
                    (!access.double ||
                      (training.choice !== "random" &&
                        !recipes.some((p) => p.id === training.choice)))
                  }
                  title={
                    id !== "single" && !access.double
                      ? "Conclui o nível 9"
                      : undefined
                  }
                  aria-pressed={training.variant === id}
                  className={training.variant === id ? "chosen" : ""}
                  onClick={() => onTraining({ variant: id })}
                >
                  {label}
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
            <h3>Unidades por cliente</h3>
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
                  disabled={
                    training.quantity === 1 ||
                    (id === "mixed" && access.recipeIds.length < 2)
                  }
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
              {training.limit}s por sanduíche · O tempo inclui os produtos do
              pedido
            </p>
          </div>
        )}
        {page === "setup" && section === "side" && (
          <div className="side-picker">
            <div className="side-options">
              {[
                ["none", "Só sandes", "🍔"],
                ["with", "Sandes + batatas", "🍔 🍟"],
                ["only", "Só batatas", "🍟"],
              ].map(([id, label, art]) => (
                <button
                  key={id}
                  disabled={id !== "none" && !access.fries}
                  title={
                    id !== "none" && !access.fries
                      ? "Conclui o nível 5"
                      : undefined
                  }
                  className={training.side === id ? "chosen" : ""}
                  aria-pressed={training.side === id}
                  onClick={() => onTraining({ side: id })}
                >
                  <span aria-hidden="true">{art}</span>
                  <strong>{label}</strong>
                </button>
              ))}
            </div>
            <h3>
              {access.fries ? "Tamanho das batatas" : "🔒 Conclui o nível 5"}
            </h3>
            <div className="fries-options">
              {fries.map((f) => (
                <button
                  key={f.id}
                  aria-label={f.name}
                  aria-pressed={training.friesSize === f.size}
                  className={training.friesSize === f.size ? "chosen" : ""}
                  disabled={training.side === "none" || !access.fries}
                  onClick={() => onTraining({ friesSize: f.size })}
                >
                  <FoodArt id={f.id} />
                  <strong>{f.name.replace("Batatas ", "")}</strong>
                </button>
              ))}
            </div>
            <p className="tiny-note">
              Uma porção por sandes no menu.
              <br />
              No modo só batatas, a quantidade é a de porções.
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
              Tempo por sandes. Cada porção de batatas acrescenta 40% desse
              tempo (mínimo 10s).
            </p>
          </div>
        )}
      </div>
    </dialog>
  );
}
