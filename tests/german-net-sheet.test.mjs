import test from 'node:test';
import assert from 'node:assert/strict';
import {PDFDocument,PDFName} from '../vendor/pdf-lib/pdf-lib.esm.min.js';
import {completeCharacter,rules,templateBytes,fontBytes} from './helpers/pdf-fixture.mjs';
import {buyEquipment} from '../js/economy.js';
import {characterSheetData} from '../js/pdf-character-data.js';
import {characterSheetFields} from '../js/pdf-character-layout.js';
import {generateCharacterSheet} from '../js/pdf-character.js';
import {cheatsheetColumns,cheatsheetWeaponRows} from '../js/pdf-cheatsheet.js';
import {NET_NAMES,germanNetText} from '../js/netrunner-german.js';
import {netrunnerGuide} from '../js/netrunner-guide.js';
const buy=(c,...ids)=>{for(const id of ids)assert.ok(buyEquipment(c,rules,id).ok,id);};

test('Deutsche Programmnamen behalten englische Quellnamen und stabile IDs, Preise und Werte',()=>{
 const entries=rules.equipmentRules.items.filter(i=>i.netrunner?.group==='programs');
 assert.equal(entries.length,15);for(const item of entries){assert.equal(item.name,NET_NAMES[item.id]);assert.ok(item.originalName);}
 const sword=entries.find(i=>i.id==='net-program-sword');assert.equal(sword.name,'Schwert');assert.equal(sword.originalName,'Sword');assert.equal(sword.cost,50);assert.equal(sword.netrunner.atk,1);
 assert.equal(germanNetText('Netrunner: 1 Netrun, Black ICE, ATK 1, DEF 0, REZ 7'),'Netrunner: 1 Netzeinsatz, Schwarzes ICE, Angriff 1, Verteidigung 0, Integrität 7');
});
test('Nur Integritätsschaden wird als Net-Waffe zugeordnet; Schwert und Bannhammer unterscheiden Ziele',()=>{
 const c=completeCharacter('netrunner');buy(c,'net-program-sword','net-program-banhammer','net-program-hellbolt','net-program-poison-flatline','net-program-armor');
 const data=characterSheetData(c,rules);assert.equal(data.netWeapons.length,2);
 const sword=data.netWeapons.find(e=>e.definition.id==='net-program-sword'),hammer=data.netWeapons.find(e=>e.definition.id==='net-program-banhammer');
 assert.equal(sword.attackBase,5);assert.deepEqual(sword.damage,{ordinary:'2W6',blackIce:'3W6'});assert.deepEqual(hammer.damage,{ordinary:'3W6',blackIce:'2W6'});
 const rows=cheatsheetWeaponRows(data);assert.equal(rows.length,2);assert.match(rows[0].name,/^\(Net\) Schwert/);assert.equal(rows[0].dvs,null);assert.equal(rows[0].rof,'-');assert.equal(rows[0].magazine,'-');
});
test('Autonome Net-Waffen nutzen eigenen Angriff, keine Reflexe oder Schnittstellen-Addition',()=>{
 const c=completeCharacter('netrunner');buy(c,'net-ice-killer');const data=characterSheetData(c,rules),w=data.netWeapons[0];
 assert.equal(w.attackBase,6);assert.equal(w.automatic,true);assert.deepEqual(w.damage,{ordinary:'4W6',blackIce:'4W6'});
 const fields=Object.fromEntries(characterSheetFields(data).map(f=>[f.name,f.value]));assert.match(fields['weapons.0.name'],/^\(Net\).*Mörder/);assert.match(fields['weapons.0.notes'],/selbstständig/);
 const tech=completeCharacter('tech');buy(tech,'net-program-sword');assert.equal(characterSheetData(tech,rules).netWeapons[0].attackBase,null);
});
test('Cheatsheet erklärt Attribute und Begriffe ausgeschrieben auf Deutsch',()=>{
 for(const role of rules.roles){
  const c=completeCharacter(role.id);if(role.id==='netrunner')buy(c,'net-program-worm','net-program-armor');
  const text=JSON.stringify(cheatsheetColumns(characterSheetData(c,rules)));
  assert.doesNotMatch(text,/\b(REF|DEX|GES|TECH|WILL|BODY|ROF|DV|SP|REZ|ATK|DEF|Booster|Defender|Interface|Speedheal)\b|Black ICE|Range Upgrade/,role.id);
  assert.ok(text.includes('Reflexe 8'),role.id);assert.doesNotMatch(text,/W10 bedeutet|Stelle sie dir als Gebäude vor/,role.id);
 }
});
test('Netz-Anleitung erklärt Aktionen, Ablauf, Verteidigung, Integrität und kostenloses Angreifen',()=>{
 const text=JSON.stringify(netrunnerGuide({rank:4}));
 for(const part of ['WAS IST EINE NETZ-AKTION','3 Netz-Aktionen','nicht mischen','kostet keine Netz-Aktion','Einloggen kostet 1 Netz-Aktion','Hintertür','Wegfinder','Stromstoß','Integrität','Hirnschaden','Zerstört bedeutet','sicherem Ausloggen'])assert.ok(text.includes(part),part);
 assert.ok(text.includes('Reflexe und Ausweichen werden für Netz-Angriffe nicht verwendet'));
 assert.ok(JSON.stringify(netrunnerGuide({rank:7})).includes('4 Netz-Aktionen'));
});
test('Seite 1 enthält Net-Präfix und korrekte Integritätswerte zusätzlich zur normalen Waffe, ohne Kaufmutation',async()=>{
 const c=completeCharacter('netrunner');buy(c,'net-program-sword','medium-pistol');const before=structuredClone(c);
 const {bytes}=await generateCharacterSheet(c,rules,{templateBytes,fontBytes}),pdf=await PDFDocument.load(bytes),form=pdf.getForm();
 assert.equal(pdf.getPageCount(),4);assert.equal(form.getTextField('weapons.0.name').getText(),'(Net) 1x Schwert');assert.equal(form.getTextField('weapons.0.damage').getText(),'2/3W6');
 assert.equal(form.getTextField('weapons.0.rof').getText(),'-');assert.equal(form.getTextField('weapons.0.magazine').getText(),'-');assert.match(form.getTextField('weapons.0.notes').getText(),/Basis 5/);
 assert.equal(form.getTextField('weapons.1.name').getText(),'1x '+rules.equipmentRules.items.find(i=>i.id==='medium-pistol').name);assert.equal(form.getTextField('identity.ability').getText(),'Schnittstelle');
 for(const name of ['weapons.0.name','weapons.0.damage','weapons.0.notes'])for(const widget of form.getTextField(name).acroField.getWidgets())assert.ok(widget.dict.get(PDFName.of('AP')));
 assert.deepEqual(c,before);
});
test('Viele gekaufte Hilfsprogramme und Netz-Anleitung bleiben auf genau einer Cheatsheet-Seite',async()=>{
 const c=completeCharacter('netrunner');
 for(const item of rules.equipmentRules.items.filter(i=>i.netrunner?.group==='programs'))buy(c,item.id);
 buy(c,'cyberdeck-standard','virtuality-goggles','light-melee','armor-leathers-head','armor-leathers-body');
 const {bytes}=await generateCharacterSheet(c,rules,{templateBytes,fontBytes}),pdf=await PDFDocument.load(bytes);
 assert.equal(pdf.getPageCount(),4);assert.equal(pdf.getPage(3).getWidth(),595.28);assert.equal(pdf.getPage(3).getHeight(),841.89);
 const allValues=pdf.getForm().getFields().map(f=>f.getText()).join('\n');assert.match(allValues,/\(Net\).*Schwert/);assert.match(allValues,/Bannhammer/);assert.doesNotMatch(allValues,/Sword|Banhammer|Speedy Gonzalvez/);
});
