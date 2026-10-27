import {installedCyberWeapons} from './cyberware-weapons.js?v=session6';
import {weaponConfiguration,attachmentList,secondaryWeapons} from './weapon-attachments.js?v=grenades1';
import { netrunnerStats } from './netrunner.js';
import { netIntegrityWeapons } from './netrunner-german.js';
import { ownedWeaponOptions } from './weapon-options.js?v=session6';
import { validateCharacter } from './model.js?v=session6';
import { evaluateCharacter } from './rules.js?v=session6';
import { ROLE_ABILITIES, roleAbilityExamples } from './role-abilities.js?v=session6';
import { ROLE_POOLS, PHARMACEUTICALS } from './role-points.js?v=session6';

export function characterSheetReadiness(character, rules, state = {}) {
  try {
    const safe = validateCharacter(character, rules);
    const evaluated = evaluateCharacter(safe, rules);
    const errors = evaluated.errors.filter(error=>!safe.campaign.active||!evaluated.cyberware.warnings.includes(error));
    const missing = evaluated.lifepath.entries.filter(entry => !entry.answer);
    if (missing.length) errors.push(`Beantworte für das Charactersheet noch ${missing.length} Lebensweg-Frage${missing.length === 1 ? '' : 'n'}.`);
    if (state.cyberDraft?.length) errors.push('Installiere oder leere zuerst die offene Cyberware-Auswahl.');
    if (state.removingCyberware) errors.push('Schließe zuerst den offenen Cyberware-Ausbau ab oder brich ihn ab.');
    if (state.customEquipmentDraft && (state.customEquipmentDraft.id || state.customEquipmentDraft.name?.trim() || state.customEquipmentDraft.notes?.trim() || state.customEquipmentDraft.cost?.trim() || state.customEquipmentDraft.quantity && state.customEquipmentDraft.quantity !== '1')) errors.push('Speichere oder verwerfe zuerst den eigenen Ausrüstungsentwurf.');
    return { ready: errors.length === 0, errors: [...new Set(errors)], character: safe, evaluated };
  } catch (error) { return { ready: false, errors: [error.message] }; }
}

export function characterSheetFilename(name) {
  const safe = name.normalize('NFC').replace(/[<>:"/\\|?*\u0000-\u001f]/g,'').replace(/[. ]+$/g,'').trim().slice(0,60) || 'Charakter';
  return `RED-${safe}-Charactersheet.pdf`;
}

export function characterSheetData(character, rules, state = {}) {
  const check = characterSheetReadiness(character, rules, state);
  if (!check.ready) throw new Error(check.errors.join(' '));
  const c = check.character, v = check.evaluated;
  const inventory = c.equipment.items.map(entry => {
    const raw=rules.equipmentRules.items.find(item=>item.id===entry.catalogId);
    const definition=raw.kind==='weapon'?weaponConfiguration(c,raw):raw;
    return {...entry,definition:definition.netrunner?{...definition,description:netrunnerStats(definition)+'. '+definition.description}:definition};
  });
  const ability = ROLE_ABILITIES[c.role];
  const roleDetails = (ROLE_POOLS[c.role]?.fields ?? []).filter(([id])=>c.rolePoints[c.role][id]>0).map(([id,label,cost]) => `${label}: ${c.rolePoints[c.role][id]} (${c.rolePoints[c.role][id] * cost} Punkte)`);
  if (c.role === 'medtech') roleDetails.push('Bekannte Pharmazeutika: ' + c.rolePoints.pharmaceuticals.map(id => PHARMACEUTICALS.find(([key]) => key === id)[1]).join(', '));
  return {
    campaign:c.campaign.active?c.campaign:null, health:v.health, name:c.name, roleId:c.role, role:rules.roles.find(role => role.id === c.role).name, ability:ability.name, rank:v.roleAbilities.rank, portrait:c.portrait,
    attributes:v.attributes, skills:v.skills.map(skill => ({...skill, specialty:c.skills.specialties.find(item => item.id === skill.id)?.skill ?? null, specialtyName:c.skills.specialties.find(item => item.id === skill.id)?.name ?? null})),
    derived:Object.fromEntries(v.derived.map(item => [item.id,item.value])), attackBonus:v.roleAbilities.bonuses.attack??0, humanity:v.cyberware, armor:v.armor, funds:v.funds,
    hometown:c.skills.hometown, nativeLanguage:c.skills.nativeLanguage.name, lifepath:v.lifepath.entries, roleDetails,
    roleState:v.roleAbilities.state, roleBonuses:v.roleAbilities.bonuses,
    weapons:[...installedCyberWeapons(c,rules,v).map(e=>({quantity:e.quantity,definition:e.item})),...inventory.filter(item => ['weapon','grenade'].includes(item.definition.kind)),...secondaryWeapons(c,rules).map(e=>({quantity:e.quantity,definition:e.item}))],
    weaponAttachments:inventory.filter(e=>attachmentList(c,e.catalogId).length).map(e=>({weapon:e.definition,quantity:e.quantity,attachments:attachmentList(c,e.catalogId)})),
    grenades:inventory.filter(e=>e.definition.kind==='grenade'), ammo:inventory.filter(item => item.definition.kind === 'ammo'),
    netWeapons:netIntegrityWeapons(inventory,c.role,v.roleAbilities.rank), netPrograms:inventory.filter(item=>item.definition.netrunner?.group==='programs'),
    equipment:inventory.filter(item => !['weapon','ammo','grenade'].includes(item.definition.kind)), custom:c.equipment.custom, cyberware:v.cyberware.entries,
    attackOptions:ownedWeaponOptions(c,rules,v), roleDescription:ability.description, roleExamples:roleAbilityExamples(c,v), filename:characterSheetFilename(c.name)
  };
}
