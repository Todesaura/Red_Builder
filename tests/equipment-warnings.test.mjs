import test from 'node:test';
import assert from 'node:assert/strict';
import {completeCharacter,rules} from './helpers/pdf-fixture.mjs';
import {evaluateCharacter} from '../js/rules.js';
import {characterSheetReadiness} from '../js/pdf-character-data.js';
import {equipmentWarnings} from '../js/equipment-warnings.js';
import {renderEquipmentWarnings} from '../js/ui-equipment-warnings.js';
import {buyEquipment} from '../js/economy.js';
import {equipArmor} from '../js/armor.js';
import {quickAddCyberware} from '../js/cyberware-quick-add.js';
import {commitCyberwareDraft} from '../js/cyberware-draft.js';
const warnings=c=>equipmentWarnings(c,rules,evaluateCharacter(c,rules));
const ids=c=>warnings(c).map(w=>w.id);
function implant(c,id){const p=quickAddCyberware(c,rules,[],id);assert.ok(p.ok,p.error);assert.ok(commitCyberwareDraft(c,rules,p.additions).ok);}
function buy(c,...items){for(const id of items)assert.ok(buyEquipment(c,rules,id).ok,id);}

test('Fehlende Ausstattung warnt bei allen zehn Rollen, ohne Regelabschluss oder PDF-Freigabe zu verändern',()=>{
 for(const role of rules.roles){
  const c=completeCharacter(role.id),before=structuredClone(c),v=evaluateCharacter(c,rules),ready=characterSheetReadiness(c,rules);
  assert.ok(ids(c).includes('physical-weapon'),role.id);assert.ok(ids(c).includes('armor'),role.id);
  assert.equal(v.complete,true,role.id);assert.equal(ready.ready,true,role.id);
  assert.deepEqual(evaluateCharacter(c,rules).errors,v.errors);assert.deepEqual(characterSheetReadiness(c,rules).errors,ready.errors);assert.deepEqual(c,before);
 }
});
test('Netrunner unterscheiden physische Waffe, Angriffssoftware, Deck, installierte Verbindung und Virtuality',()=>{
 const c=completeCharacter('netrunner');
 for(const id of ['physical-weapon','armor','net-cyberware','net-deck','net-weapon','net-vision'])assert.ok(ids(c).includes(id),id);
 buy(c,'cyberdeck-poor','net-program-armor','virtuality-goggles');
 assert.ok(!ids(c).includes('net-deck'));assert.ok(!ids(c).includes('net-vision'));assert.ok(ids(c).includes('net-weapon'));
 buy(c,'net-program-sword');assert.ok(!ids(c).includes('net-weapon'));assert.ok(ids(c).includes('physical-weapon'));
 const pending=quickAddCyberware(c,rules,[],'interface-plugs');assert.ok(pending.ok);assert.ok(ids(c).includes('net-cyberware'));
 assert.ok(commitCyberwareDraft(c,rules,pending.additions).ok);assert.ok(!ids(c).includes('net-cyberware'));
 buy(c,'light-melee');assert.ok(!ids(c).includes('physical-weapon'));
});
test('Angriffsprogramme mit ATK 0 und eigenes Black ICE zählen, Booster/Defender alleine nicht',()=>{
 for(const [id,armed] of [['net-program-deckkrash',true],['net-ice-wisp',true],['net-program-worm',false],['net-program-shield',false]]){
  const c=completeCharacter('netrunner');buy(c,id);assert.equal(ids(c).includes('net-weapon'),!armed,id);
 }
});
test('Kopf und Körper werden getrennt geprüft; nur gekaufte aber nicht angelegte Rüstung warnt weiterhin',()=>{
 const c=completeCharacter();buy(c,'armor-leathers-head','armor-leathers-body');assert.match(warnings(c).find(w=>w.id==='armor').text,/hast aber/);
 equipArmor(c,rules,'body','armor-leathers-body');assert.equal(warnings(c).find(w=>w.id==='armor').title,'Kein Kopfschutz');
 equipArmor(c,rules,'head','armor-leathers-head');assert.ok(!ids(c).includes('armor'));
 const cyber=completeCharacter();implant(cyber,'skin-weave');assert.ok(!ids(cyber).includes('armor'));
});
test('Fernkampfwaffen benötigen passende Munition, Nahkampf erzeugt keine Munitionswarnung',()=>{
 const c=completeCharacter();buy(c,'medium-pistol','light-melee');assert.ok(!ids(c).includes('physical-weapon'));assert.ok(ids(c).includes('ammunition'));
 buy(c,'ammo-heavy-pistol');assert.ok(ids(c).includes('ammunition'));buy(c,'ammo-medium-pistol');assert.ok(!ids(c).includes('ammunition'));
});
test('Tech und Nomad erkennen Werkzeuge einschließlich installierter Tool Hand statt Pflichtcyberware zu erfinden',()=>{
 for(const role of ['tech','nomad']){
  const c=completeCharacter(role),key=role==='tech'?'tech-tools':'nomad-tools';assert.ok(ids(c).includes(key));
  implant(c,'tool-hand');assert.ok(!ids(c).includes(key));assert.ok(!ids(c).includes('net-cyberware'));
 }
 const c=completeCharacter('tech');buy(c,'tech-bag');assert.ok(!ids(c).includes('tech-tools'));
});
test('Medtech berücksichtigt Pharmazeutik und eigene Airhypo, ohne Cryopump-Kaufpflicht für Rollenleistungen',()=>{
 const c=completeCharacter('medtech');assert.ok(ids(c).includes('medical-tools'));assert.ok(ids(c).includes('pharma-airhypo'));
 buy(c,'medtech-bag');c.equipment.custom=[{id:'custom-1',name:'Mein Airhypo',cost:50,quantity:1,notes:''}];
 assert.ok(!ids(c).includes('medical-tools'));assert.ok(!ids(c).includes('pharma-airhypo'));assert.ok(!warnings(c).some(w=>/Cryopump/.test(w.text)));
});
test('Rockerboy benötigt nur für gelernte Instrumente eine Erinnerung; Kontaktrollen erkennen Kommunikationsimplantate',()=>{
 const c=completeCharacter('rockerboy');c.skills.specialties=[];assert.ok(!ids(c).includes('performance-instrument'));
 c.skills.specialties=[{id:'specialty-1',skill:'play-instrument',name:'Gitarre',level:1}];assert.ok(ids(c).includes('performance-instrument'));buy(c,'instrument');assert.ok(!ids(c).includes('performance-instrument'));
 for(const role of ['exec','lawman','fixer']){const c=completeCharacter(role);assert.ok(ids(c).includes('role-communication'));buy(c,'agent');assert.ok(!ids(c).includes('role-communication'));}
 const m=completeCharacter('media');assert.ok(ids(m).includes('media-recording'));implant(m,'audio-recorder');assert.ok(!ids(m).includes('media-recording'));
});
test('Warnungsansicht nennt Freiwilligkeit und bietet passende Kategorien, komplett ausgerüsteter Solo braucht keinen Warnblock',()=>{
 const c=completeCharacter(),html=renderEquipmentWarnings(c,rules,evaluateCharacter(c,rules));
 assert.match(html,/Nur Hinweise/);assert.match(html,/trotzdem abschließen/);assert.match(html,/data-warning-equipment="weapons"/);assert.doesNotMatch(html,/disabled|role="alert"/);
 buy(c,'light-melee','armor-leathers-head','armor-leathers-body');equipArmor(c,rules,'head','armor-leathers-head');equipArmor(c,rules,'body','armor-leathers-body');
 assert.deepEqual(warnings(c),[]);assert.equal(renderEquipmentWarnings(c,rules,evaluateCharacter(c,rules)),'');
});
