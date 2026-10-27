import {evaluateLifepath} from '../js/lifepath.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {rules,completeCharacter,templateBytes,fontBytes} from './helpers/pdf-fixture.mjs';
import {createSessionDraft,previewSession,completeSession,sessionSnapshot} from '../js/session-report.js';
import {createCampaign} from '../js/campaign-state.js';
import {improvementCost} from '../js/campaign-rules.js';
import {migrateCharacter,validateCharacter} from '../js/model.js';
import {evaluateCharacter} from '../js/rules.js';
import {buyEquipment} from '../js/economy.js';
import {loadCharacter,saveCharacter,STORAGE_KEY} from '../js/storage.js';
import {quickAddCyberware} from '../js/cyberware-quick-add.js';
import {commitCyberwareDraft} from '../js/cyberware-draft.js';
import {renderSessionReport,sessionCyberState} from '../js/ui-session-report.js';
import {characterSheetData,characterSheetReadiness} from '../js/pdf-character-data.js';
import {characterSheetFields} from '../js/pdf-character-layout.js';
import {generateCharacterSheet} from '../js/pdf-character.js';
import {PDFDocument} from '../vendor/pdf-lib/pdf-lib.esm.min.js';
import {validateRolePoints} from '../js/role-points.js';
import {installedCyberWeapons} from '../js/cyberware-weapons.js';
const c=()=>completeCharacter('rockerboy');
function draft(character,actions=[],award=0){const d=createSessionDraft(character);d.actions=actions;d.ipAward=award;return d;}
function finish(character,actions=[],award=0){const d=draft(character,actions,award),result=completeSession(character,rules,d);assert.ok(result.ok,result.error);return result.character;}
const money=amount=>({type:'money',category:'earned',amount});
const equipment=id=>rules.equipmentRules.items.find(i=>i.id===id);
function install(character,id){const q=quickAddCyberware(character,rules,[],id);assert.ok(q.ok,q.error);assert.ok(commitCyberwareDraft(character,rules,q.additions).ok);}
function installAction(character,id,price=null){const r={...rules,equipmentRules:{...rules.equipmentRules,startingCash:10000000}},q=quickAddCyberware(character,r,[],id);assert.ok(q.ok,q.error);return {type:'cyber-install',humanityLoss:q.additions.reduce((sum,i)=>sum+rules.cyberwareRules.items.find(d=>d.id===i.catalogId).humanity,0),additions:q.additions,...(price==null?{}:{price})};}

test('Format 10 migriert ohne Änderung der bisherigen Zahlen; Original wird gesichert',()=>{
  const original=c(),old={...original,version:10};delete old.campaign;
  const migrated=migrateCharacter(old,rules);assert.equal(migrated.version,11);assert.deepEqual(migrated.campaign,createCampaign());assert.deepEqual(sessionSnapshot(original,rules),sessionSnapshot(migrated,rules));
  const data=new Map([[STORAGE_KEY,JSON.stringify(old)]]),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
  assert.equal(loadCharacter(rules,storage).blocked,false);assert.equal(data.get('red-builder.character.v10.backup'),JSON.stringify(old));
});
test('Vorschau ist mutationsfrei; Abschluss übernimmt alle Vorgänge und unveränderliche Historie atomar',()=>{
  const character=c(),before=structuredClone(character),d=draft(character,[money(800),{type:'money',category:'spent',amount:120}],60),p=previewSession(character,rules,d);
  assert.ok(p.ok,p.errors.join(' '));assert.deepEqual(character,before);assert.equal(p.after.cash,p.before.cash+680);assert.equal(p.after.ip,60);
  const result=completeSession(character,rules,d);assert.ok(result.ok);assert.deepEqual(character,before);assert.equal(result.character.campaign.history.length,1);assert.equal(result.report.before.cash,p.before.cash);assert.equal(result.report.after.cash,p.after.cash);assert.ok(result.report.changes.length);
});
test('Wiederholte Vorschau hat stabile Besitz- und Verletzungs-IDs; Beute bleibt im selben Report einbaubar',()=>{
  const character=c(),d=draft(character,[{type:'cyber-acquire',id:'cybereye',quantity:1,mode:'loot'},{type:'injury',name:'Gebrochener Arm',notes:'Arm nicht benutzbar'}]);
  const p=previewSession(character,rules,d);assert.ok(p.ok,p.errors.join(' '));
  for(let i=0;i<4;i++)assert.deepEqual(previewSession(character,rules,d),p);
  const a=installAction(p.character,'cybereye');a.owned={[a.additions[0].id]:p.character.campaign.cyberInventory[0].id};d.actions.push(a);
  const result=completeSession(character,rules,d);assert.ok(result.ok,result.error);assert.equal(result.character.cyberware.items.length,1);assert.equal(sessionSnapshot(result.character,rules).cash,2550);
});
test('Solo kann Kampfpunkte ohne neue IP-Kosten im Report umverteilen',()=>{
  const character=completeCharacter('solo'),allocation={...character.rolePoints.solo,initiative:1,precision:1},result=finish(character,[{type:'role-allocate',allocation}]);
  assert.equal(result.campaign.ip,0);assert.equal(evaluateCharacter(result,rules).roleAbilities.bonuses.attack,1);assert.equal(evaluateCharacter(result,rules).roleAbilities.rank,4);
});
test('Nicht genug Geld oder IP lässt ursprünglichen Charakter vollständig unverändert',()=>{
  const character=c(),before=structuredClone(character);
  for(const actions of [[{type:'money',category:'spent',amount:100000}], [{type:'skill',id:'cybertech',to:1}]])assert.equal(completeSession(character,rules,draft(character,actions)).ok,false);
  assert.deepEqual(character,before);
});
test('Kauf, Beute, Verbrauch, Verlust und Verkauf verwenden den echten Geldfluss genau einmal',()=>{
  let character=c(),start=sessionSnapshot(character,rules).cash;
  character=finish(character,[{type:'gear',id:'heavy-pistol',mode:'loot',quantity:1},{type:'gear',id:'light-melee',mode:'buy',quantity:1,price:25}]);
  assert.equal(sessionSnapshot(character,rules).cash,start-25);assert.ok(character.equipment.items.some(i=>i.catalogId==='heavy-pistol'));
  character=finish(character,[{type:'gear',id:'heavy-pistol',mode:'sell',quantity:1,price:37},{type:'gear',id:'light-melee',mode:'lost',quantity:1}]);
  assert.equal(sessionSnapshot(character,rules).cash,start+12);assert.equal(character.equipment.items.length,0);
});
test('Mehrere identische Käufe, abweichende Preise und kostenlose Beute bleiben nach Neuladen korrekt',()=>{
  let character=c(),start=sessionSnapshot(character,rules).cash;
  character=finish(character,[{type:'gear',id:'agent',mode:'buy',quantity:2,price:70},{type:'gear',id:'flashlight',mode:'loot',quantity:1}]);
  character=validateCharacter(JSON.parse(JSON.stringify(character)),rules);
  assert.equal(sessionSnapshot(character,rules).cash,start-70);assert.equal(character.equipment.items.find(i=>i.catalogId==='agent').quantity,2);
  assert.equal(completeSession(character,rules,draft(character,[{type:'gear',id:'agent',mode:'consume',quantity:3}])).ok,false);
});
test('Angebrochene Munitionspackungen behalten einzelne übrige Schuss ohne Rückerstattung',()=>{
  const ammo=rules.equipmentRules.items.find(i=>i.kind==='ammo'&&i.units===10);let character=c();const start=sessionSnapshot(character,rules).cash;
  character=finish(character,[{type:'gear',id:ammo.id,mode:'loot',quantity:3},{type:'gear',id:ammo.id,mode:'consume',quantity:1,rounds:7}]);
  assert.equal(character.equipment.items.find(i=>i.catalogId===ammo.id).quantity,3);assert.equal(character.campaign.ammoSpent[ammo.id],7);assert.equal(sessionSnapshot(character,rules).cash,start);
  character=finish(character,[{type:'gear',id:ammo.id,mode:'consume',quantity:1,rounds:23}]);assert.equal(character.equipment.items.length,0);assert.equal(character.campaign.ammoSpent[ammo.id],undefined);assert.equal(sessionSnapshot(character,rules).cash,start);
});
test('Eigene Gegenstände können kostenlos erhalten und ohne Buchwert-Erstattung verbraucht werden',()=>{
  let character=finish(c(),[{type:'custom',mode:'loot',name:'Chip mit Koordinaten',quantity:2,notes:'Beute'}]);const cash=sessionSnapshot(character,rules).cash,id=character.equipment.custom[0].id;
  character=finish(character,[{type:'custom',mode:'consume',id,name:'Chip mit Koordinaten',quantity:1}]);assert.equal(character.equipment.custom[0].quantity,1);assert.equal(sessionSnapshot(character,rules).cash,cash);
});
test('IP-Kosten summieren jeden Zwischenrang und unterscheiden normal, ×2 und Rolle',()=>{
  assert.equal(improvementCost(4,5),100);assert.equal(improvementCost(4,6),220);assert.equal(improvementCost(4,6,2),440);assert.equal(improvementCost(4,6,3),660);assert.throws(()=>improvementCost(6,6));assert.throws(()=>improvementCost(9,11));
});
test('Fertigkeiten bis 10 steigen im bestehenden Modell; Erstellungspunkte bleiben ausgeschöpft',()=>{
  const character=c(),old=evaluateCharacter(character,rules).skills.find(s=>s.id==='cybertech'),cost=improvementCost(old.level,10);
  const result=finish(character,[{type:'skill',id:'cybertech',to:10,timeConfirmed:true}],cost+15),v=evaluateCharacter(result,rules);
  assert.equal(result.skills.ranks.cybertech,10);assert.equal(result.campaign.ip,15);assert.deepEqual(v.skillErrors,[]);assert.equal(v.skills.find(s=>s.id==='cybertech').base,old.base+10-old.level);assert.deepEqual(validateCharacter(result,rules),result);
});
test('×2-Fertigkeiten werden doppelt berechnet; Attribute und unbekannte Fertigkeiten sind gesperrt',()=>{
  const character=c(),v=evaluateCharacter(character,rules),skill=v.skills.find(s=>s.cost===2&&!s.specialized&&s.level<10),cost=(skill.level+1)*40;
  const result=finish(character,[{type:'skill',id:skill.id,to:skill.level+1}],cost);assert.equal(result.campaign.ip,0);
  assert.equal(previewSession(character,rules,draft(character,[{type:'skill',id:'BODY',to:8}],9999)).ok,false);
  assert.equal(previewSession(character,rules,draft(character,[{type:'skill',id:skill.id,to:skill.level+2}],9999)).ok,false);
});
test('Mehrere einzelne Käufe derselben Fertigkeit umgehen die Zeitbestätigung nicht',()=>{
  const character=c(),actions=[{type:'skill',id:'cybertech',to:1},{type:'skill',id:'cybertech',to:2}];assert.equal(previewSession(character,rules,draft(character,actions,60)).ok,false);
  actions[1].timeConfirmed=true;assert.ok(previewSession(character,rules,draft(character,actions,60)).ok);
});
test('Rollenrang wirkt dynamisch auf alle zehn Rollen; keine erfundenen globalen Boni',()=>{
  for(const role of rules.roles){
    const character=completeCharacter(role.id),a={type:'role',to:5};
    if(role.id==='solo')a.allocation={...character.rolePoints.solo,initiative:5};
    if(role.id==='tech')a.allocation={...character.rolePoints.tech,field:5,upgrade:5};
    if(role.id==='medtech'){a.allocation={...character.rolePoints.medtech,surgery:3};a.pharmaceuticals=character.rolePoints.pharmaceuticals;}
    const result=finish(character,[a],300),v=evaluateCharacter(result,rules);assert.equal(v.roleAbilities.rank,5,role.id);assert.equal(v.roleAbilities.errors.length,0,role.id);assert.equal(result.campaign.ip,0);
    assert.equal(characterSheetData(result,rules).rank,5);
    if(role.id==='nomad')assert.equal(v.skills.find(s=>s.id==='drive-land').base,evaluateCharacter(character,rules).skills.find(s=>s.id==='drive-land').base+1);
  }
});
test('Tech und Medtech prüfen neue Fachränge; Solo-Verteilung wird nicht still erfunden',()=>{
  const tech=completeCharacter('tech');assert.equal(previewSession(tech,rules,draft(tech,[{type:'role',to:5,allocation:{field:6,upgrade:4,fabrication:0,invention:0}}],300)).ok,false);
  const solo=completeCharacter('solo');assert.equal(previewSession(solo,rules,draft(solo,[{type:'role',to:5}],300)).ok,false);
});
test('Medtech-Fachgebiete bleiben bei höchstens fünf Punkten und Chirurgie bei Rang zehn',()=>{
  const character=completeCharacter('medtech'),points=structuredClone(character.rolePoints);points.medtech={surgery:6,pharma:1,cryo:1};assert.throws(()=>validateRolePoints(points,8,'medtech'),/Rollenpunkte/);
});
test('Waffenaufsätze kosten einmal je Exemplar; Entfernen erzeugt keinen automatischen Verkaufserlös',()=>{
  let character=finish(c(),[{type:'gear',id:'heavy-pistol',mode:'loot',quantity:1}]),start=sessionSnapshot(character,rules).cash;
  character=finish(character,[{type:'attachment',id:'heavy-pistol',attachmentId:'scope',mode:'install'}]);
  const paid=start-sessionSnapshot(character,rules).cash;assert.ok(paid>0);assert.equal(character.equipment.attachments.length,1);
  character=finish(character,[{type:'attachment',id:'heavy-pistol',attachmentId:'scope',mode:'remove'}]);assert.equal(sessionSnapshot(character,rules).cash,start-paid);assert.equal(character.equipment.attachments.length,0);
});
test('Der Kauf eines weiteren ausgerüsteten Waffenexemplars berücksichtigt bestehende Aufsätze',()=>{
  let character=finish(c(),[{type:'gear',id:'heavy-pistol',mode:'loot',quantity:1},{type:'attachment',id:'heavy-pistol',attachmentId:'scope',mode:'install'}]),before=sessionSnapshot(character,rules).cash;
  character=finish(character,[{type:'gear',id:'heavy-pistol',mode:'buy',quantity:1}]);assert.equal(before-sessionSnapshot(character,rules).cash,equipment('heavy-pistol').cost+100);assert.equal(character.equipment.items.find(i=>i.catalogId==='heavy-pistol').quantity,2);
});
test('Ein beschädigter Partnerarm gewährt keinen Paarbonus einer Cyberwaffe',()=>{
  const character=c(),rich={...rules,equipmentRules:{...rules.equipmentRules,startingCash:100000}};let q=quickAddCyberware(character,rich,[],'mantis-blade');assert.ok(commitCyberwareDraft(character,rich,q.additions).ok);q=quickAddCyberware(character,rich,[],'mantis-blade');assert.ok(commitCyberwareDraft(character,rich,q.additions).ok);
  character.campaign.cyberDamaged=[character.cyberware.items.find(i=>i.catalogId==='cyberarm'&&i.location==='arm-right').id];const weapons=installedCyberWeapons(character,rich,evaluateCharacter(character,rich));assert.equal(weapons.length,1);assert.equal(weapons[0].item.paired,false);
});
test('Cyberware-Besitz verursacht weder HL noch Effekte, Einbau berechnet nur den offenen Preis',()=>{
  let character=c(),start=sessionSnapshot(character,rules);character=finish(character,[{type:'cyber-acquire',id:'monowire',quantity:1,mode:'loot'}]);
  assert.equal(sessionSnapshot(character,rules).humanity,start.humanity);assert.equal(character.cyberware.items.length,0);
  const a=installAction(character,'monowire'),option=a.additions.find(i=>i.catalogId==='monowire');a.owned={[option.id]:character.campaign.cyberInventory[0].id};
  character=finish(character,[a]);const end=sessionSnapshot(character,rules);assert.equal(end.cash,start.cash-500);assert.equal(end.humanity,start.humanity-21);assert.equal(end.maxHumanity,start.maxHumanity-4);assert.equal(character.campaign.cyberInventory.length,0);
});
test('Gekaufte, noch nicht installierte Cyberware wird beim Einbau nicht nochmals bezahlt',()=>{
  let character=c(),start=sessionSnapshot(character,rules).cash;character=finish(character,[{type:'cyber-acquire',id:'cybereye',quantity:1,mode:'buy',price:75}]);
  const a=installAction(character,'cybereye');a.owned={[a.additions[0].id]:character.campaign.cyberInventory[0].id};character=finish(character,[a]);assert.equal(sessionSnapshot(character,rules).cash,start-75);assert.equal(evaluateCharacter(character,rules).cyberware.loss,7);
});
test('Ausbau heilt keine Menschlichkeit, Maximum erholt sich; Wiedereinbau desselben Teils verursacht erneut HL',()=>{
  let character=c();install(character,'cybereye');const old=sessionSnapshot(character,rules),id=character.cyberware.items[0].id;
  character=finish(character,[{type:'cyber-remove',id,cost:20}]);let after=sessionSnapshot(character,rules);assert.equal(after.humanity,old.humanity);assert.equal(after.maxHumanity,old.maxHumanity+2);assert.equal(after.cash,old.cash-20);assert.equal(character.campaign.cyberInventory[0].used,true);
  const a=installAction(character,'cybereye');a.owned={[a.additions[0].id]:character.campaign.cyberInventory[0].id};a.price=30;character=finish(character,[a]);after=sessionSnapshot(character,rules);assert.equal(after.humanity,old.humanity-7);assert.equal(after.maxHumanity,old.maxHumanity);assert.equal(after.cash,old.cash-50);
});
test('Cyberware-Abhängigkeiten und Kapazität gelten auch in der Session; keine teilweise Installation',()=>{
  const character=c();install(character,'monowire');const base=character.cyberware.items.find(i=>i.catalogId==='cyberarm'),before=structuredClone(character);
  assert.equal(previewSession(character,rules,draft(character,[{type:'cyber-remove',id:base.id,cost:0}])).ok,false);
  const a=installAction(character,'mantis-blade');a.additions.push({...a.additions.at(-1),id:'implant-99'});assert.equal(previewSession(character,rules,draft(character,[a])).ok,false);assert.deepEqual(character,before);
});
test('Gewürfelter Einbauverlust wird genau einmal verwendet und bleibt nach Ausbau erhalten',()=>{
  let character=c(),a=installAction(character,'cybereye');a.humanityLoss=4;a.confirmation='2W6: 1+3, SL bestätigt';character=finish(character,[a]);assert.equal(sessionSnapshot(character,rules).humanity,76);
  character=finish(character,[{type:'cyber-remove',id:character.cyberware.items[0].id,cost:0}]);assert.equal(sessionSnapshot(character,rules).humanity,76);
});
test('Session-Einbau benötigt einen möglichen Würfelverlust; Erstellungsdurchschnitt wird nicht still verwendet',()=>{
  const character=c(),action=installAction(character,'cybereye');delete action.humanityLoss;assert.equal(previewSession(character,rules,draft(character,[action])).ok,false);
  for(const humanityLoss of [0,1,13])assert.equal(previewSession(character,rules,draft(character,[{...action,humanityLoss}])).ok,false);
  assert.ok(previewSession(character,rules,draft(character,[{...action,humanityLoss:2}])).ok);assert.ok(previewSession(character,rules,draft(character,[{...action,humanityLoss:12}])).ok);
});
test('Neue Session-Nummer folgt der höchsten vorhandenen Nummer statt der Anzahl der Reports',()=>{
  const character=c(),d=draft(character);d.number=9;const result=completeSession(character,rules,d);assert.ok(result.ok);assert.equal(createSessionDraft(result.character).number,10);
});
test('Manueller Ereignisverlust wirkt auf HUM, EMP und EMP-Fertigkeiten und wird begründet protokolliert',()=>{
  const character=c(),old=sessionSnapshot(character,rules),result=finish(character,[{type:'humanity',loss:5,reason:'Trauma durch Entführung, SL'}]),v=evaluateCharacter(result,rules);
  assert.equal(v.cyberware.current,old.humanity-5);assert.equal(v.cyberware.maximum,old.maxHumanity);assert.equal(v.attributes.EMP.effective,Math.floor((old.humanity-5)/10));assert.equal(v.skills.find(s=>s.id==='human-perception').base,evaluateCharacter(character,rules).skills.find(s=>s.id==='human-perception').base-1);
  assert.match(result.campaign.history[0].log.join(' '),/Manueller Ereignisverlust/);assert.equal(previewSession(character,rules,draft(character,[{type:'humanity',loss:5,reason:''}])).ok,false);
});
test('Therapie kostet Geld und Zeit, heilt nur bis zum installierten Maximum und speichert keinen Überschuss',()=>{
  let character=c();install(character,'cybereye');const old=sessionSnapshot(character,rules);
  character=finish(character,[{type:'therapy',kind:'standard',days:7,safe:true,success:true,roll:12,provider:'provider'}]);let end=sessionSnapshot(character,rules);assert.equal(end.humanity,78);assert.equal(end.cash,old.cash-500);
  character=finish(character,[{type:'cyber-remove',id:character.cyberware.items[0].id,cost:0}]);end=sessionSnapshot(character,rules);assert.equal(end.humanity,78);assert.equal(end.maxHumanity,80);
});
test('Ein Würfelverlust unter der Maximumsenkung speichert keine versteckte Heilung für späteren Ausbau',()=>{
  let character=c(),a=installAction(character,'nasal-filters');a.humanityLoss=1;character=finish(character,[a]);assert.equal(sessionSnapshot(character,rules).humanity,78);assert.equal(sessionSnapshot(character,rules).maxHumanity,78);
  character=finish(character,[{type:'therapy',kind:'standard',days:7,safe:true,success:true,roll:12,provider:'provider'}]);
  character=finish(character,[{type:'cyber-remove',id:character.cyberware.items[0].id,cost:0}]);assert.equal(sessionSnapshot(character,rules).humanity,78);assert.equal(sessionSnapshot(character,rules).maxHumanity,80);
});
test('Fehlgeschlagene, zu kurze oder manipulierte Therapie schenkt keine Menschlichkeit',()=>{
  const character=c();install(character,'cybereye');const old=sessionSnapshot(character,rules),base={type:'therapy',kind:'standard',days:7,safe:true,success:true,roll:7,provider:'provider'};
  for(const override of [{days:6},{roll:13},{safe:false}])assert.equal(previewSession(character,rules,draft(character,[{...base,...override}])).ok,false);
  const result=finish(character,[{...base,success:false}]);assert.equal(sessionSnapshot(result,rules).humanity,old.humanity);assert.equal(sessionSnapshot(result,rules).cash,old.cash-500);
});
test('Borgware, Fashionware und Ausnahmen behalten ihre bestehenden Maximal-HUM-Regeln',()=>{
  const character=c(),borg=rules.cyberwareRules.items.find(d=>d.maxHumanityLoss===4),fashion=rules.cyberwareRules.items.find(d=>d.humanity===0&&d.maxHumanityLoss===0);
  assert.ok(borg);assert.ok(fashion);let result=finish(character,[installAction(character,fashion.id,0)]);assert.equal(sessionSnapshot(result,rules).maxHumanity,80);
  const q=quickAddCyberware(result,{...rules,equipmentRules:{...rules.equipmentRules,startingCash:1000000}},[],borg.id);assert.ok(q.ok,q.error);const a={type:'cyber-install',humanityLoss:q.additions.reduce((n,i)=>n+rules.cyberwareRules.items.find(d=>d.id===i.catalogId).humanity,0),additions:q.additions,price:0};result=finish(result,[a]);assert.equal(sessionSnapshot(result,rules).maxHumanity,80-q.additions.reduce((n,i)=>n+rules.cyberwareRules.items.find(d=>d.id===i.catalogId).maxHumanityLoss,0));
});
test('Kritische Menschlichkeit warnt, der Verlust kann trotzdem korrekt protokolliert werden',()=>{
  const character=c(),p=previewSession(character,rules,draft(character,[{type:'humanity',loss:90,reason:'Spielleitung'}]));assert.ok(p.ok,p.errors.join(' '));assert.ok(p.warnings.length);assert.equal(p.after.empathy,0);assert.equal(p.after.humanity,-10);
});
test('Kritische Menschlichkeit bleibt bei Kampagnen eine Warnung und verhindert den aktualisierten Bogen nicht',()=>{
  const result=finish(c(),[{type:'humanity',loss:90,reason:'Spielleitung bestätigt'}]);assert.ok(characterSheetReadiness(result,rules).ready);assert.equal(characterSheetData(result,rules).humanity.current,-10);
});
test('Verletzungserfassung und Stabilisierung heilen nicht automatisch vollständig',()=>{
  let character=c(),max=sessionSnapshot(character,rules).maxHp;character=finish(character,[{type:'health',mode:'damage',amount:max+2},{type:'injury',name:'Gebrochener Arm',notes:'Arm nicht benutzbar'}]);assert.equal(character.campaign.hp,-2);
  character=finish(character,[{type:'health',mode:'stabilize',confirmation:'Sanitäter 17 gegen 15'}]);assert.equal(character.campaign.hp,1);assert.equal(character.campaign.stabilized,true);assert.equal(character.campaign.injuries[0].status,'active');
  const result=finish(character);assert.equal(result.campaign.hp,1);assert.deepEqual(result.campaign.injuries,character.campaign.injuries);
});
test('Natürliche Heilung prüft Stabilisierung und volle Ruhetage; verletzter Zustand bleibt getrennt',()=>{
  let character=finish(c(),[{type:'health',mode:'damage',amount:20}]);assert.equal(previewSession(character,rules,draft(character,[{type:'health',mode:'rest',days:1,lightActivity:true}])).ok,false);
  character=finish(character,[{type:'health',mode:'stabilize',confirmation:'Erste Hilfe bestanden'},{type:'health',mode:'rest',days:1,lightActivity:true}]);const max=sessionSnapshot(character,rules).maxHp;assert.equal(character.campaign.hp,max-20+evaluateCharacter(character,rules).attributes.BODY.effective);
});
test('Schnellheilung benötigt Medtech, Tageslimit und nicht sterbenden Zustand',()=>{
  const character=finish(c(),[{type:'health',mode:'damage',amount:20}]);
  for(const override of [{medtech:false},{onceDaily:false}])assert.equal(previewSession(character,rules,draft(character,[{type:'health',mode:'speedheal',medtech:true,onceDaily:true,...override}])).ok,false);
  const result=finish(character,[{type:'health',mode:'speedheal',medtech:true,onceDaily:true}]);assert.equal(result.campaign.hp,Math.min(sessionSnapshot(character,rules).maxHp,character.campaign.hp+14));
});
test('Schnellheilung ist auch über Reports hinweg höchstens einmal pro Spieldatum nutzbar',()=>{
  let character=finish(c(),[{type:'health',mode:'damage',amount:30}]);const action={type:'health',mode:'speedheal',medtech:true,onceDaily:true,date:'2045-10-27'};
  character=finish(character,[action]);assert.equal(previewSession(character,rules,draft(character,[action])).ok,false);assert.ok(previewSession(character,rules,draft(character,[{...action,date:'2045-10-28'}])).ok);
});
test('Direkte TP-Erhöhung und Verletzungsbehandlung benötigen nachvollziehbare Bestätigung',()=>{
  let character=finish(c(),[{type:'health',mode:'damage',amount:10},{type:'injury',name:'Gebrochenes Bein',notes:'−4 BEW'}]);
  assert.equal(previewSession(character,rules,draft(character,[{type:'health',mode:'set',hp:45}])).ok,false);
  const id=character.campaign.injuries[0].id;assert.equal(previewSession(character,rules,draft(character,[{type:'injury',id,status:'treated',confirmation:''}])).ok,false);
  character=finish(character,[{type:'injury',id,status:'treated',confirmation:'Vier Stunden, Sanitäter 17, behandelnder NSC'}]);assert.equal(character.campaign.injuries[0].status,'treated');assert.equal(character.campaign.hp,35);
});
test('Beschädigte Rüstung reduziert SP getrennt von Kopf/Körper; Reparatur kostet nur einmal',()=>{
  const armor=rules.equipmentRules.items.find(d=>d.category==='armor'&&d.slot==='body'&&d.sp===11);assert.ok(armor);
  let character=finish(c(),[{type:'gear',id:armor.id,mode:'loot',quantity:1},{type:'armor',equip:true,slot:'body',id:armor.id},{type:'armor',id:armor.id,loss:3,cost:0}]);let v=evaluateCharacter(character,rules);assert.equal(v.armor.bodySP,8);assert.equal(v.armor.headSP,0);
  const cash=v.funds.remaining;character=finish(character,[{type:'armor',id:armor.id,loss:0,cost:50,confirmation:'Basic Tech bestanden, Reparaturzeit eingehalten'}]);v=evaluateCharacter(character,rules);assert.equal(v.armor.bodySP,11);assert.equal(v.funds.remaining,cash-50);
});
test('Beschädigte Cyberware verliert Boni, Reparatur stellt sie ohne erneuten Einbauverlust wieder her',()=>{
  let character=c();install(character,'kerenzikov');const old=evaluateCharacter(character,rules),i=character.cyberware.items.find(i=>i.catalogId==='kerenzikov');character=finish(character,[{type:'cyber-repair',id:i.id,damaged:true,cost:0}]);assert.equal(evaluateCharacter(character,rules).derived.find(d=>d.id==='initiative').value,old.derived.find(d=>d.id==='initiative').value-2);
  character=finish(character,[{type:'cyber-repair',id:i.id,damaged:false,cost:25,confirmation:'Cybertechnik, Reparaturzeit und Material bestätigt'}]);assert.equal(evaluateCharacter(character,rules).cyberware.loss,old.cyberware.loss);assert.equal(evaluateCharacter(character,rules).derived.find(d=>d.id==='initiative').value,old.derived.find(d=>d.id==='initiative').value);
});
test('Kontakte, Feinde, Ereignisse und Ziele ergänzen den bestehenden Lebensweg',()=>{
  let character=c(),old=character.lifepath.friend;character=finish(character,[{type:'story',category:'contacts',text:'Ripperdoc Mira'},{type:'story',category:'enemies',text:'Die Chromratten'},{type:'story',category:'goals',text:'Miras Auftrag abschließen'},{type:'story',category:'obligations',text:'Mira: 300 eb offen'},{type:'reputation',value:2,reason:'Job in Watson'}]);
  assert.match(evaluateLifepath(character).entries.find(e=>e.id==='friend').answer,/Ripperdoc Mira/);assert.equal(character.campaign.obligations.length,1);assert.equal(character.campaign.reputation,2);assert.deepEqual(character.lifepath.friend,old);
});
test('Erneutes Laden/Öffnen abgeschlossener Reports wendet keine Änderung erneut an',()=>{
  const original=c(),d=draft(original,[money(100)],60),result=completeSession(original,rules,d);assert.ok(result.ok);const character=validateCharacter(JSON.parse(JSON.stringify(result.character)),rules),before=structuredClone(character);
  assert.equal(completeSession(character,rules,d).ok,false);for(let i=0;i<4;i++)assert.deepEqual(validateCharacter(character,rules),character);assert.deepEqual(character,before);assert.equal(character.campaign.history.length,1);
});
test('Veraltete parallele Vorschau und doppelte Session-Nummer werden verworfen',()=>{
  const character=c(),d=draft(character,[money(20)]);character.name='Geänderter Name';assert.equal(previewSession(character,rules,d).ok,false);
  const next=finish(character),duplicate=draft(next);duplicate.number=1;assert.equal(completeSession(next,rules,duplicate).ok,false);
});
test('Kontrollierte Rückbuchung behält Originalhistorie und darf nur den unveränderten letzten Report treffen',()=>{
  const original=c(),character=finish(original,[money(800)],60),h=character.campaign.history[0],correction={type:'correction',reportId:h.id,reason:'Falsch eingetragene Belohnung'},result=finish(character,[correction]);
  assert.deepEqual(sessionSnapshot(result,rules),sessionSnapshot(original,rules));assert.equal(result.campaign.history.length,2);assert.deepEqual(result.campaign.history[0],h);assert.equal(result.campaign.history[1].correctionOf,h.id);
  assert.equal(completeSession(result,rules,draft(result,[correction])).ok,false);
  const edited=structuredClone(character);edited.campaign.cashAdjustment++;assert.equal(previewSession(edited,rules,draft(edited,[correction])).ok,false);
});
test('Speicherfehler liefert Fehler, ohne dass der Aufrufer einen neuen Charakter übernehmen muss',()=>{
  const original=c(),result=completeSession(original,rules,draft(original,[money(10)]));assert.ok(result.ok);assert.equal(saveCharacter(result.character,{setItem:()=>{throw Error('Quota');}}).ok,false);assert.equal(original.campaign.history.length,0);
});
test('Schritt-8-Ansicht zeigt eine Frage statt des vollständigen Formulars und escapt freie Texte',()=>{
  const character=c(),state={sessionDraft:draft(character,[money(100)]),sessionCyber:sessionCyberState()};state.sessionDraft.name='<script>bad</script>';const html=renderSessionReport(character,rules,state);
  for(const text of ['Welche Session möchtest du nachtragen?','session-progress','&lt;script&gt;bad'])assert.ok(html.includes(text),text);
  assert.ok(!html.includes('<script>bad'));assert.ok(!html.includes('data-session-configurator'));assert.ok(!html.includes('data-session-form="gear"'));assert.ok(!html.includes('data-session-complete'));
});

test('Kampagnenwerte erscheinen im bestehenden vierseitigen PDF und der Rollenrang ist dynamisch',async()=>{
  const character=finish(c(),[money(80),{type:'health',mode:'damage',amount:12},{type:'role',to:5}],300),data=characterSheetData(character,rules),fields=characterSheetFields(data);
  assert.equal(fields.find(f=>f.name==='hp.current').value,'33');assert.equal(fields.find(f=>f.name==='identity.rank').value,'5');assert.match(fields.find(f=>f.name==='identity.notes').value,/IP: 0/);assert.equal(fields.find(f=>f.name==='campaign.ip').value,'0 IP verfügbar');assert.equal(fields.find(f=>f.name==='campaign.reputation').value,'0');
  const result=await generateCharacterSheet(character,rules,{templateBytes,fontBytes}),pdf=await PDFDocument.load(result.bytes);assert.equal(pdf.getPageCount(),4);assert.equal(pdf.getForm().getTextField('hp.current').getText(),'33');assert.equal(pdf.getForm().getTextField('identity.rank').getText(),'5');
});
