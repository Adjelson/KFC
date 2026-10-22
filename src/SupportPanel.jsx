import React, {useEffect, useRef, useState} from 'react';
import {ingredients, recipes} from './game.js';

export function SupportPanel({page, onPage, onClose, settings, onSettings, inGame, onPreview}) {
  const dialog = useRef(null), [recipeId,setRecipeId] = useState('krunch');
  useEffect(() => {
    const node = dialog.current, opener = document.activeElement;
    node.showModal();
    return () => { if (node.open) node.close(); if (opener?.isConnected) opener.focus(); };
  }, []);
  const recipe = recipes.find(r => r.id === recipeId);
  return <dialog className="support-dialog" ref={dialog} aria-label="Ajuda e definições" onCancel={e => { e.preventDefault(); onClose(); }}>
    <div className="support-header"><div><span className="eyebrow">MONTA & TREINA</span><h2>{page === 'help' ? 'Uma ajuda na cozinha' : 'À tua maneira'}</h2></div><button className="dialog-close" aria-label="Fechar painel" onClick={onClose}>×</button></div>
    {inGame && <p className="pause-notice"><span className="pause-dot"/> Treino em pausa. O tempo só continua ao fechar.</p>}
    <div className="support-tabs" role="tablist" aria-label="Opções do painel">{[['help','Ajuda'],['settings','Definições']].map(([id,title]) => <button role="tab" key={id} id={`tab-${id}`} aria-selected={page === id} tabIndex={page === id ? 0 : -1} aria-controls={`panel-${id}`} onClick={() => onPage(id)} onKeyDown={e => { if (['ArrowLeft','ArrowRight'].includes(e.key)) { e.preventDefault(); const next = id === 'help' ? 'settings' : 'help'; onPage(next); document.getElementById(`tab-${next}`)?.focus(); } }}>{title}</button>)}</div>
    {page === 'help' ? <div role="tabpanel" id="panel-help" aria-labelledby="tab-help" className="support-content">
      <ol className="help-steps"><li><strong>Lê o pedido do cliente</strong><span>O talão indica o sanduíche. A barra e o relógio mostram o tempo disponível.</span></li><li><strong>Toca para montar</strong><span>Os ingredientes voam da bancada para a bandeja. Toca novamente para retirar.</span></li><li><strong>Serve antes do tempo acabar</strong><span>Usa “Servir pedido”. Recebes estrelas e uma revisão dos ingredientes certos, esquecidos e a mais.</span></li><li><strong>Pratica um turno completo</strong><span>Escolhe “Turno · 5 pedidos” no início para atender cinco clientes.</span></li></ol>
      <section className="recipe-help"><h3>Consulta as receitas</h3><label htmlFor="help-recipe">Sanduíche</label><select id="help-recipe" value={recipeId} onChange={e => setRecipeId(e.target.value)}>{recipes.map(r => <option value={r.id} key={r.id}>{r.name}</option>)}</select><ul>{recipe.items.map(id => <li key={id}>{ingredients.find(i => i.id === id).name}</li>)}</ul></section>
      <p className="micro">A montagem é ilustrativa. Avaliamos a escolha dos ingredientes, sem exigir quantidades ou uma ordem oficial. Ao sair da aplicação, o relógio continua. Abrir este painel pausa o treino.</p>
    </div> : <div role="tabpanel" id="panel-settings" aria-labelledby="tab-settings" className="support-content">
      <h3 className="settings-section">Áudio</h3>
      {[['enabled','Som da aplicação','Ativa ou silencia todos os sons.'],['effects','Efeitos sonoros','Ingredientes, pedidos, acertos e aviso de tempo.'],['music','Música de fundo','Uma melodia suave para acompanhar o treino.']].map(([key,title,description]) => <label className={`setting-row ${key !== 'enabled' && !settings.enabled ? 'setting-disabled' : ''}`} key={key}><span><strong>{title}</strong><small>{description}</small></span><input type="checkbox" role="switch" aria-label={title} checked={settings[key]} disabled={key !== 'enabled' && !settings.enabled} onChange={e => onSettings({...settings,[key]:e.target.checked})}/></label>)}
      <label className="volume-label" htmlFor="volume">Volume <output>{settings.volume}%</output></label><input id="volume" aria-label="Volume" className="volume-slider" type="range" min="0" max="100" step="5" value={settings.volume} disabled={!settings.enabled} onChange={e => onSettings({...settings,volume:Number(e.target.value)})}/>
      <button className="secondary-button" onClick={onPreview} disabled={!settings.enabled || !settings.effects || settings.volume === 0}>Testar som</button>
      <h3 className="settings-section">Movimento</h3><label className="setting-row"><span><strong>Animações</strong><small>Voo dos ingredientes, montagem, entrega e celebração.</small></span><input type="checkbox" role="switch" aria-label="Animações" checked={settings.animations} onChange={e => onSettings({...settings,animations:e.target.checked})}/></label>
      <p className="micro">As preferências ficam guardadas neste dispositivo. Todos os sons funcionam offline. A música começa depois de tocares num botão e para quando a aplicação fica em segundo plano.</p>
    </div>}
    <div className="support-footer"><button className="primary" aria-label={inGame ? 'Voltar ao treino' : 'Fechar'} onClick={onClose}>{inGame ? 'Voltar ao treino' : 'Fechar'} <span>→</span></button></div>
  </dialog>;
}
