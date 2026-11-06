import test from 'node:test';
import assert from 'node:assert/strict';
import {completeCharacter,rules} from './helpers/pdf-fixture.mjs';
import {createLifepath,chooseLifepath,livingCosts,evaluateLifepath,validateLifepath} from '../js/lifepath.js';
import {DAILY_LIFEPATH_QUESTIONS,LIFEPATH_QUESTIONS} from '../js/lifepath-data.js';
import {renderLifepath,renderLifepathSummary,activeLifepathQuestion} from '../js/ui-lifepath.js';
import {characterSheetData} from '../js/pdf-character-data.js';
import {characterSheetFields} from '../js/pdf-character-layout.js';
import {validateCharacter} from '../js/model.js';
import {evaluateFunds} from '../js/economy.js';

test('Hintergrund bleibt kostenfreier Flair, aktuelles Leben hat sieben getrennte Budgetfragen',()=>{
 const c=completeCharacter();c.lifepath=createLifepath();const before=livingCosts(c);
 for(const q of LIFEPATH_QUESTIONS.filter(q=>q.group!=='daily'))chooseLifepath(c,q.id,'first');
 assert.deepEqual(livingCosts(c),before);assert.equal(DAILY_LIFEPATH_QUESTIONS.length,7);
 assert.ok(DAILY_LIFEPATH_QUESTIONS.every(q=>q.monthlyCosts.length===q.options.length&&q.monthlyCosts.every(Number.isSafeInteger)));
 assert.equal(evaluateLifepath(c).answered,14);
 const html=renderLifepath(c,{lifepathSection:'flair'});
 assert.match(html,/Hintergrund &amp; Persönlichkeit/);assert.match(html,/nur Flair/);assert.match(html,/>Finanzen →<\/button>/);
 assert.equal(activeLifepathQuestion(c,{lifepathSection:'daily'}).id,'security');
});

test('Monatsbudget berücksichtigt Nullkosten transparent, trennt Einnahmen und bucht kein Startgeld',()=>{
 const c=completeCharacter(),before=structuredClone(c),funds=evaluateFunds(c,rules);
 let costs=livingCosts(c);assert.equal(costs.expenses,100);assert.equal(costs.income,0);assert.equal(costs.total,100);
 assert.deepEqual(c,before);
 chooseLifepath(c,'commitments','fifth');
 costs=livingCosts(c);assert.equal(costs.expenses,100);assert.equal(costs.income,200);assert.equal(costs.total,-100);
 assert.deepEqual(evaluateFunds(c,rules),funds);
});

test('Aufwendiger Lebensstil ergibt 5250 eb und fehlende Antworten bleiben offen statt kostenlos',()=>{
 const c=completeCharacter();for(const [id,choice] of [['security','sixth'],['neighborhood','fourth'],['housing','eighth'],['lifestyle','fourth'],['dependents','sixth'],['commitments','third'],['pastime','sixth']])chooseLifepath(c,id,choice);
 assert.equal(livingCosts(c).total,5250);
 chooseLifepath(c,'pastime',null);assert.equal(livingCosts(c).total,null);assert.equal(livingCosts(c).complete,false);
});

test('Frühere freie Finanzantworten bleiben erhalten; neue Antworten haben feste Monatsbeträge',()=>{
 const c=completeCharacter();
 assert.equal(chooseLifepath(c,'dependents','custom').ok,false);
 c.lifepath.dependents={choice:'custom',custom:'Ich erhalte eine vereinbarte Unterstützung.',revision:2};
 assert.equal(evaluateLifepath(c).answered,20);assert.equal(activeLifepathQuestion(c,{lifepathSection:'daily'}).id,'dependents');
 assert.match(evaluateLifepath(c).errors.join(' '),/monatlicher Betrag/);
 let html=renderLifepath(c,{lifepathSection:'daily'});
 assert.match(html,/Betrag offen/);assert.doesNotMatch(html,/Eigene Idee|data-lifepath-cost/);
 c.lifepath.dependents.monthlyCost=-300;
 assert.equal(livingCosts(c).income,300);
 assert.equal(evaluateLifepath(c).answered,21);assert.deepEqual(validateCharacter(c,rules),c);
 html=renderLifepath(c,{lifepathSection:'daily',lifepathQuestion:'dependents'});
 assert.match(html,/\+300 eb Einnahme/);
 assert.throws(()=>validateLifepath({...c.lifepath,dependents:{...c.lifepath.dependents,monthlyCost:-1000001}}));
 assert.ok(chooseLifepath(c,'housing','eleventh').ok);
 assert.equal(livingCosts(validateCharacter(c,rules)).housing,3000);
});

test('Alte Speicherstände behalten Antworten und erhalten offene Zusatzfragen',()=>{
 const c=completeCharacter(),old=structuredClone(c.lifepath);for(const id of ['dependents','commitments','pastime'])delete old[id];
 const safe=validateLifepath(old);assert.deepEqual(safe.personality,c.lifepath.personality);assert.equal(safe.dependents.choice,null);
 assert.equal(livingCosts({...c,lifepath:safe}).total,null);
 const html=renderLifepathSummary({...c,lifepath:safe});assert.match(html,/Hintergrund &amp; Persönlichkeit/);assert.match(html,/<h4>Finanzen<\/h4>/);
});

test('PDF übernimmt Verpflichtungen und Netto-Monatsbudget, ohne vorhandene Gegenstände zu ersetzen',()=>{
 const c=completeCharacter();chooseLifepath(c,'commitments','fifth');
 c.equipment.custom=[{id:'custom-1',name:'Andenken',quantity:1,cost:0,notes:'Persönlicher Gegenstand'}];
 const data=characterSheetData(c,rules),fields=characterSheetFields(data);
 assert.equal(data.livingCosts.income,200);
 assert.equal(fields.find(f=>f.name==='equipment.0.name').value,'1x Andenken');
 assert.ok(fields.some(f=>f.name.startsWith('equipment.')&&f.value.includes('Einnahme 200 eb')));
 assert.match(fields.find(f=>f.name==='fashion.outfit').value,/Nettobelastung/);
});
