import test from 'node:test';
import assert from 'node:assert/strict';
import {completeCharacter,rules} from './helpers/pdf-fixture.mjs';
import {createCharacter} from '../js/model.js';
import {STORAGE_KEY,loadCharacter,saveCharacter} from '../js/storage.js';
import {ACTIVE_ARCHIVE_KEY,archivedCharacters,readArchivedCharacter,switchCharacter} from '../js/character-library.js';
function memory(){const data=new Map();return {data,get length(){return data.size;},key:i=>[...data.keys()][i],getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value),removeItem:key=>data.delete(key)};}
function profiles(){
  const storage=memory(),a=completeCharacter(),b=completeCharacter('tech');a.name='Erster';b.name='Zweiter';
  storage.setItem(STORAGE_KEY,JSON.stringify(a));
  assert.ok(switchCharacter(a,b,rules,storage).ok);
  const aKey=archivedCharacters(rules,storage)[0].key;
  assert.ok(switchCharacter(b,a,rules,storage,{nextKey:aKey}).ok);
  const bKey=archivedCharacters(rules,storage).find(e=>e.name==='Zweiter').key;
  return {storage,a,b,aKey,bKey};
}

test('Wiederholtes Öffnen zweier gespeicherter Profile erzeugt keine weiteren Archivkopien',()=>{
  const {storage,aKey,bKey}=profiles();
  for(let i=0;i<20;i++){
    const nextKey=i%2? aKey:bKey;
    assert.ok(switchCharacter(loadCharacter(rules,storage).character,readArchivedCharacter(nextKey,rules,storage),rules,storage,{nextKey}).ok);
    assert.equal(archivedCharacters(rules,storage).length,2);
    assert.equal(storage.getItem(ACTIVE_ARCHIVE_KEY),nextKey);
  }
});

test('Ein leerer neuer Entwurf wird beim Öffnen eines Profils nicht als zusätzlicher Charakter archiviert',()=>{
  const storage=memory(),a=completeCharacter();
  assert.ok(switchCharacter(a,createCharacter(rules),rules,storage).ok);
  const key=archivedCharacters(rules,storage)[0].key;
  assert.ok(switchCharacter(createCharacter(rules),readArchivedCharacter(key,rules,storage),rules,storage,{nextKey:key}).ok);
  assert.equal(archivedCharacters(rules,storage).length,1);
  assert.equal(storage.getItem(ACTIVE_ARCHIVE_KEY),key);
});

test('Änderungen und Umbenennung nach Neuladen aktualisieren dasselbe Profil',()=>{
  const {storage,aKey,bKey}=profiles(),c=loadCharacter(rules,storage).character;
  c.name='Umbenannt';c.portrait='data:image/jpeg;base64,YWJj';
  saveCharacter(c,storage);
  const reloaded=loadCharacter(rules,storage).character;
  assert.ok(switchCharacter(reloaded,readArchivedCharacter(bKey,rules,storage),rules,storage,{nextKey:bKey}).ok);
  assert.deepEqual(readArchivedCharacter(aKey,rules,storage),c);
  assert.equal(archivedCharacters(rules,storage).length,2);
});

test('Öffnen des aktiven Profils ersetzt frische Änderungen nicht durch den älteren Archivstand',()=>{
  const {storage,aKey}=profiles(),c=loadCharacter(rules,storage).character;c.name='Aktueller Entwurf';
  const result=switchCharacter(c,readArchivedCharacter(aKey,rules,storage),rules,storage,{nextKey:aKey});
  assert.ok(result.ok);assert.equal(result.character.name,c.name);
  assert.deepEqual(readArchivedCharacter(aKey,rules,storage),c);
  assert.equal(archivedCharacters(rules,storage).length,2);
});

test('Alte Speicherstände ohne Bindung verwenden nur exakt gleiche Archive, niemals nur den Namen',()=>{
  const {storage,aKey,bKey}=profiles();storage.removeItem(ACTIVE_ARCHIVE_KEY);
  const a=loadCharacter(rules,storage).character;
  assert.ok(switchCharacter(a,readArchivedCharacter(bKey,rules,storage),rules,storage,{nextKey:bKey}).ok);
  assert.equal(archivedCharacters(rules,storage).length,2);
  const other=completeCharacter('medtech');other.name=a.name;
  // An explicitly opened profile is identified by its key; names are never identities.
  const distinct=memory();distinct.setItem('red-builder.character.archive.1',JSON.stringify(a));
  assert.ok(switchCharacter(other,createCharacter(rules),rules,distinct).ok);
  assert.equal(archivedCharacters(rules,distinct).length,2);
  assert.deepEqual(readArchivedCharacter('red-builder.character.archive.1',rules,distinct),a);
  assert.ok(readArchivedCharacter(aKey,rules,storage));
});

test('Speicherfehler oder verschwundenes Ziel lassen aktiven Stand und Profilbindung bestehen',()=>{
  const {storage,aKey,bKey}=profiles(),raw=storage.getItem(STORAGE_KEY),bound=storage.getItem(ACTIVE_ARCHIVE_KEY);
  const a=loadCharacter(rules,storage).character,b=readArchivedCharacter(bKey,rules,storage);
  for(const failing of [ACTIVE_ARCHIVE_KEY,STORAGE_KEY]){
    const broken={...storage,setItem:(key,value)=>{if(key===failing)throw Error('Quota');storage.setItem(key,value);}};
    assert.equal(switchCharacter(a,b,rules,broken,{nextKey:bKey}).ok,false);
    assert.equal(storage.getItem(STORAGE_KEY),raw);assert.equal(storage.getItem(ACTIVE_ARCHIVE_KEY),bound);
  }
  assert.equal(switchCharacter(a,b,rules,storage,{nextKey:'red-builder.character.archive.missing'}).ok,false);
  assert.equal(storage.getItem(ACTIVE_ARCHIVE_KEY),aKey);assert.equal(storage.getItem(STORAGE_KEY),raw);
});
