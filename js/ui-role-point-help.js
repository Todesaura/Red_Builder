import {ROLE_ABILITIES,roleAbilityExamples} from './role-abilities.js?v=shopping1';
import {localizeAttributeText} from './attribute-labels.js';
import {escapeHtml as e} from './html.js';

export function renderRolePointHelp(character,evaluated,id,label){
  const ability=ROLE_ABILITIES[character.role],feature=ability?.features.find(([name])=>name.startsWith(label));
  if(!feature)return '';
  const current=evaluated.roleAbilities,value=current.state[character.role][id],bonuses=current.bonuses;
  let example='';
  if(character.role==='medtech')example=roleAbilityExamples(character,evaluated)[id==='surgery'?0:1];
  else if(character.role==='tech'){
    const skill=evaluated.skills.find(s=>s.id==='basic-tech');
    if(id==='field')example=[roleAbilityExamples(character,evaluated)[0],roleAbilityExamples(character,evaluated)[2]].join(' ');
    else example=value?`Beispiel mit Grundlegender Technik: ${skill.base-current.state.tech.field+value} + 1W10. Nur ${label} ${value}, kein zusätzlicher Feldexpertise-Bonus; andere Aufgaben verwenden die passende Technikfertigkeit.`:'Noch nicht erlernt.';
  }else if(character.role==='solo')example={
    deflection:`Aktuell: −${bonuses.damageDeflection??0} Schaden beim ersten erlittenen Schaden pro Runde.`,
    fumble:`Aktuell: ${bonuses.fumbleRecovery?'aktiv':'nicht aktiv'}.`,
    initiative:`Aktuell: +${bonuses.initiative??0} Initiative, bereits in deiner Initiative ${evaluated.derived.find(d=>d.id==='initiative')?.value??'—'} enthalten.`,
    precision:`Aktuell: +${bonuses.attack??0} auf Angriffswürfe.`,
    weakness:`Aktuell: +${bonuses.firstDamage??0} Schaden beim ersten erfolgreichen Angriff pro Runde.`,
    threat:`Aktuell: +${value} auf Wahrnehmung, bereits in der Fertigkeitsbasis enthalten.`
  }[id];
  return `<details id="role-point-help-${id}" class="role-point-help"><summary>Regeln zu ${e(label)}</summary><p>${e(localizeAttributeText(feature[1]))}</p>${example?`<p class="role-point-example">${e(localizeAttributeText(example))}</p>`:''}<small>${e(ability.reference)}</small></details>`;
}
