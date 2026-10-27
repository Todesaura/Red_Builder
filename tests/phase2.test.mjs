import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createCharacter, validateCharacter, migrateCharacter } from '../js/model.js';
import { evaluateCharacter, assignAttribute } from '../js/rules.js';
import { createSkills, assignSkill, addSpecialty, skillPointsRemaining, skillPointsSpent, validateSkillState, skillValidation } from '../js/skills.js';
import { deriveValues } from '../js/derived.js';
import { loadCharacter, saveCharacter, STORAGE_KEY } from '../js/storage.js';

const rules = JSON.parse(await readFile(new URL('../data/rules.json', import.meta.url), 'utf8'));
rules.skillRules = JSON.parse(await readFile(new URL('../data/skills.json', import.meta.url), 'utf8'));
const config = rules.skillRules;
function character() {
  const result = createCharacter(rules);
  result.name = 'Test'; result.role = 'solo';
  result.skills.nativeLanguage.name = 'Deutsch'; result.skills.hometown = 'Heywood';
  return result;
}

test('Katalog entspricht 66 Fertigkeiten plus zwei expliziten Pflicht-Spezialisierungen', () => {
  assert.equal(config.skills.length, 68);
  assert.equal(new Set(config.skills.map(skill => skill.id)).size, 68);
  assert.equal(config.skills.filter(skill => skill.min === 2).length, 13);
  assert.deepEqual(config.skills.filter(skill => skill.cost === 2).map(skill => skill.id).sort(), ['autofire', 'demolitions', 'electronics-security', 'heavy-weapons', 'martial-arts', 'paramedic', 'pilot-air'].sort());
  assert.ok(config.skills.every(skill => rules.attributes.some(attribute => attribute.id === skill.attribute)));
});

test('26 Pflichtpunkte zählen zum Budget; Herkunftssprache Rang 4 ist kostenlos', () => {
  const item = character();
  assert.equal(skillPointsSpent(item.skills, config), 26);
  assert.equal(skillPointsRemaining(item, rules), 60);
  assert.equal(item.skills.nativeLanguage.level, 4);
  assert.equal(assignSkill(item, rules, 'native-language', 6).ok, true);
  assert.equal(skillPointsRemaining(item, rules), 58);
  assert.equal(assignSkill(item, rules, 'native-language', 3).ok, false);
});

test('Pflichtfertigkeiten dürfen im Entwurf unter 2 liegen, blockieren aber den Abschluss', () => {
  const item = character();
  assert.equal(assignSkill(item, rules, 'athletics', 1).ok, true);
  assert.equal(assignSkill(item, rules, 'handgun', 0).ok, true);
  for (const value of [-1, 7, 1.5, NaN, '4', null]) assert.equal(assignSkill(item, rules, 'handgun', value).ok, false);
  assert.equal(assignSkill(item, rules, 'unknown', 2).ok, false);
});

test('Doppelt teure Fertigkeiten verrechnen jeden Rang und erstatten beim Senken', () => {
  const item = character();
  assignSkill(item, rules, 'autofire', 3);
  assert.equal(skillPointsRemaining(item, rules), 54);
  assignSkill(item, rules, 'autofire', 2);
  assert.equal(skillPointsRemaining(item, rules), 56);
});

test('Exakt 86 Punkte erlauben Abschluss; Überschreiten wird vor Änderung verhindert', () => {
  const item = character();
  for (const skill of config.skills.filter(skill => skill.min === 2)) assignSkill(item, rules, skill.id, 6);
  item.rolePoints.solo.initiative = 4;
  // Thirteen required skills at 6 cost 78. Autofire 4 adds eight points.
  assignSkill(item, rules, 'autofire', 4);
  assert.equal(skillPointsRemaining(item, rules), 0);
  assert.equal(evaluateCharacter(item, rules).complete, true);
  assert.equal(assignSkill(item, rules, 'handgun', 1).ok, false);
  assert.equal(item.skills.ranks.handgun, 0);
  assignSkill(item, rules, 'autofire', 3);
  assert.equal(skillPointsRemaining(item, rules), 2);
  assert.equal(evaluateCharacter(item, rules).complete, false);
});

test('Spezialisierungen werden unabhängig und mit dem korrekten Faktor gekauft', () => {
  const item = character();
  addSpecialty(item, rules, 'science'); addSpecialty(item, rules, 'science'); addSpecialty(item, rules, 'martial-arts');
  item.skills.specialties[0].name = 'Chemie'; item.skills.specialties[1].name = 'Physik'; item.skills.specialties[2].name = 'Judo';
  assignSkill(item, rules, 'specialty-1', 3); assignSkill(item, rules, 'specialty-2', 4); assignSkill(item, rules, 'specialty-3', 2);
  assert.equal(skillPointsRemaining(item, rules), 49);
  const result = evaluateCharacter(item, rules);
  assert.equal(result.skills.find(skill => skill.id === 'specialty-3').base, 10);
  assert.equal(addSpecialty(item, rules, 'handgun').ok, false);
  assert.equal(assignSkill(item, rules, 'science', 2).ok, false);
});

test('Doppelte Sprachen, Heimatorte und Disziplinen verhindern den Abschluss', () => {
  const item = character();
  addSpecialty(item, rules, 'language'); item.skills.specialties[0].name = ' deutsch '; item.skills.specialties[0].level = 1;
  assert.ok(skillValidation(item, rules).some(error => error.includes('bereits vorhanden')));
  item.skills.specialties[0].skill = 'local-expert'; item.skills.specialties[0].name = 'HEYWOOD';
  assert.ok(skillValidation(item, rules).some(error => error.includes('bereits vorhanden')));
  item.skills.specialties[0].skill = 'martial-arts'; item.skills.specialties[0].name = 'Erfunden';
  assert.ok(skillValidation(item, rules).some(error => error.includes('Disziplinen')));
});

test('Unbenannte oder nicht gekaufte Spezialisierungen sowie fehlende Herkunft werden gemeldet', () => {
  const item = character();
  addSpecialty(item, rules, 'science');
  item.skills.nativeLanguage.name = ''; item.skills.hometown = '';
  const errors = skillValidation(item, rules);
  assert.ok(errors.some(error => error.includes('Herkunftssprache')));
  assert.ok(errors.some(error => error.includes('Heimat')));
  assert.ok(errors.some(error => error.includes('Benenne die Spezialisierung')));
  assert.ok(errors.some(error => error.includes('Vergib einen Rang')));
});

test('Skillbasis und Erklärung folgen Attributänderungen, auch bei Rang 0', () => {
  const item = character(); item.method = 'points';
  assignAttribute(item, rules, 'REF', 7);
  assignSkill(item, rules, 'handgun', 4);
  let value = evaluateCharacter(item, rules).skills.find(skill => skill.id === 'handgun');
  assert.equal(value.base, 11); assert.match(value.explanation, /REF 7 \+ Rang 4/);
  assignAttribute(item, rules, 'REF', 8);
  value = evaluateCharacter(item, rules).skills.find(skill => skill.id === 'handgun');
  assert.equal(value.base, 12);
  assert.equal(evaluateCharacter(item, rules).skills.find(skill => skill.id === 'shoulder-arms').base, 8);
});

test('Abgeleitete Werte runden den BODY/WILL-Mittelwert vor Multiplikation auf', () => {
  const attributes = Object.fromEntries(rules.attributes.map(({id}) => [id, { effective: 6 }]));
  attributes.BODY.effective = 5; attributes.WILL.effective = 6;
  const values = Object.fromEntries(deriveValues(attributes).map(value => [value.id, value.value]));
  assert.deepEqual(values, { hp: 40, wound: 20, death: 5, humanity: 60, initiative: 6, luck: 6 });
  attributes.WILL.effective = 5;
  assert.equal(deriveValues(attributes).find(value => value.id === 'hp').value, 35);
  assert.equal(deriveValues(attributes).find(value => value.id === 'wound').value, 18);
});

test('Alle BODY/WILL-Kombinationen 2–8 entsprechen den Tabellenschritten', () => {
  const table = [
    [20,25,25,30,30,35,35], [25,25,30,30,35,35,40], [25,30,30,35,35,40,40],
    [30,30,35,35,40,40,45], [30,35,35,40,40,45,45], [35,35,40,40,45,45,50], [35,40,40,45,45,50,50]
  ];
  for (let body = 2; body <= 8; body++) for (let will = 2; will <= 8; will++) {
    const attributes = Object.fromEntries(rules.attributes.map(({id}) => [id, { effective: 2 }]));
    attributes.BODY.effective = body; attributes.WILL.effective = will;
    const actual = deriveValues(attributes).find(value => value.id === 'hp').value;
    const expected = table[will - 2][body - 2];
    assert.equal(actual, expected, `${body}/${will}`);
  }
});

test('Unbekannte Attribute ergeben keine irreführenden abgeleiteten Werte', () => {
  const attributes = Object.fromEntries(rules.attributes.map(({id}) => [id, { effective: null }]));
  assert.deepEqual(deriveValues(attributes), []);
});

test('Migration von Version 2 bewahrt Bild, Rolle und Attribute und sichert das Original', () => {
  const old = character(); old.version = 2; old.portrait = 'data:image/jpeg;base64,YWJj'; delete old.skills;
  const raw = JSON.stringify(old); const data = new Map([[STORAGE_KEY, raw]]);
  const storage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
  const loaded = loadCharacter(rules, storage);
  assert.equal(loaded.blocked, false); assert.equal(loaded.character.version,11);
  assert.equal(loaded.character.portrait, old.portrait);
  assert.deepEqual(loaded.character.allocations, old.allocations);
  assert.equal(data.get('red-builder.character.v2.backup'), raw);
  assert.deepEqual(loaded.character.skills, createSkills(config));
  assert.equal(saveCharacter(loaded.character, storage).ok, true);
  assert.deepEqual(loadCharacter(rules, storage).character, loaded.character);
});

test('Ungültige Fertigkeitsdaten, Budgets, IDs und Zusatzfelder werden sicher verarbeitet', () => {
  for (const mutate of [
    skills => { skills.ranks.athletics = -1; }, skills => { skills.ranks.autofire = 7; },
    skills => { skills.nativeLanguage.level = 3; }, skills => { skills.nativeLanguage.name = 'x'.repeat(61); },
    skills => { skills.specialties = [{ id: '__proto__', skill: 'science', name: 'A', level: 1 }]; },
    skills => { skills.specialties = [{ id: 'specialty-1', skill: 'unknown', name: 'A', level: 1 }]; },
    skills => { for (const key of Object.keys(skills.ranks)) skills.ranks[key] = 6; }
  ]) { const skills = createSkills(config); mutate(skills); assert.throws(() => validateSkillState(skills, config)); }
  const item = character(); item.skills.ranks.__proto__ = { polluted: true };
  assert.equal(validateCharacter(item, rules).skills.ranks.polluted, undefined);
  assert.equal({}.polluted, undefined);
});
