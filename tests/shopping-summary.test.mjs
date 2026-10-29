import test from 'node:test';
import assert from 'node:assert/strict';
import {completeCharacter,rules} from './helpers/pdf-fixture.mjs';
import {evaluateCharacter} from '../js/rules.js';
import {buyEquipment,removeEquipment} from '../js/economy.js';
import {equipArmor} from '../js/armor.js';
import {renderShoppingSummary} from '../js/ui-shopping-summary.js';
import {renderCyberware} from '../js/ui-cyberware.js';
import {quickAddCyberware} from '../js/cyberware-quick-add.js';
import {commitCyberwareDraft} from '../js/cyberware-draft.js';
const view=(c,state={},projected)=>renderShoppingSummary(c,rules,evaluateCharacter(c,rules),state,projected);
const buy=(c,id)=>assert.ok(buyEquipment(c,rules,id).ok,id);
const implant=(c,id)=>{const plan=quickAddCyberware(c,rules,[],id);assert.ok(plan.ok,plan.error);assert.ok(commitCyberwareDraft(c,rules,plan.additions).ok);};

test('Übersicht zeigt echte Geld-/Fashion-/Menschlichkeitswerte und optionale Lücken ohne Mutation',()=>{
 const c=completeCharacter(),before=structuredClone(c),html=view(c);
 for(const text of ['2.550 eb','800 eb','Menschlichkeit','/ 40 · EMP 4','Keine Waffe','Kopfschutz','Körperpanzerung','SP 0','Optional prüfen:'])assert.ok(html.includes(text),text);
 assert.ok(html.includes('equipment-wallet-dock'));assert.deepEqual(c,before);assert.equal(evaluateCharacter(c,rules).complete,true);
});
test('Waffen und Granaten folgen Kauf und Entfernung; volle Namen bleiben zugänglich',()=>{
 const c=completeCharacter();buy(c,'heavy-pistol');buy(c,'light-melee');buy(c,'hand-grenade-normal-frag');let html=view(c);
 assert.match(html,/2 Waffen · 1 Granate/);assert.match(html,/Mustang Arms Mark III/);assert.match(html,/data-warning-equipment="weapons"/);
 removeEquipment(c,'heavy-pistol');assert.match(view(c),/1 Waffe · 1 Granate/);
});
test('Kopf und Körper zählen angelegten Schutz statt bloß gekaufter Rüstung',()=>{
 const c=completeCharacter();buy(c,'armor-kevlar-head');buy(c,'armor-light-jack-body');let html=view(c);
 assert.match(html,/Gekauft, nicht angelegt/);assert.equal((html.match(/<strong>SP 0<\/strong>/g)??[]).length,2);
 equipArmor(c,rules,'body','armor-light-jack-body');html=view(c);assert.match(html,/<strong>SP 11<\/strong>/);assert.match(html,/<strong>SP 0<\/strong>/);
 equipArmor(c,rules,'head','armor-kevlar-head');html=view(c);assert.match(html,/<strong>SP 7<\/strong>/);assert.match(html,/data-progress-focus="armor-head"/);assert.match(html,/data-progress-focus="armor-body"/);
});
test('Effektiver implantierter Schutz, Abnutzung und tatsächliche Rüstungsabzüge werden übernommen',()=>{
 const c=completeCharacter();implant(c,'subdermal-armor');let html=view(c);assert.equal((html.match(/<strong>SP 11<\/strong>/g)??[]).length,2);assert.match(html,/Implantierter Schutz/);
 const armoured=completeCharacter();buy(armoured,'armor-medium-jack-body');equipArmor(armoured,rules,'body','armor-medium-jack-body');armoured.campaign.armorLoss['armor-medium-jack-body']=2;html=view(armoured);assert.match(html,/<strong>SP 10<\/strong>/);assert.match(html,/−2 auf REF, GES und BEW/);
 armoured.campaign.armorLoss['armor-medium-jack-body']=12;assert.match(view(armoured),/Angelegt, Schutz aufgebraucht/);
});
test('Nur installierte gültige Cyberwaffen zählen als vorhanden; Pläne bleiben gesondert',()=>{
 const c=completeCharacter();const plan=quickAddCyberware(c,rules,[],'monowire');assert.ok(plan.ok,plan.error);let html=view(c,{cyberDraft:plan.additions});assert.match(html,/Keine Waffe/);assert.match(html,/Nach geplantem Einbau/);
 assert.ok(commitCyberwareDraft(c,rules,plan.additions).ok);html=view(c);assert.match(html,/1 Waffe/);assert.match(html,/Monodraht/);
});
test('Netrunner unterscheiden reale Waffen und gekaufte NET-Waffen; andere Rollen sehen keine NET-Zeile',()=>{
 const c=completeCharacter('netrunner');buy(c,'cyberdeck-poor');buy(c,'net-program-sword');let html=view(c);assert.match(html,/Reale Waffen/);assert.match(html,/Cyberdeck vorhanden · 1 NET-Waffe gekauft/);assert.match(html,/Keine Waffe/);
 assert.doesNotMatch(view(completeCharacter()),/class="shopping-net"/);
});
test('Die identische angeheftete Übersicht ist in jedem Ausstattungsreiter vorhanden',()=>{
 const c=completeCharacter('netrunner'),v=evaluateCharacter(c,rules),state={cyberCategory:'accessories',cyberSearch:'',cyberSort:'name',onlyInstallable:false,cyberDraft:[]};
 for(const equipmentTab of ['cyberware','weapons','armor','clothing','drugs','netrunner','misc']){
  const html=renderCyberware(c,rules,v,{...state,equipmentTab});assert.equal((html.match(/class="equipment-wallet-dock equipment-shopping-dock"/g)??[]).length,1,equipmentTab);assert.ok(html.includes('Dein Charakter beim Einkaufen'),equipmentTab);
 }
});
