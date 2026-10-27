import test from 'node:test';
import assert from 'node:assert/strict';
import {rules,completeCharacter,templateBytes,fontBytes} from './helpers/pdf-fixture.mjs';
import {ATTACHMENTS,canAttach,attachmentRuleText,weaponConfiguration,secondaryWeapons} from '../js/weapon-attachments.js';
import {COMMUNITY_ATTACHMENTS} from '../js/weapon-attachments-community.js';
import {buyEquipment,addWeaponAttachment,removeWeaponAttachment,evaluateFunds,weaponAmmoBundle} from '../js/economy.js';
import {validateCharacter} from '../js/model.js';
import {evaluateCharacter} from '../js/rules.js';
import {ownedWeaponOptions} from '../js/weapon-options.js';
import {characterSheetData} from '../js/pdf-character-data.js';
import {cheatsheetWeaponRows,cheatsheetColumns,drawCheatsheet,SINGLE_SHOT_DVS,AUTOFIRE_DVS} from '../js/pdf-cheatsheet.js';
import {generateCharacterSheet} from '../js/pdf-character.js';
import {renderEquipment} from '../js/ui-equipment.js';
import {PDFDocument,rgb} from '../vendor/pdf-lib/pdf-lib.esm.min.js';
import fontkit from '../vendor/fontkit/fontkit.es.min.js';
const def=id=>rules.equipmentRules.items.find(i=>i.id===id);
const buy=(c,id)=>assert.ok(buyEquipment(c,rules,id).ok,id);
const fit=(c,w,a)=>assert.ok(addWeaponAttachment(c,rules,w,a).ok,w+': '+a);
const rows=c=>cheatsheetWeaponRows(characterSheetData(c,rules));

test('Alle 31 übernommenen Ideen sind kaufbar, bezahlbar, persistent und typgerecht',()=>{
 assert.equal(COMMUNITY_ATTACHMENTS.length,31);assert.equal(ATTACHMENTS.length,37);
 for(const a of COMMUNITY_ATTACHMENTS){
  const candidates=rules.equipmentRules.items.filter(w=>canAttach(w,a));assert.ok(candidates.length,a.id);
  const c=completeCharacter();buy(c,candidates[0].id);const before=evaluateFunds(c,rules).remaining;
  fit(c,candidates[0].id,a.id);assert.equal(before-evaluateFunds(c,rules).remaining,a.cost,a.id);
  assert.deepEqual(validateCharacter(JSON.parse(JSON.stringify(c)),rules),c,a.id);
  removeWeaponAttachment(c,rules,candidates[0].id,a.id);assert.equal(evaluateFunds(c,rules).remaining,before);
  assert.ok(a.use&&a.description&&a.section);
 }
 for(const id of ['light-melee','hand-grenade-frag','ammo-rifle'])for(const a of COMMUNITY_ATTACHMENTS)assert.equal(canAttach(def(id),a),false);
 assert.equal(canAttach(def('assault-rifle'),ATTACHMENTS.find(a=>a.id==='choke')),false);
 assert.equal(canAttach(def('shotgun'),ATTACHMENTS.find(a=>a.id==='underbarrel-ar')),true);
 assert.equal(canAttach(def('assault-rifle'),ATTACHMENTS.find(a=>a.id==='autofire-switch')),false);
});

test('Positions- und Trommelkonflikte gelten auch beim Speichern und bleiben atomar',()=>{
 for(const pair of [['drum-mag','coupled-mags'],['power-holster','drum-mag'],['long-barrel','short-barrel'],['laser','reflex-sight'],['folding-stock','smart-stock']]){
  const c=completeCharacter();buy(c,'assault-rifle');fit(c,'assault-rifle',pair[0]);const before=structuredClone(c);
  assert.equal(addWeaponAttachment(c,rules,'assault-rifle',pair[1]).ok,false,pair.join('/'));assert.deepEqual(c,before);
  assert.throws(()=>validateCharacter({...c,equipment:{...c.equipment,attachments:[...c.equipment.attachments,{weaponId:'assault-rifle',attachmentId:pair[1]}]}},rules));
 }
});

test('Feste Griff-/Schaftpräzision stapelt nicht mit Smartgun; Kompaktlauf hat klaren Nachteil',()=>{
 const c=completeCharacter();buy(c,'medium-pistol');const base=rows(c)[0].base;
 fit(c,'medium-pistol','pistol-stock');fit(c,'medium-pistol','smart-grip');
 const w=characterSheetData(c,rules).weapons[0].definition;assert.equal(w.hands,2);assert.equal(w.concealable,false);assert.equal(rows(c)[0].base,base+1);
 removeWeaponAttachment(c,rules,'medium-pistol','pistol-stock');fit(c,'medium-pistol','short-barrel');
 assert.equal(rows(c)[0].base,base);assert.equal(rows(c)[0].damage,'2W6');
 assert.equal(characterSheetData(c,rules).weapons[0].definition.concealable,true);
 const linked=completeCharacter();buy(linked,'medium-pistol');const raw=rows(linked)[0].base;fit(linked,'medium-pistol','smartgun');fit(linked,'medium-pistol','smart-grip');
 linked.cyberware.items=[{id:'implant-1',catalogId:'neural-link',location:'neural',parent:null},{id:'implant-2',catalogId:'interface-plugs',location:'neural',parent:'implant-1'}];
 assert.equal(weaponConfiguration(linked,def('medium-pistol')).smartBonus,1);assert.equal(rows(linked)[0].base,raw+1);
});

test('Laser/Kompensator sind eigene optionale Würfe mit Gegenrisiko und richtigem Verbrauch',()=>{
 const c=completeCharacter();buy(c,'assault-rifle');fit(c,'assault-rifle','laser');fit(c,'assault-rifle','compensator');
 const r=rows(c),normal=r.find(r=>r.mode==='normal'),laser=r.find(r=>r.mode==='laser'),comp=r.find(r=>r.mode==='compensated');
 assert.equal(laser.base,normal.base+1);assert.equal(laser.rounds,1);assert.equal(comp.base,normal.base+1);assert.equal(comp.rounds,2);assert.equal(comp.damage,normal.damage);
 const t=JSON.stringify(cheatsheetColumns(characterSheetData(c,rules)));assert.match(t,/jedes Ziel|Jedes Ziel/);assert.match(t,/keine zwei Treffer|kein zusätzlicher Treffer|ein normaler Schadenswurf|normaler Schaden einmal/);
});

test('Pistolen-Umbau verwendet MP-Dauerfeuer, behält aber Pistolen-Einzelschusswerte',()=>{
 const c=completeCharacter();buy(c,'medium-pistol');fit(c,'medium-pistol','autofire-switch');
 const r=rows(c),base=evaluateCharacter(c,rules).skills.find(s=>s.id==='autofire').base;
 assert.deepEqual(r.find(r=>r.mode==='normal').dvs,SINGLE_SHOT_DVS.pistol);
 assert.deepEqual(r.find(r=>r.mode==='auto').dvs,AUTOFIRE_DVS.smg);assert.equal(r.find(r=>r.mode==='auto').base,base-1);assert.equal(r.find(r=>r.mode==='auto').rounds,10);
 const small=completeCharacter();buy(small,'heavy-pistol');fit(small,'heavy-pistol','autofire-switch');assert.equal(rows(small).some(r=>r.mode==='auto'),false);
 fit(small,'heavy-pistol','extended-mag');assert.equal(rows(small).some(r=>r.mode==='auto'),true);
});

test('Unterlaufwaffen sind getrennte Läufe mit eigenen Werten, Munition und ohne geerbte Boni',()=>{
 for(const [id,baseId,magazine] of [['underbarrel-ar','assault-rifle',10],['underbarrel-pistol','heavy-pistol',10],['underbarrel-smg','smg',10],['secondary-barrel','very-heavy-pistol',1]]){
  const parent=id==='secondary-barrel'?'medium-pistol':'assault-rifle',c=completeCharacter();buy(c,parent);fit(c,parent,id);fit(c,parent,'neon-finish');
  const child=secondaryWeapons(c,rules)[0].item;assert.equal(child.magazine,magazine);assert.deepEqual(child.ammoIds,def(baseId).ammoIds);assert.equal(child.combatBonus,0);
  const data=characterSheetData(c,rules);assert.equal(data.weapons.length,2);assert.equal(data.weapons[0].definition.concealable,false);
  const html=renderEquipment(c,rules,evaluateCharacter(c,rules),'weapons');assert.ok(html.includes(`data-buy-equipment="${child.ammoIds[0]}"`));
  assert.ok(rows(c).some(r=>r.id===child.id));assert.equal(evaluateFunds(c,rules).spent,def(parent).cost+600);
 }
});

test('Tarnform halbiert Magazin; Doppelmagazine verdoppeln nicht die Kapazität eines Feuervorgangs',()=>{
 const c=completeCharacter();buy(c,'assault-rifle');fit(c,'assault-rifle','form-memory');assert.equal(rows(c)[0].capacity,12);assert.equal(weaponAmmoBundle(rules,'assault-rifle',c).units,30);
 removeWeaponAttachment(c,rules,'assault-rifle','form-memory');fit(c,'assault-rifle','mag-switch');
 const w=characterSheetData(c,rules).weapons[0].definition;assert.equal(w.magazine,25);assert.equal(w.magazineCount,2);assert.equal(w.reloadActions,2);assert.equal(rows(c)[0].capacity,'25x2');
});

test('Bedingte Werte bleiben lokal; Schnellladen verwendet Athletik, HUD prüft benötigte Ausrüstung',()=>{
 const c=completeCharacter();buy(c,'assault-rifle');fit(c,'assault-rifle','hud-link');fit(c,'assault-rifle','power-holster');
 const before=JSON.stringify(evaluateCharacter(c,rules).skills),w=weaponConfiguration(c,def('assault-rifle'));assert.equal(w.hudReady,false);
 const ev=evaluateCharacter(c,rules),text=attachmentRuleText(ATTACHMENTS.find(a=>a.id==='power-holster'),w,ev);
 assert.ok(text.includes(ev.skills.find(s=>s.id==='athletics').base+' + 1W10'));assert.match(text,/über 15/);assert.equal(JSON.stringify(ev.skills),before);
 c.cyberware.items=[{id:'implant-1',catalogId:'neural-link',location:'neural',parent:null},{id:'implant-2',catalogId:'interface-plugs',location:'neural',parent:'implant-1'}];buy(c,'virtuality-goggles');assert.equal(weaponConfiguration(c,def('assault-rifle')).hudReady,true);
});

test('Schrot-Chokes ändern nur das Flächenmuster, keine zusätzlichen Treffer oder Schadenswürfel',()=>{
 for(const id of ['choke','smart-choke']){
  const c=completeCharacter();buy(c,'shotgun');fit(c,'shotgun',id);const shell=rows(c).find(r=>r.mode==='shell');
  assert.equal(shell.damage,'3W6');assert.match(shell.shellPattern,/12x4/);assert.equal(shell.rounds,1);
  const text=ownedWeaponOptions(c,rules,evaluateCharacter(c,rules))[0].options.find(m=>m.id==='shell').description;assert.match(text,/Schwierigkeit|gegen 13/);assert.doesNotMatch(text,/4W6/);
 }
});

test('Jeder einzelne Community-Aufsatz passt für alle Rollen auf eine lesbare A4-Kurzreferenz',async()=>{
 const pdf=await PDFDocument.create();pdf.registerFontkit(fontkit);const font=await pdf.embedFont(fontBytes);
 for(const role of rules.roles)for(const a of COMMUNITY_ATTACHMENTS){
  const c=completeCharacter(role.id),w=rules.equipmentRules.items.find(w=>canAttach(w,a));buy(c,w.id);fit(c,w.id,a.id);
  const before=structuredClone(c);let result;assert.doesNotThrow(()=>{result=drawCheatsheet(pdf,characterSheetData(c,rules),{font,rgb,text:String});},role.id+'/'+a.id);
  assert.ok(result.layout.fontSize>=8.6,role.id+'/'+a.id);assert.ok(result.layout.bounds.every(b=>b.bottom>=44));assert.deepEqual(c,before);
 }
});

test('Unterlaufwaffe und Aufsätze stehen auf Blatt und Cheatsheet ohne Zustandsänderung',async()=>{
 const c=completeCharacter();buy(c,'assault-rifle');fit(c,'assault-rifle','underbarrel-pistol');fit(c,'assault-rifle','reflex-sight');fit(c,'assault-rifle','finish');
 const before=structuredClone(c),{bytes}=await generateCharacterSheet(c,rules,{templateBytes,fontBytes}),pdf=await PDFDocument.load(bytes);
 assert.equal(pdf.getPageCount(),4);assert.match(pdf.getForm().getTextField('weapons.1.name').getText(),/Unterlaufpistole/);assert.equal(pdf.getForm().getTextField('weapons.1.magazine').getText(),'10');assert.deepEqual(c,before);
});

test('Bezahlbare Kombination aus zwei Waffen, Zusatzlauf und sieben Aufsätzen bleibt für jede Rolle A4',async()=>{
 const pdf=await PDFDocument.create();pdf.registerFontkit(fontkit);const font=await pdf.embedFont(fontBytes);
 for(const role of rules.roles){
  const c=completeCharacter(role.id);buy(c,'assault-rifle');buy(c,'heavy-pistol');
  for(const a of ['underbarrel-pistol','reflex-sight','finish','neon-finish','smart-sling'])fit(c,'assault-rifle',a);
  for(const a of ['smart-grip','compensator'])fit(c,'heavy-pistol',a);
  assert.equal(evaluateFunds(c,rules).remaining,50);
  let result;assert.doesNotThrow(()=>{result=drawCheatsheet(pdf,characterSheetData(c,rules),{font,rgb,text:String});},role.id);
  assert.ok(result.layout.fontSize>=8.6);assert.ok(result.layout.bounds.every(b=>b.bottom>=44));
 }
});
