import { validateCustomEquipment, customEquipmentCost, MAX_CUSTOM_ITEMS } from './custom-equipment.js';
import { ATTACHMENTS,validateAttachments,weaponConfiguration,attachmentList } from './weapon-attachments.js?v=shopping1';
import {evaluateLoadout,isGrenade,LOADOUT_LIMITS} from './loadout-limits.js?v=shopping1';
export const createEquipment = () => ({ items: [], custom: [], attachments: [], armor: { head: null, body: null } });
export function validateEquipment(input, rules) {
  if (!input || !Array.isArray(input.items) || input.items.length > 100) throw new Error('Die Ausrüstung ist ungültig.');
  const seen = new Set();
  const equipment = { items: input.items.map(item => {
    if (!item || seen.has(item.catalogId) || !rules.equipmentRules?.items.some(definition => definition.id === item.catalogId) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) throw new Error('Ein Ausrüstungsgegenstand ist ungültig.');
    seen.add(item.catalogId);
    return { catalogId: item.catalogId, quantity: item.quantity };
  }), armor: { head: null, body: null } };
  for (const slot of ['head', 'body']) {
    const id = input.armor?.[slot] ?? null;
    if (id !== null && (!equipment.items.some(item => item.catalogId === id) || !rules.equipmentRules?.items.some(item => item.id === id && item.category === 'armor' && item.slot === slot))) throw new Error('Die angelegte Rüstung ist ungültig.');
    equipment.armor[slot] = id;
  }
  equipment.custom = validateCustomEquipment(input.custom);
  equipment.attachments = validateAttachments(input.attachments,equipment.items,rules);
  return equipment;
}

export function evaluateFunds(character, rules) {
  const starting = rules.equipmentRules?.startingCash ?? 2550;
  const allowance = rules.equipmentRules?.fashionAllowance ?? 800;
  const implants = [...(character.cyberware?.items ?? []), ...(character.cyberware?.removed ?? [])].map(item => rules.cyberwareRules?.items.find(definition => definition.id === item.catalogId)).filter(Boolean);
  const removalCost = (character.cyberware?.removed ?? []).reduce((sum, item) => sum + item.fee, 0);
  const clothingCost=(character.equipment?.items??[]).reduce((sum,entry)=>{const item=rules.equipmentRules?.items.find(i=>i.id===entry.catalogId);return sum+(item?.funding==='fashion'?item.cost*entry.quantity:0);},0);
  const fashionCost = clothingCost + implants.filter(item => item.funding === 'fashion').reduce((sum, item) => sum + item.cost, 0);
  const cyberCost = implants.filter(item => item.funding !== 'fashion').reduce((sum, item) => sum + item.cost, 0);
  const customCost = customEquipmentCost(character);
  const attachmentCost=(character.equipment?.attachments??[]).reduce((sum,e)=>sum+(ATTACHMENTS.find(a=>a.id===e.attachmentId)?.cost??0)*(character.equipment.items.find(i=>i.catalogId===e.weaponId)?.quantity??0),0);
  const equipmentCost = customCost + attachmentCost + (character.equipment?.items ?? []).reduce((sum, item) => sum + (rules.equipmentRules?.items.find(definition => definition.id === item.catalogId)?.cost ?? 0) * item.quantity, 0);
  const fashionUsed = Math.min(allowance, fashionCost);
  const spent = cyberCost + equipmentCost - clothingCost + Math.max(0, fashionCost - allowance) + removalCost;
  const remaining = starting - spent + (character.campaign?.cashAdjustment??0);
  return { campaign:character.campaign?.active??false, starting, allowance, cyberCost, fashionCost, clothingCost, equipmentCost, fashionUsed, fashionRemaining: allowance - fashionUsed, customCost, removalCost, spent, remaining,
    errors: remaining < 0 ? [`Dein ${character.campaign?.active?'Guthaben':'Startkapital'} ist um ${-remaining} eb überschritten. Entferne Cyberware oder Ausrüstung.`] : [] };
}

export function buyEquipment(character, rules, catalogId) {
  if (!rules.equipmentRules?.items.some(item => item.id === catalogId)) return { ok: false, error: 'Unbekannte Ausrüstung.' };
  const items = character.equipment.items.map(item => ({ ...item }));
  const existing = items.find(item => item.catalogId === catalogId);
  if(existing&&rules.equipmentRules.items.find(item=>item.id===catalogId)?.category==='clothing')return {ok:false,error:'Dieses Kleidungsstück ist bereits in deinem Kleiderschrank. Jedes Teil kann nur einmal gekauft werden.'};
  if (existing?.quantity >= 99) return { ok: false, error: 'Du kannst höchstens 99 Stück mitnehmen.' };
  if (existing) existing.quantity++; else items.push({ catalogId, quantity: 1 });
  const candidate={ ...character, equipment: { ...character.equipment, items } };
  const errors = [...evaluateLoadout(candidate,rules).errors,...evaluateFunds(candidate, rules).errors];
  if (errors.length) return { ok: false, error: errors.join(' ') };
  character.equipment.items = items;
  return { ok: true };
}

// A used dose leaves the inventory without undoing its purchase or changing stats.
export function useStreetDrug(character,rules,catalogId) {
  const definition=rules.equipmentRules.items.find(item=>item.id===catalogId&&item.kind==='drug');
  const owned=character.equipment.items.find(item=>item.catalogId===catalogId);
  if(!definition||!owned)return {ok:false,error:'Diese Straßendroge befindet sich nicht im Inventar.'};
  removeEquipment(character,catalogId);
  character.campaign.cashAdjustment-=definition.cost;
  return {ok:true};
}

// Two magazine fills, rounded up to complete packs; bows receive 20 arrows.
export function weaponAmmoBundle(rules, catalogId, character = null) {
  const definition = rules.equipmentRules?.items.find(item => item.id === catalogId && item.kind === 'weapon');
  const weapon = character && definition ? weaponConfiguration(character,definition) : definition;
  const ammo = rules.equipmentRules?.items.find(item => item.id === weapon?.ammoIds?.[0] && item.kind === 'ammo');
  if (!weapon || !ammo) return null;
  let quantity = Math.ceil((weapon.magazine ? weapon.magazine * 2 : 20) / ammo.units);
  if(isGrenade(ammo)){
    const remaining=LOADOUT_LIMITS.grenades-(character?evaluateLoadout(character,rules).counts.grenades:0);
    quantity=Math.min(quantity,Math.floor(remaining/ammo.units));
    if(quantity<1)return null;
  }
  const fittings=character?attachmentList(character,catalogId).reduce((sum,a)=>sum+a.cost,0):0;
  return { weapon, ammo, quantity, units: quantity * ammo.units, cost: weapon.cost + fittings + ammo.cost * quantity };
}

export function buyWeaponWithAmmo(character, rules, catalogId) {
  const bundle = weaponAmmoBundle(rules, catalogId, character);
  if (!bundle) return { ok: false, error: 'Für diese Waffe ist keine passende Munition hinterlegt.' };
  const candidate = { ...character, equipment: { ...character.equipment, items: character.equipment.items.map(item => ({ ...item })) } };
  const weaponResult = buyEquipment(candidate, rules, catalogId);
  if (!weaponResult.ok) return weaponResult;
  for (let index = 0; index < bundle.quantity; index++) {
    const result = buyEquipment(candidate, rules, bundle.ammo.id);
    if (!result.ok) return result;
  }
  character.equipment.items = candidate.equipment.items;
  return { ok: true };
}
export function removeEquipment(character, catalogId) {
  const entry = character.equipment.items.find(item => item.catalogId === catalogId);
  if (!entry) return;
  entry.quantity--;
  character.equipment.items = character.equipment.items.filter(item => item.quantity > 0);
  if(!character.equipment.items.some(item=>item.catalogId===catalogId)) character.equipment.attachments=(character.equipment.attachments??[]).filter(a=>a.weaponId!==catalogId);
  if (!character.equipment.items.some(item => item.catalogId === catalogId)) for (const slot of ['head', 'body']) if (character.equipment.armor?.[slot] === catalogId) character.equipment.armor[slot] = null;
}

export function addWeaponAttachment(character,rules,weaponId,attachmentId) {
  const attachments=[...(character.equipment.attachments??[]),{weaponId,attachmentId}];
  try {validateAttachments(attachments,character.equipment.items,rules);}catch(error){return {ok:false,error:error.message};}
  const candidate={...character,equipment:{...character.equipment,attachments}};
  const errors=[...evaluateLoadout(candidate,rules).errors,...evaluateFunds(candidate,rules).errors];
  if(errors.length)return {ok:false,error:errors.join(' ')};
  character.equipment.attachments=attachments;return {ok:true};
}
export function removeWeaponAttachment(character,rules,weaponId,attachmentId) {
  const attachments=(character.equipment.attachments??[]).filter(a=>a.weaponId!==weaponId||a.attachmentId!==attachmentId);
  const candidate={...character,equipment:{...character.equipment,attachments}};
  const errors=evaluateLoadout(candidate,rules).errors;
  if(errors.length)return {ok:false,error:errors.join(' ')};
  character.equipment.attachments=attachments;return {ok:true};
}

export function saveCustomEquipment(character, rules, input, id = null) {
  const custom = character.equipment.custom;
  if (id !== null && !custom.some(item => item.id === id)) return {ok:false,error:'Dieser eigene Gegenstand wurde nicht gefunden.'};
  if (id === null && custom.length >= MAX_CUSTOM_ITEMS) return {ok:false,error:'Höchstens 40 eigene Gegenstände sind möglich.'};
  let number = 1;
  while (custom.some(item => item.id === 'custom-' + number)) number++;
  const item = { ...input, id: id ?? 'custom-' + number };
  let next;
  try { next = validateCustomEquipment(id === null ? [...custom,item] : custom.map(entry=>entry.id===id?item:entry)); }
  catch(error) { return {ok:false,error:error.message}; }
  const errors = evaluateFunds({...character,equipment:{...character.equipment,custom:next}},rules).errors;
  if(errors.length) return {ok:false,error:errors.join(' ')};
  character.equipment.custom = next;
  return {ok:true};
}
