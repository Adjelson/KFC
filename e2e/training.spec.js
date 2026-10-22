import {test,expect} from '@playwright/test';
test('complete a correct recipe offline and retain personal best',async({page,context})=>{
 await page.goto('/');await page.locator('select').selectOption('krunch');
 await context.setOffline(true);
 await page.getByRole('button',{name:'Começar treino'}).click();
 for(const n of ['Pão com sementes','Filete de frango','Alface','Maionese'])await page.getByRole('button',{name:new RegExp(n)}).click();
 await page.getByRole('button',{name:'Concluir pedido'}).click();
 await expect(page.getByRole('heading',{name:'Pedido perfeito!'})).toBeVisible();
 await expect(page.getByText('4/4',{exact:true})).toBeVisible();
 await expect(page.getByText(/Melhor tempo neste produto/)).toBeVisible();
 expect(await page.evaluate(()=>Object.keys(JSON.parse(localStorage.getItem('montagem-best'))))).toContain('krunch:60');
});
test('identify missing and extra ingredients and allow removal',async({page})=>{
 await page.goto('/');await page.locator('select').selectOption('bbq');await page.getByRole('button',{name:'Começar treino'}).click();
 await page.getByRole('button',{name:/Tomate/}).click();await page.getByRole('button',{name:'Retirar Tomate'}).click();
 await expect(page.getByText('A bandeja está vazia.',{exact:false})).toBeVisible();
 await page.getByRole('button',{name:/Bacon/}).click();await page.getByRole('button',{name:'Concluir pedido'}).click();
 await expect(page.getByRole('heading',{name:'Vamos aperfeiçoar?'})).toBeVisible();
 await expect(page.getByText('Pão mini de sésamo · Tender de frango · Queijo · Molho BBQ',{exact:true})).toBeVisible();
 await expect(page.getByText('Bacon',{exact:true})).toBeVisible();
});
test('timeout closes the round and small screen has no overflow',async({page})=>{
 await page.clock.install();await page.goto('/');await page.getByRole('button',{name:'30 segundos'}).click();await page.getByRole('button',{name:'Começar treino'}).click();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'artifacts/treino-telemovel.png',fullPage:true});
 await page.clock.fastForward(31000);await expect(page.getByRole('heading',{name:'O tempo acabou!'})).toBeVisible();
 await page.getByRole('button',{name:'Treinar novamente'}).click();await expect(page.getByRole('timer')).toHaveText('◷ 30s');
});
