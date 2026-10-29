import test from 'node:test';
import assert from 'node:assert/strict';
import {PDFDocument,rgb} from '../vendor/pdf-lib/pdf-lib.esm.min.js';
import fontkit from '../vendor/fontkit/fontkit.es.min.js';
import {completeCharacter,rules,templateBytes,fontBytes} from './helpers/pdf-fixture.mjs';
import {characterSheetData} from '../js/pdf-character-data.js';
import {evaluateCharacter} from '../js/rules.js';
import {buyEquipment} from '../js/economy.js';
import {equipArmor} from '../js/armor.js';
import {weaponOptions} from '../js/weapon-options.js';
import {generateCharacterSheet,wrapPdfText} from '../js/pdf-character.js';
import {RANGE_BANDS,SINGLE_SHOT_DVS,AUTOFIRE_DVS,criticalInjuryChance,cheatsheetWeaponRows,cheatsheetColumns,drawCheatsheet} from '../js/pdf-cheatsheet.js';

test('Kritische Verletzungen: Wahrscheinlichkeit entspricht vollständig ausgezählten Würfelergebnissen',()=>{
  for(let dice=1;dice<=4;dice++){
    let critical=0;
    for(let outcome=0;outcome<6**dice;outcome++){
      let value=outcome,sixes=0;
      for(let die=0;die<dice;die++){if(value%6===5)sixes++;value=Math.floor(value/6);}
      if(sixes>=2)critical++;
    }
    assert.ok(Math.abs(criticalInjuryChance(`${dice}W6`)-critical/6**dice)<1e-12);
  }
  assert.ok(Math.abs(criticalInjuryChance('5W6')-1526/7776)<1e-12);
  assert.ok(Math.abs(criticalInjuryChance('6W6')-12281/46656)<1e-12);
  assert.equal(criticalInjuryChance('2W6 x4 max.'),criticalInjuryChance('2W6'));
  for(const damage of ['-',undefined,'Blendung'])assert.equal(criticalInjuryChance(damage),null);
});

test('Krit-Chancen folgen dem Feuermodus; NET und Unterdrücken verursachen keine körperlichen Krits',()=>{
  const c=completeCharacter('netrunner');
  const data=characterSheetData(c,rules),v=evaluateCharacter(c,rules);
  data.attackOptions=['assault-rifle','shotgun'].map(id=>{const item=rules.equipmentRules.items.find(i=>i.id===id);return {item,options:weaponOptions(item,v)};});
  data.netWeapons=[{definition:{id:'test-net',name:'Test'},damage:{ordinary:'3W6',blackIce:'3W6'},attackBase:4}];
  const rows=cheatsheetWeaponRows(data);
  for(const id of ['assault-rifle','assault-rifle.aimed','shotgun'])assert.equal(rows.find(r=>r.id===id).criticalChance,criticalInjuryChance('5W6'));
  assert.equal(rows.find(r=>r.id==='assault-rifle.auto').criticalChance,criticalInjuryChance('2W6'));
  assert.equal(rows.find(r=>r.id==='shotgun.shell').criticalChance,criticalInjuryChance('3W6'));
  for(const id of ['test-net','assault-rifle.suppressive'])assert.equal(rows.find(r=>r.id===id).criticalChance,null);
  const text=JSON.stringify(cheatsheetColumns(data));
  for(const part of ['2+ Sechsen im Schadenswurf','5 Direktschaden','Kopftabelle','Körpertabelle','Spielleitung'])assert.ok(text.includes(part),part);
});

test('Entfernungs-DVs unterscheiden Pistolentypen, Slugs, Gewehre und Autofeuer; außerhalb der Reichweite keine DV',()=>{
  assert.equal(RANGE_BANDS.length,8);assert.equal(RANGE_BANDS[0],'0-6 m');assert.equal(RANGE_BANDS[7],'401-800 m');
  assert.deepEqual(SINGLE_SHOT_DVS.pistol,[13,15,20,25,30,30,null,null]);
  assert.deepEqual(SINGLE_SHOT_DVS.shotgun,[13,15,20,25,30,35,null,null]);
  assert.equal(SINGLE_SHOT_DVS.assault[3],13);assert.equal(SINGLE_SHOT_DVS.sniper[4],15);
  assert.deepEqual(AUTOFIRE_DVS.smg,[20,17,20,25,30,null,null,null]);
  assert.deepEqual(AUTOFIRE_DVS.assault,[22,20,17,20,25,null,null,null]);
});
test('Nur eigene Waffen erscheinen, mit eigenen Moduszeilen und aktuellen Basiswerten statt doppeltem Rollenbonus',()=>{
  const c=completeCharacter();c.rolePoints.solo={deflection:0,fumble:0,initiative:1,precision:1,weakness:0,threat:0};
  for(const id of ['medium-pistol','smg','shotgun','armor-medium-jack-body'])assert.ok(buyEquipment(c,rules,id).ok);
  equipArmor(c,rules,'body','armor-medium-jack-body');
  const before=structuredClone(c),v=evaluateCharacter(c,rules),data=characterSheetData(c,rules),rows=cheatsheetWeaponRows(data);
  assert.equal(rows.length,9);assert.equal(rows.find(r=>r.id==='smg').base,v.skills.find(s=>s.id==='handgun').base+1);
  assert.equal(rows.find(r=>r.id==='smg.auto').base,v.skills.find(s=>s.id==='autofire').base+1);
  assert.deepEqual(rows.find(r=>r.id==='smg.auto').dvs,AUTOFIRE_DVS.smg);
  assert.equal(rows.find(r=>r.id==='shotgun.shell').shell,true);
  assert.equal(rows.some(r=>r.id==='assault-rifle'),false);assert.deepEqual(c,before);
});
test('Leerer Bestand erklärt Handgemenge ohne erfundene Schussmodi',()=>{
  const data=characterSheetData(completeCharacter(),rules),text=JSON.stringify(cheatsheetColumns(data));
  assert.deepEqual(cheatsheetWeaponRows(data),[]);assert.match(text,/Handgemenge/);
  assert.doesNotMatch(text,/Autofeuer:|Unterdrücken:|Schrot:|Explosion:/);
});
test('Cheatsheet nennt Zugablauf, Verwundung, echte Todesrettungsmechanik und aktuelle Rollenpunkte',()=>{
  const data=characterSheetData(completeCharacter('medtech'),rules),text=JSON.stringify(cheatsheetColumns(data));
  for(const part of ['1 Bewegungsaktion','Glück:','Bewegungswert um 6','Todesrettungsabzüge','Natürliche 10 oder Fehlschlag','Stabilisieren / Aktion:','Chirurgie:','Medizintechnik:','Kopf'])assert.ok(text.includes(part),part);
  assert.doesNotMatch(text,/halbe Bewegung|Lebensweg - vollständige/);
});
test('Alle zehn Rollen erzeugen genau drei Originalseiten und eine lesbare Cheatsheet-Seite',async()=>{
  for(const role of rules.roles){
    const c=completeCharacter(role.id),before=structuredClone(c);
    const {bytes}=await generateCharacterSheet(c,rules,{templateBytes,fontBytes});
    const pdf=await PDFDocument.load(bytes);
    assert.equal(pdf.getPageCount(),4,role.id);assert.ok(pdf.getPage(3).getWidth()>pdf.getPage(3).getHeight());
    assert.deepEqual(c,before);
  }
});
test('Auch das gesamte Katalogarsenal passt auf genau eine Cheatsheet-Seite ohne zusätzliche Anhänge',async()=>{
  const c=completeCharacter(),v=evaluateCharacter(c,rules),data=characterSheetData(c,rules);
  data.attackOptions=rules.equipmentRules.items.filter(item=>item.kind==='weapon').map(item=>({item,quantity:1,options:weaponOptions(item,v)}));
  const pdf=await PDFDocument.create();pdf.registerFontkit(fontkit);const font=await pdf.embedFont(fontBytes);
  const {rows,page}=drawCheatsheet(pdf,data,{font,rgb,wrap:wrapPdfText,text:String});
  assert.equal(rows.filter(r=>!r.id.includes('.')).length,19);assert.equal(rows.length,43);
  assert.equal(pdf.getPageCount(),1);assert.equal(page.getWidth(),595.28);assert.equal(page.getHeight(),841.89);
});

test('NET-Kaufwerte und deutsche Regeln bleiben im vierseitigen Export erhalten',async()=>{
  const c=completeCharacter('netrunner');buyEquipment(c,rules,'net-program-sword');buyEquipment(c,rules,'net-hardware-backup-drive');
  const {bytes}=await generateCharacterSheet(c,rules,{templateBytes,fontBytes}),pdf=await PDFDocument.load(bytes);
  assert.equal(pdf.getPageCount(),4);
  const values=pdf.getForm().getFields().map(f=>f.getText()).join('\n');
  for(const part of ['Schwert','Angriff 1','Verteidigung 0','Integrität 0','Sicherungslaufwerk','2 Optionsplätze'])assert.ok(values.includes(part),part);
});
