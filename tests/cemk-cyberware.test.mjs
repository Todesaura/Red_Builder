import test from 'node:test';
import assert from 'node:assert/strict';
import {rules,completeCharacter,templateBytes,fontBytes} from './helpers/pdf-fixture.mjs';
import {evaluateCharacter} from '../js/rules.js';
import {validateCharacter} from '../js/model.js';
import {quickAddCyberware,cyberwareQuickOffer} from '../js/cyberware-quick-add.js';
import {commitCyberwareDraft} from '../js/cyberware-draft.js';
import {removeCyberware,installationErrors} from '../js/cyberware.js';
import {installedCyberWeapons} from '../js/cyberware-weapons.js';
import {characterSheetData} from '../js/pdf-character-data.js';
import {characterSheetFields} from '../js/pdf-character-layout.js';
import {cheatsheetWeaponRows,cheatsheetColumns} from '../js/pdf-cheatsheet.js';
import {generateCharacterSheet} from '../js/pdf-character.js';
import {equipmentWarnings} from '../js/equipment-warnings.js';
import {buyEquipment} from '../js/economy.js';
import {catalogEntries} from '../js/cyberware-ui-model.js';
import {PDFDocument} from '../vendor/pdf-lib/pdf-lib.esm.min.js';
const richRules={...rules,equipmentRules:{...rules.equipmentRules,startingCash:20000}};
function add(c,id,r=rules,location=null){const result=quickAddCyberware(c,r,[],id,location);assert.ok(result.ok,result.error);assert.ok(commitCyberwareDraft(c,r,result.additions).ok);return result;}

test('CEMK-Optionen: Preis, Slots, Menschlichkeit und automatisch bezahlter Cyberarm',()=>{
  for(const [id,cost,slots,loss] of [['mantis-blade',500,2,14],['gorilla-arm',1000,2,14],['monowire',1000,2,14]]){
    const c=completeCharacter(),before=structuredClone(c),offer=quickAddCyberware(c,rules,[],id),d=rules.cyberwareRules.items.find(i=>i.id===id);
    assert.ok(offer.ok,offer.error);assert.deepEqual(c,before);assert.equal(offer.cost,cost+500);assert.equal(d.slots,slots);assert.equal(d.humanity,loss);
    assert.ok(commitCyberwareDraft(c,rules,offer.additions).ok);const v=evaluateCharacter(c,rules);
    assert.equal(v.cyberware.loss,loss+7);assert.equal(v.funds.remaining,2550-cost-500);
    assert.deepEqual(validateCharacter(c,rules).cyberware,c.cyberware);
  }
});
test('Bestehender Cyberarm wird wiederverwendet; fehlendes Budget hinterlässt keinen Entwurf',()=>{
  const c=completeCharacter();add(c,'cyberarm');const offer=quickAddCyberware(c,rules,[],'monowire');assert.ok(offer.ok);assert.equal(offer.cost,1000);assert.equal(offer.additions.length,1);
  const poor={...rules,equipmentRules:{...rules.equipmentRules,startingCash:900}},empty=completeCharacter(),before=structuredClone(empty);
  const blocked=cyberwareQuickOffer(empty,poor,[],'mantis-blade');assert.equal(blocked.ok,false);assert.equal(blocked.cost,1000);assert.deepEqual(empty,before);
});
test('Paarfunktionen verlangen zwei verschiedene Arme; pro Arm nur eine gleiche Option',()=>{
  for(const id of ['mantis-blade','gorilla-arm']){
    const c=completeCharacter();add(c,id,richRules,'arm-left');assert.equal(installedCyberWeapons(c,richRules,evaluateCharacter(c,richRules))[0].item.paired,false);
    const offer=quickAddCyberware(c,richRules,[],id);assert.ok(offer.ok);assert.equal(offer.location,'arm-right');assert.equal(offer.cost,(id==='mantis-blade'?500:1000)+500);
    assert.ok(commitCyberwareDraft(c,richRules,offer.additions).ok);assert.ok(installedCyberWeapons(c,richRules,evaluateCharacter(c,richRules)).every(e=>e.item.paired));
    const left=c.cyberware.items.find(e=>e.catalogId===id);const bad={...c.cyberware,items:[...c.cyberware.items,{...left,id:'implant-99'}]};assert.match(installationErrors(bad,richRules.cyberwareRules).join(' '),/einmal pro Arm/);
  }
});
test('Gorilla-Arme ändern keine echte KRA/TP/Todesrettung; exzellente Qualität nur im Angriff',()=>{
  const c=completeCharacter(),before=evaluateCharacter(c,rules);add(c,'gorilla-arm');const after=evaluateCharacter(c,rules),data=characterSheetData(c,rules);
  assert.deepEqual(after.attributes.BODY,before.attributes.BODY);for(const id of ['hp','death'])assert.deepEqual(after.derived.find(d=>d.id===id),before.derived.find(d=>d.id===id));
  const rows=cheatsheetWeaponRows(data),skill=after.skills.find(s=>s.id==='melee-weapon');assert.equal(rows[0].base,skill.base+1);assert.equal(rows[1].base,skill.base+1-8);
  assert.match(characterSheetFields(data).find(f=>f.name==='weapons.0.notes').value,new RegExp('Basis '+(skill.base+1)));
  assert.ok(!equipmentWarnings(c,rules,after).some(w=>w.id==='physical-weapon'));
});
test('Monodraht hat 6 m Reichweite und kritische Auswahl; Waffen auf Seite 1 und Cheatsheet',()=>{
  const c=completeCharacter();add(c,'monowire');const data=characterSheetData(c,rules),rows=cheatsheetWeaponRows(data),text=JSON.stringify(cheatsheetColumns(data));
  assert.equal(rows[0].reach,6);assert.equal(rows[1].reach,6);assert.equal(rows[0].base,data.skills.find(s=>s.id==='melee-weapon').base);assert.equal(rows[0].damage,'3W6');assert.equal(rows[0].rof,2);
  assert.match(text,/zweimal auf der Verletzungstabelle/);assert.match(text,/Zusatzschaden nur einmal/);assert.match(characterSheetFields(data).find(f=>f.name==='weapons.0.name').value,/Monodraht/);
});
test('Ausbau wahrt Abhängigkeiten und entfernt Waffen; ungültige Pläne geben keine Cyberwaffen',()=>{
  const c=completeCharacter();c.campaign.sessionUnlocked=true;add(c,'mantis-blade');const base=c.cyberware.items.find(e=>e.catalogId==='cyberarm'),option=c.cyberware.items.find(e=>e.catalogId==='mantis-blade'),stats=Object.fromEntries(Object.entries(evaluateCharacter(c,rules).attributes).map(([k,v])=>[k,v.base]));
  assert.equal(removeCyberware(c,rules,base.id,stats,0).ok,false);
  const invalid=structuredClone(c);invalid.cyberware.items.find(e=>e.catalogId==='mantis-blade').parent=null;assert.deepEqual(installedCyberWeapons(invalid,rules,evaluateCharacter(invalid,rules)),[]);
  assert.ok(removeCyberware(c,rules,option.id,stats,50).ok);assert.equal(evaluateCharacter(c,rules).cyberware.loss,21);assert.deepEqual(characterSheetData(c,rules).weapons,[]);
});
test('Cyberwaffen überschreiten keine tragbaren Waffenlimits; volle Armkapazität bleibt gesperrt',()=>{
  const c=completeCharacter();add(c,'mantis-blade',richRules,'arm-left');add(c,'gorilla-arm',richRules,'arm-left');
  const before=structuredClone(c);assert.equal(quickAddCyberware(c,richRules,[],'monowire','arm-left').ok,false);assert.deepEqual(c,before);
  const offer=quickAddCyberware(c,richRules,[],'monowire');assert.ok(offer.ok);assert.equal(offer.location,'arm-right');
  for(const id of ['heavy-pistol','light-melee','assault-rifle'])assert.ok(buyEquipment(c,richRules,id).ok);
  assert.deepEqual(evaluateCharacter(c,richRules).loadout.counts,{grenades:0,oneHanded:2,twoHanded:1});
  assert.deepEqual(evaluateCharacter(c,richRules).loadout.errors,[]);
});
test('Deutsche und englische Suchnamen finden die passenden Cyberwaffen',()=>{
  const c=completeCharacter(),v=evaluateCharacter(c,rules);
  for(const [query,id] of [['Monowires','monowire'],['Gorillaarme','gorilla-arm'],['Mantis Blade','mantis-blade']]){
    assert.deepEqual(catalogEntries(c,rules,{cyberSearch:query,cyberCategory:'limbs',cyberSort:'name',onlyInstallable:false},v).map(i=>i.id),[id]);
  }
});
test('Alle Rollen exportieren mit jeder CEMK-Waffe genau ein A4-Cheatsheet ohne Datenänderung',async()=>{
  for(const role of rules.roles)for(const id of ['mantis-blade','gorilla-arm','monowire']){
    const c=completeCharacter(role.id);add(c,id);const before=structuredClone(c),result=await generateCharacterSheet(c,rules,{templateBytes,fontBytes}),pdf=await PDFDocument.load(result.bytes);
    assert.equal(pdf.getPageCount(),4,role.id+' / '+id);const p=pdf.getPages()[3],dimensions=[p.getWidth(),p.getHeight()].sort((a,b)=>a-b);assert.ok(Math.abs(dimensions[0]-595.28)<1);assert.ok(Math.abs(dimensions[1]-841.89)<1);assert.deepEqual(c,before);
    assert.match(pdf.getForm().getTextField('weapons.0.name').getText(),/Mantisklinge|Gorilla-Arm|Monodraht/);
  }
});
