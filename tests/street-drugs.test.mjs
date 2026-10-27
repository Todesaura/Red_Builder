import test from 'node:test';
import assert from 'node:assert/strict';
import {rules,completeCharacter} from './helpers/pdf-fixture.mjs';
import {buyEquipment,removeEquipment,useStreetDrug,evaluateFunds} from '../js/economy.js';
import {evaluateCharacter} from '../js/rules.js';
import {validateCharacter} from '../js/model.js';
import {renderStreetDrugs} from '../js/ui-street-drugs.js';
import {characterSheetData} from '../js/pdf-character-data.js';
const drugs=rules.equipmentRules.items.filter(d=>d.kind==='drug');
test('Alle 18 Drogen haben eindeutige IDs, bestätigte Preise und deutsche Regeldetails',()=>{
 const expected={'Black Lace':50,'Blue Glass':20,Boost:50,Smash:10,SynthCoke:20,Berserker:100,'Prime Time':50,Sixgun:100,Timewarp:100,'Piranha Smash':10,'Emerald City':100,'Red Lace':110,'White Lace':20,Rime:60,Terrifier:40,Mortalis:250,Mindfire:50,Deliriant:50};
 assert.equal(drugs.length,18);assert.equal(new Set(drugs.map(d=>d.id)).size,18);
 for(const d of drugs){assert.equal(d.cost,expected[d.name]);assert.equal(d.category,'drugs');assert.equal(d.weight,null);for(const key of ['primary','secondary','addiction','source','url'])assert.ok(d.drug[key]);assert.ok(d.drug.duration>0&&d.drug.dv>0);}
});
test('Alle 18 Drogen lassen sich kaufen und ohne doppelte Einträge speichern',()=>{
 const c=completeCharacter();c.campaign.cashAdjustment=10000;
 for(const d of drugs){assert.ok(buyEquipment(c,rules,d.id).ok);assert.ok(buyEquipment(c,rules,d.id).ok);}
 assert.equal(c.equipment.items.length,18);assert.ok(c.equipment.items.every(i=>i.quantity===2));
 assert.deepEqual(validateCharacter(JSON.parse(JSON.stringify(c)),rules).equipment,c.equipment);
 assert.equal(characterSheetData(c,rules).equipment.filter(i=>i.definition.kind==='drug').length,18);
});
test('Verwendung an eigenem Charakter oder Gegner zieht eine Dosis ohne Rückerstattung/Statänderung ab',()=>{
 for(const active of [false,true]){const c=completeCharacter();c.campaign.active=active;const d=drugs[0];buyEquipment(c,rules,d.id);buyEquipment(c,rules,d.id);
  const before=evaluateCharacter(c,rules),money=evaluateFunds(c,rules).remaining;
  assert.ok(useStreetDrug(c,rules,d.id).ok);assert.equal(c.equipment.items[0].quantity,1);assert.equal(evaluateFunds(c,rules).remaining,money);
  const after=evaluateCharacter(c,rules);for(const key of ['attributes','skills','derived','health'])assert.deepEqual(after[key],before[key]);
  assert.ok(useStreetDrug(c,rules,d.id).ok);assert.equal(c.equipment.items.length,0);assert.equal(evaluateFunds(c,rules).remaining,money);
  const snapshot=structuredClone(c);assert.equal(useStreetDrug(c,rules,d.id).ok,false);assert.deepEqual(c,snapshot);assert.doesNotThrow(()=>validateCharacter(c,rules));
 }
});
test('Kaufkorrektur erstattet nur unbenutzte Dosen, andere Ausrüstung bleibt geschützt',()=>{
 const c=completeCharacter(),d=drugs[0];buyEquipment(c,rules,d.id);buyEquipment(c,rules,d.id);useStreetDrug(c,rules,d.id);removeEquipment(c,d.id);assert.equal(evaluateFunds(c,rules).remaining,2550-d.cost);
 buyEquipment(c,rules,'agent');const before=structuredClone(c);assert.equal(useStreetDrug(c,rules,'agent').ok,false);assert.deepEqual(c,before);
});
test('Eigenes Kaufmenü: alphabetisch, aufklappbare Regeln, Preis-/Quellen-/Wirkungsfilter',()=>{
 const c=completeCharacter(),v=evaluateCharacter(c,rules),html=renderStreetDrugs(c,rules,v);
 assert.equal((html.match(/data-drug-card=/g)??[]).length,18);assert.equal((html.match(/data-buy-equipment="drug-/g)??[]).length,18);
 assert.equal(rules.equipmentRules.items.find(i=>i.id==='airhypo').cost,50);assert.ok(html.includes('data-buy-equipment="airhypo"'));
 assert.ok(html.indexOf('data-drug-card="drug-berserker"')<html.indexOf('data-drug-card="drug-black-lace"'));
 assert.equal((renderStreetDrugs(c,rules,v,{drugFilters:{price:'10'}}).match(/data-drug-card=/g)??[]).length,2);
 assert.equal((renderStreetDrugs(c,rules,v,{drugFilters:{type:'NET'}}).match(/data-drug-card=/g)??[]).length,1);
 assert.equal((renderStreetDrugs(c,rules,v,{drugFilters:{source:drugs.find(d=>d.name==='Emerald City').drug.source}}).match(/data-drug-card=/g)??[]).length,1);
 assert.ok(html.includes('Gegnern verabreichen'));assert.ok(html.includes('Airhypo'));assert.ok(!html.includes('Spielzeit vorspulen'));
});
