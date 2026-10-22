import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  ingredients,
  recipes,
  fries,
  productById,
  ingredientName,
  evaluate,
  remainingSeconds,
} from "./game.js";
import { FoodArt, Burger, Customer } from "./FoodArt.jsx";
import { sound, loadSettings, saveSettings } from "./audio.js";
import { SupportPanel } from "./SupportPanel.jsx";
import { Icon } from "./Icons.jsx";
import { Home, Training, Intro, Outcome } from "./Screens.jsx";
import {
  makeOrder,
  orderProgress,
  creditSandwich,
  nextRecipe,
  orderBestKey,
  loadTotals,
  saveTotals,
  addTotals,
  orderDuration,
} from "./orders.js";
import { OrderLines, PreparedTray } from "./OrderViews.jsx";
import { ChallengePath } from "./ChallengePath.jsx";
import {
  levels,
  loadProgress,
  isUnlocked,
  completeLevel,
  saveProgress,
  challengeOrder,
  createChallengeRun,
  trainingAccess,
} from "./challenges.js";
import "./style.css";
import "./challenges.css";

const name = ingredientName;
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
  const [variant, setVariant] = useState("single"),
    [side, setSide] = useState("none"),
    [friesSize, setFriesSize] = useState("small");
  const [levelProgress, setLevelProgress] = useState(loadProgress);
  const [run, setRun] = useState({ limit: 60, clients: 1, challengeId: null });
  const access = trainingAccess(levelProgress);
  const runMode = run.clients;
  const performance = useRef([]);
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
    roundLimit = orderDuration(order, run.limit);
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
    if (page === "setup" && !access.training) return;
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
      to =
        assembly.current
          .querySelector(".burger-stack")
          ?.getBoundingClientRect() || assembly.current.getBoundingClientRect();
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
    const bestKey = orderBestKey(order, run.limit);
    const complete = () => {
      const success = verdict.perfect && !timeout;
      performance.current.push(success ? elapsed / roundLimit : 1);
      const levelFinished = run.challengeId && round === runMode;
      const levelPassed =
        levelFinished && served + (success ? 1 : 0) === runMode;
      const levelStars = levelPassed
        ? performance.current.every((t) => t <= 0.5)
          ? 3
          : performance.current.every((t) => t <= 0.8)
            ? 2
            : 1
        : 0;
      if (levelPassed)
        setLevelProgress((old) => {
          const next = completeLevel(old, run.challengeId, levelStars);
          saveProgress(next);
          return next;
        });
      setResult({
        challengeId: run.challengeId,
        levelFinished,
        levelPassed,
        levelStars,
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
        recordProduction({
          orders: 1,
          sandwiches: !isCombo && recipe.kind !== "fries" ? 1 : 0,
          fries: !isCombo && recipe.kind === "fries" ? 1 : 0,
        });
        if (!isCombo && recipe.kind !== "fries")
          setSandwichesMade((n) => n + 1);
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
    if (recipe.kind !== "fries") setSandwichesMade((n) => n + 1);
    recordProduction(
      recipe.kind === "fries" ? { fries: 1 } : { sandwiches: 1 },
    );
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

  function start(nextCustomer = false, challengeId = run.challengeId) {
    if (challengeId && !isUnlocked(challengeId, levelProgress)) return;
    const level = levels.find((l) => l.id === challengeId);
    if (!level && !access.training) return;
    const config = nextCustomer
      ? run
      : level
        ? createChallengeRun(level)
        : {
            choice: access.recipeIds.includes(choice) ? choice : "random",
            allowedRecipeIds: access.recipeIds,
            quantity,
            assortment,
            variant: access.double ? variant : "single",
            side: access.fries ? side : "none",
            friesSize,
            limit,
            clients: mode,
          };
    const nextRound = nextCustomer ? round + 1 : 1;
    if (!nextCustomer) {
      setRun({ ...config, challengeId: level?.id || null });
      performance.current = [];
    }
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
    const nextOrder = level
      ? challengeOrder(config, nextRound, recipe.id)
      : makeOrder(config, recipe.id);
    setOrder(nextOrder);
    setPrepared({});
    preparedRef.current = {};
    preparingRef.current = false;
    setAssemblyError(null);
    setRecipe(productById(nextOrder[0].recipeId));
    setSelected([]);
    selection.current = [];
    setResult(null);
    setRemaining(orderDuration(nextOrder, config.limit));
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
    const count = selection.current.filter((x) => x === id).length;
    const doubleProtein = recipe.double && ["fillet", "tender"].includes(id);
    const remove = count >= (doubleProtein ? 2 : 1);
    const next =
      recipe.kind === "fries"
        ? remove
          ? []
          : [id]
        : remove
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
  const shiftFinished = runMode > 1 && round === runMode;
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
  const train = {
    choice,
    limit,
    mode,
    quantity,
    assortment,
    variant,
    side,
    friesSize,
  };
  function updateTraining(next) {
    if (next.choice !== undefined) setChoice(next.choice);
    if (next.limit !== undefined) setLimit(next.limit);
    if (next.mode !== undefined) setMode(next.mode);
    if (next.quantity !== undefined) setQuantity(next.quantity);
    if (next.assortment !== undefined) setAssortment(next.assortment);
    if (next.variant !== undefined) setVariant(next.variant);
    if (next.side !== undefined) setSide(next.side);
    if (next.friesSize !== undefined) setFriesSize(next.friesSize);
    sound.play("click");
  }
  function nextResult() {
    if (runMode > 1 && !shiftFinished) start(true);
    else if (run.challengeId)
      start(
        false,
        result.levelPassed && run.challengeId < levels.length
          ? run.challengeId + 1
          : run.challengeId,
      );
    else start(false, null);
  }
  function navigate(target) {
    home();
    setScreen(target);
  }
  function showPath() {
    navigate("challenges");
  }
  return (
    <div
      className={`app screen-${screen} ${["home", "challenges", "training"].includes(screen) ? "with-navigation" : ""} ${settings.animations ? "" : "motion-off"}`}
    >
      <header className="topbar">
        <div className="brand" aria-label="Monta e Treina">
          <span className="brand-icon">M</span>
          <span>
            MONTA<span className="brand-light"> & TREINA</span>
          </span>
        </div>
        <div className="header-tools">
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
            aria-label={
              screen === "game" ? "Abandonar treino" : "Voltar ao início"
            }
          >
            ×
          </button>
        )}
      </header>
      <main>
        {screen === "home" && (
          <Home
            levelProgress={levelProgress}
            onPlay={(id) => start(false, id)}
          />
        )}
        {screen === "training" && (
          <Training
            {...train}
            access={access}
            onStart={() => start(false, null)}
            onSetup={(section) => openPanel("setup", section)}
          />
        )}
        {screen === "challenges" && (
          <ChallengePath
            progress={levelProgress}
            onStart={(id) => start(false, id)}
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
                  {runMode > 1 && `· ${round}/${runMode}`} ·{" "}
                  {run.challengeId ? `NÍVEL ${run.challengeId}` : "LIVRE"}
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
                  <span className="ticket-note" aria-label="1 produto">
                    {recipe.kind === "fries" ? "🍟" : "🍔"} × 1
                  </span>
                )}
                {isCombo && (
                  <span
                    className="combo-counter"
                    aria-live="polite"
                    aria-atomic="true"
                    aria-label={`${progress.made} de ${progress.total} produtos preparados`}
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
                <button
                  className="undo-ingredient"
                  aria-label="Retirar último ingrediente"
                  disabled={!selected.length || serving || ready}
                  onClick={() => {
                    const next = selection.current.slice(0, -1);
                    selection.current = next;
                    setSelected(next);
                    setAssemblyError(null);
                    setAction(null);
                    sound.play("click");
                  }}
                >
                  ↶
                </button>
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
                  {assemblyError.stackError
                    ? "Coloca o queijo entre os dois filetes."
                    : `Revê a montagem · faltam ${assemblyError.missing.length} · a mais ${assemblyError.extra.length}`}
                </div>
              )}
            </section>
            <section
              className="workstation"
              aria-label="Bancada de ingredientes"
            >
              <div className="section-line">
                <h2>
                  {recipe.kind === "fries"
                    ? "Porções de batatas"
                    : recipe.double
                      ? "Double · 2 filetes"
                      : "Bancada de ingredientes"}
                </h2>
                <span aria-hidden="true">＋</span>
              </div>
              <div
                className={`ingredient-grid ${recipe.kind === "fries" ? "fries-grid" : ""}`}
              >
                {(recipe.kind === "fries" ? fries : ingredients).map((i) => (
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
                        {selected.includes(i.id)
                          ? recipe.double && ["fillet", "tender"].includes(i.id)
                            ? `${selected.filter((id) => id === i.id).length}/2`
                            : "✓"
                          : "+"}
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
                  runMode > 1
                    ? `${served} pedidos perfeitos neste turno`
                    : "O cliente está à espera"
                }
              >
                {isCombo
                  ? `🍔 ${progress.made}/${progress.total}`
                  : runMode > 1
                    ? `✓ ${served} · ${round}/${runMode}`
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
                <span aria-hidden="true">→</span>
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
            mode={runMode}
            served={served}
            sandwichesMade={sandwichesMade}
            onNext={nextResult}
            onHome={run.challengeId ? showPath : home}
          />
        )}
      </main>
      {["home", "challenges", "training"].includes(screen) && (
        <nav className="bottom-navigation" aria-label="Menu principal">
          {[
            ["home", "Início", "home"],
            ["challenges", "Níveis", "levels"],
            ["training", "Treino", "play"],
          ].map(([id, label, icon]) => (
            <button
              key={id}
              className={screen === id ? "current" : ""}
              aria-current={screen === id ? "page" : undefined}
              onClick={() => navigate(id)}
            >
              <Icon name={icon} />
              <span>{label}</span>
              {id === "training" && !access.training && (
                <small aria-hidden="true">🔒</small>
              )}
            </button>
          ))}
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
          onClose={closePanel}
          settings={settings}
          onSettings={updateSettings}
          inGame={screen === "game" && pausedAt.current !== null}
          onPreview={() => sound.play("preview")}
          training={train}
          onTraining={updateTraining}
          initialSection={panelSection}
          totals={totals}
          sandwichesMade={sandwichesMade}
          served={served}
          currentRecipe={recipe.id}
          levelProgress={levelProgress}
          access={access}
        />
      )}
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
