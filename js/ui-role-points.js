import {renderRolePointHelp} from './ui-role-point-help.js?v=inline1';
import { escapeHtml as e } from './html.js';
import { ROLE_POOLS, PHARMACEUTICALS, evaluateRolePoints } from './role-points.js?v=shopping1';

export function renderRolePoints(character, evaluated) {
  const current = evaluated.roleAbilities ?? evaluateRolePoints(character);
  const pool = current.pool;
  if (!pool) return '<section class="panel"><h2>Dein Rollenrang steht fest</h2><p>Diese Rolle verwendet den aktuellen Rollenrang direkt. Es gibt hier keine Punkte auf Unterfähigkeiten zu verteilen.</p></section>';
  const fields = current.state[character.role];
  return `<section id="role-points" tabindex="-1" class="panel role-point-editor" aria-label="Rollenpunkte verteilen"><div class="section-heading"><div><h2>Deine ${pool.label}</h2><p>${character.role === 'tech' ? `${current.rank*2} Fachränge verteilen, höchstens ${current.rank} je Fachgebiet; je Rangschritt zwei verschiedene Fachgebiete.` : character.role === 'solo' ? 'Jeder Effekt hat eigene Punktkosten. Du kannst die Verteilung vor dem Initiativewurf oder außerhalb des Kampfes ändern; im Kampf kostet Umverteilen eine Aktion.' : `${current.rank} Punkte auf Chirurgie, Pharmazeutik und Kryotechnik verteilen.`}</p></div><strong class="role-points-remaining" role="status">${current.remaining} von ${pool.budget} übrig</strong></div>${pool.fields.map(([id, label, cost]) => {
    const value = fields[id];
    const max = character.role === 'tech' ? current.rank : Math.min(character.role==='medtech'?5:10,Math.floor(pool.budget / cost));
    return `<div class="role-point-row"><div><label for="role-point-${id}">${e(label)}</label><small>${cost === 1 ? '1 Punkt pro Rang' : cost + ' Punkte pro Effektstufe'} · aktuell ${value * cost} Punkte</small>${renderRolePointHelp(character,evaluated,id,label)}</div><div class="stepper"><button id="role-minus-${id}" data-role-point="${id}" data-role-delta="-1" aria-label="${e(label)} verringern" ${value === 0 ? 'disabled' : ''}>−</button><output id="role-point-${id}" tabindex="-1" aria-label="${e(label)}: aktueller Rang">${value}</output><button id="role-plus-${id}" data-role-point="${id}" data-role-delta="1" aria-label="${e(label)} erhöhen" ${value >= max || current.remaining < cost ? 'disabled' : ''}>+</button></div></div>`;
  }).join('')}${character.role === 'medtech' ? `<fieldset id="role-pharmaceuticals" tabindex="-1" class="role-pharmaceuticals"><legend>Freigeschaltete Pharmazeutika · ${current.state.pharmaceuticals.length} von ${fields.pharma} gewählt</legend><p>Pro Punkt Pharmazeutik wählst du ein Präparat, dessen Herstellung du beherrschst. Die Auswahl legt noch keine Dosen ins Inventar.</p>${PHARMACEUTICALS.map(([id, name, hint]) => `<label><input type="checkbox" data-pharmaceutical="${id}" ${current.state.pharmaceuticals.includes(id) ? 'checked' : ''} ${!current.state.pharmaceuticals.includes(id) && current.state.pharmaceuticals.length >= fields.pharma ? 'disabled' : ''}><span><strong>${name}</strong><small>${e(hint)}</small></span></label>`).join('')}</fieldset>` : ''}${current.errors.length ? `<ul class="role-point-errors">${current.errors.map(text=>`<li>${e(text)}</li>`).join('')}</ul>` : '<p class="role-points-valid">✓ Deine Rollenpunkte sind vollständig verteilt.</p>'}<p class="inline-note">Beim Rollenwechsel bleiben deine Verteilungen erhalten. Nur die gewählte Rolle wirkt; du erhältst keine Fähigkeiten anderer Rollen.</p></section>`;
}

export function rolePointsSummary(character) {
  const current = evaluateRolePoints(character);
  if (!current.pool) return '';
  return `<ul>${current.pool.fields.map(([id, label]) => `<li>${e(label)}: ${current.state[character.role][id]}</li>`).join('')}${character.role === 'medtech' ? current.state.pharmaceuticals.map(id=>`<li>Pharmazeutikum: ${e(PHARMACEUTICALS.find(([known])=>known===id)?.[1] ?? id)}</li>`).join('') : ''}</ul><p>${current.remaining} Rollenpunkte übrig.</p>`;
}
