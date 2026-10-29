import test from 'node:test';
import assert from 'node:assert/strict';
import { completeCharacter,rules } from './helpers/pdf-fixture.mjs';
import { createCharacter,validateCharacter } from '../js/model.js';
import { resetSkillPoints,skillPointsRemaining,skillValidation,assignSkill } from '../js/skills.js';
import { automaticallyRecommendSkills } from '../js/skill-recommendations.js';
import { characterSheetReadiness } from '../js/pdf-character-data.js';
import { archivedCharacters,readArchivedCharacter,switchCharacter,resetCharacterUi } from '../js/character-library.js';
import { STORAGE_KEY,loadCharacter } from '../js/storage.js';
import { evaluateCharacter } from '../js/rules.js';
import { explainEmpathy } from '../js/explanations.js';
import { addToCyberwareDraft,commitCyberwareDraft } from '../js/cyberware-draft.js';
function memory() {
  const data=new Map();return {data,get length(){return data.size;},key:i=>[...data.keys()][i],getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value)};
}
test('Reset gibt nach Pflichtwerten exakt 60 Punkte frei, erhält Sprache/Namen und setzt auch Spezialränge zurück',()=>{
  const c=completeCharacter('tech');c.skills.specialties.push({id:'specialty-40',skill:'science',name:'Chemie',level:0});
  const other=structuredClone({...c,skills:null});resetSkillPoints(c,rules);
  assert.ok(rules.skillRules.skills.filter(s=>!s.specialized).every(s=>c.skills.ranks[s.id]===s.min));assert.ok(c.skills.specialties.every(item=>item.level===0));
  assert.equal(c.skills.nativeLanguage.level,4);assert.equal(c.skills.nativeLanguage.name,'Deutsch');assert.equal(c.skills.hometown,'Watson');
  assert.equal(c.skills.specialties.at(-1).name,'Chemie');assert.equal(skillPointsRemaining(c,rules),60);assert.deepEqual({...c,skills:null},other);
  assert.deepEqual(validateCharacter(c,rules),c);
});
test('Bewusster Reset behält nach Laden und Rollenwechsel die Pflichtwerte, statt automatisch neu befüllt zu werden',()=>{
  const c=completeCharacter();resetSkillPoints(c,rules);const storage=memory();storage.setItem(STORAGE_KEY,JSON.stringify(c));
  const loaded=loadCharacter(rules,storage).character;loaded.role='tech';assert.equal(automaticallyRecommendSkills(loaded,rules),false);
  assert.equal(skillPointsRemaining(loaded,rules),60);assert.ok(rules.skillRules.skills.filter(s=>!s.specialized).every(s=>loaded.skills.ranks[s.id]===s.min));
});
test('Alte Nullränge bleiben ladbar; neue Eingaben können Pflichtfertigkeiten nicht absenken',()=>{
  const c=completeCharacter();resetSkillPoints(c,rules);
  for(const skill of rules.skillRules.skills.filter(s=>!s.specialized))c.skills.ranks[skill.id]=0;
  for(const skill of rules.skillRules.skills.filter(s=>!s.specialized&&s.min===0&&s.cost===1).slice(0,13)) c.skills.ranks[skill.id]=6;
  c.skills.ranks[rules.skillRules.skills.find(s=>!s.specialized&&s.min===0&&s.cost===2).id]=4;
  assert.equal(skillPointsRemaining(c,rules),0);assert.equal(characterSheetReadiness(c,rules).ready,false);
  assert.equal(skillValidation(c,rules).filter(error=>error.includes('mindestens Rang 2')).length,13);
  const free=completeCharacter();assert.equal(assignSkill(free,rules,'athletics',0).ok,false);assert.ok(!skillValidation(free,rules).some(error=>error.includes('Athletik')));
});
test('Aktueller EMP-Fall ist 40 minus 44 Menschlichkeit, ohne kumulative Rechenfehler',()=>{
  const c=completeCharacter('tech');let draft=[];
  for(const [id,location] of [['cyberarm','arm-right'],['perfect-fit','leg-left'],['perfect-fit','leg-right'],['cybereye','eye-right'],['micro-optics','eye-right'],['cybereye','eye-left'],['tool-hand','arm-left'],['muscle-bone-lace','internal']]) {
    const result=addToCyberwareDraft(c,rules,draft,id,location);assert.equal(result.ok,true,result.error);draft=result.additions;
  }
  assert.ok(commitCyberwareDraft(c,rules,draft).ok);
  for(let i=0;i<4;i++) {
    const v=evaluateCharacter(c,rules);assert.equal(v.cyberware.start,40);assert.equal(v.cyberware.loss,44);assert.equal(v.cyberware.current,-4);assert.equal(v.attributes.EMP.effective,0);
    assert.match(explainEmpathy(v),/Implantatverlust: 44/);assert.match(explainEmpathy(v),/Übrig: -4/);
  }
  const fresh=createCharacter(rules);fresh.role='tech';assert.equal(evaluateCharacter(fresh,rules).attributes.EMP.effective,4);
});
test('Neuer Charakter archiviert den vollständigen alten Stand und trennt alle Käufe und Implantate',()=>{
  const old=completeCharacter();old.equipment.custom=[{id:'custom-1',name:'Altlast',cost:50,quantity:1,notes:'Behalten'}];
  old.cyberware.items=[{id:'implant-1',catalogId:'cyberarm',location:'arm-right',parent:null}];old.cyberware.removed=[{catalogId:'neutongue',fee:100}];
  const original=structuredClone(old),storage=memory(),fresh=createCharacter(rules);storage.setItem(STORAGE_KEY,JSON.stringify(old));
  const result=switchCharacter(old,fresh,rules,storage);assert.ok(result.ok);assert.deepEqual(old,original);
  assert.deepEqual(JSON.parse(storage.getItem(STORAGE_KEY)),fresh);assert.equal(result.character.cyberware.items.length,0);assert.equal(result.character.cyberware.removed.length,0);assert.equal(result.character.equipment.custom.length,0);
  const list=archivedCharacters(rules,storage);assert.equal(list.length,1);assert.equal(list[0].name,old.name);assert.deepEqual(readArchivedCharacter(list[0].key,rules,storage),old);
  assert.ok(switchCharacter(fresh,readArchivedCharacter(list[0].key,rules,storage),rules,storage).ok);assert.deepEqual(JSON.parse(storage.getItem(STORAGE_KEY)),old);
});
test('Scheiternde Sicherung verhindert Charakterwechsel und lässt den aktiven Spielstand bestehen',()=>{
  const old=completeCharacter(),fresh=createCharacter(rules),storage=memory();storage.setItem(STORAGE_KEY,JSON.stringify(old));
  const before=storage.getItem(STORAGE_KEY);const broken={...storage,setItem:()=>{throw new Error('Quota');}};
  assert.equal(switchCharacter(old,fresh,rules,broken).ok,false);assert.equal(storage.getItem(STORAGE_KEY),before);
  assert.deepEqual(archivedCharacters(rules,{get length(){throw new Error('denied');}}),[]);
  assert.equal(readArchivedCharacter('foreign-key',rules,storage),null);
});
test('Mehrere Charaktere bleiben einzeln erhalten; kaputte Archive werden nicht geöffnet',()=>{
  const storage=memory(),first=completeCharacter(),second=completeCharacter('tech');second.name='Zweiter';
  switchCharacter(first,second,rules,storage);switchCharacter(second,createCharacter(rules),rules,storage);
  storage.setItem('red-builder.character.archive.broken','not-json');
  const list=archivedCharacters(rules,storage);assert.equal(list.length,2);assert.deepEqual(new Set(list.map(item=>item.name)),new Set([first.name,second.name]));
  assert.equal(readArchivedCharacter('red-builder.character.archive.broken',rules,storage),null);
});
test('Charakterwechsel entfernt auch unbestätigte UI-Entwürfe und Filter',()=>{
  const state={cyberDraft:[{catalogId:'cyberarm'}],selectedCyberware:'cyberarm',removingCyberware:'implant-1',customEquipmentDraft:{name:'Altes Objekt'},skillSearch:'Pistole',customSkillFields:['old'],equipmentTab:'weapons',pdfExportMessage:'Alter Export'};
  const fresh=createCharacter(rules);resetCharacterUi(state,fresh);
  assert.equal(state.character,fresh);assert.deepEqual(state.cyberDraft,[]);assert.equal(state.removingCyberware,null);assert.equal(state.customEquipmentDraft.name,'');assert.equal(state.skillSearch,'');assert.equal(state.equipmentTab,'cyberware');assert.equal(state.pdfExportMessage,'');
});
