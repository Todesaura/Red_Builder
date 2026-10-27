import { recommendationPriority } from './equipment-recommendations.js';
import { installationErrors, installCyberware } from './cyberware.js?v=session6';
import { evaluateFunds } from './economy.js?v=session6';
import { evaluateCharacter } from './rules.js?v=session6';

export const baseStats = evaluated => Object.fromEntries(Object.entries(evaluated.attributes).map(([id,value])=>[id,value.base]));
export function cyberwareCandidate(character,rules,id,location) {
  const definition=rules.cyberwareRules.items.find(item=>item.id===id);
  const type=definition?.requirements?.parentType;
  const parent=type ? character.cyberware.items.find(item=>item.location===location && rules.cyberwareRules.items.find(base=>base.id===item.catalogId)?.foundation===type)?.id ?? null : null;
  return {id:'preview',catalogId:id,location,parent};
}
export function candidateErrors(character,rules,id,location,evaluated) {
  const next={...character.cyberware,items:[...character.cyberware.items,cyberwareCandidate(character,rules,id,location)]};
  return [...installationErrors(next,rules.cyberwareRules,baseStats(evaluated)),...evaluateFunds({...character,cyberware:next},rules).errors];
}
export function availableLocations(character,rules,item,evaluated) {
  return item.installationSlots.filter(location=>!candidateErrors(character,rules,item.id,location,evaluated).length);
}
export function catalogEntries(character,rules,state,evaluated) {
  const query=state.cyberSearch.trim().toLocaleLowerCase('de');
  const compare={foundation:(a,b)=>Number(Boolean(b.foundation))-Number(Boolean(a.foundation)) || a.name.localeCompare(b.name,'de'),name:(a,b)=>a.name.localeCompare(b.name,'de'),price:(a,b)=>a.cost-b.cost || a.name.localeCompare(b.name,'de'),humanity:(a,b)=>a.humanity-b.humanity || a.name.localeCompare(b.name,'de')};
  return rules.cyberwareRules.items.filter(item=>item.category===state.cyberCategory && `${item.name} ${(item.aliases??[]).join(" ")} ${item.description}`.toLocaleLowerCase('de').includes(query) && (!state.onlyInstallable || availableLocations(character,rules,item,evaluated).length)).sort((a,b)=>recommendationPriority(character.role,'cyberware')(a,b) || (compare[state.cyberSort]??compare.name)(a,b));
}
export function previewInstallation(character,rules,id,location) {
  const before=evaluateCharacter(character,rules);
  const item=rules.cyberwareRules.items.find(item=>item.id===id);
  if(!item) return {before,after:null,errors:['Unbekannte Cyberware.'],changes:[]};
  if(!location) {
    const errors=availableLocations(character,rules,item,before).length?[]:candidateErrors(character,rules,id,item.installationSlots[0],before);
    return {before,after:null,errors:[...errors,'Wähle einen Installationsbereich.'],changes:[]};
  }
  const errors=candidateErrors(character,rules,id,location,before);
  if(errors.length) return {before,after:null,errors,changes:[]};
  const copy=structuredClone(character), candidate=cyberwareCandidate(copy,rules,id,location);
  const result=installCyberware(copy,rules,id,location,candidate.parent,baseStats(before));
  if(!result.ok) return {before,after:null,errors:[result.error],changes:[]};
  const after=evaluateCharacter(copy,rules);
  const changes=Object.keys(before.attributes).filter(key=>before.attributes[key].effective!==after.attributes[key].effective).map(key=>({name:key,before:before.attributes[key].effective,after:after.attributes[key].effective}));
  for(const value of after.derived){const previous=before.derived.find(entry=>entry.id===value.id);if(previous && previous.value!==value.value && value.id!=='humanity') changes.push({name:value.name,before:previous.value,after:value.value});}
  for(const value of after.skills){const previous=before.skills.find(entry=>entry.id===value.id);if(previous && previous.base!==value.base) changes.push({name:value.name,before:previous.base,after:value.base});}
  for (const [key,name] of [['headSP','Kopfschutz (SP)'],['bodySP','Körperschutz (SP)']]) if (before.armor[key] !== after.armor[key]) changes.push({name,before:before.armor[key],after:after.armor[key]});
  return {before,after,errors:[],changes};
}
export function initialInstallationLocation(item) {
  return item.installationSlots.length===1 ? item.installationSlots[0] : null;
}
