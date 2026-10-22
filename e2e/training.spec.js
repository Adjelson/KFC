import {test,expect} from '@playwright/test';
test('complete a correct recipe offline and retain personal best',async({page,context})=>{
 await page.goto('/');await page.locator('select').selectOption('krunch');
 await context.setOffline(true);
 await page.getByRole('button',{name:'Começar treino'}).click();
 for(const n of ['Pão com sementes','Filete de frango','Alface','Maionese'])await page.getByRole('button',{name:new RegExp(n)}).click();
 await page.getByRole('button',{name:'Servir pedido'}).click();
 await expect(page.getByRole('heading',{name:'Pedido perfeito!'})).toBeVisible();
 await expect(page.getByText('4/4',{exact:true})).toBeVisible();
 await expect(page.getByText(/Melhor tempo neste produto/)).toBeVisible();
 expect(await page.evaluate(()=>Object.keys(JSON.parse(localStorage.getItem('montagem-best'))))).toContain('krunch:60');
});
test('identify missing and extra ingredients and allow removal',async({page})=>{
 await page.goto('/');await page.locator('select').selectOption('bbq');await page.getByRole('button',{name:'Começar treino'}).click();
 await page.getByRole('button',{name:/Tomate/}).click();await page.getByRole('button',{name:'Retirar Tomate'}).click();
 await expect(page.getByText('A bandeja está vazia.',{exact:false})).toBeVisible();
 await page.getByRole('button',{name:/Bacon/}).click();await page.getByRole('button',{name:'Servir pedido'}).click();
 await expect(page.getByRole('heading',{name:'Vamos aperfeiçoar?'})).toBeVisible();
 await expect(page.getByText('Pão mini de sésamo · Tender de frango · Queijo · Molho BBQ',{exact:true})).toBeVisible();
 await expect(page.getByText('Bacon',{exact:true})).toBeVisible();
});
test('timeout closes the round and small screen has no overflow',async({page})=>{
 await page.clock.install();await page.goto('/');await page.getByRole('button',{name:'30 segundos'}).click();await page.getByRole('button',{name:'Começar treino'}).click();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'artifacts/treino-telemovel.png',fullPage:true});
 await page.clock.fastForward(31000);await expect(page.getByRole('heading',{name:'O tempo acabou!'})).toBeVisible();
 await page.getByRole('button',{name:'Treinar novamente'}).click();await expect(page.getByRole('timer')).toHaveText('30seg');
});

test('sandwich layers respond to ingredients and every recipe can be served',async({page})=>{
 const recipes={krunch:['Pão com sementes','Filete de frango','Alface','Maionese'],bbq:['Pão mini de sésamo','Tender de frango','Queijo','Molho BBQ'],cheddar:['Pão brioche','Filete de frango','Queijo','Bacon','Molho cheddar','Maionese'],classic:['Pão com sementes','Filete de frango','Tomate','Alface','Maionese']};
 await page.goto('/');
 for(const [id,items] of Object.entries(recipes)){
  await page.locator('select').selectOption(id);await page.getByRole('button',{name:'Começar treino'}).click();
  for(const ingredient of items)await page.getByRole('button',{name:ingredient,exact:true}).click();
  await expect(page.getByRole('img',{name:`Sanduíche com ${items.length} ingredientes`})).toBeVisible();
  await expect(page.locator('.burger-layer')).toHaveCount(items.length+1);
  await page.getByRole('button',{name:'Servir pedido'}).click();
  await expect(page.getByRole('heading',{name:'Pedido perfeito!'})).toBeVisible();
  await page.getByRole('button',{name:'Voltar ao início'}).click();
 }
});

test('five customer shift counts only correct orders and resets the next shift',async({page})=>{
 await page.goto('/');await page.locator('select').selectOption('bbq');
 await page.getByRole('button',{name:'Turno · 5 pedidos'}).click();
 await page.getByRole('button',{name:'Começar treino'}).click();
 for(let round=1;round<=5;round++){
  await expect(page.getByText(`PEDIDO #00${round} · ${round}/5`)).toBeVisible();
  if(round!==3&&round!==5)for(const ingredient of ['Pão mini de sésamo','Tender de frango','Queijo','Molho BBQ'])await page.getByRole('button',{name:ingredient,exact:true}).click();
  await page.getByRole('button',{name:'Servir pedido'}).click();
  if(round<5)await page.getByRole('button',{name:'Próximo cliente'}).click();
 }
 await expect(page.getByRole('heading',{name:'Turno concluído!'})).toBeVisible();
 await expect(page.getByRole('status')).toContainText('3 de 5');
 await page.getByRole('button',{name:'Treinar novamente'}).click();
 await expect(page.getByText('PEDIDO #001 · 1/5')).toBeVisible();
 await expect(page.getByText('0 pedidos perfeitos neste turno')).toBeVisible();
});

test('kitchen fits a mobile screen with all ingredients and serving action available',async({page})=>{
 for(const viewport of [{width:390,height:844},{width:360,height:740}]){
  await page.setViewportSize(viewport);await page.goto('/');await page.locator('select').selectOption('cheddar');
  await page.getByRole('button',{name:'Começar treino'}).click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1)).toBe(true);
  for(const button of await page.locator('.ingredient').all())await expect(button).toBeInViewport();
  await expect(page.getByRole('button',{name:'Servir pedido'})).toBeInViewport();
 }
 await page.getByRole('button',{name:'Pão brioche',exact:true}).click();
 await page.getByRole('button',{name:'Filete de frango',exact:true}).click();
 await page.getByRole('button',{name:'Queijo',exact:true}).click();
 await page.screenshot({path:'artifacts/cozinha-telemovel.png',fullPage:true});
});

test('compact kitchen leaves space for Android system bars',async({page})=>{
 await page.setViewportSize({width:360,height:740});await page.goto('/');
 await page.getByRole('button',{name:'Começar treino'}).click();
 await page.addStyleTag({content:'.screen-game{padding-top:24px;padding-bottom:24px}'});
 expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1)).toBe(true);
 await expect(page.getByRole('button',{name:'Servir pedido'})).toBeInViewport();
});
