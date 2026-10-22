import test from 'node:test';
import assert from 'node:assert/strict';
import {recipes,ingredients,evaluate,remainingSeconds,pickRecipe} from '../src/game.js';
test('all four recipes have valid unique ingredients and accept any order',()=>{
 assert.equal(recipes.length,4);
 for(const r of recipes){assert.equal(new Set(r.items).size,r.items.length);assert.ok(r.items.every(id=>ingredients.some(i=>i.id===id)));assert.equal(evaluate(r,[...r.items].reverse()).perfect,true)}
});
test('missing and extra ingredients are reported separately',()=>{
 const result=evaluate(recipes[0],['seeds','fillet','bacon']);
 assert.deepEqual(result.missing,['lettuce','mayo']);assert.deepEqual(result.extra,['bacon']);assert.equal(result.perfect,false);
});
test('empty tray cannot pass',()=>{for(const r of recipes)assert.equal(evaluate(r,[]).perfect,false)});
test('deadline uses wall time and stops at zero',()=>{assert.equal(remainingSeconds(61000,1000),60);assert.equal(remainingSeconds(61000,60999),1);assert.equal(remainingSeconds(61000,70000),0)});
test('random challenge excludes previous recipe',()=>{for(const r of recipes){assert.notEqual(pickRecipe(r.id,()=>0).id,r.id);assert.notEqual(pickRecipe(r.id,()=>.999).id,r.id)}});
