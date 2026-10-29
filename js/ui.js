import {renderAttributeRisk} from './attribute-risks.js?v=emprisk1';
import {ROLE_ABILITIES} from './role-abilities.js?v=shopping1';
import {bindNightCity} from './ui-night-city.js';
import {completionProgress} from './completion-progress.js';
import {renderCompletion} from './ui-completion.js';
import {restoreSessionForms} from './session-guide.js?v=mobile1';
import {renderSessionReport} from './ui-session-report.js?v=mobile1';
import { attributeLabel, localizeAttributeText } from './attribute-labels.js';
import { renderPortraitGallery } from './ui-portraits.js?v=shopping1';
import { renderEquipmentWarnings } from './ui-equipment-warnings.js?v=shopping1';
import { renderOwnedWeaponOptions } from './ui-weapon-options.js?v=shopping1';
import { renderLifepath, renderLifepathSummary } from './ui-lifepath.js?v=lifesplit1';
import { characterSheetReadiness } from './pdf-character-data.js?v=shopping1';
import { renderRoleAbilities, renderRoleAbilitySummary } from './ui-role-abilities.js?v=inline1';
import { pointsRemaining, evaluateCharacter } from './rules.js?v=shopping1';
import { explainAttribute, explainEmpathy } from './explanations.js?v=shopping1';

import { escapeHtml } from './html.js';
export { escapeHtml } from './html.js';
import { renderSkills, renderDerived, renderSkillSummary } from './ui-skills.js?v=inline1';
import { renderCyberware, renderCyberwareSummary, renderWallet, renderEquipmentSummary } from './ui-cyberware.js?v=mobile1';

const steps = [
  ['identity', 'Identität', 'Name & Rolle'],
  ['attributes', 'Attribute', 'Deine Basiswerte'],
  ['skills', 'Fertigkeiten', 'Training & Wissen'],
  ['role-abilities', 'Rollenfähigkeiten', 'Dein Spezialgebiet'],
  ['lifepath', 'Lebensweg', 'Deine Geschichte'],
  ['cyberware', 'Ausstattung', 'Cyberware & Ausrüstung'],
  ['review', 'Überprüfung', 'Charakter prüfen'],
  ['session', 'After Session Report', 'Fortschritt & Folgen']
];

export function attributeCard(attribute, character, rules, evaluated) {
  const { id, name, hint } = attribute;
  const value = evaluated.attributes[id];
  const riskValue = id === 'EMP' ? value.base : value.effective;
  const recommended = character.method === 'recommendation';
  const remaining = recommended ? 0 : pointsRemaining(character, rules);
  const control = `<div class="stepper"><button id="minus-${id}" data-adjust="-1" data-stat="${id}" aria-label="${name} verringern" ${value.base === null || value.base <= rules.pointBuy.min ? 'disabled' : ''}>−</button><output tabindex="-1" aria-label="${name}: aktueller Wert">${value.base ?? '—'}</output><button id="plus-${id}" data-adjust="1" data-stat="${id}" aria-label="${name} erhöhen" ${value.base === null || value.base >= rules.pointBuy.max || remaining <= 0 ? 'disabled' : ''}>+</button></div>`;
  return `<article id="attribute-${id}" tabindex="-1" class="attribute-card ${value.base === null ? 'unassigned' : ''} ${Number.isFinite(riskValue)&&riskValue<5?'attribute-low':''}">
    <div class="attribute-heading"><span class="stat-code">${attributeLabel(id)}</span><span class="stat-number">${value.effective ?? '—'}</span></div>
    <h3>${name}</h3><p class="attribute-hint">${hint}</p>
    ${control}
    ${renderAttributeRisk(id,riskValue)}
    <div class="stat-source">${recommended ? 'Empfehlung' : 'Punkteverteilung'} <span>↗</span></div>
    <details id="explain-${id}"><summary aria-label="Wofür ist ${name} wichtig?">Wofür ist der Wert wichtig? <span>+</span></summary><p>${escapeHtml(explainAttribute(id, value, character.method))}</p><dl class="explanation-data"><dt>Basiswert</dt><dd>${value.base ?? 'offen'}</dd><dt>Dauerhafte Änderungen</dt><dd>${escapeHtml(value.modifiers.filter(modifier => modifier.type === 'permanent').map(modifier => `${modifier.label}: ${modifier.value >= 0 ? '+' : ''}${modifier.value}`).join('; ') || 'Keine')}</dd><dt>Getragene Rüstung</dt><dd>${escapeHtml(value.modifiers.filter(modifier => modifier.type === 'equipment').map(modifier => `${modifier.label}: ${modifier.value}`).join('; ') || 'Keine Abzüge')}</dd><dt>Effektiver Wert</dt><dd>${value.effective ?? 'offen'}</dd></dl></details>
  </article>`;
}

export function renderCharacterLibrary(state,rules) {
  if(!state.archivedCharacters?.length)return '';
  return `<section class="character-library"><details id="character-library-list"><summary>Gespeicherte Charaktere <span>${state.archivedCharacters.length} · Liste öffnen</span></summary><ul class="character-archive-list">${state.archivedCharacters.map(entry=>`<li><button type="button" class="archive-open" data-open-character="${escapeHtml(entry.key)}" ${state.pdfExportBusy?'disabled':''}><strong>${escapeHtml(entry.name)}</strong><small>${escapeHtml(rules.roles.find(role=>role.id===entry.role)?.name??'Ohne Rolle')}</small></button><button type="button" class="archive-delete" data-delete-character="${escapeHtml(entry.key)}" aria-label="Gespeicherten Charakter ${escapeHtml(entry.name)} löschen" title="Diesen gespeicherten Stand permanent löschen" ${state.pdfExportBusy?'disabled':''}>×</button></li>`).join('')}</ul></details><small>Eintrag anklicken zum Öffnen · rotes × zum Löschen dieses gespeicherten Standes. Dein aktueller Entwurf bleibt beim Löschen erhalten.</small></section>`;
}

export function reviewDisclosure(id,label,body) {
  const content=body.replace(/<h[23]\b[^>]*>[\s\S]*?<\/h[23]>/,'');
  return `<details id="review-${id}" class="review-disclosure"><summary>${escapeHtml(label)}</summary><div class="review-disclosure-content">${content||'<p>Keine Waffen oder Ausrüstung gekauft.</p>'}</div></details>`;
}

export function renderDeleteCharacterDialog(pending) {
  if(!pending)return '';
  return `<dialog id="delete-character-dialog" class="delete-character-dialog" role="alertdialog" aria-labelledby="delete-character-title" aria-describedby="delete-character-description"><h2 id="delete-character-title">Charakter permanent löschen?</h2><p id="delete-character-description">Achtung: Der gespeicherte Charakter <strong>„${escapeHtml(pending.name)}“</strong> wird permanent gelöscht. Dieser gespeicherte Stand kann nicht wiederhergestellt werden. Dein aktueller Entwurf bleibt erhalten.</p><p>Wirklich löschen?</p><div class="delete-character-actions"><button type="button" class="secondary" data-action="cancel-delete-character" autofocus>Abbrechen</button><button type="button" class="archive-delete-confirm" data-action="confirm-delete-character">Permanent löschen</button></div></dialog>`;
}

function identity(character, rules, state = {}) {
  return `<section class="panel identity-panel"><div class="section-heading"><span class="section-index">01</span><div><h2>Wer bist du?</h2><p>Jede Geschichte beginnt mit einem Namen.</p></div></div>
    ${renderCharacterLibrary(state,rules)}<div class="identity-fields"><label class="field-label" for="character-name">Charaktername <span>Pflichtfeld</span></label>
    <input id="character-name" type="text" maxlength="60" autocomplete="off" placeholder="Dein Name auf der Straße" value="${escapeHtml(character.name)}"><p class="identity-intro">Ein Name, ein Gesicht, eine Geschichte.<br>Wähle anschließend die Rolle deines Edgerunners.</p></div>
    <div class="field-label role-label" id="role-label">Deine Rolle <span>Eine Rolle auswählen</span></div>
    <div id="identity-roles" tabindex="-1" class="roles" role="group" aria-labelledby="role-label">${rules.roles.map((role, index) => `<div class="role-choice"><button id="role-${role.id}" class="role-card ${character.role === role.id ? 'selected' : ''}" data-role="${role.id}" aria-pressed="${character.role === role.id}"><span class="role-top"><span class="role-index">R / ${String(index + 1).padStart(2, '0')}</span><span class="role-indicator">${character.role === role.id ? '●' : '○'}</span></span><strong>${role.name}</strong><span>${role.description}</span></button><details class="role-choice-help" id="identity-role-help-${role.id}"><summary>ⓘ Rollenfähigkeit</summary><p><strong>${escapeHtml(ROLE_ABILITIES[role.id].name)}</strong><br>${escapeHtml(ROLE_ABILITIES[role.id].description)}</p></details></div>`).join('')}</div>
    ${renderPortraitGallery(character,rules)}
    <p class="inline-note">ⓘ Deine Rolle bestimmt den Startvorschlag unter „Empfehlung“. Sie verleiht keine zusätzlichen Attributboni.</p>
    <div class="panel-footer"><span>Deine Eingaben bleiben beim Wechsel erhalten.</span><button class="primary" data-view="attributes">Weiter zu den Attributen <span>→</span></button></div></section>`;
}

function attributes(character, rules, evaluated) {
  const recommended = character.method === 'recommendation';
  const role = rules.roles.find(role => role.id === character.role);
  return `<section class="panel method-panel"><div class="section-heading"><span class="section-index">01</span><div><h2>Wähle deine Methode</h2><p>Starte mit einer Empfehlung oder verteile deine Punkte selbst.</p></div></div>
    <div class="methods" role="group" aria-label="Attributmethode"><button id="method-recommendation" data-method="recommendation" class="method-card ${recommended ? 'selected' : ''}" aria-pressed="${recommended}"><span class="radio-dot"></span><span><strong>Empfehlung</strong><span>Passende Startwerte für ${escapeHtml(role?.name ?? 'deine Rolle')}.</span></span></button><button id="method-points" data-method="points" class="method-card ${!recommended ? 'selected' : ''}" aria-pressed="${!recommended}"><span class="radio-dot"></span><span><strong>Punkteverteilung <small class="tag neutral">62 Punkte</small></strong><span>Complete Package. Deine Verteilung.</span></span></button></div>
    <div class="method-note"><span>ⓘ</span><p>${recommended ? '62 Punkte passend zu deiner Rolle. Du kannst die Empfehlung anschließend anpassen.' : '62 Punkte insgesamt, je Attribut 2–8. Deine eigene Verteilung bleibt beim Wechsel zur Empfehlung erhalten.'}</p></div>

  </section>
  <section class="budget-panel" aria-label="${recommended ? 'Empfohlene Verteilung' : 'Verbleibendes Budget'}"><div><span class="eyebrow">${recommended ? 'Empfehlung / ' + escapeHtml(role?.name ?? '') : 'Dein Punktebudget'}</span><h2>${recommended ? 'Eine Grundlage für deine Rolle.' : 'Mach die Punkte zu deinen.'}</h2></div><div class="pool">${recommended ? '<span class="recommendation-status">✓ Vollständig verteilt · Werte 2–8</span>' : `<div class="points-track"><div style="width:${(rules.pointBuy.budget - pointsRemaining(character, rules)) / rules.pointBuy.budget * 100}%"></div></div>`}</div><div class="budget-count"><strong>${recommended ? rules.pointBuy.budget : pointsRemaining(character, rules)}</strong><span>${recommended ? 'Punkte gesamt' : 'Punkte übrig'}</span></div></section>
  ${evaluated.cyberware.loss?`<aside class="empathy-explanation ${evaluated.attributes.EMP.effective===0?'notice':''}" aria-label="Empathie durch Cyberware"><strong>EMP ${evaluated.attributes.EMP.effective} durch Menschlichkeitsverlust</strong><p>${escapeHtml(explainEmpathy(evaluated))}</p><small>Ein Namens- oder Rollenwechsel behält Implantate. „Neuen Charakter erstellen“ startet ohne bisherige Käufe und Cyberware.</small></aside>`:''}<section class="attribute-section"><div class="section-heading"><span class="section-index">02</span><div><h2>Deine Attribute</h2><p>${recommended ? 'Empfohlene Basiswerte für ' + escapeHtml(role?.name ?? 'deine Rolle') + '. Öffne die Erklärung, um ihre Verwendung zu sehen.' : 'Verteile dein Budget. Alle Änderungen werden sofort berechnet.'}</p></div><span class="small-meta">10 ATTRIBUTE / ${recommended ? 'EMPFEHLUNG' : '2–8'}</span></div><div class="attribute-grid">${rules.attributes.map(attribute => attributeCard(attribute, character, rules, evaluated)).join('')}</div></section>
  ${recommended ? '<div class="recommendation-actions"><p>Du möchtest die Startwerte anpassen?</p><button class="secondary" data-action="customize-recommendation">Empfehlung als eigene Verteilung übernehmen ↗</button></div>' : ''}
  ${renderDerived(evaluated)}<div class="bottom-bar"><button class="secondary" data-view="identity">← Zurück zur Identität</button><button class="primary" data-view="skills">Weiter zu den Fertigkeiten <span>→</span></button></div>`;
}
function review(character, rules, evaluated, state = {}) {
  const role = rules.roles.find(item => item.id === character.role);
  const sheet = characterSheetReadiness(character,rules,state);
  return `<section class="panel review-panel"><div class="section-heading"><span class="section-index">07</span><div><h2>Dein Charakter im Überblick</h2><p>Prüfe die Grundlage deiner nächsten Geschichte.</p></div></div>
    <div class="review-identity"><span class="eyebrow">${escapeHtml(role?.name ?? 'Rolle noch offen')}</span><h2>${escapeHtml(character.name.trim() || 'Unbenannter Charakter')}</h2><p>${character.method === 'recommendation' ? 'Empfehlung · 62 Punkte' : 'Punkteverteilung · 62 Punkte'}</p></div>
    <div class="review-stats">${rules.attributes.map(({ id, name }) => `<div><span>${attributeLabel(id)}</span><strong>${evaluated.attributes[id].effective ?? '—'}</strong><small>${name}</small></div>`).join('')}</div>
    ${reviewDisclosure('lifepath','Dein Lebensweg',renderLifepathSummary(character))}${renderRoleAbilitySummary(character,rules)}${renderDerived(evaluated)}${reviewDisclosure('skills','Gelernte Fertigkeiten',renderSkillSummary(evaluated))}${renderWallet(evaluated,rules)}${reviewDisclosure('cyberware',`Installierte Cyberware (${evaluated.cyberware.entries.length})`,renderCyberwareSummary(evaluated, rules))}${reviewDisclosure('equipment','Waffen & Ausrüstung',renderEquipmentSummary(character,rules)+renderOwnedWeaponOptions(character,rules,evaluated))}<div class="validation ${evaluated.complete ? 'valid' : ''}" role="status"><h3>${evaluated.complete ? '✓ Bisherige Schritte vollständig' : 'Noch ein paar offene Punkte'}</h3>${evaluated.complete ? '<p>Name, Rolle, Attribute, Fertigkeiten, Cyberware und gewählte Ausrüstung sind geprüft. Die Ausstattungshinweise am Ende helfen dir beim letzten Check; fehlende optionale Käufe verhindern den Abschluss nicht.</p>' : `<ul>${evaluated.errors.map(error => `<li>${escapeHtml(error)}</li>`).join('')}</ul>`}</div>
    <div class="panel-footer"><button class="secondary" data-view="identity">Name & Rolle bearbeiten</button><button class="secondary" data-view="attributes">Attribute bearbeiten</button><button class="secondary" data-view="skills">Fertigkeiten bearbeiten</button><button class="secondary" data-view="role-abilities">Rollenfähigkeit ansehen</button><button class="secondary" data-view="lifepath">Lebensweg bearbeiten</button><button class="primary" data-view="cyberware">Ausstattung bearbeiten ↗</button></div>
    <section class="character-sheet-export" aria-label="Charactersheet generieren"><h3>Dein Charactersheet als PDF</h3><p>Füllt die hinterlegte Charakterblatt-Vorlage aus. Dazu kommt eine einzelne formatierte Cheatsheet-Seite mit deinen Waffen, Entfernungs-DVs und wichtigen Spielregeln. Die Felder des Charakterbogens bleiben bearbeitbar; lange Inhalte sind dort beim Bearbeiten vollständig lesbar.</p><p>Benötigt: gültige Identität, verteilte Attribute, Fertigkeiten und Rollenpunkte sowie alle Lebensweg-Antworten. Porträt, Cyberware und Ausrüstung sind optional.</p>${sheet.errors.length?`<ul class="export-errors">${sheet.errors.map(error=>`<li>${escapeHtml(error)}</li>`).join('')}</ul>`:''}<button id="generate-character-sheet" class="primary" data-action="generate-character-sheet" ${!sheet.ready||state.pdfExportBusy?'disabled':''} aria-describedby="pdf-export-status">${state.pdfExportBusy?'PDF wird erstellt …':'Charactersheet generieren'}</button><p id="pdf-export-status" role="status" aria-live="polite">${escapeHtml(state.pdfExportMessage || (sheet.ready?'Alle erforderlichen Daten sind vollständig.':'Ergänze die oben aufgeführten Angaben, um das PDF zu erstellen.'))}</p></section>
    ${renderEquipmentWarnings(character,rules,evaluated)}${character.campaign?.sessionUnlocked?'<button class="primary" data-view="session">After Session Report öffnen →</button>':'<button class="secondary" data-action="unlock-session">Session 1 überstanden</button>'}</section>`;
}

export function render(root, state, rules) {
  const { character, view, storageStatus, storageBlocked, storageMessage, error } = state;
  const evaluated = evaluateCharacter(character, rules);
  const progress=completionProgress(character,rules,state,evaluated);
  const role = rules.roles.find(item => item.id === character.role);
  const focused = document.activeElement?.id;
  const selection = (document.activeElement instanceof HTMLTextAreaElement || (document.activeElement instanceof HTMLInputElement && document.activeElement.type === 'text')) ? [document.activeElement.selectionStart, document.activeElement.selectionEnd] : null;
  const openDetails = [...root.querySelectorAll('details[open]')].map(element => element.id).filter(Boolean);
  root.innerHTML = `<header class="topbar"><a class="brand" href="#identity" aria-label="RED Builder, Identität"><span class="brand-mark">R<span>//</span></span><span>RED<span class="brand-slashes">//</span>BUILDER<small>CHARAKTEREDITOR</small></span></a><div class="topbar-right"><button id="new-character" class="secondary new-character-button" data-action="new-character" ${state.pdfExportBusy?'disabled':''}>+ Neuen Charakter erstellen</button><span class="version">PROTOTYP <b>v0.9</b></span><span class="save-status ${storageStatus === 'error' || storageBlocked ? 'warning' : ''}" role="status"><span class="tiny-dot"></span>${escapeHtml(storageStatus === 'error' || storageBlocked ? 'Speichern pausiert' : storageStatus === 'saved' ? 'Lokal gespeichert' : 'Lokaler Entwurf')}</span></div></header>
    <div class="app-layout"><aside class="sidebar"><div class="sidebar-top"><span class="eyebrow">CHARAKTER ERSTELLEN</span><nav aria-label="Editor-Schritte">${steps.map(([id, title, description], index) => {const completion=progress.steps.find(step=>step.id===id);return id==='session'&&!character.campaign?.sessionUnlocked?'': `<button data-view="${id}" class="nav-step ${view === id ? 'active' : ''} ${completion?'nav-'+completion.status:''}" ${view === id ? 'aria-current="step"' : ''} ${id !== 'identity' && (!character.name.trim() || !character.role) ? 'disabled' : ''}><span class="step-index">0${index + 1}</span><span><strong>${title}</strong><small>${description}</small>${completion?`<small class="nav-step-status">${completion.complete?(completion.status==='warning'?'!':'✓'):'○'} ${escapeHtml(completion.label)}</small>`:''}</span><span class="step-arrow">↗</span></button>`;}).join('')}</nav><div class="future-steps"><span class="eyebrow">CHARACTERSHEET</span><p>PDF-Export <span>↗</span></p><small>Unter Überprüfung nach Abschluss aller Pflichtangaben.</small></div></div><div class="sidebar-bottom"><span class="eyebrow">DEIN ENTWURF</span><strong>${escapeHtml(character.name.trim() || 'Unbenannter Charakter')}</strong><span>${escapeHtml(role?.name ?? 'Noch keine Rolle')}</span><div class="mini-divider"></div><span class="privacy-note"><span class="tiny-dot"></span> Nur in deinem Browser</span></div></aside>
    <main id="main" tabindex="-1" class="${view==='cyberware'?'equipment-main':view==='session'?'session-main':''}"><div class="page-title"><div><span class="eyebrow"><span class="red-line"></span> DEIN CHARAKTER. DEINE ENTSCHEIDUNGEN.</span><h1>${view === 'session' ? 'Nach dem Einsatz.' : view === 'identity' ? 'Eine neue Identität.' : view === 'review' ? 'Bereit für die Straße?' : view === 'cyberware' ? 'Dein Körper. Deine Ausrüstung.' : view === 'role-abilities' ? 'Deine Rolle. Dein Spezialgebiet.' : view === 'lifepath' ? 'Dein Weg durch Night City.' : view === 'skills' ? 'Mach den Unterschied.' : 'Baue deine Grundlage.'}</h1><p>${view === 'session' ? 'Ein paar kurze Fragen bringen deinen Charakter auf den neuesten Stand.' : view === 'identity' ? 'Wer wirst du in der Zeit des Roten sein?' : view === 'review' ? 'Deine Entscheidungen, transparent zusammengefasst.' : view === 'cyberware' ? 'Wähle, was zu dir passt. Kosten und Spielwerte rechnen wir für dich.' : view === 'role-abilities' ? 'Verstehe deine Rollenfähigkeit mit Beispielen aus deinen aktuellen Charakterwerten.' : view === 'lifepath' ? 'Gib deinem Charakter eine Vergangenheit und einen Grund weiterzumachen.' : view === 'skills' ? 'Verteile dein Training. Entdecke deine Stärken.' : 'Verteile deine Attribute und forme deinen Edgerunner.'}</p></div><span class="phase-badge">PHASE <b>04</b><small>DEIN EDGERUNNER</small></span></div>
    ${storageMessage&&(view!=='session'||storageBlocked||storageStatus==='error') ? `<div class="notice" role="alert">${escapeHtml(storageMessage)}${storageBlocked ? '<button class="secondary" data-action="resume-storage">Diesen Entwurf speichern</button>' : ''}</div>` : ''}
    ${error ? `<div class="notice" role="alert">${escapeHtml(error)}</div>` : ''}
    ${renderCompletion(progress,view)}
    ${character.campaign?.active&&view!=='session'?'<p class="inline-note">Kampagnencharakter · Änderungen an Werten und Ausstattung werden in Schritt 8 mit Protokoll vorgenommen.</p>':''}${view === 'session' ? renderSessionReport(character,rules,state) : view === 'identity' ? identity(character, rules, state) : view === 'review' ? review(character, rules, evaluated, state) : view === 'cyberware' ? renderCyberware(character, rules, evaluated, state) : view === 'role-abilities' ? renderRoleAbilities(character, rules, evaluated) : view === 'lifepath' ? renderLifepath(character,state) : view === 'skills' ? renderSkills(character, rules, evaluated, state) : attributes(character, rules, evaluated)}
    <footer><div><strong>RED<span>//</span>BUILDER</strong><span>Ein kostenloses Fanprojekt für Cyberpunk RED.</span></div><details><summary>Regelstand & rechtliche Hinweise</summary><p>Phase 4: Körperansicht mit Drag-and-drop und Klickbedienung. Gemeinsames Complete-Package-Startkapital 2.550 eb plus 800 eb zweckgebunden für Kleidung/Fashionware. Der Katalog ist noch nicht vollständig; Quellen stehen unter Ausstattung. Fertigkeiten: 86 Fertigkeitspunkte, maximal Rang 6, 13 Pflichtfertigkeiten auf mindestens Rang 2. Herkunftssprache startet kostenlos auf Rang 4. Fertigkeitszuordnungen und ×2-Kosten: offizieller RTG-Charakterbogen. Formeln und Erstellungsregeln: Grundregelwerk S. 79/90; abschließender Abgleich mit aktueller eigener Ausgabe empfohlen. Attribute: 62 Punkte und Grenzen 2–8 nach Projektvorgabe; Abgleich mit Grundregelwerk S. 78 und aktuellen Errata steht aus. Die rollenspezifischen Empfehlungen sind eigene Homebrew-Startvorschläge, keine offiziellen Tabellen. Keine offiziellen Tabellen oder Regeltexte werden reproduziert.</p><p><a href="https://rtalsoriangames.com/wp-content/uploads/2020/11/RTG-CPR-CharacterSheet-Fillable.pdf" target="_blank" rel="noopener noreferrer">Fertigkeitsreferenz: RTG-Charakterbogen ↗</a> · <a href="https://rtalsoriangames.com/2020/10/09/cyberpunk-red-alert/" target="_blank" rel="noopener noreferrer">Offizielle Rollen & Methoden ↗</a> · <a href="https://rtalsoriangames.com/homebrew-content-policy/" target="_blank" rel="noopener noreferrer">RTG Homebrew Content Policy ↗</a></p></details><p lang="en">RED//BUILDER is unofficial content provided under the Homebrew Content Policy of R. Talsorian Games and is not approved or endorsed by RTG. This content references materials that are the property of R. Talsorian Games and its licensees.</p></footer>
    </main></div>${renderDeleteCharacterDialog(state.pendingArchiveDeletion)}`;
  if(view==='session')restoreSessionForms(root,state);
  if(view==='skills')bindNightCity(root);
  for (const id of openDetails) document.getElementById(id)?.setAttribute('open', '');
  if (focused) {
    const target = document.getElementById(focused);
    const focusTarget = target?.disabled ? target.closest('.stepper')?.querySelector('output') ?? document.getElementById('cyber-status') ?? document.getElementById('wallet') : target;
    (focusTarget ?? (focused.startsWith('remove-') ? document.getElementById('cyber-status') ?? document.getElementById('wallet') : null))?.focus({ preventScroll: true });
    if (selection && (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) target.setSelectionRange(...selection);
  }
  if(character.campaign?.active&&view!=='session') {
    root.querySelectorAll('main input,main select,main textarea,main button[data-role],main button[data-method],main button[data-skill],main button[data-role-point],main button[data-action],main button[data-buy-equipment],main button[data-remove-equipment],main button[data-queue-cyberware],main button[data-remove-cyberware],main button[data-portrait],main button[data-hometown]').forEach(control=>{if(!control.dataset.drugFilter&&!['generate-character-sheet','lifepath-next','unlock-session'].includes(control.dataset.action)&&!control.dataset.lifepathChoice&&!control.dataset.lifepathText&&!control.dataset.lifepathCost)control.disabled=true;});
  }
  const sideDialog=document.getElementById('cyber-side-dialog');if(sideDialog&&!sideDialog.open){sideDialog.addEventListener('cancel',event=>{event.preventDefault();sideDialog.querySelector('[data-action="cancel-cyber-placement"]')?.click();});sideDialog.showModal();}
  const deletionDialog=document.getElementById('delete-character-dialog');
  if(deletionDialog&&!deletionDialog.open)deletionDialog.showModal();
}


