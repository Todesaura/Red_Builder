import test from 'node:test';
import assert from 'node:assert/strict';
import {completeCharacter,rules} from './helpers/pdf-fixture.mjs';
import {LEGACY_DAILY_QUESTIONS} from '../js/lifepath-budget-legacy.js';
import {DAILY_LIFEPATH_QUESTIONS} from '../js/lifepath-data.js';
import {createLifepath,validateLifepath,chooseLifepath,livingCosts,LIFEPATH_CHOICES} from '../js/lifepath.js';
import {resetSkillPoints,assignSkill,skillPointsRemaining,restoreRequiredSkills} from '../js/skills.js';
import {applySkillRecommendation,automaticallyRecommendSkills} from '../js/skill-recommendations.js';
import {evaluateCharacter} from '../js/rules.js';
import {renderSkills} from '../js/ui-skills.js';

test('Sieben Budgetfragen enthalten exakt die vorgegebenen Monatsbeträge und Antwortzahlen',()=>{
 const expected={security:[0,25,50,100,150,250],housing:[0,0,100,250,500,1000,1500,2500,0],neighborhood:[0,50,100,150],lifestyle:[100,300,600,1500],dependents:[0,50,100,150,250,400],commitments:[0,150,250,200,-200,-100],pastime:[0,25,50,100,150,200]};
 assert.deepEqual(DAILY_LIFEPATH_QUESTIONS.map(q=>q.id),Object.keys(expected));
 for(const q of DAILY_LIFEPATH_QUESTIONS){assert.deepEqual(q.monthlyCosts,expected[q.id]);assert.equal(q.options.length,expected[q.id].length);}
});
test('Jede neue Auswahl bis zur neunten Wohnoption bleibt beim Speichern eindeutig',()=>{
 const c=completeCharacter();
 for(const q of DAILY_LIFEPATH_QUESTIONS)for(let i=0;i<q.options.length;i++){
  assert.ok(chooseLifepath(c,q.id,LIFEPATH_CHOICES[i]).ok);
  const safe=validateLifepath(JSON.parse(JSON.stringify(c.lifepath)));
  assert.equal(safe[q.id].choice,LIFEPATH_CHOICES[i]);assert.equal(livingCosts({...c,lifepath:safe}).items.find(item=>item.id===q.id).amount,q.monthlyCosts[i]);
 }
 assert.equal(chooseLifepath(c,'lifestyle','fifth').ok,false);
});
test('Alle alten Budgetvorschläge behalten Text und ursprünglichen Preis statt neue Positionen zu übernehmen',()=>{
 const c=completeCharacter();
 for(const oldQuestion of LEGACY_DAILY_QUESTIONS)for(let i=0;i<oldQuestion.options.length;i++){
  const input=createLifepath(),oldId=oldQuestion.id,newId=oldId==='residence'?'neighborhood':oldId;
  delete input[newId];input[oldId]={choice:LIFEPATH_CHOICES[i],custom:''};
  const safe=validateLifepath(input);
  assert.equal(safe[newId].choice,'custom');assert.equal(safe[newId].custom,oldQuestion.options[i]);assert.equal(safe[newId].monthlyCost,oldQuestion.monthlyCosts[i]);
  assert.deepEqual(validateLifepath(safe),safe);assert.equal(livingCosts({...c,lifepath:safe}).items.find(item=>item.id===newId).amount,oldQuestion.monthlyCosts[i]);
 }
});
test('Fertigkeiten wechseln zwischen Empfehlung und freien Rängen, ohne Sprache, Heimat oder Budget zu verlieren',()=>{
 const c=completeCharacter();c.skills.nativeLanguage.name='Deutsch';c.skills.hometown='Watson Development';
 resetSkillPoints(c,rules);assert.equal(skillPointsRemaining(c,rules),60);assert.equal(c.skills.nativeLanguage.level,4);assert.equal(c.skills.recommendation.edited,true);
 assert.ok(assignSkill(c,rules,'first-aid',4).ok);const before=structuredClone(c.skills);c.role='tech';assert.equal(automaticallyRecommendSkills(c,rules),false);assert.deepEqual(c.skills,before);
 applySkillRecommendation(c,rules);assert.equal(skillPointsRemaining(c,rules),0);assert.equal(c.skills.recommendation.edited,false);assert.equal(c.skills.recommendation.role,'tech');assert.equal(c.skills.nativeLanguage.name,'Deutsch');assert.equal(c.skills.hometown,'Watson Development');
});
test('Kategorien starten geschlossen und zeigen Attribut sowie tatsächlichen Startwert auch für Spezialisierungen',()=>{
 const c=completeCharacter();resetSkillPoints(c,rules);c.method='points';c.allocations.points.TECH=4;assert.ok(assignSkill(c,rules,'first-aid',6).ok);
 const v=evaluateCharacter(c,rules),state={skillSearch:'',skillCategory:'all',customSkillFields:[]},html=renderSkills(c,rules,v,state);
 const groups=[...html.matchAll(/<details id="skill-category-[^"]+" class="skill-group"([^>]*)>/g)];assert.equal(groups.length,rules.skillRules.categories.length);assert.ok(groups.every(group=>!group[1].includes('open')));
 const technique=html.match(/<details id="skill-category-technique"[\s\S]*?<\/summary>/)?.[0]??html.slice(html.indexOf('>Technik</strong>'));
 assert.match(technique,/TCH 4/);assert.match(technique,/>Erste Hilfe<\/span><strong>10<\/strong><small>Rang 6/);
 const recommended=completeCharacter('solo'),recHtml=renderSkills(recommended,rules,evaluateCharacter(recommended,rules),state);
 for(const specialty of recommended.skills.specialties.filter(s=>s.level>0))assert.ok(recHtml.includes('Rang '+specialty.level));
});
test('Fertigkeitssuche öffnet Treffer; freie Verteilung und Empfehlung sind sichtbar auswählbar',()=>{
 const c=completeCharacter(),html=renderSkills(c,rules,evaluateCharacter(c,rules),{skillSearch:'Erste Hilfe',skillCategory:'all',customSkillFields:[]});
 assert.match(html,/data-action="skills-recommendation"/);assert.match(html,/data-action="skills-free"/);assert.match(html,/<details id="skill-category-[^"]+" class="skill-group" open>/);
});

test('Alle Pflichtfertigkeiten sind im Regelsystem und am Minusknopf bei Rang 2 gesperrt',()=>{
 const c=completeCharacter();resetSkillPoints(c,rules);const before=structuredClone(c);
 for(const skill of rules.skillRules.skills.filter(s=>!s.specialized&&s.min===2)){
  for(const value of [0,1])assert.equal(assignSkill(c,rules,skill.id,value).ok,false);
  assert.deepEqual(c,before);
 }
 const html=renderSkills(c,rules,evaluateCharacter(c,rules),{skillSearch:'',skillCategory:'all',customSkillFields:[]});
 for(const skill of rules.skillRules.skills.filter(s=>!s.specialized&&s.min===2))assert.match(html,new RegExp(`<button id="skill-minus-${skill.id}"[^>]*disabled`));
 assert.equal(assignSkill(c,rules,'cybertech',0).ok,true);
});

test('Ältere freie Nullpunkt-Entwürfe werden auf Pflichtwerte angehoben und bleiben eine freie Verteilung',()=>{
 const c=completeCharacter();resetSkillPoints(c,rules);c.skills.recommendation=null;c.skills.specialties=[];
 for(const id of Object.keys(c.skills.ranks))c.skills.ranks[id]=0;
 assert.equal(restoreRequiredSkills(c,rules),true);assert.equal(skillPointsRemaining(c,rules),60);
 assert.equal(automaticallyRecommendSkills(c,rules),false);assert.equal(restoreRequiredSkills(c,rules),false);
});

test('Pflichtwert-Reparatur überschreibt weder voll verteilte Altbestände noch Kampagnenwerte',()=>{
 const c=completeCharacter();resetSkillPoints(c,rules);for(const id of Object.keys(c.skills.ranks))c.skills.ranks[id]=0;
 for(const skill of rules.skillRules.skills.filter(s=>!s.specialized&&s.min===0&&s.cost===1).slice(0,13))c.skills.ranks[skill.id]=6;
 c.skills.ranks[rules.skillRules.skills.find(s=>!s.specialized&&s.min===0&&s.cost===2).id]=4;
 const before=structuredClone(c);assert.equal(restoreRequiredSkills(c,rules),false);assert.deepEqual(c,before);
 const active=completeCharacter();active.campaign.active=true;active.skills.ranks.athletics=0;const snapshot=structuredClone(active);assert.equal(restoreRequiredSkills(active,rules),false);assert.deepEqual(active,snapshot);
});
