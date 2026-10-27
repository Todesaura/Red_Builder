import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createCharacter, validateCharacter, migrateCharacter } from '../js/model.js';
import { createRolePoints, assignRolePoint, choosePharmaceutical, validateRolePoints, evaluateRolePoints } from '../js/role-points.js';
import { evaluateCharacter } from '../js/rules.js';
import { roleAbilityExamples } from '../js/role-abilities.js';
import { renderRolePoints } from '../js/ui-role-points.js';
import { loadCharacter, STORAGE_KEY } from '../js/storage.js';
const json=async name=>JSON.parse(await readFile(new URL(`../data/${name}.json`,import.meta.url),'utf8'));
const rules=await json('rules');rules.skillRules=await json('skills');rules.cyberwareRules=await json('cyberware');rules.equipmentRules=await json('equipment');
function fresh(role){const c=createCharacter(rules);c.name='Test';c.role=role;return c;}
const put=(c,id,value)=>assert.ok(assignRolePoint(c,id,value).ok);
test('Solo bezahlt Effektstufen mit unterschiedlichen Kosten; Überziehung ist atomar',()=>{
 const c=fresh('solo');put(c,'precision',1);put(c,'initiative',1);assert.equal(evaluateRolePoints(c).remaining,0);
 const before=structuredClone(c);assert.equal(assignRolePoint(c,'deflection',1).ok,false);assert.deepEqual(c,before);
 put(c,'precision',0);put(c,'initiative',0);put(c,'fumble',1);assert.equal(evaluateRolePoints(c).spent,4);
});
test('Tech verteilt acht Fachränge bis maximal vier je Gebiet; Brüche und fremde Felder scheitern',()=>{
 const c=fresh('tech');put(c,'field',4);put(c,'upgrade',4);assert.equal(evaluateRolePoints(c).remaining,0);
 for(const [id,value] of [['field',5],['field',-1],['field',1.5],['field','2'],['threat',1]]){const before=structuredClone(c);assert.equal(assignRolePoint(c,id,value).ok,false);assert.deepEqual(c,before);}
});
test('Feldexpertise verbessert nur normale passende Technikproben, Maker addiert sie nicht doppelt',()=>{
 const c=fresh('tech');c.method='points';c.allocations.points.TECH=5;c.skills.ranks['basic-tech']=3;
 put(c,'field',2);put(c,'upgrade',3);put(c,'fabrication',2);put(c,'invention',1);
 const ev=evaluateCharacter(c,rules);assert.equal(ev.skills.find(s=>s.id==='basic-tech').base,10);assert.equal(ev.skills.find(s=>s.id==='first-aid').base,7);
 assert.match(roleAbilityExamples(c,ev).join(' '),/Verbessern 11 \+ 1W10/);assert.equal(c.skills.ranks['basic-tech'],3);
});
test('Solo-Initiative und Wahrnehmung wirken zentral, Präzision verändert keine Fertigkeitsränge',()=>{
 const c=fresh('solo'),before=evaluateCharacter(c,rules);put(c,'threat',1);put(c,'initiative',1);put(c,'deflection',1);
 let ev=evaluateCharacter(c,rules);assert.equal(ev.derived.find(d=>d.id==='initiative').value,before.attributes.REF.effective+1);assert.equal(ev.attributes.REF.effective,before.attributes.REF.effective);
 assert.equal(ev.skills.find(s=>s.id==='perception').base,before.skills.find(s=>s.id==='perception').base+1);
 put(c,'threat',0);put(c,'deflection',0);put(c,'precision',1);ev=evaluateCharacter(c,rules);
 assert.equal(ev.roleAbilities.bonuses.attack,1);assert.equal(ev.skills.find(s=>s.id==='handgun').base,before.skills.find(s=>s.id==='handgun').base);
});
test('Medtech erhält getrennte Chirurgie und kombinierte Medizintechnik sowie begrenzte Pharmaauswahl',()=>{
 const c=fresh('medtech');put(c,'surgery',2);put(c,'pharma',1);put(c,'cryo',1);
 assert.ok(evaluateRolePoints(c).errors.length);assert.ok(choosePharmaceutical(c,'speedheal',true).ok);
 const before=structuredClone(c);assert.equal(choosePharmaceutical(c,'stim',true).ok,false);assert.deepEqual(c,before);
 assert.deepEqual(evaluateRolePoints(c).errors,[]);const text=roleAbilityExamples(c,evaluateCharacter(c,rules)).join(' ');
 assert.match(text,/Chirurgierang 4/);assert.match(text,/Pharmazeutik 1 \+ Kryotechnik 1/);
 put(c,'pharma',0);assert.deepEqual(c.rolePoints.pharmaceuticals,[]);
});
test('Rollenwechsel bewahrt Verteilungen, aktiviert aber nur die gewählte Rolle',()=>{
 const c=fresh('tech');put(c,'field',4);const saved=structuredClone(c.rolePoints.tech);
 c.role='solo';put(c,'threat',4);const solo=evaluateCharacter(c,rules);
 assert.equal(solo.skills.find(s=>s.id==='basic-tech').modifiers.some(m=>m.role==='tech'),false);
 c.role='tech';const tech=evaluateCharacter(c,rules);assert.deepEqual(c.rolePoints.tech,saved);
 assert.equal(tech.skills.find(s=>s.id==='perception').modifiers.some(m=>m.role==='solo'),false);
 c.role='netrunner';assert.deepEqual(evaluateRolePoints(c).effects,[]);assert.equal(assignRolePoint(c,'field',1).ok,false);
});
test('Ungültige gespeicherte Verteilungen wirken nicht; Zusatzfelder können keine Boni einschleusen',()=>{
 const state=createRolePoints();state.tech.field=4;state.tech.cheat=99;state.attackBonus=999;
 const safe=validateRolePoints(state);assert.equal('cheat' in safe.tech,false);assert.equal('attackBonus' in safe,false);
 const c=fresh('tech');c.rolePoints.tech.field=5;assert.throws(()=>validateCharacter(c,rules));assert.deepEqual(evaluateRolePoints(c).effects,[]);
});
test('Format 6 wird mit leeren Rollenpunkten und Originalbackup übernommen; Format 7 speichert Auswahl',()=>{
 const old=fresh('tech');old.version=6;delete old.rolePoints;const raw=JSON.stringify(old),data=new Map([[STORAGE_KEY,raw]]);
 const loaded=loadCharacter(rules,{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)});
 assert.equal(loaded.blocked,false);assert.equal(loaded.character.version,11);assert.deepEqual(loaded.character.rolePoints,createRolePoints());assert.equal(data.get('red-builder.character.v6.backup'),raw);
 const c=fresh('medtech');put(c,'pharma',4);for(const id of ['speedheal','stim','surge','rapidetox'])assert.ok(choosePharmaceutical(c,id,true).ok);
 assert.deepEqual(migrateCharacter(JSON.parse(JSON.stringify(c)),rules),c);
});
test('Unverteilte Punkte erscheinen in zentraler Prüfung; normale Rollen haben keinen künstlichen Pool',()=>{
 const c=fresh('tech');assert.ok(evaluateCharacter(c,rules).errors.some(e=>e.includes('8 Maker')));
 assert.match(renderRolePoints(c,evaluateCharacter(c,rules)),/8 von 8 übrig/);
 c.role='lawman';assert.deepEqual(evaluateRolePoints(c).errors,[]);assert.match(renderRolePoints(c,evaluateCharacter(c,rules)),/keine Punkte/);
});
