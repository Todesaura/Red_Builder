import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createCharacter, validateCharacter } from '../js/model.js';
import { assignSkill, addSpecialty, skillPointsRemaining, skillValidation } from '../js/skills.js';
import { applySkillRecommendation, automaticallyRecommendSkills, recommendedSkills, isUnchangedSkillRecommendation } from '../js/skill-recommendations.js';
import { skillNameMenu } from '../js/ui-skill-choices.js';

const rules = JSON.parse(await readFile(new URL('../data/rules.json', import.meta.url), 'utf8'));
rules.skillRules = JSON.parse(await readFile(new URL('../data/skills.json', import.meta.url), 'utf8'));
const config = rules.skillRules;
function character(role = 'solo') {
  const item = createCharacter(rules); item.name = 'Test'; item.role = role;
  item.skills.nativeLanguage.name = 'Deutsch'; item.skills.hometown = 'Kabuki';
  return item;
}

test('Alle Rollen haben unterschiedliche, gültige Homebrew-Empfehlungen mit exakt 86 Punkten', () => {
  const distributions = new Set();
  for (const role of rules.roles) {
    const item = character(role.id);
    assert.equal(config.recommendations[role.id].homebrew, true);
    applySkillRecommendation(item, rules);
    assert.equal(skillPointsRemaining(item, rules), 0, role.id);
    assert.deepEqual(skillValidation(item, rules), [], role.id);
    assert.deepEqual(validateCharacter(item, rules), item);
    assert.equal(isUnchangedSkillRecommendation(item.skills, config), true);
    distributions.add(JSON.stringify(item.skills.ranks));
  }
  assert.equal(distributions.size, 10);
});

test('Frische Verteilungen und unangepasste Empfehlungen folgen der Rolle', () => {
  const item = character('solo');
  assert.equal(automaticallyRecommendSkills(item, rules), true);
  assert.equal(item.skills.ranks.autofire, 6);
  item.role = 'tech';
  assert.equal(automaticallyRecommendSkills(item, rules), true);
  assert.equal(item.skills.recommendation.role, 'tech');
  assert.equal(item.skills.ranks['electronics-security'], 6);
  assert.equal(item.skills.ranks.autofire, 0);
});

test('Eigene Punkteverteilungen werden beim Rollenwechsel nicht überschrieben', () => {
  const item = character();
  assignSkill(item, rules, 'handgun', 3);
  const before = structuredClone(item.skills);
  item.role = 'tech';
  assert.equal(automaticallyRecommendSkills(item, rules), false);
  assert.deepEqual(item.skills, before);
});

test('Bewusst auf Pflichtwerte reduzierte Empfehlungen werden nicht erneut automatisch gefüllt', () => {
  const item = character(); applySkillRecommendation(item, rules);
  for (const definition of config.skills.filter(skill => !skill.specialized)) assignSkill(item, rules, definition.id, definition.min);
  item.role = 'tech';
  assert.equal(automaticallyRecommendSkills(item, rules), false);
  assert.equal(skillPointsRemaining(item, rules), 60);
});

test('Rangänderungen und neue Spezialisierungen markieren eine Empfehlung als angepasst', () => {
  const item = character(); applySkillRecommendation(item, rules);
  assignSkill(item, rules, 'autofire', 5);
  assert.equal(item.skills.recommendation.edited, true);
  item.role = 'fixer';
  assert.equal(automaticallyRecommendSkills(item, rules), false);
  applySkillRecommendation(item, rules);
  addSpecialty(item, rules, 'language');
  assert.equal(item.skills.recommendation.edited, true);
});

test('Übernahme bewahrt Sprach- und Ortsnamen, setzt Rang 4 und erstellt unabhängige Daten', () => {
  const item = character('rockerboy');
  item.skills.nativeLanguage.name = 'Französisch'; item.skills.hometown = 'Eigener Ort';
  item.skills.nativeLanguage.level = 5;
  applySkillRecommendation(item, rules);
  assert.equal(item.skills.nativeLanguage.name, 'Französisch');
  assert.equal(item.skills.nativeLanguage.level, 4);
  assert.equal(item.skills.hometown, 'Eigener Ort');
  assert.equal(item.skills.specialties[0].name, 'Gitarre');
  item.skills.specialties[0].name = 'Bass';
  assert.equal(config.recommendations.rockerboy.specialties[0].name, 'Gitarre');
  assert.throws(() => recommendedSkills(item, rules, 'unknown'));
});

test('Veraltete oder manipulierte Empfehlungshinweise erlauben kein automatisches Überschreiben', () => {
  const item = character(); applySkillRecommendation(item, rules);
  item.skills.ranks.autofire = 4;
  assert.equal(isUnchangedSkillRecommendation(item.skills, config), false);
  item.role = 'tech';
  assert.equal(automaticallyRecommendSkills(item, rules), false);
  item.skills.recommendation.role = '__proto__';
  assert.throws(() => validateCharacter(item, rules));
});

test('Bisherige Version-3-Daten ohne Empfehlungshinweis bleiben lesbar', () => {
  const item = character(); delete item.skills.recommendation;
  assert.equal(validateCharacter(item, rules).skills.recommendation, null);
});

test('Menüs bieten direkte Auswahl und bewahren eigene Namen sicher', () => {
  const known = skillNameMenu({id:'native',target:'native-language',value:'Deutsch',options:config.languages});
  assert.match(known, /value="Deutsch" selected/);
  assert.doesNotMatch(known, /<input/);
  const own = skillNameMenu({id:'home',target:'hometown',value:'<Ort>',options:config.locations});
  assert.match(own, /Eigener Wert: &lt;Ort&gt;/);
  const custom = skillNameMenu({id:'home',target:'hometown',value:'Test',options:config.locations,customFields:['hometown']});
  assert.match(custom, /data-skill-text="hometown"/);
  assert.match(custom, /value="__custom" selected/);
});

test('Bereits vorhandene Spezialisierungen sind im Auswahlmenü gesperrt', () => {
  const html = skillNameMenu({id:'language',target:'specialty-1',value:'',options:config.languages,unavailable:['Deutsch']});
  assert.match(html, /value="Deutsch"[^>]*disabled/);
  assert.ok(config.locations.includes('Old Japantown'));
  assert.ok(config.locations.includes('Watson Development'));
  assert.ok(config.locations.includes('North Heywood'));
  assert.equal(new Set(config.locations).size, config.locations.length);
});
