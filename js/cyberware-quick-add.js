import { addToCyberwareDraft, draftCharacter } from './cyberware-draft.js?v=budget2';

const BASES = {eye:'cybereye',audio:'cyberaudio-suite',neural:'neural-link',arm:'cyberarm',leg:'cyberleg'};
export function cyberwareQuickOffer(character,rules,additions,id,preferred=null){
  const actual=quickAddCyberware(character,rules,additions,id,preferred);
  if(actual.ok)return actual;
  const previewRules={...rules,equipmentRules:{...rules.equipmentRules,startingCash:1000000000}};
  const preview=quickAddCyberware(character,previewRules,additions,id,preferred);
  return preview.ok?{...preview,ok:false,error:actual.error}:actual;
}
// Build a complete candidate on copies. Failed bundles never leak a base into the draft.
export function quickAddCyberware(character,rules,additions,id,preferred=null) {
  const definitions=rules.cyberwareRules.items;
  const item=definitions.find(d=>d.id===id);
  if(!item)return {ok:false,error:'Unbekannte Cyberware.'};
  if(preferred&&!item.installationSlots.includes(preferred))return {ok:false,error:'Dieser Einbauort ist nicht zulässig.'};
  const locations=preferred?[preferred]:item.installationSlots;
  // Use an existing compatible base before purchasing another one.
  for(const location of locations){
    const result=addToCyberwareDraft(character,rules,additions,id,location);
    if(result.ok)return describe(result,location);
  }
  let lastError='Keine passende Installation möglich.';
  for(const location of locations){
    let next=structuredClone(additions);
    const visiting=new Set();
    const add=(catalogId,zone)=>{
      if(visiting.has(catalogId))return {ok:false,error:'Zirkuläre Implantat-Voraussetzung.'};
      visiting.add(catalogId);
      const d=definitions.find(d=>d.id===catalogId);
      if(!d)return {ok:false,error:'Basisimplantat nicht gefunden.'};
      for(const required of d.requirements?.requires??[]){
        if(!draftCharacter(character,next).cyberware.items.some(e=>e.catalogId===required)){
          const base=definitions.find(b=>b.id===required);
          const result=add(required,base?.installationSlots.includes(zone)?zone:base?.installationSlots[0]);
          if(!result.ok)return result;
        }
      }
      const type=d.requirements?.parentType;
      if(type&&!d.requirements.allowNatural&&!draftCharacter(character,next).cyberware.items.some(e=>e.location===zone&&definitions.find(b=>b.id===e.catalogId)?.foundation===type)){
        const result=add(BASES[type],zone);if(!result.ok)return result;
      }
      const result=addToCyberwareDraft(character,rules,next,catalogId,zone);
      if(result.ok)next=result.additions;
      visiting.delete(catalogId);return result;
    };
    const result=add(id,location);
    if(result.ok)return describe({ok:true,additions:next},location);
    lastError=result.error;
  }
  return {ok:false,error:lastError};
  function describe(result,location){
    const added=result.additions.slice(additions.length);
    const bases=added.filter(e=>e.catalogId!==id).map(e=>definitions.find(d=>d.id===e.catalogId));
    return {...result,location,bases,cost:added.reduce((sum,e)=>sum+definitions.find(d=>d.id===e.catalogId).cost,0)};
  }
}
