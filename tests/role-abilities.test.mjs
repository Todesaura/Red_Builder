import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createCharacter } from '../js/model.js';
import { evaluateCharacter } from '../js/rules.js';
import { applySkillRecommendation } from '../js/skill-recommendations.js';
import { ROLE_ABILITIES, roleAbilityExamples } from '../js/role-abilities.js';
import { renderRoleAbilities } from '../js/ui-role-abilities.js';
import { buyEquipment } from '../js/economy.js';
import { equipArmor } from '../js/armor.js';
const json=async name=>JSON.parse(await readFile(new URL(`../data/${name}.json`,import.meta.url),'utf8'));
const rules=await json('rules');rules.skillRules=await json('skills');rules.cyberwareRules=await json('cyberware');rules.equipmentRules=await json('equipment');
function fresh(role){const c=createCharacter(rules);c.name='Test';c.role=role;applySkillRecommendation(c,rules);return c;}
test('Alle zehn Rollen erhalten eigene Erklärungen und Beispiele ohne Charakteränderungen',()=>{
 assert.equal(Object.keys(ROLE_ABILITIES).length,10);
 for(const {id} of rules.roles){const c=fresh(id),before=structuredClone(c),ev=evaluateCharacter(c,rules),html=renderRoleAbilities(c,rules,ev);
   assert.ok(roleAbilityExamples(c,ev).length);assert.match(html,/START-RANG 4/);assert.ok(html.includes(ROLE_ABILITIES[id].name));assert.doesNotMatch(html,/undefined|NaN/);assert.deepEqual(c,before);
 }
});
test('Tech-Beispiele folgen geänderten Attributen und Fertigkeiten statt pauschal Maker zu addieren',()=>{
 const c=fresh('tech');c.method='points';c.allocations.points.TECH=5;c.skills.ranks['basic-tech']=3;c.rolePoints.tech={field:1,upgrade:2,fabrication:3,invention:2};
 const text=roleAbilityExamples(c,evaluateCharacter(c,rules)).join(' ');
 assert.match(text,/TECH 5 \+ Fertigkeitsrang 3 \+ Feldexpertise 1 = Basis 9/);assert.match(text,/Verbessern 10 \+ 1W10/);assert.match(text,/ohne zusätzlichen Feldexpertise-Bonus/);
});
test('Nomad-Beispiele folgen Rüstung und zeigen Moto zusätzlich zur gewöhnlichen Basis',()=>{
 const c=fresh('nomad');c.method='points';c.allocations.points.REF=6;c.skills.ranks['drive-land']=4;
 assert.ok(buyEquipment(c,rules,'armor-medium-jack-body').ok);assert.ok(equipArmor(c,rules,'body','armor-medium-jack-body').ok);
 const ev=evaluateCharacter(c,rules),text=roleAbilityExamples(c,ev).join(' ');
 assert.match(text,/REF 4 \+ Rang 4 \+ Moto 4 = 12/);assert.equal(ev.skills.find(s=>s.id==='drive-land').base,12);
});
test('Rockerboy zeigt ausgewählte Instrument-Spezialisierungen und maskiert Eingabetext',()=>{
 const c=fresh('rockerboy');const instrument=c.skills.specialties.find(s=>s.skill==='play-instrument');assert.ok(instrument);instrument.name='<script>Gitarre</script>';
 const html=renderRoleAbilities(c,rules,evaluateCharacter(c,rules));assert.match(html,/Instrument spielen: &lt;script&gt;Gitarre&lt;\/script&gt;/);assert.doesNotMatch(html,/<script>/);
});
