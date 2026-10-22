import React, { useEffect, useRef, useState } from "react";
import { Icon } from "./Icons.jsx";
import { chapters, levels, isUnlocked } from "./challenges.js";
const mapHeight = 1750;
const point = (level) => ({
  x: [32, 65, 69, 36][(level.id - 1) % 4],
  y: mapHeight - 120 - (level.id - 1) * 130,
});
const points = levels.map(point);
const road = points.reduce(
  (d, p, i) =>
    !i
      ? `M${p.x} ${p.y}`
      : `${d} C${points[i - 1].x} ${(points[i - 1].y + p.y) / 2},${p.x} ${(points[i - 1].y + p.y) / 2},${p.x} ${p.y}`,
  "",
);
export function ChallengePath({ progress, onStart }) {
  const next = levels.find((l) => !progress[l.id]) || levels.at(-1);
  const [selected, setSelected] = useState(next.id);
  const viewport = useRef(null);
  const level = levels.find((l) => l.id === selected),
    unlocked = isUnlocked(selected, progress);
  useEffect(() => {
    const node = viewport.current;
    node.scrollTop = point(next).y - node.clientHeight / 2 + 35;
  }, []);
  return (
    <section className="challenge-screen">
      <div className="map-heading">
        <h1 tabIndex="-1">O teu percurso</h1>
        <span>★ {Object.values(progress).reduce((n, s) => n + s, 0)}/36</span>
      </div>
      <div
        ref={viewport}
        className="stage-scroll"
        role="region"
        aria-label="Mapa de níveis"
        tabIndex="0"
      >
        <div className="map-canvas" style={{ height: mapHeight }}>
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
              <span aria-hidden="true">{chapter.icon}</span>
              <strong>{chapter.name}</strong>
            </div>
          ))}
          {levels.map((l) => {
            const p = point(l),
              open = isUnlocked(l.id, progress);
            return (
              <button
                key={l.id}
                className={`map-node ${selected === l.id ? "selected" : ""} ${progress[l.id] ? "completed" : ""} ${open ? "" : "locked"}`}
                style={{ left: `${p.x}%`, top: p.y }}
                aria-label={`Nível ${l.id}: ${l.name}${open ? "" : " · bloqueado"}`}
                aria-pressed={selected === l.id}
                onClick={() => setSelected(l.id)}
              >
                <strong>{l.id}</strong>
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
          <span className="map-decoration decor-one" aria-hidden="true">
            ✦
          </span>
          <span className="map-decoration decor-two" aria-hidden="true">
            🍔
          </span>
          <span className="map-decoration decor-three" aria-hidden="true">
            ✦
          </span>
        </div>
      </div>
      <div className="map-selection">
        <div>
          <small>NÍVEL {level.id}</small>
          <h2>{level.name}</h2>
          <p>
            {unlocked
              ? `👥 ${level.clientRange[0]}–${level.clientRange[1]} · Pedidos surpresa`
              : `Conclui o nível ${level.id - 1}`}
          </p>
        </div>
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
