import test from 'node:test';
import assert from 'node:assert/strict';
import {completeCharacter,rules} from './helpers/pdf-fixture.mjs';
import {createLifepath,chooseLifepath,editLifepath,editLifepathCost,livingCosts,evaluateLifepath,validateLifepath} from '../js/lifepath.js';
import {DAILY_LIFEPATH_QUESTIONS,LIFEPATH_QUESTIONS} from '../js/lifepath-data.js';
import {renderLifepath,renderLifepathSummary,activeLifepathQuestion} from '../js/ui-lifepath.js';
import {characterSheetData} from '../js/pdf-character-data.js';
import {characterSheetFields} from '../js/pdf-character-layout.js';
import {validateCharacter} from '../js/model.js';
import {evaluateFunds} from '../js/economy.js';

test('Hintergrund bleibt kostenfreier Flair, aktuelles Leben hat sechs getrennte Budgetfragen',()=>{
 const c=completeCharacter();c.lifepath=createLifepath();const before=livingCosts(c);
 for(const q of LIFEPATH_QUESTIONS.filter(q=>q.group!=='daily'))chooseLifepath(c,q.id,'first');
 assert.deepEqual(livingCosts(c),before);assert.equal(DAILY_LIFEPATH_QUESTIONS.length,6);
 assert.ok(DAILY_LIFEPATH_QUESTIONS.every(q=>q.monthlyCosts.length===4&&q.monthlyCosts.every(n=>n!==0)));
 assert.equal(evaluateLifepath(c).answered,14);
 const html=renderLifepath(c,{lifepathSection:'flair'});
 assert.match(html,/Hintergrund &amp; Persönlichkeit/);assert.match(html,/nur Flair/);assert.match(html,/Weiter zum aktuellen Leben/);
 assert.equal(activeLifepathQuestion(c,{lifepathSection:'daily'}).id,'residence');
});

test('Monatsbudget addiert hohe Kosten transparent, trennt Einnahmen und bucht kein Startgeld',()=>{
 const c=completeCharacter(),before=structuredClone(c),funds=evaluateFunds(c,rules);
 let costs=livingCosts(c);assert.equal(costs.expenses,2700);assert.equal(costs.income,0);assert.equal(costs.total,2700);
 assert.deepEqual(c,before);
 chooseLifepath(c,'commitments','third');chooseLifepath(c,'pastime','fourth');
 costs=livingCosts(c);assert.equal(costs.expenses,1850);assert.equal(costs.income,350);assert.equal(costs.total,1500);
 assert.deepEqual(evaluateFunds(c,rules),funds);
});

test('Aufwendiger Lebensstil ergibt 7050 eb und fehlende Antworten bleiben offen statt kostenlos',()=>{
 const c=completeCharacter();for(const [id,choice] of [['residence','fourth'],['housing','fourth'],['lifestyle','fourth'],['dependents','third'],['commitments','second'],['pastime','third']])chooseLifepath(c,id,choice);
 assert.equal(livingCosts(c).total,7050);
 chooseLifepath(c,'pastime',null);assert.equal(livingCosts(c).total,null);assert.equal(livingCosts(c).complete,false);
});

test('Eigene Einnahmen werden validiert und eine Antwort ohne Monatsbetrag bleibt bearbeitbar',()=>{
 const c=completeCharacter();chooseLifepath(c,'dependents','custom');editLifepath(c,'dependents','Ich erhalte eine vereinbarte Unterstützung.');
 assert.equal(evaluateLifepath(c).answered,19);assert.equal(activeLifepathQuestion(c).id,'dependents');
 assert.match(evaluateLifepath(c).errors.join(' '),/monatlichen Betrag/);
 assert.ok(editLifepathCost(c,'dependents',-300).ok);assert.equal(livingCosts(c).income,300);
 assert.equal(evaluateLifepath(c).answered,20);assert.deepEqual(validateCharacter(c,rules),c);
 const before=structuredClone(c);
 for(const value of [0.5,NaN,Infinity,-1000001,1000001])assert.equal(editLifepathCost(c,'dependents',value).ok,false);
 assert.equal(editLifepathCost(c,'housing',-1).ok,false);assert.equal(editLifepathCost(c,'personality',1).ok,false);assert.deepEqual(c,before);
 assert.throws(()=>validateLifepath({...c.lifepath,dependents:{...c.lifepath.dependents,monthlyCost:-1000001}}));
});

test('Alte Speicherstände behalten Antworten und erhalten offene Zusatzfragen',()=>{
 const c=completeCharacter(),old=structuredClone(c.lifepath);for(const id of ['dependents','commitments','pastime'])delete old[id];
 const safe=validateLifepath(old);assert.deepEqual(safe.personality,c.lifepath.personality);assert.equal(safe.dependents.choice,null);
 assert.equal(livingCosts({...c,lifepath:safe}).total,null);
 const html=renderLifepathSummary({...c,lifepath:safe});assert.match(html,/Hintergrund &amp; Persönlichkeit/);assert.match(html,/Aktuelles Leben &amp; Monatsbudget/);
});

test('PDF übernimmt Verpflichtungen und Netto-Monatsbudget, ohne vorhandene Gegenstände zu ersetzen',()=>{
 const c=completeCharacter();chooseLifepath(c,'commitments','third');
 c.equipment.custom=[{id:'custom-1',name:'Andenken',quantity:1,cost:0,notes:'Persönlicher Gegenstand'}];
 const data=characterSheetData(c,rules),fields=characterSheetFields(data);
 assert.equal(data.livingCosts.income,200);
 assert.equal(fields.find(f=>f.name==='equipment.0.name').value,'1x Andenken');
 assert.ok(fields.some(f=>f.name.startsWith('equipment.')&&f.value.includes('Einnahme 200 eb')));
 assert.match(fields.find(f=>f.name==='fashion.outfit').value,/Nettobelastung/);
});
