import test from 'node:test';
import assert from 'node:assert/strict';
import {completeCharacter} from './helpers/pdf-fixture.mjs';
import {createLifepath,chooseLifepath,lifepathChoiceNavigation,livingCosts} from '../js/lifepath.js';
import {LIFEPATH_QUESTIONS} from '../js/lifepath-data.js';
import {activeLifepathQuestion,renderLifepath} from '../js/ui-lifepath.js';

test('Lore-Antworten öffnen niemals automatisch die Geldfragen',()=>{
  const c=completeCharacter();c.lifepath=createLifepath();const state={},budget=structuredClone(livingCosts(c));
  for(const q of LIFEPATH_QUESTIONS.filter(q=>q.group!=='daily')){
    assert.equal(activeLifepathQuestion(c,state).id,q.id);
    chooseLifepath(c,q.id,'first');Object.assign(state,lifepathChoiceNavigation(q.id,'first'));
    assert.notEqual(activeLifepathQuestion(c,state)?.group,'daily');
  }
  assert.equal(activeLifepathQuestion(c,state),null);assert.equal(activeLifepathQuestion(c),null);
  const html=renderLifepath(c,state);assert.match(html,/Lore abgeschlossen/);assert.match(html,/Monatsbudget bewusst öffnen/);
  assert.doesNotMatch(html,/data-lifepath-choice="security"/);assert.deepEqual(livingCosts(c),budget);
});
test('Geldfrage bleibt nach einer Auswahl stehen und geht erst nach ausdrücklichem Weiter zur nächsten',()=>{
  const c=completeCharacter();c.lifepath=createLifepath();const state={lifepathSection:'daily'};
  assert.equal(activeLifepathQuestion(c,state).id,'security');
  chooseLifepath(c,'security','third');Object.assign(state,lifepathChoiceNavigation('security','third'));
  assert.equal(activeLifepathQuestion(c,state).id,'security');
  const html=renderLifepath(c,state);assert.match(html,/Budgetantwort übernehmen/);assert.match(html,/lifepath-option-amount/);assert.match(html,/50 eb \/ Monat/);
  assert.doesNotMatch(html,/data-lifepath-choice="housing"/);
  state.lifepathQuestion=null;assert.equal(activeLifepathQuestion(c,state).id,'housing');
});
test('Bearbeiten und eigene Ideen behalten den richtigen Fragebogen',()=>{
  const c=completeCharacter(),state=lifepathChoiceNavigation('housing','custom');
  assert.equal(state.lifepathSection,'daily');assert.equal(activeLifepathQuestion(c,state).id,'housing');
  assert.equal(lifepathChoiceNavigation('personality','custom').lifepathSection,'flair');
  assert.throws(()=>lifepathChoiceNavigation('unbekannt','first'));
});
test('Antwortübersicht enthält zwei getrennte geschlossene Bereiche',()=>{
  const html=renderLifepath(completeCharacter(),{lifepathSection:'flair'});
  for(const section of ['flair','daily']){
    assert.match(html,new RegExp(`<details class="lifepath-summary-section" id="life-summary-${section}">`));
    assert.doesNotMatch(html,new RegExp(`<details[^>]*id="life-summary-${section}"[^>]*\\sopen`));
  }
});
