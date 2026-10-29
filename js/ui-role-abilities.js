import {roleRank} from './campaign-state.js?v=shopping1';
import { attributeLabel, localizeAttributeText } from './attribute-labels.js';
import { renderRolePoints, rolePointsSummary } from './ui-role-points.js?v=inline1';
import { escapeHtml as e } from './html.js';
import { ROLE_ABILITIES, STARTING_ROLE_RANK, roleAbilityExamples } from './role-abilities.js?v=shopping1';

export function renderRoleAbilitySummary(character, rules) {
  const ability = ROLE_ABILITIES[character.role];
  if (!ability) return '';
  return `<section class="review-role"><h3>Rollenfähigkeit</h3><p><strong>${e(ability.name)} · Rang ${roleRank(character)}</strong></p><p>${e(ability.description)}</p>${rolePointsSummary(character)}<button class="text-button" data-view="role-abilities">Erklärung und aktuelle Beispiele ansehen →</button></section>`;
}

export function renderRoleAbilities(character, rules, evaluated) {
  const ability = ROLE_ABILITIES[character.role];
  if (!ability) return '<section class="panel"><p>Wähle zuerst deine Rolle unter Identität.</p><button class="primary" data-view="identity">Zur Identität →</button></section>';
  const role = rules.roles.find(item => item.id === character.role);
  const related = ability.skills.flatMap(id => evaluated.skills.filter(skill => skill.id === id || character.skills.specialties.some(specialty => specialty.id === skill.id && specialty.skill === id)));
  return `<section class="panel role-ability-intro"><div class="section-heading"><span class="section-index">04</span><div><h2>Deine Rollenfähigkeit</h2><p>${e(character.name)} · ${e(role.name)}</p></div><span class="tag">${character.campaign?.active?'RANG':'START-RANG'} ${roleRank(character)}</span></div><h2>${e(ability.name)}${ability.name !== ability.original ? ` <small>(${e(ability.original)})</small>` : ''}</h2><p>${e(ability.description)}</p><p class="inline-note">Rollenfähigkeiten sind dein Spezialgebiet und starten bei der Charaktererstellung auf Rang 4. Sie verbrauchen keine der 86 Fertigkeitspunkte. Der Rollenrang ist kein pauschaler Bonus auf alle Attribute oder Fertigkeiten.</p></section>
  ${evaluated.roleAbilities.pool?renderRolePoints(character,evaluated):''}
  ${!evaluated.roleAbilities.pool?`
  <section class="role-feature-grid" aria-label="Teilbereiche deiner Rollenfähigkeit">${ability.features.map(([name, text]) => `<article class="role-feature"><h3>${e(name)}</h3><p>${e(localizeAttributeText(text))}</p></article>`).join('')}</section>
  <section class="panel role-current-examples"><h2>Was bedeutet das für deinen Charakter?</h2>${roleAbilityExamples(character, evaluated).map(text => `<p>${e(localizeAttributeText(text))}</p>`).join('')}<p class="inline-note">Die Zahlen folgen deinen aktuellen Werten, einschließlich getragener Rüstung und vorhandener fester Boni. Feldexpertise, Moto und Gefahren erkennen sind bereits in den passenden Fertigkeitsbasen enthalten. Präzise angreifen gilt zusätzlich auf Angriffe.</p></section>
  <section class="panel role-related-skills"><h2>Passende Fertigkeiten · deine aktuellen Werte</h2><p>Diese Fertigkeiten unterstützen deine Rolle. Sie ersetzen die Rollenfähigkeit nicht.</p><div class="role-skill-list">${related.map(skill => `<div class="role-skill-row"><div><strong>${e(skill.name)}</strong><small>${attributeLabel(skill.attribute)} ${skill.attributeValue ?? '—'} + Fertigkeitsrang ${skill.level}${skill.modifiers.length ? ' + feste Boni' : ''}</small></div><span>Rang ${skill.level}</span><strong>Basis ${skill.base ?? '—'}</strong></div>`).join('')}</div><button class="secondary" data-view="skills">Fertigkeiten anpassen →</button></section>
  `:''}
  <details class="role-source" id="role-ability-source"><summary>Regelquelle und Einordnung</summary><p>${e(ability.reference)} (englische Ausgabe). Deutsche Erklärungen sind eigene Zusammenfassungen. Deine Verteilung wird gespeichert und zentral geprüft. Situative Effekte wie der erste Treffer pro Runde werden im Spiel angewendet. Es werden keine Würfel geworfen oder Gegenstände gekauft.</p><a href="${e(ability.source)}" target="_blank" rel="noopener noreferrer">Regelreferenz zu ${e(ability.original)} ↗</a></details>
  <div class="bottom-bar"><button class="secondary" data-view="skills">← Zurück zu den Fertigkeiten</button><button class="primary" data-view="lifepath">Weiter zum Lebensweg →</button></div>`;
}
