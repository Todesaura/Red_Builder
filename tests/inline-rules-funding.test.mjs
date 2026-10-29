import test from 'node:test';
import assert from 'node:assert/strict';
import {completeCharacter,rules} from './helpers/pdf-fixture.mjs';
import {fundingSplit,fundingPrice} from '../js/ui-funding.js';
import {renderRoleAbilities} from '../js/ui-role-abilities.js';
import {renderSkills} from '../js/ui-skills.js';
import {renderClothing} from '../js/ui-clothing.js';
import {evaluateCharacter} from '../js/rules.js';
import {buyEquipment,evaluateFunds} from '../js/economy.js';

test('Preisanzeige trennt normales Geld, Fashion-Zuschuss und gemischte Käufe korrekt',()=>{
  const funds={fashionRemaining:80};
  assert.deepEqual(fundingSplit([{cost:100}],funds),{cash:100,fashion:0});
  assert.deepEqual(fundingSplit([{cost:50,funding:'fashion'}],funds),{cash:0,fashion:50});
  assert.deepEqual(fundingSplit([{cost:100,funding:'fashion'}],funds),{cash:20,fashion:80});
  assert.deepEqual(fundingSplit([{cost:100,funding:'fashion'},{cost:200}],funds),{cash:220,fashion:80});
  assert.deepEqual(fundingSplit([{cost:100,funding:'fashion'}],{fashionRemaining:0}),{cash:100,fashion:0});
  assert.deepEqual(fundingSplit([{cost:100,funding:'fashion'}],{...funds,campaign:true}),{cash:100,fashion:0});
  const html=fundingPrice([{cost:100,funding:'fashion'}],funds);assert.match(html,/money-fashion[^>]*>80 eb Fashion/);assert.match(html,/money-cash[^>]*>20 eb Geld/);
});
test('Angezeigte Anteile entsprechen der tatsächlichen Abbuchung bei Kleidung',()=>{
  const c=completeCharacter(),item=rules.equipmentRules.items.find(i=>i.category==='clothing'&&i.cost===200);
  for(const part of rules.equipmentRules.items.filter(i=>i.category==='clothing'&&i.cost===100).slice(0,7))assert.ok(buyEquipment(c,rules,part.id).ok);
  const before=evaluateFunds(c,rules),split=fundingSplit([item],before);
  assert.deepEqual(split,{fashion:100,cash:100});
  const html=renderClothing(c,rules,evaluateCharacter(c,rules));assert.ok(html.includes(fundingPrice([item],before)));
  assert.ok(buyEquipment(c,rules,item.id).ok);
  const after=evaluateFunds(c,rules);assert.equal(before.remaining-after.remaining,split.cash);assert.equal(before.fashionRemaining-after.fashionRemaining,split.fashion);
});
test('Jeder verteilbare Rollenbereich erklärt seine Regeln unmittelbar in seiner Punktezeile',()=>{
  for(const role of ['solo','tech','medtech']){
    const c=completeCharacter(role),before=structuredClone(c),v=evaluateCharacter(c,rules),html=renderRoleAbilities(c,rules,v);
    assert.doesNotMatch(html,/role-ability-explanations|role-current-examples|role-related-skills|role-feature-grid/);
    for(const [id] of v.roleAbilities.pool.fields){
      const row=html.slice(0,html.indexOf(`id="role-point-help-${id}"`)).lastIndexOf('class="role-point-row"');
      assert.ok(row>=0,id);assert.match(html,new RegExp(`<details id="role-point-help-${id}" class="role-point-help">`));
    }
    if(role==='medtech')assert.match(html,/2 Ränge Chirurgie/);
    assert.doesNotMatch(html,/undefined|NaN/);assert.deepEqual(c,before);
  }
});
test('Fertigkeitsübersicht behält konkrete Werte ohne redundante Würfelüberschrift',()=>{
  const c=completeCharacter(),v=evaluateCharacter(c,rules),html=renderSkills(c,rules,v,{skillSearch:'',skillCategory:'all',customSkillFields:[]});
  assert.doesNotMatch(html,/Startwert für den Wurf|skill-category-caption/);
  assert.match(html,/skill-category-value/);assert.match(html,/skill-base/);
});
