import test from 'node:test';
import assert from 'node:assert/strict';
import {rules,completeCharacter,templateBytes,fontBytes} from './helpers/pdf-fixture.mjs';
import {buyEquipment,buyWeaponWithAmmo,weaponAmmoBundle,removeEquipment,addWeaponAttachment,removeWeaponAttachment,evaluateFunds} from '../js/economy.js';
import {evaluateLoadout} from '../js/loadout-limits.js';
import {validateCharacter} from '../js/model.js';
import {evaluateCharacter} from '../js/rules.js';
import {characterSheetReadiness,characterSheetData} from '../js/pdf-character-data.js';
import {cheatsheetColumns,drawCheatsheet} from '../js/pdf-cheatsheet.js';
import {generateCharacterSheet} from '../js/pdf-character.js';
import {renderEquipment} from '../js/ui-equipment.js';
import {PDFDocument,rgb} from '../vendor/pdf-lib/pdf-lib.esm.min.js';
import fontkit from '../vendor/fontkit/fontkit.es.min.js';
const buy=(c,...ids)=>ids.forEach(id=>assert.ok(buyEquipment(c,rules,id).ok,id));

test('Splitter-, Brand- und vergleichbare Werfergranaten kosten 500 eb; die vierte scheitert atomar',()=>{
 for(const id of ['hand-grenade-frag','hand-grenade-incendiary','ammo-grenade']){
  assert.equal(rules.equipmentRules.items.find(i=>i.id===id).cost,500);
  const c=completeCharacter();buy(c,id,id,id);assert.equal(evaluateFunds(c,rules).spent,1500);assert.equal(evaluateLoadout(c,rules).counts.grenades,3);
  const before=structuredClone(c),result=buyEquipment(c,rules,id);assert.equal(result.ok,false);assert.match(result.error,/Granaten/);assert.deepEqual(c,before);
 }
});

test('Gemischte Granatentypen und Werfermunition teilen sich ein Limit; Pakete nutzen verbleibenden Platz',()=>{
 const c=completeCharacter();buy(c,'hand-grenade-smoke');assert.equal(weaponAmmoBundle(rules,'grenade-launcher',c).units,2);
 assert.ok(buyWeaponWithAmmo(c,rules,'grenade-launcher').ok);assert.equal(evaluateLoadout(c,rules).counts.grenades,3);assert.equal(evaluateFunds(c,rules).spent,1550);
 assert.equal(weaponAmmoBundle(rules,'grenade-launcher',c),null);const before=structuredClone(c);assert.equal(buyWeaponWithAmmo(c,rules,'grenade-launcher').ok,false);assert.deepEqual(c,before);
 removeEquipment(c,'ammo-grenade');assert.ok(buyEquipment(c,rules,'hand-grenade-incendiary').ok);assert.equal(evaluateLoadout(c,rules).counts.grenades,3);
});

test('Pistole, Messer und Gewehr sind erlaubt; doppelte Stückzahlen zählen gegen die richtige Grenze',()=>{
 const c=completeCharacter();buy(c,'medium-pistol','light-melee','assault-rifle');
 assert.deepEqual(evaluateLoadout(c,rules).counts,{oneHanded:2,twoHanded:1,grenades:0});
 for(const id of ['medium-pistol','tomahawk','shotgun','assault-rifle']){const before=structuredClone(c);assert.equal(buyEquipment(c,rules,id).ok,false);assert.deepEqual(c,before);}
 removeEquipment(c,'light-melee');assert.ok(buyEquipment(c,rules,'medium-pistol').ok);assert.equal(c.equipment.items.find(i=>i.catalogId==='medium-pistol').quantity,2);
 const melee=completeCharacter();buy(melee,'medium-pistol','heavy-pistol','heavy-melee');assert.deepEqual(evaluateLoadout(melee,rules).counts,{oneHanded:2,twoHanded:1,grenades:0});
});

test('Kombikauf kann die Waffenlimits nicht umgehen und kauft bei Fehlschlag keine Munition',()=>{
 const c=completeCharacter();buy(c,'medium-pistol','light-melee','assault-rifle');
 for(const id of ['heavy-pistol','shotgun']){const before=structuredClone(c);assert.equal(buyWeaponWithAmmo(c,rules,id).ok,false);assert.deepEqual(c,before);}
 buy(c,'ammo-medium-pistol','ammo-medium-pistol');assert.equal(evaluateLoadout(c,rules).counts.oneHanded,2);
});

test('Anschlagschaft wird als Zweihandwaffe gezählt; Hinzufügen und Entfernen prüfen die Grenzen',()=>{
 const c=completeCharacter();buy(c,'assault-rifle','medium-pistol');const before=structuredClone(c);
 assert.equal(addWeaponAttachment(c,rules,'medium-pistol','pistol-stock').ok,false);assert.deepEqual(c,before);
 const d=completeCharacter();buy(d,'medium-pistol','heavy-pistol');assert.ok(addWeaponAttachment(d,rules,'medium-pistol','pistol-stock').ok);buy(d,'light-melee');
 assert.deepEqual(evaluateLoadout(d,rules).counts,{oneHanded:2,twoHanded:1,grenades:0});const saved=structuredClone(d);
 assert.ok(removeWeaponAttachment(d,rules,'medium-pistol','pistol-stock').ok);assert.deepEqual(evaluateLoadout(d,rules).counts,{oneHanded:3,twoHanded:0,grenades:0});
 assert.equal(buyEquipment(d,rules,'assault-rifle').ok,false);
});

test('Zusatzläufe, Netzprogramme und normale Munition verbrauchen keine weiteren Trageplätze',()=>{
 const c=completeCharacter();buy(c,'assault-rifle','medium-pistol','light-melee');assert.ok(addWeaponAttachment(c,rules,'assault-rifle','underbarrel-pistol').ok);
 buy(c,'net-program-sword','ammo-heavy-pistol');assert.deepEqual(evaluateLoadout(c,rules).counts,{oneHanded:2,twoHanded:1,grenades:0});assert.ok(characterSheetReadiness(c,rules).ready);
});

test('Bestehende Überbestände bleiben vollständig ladbar und blockieren den Export bis zur Korrektur',()=>{
 for(const [id,quantity,key] of [['hand-grenade-frag',4,'grenades'],['medium-pistol',4,'oneHanded'],['assault-rifle',2,'twoHanded']]){
  const original=completeCharacter();original.equipment.items=[{catalogId:id,quantity}];
  const c=validateCharacter(JSON.parse(JSON.stringify(original)),rules);assert.deepEqual(c,original);assert.equal(evaluateLoadout(c,rules).counts[key],quantity);
  assert.equal(characterSheetReadiness(c,rules).ready,false);assert.throws(()=>characterSheetData(c,rules),/höchstens/);
  removeEquipment(c,id);assert.ok(characterSheetReadiness(c,rules).ready);
 }
});

test('Kaufmenü zeigt Grenzen und sperrt konkrete Kaufbuttons; Ausweichen erklärt Attribut, Fertigkeit und Modifikatoren',async()=>{
 const c=completeCharacter();buy(c,'medium-pistol','light-melee','assault-rifle');const ev=evaluateCharacter(c,rules),html=renderEquipment(c,rules,ev,'weapons');
 assert.match(html,/Einhandwaffen: <strong>2 \/ 2/);assert.match(html,/Zweihandwaffen: <strong>1 \/ 1/);assert.match(html,/id="buy-equipment-shotgun"[^>]*disabled/);assert.match(html,/Limit erreicht/);
 const data=characterSheetData(c,rules),content=JSON.stringify(cheatsheetColumns(data));assert.match(content,/Geschicklichkeit \+ Fertigkeitsrang Ausweichen \+ situative Modifikatoren \+ 1W10/);
 const pdf=await PDFDocument.create();pdf.registerFontkit(fontkit);const font=await pdf.embedFont(fontBytes),labels=[],addPage=pdf.addPage.bind(pdf);
 pdf.addPage=(...args)=>{const page=addPage(...args),draw=page.drawText.bind(page);page.drawText=(text,options)=>{labels.push(text);return draw(text,options);};return page;};
 drawCheatsheet(pdf,data,{font,rgb,text:String});assert.ok(labels.includes('Bis 2 m / Ziel: GES + Ausweichen + Mod. + 1W10'));
 buy(c,'hand-grenade-frag','hand-grenade-incendiary','hand-grenade-smoke');const before=structuredClone(c),result=await generateCharacterSheet(c,rules,{templateBytes,fontBytes});assert.equal((await PDFDocument.load(result.bytes)).getPageCount(),4);assert.deepEqual(c,before);
});
