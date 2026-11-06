import test from 'node:test';
import assert from 'node:assert/strict';
import {rules,completeCharacter} from './helpers/pdf-fixture.mjs';
import {applyPlayAction,ammunitionRemaining} from '../js/play-tracking.js';
import {evaluateCharacter} from '../js/rules.js';
import {buyEquipment,evaluateFunds} from '../js/economy.js';
import {equipArmor} from '../js/armor.js';
import {characterJson,parseCharacterJson} from '../js/character-files.js';
import {quickAddCyberware} from '../js/cyberware-quick-add.js';
import {commitCyberwareDraft} from '../js/cyberware-draft.js';

test('TP-Schaden bleibt nach JSON-Rundlauf erhalten; ungültige Vorgänge verändern nichts',()=>{
  const c=completeCharacter(),before=structuredClone(c),hp=evaluateCharacter(c,rules).health.current;
  const result=applyPlayAction(c,rules,{type:'damage',amount:12});assert.ok(result.ok);
  assert.equal(evaluateCharacter(result.character,rules).health.current,hp-12);
  assert.equal(parseCharacterJson(characterJson(result.character,rules),rules).campaign.hp,hp-12);
  for(const amount of [0,-1,1.5,NaN,10001])assert.equal(applyPlayAction(c,rules,{type:'damage',amount}).ok,false);
  assert.deepEqual(c,before);
});
test('Kopf- und Körperrüstung verlieren getrennt 1 oder 2 SP und niemals mehr als vorhanden',()=>{
  let c=completeCharacter();for(const slot of ['head','body']){buyEquipment(c,rules,'armor-kevlar-'+slot);equipArmor(c,rules,slot,'armor-kevlar-'+slot);}
  c=applyPlayAction(c,rules,{type:'armor',slot:'head',amount:2}).character;
  assert.equal(evaluateCharacter(c,rules).armor.headSP,5);assert.equal(evaluateCharacter(c,rules).armor.bodySP,7);
  for(let i=0;i<5;i++)c=applyPlayAction(c,rules,{type:'armor',slot:'head',amount:2}).character;
  assert.equal(evaluateCharacter(c,rules).armor.headSP,0);
});
test('Implantierter Schutz hat getrennte Verluste, übersteht JSON und wird mit getragener Rüstung verglichen',()=>{
  let c=completeCharacter();const offer=quickAddCyberware(c,rules,[],'subdermal-armor');assert.ok(commitCyberwareDraft(c,rules,offer.additions).ok);
  c=applyPlayAction(c,rules,{type:'armor',slot:'head',implant:true,amount:2}).character;
  c=parseCharacterJson(characterJson(c,rules),rules);
  assert.equal(evaluateCharacter(c,rules).armor.headSP,9);assert.equal(evaluateCharacter(c,rules).armor.bodySP,11);
  const old=structuredClone(c);delete old.campaign.cyberArmorLoss;
  assert.deepEqual(parseCharacterJson(JSON.stringify(old),rules).campaign.cyberArmorLoss,{head:0,body:0});
});
test('Einzelne Schüsse reduzieren angebrochene Packungen ohne Geldrückerstattung, auch bei leerem Vorrat',()=>{
  for(const active of [false,true]){
    let c=completeCharacter();buyEquipment(c,rules,'ammo-rifle');c.campaign.active=active;
    const item=rules.equipmentRules.items.find(i=>i.id==='ammo-rifle'),total=item.units,money=evaluateFunds(c,rules).remaining;
    c=applyPlayAction(c,rules,{type:'ammo',id:item.id,amount:1}).character;
    assert.equal(ammunitionRemaining(c,item),total-1);
    assert.equal(applyPlayAction(c,rules,{type:'ammo',id:item.id,amount:total}).ok,false);
    c=applyPlayAction(c,rules,{type:'ammo',id:item.id,amount:total-1}).character;
    assert.equal(ammunitionRemaining(c,item),0);assert.equal(evaluateFunds(c,rules).remaining,money);
    assert.deepEqual(parseCharacterJson(characterJson(c,rules),rules),c);
  }
});
