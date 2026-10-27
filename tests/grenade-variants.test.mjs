import test from 'node:test';
import assert from 'node:assert/strict';
import {rules,completeCharacter,templateBytes,fontBytes} from './helpers/pdf-fixture.mjs';
import {buyEquipment,evaluateFunds} from '../js/economy.js';
import {validateCharacter} from '../js/model.js';
import {evaluateCharacter} from '../js/rules.js';
import {evaluateLoadout} from '../js/loadout-limits.js';
import {characterSheetData} from '../js/pdf-character-data.js';
import {cheatsheetColumns,cheatsheetWeaponRows} from '../js/pdf-cheatsheet.js';
import {grenadeEffectSummary} from '../js/pdf-cheatsheet-content.js';
import {renderEquipment} from '../js/ui-equipment.js';
import {generateCharacterSheet} from '../js/pdf-character.js';
import {PDFDocument} from '../vendor/pdf-lib/pdf-lib.esm.min.js';
const item=id=>rules.equipmentRules.items.find(i=>i.id===id);

test('Militärische Varianten behalten IDs, 500-eb-Preis, 6W6 und Splitter-Rüstungsverlust von 2',()=>{
 assert.equal(item('hand-grenade-frag').name,'Militärische Splittergranate');assert.equal(item('hand-grenade-incendiary').name,'Militärische Brandgranate');
 for(const id of ['hand-grenade-frag','hand-grenade-incendiary']){assert.equal(item(id).cost,500);assert.equal(item(id).damage,'6W6');}
 assert.equal(item('hand-grenade-frag').grenadeEffect.armorLoss,2);
 const c=completeCharacter();c.equipment.items=[{catalogId:'hand-grenade-incendiary',quantity:1}];assert.deepEqual(validateCharacter(JSON.parse(JSON.stringify(c)),rules),c);
 assert.equal(characterSheetData(c,rules).grenades[0].definition.name,'Militärische Brandgranate');
});

test('Normale Splitter-/Brandgranaten kosten 200 eb, machen 4W6/3W6 und tragen nur 1 SP ab',()=>{
 for(const [id,damage] of [['hand-grenade-normal-frag','4W6'],['hand-grenade-normal-incendiary','3W6']]){
  const d=item(id);assert.equal(d.cost,200);assert.equal(d.damage,damage);assert.equal(d.grenadeEffect.armorLoss,1);
  const c=completeCharacter();assert.ok(buyEquipment(c,rules,id).ok);assert.equal(evaluateFunds(c,rules).spent,200);assert.equal(cheatsheetWeaponRows(characterSheetData(c,rules))[0].damage,damage);
 }
});

test('Beide Brandvarianten verursachen nach Durchdringung 2 direkte Schaden je Runde, niemals 4',()=>{
 for(const id of ['hand-grenade-incendiary','hand-grenade-normal-incendiary']){
  const d=item(id);assert.equal(d.grenadeEffect.burnDamage,2);assert.match(d.description,/Bei Durchdringung/);assert.match(d.description,/2 direkte TP pro Runde/);assert.doesNotMatch(d.description,/4 direkte/);
  const summary=grenadeEffectSummary(d);assert.match(summary,/2 direkte Trefferpunkte pro Runde/);assert.match(summary,/1 Aktion löschen/);assert.match(summary,/Nicht stapelbar/);
  const c=completeCharacter();buyEquipment(c,rules,id);const text=JSON.stringify(cheatsheetColumns(characterSheetData(c,rules)));assert.match(text,/2 direkte Trefferpunkte pro Runde/);assert.doesNotMatch(text,/4 direkte/);
 }
});

test('Normale und militärische Varianten teilen das bestehende Dreierlimit und stehen getrennt im Menü',()=>{
 const c=completeCharacter();for(const id of ['hand-grenade-normal-frag','hand-grenade-normal-incendiary','hand-grenade-frag'])assert.ok(buyEquipment(c,rules,id).ok);
 assert.equal(evaluateLoadout(c,rules).counts.grenades,3);const before=structuredClone(c);assert.equal(buyEquipment(c,rules,'hand-grenade-incendiary').ok,false);assert.deepEqual(c,before);
 const html=renderEquipment(c,rules,evaluateCharacter(c,rules),'weapons');assert.ok(html.indexOf('>Normale Granaten<')<html.indexOf('>Militärische Granaten<'));assert.match(html,/>Spezialgranaten</);
});

test('Neue Varianten und reduzierter Brandschaden erscheinen im vierseitigen PDF ohne Zustandsänderung',async()=>{
 const c=completeCharacter();for(const id of ['hand-grenade-normal-frag','hand-grenade-normal-incendiary','hand-grenade-incendiary'])assert.ok(buyEquipment(c,rules,id).ok);
 const before=structuredClone(c),{bytes}=await generateCharacterSheet(c,rules,{templateBytes,fontBytes}),pdf=await PDFDocument.load(bytes),f=pdf.getForm();
 assert.equal(pdf.getPageCount(),4);assert.equal(f.getTextField('weapons.0.damage').getText(),'4W6');assert.equal(f.getTextField('weapons.1.damage').getText(),'3W6');assert.equal(f.getTextField('weapons.2.damage').getText(),'6W6');
 assert.equal(f.getTextField('weapons.2.name').getText(),'1x Militärische Brandgranate');assert.deepEqual(c,before);
});
