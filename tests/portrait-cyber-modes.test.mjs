import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PDFDocument,rgb,PDFName} from '../vendor/pdf-lib/pdf-lib.esm.min.js';
import fontkit from '../vendor/fontkit/fontkit.es.min.js';
import {rules,completeCharacter,templateBytes,fontBytes} from './helpers/pdf-fixture.mjs';
import {PORTRAITS} from '../js/portrait-catalog.js';
import {validateCharacter} from '../js/model.js';
import {buyEquipment} from '../js/economy.js';
import {characterSheetData} from '../js/pdf-character-data.js';
import {characterSheetFields} from '../js/pdf-character-layout.js';
import {generateCharacterSheet} from '../js/pdf-character.js';
import {cheatsheetColumns,cheatsheetWeaponRows,drawCheatsheet} from '../js/pdf-cheatsheet.js';
import {CYBERWARE_PRINT_SUMMARIES,CYBERWARE_PRINT_NAMES} from '../js/pdf-cyberware-summary.js';

test('Jede Rolle hat fünf männliche und fünf weibliche Porträts einschließlich Nummer 5',()=>{
  assert.equal(PORTRAITS.length,100);
  for(const role of rules.roles)for(const gender of ['M','W']){
    assert.deepEqual(PORTRAITS.filter(p=>p.role===role.id&&p.gender===gender).map(p=>p.number),[1,2,3,4,5]);
  }
  const c=completeCharacter();c.portrait='data:image/jpeg;base64,YWJj';c.portraitSource='Solo-W-5';
  assert.equal(validateCharacter(c,rules).portraitSource,'Solo-W-5');
});

test('Alle Cyberware-Kurztexte und Namen passen ungekürzt in die schmalsten PDF-Zellen',async()=>{
  const pdf=await PDFDocument.create();pdf.registerFontkit(fontkit);const font=await pdf.embedFont(fontBytes);
  for(const item of rules.cyberwareRules.items){
    assert.ok(CYBERWARE_PRINT_SUMMARIES[item.id],item.id);
    for(const label of [CYBERWARE_PRINT_SUMMARIES[item.id],CYBERWARE_PRINT_NAMES[item.id]??item.name])assert.ok(font.widthOfTextAtSize(label,5.5)<=78,item.id+': '+label);
  }
});

test('Cyberware-Felder behalten vollständige Beschreibungen trotz kurzer Druckvorschau',()=>{
  const data=characterSheetData(completeCharacter(),rules);
  data.cyberware=[{definition:rules.cyberwareRules.items.find(i=>i.id==='sandevistan'),location:'neural'}];
  const cell=characterSheetFields(data).find(f=>f.name==='cyberware.neural.0.data');
  assert.equal(cell.value,data.cyberware[0].definition.description);
  assert.equal(cell.displayValue,CYBERWARE_PRINT_SUMMARIES.sandevistan);assert.equal(cell.minSize,5.5);
});

test('Sturmgewehr zeigt Normal, Gezielt, Dauerfeuer und Unterdrücken in Reihenfolge mit passenden Werten',()=>{
  const c=completeCharacter();assert.ok(buyEquipment(c,rules,'assault-rifle').ok);
  const before=structuredClone(c),data=characterSheetData(c,rules),rows=cheatsheetWeaponRows(data);
  assert.deepEqual(rows.map(r=>r.mode),['normal','aimed','auto','suppressive']);
  assert.equal(rows[1].base,rows[0].base-8);assert.equal(rows[1].rof,1);assert.equal(rows[1].rounds,1);
  assert.equal(rows[2].base,data.skills.find(s=>s.id==='autofire').base+data.attackBonus);assert.equal(rows[2].rounds,10);
  assert.notDeepEqual(rows[0].dvs,rows[2].dvs);assert.match(rows[2].name,/Dauerfeuer x4/);
  assert.equal(rows[3].base,data.skills.find(s=>s.id==='autofire').base);assert.deepEqual(c,before);
});

test('Glück nennt mehrere Punkte pro Probe und Waffenmodi bleiben auf einer A4-Seite',async()=>{
  const c=completeCharacter();assert.ok(buyEquipment(c,rules,'smg').ok);assert.ok(buyEquipment(c,rules,'shotgun').ok);
  const data=characterSheetData(c,rules),text=JSON.stringify(cheatsheetColumns(data));
  assert.match(text,/mehrere Punkte zugleich/);assert.match(text,/je \+1/);assert.match(text,/keine Todesrettung/);
  const pdf=await PDFDocument.create();pdf.registerFontkit(fontkit);const font=await pdf.embedFont(fontBytes);
  const result=drawCheatsheet(pdf,data,{font,rgb,text:String});
  assert.equal(pdf.getPageCount(),1);assert.equal(result.layout.compactModes,false);assert.equal(result.layout.tableRows,7);
  assert.deepEqual([result.page.getWidth(),result.page.getHeight()].sort((a,b)=>a-b),[595.28,841.89]);
});

test('Galerieporträt Nummer 5 wird tatsächlich ins PDF eingebettet',async()=>{
  const c=completeCharacter(),jpeg=await readFile(new URL('../data/portraits/thumbnails/Solo-W-5.jpg',import.meta.url));
  c.portrait='data:image/jpeg;base64,'+jpeg.toString('base64');c.portraitSource='Solo-W-5';
  const {bytes}=await generateCharacterSheet(c,rules,{templateBytes,fontBytes}),pdf=await PDFDocument.load(bytes);
  assert.equal(pdf.getPageCount(),4);
  const images=pdf.getPage(0).node.Resources().lookup(PDFName.of('XObject'));
  assert.ok(images.keys().length>=2);
});
