import { createSkills, validateSkillState } from './skills.js?v=shopping1';

export function isInitialSkillAllocation(skills, config) {
  return !skills.recommendation && skills.nativeLanguage.level === config.nativeLanguageFreeRank && skills.specialties.length === 0
    && config.skills.filter(skill => !skill.specialized).every(skill => skills.ranks[skill.id] === skill.min);
}

export function isUnchangedSkillRecommendation(skills, config) {
  const origin = skills.recommendation;
  if (!origin || origin.edited || !Object.hasOwn(config.recommendations, origin.role)) return false;
  const preset = config.recommendations[origin.role];
  return skills.nativeLanguage.level === config.nativeLanguageFreeRank
    && Object.keys(preset.ranks).every(id => skills.ranks[id] === preset.ranks[id])
    && skills.specialties.length === preset.specialties.length
    && skills.specialties.every((item, index) => ['skill', 'name', 'level'].every(key => item[key] === preset.specialties[index][key]));
}

export function recommendedSkills(character, rules, roleId = character.role) {
  const config = rules.skillRules;
  const preset = Object.hasOwn(config.recommendations, roleId) ? config.recommendations[roleId] : null;
  if (!preset) throw new Error('Für diese Rolle gibt es keine Fertigkeitsempfehlung.');
  const skills = createSkills(config);
  skills.ranks = { ...preset.ranks };
  skills.specialties = preset.specialties.map((item, index) => ({ ...item, id: `specialty-${index + 1}` }));
  skills.nativeLanguage.name = character.skills.nativeLanguage.name;
  skills.hometown = character.skills.hometown;
  skills.recommendation = { role: roleId, edited: false };
  return validateSkillState(skills, config);
}

export function applySkillRecommendation(character, rules) {
  character.skills = recommendedSkills(character, rules);
}

export function automaticallyRecommendSkills(character, rules) {
  if (isInitialSkillAllocation(character.skills, rules.skillRules) || isUnchangedSkillRecommendation(character.skills, rules.skillRules)) {
    applySkillRecommendation(character, rules);
    return true;
  }
  return false;
}
