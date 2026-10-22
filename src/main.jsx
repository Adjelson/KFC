import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { ingredients, recipes, evaluate, remainingSeconds } from "./game.js";
import { FoodArt, Burger, Customer } from "./FoodArt.jsx";
import { sound, loadSettings, saveSettings } from "./audio.js";
import { SupportPanel } from "./SupportPanel.jsx";
import { Icon } from "./Icons.jsx";
import { Home, Intro, Outcome } from "./Screens.jsx";
import {
  makeOrder,
  orderProgress,
  creditSandwich,
  nextRecipe,
  orderBestKey,
  loadTotals,
  saveTotals,
  addTotals,
} from "./orders.js";
import { OrderLines, PreparedTray } from "./OrderViews.jsx";
import "./style.css";

const name = (id) => ingredients.find((i) => i.id === id)?.name;
function readBest() {
  try {
    return JSON.parse(localStorage.getItem("montagem-best") || "{}") || {};
  } catch {
    return {};
  }
}

function App() {
  const [screen, setScreen] = useState("splash");
  const [limit, setLimit] = useState(60);
  const [choice, setChoice] = useState("random");
  const [mode, setMode] = useState(1);
  const [quantity, setQuantity] = useState(1),
    [assortment, setAssortment] = useState("same");
  const [order, setOrder] = useState([{ recipeId: "krunch", quantity: 1 }]),
    [prepared, setPrepared] = useState({});
  const [totals, setTotals] = useState(loadTotals),
    [sandwichesMade, setSandwichesMade] = useState(0);
  const [assemblyError, setAssemblyError] = useState(null);
  const preparedRef = useRef({}),
    totalsRef = useRef(totals),
    preparingRef = useRef(false);
  const progress = orderProgress(order, prepared),
    isCombo = progress.total > 1,
    roundLimit = limit * progress.total;
  const ready = isCombo && progress.complete;
  function recordProduction(change) {
    const next = addTotals(totalsRef.current, change);
    totalsRef.current = next;
    setTotals(next);
    saveTotals(next);
  }
  const [round, setRound] = useState(1);
  const [served, setServed] = useState(0);
  const [recipe, setRecipe] = useState(recipes[0]);
  const [selected, setSelected] = useState([]);
  const [remaining, setRemaining] = useState(60);
  const [result, setResult] = useState(null);
  const [best, setBest] = useState(readBest);
  const [settings, setSettings] = useState(loadSettings);
  const [panel, setPanel] = useState(null);
  const [panelSection, setPanelSection] = useState(null);
  const [serving, setServing] = useState(false);
  const [action, setAction] = useState(null);
  const [flights, setFlights] = useState([]);
  const deadline = useRef(0),
    active = useRef(false),
    selection = useRef([]),
    heading = useRef(null);
  const pausedAt = useRef(null),
    delivery = useRef(null),
    flightTimers = useRef(new Set()),
    assembly = useRef(null),
    lastTick = useRef(-1),
    actionNumber = useRef(0);

  useEffect(() => {
    sound.configure(settings);
    saveSettings(settings);
  }, [settings]);
  useEffect(() => {
    const visibility = () => sound.setVisible(!document.hidden);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      clearTimeout(delivery.current);
      for (const timer of flightTimers.current) clearTimeout(timer);
      sound.dispose();
    };
  }, []);
  function updateSettings(next) {
    setSettings(next);
    sound.configure(next);
    sound.unlock();
  }
  function openPanel(page, section = null) {
    setPanelSection(section);
    sound.unlock();
    sound.play("click");
    if (active.current && pausedAt.current === null) {
      if (Date.now() >= deadline.current) {
        finish(true);
      } else {
        pausedAt.current = Date.now();
        setRemaining(remainingSeconds(deadline.current, pausedAt.current));
      }
    }
    setPanel(page);
  }
  function closePanel() {
    if (pausedAt.current !== null) {
      deadline.current += Date.now() - pausedAt.current;
      pausedAt.current = null;
    }
    setPanel(null);
    sound.play("click");
  }
  function clearFlights() {
    for (const timer of flightTimers.current) clearTimeout(timer);
    flightTimers.current.clear();
    setFlights([]);
  }
  function launchIngredient(id, source, remove = false) {
    if (!settings.animations || !source || !assembly.current) return;
    const pan = document.querySelector(`[data-ingredient="${id}"]`);
    const from = (remove ? pan || source : source).getBoundingClientRect(),
      to = assembly.current
        .querySelector(".burger-stack")
        .getBoundingClientRect();
    const panX = from.x + from.width / 2,
      panY = from.y + from.height / 2,
      plateX = to.x + to.width / 2,
      plateY = to.y + to.height * 0.5;
    const startX = remove ? plateX : panX,
      startY = remove ? plateY : panY,
      endX = remove ? panX : plateX,
      endY = remove ? panY : plateY;
    const key = ++actionNumber.current;
    setFlights((old) => [
      ...old,
      {
        key,
        id,
        x: startX - 44,
        y: startY - 28,
        dx: endX - startX,
        dy: endY - startY,
      },
    ]);
    const timer = setTimeout(() => {
      setFlights((old) => old.filter((f) => f.key !== key));
      flightTimers.current.delete(timer);
    }, 470);
    flightTimers.current.add(timer);
  }

  useEffect(() => {
    document.querySelector("main h1")?.focus();
  }, [screen]);
  useEffect(() => {
    if (screen !== "splash") return;
    const timer = setTimeout(
      () => setScreen("home"),
      settings.animations ? 2000 : 100,
    );
    return () => clearTimeout(timer);
  }, [screen, settings.animations]);
  useEffect(() => {
    if (screen !== "loading") return;
    let cancelled = false,
      timer;
    // Wait for local font preparation; the round's deadline is created only afterwards.
    Promise.resolve(document.fonts?.ready)
      .catch(() => {})
      .then(() => {
        if (cancelled) return;
        timer = setTimeout(
          () => {
            sound.play("start");
            deadline.current = Date.now() + roundLimit * 1000;
            active.current = true;
            setScreen("game");
          },
          settings.animations ? 600 : 0,
        );
      });
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [screen, settings.animations, roundLimit]);
  function finish(timeout = false) {
    if (!active.current || pausedAt.current !== null) return;
    active.current = false;
    clearTimeout(delivery.current);
    preparingRef.current = false;
    const snapshot = orderProgress(order, preparedRef.current);
    const ingredientsVerdict = evaluate(
      recipe,
      snapshot.complete && isCombo ? recipe.items : selection.current,
    );
    const verdict = {
      ...ingredientsVerdict,
      perfect: isCombo ? snapshot.complete : ingredientsVerdict.perfect,
    };
    const elapsed = Math.max(
      0,
      Math.min(
        roundLimit,
        (roundLimit * 1000 - (deadline.current - Date.now())) / 1000,
      ),
    );
    const bestKey = orderBestKey(order, limit);
    const complete = () => {
      setResult({
        ...verdict,
        timeout,
        elapsed,
        limit: roundLimit,
        bestKey,
        isCombo,
        lines: snapshot.lines,
        made: snapshot.made,
        total: snapshot.total,
      });
      setServing(false);
      clearFlights();
      setScreen("result");
      sound.play(timeout ? "timeout" : verdict.perfect ? "success" : "error");
      if (verdict.perfect && !timeout) {
        setServed((n) => n + 1);
        recordProduction({ orders: 1, sandwiches: isCombo ? 0 : 1 });
        if (!isCombo) setSandwichesMade((n) => n + 1);
        setBest((old) => {
          const next = {
            ...old,
            [bestKey]: Math.min(Number(old[bestKey]) || Infinity, elapsed),
          };
          try {
            localStorage.setItem("montagem-best", JSON.stringify(next));
          } catch {}
          return next;
        });
      }
    };
    if (timeout || !settings.animations) complete();
    else {
      setServing(true);
      sound.play("serve");
      delivery.current = setTimeout(complete, 560);
    }
  }
  function prepareSandwich() {
    if (!active.current || pausedAt.current !== null || preparingRef.current)
      return;
    if (Date.now() >= deadline.current) {
      finish(true);
      return;
    }
    const verdict = evaluate(recipe, selection.current);
    if (!verdict.perfect) {
      setAction(null);
      setAssemblyError(verdict);
      sound.play("error");
      return;
    }
    const credit = creditSandwich(order, preparedRef.current, recipe.id);
    if (!credit.added) return;
    preparingRef.current = true;
    preparedRef.current = credit.counts;
    setPrepared(credit.counts);
    setSandwichesMade((n) => n + 1);
    recordProduction({ sandwiches: 1 });
    setAssemblyError(null);
    clearFlights();
    const complete = () => {
      if (!active.current) return;
      const next = nextRecipe(order, preparedRef.current, recipe.id);
      if (next) setRecipe(next);
      selection.current = [];
      setSelected([]);
      setAction(null);
      setServing(false);
      preparingRef.current = false;
    };
    if (settings.animations) {
      setServing(true);
      sound.play("serve");
      delivery.current = setTimeout(complete, 450);
    } else complete();
  }
  function chooseOrderedRecipe(id) {
    if (!active.current || preparingRef.current || pausedAt.current !== null)
      return;
    if (Date.now() >= deadline.current) {
      finish(true);
      return;
    }
    const next = nextRecipe(order, preparedRef.current, id);
    if (!next || next.id !== id || id === recipe.id) return;
    setRecipe(next);
    selection.current = [];
    setSelected([]);
    setAction(null);
    setAssemblyError(null);
    clearFlights();
    sound.play("click");
  }
  useEffect(() => {
    if (screen !== "game") return;
    const tick = () => {
      if (!active.current || pausedAt.current !== null) return;
      const left = remainingSeconds(deadline.current);
      setRemaining(left);
      if (left > 0 && left <= 5 && lastTick.current !== left) {
        sound.play("tick");
        lastTick.current = left;
      }
      if (left === 0) finish(true);
    };
    const timer = setInterval(tick, 100);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [screen, recipe, limit]);

  function start(nextCustomer = false) {
    sound.unlock();
    sound.play("click");
    clearTimeout(delivery.current);
    clearFlights();
    setServing(false);
    setAction(null);
    pausedAt.current = null;
    lastTick.current = -1;
    setRound((n) => (nextCustomer ? n + 1 : 1));
    if (!nextCustomer) {
      setServed(0);
      setSandwichesMade(0);
    }
    const nextOrder = makeOrder({ choice, quantity, assortment }, recipe.id);
    setOrder(nextOrder);
    setPrepared({});
    preparedRef.current = {};
    preparingRef.current = false;
    setAssemblyError(null);
    setRecipe(recipes.find((r) => r.id === nextOrder[0].recipeId));
    setSelected([]);
    selection.current = [];
    setResult(null);
    setRemaining(limit * quantity);
    active.current = false;
    setScreen("loading");
  }
  function toggle(id, event) {
    if (
      !active.current ||
      pausedAt.current !== null ||
      preparingRef.current ||
      ready
    )
      return;
    if (Date.now() >= deadline.current) {
      finish(true);
      return;
    }
    const remove = selection.current.includes(id);
    const next = remove
      ? selection.current.filter((x) => x !== id)
      : [...selection.current, id];
    setAssemblyError(null);
    sound.ingredient(id, remove);
    setAction({ id, remove, key: ++actionNumber.current });
    launchIngredient(id, event?.currentTarget, remove);
    selection.current = next;
    setSelected(next);
  }
  function home() {
    active.current = false;
    preparingRef.current = false;
    clearTimeout(delivery.current);
    clearFlights();
    setServing(false);
    setPanel(null);
    pausedAt.current = null;
    sound.play("click");
    setScreen("home");
  }
  const bestTime = best[result?.bestKey || orderBestKey(order, limit)];
  const shiftFinished = mode > 1 && round === mode;
  const hits = result?.isCombo ? result.made : result?.correct.length;
  const expected = result?.isCombo ? result.total : recipe.items.length;
  const stars =
    !result || result.timeout
      ? 0
      : result.perfect
        ? 3
        : hits === 0
          ? 0
          : hits >= expected * 0.6
            ? 2
            : 1;

  if (screen === "splash" || screen === "loading")
    return (
      <div
        className={`app intro-app ${settings.animations ? "" : "motion-off"}`}
      >
        <Intro
          loading={screen === "loading"}
          recipe={recipe}
          onEnter={home}
          orderSize={progress.total}
        />
      </div>
    );
  const train = { choice, limit, mode, quantity, assortment };
  function updateTraining(next) {
    if (next.choice !== undefined) setChoice(next.choice);
    if (next.limit !== undefined) setLimit(next.limit);
    if (next.mode !== undefined) setMode(next.mode);
    if (next.quantity !== undefined) setQuantity(next.quantity);
    if (next.assortment !== undefined) setAssortment(next.assortment);
    sound.play("click");
  }
  return (
    <div
      className={`app screen-${screen} ${settings.animations ? "" : "motion-off"}`}
    >
      <header className="topbar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            home();
          }}
          aria-label="Monta e Treina — início"
        >
          <span className="brand-icon">M</span>
          <span>
            MONTA<span className="brand-light"> & TREINA</span>
          </span>
        </a>
        <div className="header-tools">
          <button
            className="tool-button sound-toggle"
            aria-label={settings.enabled ? "Silenciar som" : "Ativar som"}
            aria-pressed={settings.enabled}
            onClick={() =>
              updateSettings({ ...settings, enabled: !settings.enabled })
            }
          >
            <Icon name={settings.enabled ? "sound" : "mute"} />
          </button>
          <button
            className="tool-button"
            aria-label="Abrir ajuda"
            onClick={() => openPanel("help")}
            disabled={serving}
          >
            <Icon name="help" />
          </button>
          <button
            className="tool-button"
            aria-label="Abrir definições"
            onClick={() => openPanel("settings")}
            disabled={serving}
          >
            <Icon name="settings" />
          </button>
        </div>
        {screen === "game" && (
          <button
            className="exit-button"
            onClick={home}
            aria-label="Abandonar treino"
          >
            ×
          </button>
        )}
      </header>
      <main>
        {screen === "home" && (
          <Home
            {...train}
            onStart={() => start()}
            onStats={() => openPanel("help", "stats")}
            totals={totals}
            onSetup={(section) => openPanel("setup", section)}
          />
        )}
        {screen === "game" && (
          <div
            className={`kitchen ${isCombo ? "has-combo" : ""} ${serving ? "is-serving" : ""}`}
            aria-busy={serving}
          >
            <section className="order-board" aria-label="Pedido do cliente">
              <div className="customer" aria-hidden="true">
                <Customer number={round} />
              </div>
              <div className="ticket">
                <span className="ticket-caption">
                  PEDIDO #{String(round).padStart(3, "0")}{" "}
                  {mode > 1 && `· ${round}/${mode}`}
                </span>
                <h1 tabIndex="-1" ref={heading}>
                  {isCombo ? "Pedido combinado" : recipe.name}
                </h1>
                {isCombo ? (
                  <OrderLines
                    lines={progress.lines}
                    current={recipe.id}
                    onChoose={chooseOrderedRecipe}
                    disabled={serving}
                  />
                ) : (
                  <span className="ticket-note" aria-label="1 sanduíche">
                    🍔 × 1
                  </span>
                )}
                {isCombo && (
                  <span
                    className="combo-counter"
                    aria-live="polite"
                    aria-atomic="true"
                    aria-label={`${progress.made} de ${progress.total} sanduíches preparados`}
                  >
                    ✓ {progress.made}/{progress.total} preparados
                  </span>
                )}
              </div>
              <div
                className={`timer ${remaining <= 10 ? "urgent" : ""}`}
                role="timer"
                aria-label={`${remaining} segundos restantes`}
              >
                {remaining}
                <small>seg</small>
              </div>
              <div className="patience" aria-hidden="true">
                <div style={{ width: `${(remaining / roundLimit) * 100}%` }} />
              </div>
            </section>
            <section
              className="assembly"
              ref={assembly}
              aria-label="Zona de montagem"
              data-recipe={recipe.id}
            >
              <div className="assembly-title">
                <span>
                  {ready
                    ? "BANDEJA COMPLETA"
                    : isCombo
                      ? recipe.name
                      : "ÁREA DE MONTAGEM"}
                </span>
                <span>
                  {ready
                    ? `✓ ${progress.made}/${progress.total}`
                    : `${selected.length} ingredientes`}
                </span>
              </div>
              {ready && !serving ? (
                <PreparedTray lines={progress.lines} />
              ) : (
                <Burger items={selected} action={action} fit />
              )}
              {selected.length > 0 && !ready && (
                <div className="steam" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </div>
              )}
              {action && !ready && (
                <div
                  className={`ingredient-feedback ${action.remove ? "removed" : ""}`}
                  key={action.key}
                  role="status"
                >
                  {action.remove ? "−" : "+"} {name(action.id)}
                </div>
              )}
              {!selected.length && !ready && (
                <p className="empty">
                  <span aria-hidden="true">＋</span>
                  <span className="sr-only">A bandeja está vazia.</span>
                  <small>Toca nos ingredientes ↓</small>
                </p>
              )}
              {assemblyError && (
                <div className="assembly-error" role="alert">
                  Revê a montagem · faltam {assemblyError.missing.length} · a
                  mais {assemblyError.extra.length}
                </div>
              )}
            </section>
            <section
              className="workstation"
              aria-label="Bancada de ingredientes"
            >
              <div className="section-line">
                <h2>Bancada de ingredientes</h2>
                <span aria-hidden="true">＋</span>
              </div>
              <div className="ingredient-grid">
                {ingredients.map((i) => (
                  <button
                    className={`ingredient ${selected.includes(i.id) ? "selected" : ""} ${action?.id === i.id ? "ingredient-tapped" : ""}`}
                    key={i.id}
                    data-ingredient={i.id}
                    onClick={(e) => toggle(i.id, e)}
                    disabled={serving || ready}
                    aria-label={i.name}
                    aria-pressed={selected.includes(i.id)}
                  >
                    <span className="ingredient-pan">
                      <FoodArt id={i.id} />
                      <span className="check">
                        {selected.includes(i.id) ? "✓" : "+"}
                      </span>
                    </span>
                    <strong>{i.name}</strong>
                  </button>
                ))}
              </div>
            </section>
            <div className="serve-bar">
              <span
                className="serve-hint"
                aria-label={
                  mode > 1
                    ? `${served} pedidos perfeitos neste turno`
                    : "O cliente está à espera"
                }
              >
                {isCombo
                  ? `🍔 ${progress.made}/${progress.total}`
                  : mode > 1
                    ? `✓ ${served} · ${round}/${mode}`
                    : "🍔 → 👤"}
              </span>
              <button
                className="primary serve-button"
                disabled={serving}
                onClick={() =>
                  isCombo && !ready
                    ? prepareSandwich()
                    : finish(Date.now() >= deadline.current)
                }
              >
                {serving
                  ? "A servir…"
                  : isCombo && !ready
                    ? "Adicionar à bandeja"
                    : "Servir pedido"}{" "}
                <span>→</span>
              </button>
            </div>
          </div>
        )}
        {screen === "result" && result && (
          <Outcome
            result={result}
            recipe={recipe}
            selected={selected}
            stars={stars}
            bestTime={bestTime}
            limit={result.limit ?? limit}
            round={round}
            mode={mode}
            served={served}
            sandwichesMade={sandwichesMade}
            onNext={() => start(mode > 1 && !shiftFinished)}
            onHome={home}
          />
        )}
      </main>
      {screen !== "game" && (
        <nav className="main-tabs" aria-label="Menu principal">
          <button className="current" onClick={home}>
            <Icon name="home" />
            <span>Jogar</span>
          </button>
          <button
            onClick={() => {
              home();
              openPanel("setup", "recipe");
            }}
          >
            <Icon name="play" />
            <span>Treino</span>
          </button>
          <button onClick={() => openPanel("help")}>
            <Icon name="help" />
            <span>Ajuda</span>
          </button>
          <button onClick={() => openPanel("settings")}>
            <Icon name="settings" />
            <span>Definições</span>
          </button>
        </nav>
      )}
      <div className="flight-stage" aria-hidden="true">
        {flights.map((f) => (
          <div
            key={f.key}
            className="ingredient-flight"
            style={{
              left: f.x,
              top: f.y,
              "--dx": `${f.dx}px`,
              "--dy": `${f.dy}px`,
            }}
          >
            <FoodArt id={f.id} />
          </div>
        ))}
      </div>
      {panel && (
        <SupportPanel
          page={panel}
          onPage={setPanel}
          onClose={closePanel}
          settings={settings}
          onSettings={updateSettings}
          inGame={screen === "game" && pausedAt.current !== null}
          onPreview={() => sound.play("preview")}
          training={train}
          onTraining={updateTraining}
          initialSection={panelSection}
          allowSetup={screen === "home"}
          totals={totals}
          sandwichesMade={sandwichesMade}
          served={served}
          currentRecipe={recipe.id}
        />
      )}
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
