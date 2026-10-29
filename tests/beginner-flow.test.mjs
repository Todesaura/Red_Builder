import test from 'node:test';
import assert from 'node:assert/strict';
import {completeCharacter,rules} from './helpers/pdf-fixture.mjs';
import {validateCharacter} from '../js/model.js';
import {chooseLifepath,editLifepath,evaluateLifepath} from '../js/lifepath.js';
import {activeLifepathQuestion,renderLifepath} from '../js/ui-lifepath.js';
import {attributeCard} from '../js/ui.js';
import {evaluateCharacter} from '../js/rules.js';
import {quickAddCyberware,cyberwareQuickOffer} from '../js/cyberware-quick-add.js';
import {commitCyberwareDraft,removeFromCyberwareDraft} from '../js/cyberware-draft.js';
import {buyEquipment,removeEquipment} from '../js/economy.js';
import {netrunnerStats,netrunnerInventory} from '../js/netrunner.js';
import {renderEquipment} from '../js/ui-equipment.js';
import {attributeLabel,localizeAttributeText} from '../js/attribute-labels.js';

test('Vier Lebensweg-Auswahlen bleiben nach Speichern lesbar; erste/zweite bestehender Charaktere ändern sich nicht',()=>{
 const c=completeCharacter(),previous=evaluateLifepath(c).entries.map(q=>q.answer);
 for(const choice of ['third','fourth']){assert.ok(chooseLifepath(c,'goal',choice).ok);assert.ok(evaluateLifepath(c).entries.find(q=>q.id==='goal').answer);assert.equal(validateCharacter(c,rules).lifepath.goal.choice,choice);}
 chooseLifepath(c,'goal','first');assert.deepEqual(evaluateLifepath(c).entries.map(q=>q.answer),previous);
});
test('Genau eine offene Frage sichtbar, Antwort wechselt automatisch; Zusammenfassung und gezieltes Bearbeiten bleiben',()=>{
 const c=completeCharacter();chooseLifepath(c,'personality',null);chooseLifepath(c,'appearance',null);
 let html=renderLifepath(c);assert.equal((html.match(/<fieldset /g)||[]).length,1);assert.match(html,/life-card-personality/);assert.doesNotMatch(html,/life-card-appearance/);assert.equal((html.match(/type="radio"/g)||[]).length,5);
 chooseLifepath(c,'personality','fourth');assert.equal(activeLifepathQuestion(c).id,'appearance');
 assert.equal(activeLifepathQuestion(c,{lifepathQuestion:'goal'}).id,'goal');
 html=renderLifepath(c);assert.match(html,/life-card-appearance/);assert.match(html,/Deine Antworten · getrennt nach Bereich/);assert.match(html,/data-lifepath-edit="personality"/);
 chooseLifepath(c,'appearance','custom');editLifepath(c,'appearance','Eigene Jacke');assert.match(renderLifepath(c,{lifepathQuestion:'appearance'}),/Antwort übernehmen/);
 assert.equal(activeLifepathQuestion(c),null);assert.match(renderLifepath(c),/Lore abgeschlossen/);
});
test('Cyberauge per Button belegt erst links, dann rechts; drittes Auge scheitert ohne Mutation',()=>{
 const c=completeCharacter(),before=structuredClone(c);let a=quickAddCyberware(c,rules,[],'cybereye');assert.equal(a.location,'eye-left');assert.equal(a.cost,100);
 let b=quickAddCyberware(c,rules,a.additions,'cybereye');assert.equal(b.location,'eye-right');assert.equal(b.additions.length,2);
 const snapshot=structuredClone(b.additions);assert.equal(quickAddCyberware(c,rules,b.additions,'cybereye').ok,false);assert.deepEqual(b.additions,snapshot);assert.deepEqual(c,before);
});
test('Chyron nimmt Cyberauge atomar mit: 200 eb, 9 HUM, richtige Eltern-ID; bestehende Basis wird nicht erneut gekauft',()=>{
 const c=completeCharacter(),before=structuredClone(c),a=quickAddCyberware(c,rules,[],'chyron');assert.ok(a.ok);assert.equal(a.cost,200);assert.deepEqual(a.bases.map(b=>b.id),['cybereye']);assert.equal(a.additions[1].parent,a.additions[0].id);assert.deepEqual(c,before);
 assert.ok(commitCyberwareDraft(c,rules,a.additions).ok);let v=evaluateCharacter(c,rules);assert.equal(v.funds.remaining,2350);assert.equal(v.cyberware.loss,9);
 const b=quickAddCyberware(c,rules,[],'chyron');assert.equal(b.cost,100);assert.equal(b.bases.length,0);assert.equal(b.location,'eye-left');
});
test('Zu wenig Geld lässt beim Kombikauf keine Basis zurück; Angebot nennt trotzdem den Gesamtpreis',()=>{
 const c=completeCharacter();c.equipment.custom=[{id:'custom-1',name:'Vorhanden',cost:2400,quantity:1,notes:''}];const before=structuredClone(c),draft=[];
 assert.equal(quickAddCyberware(c,rules,draft,'chyron').ok,false);assert.deepEqual(c,before);assert.deepEqual(draft,[]);
 const offer=cyberwareQuickOffer(c,rules,draft,'chyron');assert.equal(offer.ok,false);assert.equal(offer.cost,200);assert.equal(offer.bases[0].id,'cybereye');
});
test('Basisoption in geplantem oder vollem Auge: Wiederverwendung und zweites freies Auge funktionieren',()=>{
 const c=completeCharacter();let a=quickAddCyberware(c,rules,[],'cybereye');let b=quickAddCyberware(c,rules,a.additions,'chyron');assert.equal(b.cost,100);assert.equal(b.additions.length,2);
 b=quickAddCyberware(c,rules,b.additions,'chyron');b=quickAddCyberware(c,rules,b.additions,'chyron');
 const next=quickAddCyberware(c,rules,b.additions,'chyron');assert.equal(next.location,'eye-right');assert.equal(next.cost,200);assert.equal(next.bases.length,1);
 assert.deepEqual(removeFromCyberwareDraft(c,rules,next.additions,next.additions.find(e=>e.location==='eye-right'&&e.catalogId==='cybereye').id),b.additions);
});
test('Andere Basisimplantate werden passend ergänzt, ohne teurere oder fremde Grundlage zu erfinden',()=>{
 const c=completeCharacter();const a=quickAddCyberware(c,rules,[],'audio-recorder');assert.ok(a.ok);assert.deepEqual(a.bases.map(b=>b.id),['cyberaudio-suite']);assert.equal(a.cost,600);
 assert.equal(quickAddCyberware(c,rules,[],'tool-hand').bases.length,0);
});
test('Netrunner-Katalog enthält alle Core-Deckqualitäten, 15 Programme, 12 Black ICE und sechs Hardware-Optionen',()=>{
 const items=rules.equipmentRules.items.filter(i=>i.category==='netrunner');assert.equal(items.length,37);assert.equal(new Set(items.map(i=>i.id)).size,37);
 for(const [group,count] of [['decks',4],['programs',15],['ice',12],['hardware',6]])assert.equal(items.filter(i=>i.netrunner.group===group).length,count);
 assert.equal(items.find(i=>i.id==='net-program-sword').cost,50);assert.equal(items.find(i=>i.id==='net-ice-killer').netrunner.atk,6);
 assert.equal(netrunnerStats(items.find(i=>i.id==='net-hardware-backup-drive')),'2 Optionsplätze');
 assert.deepEqual(items.filter(i=>i.netrunner.capacity).map(i=>[i.cost,i.netrunner.capacity]).sort((a,b)=>a[0]-b[0]),[[100,5],[500,7],[1000,9]]);
});
test('NET-Käufe belasten gemeinsames Bargeld, speichern sich und erscheinen im Inventar; Entfernung erstattet',()=>{
 const c=completeCharacter('netrunner');for(const id of ['cyberdeck-poor','net-program-sword','net-hardware-backup-drive','net-ice-wisp'])assert.ok(buyEquipment(c,rules,id).ok);
 const safe=validateCharacter(c,rules);assert.equal(evaluateCharacter(safe,rules).funds.remaining,2250);assert.equal(netrunnerInventory(safe,rules).slots,5);
 removeEquipment(c,'net-ice-wisp');assert.equal(evaluateCharacter(c,rules).funds.remaining,2300);
});
test('NET-Regeln und Karten zeigen Zielklassen, Platzbedarf und echte NET-Proben ohne REF-Ausweichen',()=>{
 const c=completeCharacter('netrunner'),html=renderEquipment(c,rules,evaluateCharacter(c,rules),'netrunner');
 for(const t of ['Netrunner-Waffen','3 Netz-Aktionen','Schwarzes ICE','Angriff 1','Integrität 7','Hirnschaden','Reflexe und Ausweichen werden für Netz-Angriffe nicht verwendet','data-buy-equipment="net-program-sword"','Dein Kaufbestand'])assert.ok(html.includes(t),t);
 assert.doesNotMatch(html,/undefined|NaN|buy-ammo-bundle-net-/);
});
test('Deutsche Kürzel sind reine Darstellung, interne IDs und Charakterwerte bleiben stabil',()=>{
 assert.equal(attributeLabel('DEX'),'GES');assert.equal(localizeAttributeText('TECH + COOL + WILL + LUCK + MOVE + BODY'),'TCH + COO + WIL + GLK + BEW + KRA');
 const c=completeCharacter(),before=structuredClone(c),html=attributeCard(rules.attributes.find(a=>a.id==='DEX'),c,rules,evaluateCharacter(c,rules));
 assert.match(html,/<span class="stat-code">GES<\/span>/);assert.match(html,/data-stat="DEX"|explain-DEX/);assert.deepEqual(c,before);
});
