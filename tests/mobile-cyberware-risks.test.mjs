import test from 'node:test';
import assert from 'node:assert/strict';
import {completeCharacter,rules} from './helpers/pdf-fixture.mjs';
import {attributeRisk,renderAttributeRisk} from '../js/attribute-risks.js';
import {attributeCard} from '../js/ui.js';
import {evaluateCharacter} from '../js/rules.js';
import {quickAddCyberware} from '../js/cyberware-quick-add.js';
import {commitCyberwareDraft} from '../js/cyberware-draft.js';
import {renderInstalledCyberware} from '../js/ui-cyberware-details.js';
import {renderShoppingSummary} from '../js/ui-shopping-summary.js';

test('Jedes niedrige Attribut erhält einen eigenen Hinweis; ab 5 und ohne Wert bleibt er aus',()=>{
  for(const {id} of rules.attributes){assert.ok(attributeRisk(id,4).length>20,id);assert.equal(attributeRisk(id,5),'');assert.equal(renderAttributeRisk(id,null),'');assert.equal(renderAttributeRisk(id,NaN),'');}
  assert.match(attributeRisk('DEX',4),/Nahkampf/);assert.match(attributeRisk('MOVE',3),/6 m/);
  assert.match(attributeRisk('EMP',4),/kein direkter Todesrettungs-Malus/);assert.match(attributeRisk('COOL',4),/weder Trefferpunkte noch Todesrettung/);
  assert.match(attributeRisk('LUCK',4),/nicht einsetzbar/);
});
test('Todesrettungs-Hinweis zählt erfolgreiche W10-Ergebnisse korrekt statt jeden niedrigen Wert als tödlich zu bezeichnen',()=>{
  for(const body of [2,3,4]){
    const successful=Array.from({length:10},(_,i)=>i+1).filter(d=>d<body&&d!==10).length;
    assert.ok(attributeRisk('BODY',body).includes(`${successful*10} %`));
  }
  assert.match(attributeRisk('BODY',4),/1–3/);assert.match(attributeRisk('BODY',4),/Ohne Abzüge/);
});
test('Attributkarte zeigt Warnung zum effektiven Wert, ohne Charakter oder Regelprüfung zu verändern',()=>{
  const c=completeCharacter();c.method='points';c.allocations.points.BODY=4;
  const before=structuredClone(c),v=evaluateCharacter(c,rules),definition=rules.attributes.find(a=>a.id==='BODY');
  assert.match(attributeCard(definition,c,rules,v),/class="attribute-risk"/);assert.deepEqual(c,before);
  const compensated=structuredClone(v);compensated.attributes.BODY.effective=6;
  assert.doesNotMatch(attributeCard(definition,c,rules,compensated),/class="attribute-risk"/);
});
test('Installierte Cyberware zeigt Basis und Erweiterung, klare Entfernen-Aktionen und kompakte Details',()=>{
  const c=completeCharacter('netrunner'),offer=quickAddCyberware(c,rules,[],'chyron');assert.ok(offer.ok,offer.error);
  assert.ok(commitCyberwareDraft(c,rules,offer.additions).ok);
  const v=evaluateCharacter(c,rules),before=structuredClone(c),html=renderInstalledCyberware(v,rules);
  assert.match(html,/id="installed-cyberware" tabindex="-1"/);assert.match(html,/installed-child/);assert.match(html,/Kostenlos entfernen/);assert.match(html,/Wirkung und Details/);
  for(const entry of v.cyberware.entries)assert.ok(html.includes(`id="remove-cyberware-${entry.id}"`));
  c.campaign.sessionUnlocked=true;assert.match(renderInstalledCyberware(evaluateCharacter(c,rules),rules),/Ausbaukosten ansehen/);
  assert.deepEqual(c.cyberware,before.cyberware);
});
test('Die angeheftete Einkaufsübersicht führt direkt zur installierten Cyberware',()=>{
  const c=completeCharacter(),v=evaluateCharacter(c,rules),html=renderShoppingSummary(c,rules,v);
  assert.match(html,/data-progress-focus="installed-cyberware"/);assert.match(html,/Cyberware: 0 installiert/);assert.match(html,/Ansehen &amp; entfernen/);
});

test('EMP-Min-Max-Warnung berücksichtigt den Basiswert statt des Cyberware-Verlusts',()=>{
  const c=completeCharacter();c.method='points';c.allocations.points.EMP=6;
  const v=evaluateCharacter(c,rules),definition=rules.attributes.find(a=>a.id==='EMP');
  v.attributes.EMP.effective=2;
  const html=attributeCard(definition,c,rules,v);
  assert.doesNotMatch(html,/class="attribute-risk"|attribute-low/);
  v.attributes.EMP.base=4;
  assert.match(attributeCard(definition,c,rules,v),/EMP 4: niedriger Basiswert/);
  assert.equal(v.attributes.EMP.effective,2);
});
