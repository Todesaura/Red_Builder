import {escapeHtml as e} from './html.js';
import {equipmentWarnings} from './equipment-warnings.js?v=budget2';
export function renderEquipmentWarnings(character,rules,evaluated){
  const warnings=equipmentWarnings(character,rules,evaluated);
  if(!warnings.length)return '';
  const labels={weapons:'Waffen prüfen',armor:'Rüstung prüfen',netrunner:'Netrunner-Ausrüstung prüfen',cyberware:'Cyberware prüfen',misc:'Sonstiges prüfen'};
  return `<aside class="equipment-readiness-warnings" aria-labelledby="equipment-warnings-title"><h3 id="equipment-warnings-title">Ausstattung noch einmal prüfen</h3><p>Nur Hinweise: Du kannst den Charakter trotzdem abschließen und das PDF erzeugen. Prüfe, ob du diese Lücken bewusst lässt.</p><ul>${warnings.map(w=>`<li data-equipment-warning="${w.id}"><strong>${e(w.title)}</strong><p>${e(w.text)}</p><button class="text-button" data-warning-equipment="${w.tab}">${labels[w.tab]} →</button></li>`).join('')}</ul>${character.equipment.custom.length?'<small>Eigene Gegenstände werden nicht automatisch als Waffen, Rüstung oder vollständige Rollenausstattung erkannt. Prüfe ihre Eignung mit deiner Spielleitung.</small>':''}</aside>`;
}
