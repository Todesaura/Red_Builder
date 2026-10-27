import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createCharacter, validateCharacter } from '../js/model.js';
import { evaluateCharacter } from '../js/rules.js';
import { buyEquipment, evaluateFunds } from '../js/economy.js';
import { removeCyberware } from '../js/cyberware.js';
import { addToCyberwareDraft, removeFromCyberwareDraft, commitCyberwareDraft, evaluateCyberwareDraft } from '../js/cyberware-draft.js';
import { loadCharacter, STORAGE_KEY } from '../js/storage.js';
const json = async name => JSON.parse(await readFile(new URL(`../data/${name}.json`,import.meta.url),'utf8'));
const rules = await json('rules'); rules.cyberwareRules = await json('cyberware'); rules.equipmentRules = await json('equipment'); rules.skillRules = await json('skills');
const character = () => { const c=createCharacter(rules); c.name='Batch test'; c.role='solo'; return c; };
const add = (c,draft,id,location) => { const result=addToCyberwareDraft(c,rules,draft,id,location); assert.equal(result.ok,true,result.error); return result.additions; };

test('Mehrere Implantate samt Basis und Option bleiben bis zur gemeinsamen Installation mutationsfrei', () => {
  const c=character(), original=structuredClone(c);
  let draft=add(c,[],'neural-link','neural');
  draft=add(c,draft,'interface-plugs','neural');
  draft=add(c,draft,'biomonitor','fashion');
  assert.deepEqual(c,original);
  const preview=evaluateCyberwareDraft(c,rules,draft);
  assert.deepEqual(preview.errors,[]); assert.equal(preview.after.funds.remaining,1550);
  assert.equal(draft[1].parent,draft[0].id);
  assert.equal(commitCyberwareDraft(c,rules,draft).ok,true);
  assert.deepEqual(evaluateCharacter(c,rules),preview.after);
  assert.deepEqual(validateCharacter(JSON.parse(JSON.stringify(c)),rules),c);
});
test('Geplante Basis herausnehmen entfernt abhängige Optionen, lässt unabhängige Auswahl bestehen', () => {
  const c=character(); let draft=add(c,[],'cyberarm','arm-left');
  draft=add(c,draft,'tool-hand','arm-left'); draft=add(c,draft,'neural-link','neural');
  const remaining=removeFromCyberwareDraft(c,rules,draft,draft[0].id);
  assert.deepEqual(remaining.map(item=>item.catalogId),['neural-link']);
  assert.equal(c.cyberware.items.length,0);assert.equal(evaluateFunds(c,rules).remaining,2550);
});
test('Option aus Entwurf entfernen verändert eine bereits installierte Basis nicht', () => {
  const c=character(); assert.ok(commitCyberwareDraft(c,rules,add(c,[],'cyberarm','arm-left')).ok);
  const original=structuredClone(c); const draft=add(c,[],'tool-hand','arm-left');
  assert.deepEqual(removeFromCyberwareDraft(c,rules,draft,draft[0].id),[]);assert.deepEqual(c,original);
});
test('Überziehung, falsches Ziel und fehlende Basis ändern keinen Entwurf oder Charakter', () => {
  const c=character(),original=structuredClone(c); const draft=add(c,[],'cyberarm','arm-left'),snapshot=structuredClone(draft);
  for (const [id,location] of [['cyberarm','eye-left'],['kerenzikov','neural']]) assert.equal(addToCyberwareDraft(c,rules,draft,id,location).ok,false);
  assert.deepEqual(draft,snapshot);assert.deepEqual(c,original);
  for(let i=0;i<5;i++) assert.ok(buyEquipment(c,rules,'tech-bag').ok);
  const purchased=structuredClone(c);assert.equal(commitCyberwareDraft(c,rules,draft).ok,false);assert.deepEqual(c,purchased);
});
test('Manipulierte Doppel-IDs und entfernte Voraussetzungen verhindern den gesamten Einbau', () => {
  const c=character();let draft=add(c,[],'neural-link','neural');draft=add(c,draft,'interface-plugs','neural');
  const original=structuredClone(c);
  assert.equal(commitCyberwareDraft(c,rules,[draft[1]]).ok,false);
  assert.equal(commitCyberwareDraft(c,rules,[draft[0],{...draft[1],id:draft[0].id}]).ok,false);
  assert.deepEqual(c,original);
});
test('Ausbau benötigt einen Kostenbetrag; Kaufpreis und Menschlichkeitsverlust bleiben bestehen', () => {
  const c=character();c.campaign.sessionUnlocked=true;assert.ok(commitCyberwareDraft(c,rules,add(c,[],'neural-link','neural')).ok);
  const before=evaluateCharacter(c,rules), original=structuredClone(c), id=c.cyberware.items[0].id;
  for(const fee of [undefined,NaN,-1,0.5,Infinity,1000001,999999]) { assert.equal(removeCyberware(c,rules,id,{},fee).ok,false);assert.deepEqual(c,original); }
  assert.ok(removeCyberware(c,rules,id,{},100).ok);
  const after=evaluateCharacter(c,rules);
  assert.equal(after.funds.remaining,before.funds.remaining-100);assert.equal(after.funds.removalCost,100);
  assert.equal(after.cyberware.current,before.cyberware.current);assert.equal(after.cyberware.maximum,before.cyberware.maximum+2);
  assert.deepEqual(validateCharacter(JSON.parse(JSON.stringify(c)),rules),c);
});
test('Ausbau von Fashionware erstattet keinen Zuschuss; erneuter Einbau kostet erneut', () => {
  const c=character();c.campaign.sessionUnlocked=true;assert.ok(commitCyberwareDraft(c,rules,add(c,[],'biomonitor','fashion')).ok);
  assert.ok(removeCyberware(c,rules,c.cyberware.items[0].id,{},50).ok);
  assert.equal(evaluateFunds(c,rules).fashionRemaining,700);assert.equal(evaluateFunds(c,rules).remaining,2500);
  assert.ok(commitCyberwareDraft(c,rules,add(c,[],'biomonitor','fashion')).ok);
  assert.equal(evaluateFunds(c,rules).fashionRemaining,600);
});
test('Format 9 wird verlustfrei samt Originalbackup übernommen und erhält leere Ausbauhistorie', () => {
  const c=character();assert.ok(commitCyberwareDraft(c,rules,add(c,[],'cyberarm','arm-left')).ok);
  const old={...c,version:9,cyberware:{items:c.cyberware.items,limit:null}};
  const raw=JSON.stringify(old),data=new Map([[STORAGE_KEY,raw]]);
  const loaded=loadCharacter(rules,{getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value)});
  assert.equal(loaded.blocked,false);assert.deepEqual(loaded.character,c);assert.equal(data.get('red-builder.character.v9.backup'),raw);
  for(const removed of [[{catalogId:'unknown',fee:1}],[{catalogId:'cyberarm',fee:-1}],null]) assert.throws(()=>validateCharacter({...c,cyberware:{...c.cyberware,removed}},rules));
});
