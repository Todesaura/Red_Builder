import {createCampaign,validateCampaign,campaignSkillConfig,roleRank} from './campaign-state.js?v=session6';
import { createLifepath, validateLifepath } from './lifepath.js?v=session6';
import { PORTRAITS } from './portrait-catalog.js?v=100';
import { createRolePoints, validateRolePoints } from './role-points.js?v=session6';
import { createSkills, validateSkillState } from './skills.js?v=session6';
import { createCyberware, validateCyberware } from './cyberware.js?v=session6';
import { createEquipment, validateEquipment } from './economy.js?v=session6';

export const FORMAT_VERSION = 11;
export const MAX_PORTRAIT_LENGTH = 400000;

export function createCharacter(rules) {
  return {
    version: FORMAT_VERSION, name: '', role: '', portrait: null, portraitSource: null, method: 'recommendation',
    allocations: { points: Object.fromEntries(rules.attributes.map(({ id }) => [id, rules.pointBuy.min])) },
    campaign:createCampaign(), lifepath: createLifepath(), rolePoints: createRolePoints(), skills: createSkills(rules.skillRules), cyberware: createCyberware(), equipment: createEquipment()
  };
}

export function validatePortrait(portrait) {
  if (portrait === null) return null;
  if (typeof portrait !== 'string' || portrait.length > MAX_PORTRAIT_LENGTH || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(portrait)) {
    throw new Error('Das gespeicherte Porträt ist ungültig oder zu groß.');
  }
  return portrait;
}

// Reconstruct known fields only; persisted data cannot supply rule effects or HTML.
export function validateCharacter(input, rules) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Der gespeicherte Charakter ist kein gültiges Objekt.');
  if (input.version !== FORMAT_VERSION) throw new Error('Diese Version der Charakterdaten wird nicht unterstützt.');
  if (typeof input.name !== 'string' || input.name.length > 60) throw new Error('Der Charaktername ist ungültig (maximal 60 Zeichen).');
  if (input.role !== '' && !rules.roles.some(role => role.id === input.role)) throw new Error('Die gespeicherte Rolle ist unbekannt.');
  if (!['recommendation', 'points'].includes(input.method)) throw new Error('Die Erstellungsmethode ist unbekannt.');
  const character = createCharacter(rules);
  character.name = input.name;
  character.role = input.role;
  character.method = input.method;
  character.portrait = validatePortrait(input.portrait);
  character.portraitSource = character.portrait && PORTRAITS.some(portrait => portrait.id === input.portraitSource) ? input.portraitSource : null;
  character.campaign = validateCampaign(input.campaign,rules);
  character.lifepath = validateLifepath(input.lifepath);
  character.rolePoints = validateRolePoints(input.rolePoints,roleRank(character),character.role);
  character.skills = validateSkillState(input.skills, campaignSkillConfig(character,rules.skillRules));
  character.cyberware = validateCyberware(input.cyberware, rules.cyberwareRules);
  character.equipment = validateEquipment(input.equipment, rules);
  const values = input.allocations?.points;
  if (!values || typeof values !== 'object' || Array.isArray(values)) throw new Error('Die Attributverteilung fehlt.');
  for (const { id } of rules.attributes) {
    const value = values[id];
    if (!Number.isInteger(value) || value < rules.pointBuy.min || value > rules.pointBuy.max) throw new Error(`Ungültiger Wert für ${id}.`);
    character.allocations.points[id] = value;
  }
  if (Object.values(character.allocations.points).reduce((sum, value) => sum + value, 0) > rules.pointBuy.budget) throw new Error('Das gespeicherte Punktebudget ist überschritten.');
  return character;
}

export function migrateCharacter(input, rules) {
  if(input?.version===10)return validateCharacter({...input,version:FORMAT_VERSION,campaign:createCampaign()},rules);
  if (input?.version >= 1 && input.version <= 9) input = { ...input, cyberware: { ...input.cyberware, removed: [] } };
  if (input?.version === 9) return validateCharacter({ ...input, version: FORMAT_VERSION }, rules);
  if (input?.version >= 1 && input.version <= 8) input = { ...input, equipment: { ...input.equipment, custom: [] } };
  if (input?.version === 8) return validateCharacter({ ...input, version: FORMAT_VERSION }, rules);
  if (input?.version >= 1 && input.version <= 7) input = { ...input, lifepath: createLifepath() };
  if (input?.version === 7) return validateCharacter({ ...input, version: FORMAT_VERSION }, rules);
  if (input?.version >= 1 && input.version <= 6) input = { ...input, rolePoints: createRolePoints() };
  if (input?.version === 6) return validateCharacter({ ...input, version: FORMAT_VERSION }, rules);
  if (input?.version === 5) return validateCharacter({ ...input, version: FORMAT_VERSION, equipment: { ...input.equipment, armor: { head: null, body: null } } }, rules);
  if (input?.version >= 1 && input.version <= 4) input = { ...input, equipment: createEquipment() };
  if (input?.version === 4) return validateCharacter({ ...input, version: FORMAT_VERSION, cyberware: { ...input.cyberware, limit: null } }, rules);
  if (input?.version === 3) return validateCharacter({ ...input, version: FORMAT_VERSION, cyberware: createCyberware() }, rules);
  if (input?.version === 2) return validateCharacter({ ...input, version: FORMAT_VERSION, skills: createSkills(rules.skillRules), cyberware: createCyberware() }, rules);
  if (input?.version !== 1) return validateCharacter(input, rules);
  if (!['array', 'points'].includes(input.method)) throw new Error('Die alte Erstellungsmethode ist unbekannt.');
  const character = { ...input, version: FORMAT_VERSION, portrait: null, method: 'points', allocations: { points: input.allocations?.points }, skills: createSkills(rules.skillRules), cyberware: createCyberware() };
  // Preserve an active old array as editable points; storage backs up the original document.
  if (input.method === 'array') {
    const pool = [8, 8, 7, 7, 6, 6, 6, 5, 5, 4];
    const values = input.allocations?.array;
    if (!values) throw new Error('Die alte Array-Verteilung fehlt.');
    character.allocations.points = Object.fromEntries(rules.attributes.map(({ id }) => {
      const value = values[id];
      if (value === null) return [id, rules.pointBuy.min];
      const index = pool.indexOf(value);
      if (index === -1) throw new Error('Die alte Array-Verteilung ist ungültig.');
      pool.splice(index, 1);
      return [id, value];
    }));
  }
  return validateCharacter(character, rules);
}
