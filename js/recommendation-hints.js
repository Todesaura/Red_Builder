import {isRecommended} from './equipment-recommendations.js';
import {escapeHtml as e} from './html.js';

const KEY='red-builder.ui.recommendations-seen.v1';
function scope(character,storage){return `${storage?.getItem('red-builder.character.activeArchive')||'draft'}:${character.role}`;}
export function unreadRecommendations(character,key,storage=globalThis.localStorage){
  try{return JSON.parse(storage?.getItem(KEY)??'{}')[scope(character,storage)]?.includes(key)!==true;}catch{return true;}
}
export function acknowledgeRecommendations(character,key,storage=globalThis.localStorage){
  try{
    const all=JSON.parse(storage?.getItem(KEY)??'{}'),id=scope(character,storage),seen=Array.isArray(all[id])?all[id]:[];
    all[id]=[...new Set([...seen,key])];storage?.setItem(KEY,JSON.stringify(all));
  }catch{/* Optional visual hints never block the character editor. */}
}
export function resetDraftRecommendationHints(storage=globalThis.localStorage){
  try{const all=JSON.parse(storage?.getItem(KEY)??'{}');for(const id of Object.keys(all))if(id.startsWith('draft:'))delete all[id];storage?.setItem(KEY,JSON.stringify(all));}catch{}
}
export function remainingRecommendations(character,rules,kind,category){
  const cyber=kind==='cyberware',catalog=cyber?rules.cyberwareRules.items:rules.equipmentRules.items;
  const owned=cyber?character.cyberware.items:character.equipment.items;
  return catalog.filter(item=>(!category||item.category===category)&&isRecommended(character.role,item.id,cyber?'cyberware':'equipment')&&!owned.some(entry=>entry.catalogId===item.id&&(cyber||entry.quantity>0))).length;
}
export function recommendationBadge(character,rules,key,kind,category){
  const count=remainingRecommendations(character,rules,kind,category);
  return count&&unreadRecommendations(character,key)?`<span class="recommendation-badge" title="Noch nicht ${kind==='cyberware'?'installiert':'gekauft'} · unverbindliche Empfehlungen" aria-label="${count} offene Empfehlung${count===1?'':'en'}">${e(String(count))} ${count===1?'Tipp':'Tipps'}</span>`:'';
}
