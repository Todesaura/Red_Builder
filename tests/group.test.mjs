import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {unlink} from 'node:fs/promises';
import {rules,completeCharacter} from './helpers/pdf-fixture.mjs';
import {createGroupService} from '../scripts/group-service.mjs';
import {splitGroupReward,groupHealth} from '../js/group-rules.js';
import {renderDm} from '../js/ui-dm.js';
import {evaluateFunds} from '../js/economy.js';
import {characterJson,parseCharacterJson} from '../js/character-files.js';
const character=(player,name)=>({...completeCharacter(),playerName:player,name,groupId:randomUUID(),groupRevision:0});
const entry=(c,dead=false)=>({id:c.groupId,character:c,revision:0,dead,updatedAt:new Date().toISOString()});
const request=entries=>({id:randomUUID(),name:'Session 1',date:'2026-11-03',gross:1101,expenses:100,ids:entries.map(e=>e.id),revisions:Object.fromEntries(entries.map(e=>[e.id,e.revision]))});
const service=async fn=>{const file=new URL('../tmp/group-test-'+randomUUID()+'.json',import.meta.url);try{await fn(createGroupService(file,rules),file);}finally{await unlink(file).catch(()=>{});await unlink(new URL(file.href+'.tmp')).catch(()=>{});}};

test('Spielername/ID bleiben im JSON erhalten und Altbestände ohne Zuordnung sind gültig',()=>{
 const c=character('Max','Nyx');assert.deepEqual(parseCharacterJson(characterJson(c,rules),rules),c);
 delete c.playerName;delete c.groupId;delete c.groupRevision;
 const old=parseCharacterJson(JSON.stringify(c),rules);assert.equal(old.playerName,'');assert.equal(old.groupId,null);
});
test('Genau ein Anteil pro Spieler, keine verstorbenen Charaktere, Rest-eb bleiben vollständig verteilt',()=>{
 const max=entry(character('Max','A')),otherMax=entry(character(' MAX ','B')),lea=entry(character('Lea','C'));
 assert.throws(()=>splitGroupReward([max,otherMax],{...request([max,otherMax]),rules}),/pro Spieler/);
 const shares=splitGroupReward([max,lea],{...request([max,lea]),rules});
 assert.equal(shares.reduce((n,s)=>n+s.amount,0),1001);assert.equal(shares.find(s=>s.player==='Lea').amount,501);
 assert.throws(()=>splitGroupReward([{...max,dead:true}],{...request([max]),rules}),/verstorben/);
});
test('Gemeinsamer Speicher dedupliziert IDs, hält Neustarts aus und weist parallele alte Schreibstände ab',()=>service(async(api,file)=>{
 const c=character('Max','A'),responses=await Promise.all([api('PUT','/character',c),api('PUT','/character',c)]);
 assert.equal(responses.filter(r=>r.conflict).length,1);assert.equal((await api('GET','')).entries.length,1);
 assert.equal((await createGroupService(file,rules)('GET','')).entries[0].character.playerName,'Max');
}));
test('Gruppenabrechnung wird genau einmal gebucht und kann nicht durch alte Spielerdateien überschrieben werden',()=>service(async(api)=>{
 const a=(await api('PUT','/character',character('Max','A'))).entry,b=(await api('PUT','/character',character('Lea','B'))).entry;
 const before=evaluateFunds(a.character,rules).remaining,r=request([a,b]);
 const first=await api('POST','/reward',r),second=await api('POST','/reward',r);
 assert.deepEqual(first.receipt,second.receipt);
 const data=await api('GET',''),next=data.entries.find(e=>e.id===a.id);
 assert.equal(data.receipts.length,1);assert.equal(next.character.campaign.history.length,1);assert.equal(next.character.campaign.sessionUnlocked,true);
 assert.equal(evaluateFunds(next.character,rules).remaining,before+500);
 assert.equal((await api('PUT','/character',a.character)).conflict,true);
 await assert.rejects(api('POST','/reward',{...r,gross:2000}),/bereits anders/);
}));
test('Verstorbenen-Status ist rückgängig machbar und bleibt bei Spielerupdates bestehen',()=>service(async(api)=>{
 const a=(await api('PUT','/character',character('Max','A'))).entry;
 const dead=(await api('POST','/status',{id:a.id,revision:a.revision,dead:true})).entry;
 const updated=await api('PUT','/character',{...dead.character,name:'A neu'});assert.equal(updated.entry.dead,true);
 const alive=await api('POST','/status',{id:a.id,revision:updated.entry.revision,dead:false});assert.equal(alive.entry.dead,false);
}));
test('Veraltete Abrechnung wird atomar abgebrochen, ohne anderen Teilnehmer schon Geld zu geben',()=>service(async(api)=>{
 const a=(await api('PUT','/character',character('Max','A'))).entry,b=(await api('PUT','/character',character('Lea','B'))).entry;
 const r=request([a,b]);r.revisions[b.id]=0;const before=await api('GET','');
 await assert.rejects(api('POST','/reward',r),/inzwischen geändert/);assert.deepEqual(await api('GET',''),before);
}));
test('Erholung unterscheidet sichere Planung von offenen Verletzungsfragen und berücksichtigt Wartezeit der Gruppe',()=>{
 const a=entry(character('Max','A'));assert.equal(groupHealth(a,rules,'2026-11-03').plan.ownDays,0);
 a.character.campaign.hp=30;a.character.campaign.injuries=[{id:'injury-1',name:'Gebrochenes Bein',status:'active',notes:''}];
 assert.equal(groupHealth(a,rules,'2026-11-03').plan,null);
 a.recoveryInput={care:'surgery',procedures:1,dv:17,extraDays:0,extraCost:0,stay:'home',stabilized:'yes'};
 const plan=groupHealth(a,rules,'2026-11-03',10).plan;assert.ok(plan.ok);assert.equal(plan.groupDays,10);assert.equal(plan.medical,1000);assert.ok(plan.total>=1000);
});
test('SL-Ansicht gruppiert mehrere Charaktere unter einem Spieler und streicht Verstorbene durch',()=>{
 const entries=[entry(character('Max','A')),entry(character('Max','B')),entry(character('Max','<script>'),true)];
 const html=renderDm({entries,selected:new Map(),date:'2026-11-03',reward:{name:'',gross:'',expenses:0}},rules);
 assert.equal((html.match(/<h2>Max<\/h2>/g)??[]).length,1);assert.match(html,/dm-dead/);assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>/);
});
