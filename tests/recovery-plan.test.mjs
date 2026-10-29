import test from 'node:test';
import assert from 'node:assert/strict';
import {completeCharacter,rules} from './helpers/pdf-fixture.mjs';
import {recoveryPlan,recoveryDate,SIDE_JOBS} from '../js/recovery-plan.js';
import {renderRecoveryPlanner,renderRecoveryResult,recoveryInput} from '../js/ui-recovery-plan.js';
import {createSessionDraft,previewSession,completeSession,sessionSnapshot} from '../js/session-report.js';
import {renderSessionReport} from '../js/ui-session-report.js';
import {livingCosts} from '../js/lifepath.js';
import {bindSessionEvents} from '../js/session-events.js';
const date='2026-12-29';
function wounded(missing=18){const c=completeCharacter();const max=sessionSnapshot(c,rules).maxHp;c.campaign.hp=max-missing;c.campaign.stabilized=true;return c;}
const config={care:'none',stabilized:'yes',members:[]};

test('Erholung rundet volle Ruhetage auf und berücksichtigt den spätesten Gruppentermin',()=>{
  const c=wounded(),before=structuredClone(c),p=recoveryPlan(c,rules,{...config,members:[{name:'Langsam',days:12},{name:'Gesund',days:0}]},date);
  assert.ok(p.ok,p.errors.join(' '));assert.equal(p.rate,7);assert.equal(p.healingDays,3);assert.equal(p.ownDays,3);
  assert.equal(p.readyDate,'2027-01-01');assert.equal(p.groupDate,'2027-01-10');assert.equal(p.freeDays,9);assert.equal(p.weeks,1);
  assert.equal(p.members[1].freeDays,12);assert.equal(p.members[1].weeks,1);assert.deepEqual(c,before);
});
test('Klinik rechnet höchsten SG einmal ab; OP-Zeit und Krankenhausnächte bleiben separat',()=>{
  const c=wounded();c.campaign.stabilized=false;
  const p=recoveryPlan(c,rules,{care:'surgery',dv:17,procedures:3,stay:'hospital',nights:3,extraCost:200,extraDays:8},date);
  assert.ok(p.ok);assert.equal(p.medical,1000);assert.equal(p.hours,12);assert.equal(p.hospital,300);assert.equal(p.fees,1500);assert.equal(p.ownDays,8);
  assert.equal(recoveryPlan(c,rules,{care:'treatment',dv:10,procedures:1},date).medical,50);
  c.campaign.hp=Math.ceil(sessionSnapshot(c,rules).maxHp/2);
  assert.equal(recoveryPlan(c,rules,{care:'treatment',dv:10,procedures:1},date).medical,100);
  c.campaign.hp=1;
  assert.equal(recoveryPlan(c,rules,{care:'treatment',dv:15,procedures:1},date).medical,500);
});
test('Unbehandelte kritische Verletzungen, Quick Fix und fehlende Stabilisierung sind keine Einsatzbereitschaft',()=>{
  const c=wounded();c.campaign.stabilized=false;
  assert.equal(recoveryPlan(c,rules,{care:'none'},date).ok,false);
  assert.ok(recoveryPlan(c,rules,{care:'stabilize'},date).ok);
  c.campaign.hp=0;assert.equal(recoveryPlan(c,rules,{care:'surgery',dv:17,procedures:1},date).ok,false);
  c.campaign.hp=sessionSnapshot(c,rules).maxHp;
  c.campaign.injuries=[{id:'test',name:'Gebrochenes Bein',status:'quickfix',notes:''}];
  assert.equal(recoveryPlan(c,rules,{care:'none'},date).ok,false);
  assert.equal(recoveryPlan(c,rules,{care:'treated'},date).ok,false);
  assert.equal(recoveryPlan(c,rules,{care:'surgery',dv:17,procedures:1},date).ok,true);
});

test('Gruppenzeilen und Zurück-Schaltflächen werden vom Session-Handler verarbeitet',()=>{
  const oldWindow=globalThis.window,oldFormData=globalThis.FormData,listeners={},c=wounded(),state={character:c,sessionDraft:createSessionDraft(c),sessionTask:''};
  let refreshed=0;
  const form={fields:[['phase','crew'],['memberName0','Rook'],['memberDays0','12'],['memberName1',''],['memberDays1','']],querySelectorAll:()=>[{},{}]};
  const root={addEventListener:(type,fn)=>listeners[type]=fn,querySelector:()=>form};
  globalThis.window={addEventListener:()=>{}};
  globalThis.FormData=class {constructor(f){this.values=f.fields;}[Symbol.iterator](){return this.values[Symbol.iterator]();}};
  try{
    bindSessionEvents(root,state,rules,()=>refreshed++);
    const button={dataset:{recoveryMemberAdd:''},closest:()=>null,hasAttribute:name=>name==='data-recovery-member-add'};
    const event={target:{closest:()=>button},preventDefault(){},stopImmediatePropagation(){}};
    listeners.click(event);assert.equal(refreshed,1);assert.equal(state.sessionFields.values.memberName2,'');assert.equal(state.sessionFields.values.memberDays0,'12');
    button.dataset={recoveryStage:'medical'};button.hasAttribute=()=>false;listeners.click(event);
    assert.equal(state.sessionRecoveryStage,'medical');assert.equal(state.sessionDraft.recoveryPlan.members[0].name,'Rook');assert.equal(state.sessionFields,null);
  }finally{globalThis.window=oldWindow;globalThis.FormData=oldFormData;}
});
test('Lebenshaltung umfasst die gesamte Wartezeit und zieht passive Einnahmen nachvollziehbar ab',()=>{
  const c=wounded(0);c.lifepath.commitments.choice='fifth';
  const budget=livingCosts(c),p=recoveryPlan(c,rules,{...config,members:[{name:'Andere',days:11}]},date);
  assert.equal(p.expenses,Math.ceil(budget.expenses*11/30));assert.equal(p.income,Math.floor(budget.income*11/30));assert.equal(p.total,p.fees+p.expenses-p.income);
  c.lifepath.housing.choice=null;const missing=recoveryPlan(c,rules,config,date);assert.equal(missing.total,null);assert.equal(missing.expenses,null);
});
test('Nebenjobs zählen nur volle freie Wochen und enthalten Optionen für jede Rolle',()=>{
  for(const role of rules.roles){const c=completeCharacter(role.id),p=recoveryPlan(c,rules,{...config,members:[{name:'Andere',days:6}]},date);assert.ok(p.jobs.length>=2,role.id);assert.equal(p.weeks,0);assert.equal(p.roleRank,4);assert.ok(SIDE_JOBS[role.id]);}
  assert.equal(recoveryPlan(wounded(0),rules,{...config,members:[{name:'Andere',days:14}]},date).weeks,2);
});
test('Ungültige Daten ergeben keine scheinbar vollständige Gruppenplanung',()=>{
  const c=wounded();
  assert.equal(recoveryPlan(c,rules,{...config,members:[{name:'Unbekannt',days:''}]},date).ok,false);
  for(const input of [{extraDays:-1},{nights:-1,stay:'hospital'},{members:Array(13).fill({name:'X',days:0})},{extraCost:Infinity},{care:'surgery',dv:NaN}])assert.throws(()=>recoveryPlan(c,rules,{...config,...input},date));
  assert.throws(()=>recoveryDate('2026-02-30',0));assert.equal(recoveryDate('2028-02-28',1),'2028-02-29');
});
test('Planung ist ein dreiteiliger Ablauf und zeigt nicht alle Eingaben gleichzeitig',()=>{
  const c=wounded(),d=createSessionDraft(c);d.date=date;d.recoveryPlan=config;
  const medical=renderRecoveryPlanner(c,rules,d,{},'medical');assert.match(medical,/name="care"/);assert.doesNotMatch(medical,/name="memberName0"|Geld verdienen, während/);
  const crew=renderRecoveryPlanner(c,rules,d,{},'crew');assert.match(crew,/name="memberName0"/);assert.doesNotMatch(crew,/name="care"/);
  const result=renderRecoveryPlanner(c,rules,d,{},'result');assert.match(result,/Geld verdienen, während/);assert.doesNotMatch(result,/name="care"|name="memberName0"/);
  assert.equal(recoveryInput({memberName0:'A',memberDays0:'4'}).members[0].days,'4');
});
test('Merken und Abschließen speichern den Plan, ohne Geld abzuziehen oder TP zu heilen',()=>{
  const c=wounded(),before=structuredClone(c),d=createSessionDraft(c);d.date=date;d.recoveryPlan={...config,members:[{name:'Crew',days:12}]};
  const p=previewSession(c,rules,d);assert.ok(p.ok);assert.equal(p.after.hp,p.before.hp);assert.equal(p.after.cash,p.before.cash);assert.equal(p.recovery.groupDays,12);
  const result=completeSession(c,rules,d);assert.ok(result.ok,result.error);assert.equal(result.report.recoveryPlan.groupDays,12);assert.deepEqual(c,before);
  const html=renderSessionReport(result.character,rules,{});assert.match(html,/Erholung, Kosten und nächster Einsatz/);
  assert.equal(result.character.campaign.hp,c.campaign.hp);assert.equal(result.character.campaign.cashAdjustment,c.campaign.cashAdjustment);
});
test('Gesundheit fragt nach fehlenden TP, und importierte Namen werden escaped',()=>{
  const c=wounded(),d=createSessionDraft(c),html=renderSessionReport(c,rules,{sessionDraft:d,sessionPage:'health'});
  assert.match(html,/name="missing"/);assert.match(html,/Wie viele Trefferpunkte fehlen/);
  const p=recoveryPlan(c,rules,{...config,members:[{name:'<img src=x>',days:10}]},date);
  assert.match(renderRecoveryResult(p,c.name),/&lt;img src=x&gt;/);
  assert.match(renderRecoveryResult({...p,ownDays:'<script>'},c.name),/neu berechnet/);
});
