import {campaignSkillConfig} from './campaign-state.js?v=session6';
export function createSkills(config) {
  return {
    ranks: Object.fromEntries(config.skills.filter(skill => !skill.specialized).map(skill => [skill.id, skill.min])),
    nativeLanguage: { name: '', level: config.nativeLanguageFreeRank },
    hometown: '',
    specialties: [],
    recommendation: null
  };
}

export function markSkillsEdited(character) {
  if (character.skills.recommendation) character.skills.recommendation.edited = true;
}

export function resetSkillPoints(character, rules) {
  const skills = character.skills;
  for (const id of Object.keys(skills.ranks)) skills.ranks[id] = 0;
  for (const item of skills.specialties) item.level = 0;
  skills.nativeLanguage.level = rules.skillRules.nativeLanguageFreeRank;
  markSkillsEdited(character);
}

export function skillPointsSpent(skills, config) {
  return config.skills.filter(skill => !skill.specialized).reduce((sum, skill) => sum + skills.ranks[skill.id] * skill.cost, 0)
    + skills.specialties.reduce((sum, item) => sum + item.level * config.skills.find(skill => skill.id === item.skill).cost, 0)
    + skills.nativeLanguage.level - config.nativeLanguageFreeRank;
}

export function skillPointsRemaining(character, rules) {
  return campaignSkillConfig(character,rules.skillRules).budget - skillPointsSpent(character.skills, rules.skillRules);
}

export function assignSkill(character, rules, id, value) {
  const config = rules.skillRules;
  const specialty = character.skills.specialties.find(item => item.id === id);
  const native = id === 'native-language';
  const definition = native ? { min: config.nativeLanguageFreeRank, cost: 1 } : config.skills.find(skill => skill.id === (specialty?.skill ?? id));
  if (!definition || (!native && definition.specialized && !specialty)) return { ok: false, error: 'Unbekannte Fertigkeit.' };
  const minimum = native ? config.nativeLanguageFreeRank : 0;
  if (!Number.isInteger(value) || value < minimum || value > config.maxRank) return { ok: false, error: `Der Rang muss zwischen ${minimum} und ${config.maxRank} liegen.` };
  const current = native ? character.skills.nativeLanguage.level : specialty ? specialty.level : character.skills.ranks[id];
  if ((value - current) * definition.cost > skillPointsRemaining(character, rules)) return { ok: false, error: 'Dein Fertigkeitsbudget reicht dafür nicht aus.' };
  if (native) character.skills.nativeLanguage.level = value;
  else if (specialty) specialty.level = value;
  else character.skills.ranks[id] = value;
  if (value !== current) markSkillsEdited(character);
  return { ok: true };
}

export function addSpecialty(character, rules, skillId) {
  const definition = rules.skillRules.skills.find(skill => skill.id === skillId && skill.specialized);
  if (!definition) return { ok: false, error: 'Diese Fertigkeit hat keine Spezialisierungen.' };
  if (character.skills.specialties.length >= 40) return { ok: false, error: 'Höchstens 40 Spezialisierungen pro Entwurf.' };
  let number = 1;
  while (character.skills.specialties.some(item => item.id === `specialty-${number}`)) number++;
  character.skills.specialties.push({ id: `specialty-${number}`, skill: skillId, name: '', level: 0 });
  markSkillsEdited(character);
  return { ok: true };
}

const normalized = text => text.trim().normalize('NFKC').toLocaleLowerCase('de');

export function validateSkillState(input, config) {
  if (!input || !input.ranks || !input.nativeLanguage || !Array.isArray(input.specialties)) throw new Error('Die Fertigkeitsdaten fehlen.');
  const result = createSkills(config);
  if (input.recommendation != null) {
    if (!Object.hasOwn(config.recommendations, input.recommendation.role) || typeof input.recommendation.edited !== 'boolean') throw new Error('Ungültige Fertigkeitsempfehlung.');
    result.recommendation = { role: input.recommendation.role, edited: input.recommendation.edited };
  }
  const boundedText = text => typeof text === 'string' && text.length <= 60;
  if (!boundedText(input.nativeLanguage.name) || !boundedText(input.hometown)) throw new Error('Sprache oder Heimat ist ungültig (maximal 60 Zeichen).');
  result.nativeLanguage.name = input.nativeLanguage.name;
  result.hometown = input.hometown;
  for (const definition of config.skills.filter(skill => !skill.specialized)) {
    const rank = input.ranks[definition.id];
    if (!Number.isInteger(rank) || rank < 0 || rank > config.maxRank) throw new Error(`Ungültiger Rang für ${definition.name}.`);
    result.ranks[definition.id] = rank;
  }
  const nativeRank = input.nativeLanguage.level;
  if (!Number.isInteger(nativeRank) || nativeRank < config.nativeLanguageFreeRank || nativeRank > config.maxRank) throw new Error('Ungültiger Rang der Herkunftssprache.');
  result.nativeLanguage.level = nativeRank;
  if (input.specialties.length > 40) throw new Error('Zu viele Spezialisierungen.');
  const ids = new Set();
  for (const item of input.specialties) {
    if (!item || typeof item.id !== 'string' || !/^specialty-[1-9]\d{0,4}$/.test(item.id) || ids.has(item.id)) throw new Error('Ungültige Spezialisierungs-ID.');
    const definition = config.skills.find(skill => skill.id === item.skill && skill.specialized);
    if (!definition || !boundedText(item.name) || !Number.isInteger(item.level) || item.level < 0 || item.level > config.maxRank) throw new Error('Ungültige Spezialisierung.');
    ids.add(item.id);
    result.specialties.push({ id: item.id, skill: item.skill, name: item.name, level: item.level });
  }
  if (skillPointsSpent(result, config) > config.budget) throw new Error('Das Fertigkeitsbudget wurde überschritten.');
  return result;
}

export function skillValidation(character, rules) {
  const skills = character.skills;
  const errors = [];
  const remaining = skillPointsRemaining(character, rules);
  if (remaining !== 0) errors.push(`Verteile noch ${remaining} Fertigkeitspunkte.`);
  for (const definition of rules.skillRules.skills.filter(item => !item.specialized && item.min > 0)) {
    if (skills.ranks[definition.id] < definition.min) errors.push(`${definition.name}: Für einen fertigen Charakter mindestens Rang ${definition.min}.`);
  }
  if (!skills.nativeLanguage.name.trim()) errors.push('Benenne deine kulturelle Herkunftssprache.');
  if (['streetslang', 'straßenslang'].includes(normalized(skills.nativeLanguage.name))) errors.push('Wähle als Herkunftssprache eine kulturelle Sprache; Straßenslang wird getrennt gekauft.');
  if (!skills.hometown.trim()) errors.push('Benenne deine Heimat für die Ortskenntnis.');
  const seen = new Set();
  if (skills.nativeLanguage.name.trim()) seen.add(`language:${normalized(skills.nativeLanguage.name)}`);
  seen.add('language:straßenslang'); seen.add('language:streetslang');
  if (skills.hometown.trim()) seen.add(`local-expert:${normalized(skills.hometown)}`);
  for (const item of skills.specialties) {
    const definition = rules.skillRules.skills.find(skill => skill.id === item.skill);
    if (!item.name.trim()) errors.push(`Benenne die Spezialisierung für ${definition.name} oder entferne den Eintrag.`);
    if (definition.options && !definition.options.some(option => normalized(option) === normalized(item.name))) errors.push(`Wähle für ${definition.name} eine der verfügbaren Disziplinen.`);
    if (item.level === 0) errors.push(`Vergib einen Rang für ${definition.name} (${item.name || 'unbenannt'}) oder entferne den Eintrag.`);
    const key = `${item.skill}:${normalized(item.name)}`;
    if (seen.has(key)) errors.push(`Die Spezialisierung „${item.name}“ ist bereits vorhanden.`);
    seen.add(key);
  }
  return errors;
}

export function evaluateSkills(character, rules, attributes, effects = []) {
  const config = rules.skillRules;
  const recommendation = character.skills.recommendation;
  const origin = recommendation
    ? `Verteilung: automatische Startwerte für ${rules.roles.find(role => role.id === recommendation.role)?.name ?? recommendation.role} (Homebrew)${recommendation.edited ? ', individuell angepasst' : ''}.`
    : 'Verteilung: selbst vergebene Fertigkeitspunkte.';
  const entries = config.skills.filter(skill => !skill.specialized).map(skill => ({ ...skill, level: character.skills.ranks[skill.id] }));
  entries.push({ id: 'native-language', name: `Herkunftssprache: ${character.skills.nativeLanguage.name || 'noch offen'}`, attribute: 'INT', cost: 1, min: config.nativeLanguageFreeRank, level: character.skills.nativeLanguage.level, free: config.nativeLanguageFreeRank });
  for (const item of character.skills.specialties) {
    const definition = config.skills.find(skill => skill.id === item.skill);
    entries.push({ ...definition, id: item.id, name: `${definition.name}: ${item.name || 'noch offen'}`, level: item.level });
  }
  return entries.map(skill => {
    const attribute = attributes[skill.attribute].effective;
    const modifiers = effects.filter(effect => effect.type === 'skill' && effect.target === skill.id);
    const bonus = modifiers.reduce((sum, effect) => sum + effect.value, 0);
    const base = attribute === null ? null : attribute + skill.level + bonus;
    return { ...skill, modifiers, attributeValue: attribute, base, spent: (skill.level - (skill.free ?? 0)) * skill.cost,
      explanation: `${skill.name}: ${skill.attribute} ${attribute ?? 'offen'} + Rang ${skill.level}${bonus ? ` + feste Boni ${bonus}` : ''} = Fertigkeitsbasis ${base ?? 'offen'}. ${modifiers.map(effect => `${effect.label} (${effect.source}).`).join(' ')} ${skill.free ? `${skill.free} Ränge sind durch die kulturelle Herkunft kostenlos.` : `Jeder Rang kostet ${skill.cost} Fertigkeitspunkt${skill.cost === 1 ? '' : 'e'}.`} ${origin} Regelquelle: ${config.source}. Keine situativen Boni oder Würfelwürfe enthalten.` };
  });
}
