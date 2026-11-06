import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { degrees, PDFDocument, PDFName, rgb, StandardFonts } from '../vendor/pdf-lib/pdf-lib.esm.min.js';
import { characterSheetReadiness, characterSheetData, characterSheetFilename } from '../js/pdf-character-data.js';
import { characterSheetFields } from '../js/pdf-character-layout.js';
import { generateCharacterSheet, wrapPdfText, loadPdfAsset } from '../js/pdf-character.js';
import { drawPawn, standardPawnPortrait } from '../js/pdf-pawn.js';
import { evaluateCharacter } from '../js/rules.js';
import { createCharacter } from '../js/model.js';
import { buyWeaponWithAmmo, buyEquipment } from '../js/economy.js';
import { equipArmor } from '../js/armor.js';
import { addToCyberwareDraft,commitCyberwareDraft } from '../js/cyberware-draft.js';
import { completeCharacter,rules,templateBytes,fontBytes } from './helpers/pdf-fixture.mjs';

test('PDF-Freigabe verlangt alle Pflichtdaten einschließlich Lebensweg und Rollenbudget',()=>{
  assert.equal(characterSheetReadiness(createCharacter(rules),rules).ready,false);
  const c=completeCharacter();assert.equal(characterSheetReadiness(c,rules).ready,true);
  for(const change of [c=>c.name='',c=>c.skills.nativeLanguage.name='',c=>c.skills.hometown='',c=>c.rolePoints.solo.initiative=0,c=>c.lifepath.personality.choice=null,c=>{c.lifepath.values.choice='custom';c.lifepath.values.custom='  ';},c=>c.skills.ranks.athletics=0]) {
    const copy=structuredClone(c);change(copy);assert.equal(characterSheetReadiness(copy,rules).ready,false);
  }
  c.method='points';assert.equal(characterSheetReadiness(c,rules).ready,false);
});
test('Alle zehn Rollen können ohne optionale Käufe oder Porträt exportbereit sein',()=>{
  for(const role of rules.roles) {const check=characterSheetReadiness(completeCharacter(role.id),rules);assert.equal(check.ready,true,role.id+': '+check.errors.join(' '));}
});
test('Offene Cyberware-, Ausbau- und eigene Ausrüstungsentwürfe blockieren den Export',()=>{
  const c=completeCharacter();for(const state of [{cyberDraft:[{}]},{removingCyberware:'implant-1'},{customEquipmentDraft:{name:'Noch nicht gekauft'}},{customEquipmentDraft:{cost:'100'}}])assert.equal(characterSheetReadiness(c,rules,state).ready,false);
  assert.equal(characterSheetReadiness(c,rules,{customEquipmentDraft:{name:'',notes:'',id:null,quantity:'1'}}).ready,true);
});
test('Feldzuordnung verwendet zentrale effektive Werte, getrennte Panzerung, Geld und alle Fertigkeiten',()=>{
  const c=completeCharacter();buyEquipment(c,rules,'armor-medium-jack-body');equipArmor(c,rules,'body','armor-medium-jack-body');buyEquipment(c,rules,'armor-kevlar-head');equipArmor(c,rules,'head','armor-kevlar-head');buyWeaponWithAmmo(c,rules,'medium-pistol');
  let d=addToCyberwareDraft(c,rules,[],'neural-link','neural').additions;d=addToCyberwareDraft(c,rules,d,'kerenzikov','neural').additions;assert.ok(commitCyberwareDraft(c,rules,d).ok);
  const before=structuredClone(c),data=characterSheetData(c,rules),v=evaluateCharacter(c,rules),fields=characterSheetFields(data),map=Object.fromEntries(fields.map(f=>[f.name,f.value]));
  assert.equal(map['stats.REF'],String(v.attributes.REF.effective));assert.equal(map['stats.EMP'],String(v.attributes.EMP.effective));assert.equal(map['statsBase.EMP'],'4');assert.equal(map['statsBase.LUCK'],String(v.attributes.LUCK.base));assert.equal(map['armor.head.sp'],'7');assert.equal(map['armor.body.sp'],'12');assert.equal(map['armor.body.penalty'],'-2');
  assert.equal(data.derived.initiative,v.derived.find(e=>e.id==='initiative').value);assert.equal(data.funds.remaining,v.funds.remaining);
  for(const skill of data.skills){assert.equal(map[`skills.${skill.id}.rank`],String(skill.level),skill.id);assert.equal(map[`skills.${skill.id}.base`],String(skill.base),skill.id);}
  assert.equal(new Set(fields.map(f=>f.name)).size,fields.length);assert.deepEqual(c,before);
});
let generated;
test('Vorlage bleibt unverändert; erzeugtes PDF hat echte editierbare Felder und übereinstimmende Widget-Werte',async()=>{
  const c=completeCharacter();c.equipment.custom=[{id:'custom-1',name:'Persönlicher Schlüssel',cost:15,quantity:2,notes:'Für die Werkstatt'}];
  c.lifepath.personality={choice:'custom',custom:'ÄÖÜ äöü ß - '+('Sehr langer eigener Lebensweg mit vollständigem Inhalt. '.repeat(9)).trim()};
  const source=Uint8Array.from(templateBytes),snapshot=structuredClone(c);
  generated=await generateCharacterSheet(c,rules,{templateBytes,fontBytes});
  assert.deepEqual(templateBytes,source);assert.deepEqual(c,snapshot);
  assert.equal((await PDFDocument.load(templateBytes)).getForm().getFields().length,0);
  const pdf=await PDFDocument.load(generated.bytes),form=pdf.getForm();assert.equal(pdf.getPageCount(),4);
  assert.equal(form.getTextField('identity.name').getText(),'Nyx Müller');for(const entry of evaluateCharacter(c,rules).skills)assert.equal(form.getTextField(`skills.${entry.id}.rank`).getText(),String(entry.level));assert.equal(form.getTextField('identity.rank').getText(),'4');
  assert.equal(form.getTextField('money.remaining').getText(),'2520 eb · Fashion-Zuschuss übrig: 800 eb');
  assert.equal(form.getFields().some(f=>f.getName().startsWith('appendix.')),false);
  assert.equal(form.getTextField('equipment.0.name').getText(),'2x Persönlicher Schlüssel');
  assert.equal(form.getTextField('equipment.0.notes').getText(),'Für die Werkstatt');
  assert.equal(form.getTextField('lifepath.personality').getText(),c.lifepath.personality.custom);
  for(const field of form.getFields()) {
    assert.equal(field.isReadOnly(),false);assert.equal(typeof (field.getText()??''),'string');
    for(const widget of field.acroField.getWidgets()) {assert.ok(widget.dict.get(PDFName.of('AP')));assert.equal(widget.dict.get(PDFName.of('Parent')).toString(),field.ref.toString());}
  }
});
test('Fehlende Daten und eine ausgetauschte Vorlage verhindern die Generierung',async()=>{
  await assert.rejects(generateCharacterSheet(createCharacter(rules),rules,{templateBytes,fontBytes}),/Namen|Rolle/);
  const wrong=await PDFDocument.create();wrong.addPage();await assert.rejects(generateCharacterSheet(completeCharacter(),rules,{templateBytes:await wrong.save(),fontBytes}),/Vorlage/);
});
test('Dateiname schützt Pfadgrenzen; Zeilenumbruch erhält auch sehr lange einzelne Wörter',()=>{
  assert.equal(characterSheetFilename('A/B\\C:*?<>|'),'RED-ABC-Charactersheet.pdf');assert.equal(characterSheetFilename('...'),'RED-Charakter-Charactersheet.pdf');
  const font={widthOfTextAtSize:(text,size)=>text.length*size};const word='x'.repeat(400);const lines=wrapPdfText(word,font,8,80);assert.equal(lines.join(''),word);assert.ok(lines.every(line=>line.length<=10));
});
test('HTTP-Fehler beim Vorlagenladen werden verständlich zurückgemeldet',async()=>{
  const original=globalThis.fetch;try{globalThis.fetch=async()=>({ok:false,status:404});await assert.rejects(loadPdfAsset('missing'),/404/);}finally{globalThis.fetch=original;}
});

test('Zusätzliche Sprachen und Gegenstände bleiben ohne Zusatzseiten in den bearbeitbaren Feldern erhalten',async()=>{
  const c=completeCharacter();c.skills.ranks.handgun-=4;
  c.skills.specialties=['Französisch','Portugiesisch','Italienisch','Polnisch'].map((name,i)=>({id:`specialty-${i+1}`,skill:'language',name,level:1}));
  c.equipment.custom=Array.from({length:20},(_,i)=>({id:`custom-${i+1}`,name:`Gegenstand Nummer ${i+1}`,cost:0,quantity:1,notes:`Notiz zum Gegenstand ${i+1}: vollständig erhalten.`}));
  assert.equal(characterSheetReadiness(c,rules).ready,true);
  const result=await generateCharacterSheet(c,rules,{templateBytes,fontBytes}),pdf=await PDFDocument.load(result.bytes);
  assert.equal(pdf.getPageCount(),4);
  const text=pdf.getForm().getFields().map(f=>f.getText()).join('\n');
  for(const word of ['Portugiesisch','Italienisch','Polnisch','Gegenstand Nummer 20','Notiz zum Gegenstand 20: vollständig erhalten.'])assert.ok(text.includes(word),word);
});
test('PNG-Porträt wird eingebettet und numerische Formularwerte bleiben exakt',async()=>{
  const c=completeCharacter();c.portrait='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=';
  const result=await generateCharacterSheet(c,rules,{templateBytes,fontBytes}),pdf=await PDFDocument.load(result.bytes),v=evaluateCharacter(c,rules);
  for(const entry of v.skills)for(const [suffix,value] of [['rank',entry.level],['attribute',entry.attributeValue],['base',entry.base]])assert.equal(pdf.getForm().getTextField(`skills.${entry.id}.${suffix}`).getText(),String(value));
  const original=await PDFDocument.load(templateBytes);assert.ok(pdf.getPage(0).node.Resources().lookup(PDFName.of('XObject')).keys().length>original.getPage(0).node.Resources().lookup(PDFName.of('XObject')).keys().length);
});

test('Papierfigur auf A4-Seite 3 nutzt das Galerieporträt oder ein eigenes Standardbild',async()=>{
  for (const role of rules.roles) {
    for (const gender of ['M','W']) assert.ok(standardPawnPortrait(role.id,gender)?.thumbnail);
  }
  const c=completeCharacter();
  const gallery=standardPawnPortrait(c.role,'M');
  const assets=entry=>readFile(new URL('../'+entry.thumbnail,import.meta.url));
  c.portrait='data:image/jpeg;base64,'+(await assets(gallery)).toString('base64');
  const fallback=await assets(standardPawnPortrait(c.role,'W'));
  const template=await PDFDocument.load(templateBytes);
  const images=page=>page.node.Resources().lookup(PDFName.of('XObject'));
  const newImage=(pdf,index)=>{
    const original=images(template.getPage(index)), current=images(pdf.getPage(index));
    const additions=current.keys().filter(key=>!original.has(key));
    assert.equal(additions.length,index===2?2:1);
    const refs=additions.map(key=>current.get(key).toString());
    assert.equal(new Set(refs).size,1);
    return refs[0];
  };
  for (const gallerySelected of [true,false]) {
    c.portraitSource=gallerySelected?gallery.id:null;
    const {bytes}=await generateCharacterSheet(c,rules,{templateBytes,fontBytes,pawnPortraitBytes:fallback});
    const pdf=await PDFDocument.load(bytes);
    assert.equal(pdf.getPageCount(),4);
    for (const page of pdf.getPages()) {
      const {width,height}=page.getSize();
      assert.ok(Math.abs(width*25.4/72-297)<0.01 && Math.abs(height*25.4/72-210)<0.01);
      assert.deepEqual(page.getCropBox(),page.getMediaBox());
    }
    assert.equal(newImage(pdf,0)===newImage(pdf,2),gallerySelected);
  }
});

test('Papierfigur begrenzt lange Namen auf zwei gespiegelte Zeilen innerhalb der Schnittkante',async()=>{
  const pdf=await PDFDocument.create(), font=await pdf.embedFont(StandardFonts.Helvetica);
  const width=297*72/25.4;
  const right=width-5*72/25.4, left=right-22*72/25.4;
  const drawn=[];
  const page={getWidth:()=>width,drawLine:()=>{},drawText:(text,options)=>drawn.push({text,...options})};
  for (const [name, expectedLines, truncated] of [
    ['Nyx Müller',1,false],
    ['Nyx Morgan von Hohenfels',2,false],
    ['W'.repeat(60),2,true],
    ['Alexandra „Stahlauge“ von Hohenfels-Winter',2,true]
  ]) {
    drawn.length=0;
    drawPawn(page,null,name,{font,rgb,degrees,wrap:wrapPdfText});
    const front=drawn.slice(1).filter(line=>!line.rotate);
    const back=drawn.slice(1).filter(line=>line.rotate?.angle===180);
    assert.equal(front.length,expectedLines,name);
    assert.deepEqual(front.map(line=>line.text),back.map(line=>line.text));
    assert.equal(front.at(-1).text.endsWith('…'),truncated,name);
    if (!truncated) assert.equal(front.map(line=>line.text).join(' '),name);
    for (const line of [...front,...back]) {
      const measured=font.widthOfTextAtSize(line.text,line.size);
      assert.ok((line.rotate ? line.x-measured : line.x)>=left);
      assert.ok((line.rotate ? line.x : line.x+measured)<=right);
    }
  }
});
