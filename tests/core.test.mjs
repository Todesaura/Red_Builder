import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createCharacter, validateCharacter, migrateCharacter, validatePortrait } from '../js/model.js';
import { assignAttribute, applyRecommendation, pointsRemaining, resolveValue, evaluateCharacter } from '../js/rules.js';
import { explainAttribute } from '../js/explanations.js';
import { loadCharacter, saveCharacter, STORAGE_KEY, BACKUP_KEY } from '../js/storage.js';
import { escapeHtml } from '../js/ui.js';

const rules = JSON.parse(await readFile(new URL('../data/rules.json', import.meta.url), 'utf8'));
rules.skillRules = JSON.parse(await readFile(new URL('../data/skills.json', import.meta.url), 'utf8'));
function memoryStorage() {
  const data = new Map();
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
}
function oldCharacter(method = 'array') {
  return { version: 1, name: 'Nyx', role: 'solo', method, allocations: {
    array: Object.fromEntries(rules.attributes.map(({id}, index) => [id, [8,8,7,7,6,6,6,5,5,4][index]])),
    points: Object.fromEntries(rules.attributes.map(({id}) => [id, 2]))
  }};
}

test('Neuer Charakter startet mit Empfehlung und leerer Identität', () => {
  const character = createCharacter(rules);
  assert.equal(character.method, 'recommendation');
  assert.equal(character.portrait, null);
  assert.equal(pointsRemaining(character, rules), 42);
  assert.equal(evaluateCharacter(character, rules).complete, false);
  assert.equal(evaluateCharacter(character, rules).attributes.INT.base, null);
  assert.equal('array' in character.allocations, false);
});

test('Alle zehn Empfehlungen sind gültige Homebrew-Verteilungen mit exakt 62 Punkten', () => {
  assert.equal(rules.roles.length, 10);
  for (const role of rules.roles) {
    assert.equal(role.recommendation.homebrew, true);
    assert.match(role.recommendation.source, /Homebrew/);
    assert.deepEqual(Object.keys(role.recommendation.stats), rules.attributes.map(({id}) => id));
    const values = Object.values(role.recommendation.stats);
    assert.equal(values.reduce((sum,value) => sum + value, 0), 62, role.id);
    assert.ok(values.every(value => Number.isInteger(value) && value >= 2 && value <= 8));
  }
});

test('Empfehlung richtet sich nach der Rolle, ohne Attributboni zu addieren', () => {
  const character = createCharacter(rules);
  character.name = 'Nyx';
  for (const role of rules.roles) {
    character.role = role.id;
    const result = evaluateCharacter(character, rules);
    assert.equal(result.attributesComplete, true);
    for (const {id} of rules.attributes) {
      assert.equal(result.attributes[id].base, role.recommendation.stats[id]);
      assert.equal(result.attributes[id].effective, role.recommendation.stats[id]);
      assert.deepEqual(result.attributes[id].modifiers, []);
    }
  }
});

test('Eigene Punkteverteilung bleibt beim Methoden- und Rollenwechsel erhalten', () => {
  const character = createCharacter(rules);
  character.method = 'points';
  assignAttribute(character, rules, 'REF', 5);
  character.method = 'recommendation';
  character.role = 'solo';
  assert.equal(evaluateCharacter(character, rules).attributes.REF.base, 8);
  assert.equal(assignAttribute(character, rules, 'REF', 7).ok, false);
  character.role = 'tech';
  character.method = 'points';
  assert.equal(character.allocations.points.REF, 5);
});

test('Empfehlung lässt sich als unabhängige eigene Verteilung übernehmen', () => {
  const character = createCharacter(rules);
  assert.equal(applyRecommendation(character, rules).ok, false);
  character.role = 'solo';
  assert.equal(applyRecommendation(character, rules).ok, true);
  assert.equal(character.method, 'points');
  assert.equal(pointsRemaining(character, rules), 0);
  assignAttribute(character, rules, 'REF', 7);
  assert.equal(rules.roles.find(role => role.id === 'solo').recommendation.stats.REF, 8);
});

test('Punktebudget, Ganzzahlen und Grenzen werden vor einer Mutation geprüft', () => {
  const character = createCharacter(rules);
  character.method = 'points';
  for (const bad of [1,9,3.5,NaN,Infinity,'8',null]) assert.equal(assignAttribute(character,rules,'INT',bad).ok,false);
  assert.equal(assignAttribute(character,rules,'FAKE',8).ok,false);
  for (const {id} of rules.attributes.slice(0,7)) assert.equal(assignAttribute(character,rules,id,8).ok,true);
  assert.equal(pointsRemaining(character,rules),0);
  assert.equal(assignAttribute(character,rules,'MOVE',3).ok,false);
  assert.equal(character.allocations.points.MOVE,2);
  assignAttribute(character,rules,'INT',7);
  assert.equal(assignAttribute(character,rules,'MOVE',3).ok,true);
  character.name='V'; character.role='solo';
  assert.equal(evaluateCharacter(character,rules).attributesComplete,true);
});

test('Nur permanente Effekte verändern das effektive Attribut', () => {
  const effects=[{type:'permanent',value:2,label:'Test',source:'Testquelle'},{type:'situational',value:4},{type:'skill',value:3}];
  const result=resolveValue(5,'Testbasis',effects);
  assert.equal(result.effective,7);
  assert.equal(result.base,5);
  assert.equal(result.modifiers.length,3);
  assert.equal(resolveValue(null,'Offen',effects).effective,null);
  result.modifiers[0].value=99;
  assert.equal(effects[0].value,2);
});

test('Attribut-Erklärungen nennen kurz den Verwendungszweck', () => {
  const character=createCharacter(rules); character.role='solo';
  const value=evaluateCharacter(character,rules).attributes.REF;
  const text=explainAttribute('REF',value,'recommendation');
  assert.match(text,/Fernkampfangriffe/); assert.match(text,/Initiative/); assert.doesNotMatch(text,/Homebrew|Quelle/);
  assert.equal(text,explainAttribute('REF',value,'recommendation'));
  assert.equal(explainAttribute('REF',value,'points'),text);
  assert.match(explainAttribute('REF',resolveValue(null,'Offen'),'recommendation'),/zuerst deine Rolle/);
});

test('Version 9 speichert Porträt und eigene Werte sicher', () => {
  const storage=memoryStorage();
  const character=createCharacter(rules);
  character.name='<img src=x onerror=alert(1)>'; character.role='tech';
  character.portrait='data:image/jpeg;base64,YWJj';
  assert.equal(saveCharacter(character,storage).ok,true);
  assert.deepEqual(loadCharacter(rules,storage).character,character);
  assert.equal(escapeHtml(character.name),'&lt;img src=x onerror=alert(1)&gt;');
});

test('Aktive alte Array-Werte werden übernommen, Originaldaten gesichert', () => {
  const storage=memoryStorage(); const old=oldCharacter(); const raw=JSON.stringify(old);
  storage.setItem(STORAGE_KEY,raw);
  const loaded=loadCharacter(rules,storage);
  assert.equal(loaded.blocked,false);
  assert.equal(loaded.character.version,11);
  assert.equal(loaded.character.method,'points');
  assert.deepEqual(loaded.character.allocations.points,old.allocations.array);
  assert.equal(storage.getItem(BACKUP_KEY),raw);
  assert.equal(storage.getItem(STORAGE_KEY),raw);
  old.allocations.array.INT=null;
  assert.equal(migrateCharacter(old,rules).allocations.points.INT,2);
});

test('Alte Punkteverteilung und vorhandene Sicherungen bleiben erhalten', () => {
  const storage=memoryStorage(); const old=oldCharacter('points');
  storage.setItem(BACKUP_KEY,'frühere Sicherung');
  storage.setItem(STORAGE_KEY,JSON.stringify(old));
  assert.deepEqual(loadCharacter(rules,storage).character.allocations.points,old.allocations.points);
  assert.equal(storage.getItem(BACKUP_KEY),'frühere Sicherung');
});

test('Ungültige Daten, überschrittene Budgets und aktive Bildformate werden abgewiesen', () => {
  const storage=memoryStorage();
  for(const raw of ['{bad','null','[]','{"version":99}','x'.repeat(450001)]) {
    storage.setItem(STORAGE_KEY,raw); assert.equal(loadCharacter(rules,storage).blocked,true);
    assert.equal(storage.getItem(STORAGE_KEY),raw);
  }
  for(const mutate of [
    item=>{item.version=99;}, item=>{item.name=123;}, item=>{item.name='a'.repeat(61);},
    item=>{item.role='hacker';}, item=>{item.method='array';}, item=>{item.allocations={};},
    item=>{item.allocations.points.INT=9;}, item=>{item.allocations.points.INT=2.5;},
    item=>{for(const id of Object.keys(item.allocations.points)) item.allocations.points[id]=8;},
    item=>{item.portrait='javascript:alert(1)';}, item=>{item.portrait='data:image/svg+xml;base64,YWJj';}
  ]) {const item=createCharacter(rules); mutate(item); assert.throws(()=>validateCharacter(item,rules));}
  assert.throws(()=>validatePortrait('data:image/png;base64,'+'A'.repeat(400001)));
});

test('Unerwartete Felder werden entfernt und Speicherfehler abgefangen', () => {
  const character=createCharacter(rules);
  const input=JSON.parse(JSON.stringify(character).replace('"version":9','"__proto__":{"polluted":true},"version":9'));
  input.modifiers=[{type:'permanent',value:99}];
  assert.deepEqual(validateCharacter(input,rules),character);
  assert.equal({}.polluted,undefined);
  const blocked={getItem(){throw new Error('Kein Zugriff');},setItem(){throw new Error('Voll');}};
  assert.equal(loadCharacter(rules,blocked).blocked,true);
  assert.equal(saveCharacter(character,blocked).ok,false);
});

test('Verweigerter Zugriff auf localStorage selbst wird abgefangen', () => {
  const original=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
  Object.defineProperty(globalThis,'localStorage',{configurable:true,get(){throw new Error('SecurityError');}});
  try {assert.equal(loadCharacter(rules).blocked,true); assert.equal(saveCharacter(createCharacter(rules)).ok,false);}
  finally {if(original) Object.defineProperty(globalThis,'localStorage',original); else delete globalThis.localStorage;}
});
