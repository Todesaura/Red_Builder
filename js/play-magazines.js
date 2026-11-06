import {ownedWeaponOptions} from './weapon-options.js?v=shopping1';
import {evaluateCharacter} from './rules.js?v=group1';

export function ammunitionTotal(character,item) {
  return (character.equipment.items.find(entry=>entry.catalogId===item.id)?.quantity??0)*(item.units??1)-(character.campaign.ammoSpent[item.id]??0);
}

export function magazineState(character,rules) {
  const available=new Map(rules.equipmentRules.items.filter(i=>i.kind==='ammo').map(i=>[i.id,ammunitionTotal(character,i)]));
  const result=[];
  for(const {item,quantity,options} of ownedWeaponOptions(character,rules,evaluateCharacter(character,rules))) {
    if(!Number.isInteger(item.magazine)||item.magazine<=0||!item.ammoIds?.length)continue;
    for(let index=0;index<quantity;index++) {
      const key=`${item.id}#${index+1}`,saved=character.campaign.magazines?.[key];
      const ammoId=saved&&item.ammoIds.includes(saved.ammoId)?saved.ammoId:null;
      const rounds=ammoId?Math.min(saved.rounds,item.magazine,available.get(ammoId)??0):0;
      if(ammoId)available.set(ammoId,(available.get(ammoId)??0)-rounds);
      result.push({key,item,index:index+1,quantity,options,ammoId,rounds,capacity:item.magazine});
    }
  }
  return result;
}

export function reserveRounds(character,rules,ammoId,magazines=magazineState(character,rules)) {
  const item=rules.equipmentRules.items.find(i=>i.id===ammoId&&i.kind==='ammo');
  return item?Math.max(0,ammunitionTotal(character,item)-magazines.filter(m=>m.ammoId===ammoId).reduce((sum,m)=>sum+m.rounds,0)):0;
}

export function reconcileMagazines(character,rules) {
  character.campaign.magazines=Object.fromEntries(magazineState(character,rules).filter(m=>m.ammoId).map(m=>[m.key,{ammoId:m.ammoId,rounds:m.rounds}]));
}
