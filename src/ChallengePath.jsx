import React, { useEffect, useRef, useState } from "react";
import { Icon } from "./Icons.jsx";
import { MapScenery } from "./MapScenery.jsx";
import { productById } from "./game.js";
import { chapters, levels, isUnlocked } from "./challenges.js";
const mapHeight = 2050;
const point = (level) => ({
  x: [37, 65, 63, 36][(level.id - 1) % 4],
  y: mapHeight - 120 - (level.id - 1) * 150,
});
const points = levels.map(point);
const road = points.reduce(
  (d, p, i) =>
    !i
      ? `M${p.x} ${p.y}`
      : `${d} C${points[i - 1].x} ${(points[i - 1].y + p.y) / 2},${p.x} ${(points[i - 1].y + p.y) / 2},${p.x} ${p.y}`,
  "",
);
export function ChallengePath({
  progress,
  onStart,
  arrival,
  animations = true,
  onDismissArrival,
  onRace,
  career,
}) {
  const next = levels.find((l) => !progress[l.id]) || levels.at(-1);
  const [selected, setSelected] = useState(arrival?.focusId || next.id);
  const [revealed, setRevealed] = useState(!arrival?.unlockedId || !animations);
  const viewport = useRef(null),
    didFocus = useRef(false);
  const level = levels.find((l) => l.id === selected),
    unlocked =
      isUnlocked(selected, progress) &&
      (selected !== arrival?.unlockedId || revealed);
  useEffect(() => {
    if (!arrival && didFocus.current) return;
    didFocus.current = true;
    const focus = levels.find((l) => l.id === arrival?.focusId) || next;
    const node = viewport.current;
    setSelected(focus.id);
    node.scrollTop = point(focus).y - node.clientHeight / 2 + 40;
  }, [arrival]);
  useEffect(() => {
    const needsReveal = Boolean(arrival?.unlockedId && animations);
    setRevealed(!needsReveal);
    if (needsReveal) {
      const timer = setTimeout(() => setRevealed(true), 850);
      return () => clearTimeout(timer);
    }
  }, [arrival, animations]);
  const rewards = (arrival?.rewards || []).map((id) =>
    id.startsWith("recipe:")
      ? productById(id.slice(7)).name
      : { training: "Treino livre", fries: "Batatas", double: "Sandes Double" }[
          id
        ],
  );
  return (
    <section className={`challenge-screen ${arrival ? "has-arrival" : ""}`}>
      <div className="map-heading">
        <h1 tabIndex="-1">Níveis</h1>
        <span>★ {Object.values(progress).reduce((n, s) => n + s, 0)}/36</span>
      </div>
      {arrival && (
        <div
          className={`completion-banner ${arrival.passed ? "passed" : "retry"}`}
          role="status"
          aria-live="polite"
        >
          <span className="completion-emblem" aria-hidden="true">
            {arrival.passed ? "★" : "↻"}
          </span>
          <div className="completion-copy">
            <h2>
              {arrival.passed
                ? `Nível ${arrival.completedId} concluído!`
                : `Nível ${arrival.completedId} por concluir`}
            </h2>
            <p>
              {arrival.passed ? (
                <>
                  <span
                    className="completion-stars"
                    aria-label={`${arrival.stars} estrelas`}
                  >
                    {"★".repeat(arrival.stars)}
                    {"☆".repeat(3 - arrival.stars)}
                  </span>
                  <span>
                    {arrival.finishedAll
                      ? "Percurso completo!"
                      : arrival.unlockedId
                        ? `Nível ${arrival.unlockedId} ${revealed ? "desbloqueado" : "a desbloquear…"}`
                        : "Escolhe a próxima fase"}
                  </span>
                </>
              ) : (
                "Serve todos os clientes para avançar."
              )}
            </p>
            {(rewards.length > 0 || arrival.earned > 0) && (
              <div
                className="completion-rewards"
                aria-label="Recompensas desbloqueadas"
              >
                {arrival.earned > 0 && <span>＋ {arrival.earned} moedas</span>}
                {rewards.map((reward) => (
                  <span key={reward}>＋ {reward}</span>
                ))}
              </div>
            )}
          </div>
          <button aria-label="Fechar celebração" onClick={onDismissArrival}>
            ×
          </button>
        </div>
      )}
      <div
        ref={viewport}
        className="stage-scroll"
        role="region"
        aria-label="Mapa de níveis"
        tabIndex="0"
      >
        <div className="map-canvas" style={{ height: mapHeight }}>
          {[0, 1, 2].map((zone) => (
            <React.Fragment key={zone}>
              <div
                className={`map-district district-${zone}`}
                style={{
                  top: zone === 2 ? 0 : point(levels[zone * 4 + 3]).y - 60,
                  height: zone === 2 ? 820 : 630,
                }}
                aria-hidden="true"
              />
              <MapScenery
                zone={zone}
                renovations={career.renovations}
                top={point(levels[zone * 4 + 3]).y - 90}
              />
            </React.Fragment>
          ))}
          <svg
            className="map-road"
            viewBox={`0 0 100 ${mapHeight}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d={road} className="road-edge" />
            <path d={road} className="road-fill" />
            <path d={road} className="road-dots" />
          </svg>
          {chapters.map((chapter, i) => (
            <div
              className={`map-world world-${i}`}
              key={chapter.name}
              style={{ top: point(levels[i * 4 + 3]).y - 75 }}
            >
              <span aria-hidden="true">
                {i < 2 ? chapters[i + 1].icon : "★"}
              </span>
              <strong>
                {i < 2 ? chapters[i + 1].name : "Mestre da cozinha"}
              </strong>
            </div>
          ))}
          {levels.map((l) => {
            const p = point(l),
              open =
                isUnlocked(l.id, progress) &&
                (l.id !== arrival?.unlockedId || revealed);
            const releasing = l.id === arrival?.unlockedId;
            return (
              <button
                key={l.id}
                className={`map-node ${selected === l.id ? "selected" : ""} ${progress[l.id] ? "completed" : ""} ${open ? "" : "locked"} ${releasing ? (revealed ? "newly-unlocked" : "unlocking") : ""}`}
                style={{ left: `${p.x}%`, top: p.y }}
                aria-label={`Nível ${l.id}: ${l.name}${open ? "" : " · bloqueado"}`}
                aria-pressed={selected === l.id}
                onClick={() => setSelected(l.id)}
              >
                <strong>{l.id}</strong>
                {releasing && revealed && (
                  <span className="new-level-badge">NOVO</span>
                )}
                {!open && (
                  <i className="node-lock" aria-hidden="true">
                    🔒
                  </i>
                )}
                <small aria-label={`${progress[l.id] || 0} estrelas`}>
                  {"★".repeat(progress[l.id] || 0)}
                  {"☆".repeat(3 - (progress[l.id] || 0))}
                </small>
              </button>
            );
          })}
        </div>
      </div>
      <div
        className={`map-selection ${career.records[level.id] ? "has-record" : ""}`}
      >
        <div>
          <small>NÍVEL {level.id}</small>
          <h2>{level.name}</h2>
          <p>
            {unlocked
              ? `👥 ${level.clientRange[0]}–${level.clientRange[1]} · Pedidos surpresa`
              : `Conclui o nível ${level.id - 1}`}
          </p>
        </div>
        {career.records[level.id] && (
          <button
            className="race-button"
            aria-label={`Desafiar recorde do nível ${level.id}`}
            onClick={() => onRace(level.id)}
          >
            <Icon name="ghost" />
            <small>{career.records[level.id].duration.toFixed(1)}s</small>
          </button>
        )}
        <button
          className="primary"
          aria-label={unlocked ? `Jogar nível ${level.id}` : "Nível bloqueado"}
          disabled={!unlocked}
          onClick={() => onStart(level.id)}
        >
          {unlocked ? <Icon name="play" /> : <span aria-hidden="true">🔒</span>}
        </button>
      </div>
    </section>
  );
}
