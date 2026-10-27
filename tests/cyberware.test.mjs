import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createCharacter, validateCharacter } from '../js/model.js';
import { loadCharacter, STORAGE_KEY } from '../js/storage.js';
import { evaluateCharacter, resolveValue } from '../js/rules.js';
import { installCyberware, removeCyberware, installationErrors } from '../js/cyberware.js';
import { applySkillRecommendation } from '../js/skill-recommendations.js';
const json = async file => JSON.parse(await readFile(new URL(`../data/${file}.json`, import.meta.url),'utf8'));
const rules = await json('rules'); rules.skillRules = await json('skills'); rules.cyberwareRules = await json('cyberware');
function character() { const c=createCharacter(rules); c.name='Nyx'; c.role='solo'; applySkillRecommendation(c,rules); return c; }
const stats = c => Object.fromEntries(Object.entries(evaluateCharacter(c,rules).attributes).map(([id,value])=>[id,value.base]));
const install = (c,id,location) => installCyberware(c,rules,id,location,null,stats(c));

test('Cyberware-Katalog enthält Quellen und explizite Verluste für alle Katalogeinträge',()=>{
  assert.equal(rules.cyberwareRules.items.length,49);
  assert.equal(rules.cyberwareRules.items.filter(i=>!i.unavailable).length,49);
  for(const item of rules.cyberwareRules.items) {
    assert.ok(rules.cyberwareRules.sources[item.sourceId].url.startsWith('https://rtalsoriangames.com/'));
    assert.ok(Number.isInteger(item.cost) && item.cost>=0);
    assert.ok(Number.isInteger(item.humanity) && item.humanity>=0);
    assert.ok([0,2,4].includes(item.maxHumanityLoss));
  }
});
test('Menschlichkeit wird vom unveränderten EMP-Grundwert berechnet, ohne kumulative Verluste',()=>{
  const c=character();c.campaign.sessionUnlocked=true;const initial=evaluateCharacter(c,rules); const snapshot=structuredClone(c.allocations);
  assert.ok(install(c,'neutongue','internal').ok);
  const result=evaluateCharacter(c,rules), start=initial.attributes.EMP.base*10;
  assert.equal(result.cyberware.current,start-7); assert.equal(result.cyberware.maximum,start-2);
  assert.equal(result.attributes.EMP.effective,Math.floor((start-7)/10));
  assert.deepEqual(c.allocations,snapshot); assert.deepEqual(evaluateCharacter(c,rules),result);
  const empathySkill=result.skills.find(s=>s.attribute==='EMP');
  assert.equal(empathySkill.base,result.attributes.EMP.effective+empathySkill.level);
  assert.equal(result.derived.find(d=>d.id==='humanity').value,start-7);
  assert.ok(removeCyberware(c,rules,c.cyberware.items[0].id,stats(c),0).ok);
  assert.equal(evaluateCharacter(c,rules).cyberware.current,start-7);
});
test('Borgware senkt Maximum um vier, Fashionware weder Menschlichkeit noch Maximum',()=>{
  const c=character(); const start=stats(c).EMP*10;
  install(c,'bug-eye','eye-left'); install(c,'kill-display','fashion');
  const result=evaluateCharacter(c,rules);
  assert.equal(result.cyberware.current,start-14); assert.equal(result.cyberware.maximum,start-4); assert.equal(result.cyberware.cost,600);
  assert.equal(install(c,'bug-eye','eye-left').ok,false);
});
test('Kostenlimit und falscher Bereich verhindern Änderungen atomar',()=>{
  const c=character(); c.cyberware.limit=100;
  assert.equal(install(c,'optishield','external').ok,false); assert.equal(install(c,'neutongue','fashion').ok,false);
  assert.equal(c.cyberware.items.length,0); assert.ok(install(c,'neutongue','internal').ok);
  assert.equal(install(c,'holo-palm','arm-left').ok,false);
});
test('Option im natürlichen Arm belegt ihn allein; beide Arme bleiben unabhängig',()=>{
  const c=character(); assert.ok(install(c,'holo-palm','arm-left').ok);
  assert.equal(install(c,'holo-palm','arm-left').ok,false);
  assert.ok(install(c,'holo-palm','arm-right').ok);
  assert.equal(install(c,'cyberpillow','arm-left').ok,false);
});
test('Sieben Fashionware-Plätze sind unabhängig von externen Körperplätzen',()=>{
  const c=character(); for(let i=0;i<7;i++) assert.ok(install(c,'kill-display','fashion').ok);
  assert.equal(install(c,'kill-display','fashion').ok,false);
  assert.ok(install(c,'optishield','external').ok);
});
test('Light-Tattoo-Bonus wird einmal auf Fertigkeit angewandt und verändert keine gekauften Ränge',()=>{
  const c=character(), before=evaluateCharacter(c,rules); const ranks=structuredClone(c.skills.ranks);
  for(let i=0;i<3;i++) install(c,'kill-display','fashion');
  const after=evaluateCharacter(c,rules); const id='wardrobe-style';
  assert.equal(after.skills.find(s=>s.id===id).base,before.skills.find(s=>s.id===id).base+2);
  assert.deepEqual(c.skills.ranks,ranks); assert.equal(after.attributes.COOL.effective,before.attributes.COOL.effective);
  install(c,'kill-display','fashion'); assert.equal(evaluateCharacter(c,rules).skills.find(s=>s.id===id).modifiers.length,1);
});
test('Situative Wirkungen verändern weder Attribut noch Fertigkeitsbasis',()=>{
  const c=character(), before=evaluateCharacter(c,rules); install(c,'optishield','external'); const result=evaluateCharacter(c,rules);
  assert.equal(result.cyberware.effects[0].type,'situational'); assert.equal(result.attributes.REF.effective,before.attributes.REF.effective);
});
// Synthetic rules exercise the generic engine without pretending to be published implants.
const fixture={locations:[{id:'arm',capacity:1}],items:[
  {id:'base',name:'Testbasis',installationSlots:['arm'],foundation:'arm',capacity:2,cost:10,humanity:0,maxHumanityLoss:0},
  {id:'option',name:'Testoption',installationSlots:['arm'],requirements:{parentType:'arm'},slots:2,cost:5,humanity:0,maxHumanityLoss:0},
  {id:'incompatible',name:'Testkonflikt',installationSlots:['arm'],requirements:{parentType:'arm',incompatible:['option']},cost:0,humanity:0,maxHumanityLoss:0},
  {id:'strength',name:'Testvoraussetzung',installationSlots:['arm'],requirements:{minimumStats:{BODY:8}},cost:0,humanity:0,maxHumanityLoss:0}
]};
test('Basis, Kapazität, Abhängigkeiten und Entfernen einer noch benötigten Basis',()=>{
  const c=character();c.campaign.sessionUnlocked=true;const r={...rules,cyberwareRules:fixture};
  assert.equal(installCyberware(c,r,'option','arm',null,{BODY:8}).ok,false);
  assert.ok(installCyberware(c,r,'base','arm',null,{BODY:8}).ok); const parent=c.cyberware.items[0].id;
  assert.ok(installCyberware(c,r,'option','arm',parent,{BODY:8},0).ok);
  assert.equal(installCyberware(c,r,'option','arm',parent,{BODY:8},0).ok,false);
  assert.equal(removeCyberware(c,r,parent,{BODY:8},0).ok,false);
  assert.ok(removeCyberware(c,r,c.cyberware.items[1].id,{BODY:8},0).ok);
  assert.ok(removeCyberware(c,r,parent,{BODY:8},0).ok);
});
test('Inkompatibilität wird in beiden Richtungen und Mindestattribute vor Installation geprüft',()=>{
  const base={id:'implant-1',catalogId:'base',location:'arm',parent:null};
  const option={id:'implant-2',catalogId:'option',location:'arm',parent:base.id};
  const conflict={id:'implant-3',catalogId:'incompatible',location:'arm',parent:base.id};
  for(const items of [[base,option,conflict],[base,conflict,option]]) assert.match(installationErrors({items,limit:null},fixture,{BODY:8}).join(' '),/Kombination/);
  assert.match(installationErrors({items:[{...option,catalogId:'strength',parent:null}],limit:null},fixture,{BODY:7}).join(' '),/BODY/);
});
test('Dauerhafte Attributmodifikatoren respektieren Obergrenzen; abgeleitete Werte folgen BODY',()=>{
  assert.equal(resolveValue(8,'Test',[{type:'permanent',value:2,max:10},{type:'permanent',value:2,max:10}]).effective,10);
  const c=character(), r=structuredClone(rules); r.cyberwareRules.items.push({...r.cyberwareRules.items[2],id:'test-body',effects:[{type:'permanent',target:'BODY',value:2,max:10}]});
  const before=evaluateCharacter(c,r); assert.ok(installCyberware(c,r,'test-body','internal',null,stats(c)).ok);
  const result=evaluateCharacter(c,r); assert.equal(result.attributes.BODY.effective,before.attributes.BODY.base+2);
  assert.equal(result.derived.find(d=>d.id==='death').value,result.attributes.BODY.effective);
  assert.ok(result.derived.find(d=>d.id==='hp').value>before.derived.find(d=>d.id==='hp').value);
});
test('Gespeicherte Daten können Preise und Effekte nicht einschleusen; unbekannte IDs scheitern',()=>{
  const c=character(); install(c,'neutongue','internal'); c.cyberware.items[0].effects=[{target:'REF',value:100}]; c.cyberware.items[0].cost=-100;
  const safe=validateCharacter(c,rules); assert.deepEqual(Object.keys(safe.cyberware.items[0]),['id','catalogId','location','parent']);
  assert.equal(evaluateCharacter(safe,rules).cyberware.cost,100);
  c.cyberware.items[0].catalogId='unknown'; assert.throws(()=>validateCharacter(c,rules));
});
test('Manipulierte Installation liefert Fehler und keinerlei regelwirksame Boni',()=>{
  const c=character(); c.cyberware.items=[{id:'implant-1',catalogId:'neutongue',location:'fashion',parent:null}];
  const result=evaluateCharacter(c,rules); assert.ok(result.cyberwareErrors.length); assert.equal(result.cyberware.loss,0); assert.equal(result.complete,false);
});
test('Version 3 wird verlustfrei ergänzt und separat gesichert',()=>{
  const c=character(); c.version=3; delete c.cyberware; const raw=JSON.stringify(c), data=new Map([[STORAGE_KEY,raw]]);
  const loaded=loadCharacter(rules,{getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value)});
  assert.equal(loaded.blocked,false); assert.equal(loaded.character.version,11); assert.deepEqual(loaded.character.skills,c.skills);
  assert.deepEqual(loaded.character.cyberware,{items:[],limit:null,removed:[]}); assert.equal(data.get('red-builder.character.v3.backup'),raw);
});
test('EMP 0 wird sichtbar gemeldet; negative Menschlichkeit wird nicht verschwiegen',()=>{
  const c=character(); c.method='points';
  install(c,'bug-eye','eye-left'); install(c,'bug-eye','eye-right');
  const result=evaluateCharacter(c,rules);
  assert.equal(result.cyberware.current,-8); assert.equal(result.attributes.EMP.effective,0);
  assert.ok(result.cyberware.warnings.length); assert.equal(result.complete,false);
});
test('Ein fehlerhafter Entwurf bleibt durch einzelne Entfernungen reparierbar',()=>{
  const c=character(); install(c,'kill-display','fashion'); install(c,'optishield','external'); c.cyberware.limit=0;
  assert.ok(removeCyberware(c,rules,c.cyberware.items[0].id,stats(c),0).ok);
  assert.ok(removeCyberware(c,rules,c.cyberware.items[0].id,stats(c),0).ok);
  assert.deepEqual(evaluateCharacter(c,rules).cyberware.errors,[]);
});
test('Ungültige Beträge und doppelte Installations-IDs werden beim Laden zurückgewiesen',()=>{
  for(const limit of [-1,1.5,Infinity,1000001,'100']) { const c=character(); c.cyberware.limit=limit; assert.throws(()=>validateCharacter(c,rules)); }
  const c=character(); install(c,'kill-display','fashion'); c.cyberware.items.push({...c.cyberware.items[0]}); assert.throws(()=>validateCharacter(c,rules));
});
