import { escapeHtml as e } from './html.js';
import { weaponOptions,ownedWeaponOptions,WEAPON_OPTIONS_SOURCE } from './weapon-options.js?v=shopping1';
export function renderWeaponOptionCard(item,evaluated,secondary=[],quantity=null,openSections=[]) {
  const options=weaponOptions(item,evaluated).filter(option=>!option.id.startsWith('attachment-'));
  const skill=evaluated.skills.find(entry=>entry.id===item.skill);
  const base=(skill?.base??0)+(evaluated.roleAbilities?.bonuses.attack??0)+(item.combatBonus??item.smartBonus??0)+(item.qualityBonus??0);
  const normal=skill&&!options.some(option=>option.id==='explosive')?`<p><strong>Normaler Angriff:</strong> ${base} + 1W10 (${e(skill.name)}).</p>`:'';
  const id=`${quantity===null?'shop':'stock'}-weapon-${e(item.id)}`;
  const open=openSections.includes(id);
  return `<header class="shop-weapon-heading"><h3>${quantity===null?'':`${quantity} × `}${e(item.name)}</h3>
    <button type="button" class="secondary" data-weapon-explanation="${id}" aria-controls="${id}" aria-expanded="${open}" aria-label="Erklärungen zu ${e(item.name)}">Erklärungen</button></header>
    <div class="weapon-option-help shop-weapon-details" id="${id}" ${open?'':'hidden'}>${normal}${renderOptions(options)}${secondary.map(({item:child})=>`<h4>${e(child.shortName)}</h4>${renderOptions(weaponOptions(child,evaluated))}`).join('')}<small>${e(item.reference??'')}${item.houseRule?' · Handführung/Preis: Hausregel':''}</small></div>`;
}
function renderOptions(options) {
  return `<dl>${options.map(option=>`<div><dt>${e(option.name)}</dt><dd>${e(option.description)}</dd></div>`).join('')}</dl>`;
}
export function renderOwnedWeaponOptions(character,rules,evaluated) {
  const weapons=ownedWeaponOptions(character,rules,evaluated);
  if(!weapons.length)return '';
  return `<section class="owned-weapon-options" aria-label="Angriffsoptionen deiner Waffen"><h3>Deine Waffen · Angriffsoptionen</h3><p>Für deine gekauften und implantierten Waffen. Die Basiswerte enthalten aktuelle Attribute, Fertigkeiten und passende feste Boni. Munition im Magazin und Verbrauch werden während des Spiels geführt.</p>${weapons.map(({item,quantity,options})=>`<details class="owned-weapon-option"><summary>${quantity} × ${e(item.name)}</summary>${renderOptions(options)}</details>`).join('')}<small>Grundregelwerk S. 170–174 · <a href="${WEAPON_OPTIONS_SOURCE}" target="_blank" rel="noopener noreferrer">Regelklärungen ↗</a></small></section>`;
}
