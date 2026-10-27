import test from 'node:test';
import assert from 'node:assert/strict';
import {rules,completeCharacter} from './helpers/pdf-fixture.mjs';
import {renderSessionReport,sessionCyberState} from '../js/ui-session-report.js';
import {SESSION_PAGES,setSessionRewards,sessionActionPage} from '../js/session-guide.js';
import {createSessionDraft,previewSession,completeSession} from '../js/session-report.js';
import {quickAddCyberware} from '../js/cyberware-quick-add.js';
const character=()=>completeCharacter('rockerboy');
function setup(page='info',task=''){const c=character();return {c,state:{sessionDraft:createSessionDraft(c),sessionPage:page,sessionTask:task,sessionCyber:sessionCyberState()}};}
test('Begrüßung hat einen Startknopf und hält aktuellen Stand und Historie aufklappbar',()=>{
  const c=character(),html=renderSessionReport(c,rules,{});assert.match(html,/Session nachtragen/);assert.match(html,/<details id="session-start-values"><summary>/);assert.match(html,/<details id="session-archive-tools"/);assert.ok(!html.includes('data-session-form="gear"'));
});
test('Jede der sieben Stationen zeigt nur ihre eigene Frage und keine vollständige Formularwand',()=>{
  for(const [page] of SESSION_PAGES){const {c,state}=setup(page),html=renderSessionReport(c,rules,state);assert.equal((html.match(/class="panel session-question"/g)??[]).length,1,page);assert.ok(html.length<15000,page+' '+html.length);if(page!=='cyber')assert.ok(!html.includes('data-session-configurator'),page);if(page!=='review')assert.ok(!html.includes('data-session-complete'),page);}
});
test('Ausrüstung und Cyberware beginnen mit verständlichen Entscheidungen ohne Eingabeformulare',()=>{
  for(const page of ['inventory','cyber']){const {c,state}=setup(page),html=renderSessionReport(c,rules,state);assert.match(html,/data-session-task=/);assert.ok(!html.includes('data-session-form='),page);}
});
test('Beute hat keinen Preis, ein Kauf hat einen Preis und Verlust wählt nur vorhandene Gegenstände',()=>{
  const {c,state}=setup('inventory','gear-loot');let html=renderSessionReport(c,rules,state);assert.ok(!html.includes('name="price"'));assert.match(html,/Kostenlos erhalten/);
  state.sessionTask='gear-buy';html=renderSessionReport(c,rules,state);assert.match(html,/name="price"/);assert.match(html,/session-gear-options/);
  state.sessionTask='gear-lost';html=renderSessionReport(c,rules,state);assert.match(html,/Inventar ist leer/);assert.ok(!html.includes('session-gear-options'));
});
test('Geld und IP können wiederholt geändert werden, ohne doppelte Belohnungen anzulegen',()=>{
  const {c,state}=setup('rewards'),original=structuredClone(c);let d=state.sessionDraft;
  d=setSessionRewards(d,500,60);d=setSessionRewards(d,800,80);d=setSessionRewards(d,800,80);
  assert.equal(d.actions.length,1);const p=previewSession(c,rules,d);assert.ok(p.ok,p.errors.join(' '));assert.equal(p.after.cash,p.before.cash+800);assert.equal(p.after.ip,80);assert.deepEqual(c,original);
  d=setSessionRewards(d,0,0);assert.equal(previewSession(c,rules,d).after.cash,p.before.cash);assert.equal(d.actions.length,1);
});
test('Eine optionale Belohnungsnotiz bleibt auch erhalten, wenn sie vor dem Geldbetrag eingegeben wird',()=>{
  const {state}=setup('rewards');let d=setSessionRewards(state.sessionDraft,0,0,'Vom Fixer');d=setSessionRewards(d,1000,60);
  assert.equal(d.actions.length,1);assert.equal(d.actions[0].description,'Vom Fixer');assert.equal(d.actions[0].amount,1000);
});
test('Entfernen einer unabhängigen Buchung verschiebt keine Besitzreferenz im selben Report',()=>{
  const {c,state}=setup(),d=state.sessionDraft;d.actions=[{type:'money',category:'earned',amount:20,actionId:'money'},{type:'cyber-acquire',id:'cybereye',quantity:1,mode:'loot',actionId:'loot'}];
  let p=previewSession(c,rules,d);assert.ok(p.ok);const offer=quickAddCyberware(p.character,rules,[],'cybereye');d.actions.push({type:'cyber-install',actionId:'install',additions:offer.additions,owned:{[offer.additions[0].id]:p.character.campaign.cyberInventory[0].id},humanityLoss:7});
  assert.ok(previewSession(c,rules,d).ok);d.actions.shift();p=previewSession(c,rules,d);assert.ok(p.ok,p.errors.join(' '));assert.equal(p.character.cyberware.items.length,1);assert.equal(p.after.cash,2550);
});
test('Abschluss zeigt die Änderungen und den einzigen Speichern-Knopf erst auf Prüfen',()=>{
  const {c,state}=setup('review');state.sessionDraft=setSessionRewards(state.sessionDraft,100,60);const html=renderSessionReport(c,rules,state);assert.match(html,/Session abschließen und speichern/);assert.match(html,/2550 → <strong>2650/);assert.ok(!html.includes('data-session-form="gear"'));assert.ok(!html.includes('data-session-form="therapy"'));assert.ok(!html.includes('data-session-configurator'));
});
test('Bearbeiten einer Steigerung verwendet den Rang vor dieser Buchung',()=>{
  const {c,state}=setup('rewards','skill');state.sessionDraft=setSessionRewards(state.sessionDraft,0,60);state.sessionDraft.actions.push({type:'skill',id:'cybertech',to:1,actionId:'skill'});state.sessionEditing=state.sessionDraft.actions.length-1;state.sessionFields={type:'skill',task:'skill',values:{id:'cybertech',to:1}};
  const html=renderSessionReport(c,rules,state);assert.match(html,/Rang 0 → 1/);assert.ok(!html.includes('Rang 1 → 1'));
});
test('Alle Vorgänge bleiben ihrer Station zugeordnet; Regel- und Speicherlogik bleiben wirksam',()=>{
  for(const [type,page] of [['skill','rewards'],['role','rewards'],['health','health'],['injury','health'],['gear','inventory'],['armor','inventory'],['cyber-install','cyber'],['therapy','cyber'],['story','story']])assert.equal(sessionActionPage({type}),page);
  const {c,state}=setup('review');state.sessionDraft=setSessionRewards(state.sessionDraft,100,20);state.sessionDraft.actions.push({type:'skill',id:'cybertech',to:1,actionId:'skill'});const result=completeSession(c,rules,state.sessionDraft);assert.ok(result.ok,result.error);assert.equal(result.character.campaign.ip,0);assert.equal(result.character.campaign.history.length,1);assert.equal(c.campaign.history.length,0);
});
