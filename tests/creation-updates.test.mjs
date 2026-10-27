import test from 'node:test';
import assert from 'node:assert/strict';
import {completeCharacter,rules} from './helpers/pdf-fixture.mjs';
import {evaluateCharacter} from '../js/rules.js';
import {removeCyberware,canUndoCyberwarePurchase} from '../js/cyberware.js';
import {quickAddCyberware} from '../js/cyberware-quick-add.js';
import {commitCyberwareDraft} from '../js/cyberware-draft.js';
import {evaluateFunds,buyEquipment,removeEquipment} from '../js/economy.js';
import {renderCyberwareSide,needsCyberwareSide} from '../js/cyberware-placement.js';
import {renderClothing} from '../js/ui-clothing.js';
import {validateCharacter} from '../js/model.js';

function install(c,id,location){
 const offer=quickAddCyberware(c,rules,[],id,location);
 assert.ok(offer.ok,offer.error);
 const result=commitCyberwareDraft(c,rules,offer.additions);assert.ok(result.ok,result.error);
 return offer;
}

test('Kostenlose Erstellungskorrektur entfernt eine Basis samt Optionen und stellt Geld und Menschlichkeit wieder her',()=>{
 const c=completeCharacter(),before=evaluateCharacter(c,rules);
 install(c,'chyron','eye-right');
 const base=c.cyberware.items.find(i=>i.catalogId==='cybereye');
 assert.equal(c.cyberware.items.length,2);
 assert.ok(removeCyberware(c,rules,base.id,{}).ok);
 const after=evaluateCharacter(c,rules);
 assert.deepEqual(c.cyberware.items,[]);assert.deepEqual(c.cyberware.removed,[]);
 assert.deepEqual(after.funds,before.funds);assert.deepEqual(after.attributes,before.attributes);
 assert.equal(after.cyberware.current,before.cyberware.current);
 assert.equal(after.cyberware.maximum,before.cyberware.maximum);
 install(c,'biomonitor');removeCyberware(c,rules,c.cyberware.items[0].id,{});
 assert.equal(evaluateFunds(c,rules).fashionRemaining,800);
 c.campaign.sessionUnlocked=true;assert.equal(canUndoCyberwarePurchase(c),false);
});

test('Biomonitor ist bei Einzelkauf und direktem Entwurf auf ein Exemplar begrenzt; alte Dopplungen bleiben korrigierbar',()=>{
 const c=completeCharacter();install(c,'biomonitor');const before=structuredClone(c);
 assert.equal(quickAddCyberware(c,rules,[],'biomonitor').ok,false);assert.deepEqual(c,before);
 const duplicate={...c.cyberware.items[0],id:'implant-2'};
 assert.equal(commitCyberwareDraft(c,rules,[duplicate]).ok,false);assert.deepEqual(c,before);
 const legacy=validateCharacter({...before,cyberware:{...before.cyberware,items:[...before.cyberware.items,duplicate]}},rules);
 const evaluated=evaluateCharacter(legacy,rules);
 assert.ok(evaluated.cyberware.warnings.some(w=>w.includes('mehrfach')));
 assert.equal(evaluated.cyberware.errors.length,0);
 assert.ok(removeCyberware(legacy,rules,duplicate.id,{}).ok);
 assert.equal(evaluateCharacter(legacy,rules).cyberware.warnings.length,0);
});

test('Seitenwahl zeigt vorhandene Basis, freie Plätze und seitenspezifische Paketpreise ohne einen Kauf auszulösen',()=>{
 const c=completeCharacter();install(c,'cybereye','eye-left');const before=structuredClone(c);
 for(const id of ['cybereye','cyberarm','cyberleg'])assert.ok(needsCyberwareSide(rules,id));
 assert.equal(needsCyberwareSide(rules,'biomonitor'),false);
 assert.equal(quickAddCyberware(c,rules,[],'chyron','eye-left').cost,100);
 const right=quickAddCyberware(c,rules,[],'chyron','eye-right');assert.equal(right.cost,200);
 assert.ok(right.additions.every(i=>i.location==='eye-right'));
 const html=renderCyberwareSide(c,rules,{cyberPlacement:{id:'chyron'},cyberDraft:[]});
 assert.match(html,/0 \/ 3 Optionsplätze belegt/);assert.match(html,/Nach Einbau/);
 assert.match(html,/Linkes Auge wählen · 100 eb/);assert.match(html,/Rechtes Auge wählen · 200 eb/);
 assert.deepEqual(c,before);
});

test('Alle sieben Kleidungsstile enthalten 14 verschiedene Teile mit eigenständigen Zusatzbeschreibungen',()=>{
 const clothes=rules.equipmentRules.items.filter(i=>i.category==='clothing');
 assert.equal(clothes.length,98);assert.equal(new Set(clothes.map(i=>i.id)).size,98);
 const styles=new Set(clothes.map(i=>i.style));assert.equal(styles.size,7);
 for(const style of styles){const entries=clothes.filter(i=>i.style===style);assert.equal(entries.length,14);assert.equal(new Set(entries.map(i=>i.description)).size,14);}
});

test('Ein Kleidungsstück wird nur einmal gekauft, als vorhanden markiert und nach Entfernen wieder freigegeben',()=>{
 const c=completeCharacter(),id='clothing-generic-coat';
 assert.ok(buyEquipment(c,rules,id).ok);const before=structuredClone(c),funds=evaluateFunds(c,rules);
 assert.equal(funds.remaining,2550);assert.equal(funds.fashionRemaining,750);
 assert.equal(buyEquipment(c,rules,id).ok,false);assert.deepEqual(c,before);
 const html=renderClothing(c,rules,evaluateCharacter(c,rules));
 assert.match(html,/data-buy-equipment="clothing-generic-coat" disabled>Bereits im Kleiderschrank/);
 removeEquipment(c,id);assert.equal(evaluateFunds(c,rules).fashionRemaining,800);
 assert.ok(buyEquipment(c,rules,id).ok);assert.equal(c.equipment.items.find(i=>i.catalogId===id).quantity,1);
});
