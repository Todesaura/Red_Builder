import {CRITICAL_INJURIES} from './critical-injuries.js';
import {escapeHtml as e} from './html.js';

export function renderCriticalControls(character,state) {
  const active=character.campaign.injuries.filter(i=>['active','quickfix'].includes(i.status));
  return `<div class="play-tracker-actions"><button type="button" class="secondary" data-play-critical="head">Kritisch getroffen Kopf</button><button type="button" class="secondary" data-play-critical="body">Kritisch getroffen Körper</button></div>${active.length?`<h4>Aktive Verletzungen</h4><ul>${active.map(i=>`<li><strong>${e(i.name)}</strong>${i.notes?`<p>${e(i.notes)}</p>`:''}</li>`).join('')}</ul><small>Verletzungseffekte im Spiel berücksichtigen; sie werden nicht automatisch in die Würfelwerte eingerechnet. Behandlung unter „Nach dem Einsatz“.</small>`:''}`;
}

export function renderCriticalDialog(state) {
  const slot=state.playCriticalSlot,items=CRITICAL_INJURIES[slot];
  if(!items)return '';
  return `<dialog id="play-critical-dialog" class="play-critical-dialog" aria-labelledby="play-critical-title"><h2 id="play-critical-title">Kritischer Treffer · ${slot==='head'?'Kopf':'Körper'}</h2><form data-play-form="critical" data-play-slot="${slot}"><label for="play-critical-injury">Was ist passiert?</label><select id="play-critical-injury" name="injury" required><option value="">Verletzung der Spielleitung auswählen …</option>${items.map(([id,name])=>`<option value="${id}">${e(name)}</option>`).join('')}</select><label for="play-critical-notes">Details / Folgen (optional)</label><textarea id="play-critical-notes" name="notes" maxlength="800" placeholder="Zum Beispiel: ${slot==='head'?'linkes Auge':'linkes Bein'}, konkrete Abzüge oder Todesrettungsmodifikator"></textarea><label class="play-critical-bonus"><input type="checkbox" name="addBonus" checked> 5 kritische Zusatzschaden jetzt abziehen</label><p>Haken entfernen, wenn die 5 TP bereits im eingetragenen TP-Verlust enthalten sind. Diese Zusatzschaden ignorieren Rüstung und werden bei Kopftreffern nicht verdoppelt. Normalen Waffenschaden separat erfassen.</p><small>Grundregelwerk S. 187–188. Verletzung und Folgen mit der Spielleitung festlegen; wiederholte Verletzungen nach den Tabellenregeln behandeln.</small><div class="play-tracker-actions"><button type="submit" class="primary">Verletzung übernehmen</button><button type="button" class="secondary" data-play-critical-cancel="true">Abbrechen</button></div></form></dialog>`;
}
