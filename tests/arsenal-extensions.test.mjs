import test from 'node:test';
import assert from 'node:assert/strict';
import {rules,completeCharacter,templateBytes,fontBytes} from './helpers/pdf-fixture.mjs';
import {buyEquipment,removeEquipment,evaluateFunds,addWeaponAttachment,removeWeaponAttachment,weaponAmmoBundle,buyWeaponWithAmmo} from '../js/economy.js';
import {validateCharacter} from '../js/model.js';
import {weaponConfiguration} from '../js/weapon-attachments.js';
import {characterSheetData} from '../js/pdf-character-data.js';
import {cheatsheetWeaponRows,cheatsheetColumns,drawCheatsheet} from '../js/pdf-cheatsheet.js';
import {generateCharacterSheet} from '../js/pdf-character.js';
import {evaluateCharacter} from '../js/rules.js';
import {renderEquipment} from '../js/ui-equipment.js';
import {PDFDocument,rgb} from '../vendor/pdf-lib/pdf-lib.esm.min.js';
import fontkit from '../vendor/fontkit/fontkit.es.min.js';
const item=id=>rules.equipmentRules.items.find(i=>i.id===id);
const buy=(c,...ids)=>ids.forEach(id=>assert.ok(buyEquipment(c,rules,id).ok,id));

test('Alte Speicherstände erhalten leere Aufsätze; neue Konfigurationen überstehen Validierung',()=>{
 const c=completeCharacter();delete c.equipment.attachments;
 assert.deepEqual(validateCharacter(c,rules).equipment.attachments,[]);
 buy(c,'assault-rifle');assert.ok(addWeaponAttachment(c,rules,'assault-rifle','scope').ok);
 assert.deepEqual(validateCharacter(c,rules).equipment.attachments,c.equipment.attachments);
 for(const entries of [[{weaponId:'light-melee',attachmentId:'scope'}],[{weaponId:'assault-rifle',attachmentId:'unknown'}],[{weaponId:'assault-rifle',attachmentId:'scope'},{weaponId:'assault-rifle',attachmentId:'scope'}]])assert.throws(()=>validateCharacter({...c,equipment:{...c.equipment,attachments:entries}},rules));
});

test('Aufsätze prüfen Geld, Positionen und drei Montageplätze ohne Teiländerungen',()=>{
 const c=completeCharacter();buy(c,'assault-rifle');
 assert.ok(addWeaponAttachment(c,rules,'assault-rifle','smartgun').ok);
 assert.ok(addWeaponAttachment(c,rules,'assault-rifle','scope').ok);
 const before=structuredClone(c);assert.equal(addWeaponAttachment(c,rules,'assault-rifle','extended-mag').ok,false);assert.deepEqual(c,before);
 removeWeaponAttachment(c,rules,'assault-rifle','smartgun');
 assert.equal(addWeaponAttachment(c,rules,'assault-rifle','night-scope').ok,false);
 const low={...rules,equipmentRules:{...rules.equipmentRules,startingCash:600}};
 const saved=structuredClone(c);assert.equal(addWeaponAttachment(c,low,'assault-rifle','smartgun').ok,false);assert.deepEqual(c,saved);
});

test('Mehrere Exemplare verrechnen Aufsatzkosten je Waffe und entfernen keine verwaisten Zuordnungen',()=>{
 const c=completeCharacter();buy(c,'heavy-pistol','heavy-pistol');
 assert.ok(addWeaponAttachment(c,rules,'heavy-pistol','extended-mag').ok);
 assert.equal(evaluateFunds(c,rules).spent,400);
 assert.equal(weaponConfiguration(c,item('heavy-pistol')).magazine,16);
 removeEquipment(c,'heavy-pistol');assert.equal(evaluateFunds(c,rules).spent,200);assert.equal(c.equipment.attachments.length,1);
 removeEquipment(c,'heavy-pistol');assert.equal(evaluateFunds(c,rules).spent,0);assert.deepEqual(c.equipment.attachments,[]);
});

test('Erneuter Kombikauf berechnet Aufsätze und zwei vergrößerte Magazinfüllungen korrekt',()=>{
 const c=completeCharacter();buy(c,'heavy-pistol');addWeaponAttachment(c,rules,'heavy-pistol','extended-mag');
 const bundle=weaponAmmoBundle(rules,'heavy-pistol',c);assert.equal(bundle.units,40);assert.equal(bundle.cost,240);
 const spent=evaluateFunds(c,rules).spent;assert.ok(buyWeaponWithAmmo(c,rules,'heavy-pistol').ok);assert.equal(evaluateFunds(c,rules).spent-spent,240);
});

test('Smartgun-Bonus gilt nur für verbundene zugeordnete Waffe; Zielfernrohr bleibt bedingt',()=>{
 const c=completeCharacter();buy(c,'assault-rifle','medium-pistol');addWeaponAttachment(c,rules,'assault-rifle','smartgun');addWeaponAttachment(c,rules,'assault-rifle','scope');
 const first=characterSheetData(c,rules);assert.equal(first.weapons[0].definition.smartBonus,0);
 c.cyberware.items=[{id:'implant-1',catalogId:'neural-link',location:'neural',parent:null},{id:'implant-2',catalogId:'interface-plugs',location:'neural',parent:'implant-1'}];
 const data=characterSheetData(c,rules),rows=cheatsheetWeaponRows(data),old=cheatsheetWeaponRows(first);
 assert.equal(rows[0].base,old[0].base+1);assert.equal(rows[1].base,old[1].base+1);assert.equal(rows[2].base,old[2].base+1);
 assert.equal(rows.find(r=>r.id==='medium-pistol').base,old.find(r=>r.id==='medium-pistol').base);
 assert.match(JSON.stringify(cheatsheetColumns(data)),/Ab 51 m: Einzelschuss/);assert.deepEqual(validateCharacter(c,rules),c);
});

test('Handgranaten sind ohne Werfer kaufbar und verwenden Athletik bis 25 m',()=>{
 const c=completeCharacter(),html=renderEquipment(c,rules,evaluateCharacter(c,rules),'weapons');
 assert.match(html,/data-buy-equipment="hand-grenade-frag"/);assert.match(html,/data-weapon-section="grenades"/);
 buy(c,'hand-grenade-frag','hand-grenade-smoke');const data=characterSheetData(c,rules),rows=cheatsheetWeaponRows(data);
 assert.equal(data.grenades.length,2);assert.equal(rows[0].base,data.skills.find(s=>s.id==='athletics').base+data.attackBonus);
 assert.deepEqual(rows[0].dvs,[16,15,15,null,null,null,null,null]);assert.equal(rows.length,2);assert.match(JSON.stringify(cheatsheetColumns(data)),/kein Werfer nötig/);
});

test('Spezialmunition folgt kompatiblem Kaliber und Kataloggruppen bleiben ausklappbar',()=>{
 const c=completeCharacter();buy(c,'assault-rifle');
 const html=renderEquipment(c,rules,evaluateCharacter(c,rules),'weapons',{weaponSections:['ammo']});
 for(const id of ['ap','incendiary','rubber'])assert.match(html,new RegExp(`data-buy-equipment="ammo-rifle-${id}"`));
 assert.doesNotMatch(html,/data-buy-equipment="ammo-heavy-pistol-ap"/);
 assert.match(html,/<details class="weapon-catalog-group" data-weapon-section="ammo" open>/);
 assert.match(html,/Waffe erweitern/);assert.match(html,/Sturmgewehr – Militech/);
});

test('Export enthält Granaten, Aufsätze und konkrete Würfel ohne Charakteränderung auf vier Seiten',async()=>{
 const c=completeCharacter();buy(c,'assault-rifle','hand-grenade-frag','hand-grenade-smoke','ammo-rifle-ap');addWeaponAttachment(c,rules,'assault-rifle','scope');addWeaponAttachment(c,rules,'assault-rifle','extended-mag');
 const before=structuredClone(c),{bytes}=await generateCharacterSheet(c,rules,{templateBytes,fontBytes});
 const pdf=await PDFDocument.load(bytes);assert.equal(pdf.getPageCount(),4);assert.equal(pdf.getForm().getTextField('weapons.0.magazine').getText(),'35');assert.match(pdf.getForm().getTextField('equipment.0.name').getText(),/Zielfernrohr/);assert.deepEqual(c,before);
});

test('Neue Ausrüstung bleibt für alle zehn Rollen auf einer A4-Cheatsheet-Seite lesbar',async()=>{
 const pdf=await PDFDocument.create();pdf.registerFontkit(fontkit);const font=await pdf.embedFont(fontBytes);
 for(const role of rules.roles){
  const c=completeCharacter(role.id);buy(c,'assault-rifle','hand-grenade-frag','ammo-rifle-ap');addWeaponAttachment(c,rules,'assault-rifle','scope');
  const result=drawCheatsheet(pdf,characterSheetData(c,rules),{font,rgb,text:String});
  assert.ok(result.layout.fontSize>=8.6,role.id);assert.ok(result.layout.bounds.every(b=>b.bottom>=44),role.id);
 }
 const c=completeCharacter('netrunner');buy(c,'hand-grenade-smoke','hand-grenade-emp','hand-grenade-poison');
 const result=drawCheatsheet(pdf,characterSheetData(c,rules),{font,rgb,text:String});assert.ok(result.layout.fontSize>=8.6);
});
