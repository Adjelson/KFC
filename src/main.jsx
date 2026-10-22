import React, {useState, useEffect, useRef} from 'react';
import {createRoot} from 'react-dom/client';
import {ingredients, recipes, evaluate, remainingSeconds, pickRecipe} from './game.js';
import {FoodArt, Burger, Customer} from './FoodArt.jsx';
import './style.css';

const name = id => ingredients.find(i => i.id === id)?.name;
function readBest() {
  try { return JSON.parse(localStorage.getItem('montagem-best') || '{}') || {}; }
  catch { return {}; }
}

function App() {
  const [screen, setScreen] = useState('home');
  const [limit, setLimit] = useState(60);
  const [choice, setChoice] = useState('random');
  const [mode, setMode] = useState(1);
  const [round, setRound] = useState(1);
  const [served, setServed] = useState(0);
  const [recipe, setRecipe] = useState(recipes[0]);
  const [selected, setSelected] = useState([]);
  const [remaining, setRemaining] = useState(60);
  const [result, setResult] = useState(null);
  const [best, setBest] = useState(readBest);
  const deadline = useRef(0), active = useRef(false), selection = useRef([]), heading = useRef(null);

  useEffect(() => { heading.current?.focus(); }, [screen]);
  function finish(timeout = false) {
    if (!active.current) return;
    active.current = false;
    const verdict = evaluate(recipe, selection.current);
    const elapsed = Math.max(0, Math.min(limit, (limit * 1000 - (deadline.current - Date.now())) / 1000));
    setResult({...verdict, timeout, elapsed});
    setScreen('result');
    if (verdict.perfect && !timeout) {
      setServed(n => n + 1);
      const key = recipe.id + ':' + limit;
      setBest(old => {
        const next = {...old, [key]: Math.min(Number(old[key]) || Infinity, elapsed)};
        try { localStorage.setItem('montagem-best', JSON.stringify(next)); } catch {}
        return next;
      });
    }
  }
  useEffect(() => {
    if (screen !== 'game') return;
    const tick = () => {
      const left = remainingSeconds(deadline.current);
      setRemaining(left);
      if (left === 0) finish(true);
    };
    const timer = setInterval(tick, 100);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', tick); };
  }, [screen, recipe, limit]);

  function start(nextCustomer = false) {
    setRound(n => nextCustomer ? n + 1 : 1);
    if (!nextCustomer) setServed(0);
    setRecipe(choice === 'random' ? pickRecipe(recipe.id) : recipes.find(r => r.id === choice));
    setSelected([]); selection.current = [];
    setResult(null); setRemaining(limit);
    deadline.current = Date.now() + limit * 1000;
    active.current = true; setScreen('game');
  }
  function toggle(id) {
    if (!active.current) return;
    if (Date.now() >= deadline.current) { finish(true); return; }
    const next = selection.current.includes(id) ? selection.current.filter(x => x !== id) : [...selection.current, id];
    selection.current = next; setSelected(next);
  }
  function home() { active.current = false; setScreen('home'); }
  const bestTime = best[recipe.id + ':' + limit];
  const shiftFinished = mode > 1 && round === mode;

  return <div className={`app screen-${screen}`}>
    <header className="topbar">
      <a className="brand" href="#" onClick={e => { e.preventDefault(); home(); }} aria-label="Monta e Treina — início"><span className="brand-icon">M</span><span>MONTA<span className="brand-light"> & TREINA</span></span></a>
      <span className="offline"><i/> Treino offline</span>
      {screen === 'game' && <button className="exit-button" onClick={home} aria-label="Abandonar treino">✕</button>}
    </header>
    <main>
      {screen === 'home' && <>
        <div className="eyebrow">A TUA COZINHA DE TREINO</div>
        <h1 tabIndex="-1" ref={heading}>Abre a cozinha.<br/><span>Serve o desafio.</span></h1>
        <p className="intro">O pedido chegou! Escolhe os ingredientes na bancada, monta o sanduíche e serve antes do tempo acabar.</p>
        <div className="kitchen-preview" aria-hidden="true"><div className="preview-tiles"/><span className="preview-ticket">PEDIDO #001<br/><strong>Krunch Clássico</strong></span><Burger items={recipes[0].items} compact/><span className="preview-badge">Toca. Monta. Serve.</span></div>
        <section className="setup panel">
          <h2>Prepara o teu turno</h2>
          <label htmlFor="recipe">O que vamos montar?</label>
          <select id="recipe" value={choice} onChange={e => setChoice(e.target.value)}><option value="random">Surpreende-me · pedido aleatório</option>{recipes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select>
          <fieldset><legend>Tipo de treino</legend><div className="mode-options">{[[1,'Pedido único'],[5,'Turno · 5 pedidos']].map(([n,label]) => <button key={n} aria-pressed={mode === n} className={mode === n ? 'chosen' : ''} onClick={() => setMode(n)}>{label}</button>)}</div></fieldset>
          <fieldset><legend>Tempo por pedido</legend><div className="times">{[30,60,90].map(t => <button key={t} aria-pressed={limit === t} className={limit === t ? 'chosen' : ''} onClick={() => setLimit(t)}>{t}<small> segundos</small></button>)}</div></fieldset>
          <button className="primary" onClick={() => start()}>Começar treino <span>→</span></button>
          <p className="micro">Toca novamente num ingrediente para o retirar.</p>
        </section>
        <p className="notice">Treino independente de produtos KFC, sem afiliação à marca. Ingredientes baseados nas descrições fornecidas. A montagem é ilustrativa: não avalia quantidades nem ordem. O tempo é uma regra do jogo.</p>
      </>}
      {screen === 'game' && <div className="kitchen">
        <section className="order-board" aria-label="Pedido do cliente">
          <div className="customer" aria-hidden="true"><Customer number={round}/></div>
          <div className="ticket"><span className="ticket-caption">PEDIDO #{String(round).padStart(3,'0')} {mode > 1 && `· ${round}/${mode}`}</span><h1 tabIndex="-1" ref={heading}>{recipe.name}</h1><span className="ticket-note">1 sanduíche · pronto a montar</span></div>
          <div className={`timer ${remaining <= 10 ? 'urgent' : ''}`} role="timer" aria-label={`${remaining} segundos restantes`}>{remaining}<small>seg</small></div>
          <div className="patience" aria-hidden="true"><div style={{width:`${remaining / limit * 100}%`}}/></div>
        </section>
        <section className="assembly" aria-label="Zona de montagem">
          <div className="assembly-title"><span>ÁREA DE MONTAGEM</span><span>{selected.length} ingredientes</span></div>
          <Burger items={selected}/>
          {!selected.length && <p className="empty">A bandeja está vazia.<br/><small>Escolhe os ingredientes na bancada ↓</small></p>}
          {selected.length > 0 && <div className="selected-strip" aria-label="Ingredientes na montagem">{selected.map(id => <button key={id} onClick={() => toggle(id)} aria-label={`Retirar ${name(id)}`}>{name(id)} <span>×</span></button>)}</div>}
        </section>
        <section className="workstation" aria-label="Bancada de ingredientes">
          <div className="section-line"><h2>Bancada de ingredientes</h2><span>TOCA PARA ADICIONAR</span></div>
          <div className="ingredient-grid">{ingredients.map(i => <button className={`ingredient ${selected.includes(i.id) ? 'selected' : ''}`} key={i.id} onClick={() => toggle(i.id)} aria-label={i.name} aria-pressed={selected.includes(i.id)}><span className="ingredient-pan"><FoodArt id={i.id}/><span className="check">{selected.includes(i.id) ? '✓' : '+'}</span></span><strong>{i.name}</strong></button>)}</div>
        </section>
        <div className="serve-bar"><span className="serve-hint">{mode > 1 ? `${served} pedidos perfeitos neste turno` : 'O cliente está à espera!'}</span><button className="primary serve-button" onClick={() => finish(Date.now() >= deadline.current)}>Servir pedido <span>→</span></button></div>
      </div>}
      {screen === 'result' && result && <>
        <div className="result-icon" aria-hidden="true">{result.timeout ? '⏱️' : result.perfect ? '🏆' : '💪'}</div>
        <div className="eyebrow">{recipe.name} {mode > 1 && `· PEDIDO ${round}/${mode}`}</div>
        <h1 tabIndex="-1" ref={heading}>{result.timeout ? 'O tempo acabou!' : result.perfect ? 'Pedido perfeito!' : 'Vamos aperfeiçoar?'}</h1>
        <p className="intro">{result.timeout ? 'Revê a montagem e tenta novamente.' : result.perfect ? 'O cliente recebeu todos os ingredientes certos!' : 'Cada tentativa ajuda a memorizar a receita.'}</p>
        <div className="result-burger"><Burger items={selected} compact/></div>
        <div className="stats panel"><div><strong>{result.elapsed.toFixed(1)}<small>s</small></strong><span>Tempo gasto</span></div><div><strong>{result.correct.length}/{recipe.items.length}</strong><span>Ingredientes certos</span></div></div>
        {bestTime != null && <p className="record">★ Melhor tempo neste produto · {Number(bestTime).toFixed(1)}s · limite {limit}s</p>}
        {shiftFinished && <div className="shift-summary panel" role="status"><h2>Turno concluído!</h2><p><strong>{served} de {mode}</strong> pedidos perfeitos. {served === mode ? 'Uma cozinha de excelência!' : 'Continua a treinar para melhorar.'}</p></div>}
        <section className="panel review"><h2>Revisão do pedido</h2>{[{title:'Corretos',ids:result.correct,kind:'good'},{title:'Faltaram',ids:result.missing,kind:'bad'},{title:'A mais',ids:result.extra,kind:'bad'}].map(g => <div key={g.title}><h3 className={g.kind}>{g.title} <span>{g.ids.length}</span></h3><p>{g.ids.length ? g.ids.map(name).join(' · ') : 'Nenhum'}</p></div>)}<p className="micro">A ordem e as quantidades não são avaliadas.</p></section>
        <button className="primary" onClick={() => start(mode > 1 && !shiftFinished)}>{mode > 1 && !shiftFinished ? 'Próximo cliente' : 'Treinar novamente'} <span>→</span></button>
        <button className="text-button" onClick={home}>Voltar ao início</button>
      </>}
    </main>
    <footer>MONTA & TREINA <span>Um pedido de cada vez.</span></footer>
  </div>;
}
createRoot(document.getElementById('root')).render(<App/>);
