import {roleRank} from './campaign-state.js?v=shopping1';
export const ROLE_RANK = 4;
export const ROLE_POOLS = {
  solo: { budget: 4, label: 'Kampfpunkte', fields: [
    ['deflection', 'Schaden abfangen', 2], ['fumble', 'Patzer abfangen', 4],
    ['initiative', 'Schnell reagieren', 1], ['precision', 'Präzise angreifen', 3],
    ['weakness', 'Schwachstellen treffen', 1], ['threat', 'Gefahren erkennen', 1]
  ] },
  tech: { budget: 8, label: 'Maker-Fachränge', fields: [
    ['field', 'Feldexpertise', 1], ['upgrade', 'Verbessern', 1],
    ['fabrication', 'Herstellen', 1], ['invention', 'Erfinden', 1]
  ] },
  medtech: { budget: 4, label: 'Medizinpunkte', fields: [
    ['surgery', 'Chirurgie', 1], ['pharma', 'Pharmazeutik', 1], ['cryo', 'Kryotechnik', 1]
  ] }
};
export const PHARMACEUTICALS = [
  ['antibiotic', 'Antibiotic', 'Unterstützt die natürliche Heilung.'],
  ['rapidetox', 'Rapidetox', 'Entfernt die Wirkung von Rauschmitteln und Giften.'],
  ['speedheal', 'Speedheal', 'Heilt akut, solange die Person nicht sterbend ist.'],
  ['stim', 'Stim', 'Unterdrückt zeitweise Abzüge durch schwere Verwundung.'],
  ['surge', 'Surge', 'Erlaubt vorübergehend, ohne Schlaf auszukommen.']
];
const techTargets = ['basic-tech', 'cybertech', 'electronics-security', 'weaponstech', 'land-vehicle-tech', 'air-vehicle-tech', 'sea-vehicle-tech'];
const motoTargets = ['drive-land', 'pilot-air', 'pilot-sea', 'land-vehicle-tech', 'air-vehicle-tech', 'sea-vehicle-tech'];
export function createRolePoints() {
  return { ...Object.fromEntries(Object.entries(ROLE_POOLS).map(([role, pool]) => [role, Object.fromEntries(pool.fields.map(([id]) => [id, 0]))])), pharmaceuticals: [] };
}
export function rolePool(role,rank=4){const pool=ROLE_POOLS[role];return pool?{...pool,budget:rank*(role==='tech'?2:1)}:null;}
export function validateRolePoints(input,rank=4,activeRole=null) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Die Rollenpunkte fehlen oder sind ungültig.');
  const safe = createRolePoints();
  for (const role of Object.keys(ROLE_POOLS)) {
    const currentRank=role===activeRole?rank:4,pool=rolePool(role,currentRank);
    let spent = 0;
    for (const [id, , cost] of pool.fields) {
      const value = input[role]?.[id];
      const max = role === 'tech' ? currentRank : Math.min(role==='medtech'?5:10,Math.floor(pool.budget / cost));
      if (!Number.isInteger(value) || value < 0 || value > max) throw new Error(`Ungültige Rollenpunkte: ${role}/${id}.`);
      safe[role][id] = value;
      spent += value * cost;
    }
    if (spent > pool.budget) throw new Error(`Das Rollenbudget für ${role} ist überschritten.`);
  }
  if (!Array.isArray(input.pharmaceuticals) || input.pharmaceuticals.length > safe.medtech.pharma || new Set(input.pharmaceuticals).size !== input.pharmaceuticals.length || input.pharmaceuticals.some(id => !PHARMACEUTICALS.some(([known]) => known === id))) throw new Error('Die Pharmazeutika-Auswahl ist ungültig.');
  safe.pharmaceuticals = [...input.pharmaceuticals];
  return safe;
}
export function rolePointsSpent(state, role) {
  return ROLE_POOLS[role]?.fields.reduce((sum, [id, , cost]) => sum + (state[role]?.[id] ?? 0) * cost, 0) ?? 0;
}
export function assignRolePoint(character, id, value) {
  const pool = rolePool(character.role,roleRank(character));
  if (!pool?.fields.some(([known]) => known === id)) return { ok: false, error: 'Dieser Bereich gehört nicht zu deiner Rolle.' };
  const candidate = structuredClone(character.rolePoints);
  candidate[character.role][id] = value;
  if (character.role === 'medtech' && id === 'pharma' && Number.isInteger(value) && value >= 0) candidate.pharmaceuticals = candidate.pharmaceuticals.slice(0, value);
  try { character.rolePoints = validateRolePoints(candidate,roleRank(character),character.role); return { ok: true }; }
  catch (error) { return { ok: false, error: error.message }; }
}
export function choosePharmaceutical(character, id, checked) {
  if (character.role !== 'medtech') return { ok: false, error: 'Nur Medtechs wählen Pharmazeutika.' };
  if (typeof checked !== 'boolean' || !PHARMACEUTICALS.some(([known]) => known === id)) return { ok: false, error: 'Unbekanntes Pharmazeutikum.' };
  const candidate = structuredClone(character.rolePoints);
  candidate.pharmaceuticals = candidate.pharmaceuticals.filter(entry => entry !== id);
  if (checked) candidate.pharmaceuticals.push(id);
  try { character.rolePoints = validateRolePoints(candidate,roleRank(character),character.role); return { ok: true }; }
  catch (error) { return { ok: false, error: error.message }; }
}
export function evaluateRolePoints(character) {
  const pool = rolePool(character.role,roleRank(character));
  let state;
  try { state = validateRolePoints(character.rolePoints ?? createRolePoints(),roleRank(character),character.role); }
  catch (error) { return { rank: roleRank(character), pool, spent: 0, remaining: pool?.budget ?? 0, state: createRolePoints(), effects: [], bonuses: {}, errors: [error.message] }; }
  const spent = rolePointsSpent(state, character.role);
  const remaining = (pool?.budget ?? 0) - spent;
  const result = { rank: roleRank(character), pool, spent, remaining, state, effects: [], bonuses: {}, errors: [] };
  if (pool && remaining) result.errors.push(`Verteile noch ${remaining} ${pool.label} unter Rollenfähigkeiten.`);
  if (character.role === 'medtech' && state.pharmaceuticals.length < state.medtech.pharma) result.errors.push(`Wähle noch ${state.medtech.pharma - state.pharmaceuticals.length} Pharmazeutikum/Pharmazeutika.`);
  const addSkill = (target, value, label) => { if (value) result.effects.push({ type: 'skill', target, value, label, source: 'Rollenfähigkeit auf Rang '+roleRank(character), role: character.role }); };
  if (character.role === 'solo') {
    const s = state.solo;
    result.bonuses = { initiative: s.initiative, attack: s.precision, firstDamage: s.weakness, damageDeflection: s.deflection, fumbleRecovery: Boolean(s.fumble) };
    addSkill('perception', s.threat, 'Kampfbewusstsein: Gefahren erkennen');
  }
  if (character.role === 'tech') for (const id of techTargets) addSkill(id, state.tech.field, 'Maker: Feldexpertise (gewöhnliche Technikprobe)');
  if (character.role === 'nomad') for (const id of motoTargets) addSkill(id, roleRank(character), 'Moto');
  return result;
}
