import test from 'node:test';
import assert from 'node:assert/strict';
import {rules,completeCharacter} from './helpers/pdf-fixture.mjs';
import {applyPlayAction} from '../js/play-tracking.js';
import {evaluateCharacter} from '../js/rules.js';
import {CRITICAL_INJURIES} from '../js/critical-injuries.js';
import {renderCriticalControls,renderCriticalDialog} from '../js/ui-play-critical.js';
import {characterJson,parseCharacterJson} from '../js/character-files.js';

test('Kopf/Körper bieten getrennte Auswahlen und speichern Verletzung samt optionalen fünf Zusatzschaden',()=>{
  for(const slot of ['head','body'])for(const addBonus of [false,true]){
    const c=completeCharacter(),before=structuredClone(c),hp=evaluateCharacter(c,rules).health.current;
    const result=applyPlayAction(c,rules,{type:'critical',slot,injury:CRITICAL_INJURIES[slot][0][0],notes:'Linke Seite',addBonus});
    assert.ok(result.ok,result.error);assert.deepEqual(c,before);
    assert.equal(evaluateCharacter(result.character,rules).health.current,hp-(addBonus?5:0));
    const loaded=parseCharacterJson(characterJson(result.character,rules),rules);
    assert.equal(loaded.campaign.injuries.length,1);assert.equal(loaded.campaign.injuries[0].status,'active');assert.equal(loaded.campaign.injuries[0].notes,'Linke Seite');
    assert.match(loaded.campaign.injuries[0].name,slot==='head'?/^Kopf:/ : /^Körper:/);
  }
});
test('Unpassende Verletzungen und überlange Notizen werden ohne Teilbuchung verworfen',()=>{
  const c=completeCharacter(),before=structuredClone(c);
  for(const action of [{slot:'head',injury:'broken-leg'},{slot:'body',injury:'lost-eye'},{slot:'other',injury:'lost-eye'},{slot:'head',injury:'lost-eye',notes:'a'.repeat(801)}])assert.equal(applyPlayAction(c,rules,{type:'critical',notes:'',addBonus:true,...action}).ok,false);
  assert.deepEqual(c,before);
});
test('Auswahlmenüs zeigen nur passende Namen, erfordern Bestätigung und lassen Abbrechen zu',()=>{
  assert.equal(renderCriticalDialog({}),'');
  const head=renderCriticalDialog({playCriticalSlot:'head'}),body=renderCriticalDialog({playCriticalSlot:'body'});
  assert.match(head,/Beschädigtes Auge/);assert.doesNotMatch(head,/Gebrochenes Bein/);
  assert.match(body,/Gebrochenes Bein/);assert.doesNotMatch(body,/Beschädigtes Auge/);
  assert.match(head,/name="addBonus" checked/);assert.match(head,/data-play-critical-cancel/);
  assert.match(renderCriticalControls(completeCharacter(),{}),/Kritisch getroffen Kopf/);
});
