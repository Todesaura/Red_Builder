import test from 'node:test';
import assert from 'node:assert/strict';
import {completeCharacter,rules} from './helpers/pdf-fixture.mjs';
import {deleteArchivedCharacter,archivedCharacters} from '../js/character-library.js';
import {STORAGE_KEY} from '../js/storage.js';
import {renderCharacterLibrary,reviewDisclosure,renderDeleteCharacterDialog} from '../js/ui.js';
import {renderEquipmentWarnings} from '../js/ui-equipment-warnings.js';
import {evaluateCharacter} from '../js/rules.js';
const prefix='red-builder.character.archive.';
function memory(){
  const data=new Map();return {data,get length(){return data.size;},key:i=>[...data.keys()][i],getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value),removeItem:key=>data.delete(key)};
}

test('Löschen entfernt exakt einen Archivstand und erhält aktuellen Entwurf, andere Archive und Sicherungen',()=>{
  const storage=memory(),raw=JSON.stringify(completeCharacter());
  for(const key of [STORAGE_KEY,prefix+'1',prefix+'2','red-builder.character.v9.backup','andere-app'])storage.setItem(key,raw);
  assert.ok(deleteArchivedCharacter(prefix+'1',rules,storage).ok);
  assert.equal(storage.getItem(prefix+'1'),null);
  for(const key of [STORAGE_KEY,prefix+'2','red-builder.character.v9.backup','andere-app'])assert.equal(storage.getItem(key),raw);
  assert.equal(archivedCharacters(rules,storage).length,1);
});

test('Aktueller Speicher, fremde Schlüssel, fehlende Archive und Löschfehler werden sicher abgewiesen',()=>{
  const storage=memory(),raw=JSON.stringify(completeCharacter());storage.setItem(STORAGE_KEY,raw);storage.setItem(prefix+'1',raw);
  for(const key of [STORAGE_KEY,'andere-app',null,prefix+'999'])assert.equal(deleteArchivedCharacter(key,rules,storage).ok,false);
  storage.removeItem=()=>{throw Error('gesperrt');};
  assert.equal(deleteArchivedCharacter(prefix+'1',rules,storage).ok,false);
  assert.equal(storage.getItem(prefix+'1'),raw);assert.equal(storage.getItem(STORAGE_KEY),raw);
});

test('Archivliste bietet getrennte Öffnen-/Löschbuttons mit sicher escaped Namen und PDF-Sperre',()=>{
  const state={archivedCharacters:[{key:prefix+'1',name:'<script>',role:'solo'}]};
  const html=renderCharacterLibrary(state,rules);
  assert.match(html,/<details id="character-library-list">/);assert.match(html,/data-open-character=/);assert.match(html,/data-delete-character=/);
  assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>/);
  assert.equal((renderCharacterLibrary({...state,pdfExportBusy:true},rules).match(/disabled/g)||[]).length,2);
  assert.equal(renderCharacterLibrary({archivedCharacters:[]},rules),'');
});

test('Überprüfungsbereiche sind zunächst geschlossen und behalten Inhalte; Warntext enthält keine Gruppenausrüstung',()=>{
  for(const [id,label] of [['lifepath','Dein Lebensweg'],['skills','Gelernte Fertigkeiten'],['cyberware','Installierte Cyberware'],['equipment','Waffen & Ausrüstung']]){
    const html=reviewDisclosure(id,label,'<section><h3>Alter Titel</h3><p>Vollständiger Inhalt</p></section>');
    assert.match(html,new RegExp(`<details id="review-${id}" class="review-disclosure">`));
    assert.match(html,/<summary>/);assert.match(html,/Vollständiger Inhalt/);assert.doesNotMatch(html,/Alter Titel|\bopen(?:\s|=|>)/);
  }
  const c=completeCharacter(),warnings=renderEquipmentWarnings(c,rules,evaluateCharacter(c,rules));
  assert.match(warnings,/Prüfe, ob du diese Lücken bewusst lässt\./);
  assert.doesNotMatch(warnings,/Ausrüstung von deiner Gruppe erhältst/);
});

test('Löschdialog erfordert eine gesonderte Bestätigung und bietet Abbrechen als voreingestellten Fokus',()=>{
  assert.equal(renderDeleteCharacterDialog(null),'');
  const html=renderDeleteCharacterDialog({key:prefix+'1',name:'<img onerror=alert(1)>'});
  assert.match(html,/role="alertdialog"/);assert.match(html,/wird permanent gelöscht/);assert.match(html,/nicht wiederhergestellt/);
  assert.match(html,/data-action="cancel-delete-character" autofocus/);assert.match(html,/data-action="confirm-delete-character"/);
  assert.match(html,/&lt;img/);assert.doesNotMatch(html,/<img/);
});
