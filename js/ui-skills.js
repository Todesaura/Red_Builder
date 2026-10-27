import { renderNightCity } from './ui-night-city.js';
import { attributeLabel, localizeAttributeText } from './attribute-labels.js';
import { escapeHtml } from './html.js';
import { skillPointsRemaining } from './skills.js?v=budget2';
import { skillNameMenu, specialtyNameField } from './ui-skill-choices.js';

function rankControls(entry, character, rules) {
  const remaining = skillPointsRemaining(character, rules);
  return `<div class="stepper skill-stepper"><button id="skill-minus-${entry.id}" data-skill="${entry.id}" data-skill-adjust="-1" aria-label="${escapeHtml(entry.name)}: Rang verringern" ${entry.level <= (entry.free ?? 0) ? 'disabled' : ''}>−</button><output tabindex="-1" aria-label="${escapeHtml(entry.name)}: Rang">${entry.level}</output><button id="skill-plus-${entry.id}" data-skill="${entry.id}" data-skill-adjust="1" aria-label="${escapeHtml(entry.name)}: Rang erhöhen" ${entry.level >= rules.skillRules.maxRank || remaining < entry.cost ? 'disabled' : ''}>+</button></div>`;
}

function skillRow(entry, character, rules, specialty = null, state = {}) {
  return `<article class="skill-row ${entry.level>0?'skill-selected':''}"><div class="skill-name"><strong>${escapeHtml(entry.name)}</strong><span>${entry.min >= 2 ? '<small class="tag neutral">Pflicht</small>' : ''}${entry.cost === 2 ? '<small class="tag">×2 Kosten</small>' : ''}${entry.free ? '<small class="tag neutral">4 Ränge gratis</small>' : ''}</span>${specialty ? `<label class="sr-only" for="name-${entry.id}">Spezialisierung: ${escapeHtml(entry.name)}</label>${specialtyNameField(entry, specialty, character, rules, state)}` : ''}</div><span class="skill-stat">${attributeLabel(entry.attribute)} <b>${entry.attributeValue ?? '—'}</b></span>${rankControls(entry, character, rules)}<div class="skill-base"><small>Basis</small><strong>${entry.base ?? '—'}</strong></div><details id="skill-explain-${entry.id}"><summary>Wofür nutze ich ${escapeHtml(entry.name)}?</summary><p>${escapeHtml(entry.use??(entry.id==='native-language'?'Sprechen, Verstehen und Lesen in deiner Herkunftssprache.':'Proben in diesem Fachgebiet bestehen.'))}</p><p><strong>Dein Wurf: ${entry.base??'—'} + 1W10</strong> (${attributeLabel(entry.attribute)} ${entry.attributeValue??'—'} + Rang ${entry.level}${entry.modifiers?.length?' + feste Boni':''}). ${entry.spent} Punkte ausgegeben.</p></details>${specialty ? `<button class="text-button remove-specialty" data-remove-specialty="${entry.id}">Spezialisierung entfernen</button>` : ''}</article>`;
}

export function renderDerived(evaluated) {
  return `<section class="derived-section"><div class="section-heading"><span class="section-index">↗</span><div><h2>Abgeleitete Werte</h2><p>Live aus deinen Attributen und deiner gültigen Cyberware-Auswahl.</p></div></div><div class="derived-grid">${evaluated.derived.map(value => `<article class="derived-card"><span>${value.name}</span><strong>${value.value}</strong><details id="derived-${value.id}"><summary>Berechnungen und Erklärungen anzeigen</summary><div class="derived-help"><h3>Was bedeutet das?</h3><p>${escapeHtml(localizeAttributeText(value.meaning))}</p><h3>So funktioniert es im Spiel</h3><p>${escapeHtml(localizeAttributeText(value.play))}</p><h3>Deine Berechnung</h3><p>${escapeHtml(localizeAttributeText(value.explanation))}</p><small>Die Berechnung berücksichtigt deine aktuellen Werte. Situative Änderungen nennt die Spielleitung.</small></div></details></article>`).join('') || '<p>Wähle zuerst deine Rolle und Attribute.</p>'}</div></section>`;
}

export function renderSkills(character, rules, evaluated, state) {
  const config = rules.skillRules;
  const remaining = skillPointsRemaining(character, rules);
  const search = state.skillSearch.trim().toLocaleLowerCase('de');
  const matches = skill => `${skill.name} ${skill.id}`.toLocaleLowerCase('de').includes(search);
  const native = evaluated.skills.find(skill => skill.id === 'native-language');
  let rowCount = 0;
  const groups = config.categories.filter(category => state.skillCategory === 'all' || state.skillCategory === category.id).map(category => {
    const definitions = config.skills.filter(skill => skill.category === category.id);
    const rows = definitions.map(definition => {
      if (!definition.specialized) {
        if (!matches(definition)) return '';
        rowCount++;
        return skillRow(evaluated.skills.find(skill => skill.id === definition.id), character, rules);
      }
      const children = character.skills.specialties.filter(item => item.skill === definition.id);
      if (!matches(definition) && !children.some(item => item.name.toLocaleLowerCase('de').includes(search))) return '';
      rowCount++;
      return `<div class="specialty-group"><div class="specialty-header"><div><strong>${definition.name}</strong><p>${definition.attribute} · ${definition.cost} Punkt${definition.cost === 1 ? '' : 'e'} je Rang · getrennt pro Spezialisierung</p></div><button class="secondary" data-add-specialty="${definition.id}">+ Hinzufügen</button></div>${children.map(item => skillRow(evaluated.skills.find(skill => skill.id === item.id), character, rules, item, state)).join('')}</div>`;
    }).join('');
    return rows ? `<section class="skill-group"><h3>${category.name}</h3>${rows}</section>` : '';
  }).join('');
  return `<section class="panel skill-origin required-origin"><div class="section-heading"><span class="section-index">01</span><div><h2>Sprache & Heimat <span class="required-badge">2 Pflichtangaben</span></h2><p>Die Herkunftssprache startet kostenlos auf Rang 4. Straßenslang und Pflichtfertigkeiten zählen zum Budget.</p></div></div><div class="origin-fields"><div><label class="field-label" for="native-language-name">Kulturelle Herkunftssprache <span>Pflichtfeld</span></label>${skillNameMenu({id:"native-language-name", target:"native-language", value:character.skills.nativeLanguage.name, options:config.languages, customFields:state.customSkillFields, unavailable:character.skills.specialties.filter(item => item.skill === "language").map(item => item.name)})}</div><div><label class="field-label" for="hometown-name">Deine Heimat / Ortskenntnis <span>Pflichtfeld</span></label>${skillNameMenu({id:"hometown-name", target:"hometown", value:character.skills.hometown, options:config.locations, customFields:state.customSkillFields, unavailable:character.skills.specialties.filter(item => item.skill === "local-expert").map(item => item.name)})}</div></div>${renderNightCity(character,rules)}<p class="choice-note">Acht gängige Sprachen zur Auswahl · Stadtviertel aus Night City 2045. Andere Sprachen und Orte bleiben über „Anderer Name …“ möglich.</p>${skillRow(native, character, rules)}<p class="inline-note">13 Pflichtfertigkeiten benötigen für einen fertigen Charakter mindestens Rang 2. Andere Fertigkeiten dürfen bei 0 bleiben. Maximales Startniveau: 6. ×2-Fertigkeiten kosten zwei Punkte je Rang.</p></section><section class="budget-panel skill-budget" aria-label="Fertigkeitsbudget"><div><span class="eyebrow">Fertigkeiten / Complete Package</span><h2>Worin bist du gut?</h2></div><div class="pool"><span class="recommendation-status">${config.budget - remaining} von ${config.budget} Punkten verteilt</span></div><div class="budget-count"><strong>${remaining}</strong><span>Punkte übrig</span></div></section>
    <p class="inline-note skill-start-help">${character.skills.recommendation && !character.skills.recommendation.edited?'Deine Fertigkeiten sind passend zur Rolle vorausgefüllt. ':''}Du kannst sie direkt mit − und + anpassen. Grün markierte Fertigkeiten haben mindestens einen Rang.</p><div class="skill-reset-actions"><button id="reset-skill-points" class="secondary" data-action="reset-skill-points">Punkte zurücksetzen</button><small>Alle gekauften Ränge auf 0, alle 86 Punkte wieder frei. Die kostenlose Herkunftssprache bleibt auf Rang 4. Pflichtfertigkeiten benötigen vor dem Abschluss wieder Rang 2.</small></div>
    <section class="skill-catalog"><div class="section-heading"><span class="section-index">02</span><div><h2>Deine Fertigkeiten</h2><p>Attribut + Rang + feste Fertigkeitsboni = Fertigkeitsbasis. Würfel und situative Boni kommen im Spiel hinzu.</p></div></div><div class="skill-filters"><div><label class="field-label" for="skill-search">Fertigkeit suchen</label><input id="skill-search" type="text" placeholder="Name der Fertigkeit …" value="${escapeHtml(state.skillSearch)}"></div><div><label class="field-label" for="skill-category">Kategorie</label><select id="skill-category"><option value="all">Alle Kategorien</option>${config.categories.map(category => `<option value="${category.id}" ${category.id === state.skillCategory ? 'selected' : ''}>${category.name}</option>`).join('')}</select></div></div>${rowCount ? groups : '<p class="empty-results">Keine Fertigkeiten für diese Suche gefunden.</p>'}</section>
    <p class="inline-note">Deutsche Bezeichnungen sind eigene Übersetzungen. Fertigkeitskatalog: offizieller RTG-Charakterbogen; Budget und Mindestwerte: Grundregelwerk S. 90. Rollenfähigkeiten sind ein eigenes System und werden hier nicht als Fertigkeiten verrechnet.</p>
    <div class="bottom-bar"><button class="secondary" data-view="attributes">← Zurück zu den Attributen</button><button class="primary" data-view="role-abilities">Weiter zu den Rollenfähigkeiten →</button></div>`;
}

export function renderSkillSummary(evaluated) {
  return `<section class="review-skills"><h3>Gelernte Fertigkeiten</h3><div class="skill-summary-table"><div class="skill-summary-row table-header"><span>Fertigkeit</span><span>Rang</span><span>Basis</span></div>${evaluated.skills.filter(skill => skill.level > 0).map(skill => `<div class="skill-summary-row"><span>${escapeHtml(skill.name)}</span><span>${skill.level}</span><strong>${skill.base ?? '—'}</strong></div>`).join('')}</div></section>`;
}
