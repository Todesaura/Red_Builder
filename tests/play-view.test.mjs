import test from 'node:test';
import assert from 'node:assert/strict';
import {rules,completeCharacter} from './helpers/pdf-fixture.mjs';
import {canOpenPlay,renderPlay} from '../js/ui-play.js';
import {createCharacter} from '../js/model.js';
import {buyEquipment} from '../js/economy.js';
import {characterSheetData} from '../js/pdf-character-data.js';

test('Spielansicht ist nur für vollständig erstellte Charaktere ohne offene Entwürfe verfügbar',()=>{
  assert.equal(canOpenPlay(createCharacter(rules),rules),false);
  const c=completeCharacter();assert.equal(canOpenPlay(c,rules),true);
  assert.equal(canOpenPlay(c,rules,{cyberDraft:[{}]}),false);
  assert.equal(canOpenPlay(c,rules,{customEquipmentDraft:{name:'Offen'}}),false);
  c.skills.nativeLanguage.name='';assert.equal(canOpenPlay(c,rules),false);
  assert.doesNotMatch(renderPlay(c,rules),/play-metrics|end-session/);
});

test('Alle zehn Rollen erhalten eigene Regeln und aktuelle Werte ohne Mutation',()=>{
  for(const role of rules.roles){
    const c=completeCharacter(role.id),before=structuredClone(c),d=characterSheetData(c,rules),html=renderPlay(c,rules);
    assert.match(html,/Beim Spielen/);assert.ok(html.includes(d.ability));
    assert.ok(html.includes(`${d.derived.initiative} + 1W10`));
    assert.match(html,/separat notieren/);assert.match(html,/data-action="end-session"[^>]*>Session beenden/);assert.deepEqual(c,before);
  }
});

test('Gekaufte Waffen zeigen konkrete Würfe, Feueroptionen und getrennten Munitionsvorrat',()=>{
  const c=completeCharacter();assert.ok(buyEquipment(c,rules,'assault-rifle').ok);
  const d=characterSheetData(c,rules),weapon=d.attackOptions[0];
  const html=renderPlay(c,rules);
  for(const option of weapon.options){assert.ok(html.includes(option.name));if(Number.isFinite(option.base))assert.ok(html.includes(`${option.base} + 1W10`));}
  assert.ok(html.includes(weapon.item.name));assert.match(html,/Magazin: 25/);
});
