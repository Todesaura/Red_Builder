import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createCharacter, validateCharacter, migrateCharacter } from '../js/model.js';
import { buyEquipment, removeEquipment, evaluateFunds } from '../js/economy.js';
import { equipArmor } from '../js/armor.js';
import { evaluateCharacter } from '../js/rules.js';
import { renderEquipment } from '../js/ui-equipment.js';
const json=async name=>JSON.parse(await readFile(new URL(`../data/${name}.json`,import.meta.url),'utf8'));
const rules=await json('rules');rules.skillRules=await json('skills');rules.cyberwareRules=await json('cyberware');rules.equipmentRules=await json('equipment');
function fresh(){const c=createCharacter(rules);c.name='Test';c.role='solo';return c;}
const buy=(c,id)=>assert.ok(buyEquipment(c,rules,id).ok);
const wear=(c,slot,id)=>assert.ok(equipArmor(c,rules,slot,id).ok);
test('Kopf und Körper kosten separat; Besitz allein verändert keine Attribute',()=>{
 const c=fresh(),base=evaluateCharacter(c,rules);buy(c,'armor-medium-jack-head');buy(c,'armor-medium-jack-body');
 assert.equal(evaluateFunds(c,rules).remaining,2350);assert.equal(evaluateCharacter(c,rules).armor.penalty,0);
 assert.deepEqual(evaluateCharacter(c,rules).attributes,base.attributes);
 wear(c,'head','armor-medium-jack-head');assert.equal(evaluateCharacter(c,rules).armor.head.sp,12);assert.equal(evaluateCharacter(c,rules).armor.body,null);
});
test('Stärkster Abzug zählt einmal und wirkt auf Initiative und Fertigkeiten, nicht auf Basiswerte',()=>{
 const c=fresh();const before=evaluateCharacter(c,rules);buy(c,'armor-medium-jack-head');buy(c,'armor-flak-body');wear(c,'head','armor-medium-jack-head');wear(c,'body','armor-flak-body');
 const after=evaluateCharacter(c,rules);assert.equal(after.armor.penalty,4);
 for(const id of ['REF','DEX','MOVE']){assert.equal(after.attributes[id].base,before.attributes[id].base);assert.equal(after.attributes[id].effective,Math.max(0,before.attributes[id].effective-4));}
 assert.equal(after.derived.find(i=>i.id==='initiative').value,after.attributes.REF.effective);
 assert.equal(after.skills.find(i=>i.id==='handgun').base,Math.max(0,before.attributes.REF.effective-4)+c.skills.ranks.handgun);
 wear(c,'body',null);assert.equal(evaluateCharacter(c,rules).armor.penalty,2);
});
test('Schwere Rüstung kann Werte auf 0 senken, aber nicht darunter',()=>{
 const c=fresh();c.method='points';buy(c,'armor-flak-body');wear(c,'body','armor-flak-body');
 for(const id of ['REF','DEX','MOVE'])assert.equal(evaluateCharacter(c,rules).attributes[id].effective,0);
});
test('Falscher Bereich, fehlender Besitz und manipulierte Ausrüstung werden abgewiesen',()=>{
 const c=fresh();buy(c,'armor-light-jack-head');const before=structuredClone(c);
 assert.equal(equipArmor(c,rules,'body','armor-light-jack-head').ok,false);assert.equal(equipArmor(c,rules,'head','armor-flak-head').ok,false);assert.deepEqual(c,before);
 c.equipment.armor.body='armor-light-jack-head';assert.throws(()=>validateCharacter(c,rules));
});
test('Letztes Exemplar entfernen legt ab und erstattet; Ersatzexemplar erhält Auswahl',()=>{
 const c=fresh();buy(c,'armor-heavy-jack-body');buy(c,'armor-heavy-jack-body');wear(c,'body','armor-heavy-jack-body');
 removeEquipment(c,'armor-heavy-jack-body');assert.equal(evaluateCharacter(c,rules).armor.penalty,2);
 removeEquipment(c,'armor-heavy-jack-body');assert.equal(evaluateCharacter(c,rules).armor.penalty,0);assert.equal(evaluateFunds(c,rules).remaining,2550);
});
test('Format 5 migriert verlustfrei und Format 6 speichert getragene Rüstung',()=>{
 const c=fresh();buy(c,'agent');buy(c,'armor-kevlar-body');const old=structuredClone(c);old.version=5;delete old.equipment.armor;
 const migrated=migrateCharacter(old,rules);assert.deepEqual(migrated.equipment.items,c.equipment.items);assert.equal(migrated.version,11);assert.deepEqual(migrated.equipment.armor,{head:null,body:null});
 wear(c,'body','armor-kevlar-body');assert.deepEqual(validateCharacter(JSON.parse(JSON.stringify(c)),rules),c);
});
test('Alle neuen Bereiche rendern Katalog, Preise und passende Kaufaktionen',()=>{
 const c=fresh(),ev=evaluateCharacter(c,rules);
 for(const category of ['weapons','armor','misc']){const html=renderEquipment(c,rules,ev,category);assert.match(html,/data-buy-equipment/);assert.doesNotMatch(html,/undefined|NaN/);}
 assert.match(renderEquipment(c,rules,ev,'armor'),/data-armor-slot="head"/);
 assert.match(renderEquipment(c,rules,ev,'weapons'),/Angriffsbasis/);
});

test('Einhändige Nahkampfvarianten kosten 50 Prozent mehr und nutzen das gemeinsame Budget',()=>{
 const variants=rules.equipmentRules.items.filter(item=>item.variantOf);
 assert.equal(variants.length,3);
 for(const variant of variants){const c=fresh(),original=rules.equipmentRules.items.find(item=>item.id===variant.variantOf);assert.equal(original.hands,2);assert.equal(variant.hands,1);assert.equal(variant.cost,original.cost*1.5);assert.equal(variant.damage,original.damage);buy(c,variant.id);assert.equal(evaluateFunds(c,rules).remaining,2550-variant.cost);assert.deepEqual(validateCharacter(c,rules),c);}
});
