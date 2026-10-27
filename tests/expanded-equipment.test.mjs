import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createCharacter, validateCharacter } from '../js/model.js';
import { evaluateCharacter } from '../js/rules.js';
import { installCyberware, removeCyberware } from '../js/cyberware.js';
import { cyberwareCandidate } from '../js/cyberware-ui-model.js';
import { buyEquipment, buyWeaponWithAmmo, evaluateFunds, saveCustomEquipment } from '../js/economy.js';
import { removeCustomEquipment } from '../js/custom-equipment.js';
import { renderEquipmentSummary } from '../js/ui-cyberware.js';
import { renderCustomEquipment } from '../js/ui-custom-equipment.js';
import { loadCharacter, STORAGE_KEY } from '../js/storage.js';
const json=async name=>JSON.parse(await readFile(new URL(`../data/${name}.json`,import.meta.url),'utf8'));
const rules=await json('rules');rules.skillRules=await json('skills');rules.cyberwareRules=await json('cyberware');rules.equipmentRules=await json('equipment');
function fresh(){const c=createCharacter(rules);c.name='Test';c.role='solo';return c;}
function install(c,id,location,r=rules){const ev=evaluateCharacter(c,r),candidate=cyberwareCandidate(c,r,id,location);return installCyberware(c,r,id,location,candidate.parent,Object.fromEntries(Object.entries(ev.attributes).map(([id,v])=>[id,v.base])));}
const own=(c,overrides={},id=null)=>saveCustomEquipment(c,rules,{name:'Eigener Koffer',cost:200,quantity:2,notes:'Für meinen Auftrag.',...overrides},id);
test('Cyberarm schaltet frühere DLC-Optionen frei und prüft Kapazität und Ausbauabhängigkeiten',()=>{
 const c=fresh();assert.equal(install(c,'chainripp','arm-left').ok,false);assert.ok(install(c,'cyberarm','arm-left').ok);assert.ok(install(c,'chainripp','arm-left').ok);
 const before=structuredClone(c);assert.equal(install(c,'cyberpillow','arm-left').ok,false);assert.deepEqual(c,before);
 assert.equal(removeCyberware(c,rules,c.cyberware.items[0].id,{},0).ok,false);
 assert.ok(removeCyberware(c,rules,c.cyberware.items[1].id,{},0).ok);assert.ok(install(c,'cyberpillow','arm-left').ok);
});
test('Neural Link ist Voraussetzung; Speedware ist exklusiv und erhöht Initiative ohne REF zu ändern',()=>{
 const c=fresh();assert.equal(install(c,'kerenzikov','neural').ok,false);assert.ok(install(c,'neural-link','neural').ok);
 const before=evaluateCharacter(c,rules);assert.ok(install(c,'kerenzikov','neural').ok);const after=evaluateCharacter(c,rules);
 assert.equal(after.derived.find(v=>v.id==='initiative').value,before.derived.find(v=>v.id==='initiative').value+2);assert.equal(after.attributes.REF.effective,before.attributes.REF.effective);
 const saved=structuredClone(c);assert.equal(install(c,'sandevistan','neural').ok,false);assert.deepEqual(c,saved);
});
test('Tool Hand funktioniert allein im natürlichen Arm oder als Cyberarm-Option',()=>{
 const c=fresh();assert.ok(install(c,'tool-hand','arm-left').ok);assert.equal(install(c,'holo-palm','arm-left').ok,false);
 assert.ok(install(c,'cyberarm','arm-right').ok);assert.ok(install(c,'tool-hand','arm-right').ok);assert.equal(c.cyberware.items[2].parent,c.cyberware.items[1].id);
});
test('Cyberaudio erfordert Basis; Hörbonus bleibt situativ, identische feste Boni stapeln nicht',()=>{
 const c=fresh(),before=evaluateCharacter(c,rules);assert.equal(install(c,'amplified-hearing','audio').ok,false);assert.ok(install(c,'cyberaudio-suite','audio').ok);assert.ok(install(c,'amplified-hearing','audio').ok);
 assert.equal(evaluateCharacter(c,rules).skills.find(v=>v.id==='perception').base,before.skills.find(v=>v.id==='perception').base);
 assert.ok(install(c,'voice-stress-analyzer','audio').ok);assert.ok(install(c,'voice-stress-analyzer','audio').ok);
 const ev=evaluateCharacter(c,rules);assert.equal(ev.skills.find(v=>v.id==='interrogation').modifiers.filter(m=>m.label==='Voice Stress Analyzer').length,1);
 assert.equal(install(c,'audio-recorder','audio').ok,false);
});
test('Cyberaugen sind getrennte Basen; MicroVideo belegt zwei von drei Plätzen',()=>{
 const c=fresh();assert.ok(install(c,'cybereye','eye-left').ok);assert.ok(install(c,'micro-video','eye-left').ok);assert.ok(install(c,'chyron','eye-left').ok);assert.equal(install(c,'micro-optics','eye-left').ok,false);
 assert.equal(install(c,'chyron','eye-right').ok,false);assert.ok(install(c,'cybereye','eye-right').ok);assert.ok(install(c,'chyron','eye-right').ok);
});
test('Chemskin plus Techhair gibt genau einmal einen Bonus aus dem Fashion-Zuschuss',()=>{
 const c=fresh(),before=evaluateCharacter(c,rules);for(const id of ['chemskin','techhair','chemskin'])assert.ok(install(c,id,'fashion').ok);
 const after=evaluateCharacter(c,rules);assert.equal(after.skills.find(v=>v.id==='personal-grooming').base,before.skills.find(v=>v.id==='personal-grooming').base+2);assert.equal(after.funds.remaining,2550);assert.equal(after.funds.fashionRemaining,500);
});
test('Implantierter Schutz gilt für Kopf und Körper ohne Stapelung mit getragener Rüstung',()=>{
 const c=fresh();assert.ok(install(c,'skin-weave','external').ok);assert.ok(buyEquipment(c,rules,'armor-medium-jack-body').ok);c.equipment.armor.body='armor-medium-jack-body';
 const ev=evaluateCharacter(c,rules);assert.equal(ev.armor.headSP,7);assert.equal(ev.armor.bodySP,12);assert.equal(ev.armor.penalty,2);
});
test('Muskelverstärkung erhöht BODY und abgeleitete Werte bis höchstens zehn',()=>{
 const c=fresh();c.method='points';c.allocations.points.BODY=8;assert.ok(install(c,'muscle-bone-lace','internal').ok);assert.ok(install(c,'muscle-bone-lace','internal').ok);
 const ev=evaluateCharacter(c,rules);assert.equal(ev.attributes.BODY.base,8);assert.equal(ev.attributes.BODY.effective,10);assert.equal(ev.derived.find(v=>v.id==='death').value,10);
});
test('Eigene Gegenstände kaufen, bearbeiten und entfernen verrechnet Menge und Gesamtkosten',()=>{
 const c=fresh();assert.ok(own(c).ok);assert.equal(evaluateFunds(c,rules).remaining,2150);const id=c.equipment.custom[0].id;
 assert.ok(own(c,{cost:300,quantity:3},id).ok);assert.equal(evaluateFunds(c,rules).remaining,1650);
 removeCustomEquipment(c,id);assert.equal(evaluateFunds(c,rules).remaining,1950);removeCustomEquipment(c,id);removeCustomEquipment(c,id);assert.equal(c.equipment.custom.length,0);assert.equal(evaluateFunds(c,rules).remaining,2550);
});
test('Eigene Kosten blockieren überzogene Katalog-, Paket- und Cyberwarekäufe atomar',()=>{
 const c=fresh();assert.ok(own(c,{cost:2500,quantity:1}).ok);const before=structuredClone(c);
 assert.equal(buyEquipment(c,rules,'agent').ok,false);assert.equal(buyWeaponWithAmmo(c,rules,'medium-pistol').ok,false);assert.equal(install(c,'neural-link','neural').ok,false);assert.deepEqual(c,before);
 assert.equal(own(c,{cost:2600,quantity:1},c.equipment.custom[0].id).ok,false);assert.deepEqual(c,before);
});
test('Eigene Preise, Mengen und Texte werden geprüft; Notizen verleihen keine Effekte',()=>{
 const c=fresh();for(const data of [{cost:-1},{cost:1.5},{quantity:100},{name:' '},{notes:'x'.repeat(601)}]){const before=structuredClone(c);assert.equal(own(c,data).ok,false);assert.deepEqual(c,before);}
 assert.ok(own(c,{name:'<script>Koffer</script>',effects:[{target:'REF',value:99}]}).ok);const safe=validateCharacter(c,rules);assert.equal('effects' in safe.equipment.custom[0],false);
 assert.doesNotMatch(renderCustomEquipment(safe)+renderEquipmentSummary(safe,rules),/<script>/);assert.match(renderEquipmentSummary(safe,rules),/&lt;script&gt;/);
});
test('Format 8 migriert mit leerer eigener Ausrüstung und bewahrt Inventar, Rollenpunkte und Lebensweg',()=>{
 const c=fresh();c.version=8;delete c.equipment.custom;c.equipment.items=[{catalogId:'agent',quantity:1}];c.rolePoints.solo.initiative=4;c.lifepath.goal={choice:'custom',custom:'Mein Ziel.'};
 const raw=JSON.stringify(c),data=new Map([[STORAGE_KEY,raw]]),loaded=loadCharacter(rules,{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)});
 assert.equal(loaded.blocked,false);assert.equal(loaded.character.version,11);assert.deepEqual(loaded.character.equipment.custom,[]);assert.deepEqual(loaded.character.equipment.items,c.equipment.items);assert.deepEqual(loaded.character.rolePoints,c.rolePoints);assert.deepEqual(loaded.character.lifepath,c.lifepath);assert.equal(data.get('red-builder.character.v8.backup'),raw);
});
