import test from 'node:test';
import assert from 'node:assert/strict';
import {completeCharacter, rules} from './helpers/pdf-fixture.mjs';
import {createCharacter, validateCharacter} from '../js/model.js';
import {characterJson, parseCharacterJson, readCharacterFile, characterJsonFilename, MAX_CHARACTER_JSON_LENGTH, MAX_CHARACTER_FILE_BYTES} from '../js/character-files.js';
import {switchCharacter, archivedCharacters, readArchivedCharacter, ACTIVE_ARCHIVE_KEY} from '../js/character-library.js';
import {buyEquipment} from '../js/economy.js';
import {createSessionDraft, completeSession} from '../js/session-report.js';

test('JSON erhält alle Rollen, unvollständige Entwürfe, Bild und Inventar ohne Änderung des Originals',()=>{
  for(const c of [createCharacter(rules), ...rules.roles.map(role=>completeCharacter(role.id))]) {
    c.portrait='data:image/png;base64,aGVsbG8=';
    buyEquipment(c,rules,'agent');
    const before=structuredClone(c);
    assert.deepEqual(parseCharacterJson(characterJson(c,rules),rules),validateCharacter(c,rules));
    assert.deepEqual(c,before);
  }
});

test('Ungültige Dateien und übergroße Inhalte werden abgewiesen; BOM und ältere Formate werden gelesen',async()=>{
  for(const text of ['', '{', '[]','null',JSON.stringify({version:999}),JSON.stringify({...completeCharacter(),role:'unbekannt'})])assert.throws(()=>parseCharacterJson(text,rules));
  assert.throws(()=>parseCharacterJson(' '.repeat(MAX_CHARACTER_JSON_LENGTH+1),rules),/groß/);
  await assert.rejects(readCharacterFile({size:MAX_CHARACTER_FILE_BYTES+1,text:()=>{throw Error('nicht lesen');}},rules),/groß/);
  const legacy=completeCharacter();legacy.version=9;
  assert.equal(parseCharacterJson('\uFEFF'+JSON.stringify(legacy),rules).version,11);
  assert.equal((await readCharacterFile(new Blob([characterJson(completeCharacter(),rules)]),rules)).name,'Nyx Müller');
});

test('Abgeschlossene Session mit Einnahmen und Verlauf bleibt im JSON erhalten',()=>{
  const c=completeCharacter(),draft=createSessionDraft(c);
  draft.actions=[{type:'money',category:'earned',amount:500}];
  draft.ipAward=40;
  const result=completeSession(c,rules,draft);
  assert.equal(result.ok,true,result.error);
  const restored=parseCharacterJson(characterJson(result.character,rules),rules);
  assert.deepEqual(restored.campaign,result.character.campaign);
  assert.equal(restored.campaign.history.length,1);
});

test('Import einer älteren Sicherung des aktiven Profils stellt die Datei wieder her und archiviert aktuelle Änderungen',()=>{
  const data=new Map(),storage={get length(){return data.size;},key:i=>[...data.keys()][i],getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
  const old=completeCharacter(),key='red-builder.character.archive.1';
  storage.setItem(key,JSON.stringify(old));storage.setItem(ACTIVE_ARCHIVE_KEY,key);
  const current=structuredClone(old);current.name='Neuer Stand';
  const result=switchCharacter(current,parseCharacterJson(characterJson(old,rules),rules),rules,storage,{importAsCopy:true});
  assert.equal(result.ok,true);assert.equal(result.character.name,old.name);
  assert.equal(readArchivedCharacter(key,rules,storage).name,'Neuer Stand');
  assert.equal(archivedCharacters(rules,storage).length,1);
  assert.equal(storage.getItem(ACTIVE_ARCHIVE_KEY),'');
});

test('Dateiname bleibt sicher und verständlich; zusätzliche JSON-Felder werden nicht übernommen',()=>{
  assert.equal(characterJsonFilename({name:'Nyx / Müller:*?'}),'RED-Builder-Nyx - Müller---.json');
  assert.equal(characterJsonFilename({name:''}),'RED-Builder-Charakter.json');
  const c=completeCharacter();c.injected='<script>';
  assert.equal(parseCharacterJson(JSON.stringify(c),rules).injected,undefined);
});
