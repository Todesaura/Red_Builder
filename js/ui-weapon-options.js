import { escapeHtml as e } from './html.js';
import { weaponOptionLabels,weaponOptions,ownedWeaponOptions,WEAPON_OPTIONS_SOURCE } from './weapon-options.js?v=session6';
export function renderWeaponOptionCard(item,evaluated) {
  const labels=weaponOptionLabels(item);
  if(!labels.length)return '';
  return `<div class="weapon-option-tags">${labels.map(label=>`<span>${e(label)}</span>`).join('')}</div><details class="weapon-option-help"><summary>Angriffsoptionen erklären</summary>${renderOptions(weaponOptions(item,evaluated))}</details>`;
}
function renderOptions(options) {
  return `<dl>${options.map(option=>`<div><dt>${e(option.name)}</dt><dd>${e(option.description)}</dd></div>`).join('')}</dl>`;
}
export function renderOwnedWeaponOptions(character,rules,evaluated) {
  const weapons=ownedWeaponOptions(character,rules,evaluated);
  if(!weapons.length)return '';
  return `<section class="owned-weapon-options" aria-label="Angriffsoptionen deiner Waffen"><h3>Deine Waffen · Angriffsoptionen</h3><p>Für deine gekauften und implantierten Waffen. Die Basiswerte enthalten aktuelle Attribute, Fertigkeiten und passende feste Boni. Munition im Magazin und Verbrauch werden während des Spiels geführt.</p>${weapons.map(({item,quantity,options})=>`<details class="owned-weapon-option"><summary>${quantity} × ${e(item.name)}</summary>${renderOptions(options)}</details>`).join('')}<small>Grundregelwerk S. 170–174 · <a href="${WEAPON_OPTIONS_SOURCE}" target="_blank" rel="noopener noreferrer">Regelklärungen ↗</a></small></section>`;
}
