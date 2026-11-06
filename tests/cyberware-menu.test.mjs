import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createCharacter,validateCharacter,migrateCharacter } from '../js/model.js';
import { installCyberware,removeCyberware,installationErrors } from '../js/cyberware.js';
import { evaluateCharacter } from '../js/rules.js';
import { catalogEntries,previewInstallation,initialInstallationLocation } from '../js/cyberware-ui-model.js';
import { renderCyberware } from '../js/ui-cyberware.js';
import { renderInstalledCyberware } from '../js/ui-cyberware-details.js';
import { quickAddCyberware } from '../js/cyberware-quick-add.js';
import { commitCyberwareDraft } from '../js/cyberware-draft.js';
import { applyPlayAction } from '../js/play-tracking.js';
const json=async name=>JSON.parse(await readFile(new URL(`../data/${name}.json`,import.meta.url),'utf8'));
const rules=await json('rules');rules.skillRules=await json('skills');rules.cyberwareRules=await json('cyberware');rules.equipmentRules=await json('equipment');
const character=()=>{const c=createCharacter(rules);c.name='Nyx';c.role='solo';return c;};
const state={cyberCategory:'accessories',cyberSearch:'',cyberSort:'name',onlyInstallable:false,selectedCyberware:null,pendingLocation:null,inspectedLocation:null,installationOpen:false,equipmentTab:'cyberware'};
const stats={EMP:4,BODY:6};
test('Alle acht sichtbaren Kategorien sind in vorgegebener Reihenfolge definiert',()=>{
 assert.deepEqual(rules.cyberwareRules.categories.map(item=>item.name),['Accessoires','Neuralsysteme','Cyberoptik','Cyberaudio','Interne Körpercyberware','Externe Körpercyberware','Cybergliedmaßen','Borgware']);
 const html=renderCyberware(character(),rules,evaluateCharacter(character(),rules),state);
 for(const category of rules.cyberwareRules.categories) assert.ok(html.includes(`id="category-${category.id}"`));
});
test('Regelzugehörigkeit ist unabhängig von Installationsbereich und Budgettyp',()=>{
 const expected={'kill-display':'accessories','show-off-nails':'accessories','neutongue':'internal','optishield':'external','holo-palm':'limbs','perfect-fit':'limbs','cyberpillow':'limbs','chainripp':'limbs','bug-eye':'borg'};
 for(const item of rules.cyberwareRules.items){if(expected[item.id])assert.equal(item.category,expected[item.id]);else assert.ok(rules.cyberwareRules.categories.some(c=>c.id===item.category));assert.ok(Array.isArray(item.installationSlots));assert.equal(typeof item.requirements,'object');assert.equal('locations' in item,false);}
 assert.equal(rules.cyberwareRules.items.find(item=>item.id==='bug-eye').category,'borg');
 const c=character();installCyberware(c,rules,'kill-display','fashion',null,stats);assert.equal(evaluateCharacter(c,rules).funds.remaining,2550);
});
test('Kategorie, Suche, Sortierung und Installierbarkeitsfilter verwenden echte Voraussetzungen',()=>{
 const c=character(),evaluated=evaluateCharacter(c,rules);
 assert.ok(catalogEntries(c,rules,{...state,cyberCategory:'neural'},evaluated).some(item=>item.id==='neural-link'));
 assert.deepEqual(catalogEntries(c,rules,{...state,cyberCategory:'limbs',onlyInstallable:true,cyberSort:'price'},evaluated).map(item=>item.id).sort(),['cyberarm','cyberleg','gang-jazzler','holo-palm','perfect-fit','quick-digits','talon-foot','tool-hand']);
 assert.deepEqual(catalogEntries(c,rules,{...state,cyberSearch:'Nails'},evaluated).map(item=>item.id),['show-off-nails']);
});

test('Gratis-DLCs: die neuen Implantate lassen sich über den Shop mit passenden Grundlagen einbauen',()=>{
 const items=['appetite-controller','external-vidscreen','mood-eye','kibblewarmer','personal-shredder','deathtrance','watch-man','gang-jazzler','integrated-cyberscanner','quick-change-faceplate','quick-digits','sycust-cyberspine'];
 for(const id of items){
   const c=character(),offer=quickAddCyberware(c,rules,[],id);
   assert.ok(offer.ok,id+': '+offer.error);
   assert.ok(commitCyberwareDraft(c,rules,offer.additions).ok,id);
   assert.deepEqual(validateCharacter(c,rules).cyberware,c.cyberware,id);
 }
 const c=character(),scanner=quickAddCyberware(c,rules,[],'integrated-cyberscanner','arm-left');
 assert.deepEqual(scanner.additions.map(i=>i.catalogId),['cyberarm','integrated-cyberscanner']);
 assert.equal(scanner.cost,1000);
 assert.ok(commitCyberwareDraft(c,rules,scanner.additions).ok);
 assert.ok(commitCyberwareDraft(c,rules,quickAddCyberware(c,rules,[],'integrated-cyberscanner','arm-left').additions).ok);
 assert.equal(quickAddCyberware(c,rules,[],'watch-man','arm-left').ok,false);
 const mood=character(),offer=quickAddCyberware(mood,rules,[],'mood-eye');
 assert.deepEqual(offer.additions.map(i=>i.catalogId),['neural-link','mood-eye']);
 assert.ok(commitCyberwareDraft(mood,rules,offer.additions).ok);
 assert.equal(evaluateCharacter(mood,rules).funds.fashionRemaining,700);
});

test('Cyberspine gibt genau +1 auf Kontorsion und verhindert Wirbelsäulenverletzung samt Zusatzschaden',()=>{
 const c=character(),before=evaluateCharacter(c,rules).skills.find(s=>s.id==='contortionist').base;
 assert.ok(commitCyberwareDraft(c,rules,quickAddCyberware(c,rules,[],'sycust-cyberspine').additions).ok);
 assert.equal(evaluateCharacter(c,rules).skills.find(s=>s.id==='contortionist').base,before+1);
 const snapshot=structuredClone(c),action={type:'critical',slot:'body',injury:'spinal-injury',addBonus:true,notes:''};
 assert.match(applyPlayAction(c,rules,action).error,/verhindert diese Verletzung/);
 assert.deepEqual(c,snapshot);
 c.campaign.cyberDamaged.push(c.cyberware.items[0].id);
 assert.ok(applyPlayAction(c,rules,action).ok);
});
test('Einzelne Systemkategorien erzwingen keine Links/Rechts-Auswahl',()=>{
 assert.equal(initialInstallationLocation(rules.cyberwareRules.items.find(item=>item.id==='neutongue')),'internal');
 assert.equal(initialInstallationLocation(rules.cyberwareRules.items.find(item=>item.id==='holo-palm')),null);
});
test('Installationsvorschau ist mutationsfrei und stimmt mit anschließendem Einbau überein',()=>{
 const c=character(),snapshot=structuredClone(c),preview=previewInstallation(c,rules,'neutongue','internal');
 assert.deepEqual(c,snapshot);assert.deepEqual(preview.errors,[]);assert.equal(preview.after.cyberware.current,33);assert.equal(preview.after.cyberware.maximum,38);assert.equal(preview.after.attributes.EMP.effective,3);assert.equal(preview.after.funds.remaining,2450);
 assert.ok(preview.changes.some(change=>change.name==='EMP'&&change.after===3));
 assert.ok(installCyberware(c,rules,'neutongue','internal',null,stats).ok);assert.deepEqual(evaluateCharacter(c,rules),preview.after);
});
test('Kein Ziel, falsches Ziel und fehlende Basis blockieren Vorschau und Einbau unverändert',()=>{
 const c=character(),snapshot=structuredClone(c);
 for(const [id,location] of [['holo-palm',null],['holo-palm','eye-left'],['chainripp','arm-left']]) {const preview=previewInstallation(c,rules,id,location);assert.ok(preview.errors.length);assert.equal(preview.after,null);}
 assert.deepEqual(c,snapshot);assert.equal(installCyberware(c,rules,'chainripp','arm-left',null,stats).ok,false);
});
test('Bestätigter Einbau und Entfernen bewahren Geld- und Menschlichkeitsregeln',()=>{
 const c=character();c.campaign.sessionUnlocked=true;installCyberware(c,rules,'holo-palm','arm-left',null,stats);
 assert.ok(previewInstallation(c,rules,'holo-palm','arm-left').errors.length);assert.equal(previewInstallation(c,rules,'holo-palm','arm-right').after.funds.remaining,2350);
 assert.ok(removeCyberware(c,rules,c.cyberware.items[0].id,stats,0).ok);assert.equal(evaluateCharacter(c,rules).funds.remaining,2450);
});
test('Gespeicherte aktuelle Auswahl lädt ohne Verlust trotz neuer Katalogstruktur',()=>{
 const c=character();installCyberware(c,rules,'bug-eye','eye-left',null,stats);const raw=JSON.parse(JSON.stringify(c));
 assert.deepEqual(validateCharacter(raw,rules),c);assert.deepEqual(migrateCharacter(raw,rules),c);
 const old={...raw,version:4};delete old.equipment;
 const migrated=migrateCharacter(old,rules);assert.deepEqual(migrated.cyberware.items,c.cyberware.items);assert.equal(migrated.version,11);
});
test('Ungeklärte Kategorie blockiert die Installation ausdrücklich',()=>{
 const config=structuredClone(rules.cyberwareRules);config.items[0].category=null;config.items[0].categoryReview='Quelle prüfen';
 assert.match(installationErrors({items:[{id:'implant-1',catalogId:config.items[0].id,location:'arm-left',parent:null}],limit:null},config,stats).join(' '),/Kategorie/);
});
test('Basis und Erweiterung werden kategorienunabhängig hierarchisch dargestellt',()=>{
 const r=structuredClone(rules);const base=r.cyberwareRules.items.find(item=>item.id==='bug-eye');
 r.cyberwareRules.items.push({...base,id:'test-eye-option',name:'Synthetische Testoption',foundation:undefined,capacity:undefined,requirements:{parentType:'eye'},slots:1,cost:0,humanity:0,maxHumanityLoss:0});
 const c=character();c.campaign.sessionUnlocked=true;installCyberware(c,r,'bug-eye','eye-left',null,stats);const parent=c.cyberware.items[0].id;
 assert.ok(installCyberware(c,r,'test-eye-option','eye-left',parent,stats).ok);
 const html=renderInstalledCyberware(evaluateCharacter(c,r),r);assert.ok(html.includes('installed-child'));assert.ok(html.includes('Erweiterungen von Cyclops'));
 assert.equal(removeCyberware(c,r,parent,stats).ok,false);
});
test('Nur die ausgewählte Cyberware öffnet ihre Detailansicht',()=>{
 const c=character();const html=renderCyberware(c,rules,evaluateCharacter(c,rules),{...state,selectedCyberware:'kill-display',pendingLocation:'fashion',installationOpen:true});
 assert.equal((html.match(/class="implant-detail"/g)??[]).length,1);assert.ok(html.includes('Kaufen & einbauen'));assert.ok(!html.includes('Gemeinsamer Installationsentwurf'));assert.ok(!html.includes('Installation bestätigen'));
});
