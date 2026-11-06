import {CRITICAL_INJURIES} from './critical-injuries.js';
import {magazineState,reserveRounds,reconcileMagazines} from './play-magazines.js?v=magazines1';
import {validateCharacter} from './model.js?v=group1';
import {evaluateCharacter} from './rules.js?v=group1';
import {evaluateFunds} from './economy.js?v=shopping1';

export function ammunitionRemaining(character,item) {
  return (character.equipment.items.find(entry=>entry.catalogId===item.id)?.quantity??0)*(item.units??1)-(character.campaign.ammoSpent[item.id]??0);
}

// Validate on a copy: rejected actions cannot partly change HP, stock or money.
export function applyPlayAction(character,rules,action) {
  try {
    const c=validateCharacter(character,rules),v=evaluateCharacter(c,rules);
    reconcileMagazines(c,rules);
    const amount=['reload','unload','critical'].includes(action.type)?1:action.amount;
    if(!Number.isSafeInteger(amount)||amount<1||amount>10000)throw Error('Gib eine ganze Zahl zwischen 1 und 10.000 ein.');
    if(['reload','unload','fire'].includes(action.type)) {
      const magazines=magazineState(c,rules),mag=magazines.find(m=>m.key===action.weapon);
      if(!mag)throw Error('Diese Waffe ist nicht vorhanden.');
      if(action.type==='unload')delete c.campaign.magazines[mag.key];
      else if(action.type==='reload') {
        const ammoId=action.ammoId;
        if(!mag.item.ammoIds.includes(ammoId))throw Error('Diese Munition passt nicht zur Waffe.');
        const retained=mag.ammoId===ammoId?mag.rounds:0;
        const rounds=Math.min(mag.capacity,retained+reserveRounds(c,rules,ammoId,magazines));
        if(rounds===retained&&mag.ammoId===ammoId||rounds===0)throw Error('Kein Nachladen möglich: Magazin voll oder Reserve leer.');
        c.campaign.magazines[mag.key]={ammoId,rounds};
      } else {
        let required=1;
        if(action.mode!=='single') {
          const option=mag.options.find(o=>o.id===action.mode&&Number.isInteger(o.rounds));
          if(!option||!['autofire','suppressive','compensated'].includes(action.mode))throw Error('Diesen Feuermodus unterstützt die Waffe nicht.');
          required=option.rounds;
        }
        if(action.amount!==required)throw Error('Ungültiger Munitionsverbrauch für diesen Feuermodus.');
        if(mag.rounds<required)throw Error(`Nur ${mag.rounds} Schuss geladen. Erst nachladen.`);
        const consumed=applyPlayAction(c,rules,{type:'ammo',id:mag.ammoId,amount:required,fromMagazine:mag.key});
        if(!consumed.ok)throw Error(consumed.error);
        Object.assign(c,consumed.character);
        c.campaign.magazines[mag.key]={ammoId:mag.ammoId,rounds:mag.rounds-required};
      }
    } else if(action.type==='critical') {
      const injury=CRITICAL_INJURIES[action.slot]?.find(([id])=>id===action.injury);
      if(!injury||typeof action.addBonus!=='boolean'||typeof action.notes!=='string'||action.notes.length>800)throw Error('Wähle eine gültige Verletzung und höchstens 800 Zeichen Notizen.');
      const immunity=v.cyberware.effects.find(effect=>effect.type==='injury-immunity'&&effect.target===action.injury);
      if(immunity)throw Error(`${immunity.label} verhindert diese Verletzung und ihren Zusatzschaden. Trage den normalen Waffenschaden separat ein.`);
      if(c.campaign.injuries.length>=60)throw Error('Zu viele Verletzungseinträge.');
      c.campaign.injuries.push({id:'injury-'+crypto.randomUUID(),name:(action.slot==='head'?'Kopf: ':'Körper: ')+injury[1],status:'active',notes:action.notes.trim()});
      if(action.addBonus){c.campaign.hp=Math.max(-10000,v.health.current-5);c.campaign.stabilized=false;}
    } else if(action.type==='damage') {
      c.campaign.hp=Math.max(-10000,v.health.current-amount);
      c.campaign.stabilized=false;
    } else if(action.type==='armor') {
      if(!['head','body'].includes(action.slot)||![1,2].includes(amount))throw Error('Unbekannter Rüstungsschaden.');
      if(action.implant) {
        if(!v.armor.cyberSP)throw Error('Kein implantierter Schutz vorhanden.');
        const losses=c.campaign.cyberArmorLoss;
        losses[action.slot]=Math.min(v.armor.cyberSP,losses[action.slot]+amount);
      } else {
        const worn=v.armor[action.slot];
        if(!worn)throw Error('Hier ist keine Rüstung angelegt.');
        const base=rules.equipmentRules.items.find(item=>item.id===worn.id);
        c.campaign.armorLoss[worn.id]=Math.min(base.sp,(c.campaign.armorLoss[worn.id]??0)+amount);
      }
    } else if(action.type==='ammo') {
      const item=rules.equipmentRules.items.find(item=>item.id===action.id&&item.kind==='ammo');
      if(!item)throw Error('Unbekannte Munition.');
      if(action.fromMagazine&&!magazineState(c,rules).some(m=>m.key===action.fromMagazine&&m.ammoId===item.id&&m.rounds>=amount))throw Error('Ungültiges Magazin.');
      const available=action.fromMagazine?ammunitionRemaining(c,item):reserveRounds(c,rules,item.id);
      if(amount>available)throw Error(`Nur ${available} Schuss / Einheiten verfügbar.`);
      const money=evaluateFunds(c,rules).remaining;
      const remain=available-amount,units=item.units??1,quantity=Math.ceil(remain/units);
      c.equipment.items=c.equipment.items.filter(entry=>entry.catalogId!==item.id);
      if(quantity){c.equipment.items.push({catalogId:item.id,quantity});c.campaign.ammoSpent[item.id]=quantity*units-remain;}
      else delete c.campaign.ammoSpent[item.id];
      // Consumption must never refund the price of a depleted pack.
      c.campaign.cashAdjustment+=money-evaluateFunds(c,rules).remaining;
    } else throw Error('Unbekannter Spielvorgang.');
    return {ok:true,character:validateCharacter(c,rules)};
  } catch(error) {return {ok:false,error:error.message};}
}
