import test from 'node:test';
import assert from 'node:assert/strict';
import {rules,completeCharacter} from './helpers/pdf-fixture.mjs';
import {buyEquipment,removeEquipment,evaluateFunds} from '../js/economy.js';
import {ownedWeaponOptions} from '../js/weapon-options.js';
import {applyPlayAction} from '../js/play-tracking.js';
import {evaluateCharacter} from '../js/rules.js';
import {renderPlayTracking} from '../js/ui-play-tracking.js';
import {validateCharacter} from '../js/model.js';
import {renderEquipment} from '../js/ui-equipment.js';
import {ensureDefaultPortrait} from '../js/portraits.js';
import {PORTRAITS} from '../js/portrait-catalog.js';
import {meleeReferenceColumns,meleeAttackRows} from '../js/pdf-combat-reference.js';
import {characterSheetData} from '../js/pdf-character-data.js';
import {installCyberware} from '../js/cyberware.js';

test('Drei Granaten kaufen, eine entfernen und weitere werfen erhält Bestand und Angriffsoptionen',()=>{
  let c=completeCharacter();
  const id='hand-grenade-normal-frag';
  for(let i=0;i<3;i++)assert.ok(buyEquipment(c,rules,id).ok);
  removeEquipment(c,id);
  c=validateCharacter(JSON.parse(JSON.stringify(c)),rules);
  assert.equal(c.equipment.items.find(i=>i.catalogId===id).quantity,2);
  const options=ownedWeaponOptions(c,rules,evaluateCharacter(c,rules)).find(e=>e.item.id===id);
  assert.equal(options.quantity,2);assert.equal(options.options[0].id,'thrown');
  const html=renderEquipment(c,rules,evaluateCharacter(c,rules),'weapons',{weaponSections:['grenades']});
  assert.match(html,/id="weapon-catalog-grenades"[^>]*open/);
  assert.match(html,/2 × Normale Splittergranate/);
  const funds=evaluateFunds(c,rules).remaining;
  const result=applyPlayAction(c,rules,{type:'grenade',id,amount:1});
  assert.ok(result.ok,result.error);c=result.character;
  assert.equal(c.equipment.items.find(i=>i.catalogId===id).quantity,1);
  assert.equal(evaluateFunds(c,rules).remaining,funds);
  const tracking=renderPlayTracking(c,rules,evaluateCharacter(c,rules),{});
  assert.match(tracking,/1 × Normale Splittergranate/);
  assert.match(tracking,/data-play-type="grenade" data-play-id="hand-grenade-normal-frag"/);
  assert.equal(ownedWeaponOptions(c,rules,evaluateCharacter(c,rules)).find(e=>e.item.id===id).options[0].id,'thrown');
  assert.equal(applyPlayAction(c,rules,{type:'grenade',id,amount:2}).ok,false);
  c=applyPlayAction(c,rules,{type:'grenade',id,amount:1}).character;
  assert.equal(ownedWeaponOptions(c,rules,evaluateCharacter(c,rules)).some(e=>e.item.id===id),false);
});

test('Zufällige Standardporträts passen zur Rolle, bleiben gespeichert und überschreiben keine eigene Auswahl',async()=>{
  const read=async()=> 'data:image/jpeg;base64,AA==';
  for(const role of rules.roles){
    const c=completeCharacter(role.id);
    assert.equal(await ensureDefaultPortrait(c,{random:()=>0.99,read}),true);
    assert.equal(PORTRAITS.find(p=>p.id===c.portraitSource).role,role.id);
    const saved=validateCharacter(JSON.parse(JSON.stringify(c)),rules);
    assert.equal(saved.portrait,c.portrait);
    assert.equal(await ensureDefaultPortrait(c,{read:()=>{throw Error('Darf nicht laden');}}),false);
  }
  const c=completeCharacter();
  assert.equal(await ensureDefaultPortrait(c,{read,isCurrent:()=>false}),false);
  assert.equal(c.portrait,null);
  await assert.rejects(ensureDefaultPortrait(c,{read:async()=>{throw Error('Netzfehler');}}));
  assert.equal(c.portrait,null);
});

test('Nahkampfseite verwendet konkrete Charakterwerte und trennt Trefferwurf von Griffprobe',()=>{
  const c=completeCharacter('solo'), data=characterSheetData(c,rules);
  const columns=meleeReferenceColumns(data),text=JSON.stringify(columns);
  assert.match(text,new RegExp(data.attributes.BODY.effective+' direkte Trefferpunkte'));
  for(const title of ['SCHLAGEN / TRETEN','WÜRGEN','WERFEN / ZU BODEN SCHLEUDERN','GEZIELT IM NAHKAMPF'])assert.ok(text.includes(title));
  assert.equal(columns.length,3);
});

test('Cyberarm erhöht den Handgemengeschaden im Cheatsheet auf mindestens 3W6',()=>{
  const c=completeCharacter('netrunner');
  const stats=Object.fromEntries(Object.entries(evaluateCharacter(c,rules).attributes).map(([id,value])=>[id,value.base]));
  assert.equal(meleeAttackRows(characterSheetData(c,rules))[0].damage,'1W6');
  const installed=installCyberware(c,rules,'cyberarm','arm-left',null,stats);
  assert.ok(installed.ok,installed.error);
  assert.equal(meleeAttackRows(characterSheetData(c,rules))[0].damage,'3W6');
  assert.match(meleeAttackRows(characterSheetData(c,rules))[0].name,/Cyberarm/);
  const data=characterSheetData(c,rules);
  data.attributes.BODY.effective=11;
  assert.equal(meleeAttackRows(data)[0].damage,'4W6');
});

test('Menschlicher Schutzschild erklärt Griff, zusätzliche Aktion, Schutzgrenzen und Leichenschild',()=>{
  const data=characterSheetData(completeCharacter(),rules),before=structuredClone(data);
  const card=meleeReferenceColumns(data).flat().find(([title])=>title==='MENSCHLICHER SCHUTZSCHILD');
  assert.ok(card);
  const text=card[1].join(' ');
  for(const part of ['Ziel bereits im Griff','1 zusätzliche Aktion','Kein anderer Schild','dieselbe Hand','sichtbare Fernangreifer','nicht gegen Nahkampf oder gezielte Kopfschüsse','statt selbst auszuweichen','Schuss kann trotzdem verfehlen','mit ihrer Rüstung','Reflexe 8+ nicht ausweichen','weiterhin selbst angreifen','lebend kostenlos','Leichenschild','gleich ihrer Körperkraft','Ablegen kostet 1 Aktion'])assert.ok(text.includes(part),part);
  assert.deepEqual(data,before);
});
