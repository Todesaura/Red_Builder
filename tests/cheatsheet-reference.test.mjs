import test from 'node:test';
import assert from 'node:assert/strict';
import {PDFDocument,rgb} from '../vendor/pdf-lib/pdf-lib.esm.min.js';
import fontkit from '../vendor/fontkit/fontkit.es.min.js';
import {completeCharacter,rules,fontBytes} from './helpers/pdf-fixture.mjs';
import {buyEquipment} from '../js/economy.js';
import {equipArmor} from '../js/armor.js';
import {addToCyberwareDraft,commitCyberwareDraft} from '../js/cyberware-draft.js';
import {characterSheetData} from '../js/pdf-character-data.js';
import {cheatsheetColumns,cheatsheetWeaponRows,drawCheatsheet,cheatsheetGerman} from '../js/pdf-cheatsheet.js';
const content=c=>JSON.stringify(cheatsheetColumns(characterSheetData(c,rules))).replaceAll('**','');
const buy=(c,...ids)=>{for(const id of ids)assert.ok(buyEquipment(c,rules,id).ok,id);};
const install=(c,id)=>{
  const draft=addToCyberwareDraft(c,rules,[],id,'neural');
  assert.ok(draft.ok);assert.ok(commitCyberwareDraft(c,rules,draft.additions).ok);
};

test('Netz-Proben nennen echte aktive Werte mit Rückfallwert; fremde Programme erscheinen nicht',()=>{
  const c=completeCharacter('netrunner');buy(c,'net-program-worm','net-program-see-ya','net-program-sword');
  const data=characterSheetData(c,rules),before=structuredClone(c),text=content(c);
  assert.match(text,/Hintertür \(Passwort\): 6 \+ 1W10 \(Wurm aktiv; sonst 4 \+ 1W10\)/);
  assert.match(text,/Wegfinder \(Aufbau\): 6 \+ 1W10 \(Späher aktiv; sonst 4 \+ 1W10\)/);
  assert.match(text,/1x Schwert \/ 5 \+ 1W10/);assert.doesNotMatch(text,/Bannhammer|Höllenblitz/);
  assert.match(text,/Kauf allein aktiviert nichts/);assert.match(text,/7 Integrität/);
  data.rank=7;const advanced=JSON.stringify(cheatsheetColumns(data));
  assert.match(advanced,/9 \+ 1W10.*Wurm aktiv/);assert.match(advanced,/4 Netz-Aktionen ODER/);
  assert.deepEqual(c,before);
});

test('Alle Rollen enthalten eigene Proben und Sonderregeln, ohne Tutorial-Grundlagen',()=>{
  const expected={rockerboy:/Fans gewinnen: 4 \+ 1W10/,solo:/Erster Treffer je Runde/,netrunner:/Stromstoß: 4 \+ 1W10/,tech:/Verbessern: 18 \+ 1W10/,medtech:/Chirurgie: 12 \+ 1W10/,media:/Passive Hinweise: 4 \+ 1W10/,exec:/Teammitglied handelt mit eigenen Werten/,lawman:/1W10 <= 4/,fixer:/Feilschen: \d+ \+ 1W10/,nomad:/Steuern: Land \d+ \+ 1W10/};
  for(const role of rules.roles){
    const c=completeCharacter(role.id),before=structuredClone(c),text=content(c);
    assert.match(text,expected[role.id],role.id);
    assert.doesNotMatch(text,/W10 bedeutet|Stelle sie dir als Gebäude|Beispiel für 3 Netz-Aktionen|noch nicht verwaltet|spätere Phase/);
    assert.deepEqual(c,before);
  }
});

test('Waffenbasen und gezielte Angriffe enthalten Präzision und Rüstungsabzug genau einmal',()=>{
  const c=completeCharacter('solo');c.rolePoints.solo={deflection:0,fumble:0,initiative:1,precision:1,weakness:0,threat:0};
  buy(c,'smg','armor-medium-jack-body');equipArmor(c,rules,'body','armor-medium-jack-body');
  const before=structuredClone(c),data=characterSheetData(c,rules),rows=cheatsheetWeaponRows(data);
  const handgun=data.skills.find(s=>s.id==='handgun').base;
  assert.equal(rows.find(r=>r.id==='smg').base,handgun+1);
  assert.equal(rows.find(r=>r.id==='smg').aimed,handgun+1-8);
  assert.match(content(c),/Unterdrücken \/ 10 Schuss: \d+ \+ 1W10/);
  assert.deepEqual(c,before);
});

test('Passive und bedingte Implantate zeigen verschiedene Bonuszustände, ohne Initiative umzuschreiben',()=>{
  for(const id of ['kerenzikov','sandevistan']){
    const c=completeCharacter();install(c,'neural-link');install(c,id);
    const data=characterSheetData(c,rules),before=structuredClone(c),text=content(c);
    if(id==='kerenzikov')assert.match(text,/Kerenzikov \/ passiv, bereits enthalten/);
    else {assert.match(text,/Sandevistan \/ bedingt, nicht eingerechnet/);assert.ok(text.includes(`Initiative ${data.derived.initiative+3} + 1W10`));}
    assert.deepEqual(c,before);
  }
});

test('Jede Rolle bleibt A4: vollständige Karten, Mindestschrift und keine Überschneidung mit Fußzeile',async()=>{
  const pdf=await PDFDocument.create();pdf.registerFontkit(fontkit);const font=await pdf.embedFont(fontBytes);
  for(const role of rules.roles){
    const c=completeCharacter(role.id);buy(c,'medium-pistol','light-melee','armor-light-jack-body');
    if(role.id==='netrunner'){
      buy(c,'net-program-worm','net-program-see-ya','net-program-armor','net-program-sword');
      install(c,'neural-link');install(c,'interface-plugs');
    }
    const before=structuredClone(c),data=characterSheetData(c,rules),result=drawCheatsheet(pdf,data,{font,rgb,text:String});
    assert.deepEqual([result.page.getWidth(),result.page.getHeight()].sort((a,b)=>a-b),[595.28,841.89]);
    assert.ok(result.layout.fontSize>=8.6);
    for(const bound of result.layout.bounds){assert.ok(bound.bottom>=44,role.id+' / '+bound.title);assert.ok(bound.top>bound.bottom);}
    for(const column of [0,1,2]){
      const bounds=result.layout.bounds.filter(b=>b.column===column);
      for(let i=1;i<bounds.length;i++)assert.ok(bounds[i].top<=bounds[i-1].bottom);
    }
    const roleCard=result.layout.bounds.find(b=>b.title.toUpperCase().includes(cheatsheetGerman(data.ability).toUpperCase())||b.title.includes('SCHNITTSTELLE'));
    assert.equal(roleCard.column,1,role.id);assert.deepEqual(c,before);
  }
});

test('Nur gekaufte Netz-Angreifer und selbstständiges ICE bekommen passende Angriffswerte',()=>{
  const c=completeCharacter('netrunner');buy(c,'net-ice-killer','net-program-hellbolt','net-program-armor');
  const text=content(c);
  assert.match(text,/Höllenblitz \/ 6 \+ 1W10/);assert.match(text,/Mörder: Angriff 6 \+ 1W10/);
  assert.match(text,/keinen Schnittstellenrang addieren/);assert.match(text,/Panzerung: Hirnschaden um 4 senken/);
  assert.match(text,/1x\/Kopie\/Einsatz/);assert.doesNotMatch(text,/Wurm aktiv|Späher aktiv/);
});
