import test from 'node:test';
import assert from 'node:assert/strict';
import {rules,completeCharacter} from './helpers/pdf-fixture.mjs';
import {buyEquipment,evaluateFunds} from '../js/economy.js';
import {applyPlayAction,ammunitionRemaining} from '../js/play-tracking.js';
import {magazineState,reserveRounds} from '../js/play-magazines.js';
import {characterJson,parseCharacterJson} from '../js/character-files.js';
import {renderMagazines} from '../js/ui-play-magazines.js';
const ammo=rules.equipmentRules.items.find(i=>i.id==='ammo-heavy-pistol');
const make=()=>{const c=completeCharacter();for(const id of ['heavy-pistol','ammo-heavy-pistol','ammo-heavy-pistol'])assert.ok(buyEquipment(c,rules,id).ok);return c;};
const act=(c,action)=>{const r=applyPlayAction(c,rules,action);assert.ok(r.ok,r.error);return r.character;};
const load=(c,weapon='heavy-pistol#1',ammoId=ammo.id)=>act(c,{type:'reload',weapon,ammoId});
const shot=(c)=>act(c,{type:'fire',weapon:'heavy-pistol#1',amount:1,mode:'single'});

test('Acht-Schuss-Pistole startet leer, lädt aus Reserve und erlaubt keine Zehn-Schuss-Modi',()=>{
 let c=make();assert.equal(magazineState(c,rules)[0].rounds,0);
 c=load(c);assert.equal(magazineState(c,rules)[0].rounds,8);assert.equal(reserveRounds(c,rules,ammo.id),12);
 for(const mode of ['autofire','suppressive'])assert.equal(applyPlayAction(c,rules,{type:'fire',weapon:'heavy-pistol#1',amount:10,mode}).ok,false);
 assert.doesNotMatch(renderMagazines(c,rules),/data-play-mode="autofire"|data-play-mode="suppressive"/);
 for(let i=0;i<8;i++)c=shot(c);
 const before=structuredClone(c);assert.equal(applyPlayAction(c,rules,{type:'fire',weapon:'heavy-pistol#1',amount:1,mode:'single'}).ok,false);assert.deepEqual(c,before);
 c=load(c);assert.equal(magazineState(c,rules)[0].rounds,8);assert.equal(reserveRounds(c,rules,ammo.id),4);
});
test('Nachladen, Entladen und Sortenwechsel erzeugen keine Munition; Schüsse kosten kein Geld',()=>{
 let c=make();buyEquipment(c,rules,'ammo-heavy-pistol-ap');const total=ammunitionRemaining(c,ammo),money=evaluateFunds(c,rules).remaining;
 c=load(c);c=shot(c);c=load(c);assert.equal(ammunitionRemaining(c,ammo),total-1);
 c=load(c,'heavy-pistol#1','ammo-heavy-pistol-ap');assert.equal(reserveRounds(c,rules,ammo.id),total-1);
 c=act(c,{type:'unload',weapon:'heavy-pistol#1'});assert.equal(magazineState(c,rules)[0].rounds,0);
 assert.equal(evaluateFunds(c,rules).remaining,money);assert.deepEqual(parseCharacterJson(characterJson(c,rules),rules),c);
});
test('MP und Sturmgewehr benötigen zehn geladene Schuss für Autofeuer oder Unterdrückungsfeuer',()=>{
 let c=completeCharacter();for(const id of ['assault-rifle','ammo-rifle','ammo-rifle'])assert.ok(buyEquipment(c,rules,id).ok);
 c=load(c,'assault-rifle#1','ammo-rifle');assert.equal(magazineState(c,rules)[0].rounds,20);
 for(const mode of ['autofire','suppressive'])c=act(c,{type:'fire',weapon:'assault-rifle#1',amount:10,mode});
 assert.equal(magazineState(c,rules)[0].rounds,0);assert.equal(reserveRounds(c,rules,'ammo-rifle'),0);
});
test('Zwei identische Waffen teilen Reserve, haben aber unabhängige Magazine',()=>{
 let c=make();assert.ok(buyEquipment(c,rules,'heavy-pistol').ok);
 c=load(c);c=load(c,'heavy-pistol#2');assert.equal(reserveRounds(c,rules,ammo.id),4);
 c=shot(c);assert.deepEqual(magazineState(c,rules).map(m=>m.rounds),[7,8]);
 assert.equal(applyPlayAction(c,rules,{type:'ammo',id:ammo.id,amount:5}).ok,false);
 assert.equal(applyPlayAction(c,rules,{type:'reload',weapon:'heavy-pistol#2',ammoId:'ammo-rifle'}).ok,false);
});
test('Alte Charakterdaten erhalten leere Magazine; überzählige geladene Schüsse werden nie als Vorrat erfunden',()=>{
 const c=make();delete c.campaign.magazines;assert.deepEqual(parseCharacterJson(JSON.stringify(c),rules).campaign.magazines,{});
 c.campaign.magazines={'heavy-pistol#1':{ammoId:ammo.id,rounds:999}};
 assert.equal(magazineState(c,rules)[0].rounds,8);
 c.campaign.magazines['heavy-pistol#1'].rounds=-1;assert.throws(()=>parseCharacterJson(JSON.stringify(c),rules));
});
