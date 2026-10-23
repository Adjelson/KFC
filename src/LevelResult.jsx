import React, { useEffect, useRef } from "react";
import { Icon } from "./Icons.jsx";

export function LevelResult({ summary, onContinue }) {
  const dialog = useRef(null);
  useEffect(() => {
    const node = dialog.current;
    node.showModal();
    return () => node.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      className={`level-result ${summary.passed ? "level-won" : "level-lost"}`}
      aria-labelledby="level-result-title"
      onCancel={(event) => {
        event.preventDefault();
        onContinue();
      }}
    >
      <button
        className="dialog-close"
        aria-label="Fechar resultado e ver níveis"
        onClick={onContinue}
      >
        ×
      </button>
      <div className="level-result-art" aria-hidden="true">
        <span className="result-wreath">{summary.passed ? "✦" : "↻"}</span>
        {summary.passed && (
          <div className="confetti">
            {Array.from({ length: 14 }, (_, i) => (
              <i key={i} style={{ "--n": i }} />
            ))}
          </div>
        )}
      </div>
      <div className="level-result-copy">
        <span className="eyebrow">NÍVEL {summary.plan.levelId}</span>
        <h1 id="level-result-title">
          {summary.passed ? "Parabéns, chef!" : "Vamos tentar outra vez?"}
        </h1>
        <div
          className="level-result-stars"
          aria-label={`${summary.stars} de 3 estrelas`}
        >
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className={n <= summary.stars ? "earned" : ""}
              style={{ "--n": n }}
            >
              ★
            </span>
          ))}
        </div>
        <p>
          {summary.passed
            ? "Todos os clientes saíram satisfeitos."
            : "Serve todos os clientes para concluir a fase."}
        </p>
        <div className="level-result-stats">
          <div>
            <Icon name="coin" />
            <strong>＋{summary.earned}</strong>
            <small>Moedas ganhas</small>
          </div>
          <div>
            <span aria-hidden="true">✓</span>
            <strong>
              {summary.served}/{summary.total}
            </strong>
            <small>Clientes servidos</small>
          </div>
        </div>
        <small className="result-coins-note">
          As moedas já estão na carteira.
        </small>
        <button className="primary" onClick={onContinue}>
          Ver níveis <span aria-hidden="true">→</span>
        </button>
      </div>
    </dialog>
  );
}
