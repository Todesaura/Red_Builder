import test from 'node:test';
import assert from 'node:assert/strict';
import { completeCharacter,rules,templateBytes,fontBytes } from './helpers/pdf-fixture.mjs';
import { weaponOptions,weaponOptionLabels,ownedWeaponOptions,WEAPON_PROFILES } from '../js/weapon-options.js';
import { renderOwnedWeaponOptions,renderWeaponOptionCard } from '../js/ui-weapon-options.js';
import { evaluateCharacter } from '../js/rules.js';
import { buyEquipment } from '../js/economy.js';
import { equipArmor } from '../js/armor.js';
import { generateCharacterSheet } from '../js/pdf-character.js';
import { PDFDocument } from '../vendor/pdf-lib/pdf-lib.esm.min.js';
const item=id=>rules.equipmentRules.items.find(entry=>entry.id===id);
const modes=(id,c=completeCharacter())=>weaponOptions(item(id),evaluateCharacter(c,rules));

test('Jede Katalogwaffe hat ein explizites Profil; Munition und unbekannte Waffen erhalten keine erfundenen Modi',()=>{
  for(const weapon of rules.equipmentRules.items.filter(item=>item.kind==='weapon'))assert.ok(WEAPON_PROFILES[weapon.id],weapon.id);
  assert.deepEqual(weaponOptionLabels(item('ammo-shell')),[]);assert.deepEqual(weaponOptions({id:'custom-gun'},evaluateCharacter(completeCharacter(),rules)),[]);
});
test('Nur MPs und Sturmgewehr besitzen Autofeuer und Unterdrückungsfeuer mit passenden Multiplikatoren',()=>{
  for(const [id,maximum] of [['smg',3],['heavy-smg',3],['assault-rifle',4]]) {
    const result=modes(id);assert.equal(result.find(m=>m.id==='autofire').maximum,maximum);
    assert.equal(result.find(m=>m.id==='autofire').rounds,10);assert.equal(result.find(m=>m.id==='suppressive').rounds,10);
  }
  for(const id of ['heavy-pistol','sniper-rifle','shotgun','bow','grenade-launcher','rocket-launcher','light-melee'])assert.ok(!modes(id).some(m=>['autofire','suppressive'].includes(m.id)),id);
});
test('Gezielte Angriffe gelten auch im Nahkampf, aber nicht für explosive Flächenwaffen',()=>{
  for(const id of ['light-melee','heavy-pistol','shotgun','bow','sniper-rifle']) {
    const aimed=modes(id).find(mode=>mode.id==='aimed');assert.ok(aimed);assert.match(aimed.description,/ROF 1/);assert.match(aimed.description,/− 8/);assert.match(aimed.description,/nach Kopfrüstung verdoppeln/);
  }
  for(const id of ['grenade-launcher','rocket-launcher'])assert.deepEqual(modes(id).map(mode=>mode.id),['explosive']);
});
test('Schrotpatronen und Slugs werden getrennt mit Schaden, DV, Fläche und Beschränkungen erklärt',()=>{
  const result=modes('shotgun'),shell=result.find(m=>m.id==='shell');
  assert.equal(shell.damage,'3W6');assert.equal(shell.dv,13);assert.equal(shell.range,6);assert.equal(shell.rounds,1);
  assert.match(shell.description,/Slugs verursachen normal 5W6/);assert.match(shell.description,/6 m × 6 m/);assert.match(shell.description,/Keine gezielten Schüsse/);assert.match(shell.description,/REF mindestens 8/);
  assert.match(result.find(m=>m.id==='aimed').name,/Slug/);
});
test('Angriffsbasis verwendet aktuelle Rüstungsabzüge und Dauerfeuer statt Handfeuerwaffen',()=>{
  const c=completeCharacter();c.rolePoints.solo.initiative=1;c.rolePoints.solo.precision=1;
  buyEquipment(c,rules,'armor-medium-jack-body');equipArmor(c,rules,'body','armor-medium-jack-body');
  const v=evaluateCharacter(c,rules),result=modes('smg',c);
  assert.equal(result.find(m=>m.id==='aimed').base,v.skills.find(s=>s.id==='handgun').base+1-8);
  assert.equal(result.find(m=>m.id==='autofire').base,v.skills.find(s=>s.id==='autofire').base+1);
  assert.equal(result.find(m=>m.id==='suppressive').base,v.skills.find(s=>s.id==='autofire').base);
});
test('Unterdrückung erklärt Deckungsbewegung und direkten Vergleich ohne Waffenschaden',()=>{
  const text=modes('smg').find(m=>m.id==='suppressive').description;
  for(const token of ['10 geladene Schuss','25 m','WIL + Konzentration + 1W10','Bewegungsaktion','Rennen','keinen direkten Waffenschaden'])assert.ok(text.includes(token),token);
});
test('Übersicht und PDF-Daten enthalten nur tatsächlich gekaufte Waffen und verändern keinen Bestand',()=>{
  const c=completeCharacter();assert.equal(renderOwnedWeaponOptions(c,rules,evaluateCharacter(c,rules)),'');
  buyEquipment(c,rules,'heavy-smg');buyEquipment(c,rules,'heavy-smg');buyEquipment(c,rules,'ammo-heavy-pistol');
  const before=structuredClone(c),entries=ownedWeaponOptions(c,rules,evaluateCharacter(c,rules));
  assert.equal(entries.length,1);assert.equal(entries[0].quantity,2);assert.equal(entries[0].item.id,'heavy-smg');
  const html=renderOwnedWeaponOptions(c,rules,evaluateCharacter(c,rules));assert.match(html,/2 × Schwere Maschinenpistole/);assert.doesNotMatch(html,/Schrotflinte|Raketenwerfer/);assert.deepEqual(c,before);
});
test('Kaufkarten bleiben kompakt; Erklärungen stehen in einer aufklappbaren Ansicht',()=>{
  const v=evaluateCharacter(completeCharacter(),rules),html=renderWeaponOptionCard(item('smg'),v);
  assert.match(html,/Autofeuer \(3\)/);assert.match(html,/Unterdrückungsfeuer/);assert.match(html,/<details class="weapon-option-help">/);assert.doesNotMatch(html,/undefined|NaN/);
});
test('Erzeugtes PDF enthält genau ein Cheatsheet statt wiederholter Anhänge',async()=>{
  const c=completeCharacter();buyEquipment(c,rules,'smg');buyEquipment(c,rules,'shotgun');
  const {bytes}=await generateCharacterSheet(c,rules,{templateBytes,fontBytes}),pdf=await PDFDocument.load(bytes);
  assert.equal(pdf.getPageCount(),4);
  assert.ok(pdf.getPage(3).node.Contents());
  assert.equal(pdf.getForm().getFields().some(f=>f.getName().startsWith('appendix.')),false);
});
