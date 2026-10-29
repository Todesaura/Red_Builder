import {weaponConfiguration} from './weapon-attachments.js?v=shopping1';

export const LOADOUT_LIMITS=Object.freeze({grenades:3,oneHanded:3,twoHanded:1});
export const isGrenade=item=>item?.kind==='grenade'||item?.id==='ammo-grenade';

// Integrated barrels, NET programs, ammunition and installed cyberware are not extra carried weapons.
export function evaluateLoadout(character,rules) {
  const counts={grenades:0,oneHanded:0,twoHanded:0};
  for(const entry of character.equipment.items){
    const item=rules.equipmentRules.items.find(i=>i.id===entry.catalogId);
    if(isGrenade(item))counts.grenades+=entry.quantity*(item.units??1);
    else if(item?.kind==='weapon')counts[weaponConfiguration(character,item).hands===1?'oneHanded':'twoHanded']+=entry.quantity;
  }
  const limits={...LOADOUT_LIMITS,oneHanded:counts.twoHanded?2:3};
  const labels={grenades:'Granaten',oneHanded:'Einhandwaffen',twoHanded:'Zweihandwaffen'};
  const errors=Object.entries(limits).filter(([key,max])=>counts[key]>max).map(([key,max])=>`${labels[key]}: ${counts[key]} von höchstens ${max}. Entferne ${counts[key]-max} aus deinem Inventar.`);
  return {counts,limits,errors};
}

export function purchaseLoadoutError(character,rules,catalogId) {
  const items=character.equipment.items.map(i=>({...i})),existing=items.find(i=>i.catalogId===catalogId);
  if(existing)existing.quantity++;else items.push({catalogId,quantity:1});
  return evaluateLoadout({...character,equipment:{...character.equipment,items}},rules).errors.join(' ');
}

export function attachmentLoadoutError(character,rules,weaponId,attachmentId,remove=false) {
  const current=character.equipment.attachments??[];
  const attachments=remove?current.filter(a=>a.weaponId!==weaponId||a.attachmentId!==attachmentId):[...current,{weaponId,attachmentId}];
  return evaluateLoadout({...character,equipment:{...character.equipment,attachments}},rules).errors.join(' ');
}
