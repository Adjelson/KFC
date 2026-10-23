import React, { useEffect, useRef, useState } from "react";
import {
  ingredients,
  fries,
  drinks,
  productById,
  ingredientName,
  evaluate,
} from "./game.js";
import { Burger, FoodArt, Customer } from "./FoodArt.jsx";
import { OrderLines, PreparedTray } from "./OrderViews.jsx";
import { sound } from "./audio.js";
import {
  CUSTOMER_TYPES,
  startService,
  advanceService,
  chooseCustomer,
  selectProduct,
  setDraft,
  addPrepared,
  deliverCustomer,
  customerProgress,
  trayUsed,
  pauseService,
  serviceSummary,
  ghostServed,
  customerSeconds,
  customerPatience,
  customerMood,
  waitLabel,
} from "./service.js";
import { visibleIngredients, purchasedDrinks } from "./pantry.js";
import { trayCapacity } from "./career.js";
import { Icon } from "./Icons.jsx";
import { KitchenScene } from "./KitchenScene.jsx";
function KitchenBackdrop({ renovated }) {
  return (
    <svg
      className={`kitchen-backdrop ${renovated ? "upgraded" : ""}`}
      viewBox="0 0 600 360"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <rect width="600" height="360" fill="#335d58" />
      <path
        d="M0 80H600M0 150H600M0 220H600M65 0V255M165 0V255M265 0V255M365 0V255M465 0V255M565 0V255"
        stroke="#597871"
        strokeWidth="2"
        opacity=".35"
      />
      <path d="M70 0V26M515 0V26" stroke="#183f3c" strokeWidth="6" />
      <path
        d="M40 42Q70 2 100 42M485 42Q515 2 545 42"
        fill={renovated ? "#cfac65" : "#b9c4ad"}
      />
      <ellipse cx="70" cy="44" rx="29" ry="4" fill="#ffe4ab" />
      <ellipse cx="515" cy="44" rx="29" ry="4" fill="#ffe4ab" />
      <path
        d="M70 45L10 250H160ZM515 45L440 250H590Z"
        fill="#ffe4ab"
        opacity=".04"
      />
      <rect
        x="34"
        y="80"
        width="125"
        height="126"
        rx="8"
        fill="#193f3b"
        stroke="#a5ab87"
        strokeWidth="8"
      />
      <path d="M43 188L65 124 92 150 126 102 150 185Z" fill="#80a190" />
      <path d="M96 83V202M38 146H155" stroke="#a5ab87" strokeWidth="5" />
      <rect
        x="432"
        y="93"
        width="138"
        height="97"
        rx="7"
        fill="#203e39"
        stroke={renovated ? "#d6b66e" : "#9b9e79"}
        strokeWidth="5"
      />
      <text
        x="501"
        y="120"
        textAnchor="middle"
        fill="#e4ce91"
        fontSize="15"
        fontWeight="900"
      >
        MONTA &amp; TREINA
      </text>
      <path
        d="M457 139H547M465 151H539M475 163H528"
        stroke="#809c7f"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M200 91H390"
        stroke="#b6b89a"
        strokeWidth="5"
        strokeLinecap="round"
      />
      {[226, 280, 337].map((x, i) => (
        <g key={x}>
          <path d={`M${x} 95V126`} stroke="#b6b89a" strokeWidth="4" />
          {i === 1 ? (
            <path d={`M${x - 10} 126h20l-4 40h-12Z`} fill="#a9b29a" />
          ) : (
            <circle
              cx={x}
              cy="145"
              r="18"
              fill="#1b3c38"
              stroke="#a5ad95"
              strokeWidth="4"
            />
          )}
        </g>
      ))}
      <rect y="252" width="600" height="18" fill="#b9ac87" />
      <rect y="270" width="600" height="90" fill="#ab7950" />
      <path
        d="M0 291H600M120 278V360M310 278V360M485 278V360"
        stroke="#866343"
        strokeWidth="4"
      />
      <path
        d="M140 286H177M331 286H368M505 286H542"
        stroke="#dec79b"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path d="M33 225H119L126 250H26Z" fill="#80a184" />
      {[453, 483, 513].map((x, i) => (
        <g key={x}>
          <rect
            x={x}
            y="215"
            width="20"
            height="35"
            rx="4"
            fill={["#b5454c", "#d6b65d", "#e1d3a7"][i]}
          />
          <rect x={x + 4} y="209" width="12" height="9" rx="2" fill="#c9c9a6" />
        </g>
      ))}
    </svg>
  );
}
export function ServiceGame(props) {
  const { plan, settings, paused, career, ghost } = props,
    callbacks = useRef(props);
  callbacks.current = props;
  const [state, setState] = useState(() => startService(plan, Date.now())),
    stateRef = useRef(state),
    [now, setNow] = useState(Date.now()),
    [error, setError] = useState(""),
    [action, setAction] = useState(null),
    [busy, setBusy] = useState(false),
    [fx, setFx] = useState(null),
    [flights, setFlights] = useState([]);
  const busyRef = useRef(false),
    pausedAt = useRef(null),
    finished = useRef(false),
    timerRef = useRef(null),
    flightTimers = useRef(new Set()),
    assembly = useRef(null),
    serial = useRef(0),
    lastTick = useRef(-1);
  const customer = state.customers.find(
      (c) => c.id === state.selected && c.status === "active",
    ),
    recipe = customer ? productById(customer.current) : null,
    selected = customer?.drafts[customer.current] || [],
    progress = customer ? customerProgress(customer) : null,
    capacity = trayCapacity(career),
    used = trayUsed(state),
    elapsed = Math.max(0, (now - state.startedAt) / 1000),
    remaining = customer
      ? Math.max(0, Math.ceil((customer.deadline - now) / 1000))
      : 0,
    allReady = progress?.complete;
  function publish(next) {
    stateRef.current = next;
    setState(next);
  }
  function complete() {
    if (finished.current || !stateRef.current.done || busyRef.current) return;
    finished.current = true;
    callbacks.current.onComplete(serviceSummary(stateRef.current, Date.now()));
  }
  function tick() {
    if (pausedAt.current !== null || finished.current) return;
    const time = Date.now();
    setNow(time);
    const previous = stateRef.current,
      next = advanceService(previous, time);
    if (next !== previous) {
      publish(next);
      if (next.lost > previous.lost) {
        setError("Um cliente perdeu a paciência.");
        sound.play("timeout");
      }
    }
    complete();
  }
  useEffect(() => {
    const timer = setInterval(tick, 100);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
      clearTimeout(timerRef.current);
      for (const t of flightTimers.current) clearTimeout(t);
    };
  }, []);
  useEffect(() => {
    if (paused && pausedAt.current === null) pausedAt.current = Date.now();
    else if (!paused && pausedAt.current !== null) {
      const delta = Date.now() - pausedAt.current;
      pausedAt.current = null;
      publish(pauseService(stateRef.current, delta));
      setNow(Date.now());
    }
  }, [paused]);
  useEffect(() => {
    if (recipe) callbacks.current.onContext(recipe.id);
  }, [recipe?.id]);
  useEffect(() => {
    if (remaining > 0 && remaining <= 5 && lastTick.current !== remaining) {
      lastTick.current = remaining;
      sound.play("tick");
    }
  }, [remaining]);
  function canAct() {
    const c = stateRef.current.customers.find(
      (c) => c.id === stateRef.current.selected,
    );
    return (
      !finished.current &&
      !busyRef.current &&
      pausedAt.current === null &&
      c?.status === "active" &&
      Date.now() < c.deadline
    );
  }
  function animate(items, kind, reward = 0) {
    if (!settings.animations) {
      setFx(null);
      complete();
      return;
    }
    busyRef.current = true;
    setBusy(true);
    callbacks.current.onBusy(true);
    setFx({
      key: ++serial.current,
      items,
      kind,
      reward,
      person: kind === "serve" && reward > 0 ? customer : null,
      departureX: `${((active.findIndex((c) => c.id === customer?.id) + 0.5) / Math.max(1, active.length)) * 100}%`,
    });
    timerRef.current = setTimeout(
      () => {
        busyRef.current = false;
        setBusy(false);
        callbacks.current.onBusy(false);
        setFx(null);
        complete();
      },
      kind === "serve" ? 540 : 360,
    );
  }
  function fly(id, source, remove) {
    if (!settings.animations || !source || !assembly.current) return;
    const from = source.getBoundingClientRect(),
      to = assembly.current
        .querySelector(".burger-stack")
        .getBoundingClientRect(),
      key = ++serial.current;
    const dx = to.x + to.width / 2 - from.x - from.width / 2,
      dy = to.y + to.height * 0.5 - from.y - from.height / 2;
    setFlights((old) => [
      ...old,
      {
        id,
        key,
        x: (remove ? to.x + to.width / 2 : from.x + from.width / 2) - 44,
        y: (remove ? to.y + to.height * 0.5 : from.y + from.height / 2) - 28,
        dx: remove ? -dx : dx,
        dy: remove ? -dy : dy,
      },
    ]);
    const t = setTimeout(() => {
      setFlights((old) => old.filter((f) => f.key !== key));
      flightTimers.current.delete(t);
    }, 470);
    flightTimers.current.add(t);
  }
  function toggle(id, event) {
    if (!canAct() || allReady) return;
    const double = recipe.double && ["fillet", "tender"].includes(id),
      count = selected.filter((x) => x === id).length,
      remove = count >= (double ? 2 : 1),
      items = ["fries", "drink"].includes(recipe.kind)
        ? remove
          ? []
          : [id]
        : remove
          ? selected.filter((x) => x !== id)
          : [...selected, id];
    publish(setDraft(stateRef.current, items));
    setAction({ id, remove, key: ++serial.current });
    setError("");
    sound.ingredient(id, remove);
    fly(id, event.currentTarget, remove);
  }
  function prepare() {
    if (!canAct()) {
      tick();
      return;
    }
    const current = stateRef.current.customers.find(
      (c) => c.id === stateRef.current.selected,
    );
    const product = productById(current.current),
      items = current.drafts[current.current] || [];
    const verdict = evaluate(product, items);
    if (!verdict.perfect) {
      setError(
        verdict.stackError
          ? "Coloca o queijo entre os dois filetes."
          : `Revê a montagem · faltam ${verdict.missing.length} · a mais ${verdict.extra.length}`,
      );
      sound.play("error");
      return;
    }
    const result = addPrepared(
      stateRef.current,
      product.id,
      capacity,
      Date.now(),
    );
    if (!result.added) {
      setError(
        used >= capacity
          ? "Bandeja cheia · entrega produtos para libertar espaço."
          : "Este produto já está preparado.",
      );
      sound.play("error");
      return;
    }
    publish(result.state);
    callbacks.current.onProduct(product.id);
    setError("");
    setAction(null);
    sound.play("serve");
    animate(items, "prepare");
  }
  function deliver() {
    if (!canAct()) {
      tick();
      return;
    }
    const items = customer.order.find((l) => customer.prepared[l.recipeId] > 0),
      art = items ? productById(items.recipeId).items : [];
    const result = deliverCustomer(stateRef.current, customer.id, Date.now());
    if (!result.delivered) return;
    publish(result.state);
    if (result.complete) callbacks.current.onCustomer(result.reward);
    setError("");
    setAction(null);
    sound.play(result.complete ? "success" : "serve");
    animate(art, "serve", result.reward);
  }
  function choose(id) {
    if (busyRef.current || pausedAt.current !== null) return;
    publish(chooseCustomer(stateRef.current, id));
    setAction(null);
    setError("");
    sound.play("click");
  }
  const active = state.customers.filter((c) => c.status === "active"),
    waiting = state.customers.filter((c) => c.status === "queued").length,
    readyToDeliver = customer
      ? Object.values(customer.prepared).reduce((n, v) => n + v, 0)
      : 0;
  return (
    <div
      className={`kitchen service-game landscape-kitchen ${busy ? "is-serving" : ""} ${ghost ? "ghost-mode" : ""} ${career.renovations.includes("chef") ? "chef-renovated" : ""}`}
      style={{
        "--selected-slot": Math.max(
          0,
          active.findIndex((c) => c.id === state.selected),
        ),
      }}
      aria-label="Serviço de clientes"
      aria-busy={busy}
    >
      <KitchenScene />
      <section className="customer-queue" aria-label="Fila de clientes">
        {fx?.person && (
          <div
            className="customer-goodbye"
            style={{ left: fx.departureX }}
            aria-hidden="true"
          >
            <Customer number={fx.person.number} type={fx.person.type} />
            <span>
              ＋{fx.reward} <Icon name="coin" />
            </span>
          </div>
        )}
        <div className="queue-heading">
          <h1 tabIndex="-1">
            {ghost ? "Corrida ao recorde" : `Nível ${plan.levelId}`}
          </h1>
          <button
            className="service-wallet"
            aria-label="Melhorar restaurante"
            disabled={busy}
            onClick={props.onRestaurant}
          >
            ✓ {state.served}/{plan.customers.length} <i>·</i>
            <Icon name="coin" />
            {career.coins}
            <b>＋</b>
          </button>
          <span className="queue-next">
            {waiting
              ? `+${waiting} a chegar`
              : state.streak > 1
                ? `Sequência ×${state.streak}`
                : "Na cozinha"}
          </span>
        </div>
        <div className="queue-cards">
          {active.map((c) => {
            const ratio = customerPatience(c, now),
              mood = customerMood(c, now),
              seconds = customerSeconds(c, now),
              type = CUSTOMER_TYPES[c.type],
              made = c.order.reduce(
                (n, l) => n + (c.delivered[l.recipeId] || 0),
                0,
              ),
              total = c.order.reduce((n, l) => n + l.quantity, 0);
            return (
              <button
                key={c.id}
                className={`customer-card ${c.id === state.selected ? "current" : ""} type-${c.type} ${ratio < 0.25 ? "impatient" : ""}`}
                data-mood={mood}
                aria-label={`Cliente ${c.number}, ${type.name}`}
                aria-pressed={c.id === state.selected}
                disabled={busy}
                onClick={() => choose(c.id)}
              >
                <div className="queue-avatar" aria-hidden="true">
                  <Customer number={c.number} type={c.type} mood={mood} />
                  <i>{type.icon}</i>
                </div>
                <span
                  className={`customer-clock ${seconds <= 10 ? "urgent" : ""}`}
                  role="timer"
                  aria-label={`Tempo do cliente ${c.number}: ${seconds} segundos`}
                >
                  {waitLabel(seconds)}
                </span>
                {c.lastBonusAt !== null && now - c.lastBonusAt < 1500 && (
                  <span className="patience-gain" role="status">
                    ＋{c.lastBonusGain}s
                  </span>
                )}
                <div className="customer-info">
                  <strong>{type.name}</strong>
                  <small>
                    #{String(c.number).padStart(2, "0")} · {made}/{total}{" "}
                    entregues
                  </small>
                  <div
                    className="customer-patience"
                    role="progressbar"
                    aria-label={`Paciência do cliente ${c.number}`}
                    aria-valuenow={Math.round(ratio * 100)}
                    aria-valuemin="0"
                    aria-valuemax="100"
                  >
                    <i style={{ width: `${ratio * 100}%` }} />
                  </div>
                </div>
                <div className="customer-order-preview" aria-hidden="true">
                  {c.order.slice(0, 3).map((l) => (
                    <div key={l.recipeId}>
                      <Burger items={productById(l.recipeId).items} compact />
                      <b>
                        {(c.delivered[l.recipeId] || 0) +
                          (c.prepared[l.recipeId] || 0)}
                        /{l.quantity}
                      </b>
                    </div>
                  ))}
                  {c.order.length > 3 && <small>＋{c.order.length - 3}</small>}
                </div>
                {Object.values(c.prepared).some((n) => n > 0) && (
                  <span className="customer-ready" aria-hidden="true">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {ghost && (
          <div className="ghost-pace" aria-label="Comparação com o recorde">
            <Icon name="ghost" />
            <span>
              Tu <b>{state.served}</b>
            </span>
            <div>
              <i
                style={{
                  width: `${(state.served / plan.customers.length) * 100}%`,
                }}
              />
              <em
                style={{
                  left: `${(ghostServed(ghost, elapsed) / plan.customers.length) * 100}%`,
                }}
              >
                ◇
              </em>
            </div>
            <span>
              Recorde <b>{ghostServed(ghost, elapsed)}</b> ·{" "}
              {ghost.duration.toFixed(1)}s
            </span>
          </div>
        )}
      </section>
      {customer && recipe ? (
        <>
          <section
            className="order-board service-ticket"
            aria-label="Pedido do cliente"
          >
            <div className="ticket">
              <span className="ticket-caption">
                CLIENTE #{String(customer.number).padStart(3, "0")} ·{" "}
                {customer.number}/{plan.customers.length} · NÍVEL {plan.levelId}
              </span>
              <h2>{recipe.name}</h2>
              <OrderLines
                lines={progress.lines}
                current={recipe.id}
                onChoose={(id) => {
                  if (canAct()) {
                    publish(selectProduct(stateRef.current, id));
                    setError("");
                    setAction(null);
                  }
                }}
                disabled={busy}
              />
            </div>
            <div
              className={`timer ${remaining <= 10 ? "urgent" : ""}`}
              aria-hidden="true"
            >
              {remaining}
              <small>seg</small>
            </div>
          </section>
          <section
            className="assembly service-assembly"
            ref={assembly}
            data-recipe={recipe.id}
            aria-label="Zona de montagem"
          >
            <KitchenBackdrop renovated={career.renovations.includes("chef")} />
            <div className="assembly-title">
              <span>
                {allReady
                  ? "PRONTO A ENTREGAR"
                  : recipe.double
                    ? "DOUBLE · 2 FILETES"
                    : "MONTA O PRODUTO"}
              </span>
              <span>{selected.length} ingredientes</span>
              <button
                className="undo-ingredient"
                aria-label="Retirar último ingrediente"
                disabled={!selected.length || busy || allReady}
                onClick={() => {
                  if (canAct()) {
                    publish(setDraft(stateRef.current, selected.slice(0, -1)));
                    setError("");
                    setAction(null);
                  }
                }}
              >
                ↶
              </button>
            </div>
            {allReady ? (
              <PreparedTray
                lines={customer.order.map((l) => ({
                  ...l,
                  prepared: customer.prepared[l.recipeId] || 0,
                }))}
              />
            ) : (
              <Burger items={selected} action={action} fit />
            )}
            {!selected.length && !allReady && (
              <p className="empty">
                <span aria-hidden="true">＋</span>
                <small>Toca nos ingredientes</small>
              </p>
            )}
            {action && (
              <div
                key={action.key}
                className={`ingredient-feedback ${action.remove ? "removed" : ""}`}
                role="status"
              >
                {action.remove ? "−" : "＋"} {ingredientName(action.id)}
              </div>
            )}
            {error && (
              <div className="assembly-error" role="alert">
                {error}
              </div>
            )}
            {fx && (
              <div
                className={`service-package package-${fx.kind}`}
                key={fx.key}
                aria-hidden="true"
              >
                <Burger items={fx.items} compact />
                {fx.reward > 0 && (
                  <span>
                    ＋{fx.reward}
                    <Icon name="coin" />
                  </span>
                )}
              </div>
            )}
          </section>
          <section
            className="workstation service-workstation"
            aria-label="Bancada de ingredientes"
          >
            <div className="section-line">
              <h2>
                {recipe.kind === "drink"
                  ? "Escolhe a bebida"
                  : recipe.kind === "fries"
                    ? "Escolhe a porção"
                    : "Ingredientes"}
              </h2>
              <span aria-hidden="true">✦</span>
            </div>
            <div
              className={`ingredient-grid ${recipe.kind === "fries" ? "fries-grid" : recipe.kind === "drink" ? "drinks-grid" : ""}`}
            >
              {(recipe.kind === "drink"
                ? purchasedDrinks(career)
                : recipe.kind === "fries"
                  ? fries
                  : visibleIngredients(career)
              ).map((item) => (
                <button
                  key={item.id}
                  className={`ingredient ${selected.includes(item.id) ? "selected" : ""}`}
                  data-ingredient={item.id}
                  data-container={
                    ["Pães", "Vegetais", "Extras"].includes(item.type)
                      ? "plate"
                      : item.type === "Molhos"
                        ? "bowl"
                        : "tray"
                  }
                  aria-label={item.name}
                  aria-pressed={selected.includes(item.id)}
                  disabled={busy || allReady}
                  onClick={(e) => toggle(item.id, e)}
                >
                  <span className="ingredient-pan">
                    <FoodArt id={item.id} />
                    <span className="check">
                      {selected.includes(item.id)
                        ? recipe.double &&
                          ["fillet", "tender"].includes(item.id)
                          ? `${selected.filter((x) => x === item.id).length}/2`
                          : "✓"
                        : "+"}
                    </span>
                  </span>
                  <strong>{item.name}</strong>
                </button>
              ))}
            </div>
          </section>
          <div className="service-controls">
            <div
              className={`tray-meter ${used === capacity ? "full" : ""}`}
              aria-label={`Bandeja: ${used} de ${capacity} espaços`}
            >
              <Icon name="tray" />
              <strong>
                {used}/{capacity}
              </strong>
              <div aria-hidden="true">
                {Array.from({ length: capacity }, (_, i) => (
                  <i key={i} className={i < used ? "occupied" : ""} />
                ))}
              </div>
            </div>
            <button
              className="prepare-button"
              aria-label="Adicionar à bandeja"
              disabled={busy || allReady}
              onClick={prepare}
            >
              <Icon name="tray" />
              <span>Preparar</span>
            </button>
            <button
              className="primary deliver-button"
              aria-label={`Entregar ao cliente ${customer.number}`}
              disabled={busy || readyToDeliver === 0}
              onClick={deliver}
            >
              Entregar <b>{readyToDeliver || ""}</b>
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </>
      ) : (
        <div className="service-interlude">
          <Customer number={state.served + 1} />
          <p>O próximo cliente está a chegar…</p>
        </div>
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
    </div>
  );
}
