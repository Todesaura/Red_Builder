import { evaluateLifepath } from './lifepath.js?v=shopping1';
import { evaluateRolePoints } from './role-points.js?v=shopping1';
import { evaluateSkills, skillValidation } from './skills.js?v=shopping1';
import { deriveValues } from './derived.js?v=shopping1';
import { evaluateCyberware } from './cyberware.js?v=shopping1';
import { evaluateArmor } from './armor.js?v=shopping1';
import { evaluateFunds } from './economy.js?v=shopping1';
import {evaluateLoadout} from './loadout-limits.js?v=shopping1';

export function pointsRemaining(character, rules) {
  return rules.pointBuy.budget - Object.values(character.allocations.points).reduce((sum, value) => sum + value, 0);
}

export function assignAttribute(character, rules, id, value) {
  if (!rules.attributes.some(attribute => attribute.id === id)) return { ok: false, error: 'Unbekanntes Attribut.' };
  if (character.method !== 'points') return { ok: false, error: 'Wechsle zur Punkteverteilung, um Werte individuell anzupassen.' };
  if (!Number.isInteger(value) || value < rules.pointBuy.min || value > rules.pointBuy.max) return { ok: false, error: `Wähle einen ganzen Wert zwischen ${rules.pointBuy.min} und ${rules.pointBuy.max}.` };
  if (value - character.allocations.points[id] > pointsRemaining(character, rules)) return { ok: false, error: 'Dafür reichen deine verbleibenden Punkte nicht aus.' };
  character.allocations.points[id] = value;
  return { ok: true };
}

export function applyRecommendation(character, rules) {
  const preset = rules.roles.find(role => role.id === character.role)?.recommendation;
  if (!preset) return { ok: false, error: 'Wähle zuerst eine Rolle.' };
  character.allocations.points = { ...preset.stats };
  character.method = 'points';
  return { ok: true };
}

// Worn armor and permanent changes affect attributes; situational effects stay separate.
export function resolveValue(base, source, modifiers = []) {
  return {
    base, source, modifiers: modifiers.map(modifier => ({ ...modifier })),
    effective: base === null ? null : modifiers.filter(modifier => ['permanent', 'equipment'].includes(modifier.type)).reduce((value, modifier) => Math.max(modifier.min ?? -Infinity, Math.min(modifier.max ?? Infinity, value + modifier.value)), base)
  };
}

export function evaluateCharacter(character, rules) {
  const role = rules.roles.find(role => role.id === character.role);
  const recommended = character.method === 'recommendation';
  const source = recommended ? role?.recommendation.source ?? 'Wähle zuerst eine Rolle' : rules.pointBuy.source;
  const stats = recommended ? role?.recommendation.stats : character.allocations.points;
  const baseStats = Object.fromEntries(rules.attributes.map(({ id }) => [id, stats?.[id] ?? null]));
  const cyberware = evaluateCyberware(character, rules, baseStats);
  const armor = evaluateArmor(character, rules, cyberware);
  const roleAbilities = evaluateRolePoints(character);
  const lifepath = evaluateLifepath(character);
  const effects = [...cyberware.effects, ...armor.effects, ...roleAbilities.effects];
  if (cyberware.empathy !== null && cyberware.empathy !== baseStats.EMP) effects.push({ type: 'permanent', target: 'EMP', value: cyberware.empathy - baseStats.EMP, label: 'Menschlichkeitsverlust durch Cyberware', source: 'RTG: From the Mayor’s Desk, 05.02.2021', min: 0 });
  const attributes = Object.fromEntries(rules.attributes.map(({ id }) => [id, resolveValue(baseStats[id], source, effects.filter(effect => ['permanent', 'equipment'].includes(effect.type) && effect.target === id))]));
  const errors = [];
  if (!character.name.trim()) errors.push('Gib deinem Charakter einen Namen.');
  if (!character.role) errors.push('Wähle eine Charakterrolle.');
  for (const { id, name } of rules.attributes) {
    const value = attributes[id].base;
    if (value !== null && (!Number.isInteger(value) || value < rules.pointBuy.min || value > rules.pointBuy.max)) errors.push(`${name}: Der Basiswert muss zwischen ${rules.pointBuy.min} und ${rules.pointBuy.max} liegen.`);
  }
  const remaining = pointsRemaining(character, rules);
  if (!recommended && remaining > 0) errors.push(`Verteile noch ${remaining} ${remaining === 1 ? 'Punkt' : 'Punkte'}.`);
  if (!recommended && remaining < 0) errors.push(`Das Attributbudget ist um ${-remaining} Punkte überschritten.`);
  const attributesComplete = errors.length === 0;
  const skillErrors = skillValidation(character, rules);
  const funds = evaluateFunds(character, rules);
  const loadout=evaluateLoadout(character,rules);
  const cyberwareErrors = [...cyberware.errors, ...cyberware.warnings, ...funds.errors, ...armor.errors, ...loadout.errors];
  const derived = deriveValues(attributes, cyberware);
  const initiative = derived.find(item => item.id === 'initiative');
  const cyberInitiative = cyberware.effects.filter(effect => effect.type === 'derived' && effect.target === 'initiative').reduce((sum,effect)=>sum+effect.value,0);
  const soloInitiative = roleAbilities.bonuses.initiative ?? 0;
  if (initiative && (soloInitiative || cyberInitiative)) {
    initiative.value += soloInitiative + cyberInitiative;
    initiative.explanation = `REF ${attributes.REF.effective} + Solo ${soloInitiative} + Cyberware ${cyberInitiative} = ${initiative.value}. Im Spiel kommt 1W10 hinzu.`;
    initiative.play = `Zu Kampfbeginn: ${initiative.value} + 1W10, einschließlich Solo- und dauerhafter Cyberware-Boni. ` + initiative.play.slice(initiative.play.indexOf('Höhere Ergebnisse'));
  }
  const maximumHp=derived.find(item=>item.id==='hp')?.value??null;
  const health={current:character.campaign?.hp??maximumHp,maximum:maximumHp,stabilized:character.campaign?.stabilized??false,injuries:character.campaign?.injuries??[]};
  return { health, attributes, cyberware, armor, funds, loadout, roleAbilities, lifepath, skills: evaluateSkills(character, rules, attributes, effects), derived,
    errors: [...errors, ...skillErrors, ...cyberwareErrors, ...roleAbilities.errors, ...lifepath.errors], attributeErrors: errors, skillErrors, cyberwareErrors,
    attributesComplete, skillsComplete: skillErrors.length === 0, complete: attributesComplete && skillErrors.length === 0 && cyberwareErrors.length === 0 && roleAbilities.errors.length === 0 && lifepath.errors.length === 0 };
}
