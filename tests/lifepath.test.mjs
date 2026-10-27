import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createCharacter, validateCharacter } from '../js/model.js';
import { createLifepath, chooseLifepath, editLifepath, evaluateLifepath, validateLifepath, MAX_LIFEPATH_TEXT } from '../js/lifepath.js';
import { LIFEPATH_QUESTIONS } from '../js/lifepath-data.js';
import { renderLifepath, renderLifepathSummary } from '../js/ui-lifepath.js';
import { evaluateCharacter } from '../js/rules.js';
import { loadCharacter, saveCharacter, STORAGE_KEY } from '../js/storage.js';
const json=async name=>JSON.parse(await readFile(new URL(`../data/${name}.json`,import.meta.url),'utf8'));
const rules=await json('rules');rules.skillRules=await json('skills');rules.cyberwareRules=await json('cyberware');rules.equipmentRules=await json('equipment');
const fresh=()=>{const c=createCharacter(rules);c.name='Test';c.role='solo';return c;};
test('Lebensweg bietet vier unterschiedliche Vorschläge je Frage und wirkt nicht auf Spielwerte',()=>{
 const c=fresh(),before=evaluateCharacter(c,rules);
 assert.equal(LIFEPATH_QUESTIONS.length,20);
 for(const question of LIFEPATH_QUESTIONS){assert.equal(question.options.length,4);assert.equal(new Set(question.options).size,4);assert.ok(chooseLifepath(c,question.id,'first').ok);}
 const after=evaluateCharacter(c,rules);assert.equal(after.lifepath.answered,20);
 for(const key of ['attributes','skills','funds','roleAbilities','derived'])assert.deepEqual(after[key],before[key]);
});
test('Eigene Idee, Vorschläge und Zurücknehmen bewahren den persönlichen Textentwurf',()=>{
 const c=fresh();chooseLifepath(c,'goal','custom');editLifepath(c,'goal','  Ein neues Zuhause.\nFür meine Crew.  ');
 assert.equal(evaluateLifepath(c).answered,1);assert.match(renderLifepathSummary(c),/Ein neues Zuhause/);
 chooseLifepath(c,'goal','second');assert.equal(c.lifepath.goal.custom,'  Ein neues Zuhause.\nFür meine Crew.  ');
 chooseLifepath(c,'goal','custom');assert.equal(evaluateLifepath(c).entries.find(q=>q.id==='goal').answer,'Ein neues Zuhause.\nFür meine Crew.');
 chooseLifepath(c,'goal',null);assert.equal(evaluateLifepath(c).answered,0);assert.ok(c.lifepath.goal.custom.includes('Crew'));
});
test('Offene Fragen sind erlaubt; eine ausgewählte leere eigene Idee wird verständlich gemeldet',()=>{
 const c=fresh();assert.deepEqual(evaluateLifepath(c).errors,[]);
 chooseLifepath(c,'friend','custom');editLifepath(c,'friend','   ');assert.equal(evaluateLifepath(c).errors.length,1);assert.ok(evaluateCharacter(c,rules).errors.some(e=>e.includes('eigene Idee')));
 editLifepath(c,'friend','Eine alte Freundin.');assert.deepEqual(evaluateLifepath(c).errors,[]);
});
test('Unbekannte Felder, Auswahlen und überlange Texte werden vor Mutation abgelehnt',()=>{
 const c=fresh(),before=structuredClone(c);
 assert.equal(chooseLifepath(c,'cheat','first').ok,false);assert.equal(chooseLifepath(c,'goal','fifth').ok,false);assert.equal(editLifepath(c,'goal','x'.repeat(MAX_LIFEPATH_TEXT+1)).ok,false);assert.deepEqual(c,before);
 const input=createLifepath();input.goal.cost=-100;input.extra={choice:'first',custom:''};const safe=validateLifepath(input);assert.equal('cost' in safe.goal,false);assert.equal('extra' in safe,false);
 input.goal.choice='unknown';assert.throws(()=>validateLifepath(input));
});
test('Freitext wird im Editor und in der Übersicht sicher dargestellt',()=>{
 const c=fresh();chooseLifepath(c,'enemy','custom');editLifepath(c,'enemy','</textarea><script>test</script>');
 for(const html of [renderLifepath(c),renderLifepathSummary(c)]){assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>/);}
 assert.deepEqual(validateCharacter(c,rules),c);
});
test('Format 7 erhält leeren Lebensweg mit Backup; Rollenpunkte und Ausstattung bleiben erhalten',()=>{
 const c=fresh();c.version=7;delete c.lifepath;c.rolePoints.solo.initiative=4;c.equipment.items=[{catalogId:'agent',quantity:1}];
 const raw=JSON.stringify(c),data=new Map([[STORAGE_KEY,raw]]),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
 const loaded=loadCharacter(rules,storage);assert.equal(loaded.blocked,false);assert.equal(loaded.character.version,11);assert.deepEqual(loaded.character.rolePoints,c.rolePoints);assert.deepEqual(loaded.character.equipment,c.equipment);assert.deepEqual(loaded.character.lifepath,createLifepath());assert.equal(data.get('red-builder.character.v7.backup'),raw);
 chooseLifepath(loaded.character,'goal','custom');editLifepath(loaded.character,'goal','Ein neues Kapitel.');assert.ok(saveCharacter(loaded.character,storage).ok);assert.deepEqual(loadCharacter(rules,storage).character,loaded.character);
});
