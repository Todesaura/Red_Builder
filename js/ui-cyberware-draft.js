import {humanityRollText} from './campaign-rules.js?v=session6';
import {previewSession,createSessionDraft} from './session-report.js?v=guide5';
import {evaluateCharacter} from './rules.js?v=session6';
import { attributeLabel } from './attribute-labels.js';
import { escapeHtml as e } from './html.js';
import { evaluateCyberwareDraft } from './cyberware-draft.js?v=session6';
const money = value => `${value.toLocaleString('de-DE')} eb`;
const place = (rules, id) => rules.cyberwareRules.locations.find(location => location.id === id)?.name ?? id;

export function renderCyberwareDraft(character, rules, state) {
  const additions = state.cyberDraft ?? [];
  let preview = evaluateCyberwareDraft(character, rules, additions);
  if(state.sessionMode&&additions.length){
    const actualRules={...rules,equipmentRules:{...rules.equipmentRules,startingCash:rules.equipmentRules.sessionStartingCash??rules.equipmentRules.startingCash}};
    const draft=createSessionDraft(character),owned=state.owned??{},credit=additions.reduce((sum,i)=>sum+(character.campaign.cyberInventory.some(s=>s.id===owned[i.id]&&s.catalogId===i.catalogId)?rules.cyberwareRules.items.find(d=>d.id===i.catalogId).cost:0),0);
    const cost=state.price===''?additions.reduce((sum,i)=>sum+rules.cyberwareRules.items.find(d=>d.id===i.catalogId).cost,0)-credit:Number(state.price);
    draft.actions=[{type:'cyber-install',additions,owned,price:cost,humanityLoss:state.loss===''?null:Number(state.loss),confirmation:state.confirmation}];
    const plan=previewSession(character,actualRules,draft);
    preview={...preview,before:evaluateCharacter(character,actualRules),after:plan.after?evaluateCharacter(plan.character,actualRules):evaluateCharacter(character,actualRules),errors:plan.errors};
  }
  const selected = rules.cyberwareRules.items.find(item => item.id === state.selectedCyberware);
  const row = (label, before, after) => `<div><dt>${label}</dt><dd>${before} → ${after}</dd></div>`;
  return `<section class="installation-preview batch-installation" id="installation-preview" tabindex="-1" aria-label="Gemeinsamer Installationsentwurf">
    <span class="eyebrow">ERST AUSWÄHLEN · DANN GEMEINSAM INSTALLIEREN</span><h3>Dein Installationsentwurf <span>${additions.length}</span></h3>
    <p>Ziehe mehrere Implantate in die Körperbereiche. Im Entwurf kannst du sie kostenlos herausziehen oder per × entfernen. Eine entfernte Basis nimmt ihre geplanten Erweiterungen mit.</p>
    ${selected ? `<div class="draft-selection"><strong>${e(selected.name)}</strong><label for="installation-location">Zielbereich</label><select id="installation-location"><option value="">Bereich auswählen …</option>${selected.installationSlots.map(id => `<option value="${id}" ${state.pendingLocation === id ? 'selected' : ''}>${e(place(rules,id))}</option>`).join('')}</select><button class="secondary" data-action="queue-selection" ${state.pendingLocation ? '' : 'disabled'}>Zum Entwurf hinzufügen</button></div>` : ''}
    <ul class="draft-implant-list">${additions.map(item => {
      const definition = rules.cyberwareRules.items.find(entry => entry.id === item.catalogId);
      return `<li class="draft-implant" data-drag-draft="${item.id}"><div><h4>${e(definition.name)}</h4><small>${e(place(rules,item.location))} · ${money(definition.cost)} · HUM ${state.sessionMode?humanityRollText(definition):'−'+definition.humanity}</small></div><button class="text-button" data-remove-draft="${item.id}" aria-label="${e(definition.name)} aus Entwurf entfernen">×</button></li>`;
    }).join('')}</ul>
    <div class="draft-remove-zone" data-draft-remove-zone>Hierher ziehen, um aus dem Entwurf zu entfernen</div>
    ${additions.length ? `<dl class="preview-values">${row('Guthaben',money(preview.before.funds.remaining),money(preview.after.funds.remaining))}${row('Fashion-Zuschuss',money(preview.before.funds.fashionRemaining),money(preview.after.funds.fashionRemaining))}${row('Menschlichkeit',preview.before.cyberware.current,preview.after.cyberware.current)}${row('Max. Menschlichkeit',preview.before.cyberware.maximum,preview.after.cyberware.maximum)}${row('Empathie',preview.before.attributes.EMP.effective,preview.after.attributes.EMP.effective)}</dl><details><summary>Alle geänderten Werte anzeigen</summary><ul>${Object.entries(preview.after.attributes).filter(([id,value]) => value.effective !== preview.before.attributes[id].effective).map(([id,value]) => `<li>${attributeLabel(id)}: ${preview.before.attributes[id].effective} → ${value.effective}</li>`).join('')}${preview.after.derived.filter(value => preview.before.derived.find(previous => previous.id === value.id)?.value !== value.value).map(value => `<li>${e(value.name)}: ${preview.before.derived.find(previous => previous.id === value.id)?.value ?? '—'} → ${value.value}</li>`).join('')}${preview.after.skills.filter(value => preview.before.skills.find(previous => previous.id === value.id)?.base !== value.base).map(value => `<li>${e(value.name)}: ${preview.before.skills.find(previous => previous.id === value.id)?.base ?? '—'} → ${value.base}</li>`).join('')}${['headSP','bodySP'].filter(key => preview.before.armor[key] !== preview.after.armor[key]).map(key => `<li>${key === 'headSP' ? 'Kopfschutz' : 'Körperschutz'}: ${preview.before.armor[key]} → ${preview.after.armor[key]} SP</li>`).join('')}</ul></details>${preview.errors.map(error => `<p class="notice">${e(error)}</p>`).join('')}${preview.after.cyberware.warnings.map(warning => `<p class="notice">${e(warning)}</p>`).join('')}<button class="primary" data-action="confirm-installation" ${preview.errors.length ? 'disabled' : ''}>${additions.length} Implantat${additions.length === 1 ? '' : 'e'} gemeinsam installieren</button><button class="text-button" data-action="clear-cyber-draft">Entwurf leeren</button>` : '<p class="draft-empty">Noch nichts vorgemerkt. Dein Charakter wird erst beim gemeinsamen Installieren verändert.</p>'}
    <small>Der Entwurf bleibt beim Wechsel der Kategorien erhalten. Erst installierte Cyberware wird im Browser gespeichert.</small>
  </section>`;
}

export function renderRemoval(character, rules, evaluated, state) {
  const item = evaluated.cyberware.entries.find(entry => entry.id === state.removingCyberware);
  if (!item) return '';
  const dependencies = character.cyberware.items.filter(other => other.parent === item.id || rules.cyberwareRules.items.find(definition => definition.id === other.catalogId)?.requirements?.requires?.includes(item.catalogId) && !character.cyberware.items.some(other => other.id !== item.id && other.catalogId === item.catalogId));
  return `<section class="removal-panel" id="removal-panel" tabindex="-1" aria-label="Cyberware ausbauen"><h3>${e(item.definition.name)} ausbauen</h3><p>Ein Ausbau ist ein eigener Eingriff. Der Kaufpreis wird nicht erstattet. Verlorene Menschlichkeit kommt durch den Ausbau allein nicht zurück; das erreichbare Maximum steigt wieder. Ausgebaute Teile werden hier weder weiterverkauft noch als Ersatzteile verwaltet.</p>${dependencies.length ? `<p class="notice">Baue zuerst die abhängigen Komponenten aus: ${dependencies.map(other => e(rules.cyberwareRules.items.find(entry => entry.id === other.catalogId)?.name)).join(', ')}.</p>` : ''}<form id="cyberware-removal-form"><label for="removal-fee">Vereinbarte Ausbaukosten (eb)</label><input id="removal-fee" name="fee" type="number" min="0" max="1000000" step="1" required value="${e(state.removalFee ?? '')}"><p>Preis mit der Spielleitung vereinbaren. Es wird kein pauschaler Regelbuchpreis angenommen. 0 eb ist etwa bei einer kostenlosen Behandlung möglich.</p><button class="primary" ${dependencies.length || (state.cyberDraft?.length ?? 0) ? 'disabled' : ''}>Ausbau verbindlich bestätigen</button><button class="text-button" type="button" data-action="cancel-removal">Abbrechen</button></form>${state.cyberDraft?.length ? '<p class="notice">Installiere oder leere zuerst deinen offenen Installationsentwurf.</p>' : ''}</section>`;
}
