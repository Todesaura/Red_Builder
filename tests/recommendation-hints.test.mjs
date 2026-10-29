import test from 'node:test';
import assert from 'node:assert/strict';
import {completeCharacter,rules} from './helpers/pdf-fixture.mjs';
import {remainingRecommendations,unreadRecommendations,acknowledgeRecommendations,resetDraftRecommendationHints} from '../js/recommendation-hints.js';
import {renderRoleAbilities} from '../js/ui-role-abilities.js';
import {evaluateCharacter} from '../js/rules.js';
import {buyEquipment} from '../js/economy.js';
const storage=()=>{const data=new Map();return {getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value)};};
test('Empfehlungszähler zählen fehlende unterschiedliche Gegenstände und tatsächliche Implantate',()=>{
  const c=completeCharacter('solo'),before=structuredClone(c);
  const cyber=remainingRecommendations(c,rules,'cyberware');assert.equal(cyber,5);
  c.cyberware.items.push({id:'test',catalogId:'biomonitor',location:'internal',parent:null});
  assert.equal(remainingRecommendations(c,rules,'cyberware'),cyber-1);
  const weapons=remainingRecommendations(c,rules,'equipment','weapons');assert.ok(weapons>0);
  assert.ok(buyEquipment(c,rules,'heavy-pistol').ok);
  assert.equal(remainingRecommendations(c,rules,'equipment','weapons'),weapons-1);
  assert.equal(remainingRecommendations(before,rules,'cyberware'),5);
  assert.equal(remainingRecommendations(c,rules,'cyberware','unknown'),0);
});
test('Ein Klick quittiert nur das jeweilige Menü, dauerhaft und getrennt nach Profil und Rolle',()=>{
  const s=storage(),c=completeCharacter();
  assert.equal(unreadRecommendations(c,'tab:cyberware',s),true);
  acknowledgeRecommendations(c,'tab:cyberware',s);
  assert.equal(unreadRecommendations(c,'tab:cyberware',s),false);
  assert.equal(unreadRecommendations(c,'cyber:internal',s),true);
  c.role='tech';assert.equal(unreadRecommendations(c,'tab:cyberware',s),true);
  c.role='solo';s.setItem('red-builder.character.activeArchive','profile2');assert.equal(unreadRecommendations(c,'tab:cyberware',s),true);
  acknowledgeRecommendations(c,'tab:cyberware',s);resetDraftRecommendationHints(s);
  assert.equal(unreadRecommendations(c,'tab:cyberware',s),false);
  s.setItem('red-builder.character.activeArchive','');assert.equal(unreadRecommendations(c,'tab:cyberware',s),true);
});
test('Rollen mit Punktverteilung klappen Zusatz-Erklärungen zu; andere Rollen erklären ihre Fähigkeit direkt',()=>{
  for(const role of rules.roles){
    const c=completeCharacter(role.id),v=evaluateCharacter(c,rules),html=renderRoleAbilities(c,rules,v);
    assert.doesNotMatch(html,/other-role-|Was können die anderen Rollen/);
    assert.doesNotMatch(html,/id="role-ability-explanations"/);
    if(v.roleAbilities.pool)for(const [id] of v.roleAbilities.pool.fields)assert.match(html,new RegExp(`<details id="role-point-help-${id}"`));
  }
});
