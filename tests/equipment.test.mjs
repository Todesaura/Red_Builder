import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createCharacter, validateCharacter } from '../js/model.js';
import { loadCharacter, STORAGE_KEY } from '../js/storage.js';
import { installCyberware, removeCyberware } from '../js/cyberware.js';
import { evaluateFunds, buyEquipment, removeEquipment } from '../js/economy.js';
import { evaluateCharacter } from '../js/rules.js';
import { cyberwareCandidate, candidateErrors } from '../js/ui-body.js';
const json=async name=>JSON.parse(await readFile(new URL(`../data/${name}.json`,import.meta.url),'utf8'));
const rules=await json('rules');rules.skillRules=await json('skills');rules.cyberwareRules=await json('cyberware');rules.equipmentRules=await json('equipment');
const stats={EMP:4,BODY:6};
function character(){const c=createCharacter(rules);c.name='Nyx';c.role='solo';return c;}
const install=(c,id,location)=>installCyberware(c,rules,id,location,null,stats);
test('Complete Package startet mit 2550 eb und getrennten 800 eb Fashion-Zuschuss',()=>{
 const funds=evaluateFunds(character(),rules);assert.equal(funds.remaining,2550);assert.equal(funds.fashionRemaining,800);assert.equal(funds.spent,0);
});
test('Ausrüstung und Cyberware teilen einen Pool; ausgebaute Cyberware bleibt bezahlt',()=>{
 const c=character();assert.ok(buyEquipment(c,rules,'agent').ok);assert.ok(install(c,'optishield','external').ok);
 assert.equal(evaluateFunds(c,rules).remaining,1950);assert.equal(evaluateFunds(c,rules).equipmentCost,100);
 removeEquipment(c,'agent');assert.equal(evaluateFunds(c,rules).remaining,2050);
 assert.ok(removeCyberware(c,rules,c.cyberware.items[0].id,stats,0).ok);assert.equal(evaluateFunds(c,rules).remaining,2050);
});
test('Fashionware nutzt den zweckgebundenen Zuschuss, der nicht als Bargeld zählt',()=>{
 const c=character();install(c,'kill-display','fashion');const f=evaluateFunds(c,rules);
 assert.equal(f.remaining,2550);assert.equal(f.fashionRemaining,700);
 removeCyberware(c,rules,c.cyberware.items[0].id,stats,0);assert.equal(evaluateFunds(c,rules).remaining,2550);assert.equal(evaluateFunds(c,rules).fashionRemaining,700);
});
test('Mehrkosten oberhalb des Fashion-Zuschusses belasten den Hauptpool',()=>{
 const c=character(),r=structuredClone(rules);r.cyberwareRules.items.find(i=>i.id==='kill-display').cost=1000;
 assert.ok(installCyberware(c,r,'kill-display','fashion',null,stats).ok);const f=evaluateFunds(c,r);
 assert.equal(f.remaining,2350);assert.equal(f.fashionRemaining,0);assert.equal(f.fashionUsed,800);
});
test('Überziehung durch Ausrüstung und Implantate wird vor Mutation verhindert',()=>{
 const c=character();for(let i=0;i<5;i++) assert.ok(buyEquipment(c,rules,'tech-bag').ok);
 const before=structuredClone(c);assert.equal(buyEquipment(c,rules,'agent').ok,false);assert.equal(install(c,'optishield','external').ok,false);assert.deepEqual(c,before);
 assert.ok(buyEquipment(c,rules,'computer').ok);assert.equal(evaluateFunds(c,rules).remaining,0);
 assert.ok(install(c,'kill-display','fashion').ok);assert.equal(evaluateFunds(c,rules).remaining,0);
});
test('Körperauswahl und Drop-Kandidaten verwenden dieselben Bereiche und Budgetregeln',()=>{
 const c=character(), evaluated=evaluateCharacter(c,rules);
 assert.deepEqual(cyberwareCandidate(c,rules,'holo-palm','arm-left'),{id:'preview',catalogId:'holo-palm',location:'arm-left',parent:null});
 assert.deepEqual(candidateErrors(c,rules,'holo-palm','arm-left',evaluated),[]);
 assert.ok(candidateErrors(c,rules,'holo-palm','leg-left',evaluated).length);
 install(c,'holo-palm','arm-left');assert.ok(candidateErrors(c,rules,'holo-palm','arm-left',evaluateCharacter(c,rules)).length);
});
test('Inventar akzeptiert nur bekannte IDs und ganze Mengen; Preise sind nicht importierbar',()=>{
 const c=character();buyEquipment(c,rules,'agent');c.equipment.items[0].cost=-999;
 const safe=validateCharacter(c,rules);assert.equal('cost' in safe.equipment.items[0],false);assert.equal(evaluateFunds(safe,rules).remaining,2450);
 for(const quantity of [-1,0,1.5,100]){c.equipment.items[0].quantity=quantity;assert.throws(()=>validateCharacter(c,rules));}
 c.equipment.items[0]={catalogId:'unknown',quantity:1};assert.throws(()=>validateCharacter(c,rules));
});
test('Migration von Format 4 bewahrt Implantate, entfernt altes Wunschlimit und sichert Original',()=>{
 const c=character();install(c,'neutongue','internal');c.version=4;c.cyberware.limit=100;delete c.equipment;
 const raw=JSON.stringify(c), data=new Map([[STORAGE_KEY,raw]]);
 const result=loadCharacter(rules,{getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value)});
 assert.equal(result.blocked,false);assert.equal(result.character.version,11);assert.deepEqual(result.character.cyberware.items,c.cyberware.items);assert.equal(result.character.cyberware.limit,null);assert.deepEqual(result.character.equipment,{items:[],custom:[],attachments:[],armor:{head:null,body:null}});assert.equal(data.get('red-builder.character.v4.backup'),raw);
});
test('Bereits gespeicherte Überziehung bleibt sichtbar und lässt sich durch Entfernen reparieren',()=>{
 const c=character();c.equipment.items=[{catalogId:'tech-bag',quantity:6}];const safe=validateCharacter(c,rules);
 assert.equal(evaluateCharacter(safe,rules).funds.remaining,-450);assert.ok(evaluateCharacter(safe,rules).errors.some(e=>e.includes('Startkapital')));
 removeEquipment(safe,'tech-bag');assert.equal(evaluateFunds(safe,rules).remaining,50);
});
