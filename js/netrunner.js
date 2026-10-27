import {germanNetText} from './netrunner-german.js';
export const NETRUNNER_GROUPS = {decks:'Cyberdecks & Netzsicht',programs:'Programme',hardware:'Deck-Erweiterungen',ice:'Autonome Schutzprogramme'};
export function netrunnerStats(item){
  const n=item.netrunner;if(!n)return '';
  if(n.capacity)return `${n.capacity} gemeinsame Optionsplätze`;
  const parts=[];
  if(n.className)parts.push(n.className);
  if(n.slots)parts.push(`${n.slots} ${n.slots===1?'Optionsplatz':'Optionsplätze'}`);
  if(n.per!==undefined)parts.push(`PER ${n.per}`,`SPEED ${n.speed}`);
  if(n.atk!==undefined)parts.push(`ATK ${n.atk}`,`DEF ${n.defense}`,`REZ ${n.rez}`);
  return germanNetText(parts.join(' · '));
}
export function netrunnerInventory(character,rules){
  const items=character.equipment.items.map(e=>({...e,definition:rules.equipmentRules.items.find(d=>d.id===e.catalogId)})).filter(e=>e.definition.netrunner);
  return {items,slots:items.reduce((sum,e)=>sum+(e.definition.netrunner.slots??0)*e.quantity,0),decks:items.filter(e=>e.definition.netrunner.capacity)};
}
