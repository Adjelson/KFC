import {test,expect} from '@playwright/test';

test('help pauses the active timer, shows recipes, and resumes on Escape',async({page})=>{
 await page.clock.install();await page.goto('/');await page.getByRole('button',{name:'Começar treino'}).click();
 await page.clock.fastForward(5000);await page.getByRole('button',{name:'Abrir ajuda'}).click();
 const dialog=page.getByRole('dialog');await expect(dialog).toContainText('Treino em pausa');
 const left=await page.getByRole('timer').textContent();
 await page.clock.fastForward(120000);await expect(page.getByRole('timer')).toHaveText(left);
 await page.locator('#help-recipe').selectOption('cheddar');
 await expect(dialog.getByRole('list').last()).toContainText('Molho cheddar');
 await page.getByRole('tab',{name:'Definições',exact:true}).click();
 await expect(page.getByRole('switch',{name:'Som da aplicação',exact:true})).toBeChecked();
 await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();
 await page.clock.fastForward(3000);
 expect(Number((await page.getByRole('timer').textContent()).replace('seg',''))).toBe(Number(left.replace('seg',''))-3);
 await expect(page.getByRole('button',{name:'Abrir ajuda'})).toBeFocused();
});

test('sound, volume, music and animation preferences persist across reload',async({page})=>{
 await page.goto('/');await page.getByRole('navigation',{name:'Menu principal'}).getByRole('button',{name:'Definições'}).click();
 await page.getByRole('switch',{name:'Música de fundo'}).check();
 await page.getByRole('slider',{name:'Volume',exact:true}).fill('35');
 await page.getByRole('switch',{name:'Animações',exact:true}).uncheck();
 await page.getByRole('switch',{name:'Som da aplicação',exact:true}).uncheck();
 await expect(page.getByRole('button',{name:'Testar som'})).toBeDisabled();
 await page.reload();await page.getByRole('button',{name:'Abrir definições'}).click();
 await expect(page.getByRole('switch',{name:'Som da aplicação',exact:true})).not.toBeChecked();
 await expect(page.getByRole('switch',{name:'Música de fundo'})).toBeChecked();
 await expect(page.getByRole('slider',{name:'Volume',exact:true})).toHaveValue('35');
 await expect(page.getByRole('switch',{name:'Animações',exact:true})).not.toBeChecked();
 await page.getByRole('button',{name:'Fechar',exact:true}).click();
 await page.getByRole('button',{name:'Começar treino'}).click();
 await page.getByRole('button',{name:'Alface',exact:true}).click();
 await expect(page.locator('.ingredient-flight')).toHaveCount(0);
 await expect(page.locator('.app')).toHaveClass(/motion-off/);
});

test('ingredient flight, landing and serving animate without double submission',async({page})=>{
 await page.clock.install();await page.goto('/');await page.locator('select').selectOption('krunch');
 await page.getByRole('button',{name:'Começar treino'}).click();
 await page.getByRole('button',{name:'Pão com sementes',exact:true}).click();
 await expect(page.locator('.ingredient-flight')).toHaveCount(1);
 await expect(page.locator('.fresh-layer')).toHaveCount(1);
 await expect(page.locator('.ingredient-feedback')).toHaveText('+ Pão com sementes');
 await page.clock.fastForward(600);await expect(page.locator('.ingredient-flight')).toHaveCount(0);
 for(const name of ['Filete de frango','Alface','Maionese'])await page.getByRole('button',{name,exact:true}).click();
 await page.getByRole('button',{name:'Servir pedido'}).click();
 await expect(page.getByRole('button',{name:'A servir…'})).toBeDisabled();
 await expect(page.locator('.kitchen')).toHaveClass(/is-serving/);
 await expect(page.getByRole('button',{name:'Alface',exact:true})).toBeDisabled();
 await page.clock.fastForward(600);
 await expect(page.getByRole('heading',{name:'Pedido perfeito!'})).toBeVisible();
 await expect(page.getByLabel('3 de 3 estrelas')).toBeVisible();
 await expect(page.locator('.confetti i')).toHaveCount(14);
});

test('sounds render offline and ingredient families have different audio output',async({page,context})=>{
 await page.goto('/');await context.setOffline(true);
 const sounds=await page.evaluate(async()=>{
  const {SoundEngine}=await import('/src/audio.js');
  const result=[];
  for(const id of ['seeds','fillet','lettuce','mayo']){
   const engine=new SoundEngine();engine.context=new OfflineAudioContext(1,22050,44100);engine.master=engine.context.createGain();engine.master.gain.value=.3;engine.master.connect(engine.context.destination);engine.unlock=()=>{};
   engine.ingredient(id);const buffer=await engine.context.startRendering();const data=buffer.getChannelData(0);
   result.push({id,energy:data.reduce((sum,n)=>sum+n*n,0),peak:Math.max(...data)});
  }
  return result;
 });
 expect(sounds.every(s=>s.energy>.01&&s.peak>.005)).toBe(true);
 expect(new Set(sounds.map(s=>s.energy.toFixed(3))).size).toBe(4);
});

test('master mute blocks playback and music stops when disabled or backgrounded',async({page})=>{
 await page.addInitScript(()=>{
  window.audioStarts=0;const create=AudioContext.prototype.createOscillator;
  AudioContext.prototype.createOscillator=function(){const node=create.call(this),start=node.start.bind(node);node.start=(...args)=>{window.audioStarts++;return start(...args)};return node};
 });
 await page.goto('/');await page.getByRole('button',{name:'Silenciar som'}).click();
 const muted=await page.evaluate(()=>window.audioStarts);
 await page.getByRole('button',{name:'Começar treino'}).click();await page.getByRole('button',{name:'Filete de frango',exact:true}).click();
 expect(await page.evaluate(()=>window.audioStarts)).toBe(muted);
 await page.getByRole('button',{name:'Ativar som'}).click();
 await page.getByRole('button',{name:'Alface',exact:true}).click();
 expect(await page.evaluate(()=>window.audioStarts)).toBeGreaterThan(muted);
 await page.getByRole('button',{name:'Abrir definições'}).click();
 await page.getByRole('switch',{name:'Música de fundo'}).check();
 const initial=await page.evaluate(()=>window.audioStarts);
 await expect.poll(()=>page.evaluate(()=>window.audioStarts)).toBeGreaterThan(initial);
 await page.getByRole('switch',{name:'Música de fundo'}).uncheck();
 const stopped=await page.evaluate(()=>window.audioStarts);
 await page.waitForTimeout(400);expect(await page.evaluate(()=>window.audioStarts)).toBe(stopped);
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'))});
 await expect.poll(()=>page.evaluate(async()=>(await import('/src/audio.js')).sound.context.state)).toBe('suspended');
});
