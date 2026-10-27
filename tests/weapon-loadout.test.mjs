import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createCharacter, validateCharacter } from '../js/model.js';
import { buyEquipment, removeEquipment, buyWeaponWithAmmo, weaponAmmoBundle, evaluateFunds } from '../js/economy.js';
import { renderEquipment } from '../js/ui-equipment.js';
import { evaluateCharacter } from '../js/rules.js';
const json=async name=>JSON.parse(await readFile(new URL(`../data/${name}.json`,import.meta.url),'utf8'));
const rules=await json('rules');rules.skillRules=await json('skills');rules.cyberwareRules=await json('cyberware');rules.equipmentRules=await json('equipment');
const fresh=()=>{const c=createCharacter(rules);c.name='Test';c.role='solo';return c;};
const render=c=>renderEquipment(c,rules,evaluateCharacter(c,rules),'weapons');
test('Stärkegrade bilden Paare mit den gewünschten Namen und Handführungen',()=>{
 const html=render(fresh());
 for(const [left,right,hands]of [['Kampfmesser','Tomahawk',1],['Baseballschläger','Brecheisen',2],['Schwert','Bleirohr',2],['Naginata','Vorschlaghammer',2]]){
   const a=rules.equipmentRules.items.find(i=>i.name===left), b=rules.equipmentRules.items.find(i=>i.name===right);
   assert.equal(a.damage,b.damage);assert.equal(a.hands,1);assert.equal(b.hands,hands);assert.ok(html.indexOf(`<h3>${left}</h3>`) < html.indexOf(`<h3>${right}</h3>`));
 }
});
test('Fernkampf-Pakete liefern zwei Magazine oder 20 Pfeile und beachten das Granatenlimit',()=>{
 for(const item of rules.equipmentRules.items.filter(i=>i.kind==='weapon'&&i.skill!=='melee-weapon')){
   const bundle=weaponAmmoBundle(rules,item.id);assert.ok(bundle);assert.ok(item.ammoIds.includes(bundle.ammo.id));
   const target=item.id==='grenade-launcher'?3:item.magazine?item.magazine*2:20;
   assert.ok(bundle.units >= target);assert.ok(bundle.units-target < bundle.ammo.units);
   const c=fresh();assert.ok(buyWeaponWithAmmo(c,rules,item.id).ok);assert.equal(evaluateFunds(c,rules).remaining,2550-bundle.cost);assert.deepEqual(validateCharacter(c,rules),c);
 }
 assert.equal(weaponAmmoBundle(rules,'assault-rifle').units,50);assert.equal(weaponAmmoBundle(rules,'grenade-launcher').units,3);
});
test('Kombikauf bleibt bei zu wenig Geld oder überschrittenem Munitionslimit vollständig unverändert',()=>{
 const c=fresh();for(let i=0;i<5;i++)buyEquipment(c,rules,'tech-bag');const before=structuredClone(c);
 assert.equal(buyWeaponWithAmmo(c,rules,'medium-pistol').ok,false);assert.deepEqual(c,before);
 const full=fresh();full.equipment.items=[{catalogId:'ammo-medium-pistol',quantity:98}];const copy=structuredClone(full);
 assert.equal(buyWeaponWithAmmo(full,rules,'medium-pistol').ok,false);assert.deepEqual(full,copy);
 assert.equal(buyWeaponWithAmmo(full,rules,'light-melee').ok,false);
});
test('Nachkäufe zeigen nur kompatible Munition; Restbestände bleiben nach Waffenentfernung sichtbar',()=>{
 const c=fresh();assert.doesNotMatch(render(c),/data-buy-equipment="ammo-/);
 buyEquipment(c,rules,'smg');let html=render(c);assert.match(html,/data-buy-equipment="ammo-medium-pistol"/);assert.doesNotMatch(html,/data-buy-equipment="ammo-heavy-pistol"/);
 buyEquipment(c,rules,'ammo-medium-pistol');removeEquipment(c,'smg');html=render(c);
 assert.doesNotMatch(html,/data-buy-equipment="ammo-/);assert.match(html,/data-remove-equipment="ammo-medium-pistol"/);assert.doesNotMatch(html,/undefined|Basismunition, Packung/);
 buyEquipment(c,rules,'shotgun');html=render(c);assert.match(html,/data-buy-equipment="ammo-slug"/);assert.match(html,/data-buy-equipment="ammo-shell"/);
});
