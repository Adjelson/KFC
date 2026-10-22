import React, { useState } from "react";
import { chapters, levels, isUnlocked } from "./challenges.js";
export function ChallengePath({ progress, onStart }) {
  const next = levels.find((l) => !progress[l.id]) || levels.at(-1);
  const [chapter, setChapter] = useState(next.chapter),
    [selected, setSelected] = useState(next.id);
  const level = levels.find((l) => l.id === selected),
    unlocked = isUnlocked(selected, progress);
  function changeChapter(index) {
    setChapter(index);
    setSelected(levels.find((l) => l.chapter === index).id);
  }
  return (
    <section className="challenge-screen">
      <div className="path-heading">
        <span className="eyebrow">O TEU PERCURSO</span>
        <h1 tabIndex="-1">Da primeira sandes ao mestre.</h1>
        <span className="path-stars">
          ★ {Object.values(progress).reduce((n, s) => n + s, 0)}/36
        </span>
      </div>
      <div
        className="chapter-tabs"
        role="tablist"
        aria-label="Caminhos de desafios"
      >
        {chapters.map((c, i) => (
          <button
            key={c.name}
            role="tab"
            aria-selected={chapter === i}
            onClick={() => changeChapter(i)}
          >
            <span>{c.icon}</span>
            <small>{c.name}</small>
          </button>
        ))}
      </div>
      <div
        className="level-path"
        role="tabpanel"
        aria-label={chapters[chapter].name}
      >
        <div className="path-rail" aria-hidden="true" />
        {levels
          .filter((l) => l.chapter === chapter)
          .map((l) => (
            <button
              key={l.id}
              className={`level-node ${l.id === selected ? "selected" : ""} ${progress[l.id] ? "completed" : ""}`}
              aria-label={`Nível ${l.id}: ${l.name}${!isUnlocked(l.id, progress) ? " · bloqueado" : ""}`}
              aria-pressed={l.id === selected}
              onClick={() => setSelected(l.id)}
            >
              <strong>{isUnlocked(l.id, progress) ? l.id : "🔒"}</strong>
              <small aria-label={`${progress[l.id] || 0} estrelas`}>
                {"★".repeat(progress[l.id] || 0)}
                {"☆".repeat(3 - (progress[l.id] || 0))}
              </small>
            </button>
          ))}
      </div>
      <div className="level-detail">
        <span className="eyebrow">NÍVEL {level.id}</span>
        <h2>{level.name}</h2>
        <div className="level-features">
          <span>👥 {level.clients} clientes</span>
          <span>
            🍔 {level.quantity}
            {level.variant !== "single" ? " · Double" : ""}
          </span>
          <span>
            {level.side === "none" ? "◷" : "🍟"}{" "}
            {level.side === "none"
              ? `${level.limit}s / sandes`
              : level.side === "only"
                ? "Só batatas"
                : "Menu com batatas"}
          </span>
        </div>
        <p>
          {unlocked
            ? "Serve todos os clientes corretamente para desbloquear o próximo nível."
            : `Conclui o nível ${level.id - 1} para desbloquear este desafio.`}
        </p>
      </div>
      <button
        className="primary"
        disabled={!unlocked}
        onClick={() => onStart(level.id)}
      >
        {unlocked ? `Jogar nível ${level.id}` : "Nível bloqueado"}
        <span aria-hidden="true">→</span>
      </button>
    </section>
  );
}
