import test from 'node:test';
import assert from 'node:assert/strict';
import {completeCharacter,rules} from './helpers/pdf-fixture.mjs';
import {createCharacter} from '../js/model.js';
import {completionProgress} from '../js/completion-progress.js';
import {renderCompletion} from '../js/ui-completion.js';
import {characterSheetReadiness} from '../js/pdf-character-data.js';
import {resetSkillPoints} from '../js/skills.js';
import {createLifepath,chooseLifepath,editLifepath} from '../js/lifepath.js';
const find=(p,id)=>p.steps.find(step=>step.id===id);

test('Alle zehn vollständigen Rollen zeigen denselben Abschluss wie die PDF-Freigabe',()=>{
 for(const role of rules.roles){const c=completeCharacter(role.id),before=structuredClone(c),p=completionProgress(c,rules);assert.equal(p.ready,characterSheetReadiness(c,rules).ready,role.id);assert.equal(p.ready,true,role.id);assert.equal(p.complete,6);assert.equal(find(p,'review').label,'PDF bereit');assert.deepEqual(c,before);}
});
test('Leere Identität benennt Name und Rolle und verweist zum richtigen Eingabefeld',()=>{
 const p=completionProgress(createCharacter(rules),rules),identity=find(p,'identity');
 assert.equal(identity.complete,false);assert.deepEqual(identity.issues.map(i=>i.label),['Name fehlt','Rolle fehlt']);assert.equal(identity.issues[0].focus,'character-name');assert.equal(identity.issues[1].focus,'identity-roles');assert.equal(find(p,'attributes').complete,false);assert.equal(p.ready,false);
});
test('Fehlender Name wird nicht als offenes Attributbudget gezählt',()=>{
 const c=completeCharacter();c.name='';const p=completionProgress(c,rules);assert.equal(find(p,'identity').complete,false);assert.equal(find(p,'attributes').complete,true);assert.equal(find(p,'skills').complete,true);assert.equal(p.ready,false);
});
test('Freies Fertigkeitsbudget, Sprache und Heimat werden einzeln mit Sprungzielen gezeigt',()=>{
 const c=completeCharacter();resetSkillPoints(c,rules);c.skills.nativeLanguage.name='';c.skills.hometown='';const p=completionProgress(c,rules),skills=find(p,'skills');
 assert.equal(skills.complete,false);assert.ok(skills.issues.some(i=>i.label.includes('60')));assert.ok(skills.issues.some(i=>i.label==='Sprache fehlt'&&i.focus==='native-language-name'));assert.ok(skills.issues.some(i=>i.label==='Heimat fehlt'&&i.focus==='hometown-name'));assert.equal(p.ready,false);
});
test('Offene Attribute, Rollenpunkte und Medtech-Präparate bleiben echte Pflichtangaben',()=>{
 const c=completeCharacter('medtech');c.method='points';c.allocations.points={...rules.roles.find(r=>r.id==='medtech').recommendation.stats};c.allocations.points.INT--;c.rolePoints.pharmaceuticals=[];
 let p=completionProgress(c,rules);assert.equal(find(p,'attributes').complete,false);assert.ok(find(p,'attributes').issues[0].label.includes('1'));assert.equal(find(p,'role-abilities').complete,false);assert.equal(find(p,'role-abilities').issues[0].focus,'role-pharmaceuticals');
 const solo=completeCharacter();solo.rolePoints.solo.initiative=0;p=completionProgress(solo,rules);assert.equal(find(p,'role-abilities').complete,false);assert.equal(find(p,'role-abilities').issues[0].focus,'role-points');
});
test('Offene Lebenswegfragen und fehlende eigene Monatsbeträge bekommen direkte Ziele',()=>{
 const c=completeCharacter();c.lifepath=createLifepath();let p=completionProgress(c,rules);assert.equal(find(p,'lifepath').complete,false);assert.ok(find(p,'lifepath').issues[0].label.includes('21'));assert.equal(find(p,'lifepath').issues[0].life,'personality');
 const filled=completeCharacter();chooseLifepath(filled,'housing','custom');editLifepath(filled,'housing','Mein eigenes Zuhause');p=completionProgress(filled,rules);assert.ok(find(p,'lifepath').issues.some(i=>i.focus==='life-cost-housing'));assert.equal(find(p,'lifepath').complete,false);assert.equal(p.ready,false);
});
test('Fehlende optionale Ausrüstung ist ein Hinweis und blockiert niemals das PDF',()=>{
 const c=completeCharacter('netrunner'),p=completionProgress(c,rules),gear=find(p,'cyberware');assert.equal(gear.complete,true);assert.equal(gear.status,'warning');assert.ok(gear.notes.length>0);assert.ok(gear.notes.some(note=>note.tab==='netrunner'));assert.equal(p.ready,true);assert.match(renderCompletion(p,'cyberware'),/verhindern den PDF-Abschluss nicht/);
});
test('Offene Ausrüstungsentwürfe blockieren Anzeige und PDF gemeinsam ohne Änderungen am Charakter',()=>{
 const c=completeCharacter(),before=structuredClone(c);
 for(const state of [{cyberDraft:[{}]},{removingCyberware:'implant-1'},{customEquipmentDraft:{name:'Offener Entwurf',cost:'',quantity:'1',notes:''}}]){
  const p=completionProgress(c,rules,state);assert.equal(p.ready,false);assert.equal(find(p,'cyberware').complete,false);assert.equal(p.ready,characterSheetReadiness(c,rules,state).ready);assert.equal(find(p,'review').issues[0].view,'cyberware');
 }
 assert.deepEqual(c,before);
});
test('Abschlussanzeige ist lesbar, klickbar und gibt keine ungeschützten Eingaben aus',()=>{
 const c=completeCharacter();chooseLifepath(c,'housing','custom');editLifepath(c,'housing','<script>bad</script>');const p=completionProgress(c,rules),html=renderCompletion(p,'review');
 assert.match(html,/data-progress-step="lifepath"/);assert.match(html,/data-progress-life="housing"/);assert.match(html,/data-progress-focus="life-cost-housing"/);assert.doesNotMatch(html,/<script>/);assert.equal(renderCompletion(p,'session'),'');
});
