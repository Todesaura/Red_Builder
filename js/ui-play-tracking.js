import {renderCriticalControls,renderCriticalDialog} from './ui-play-critical.js';
import {renderMagazines} from './ui-play-magazines.js?v=magazines1';
import {ammunitionRemaining} from './play-tracking.js?v=critical1';
import {escapeHtml as e} from './html.js';

export function renderPlayTracking(character,rules,v,state) {
  const button=(label,attrs,disabled=false)=>`<button type="button" class="secondary" ${attrs} ${disabled?'disabled':''}>${label}</button>`;
  const ammo=rules.equipmentRules.items.filter(item=>item.kind==='ammo'&&ammunitionRemaining(character,item)>0);
  const armor=(slot,label)=>{
    const worn=v.armor[slot],cyber=v.armor[slot==='head'?'cyberHeadSP':'cyberBodySP'];
    const controls=(implant,sp)=>`<div class="play-tracker-actions">${[1,2].map(n=>button(`−${n} SP`,`data-play-type="armor" data-play-slot="${slot}" data-play-amount="${n}" ${implant?'data-play-implant="true"':''}`,sp<=0)).join('')}</div>`;
    return `<div><h4>${label} · effektiv SP ${v.armor[slot+'SP']}</h4>${worn?`<p>${e(worn.name)}: <strong>SP ${worn.sp}</strong></p>${controls(false,worn.sp)}`:'<p>Keine Rüstung angelegt.</p>'}${v.armor.cyberSP?`<p>Implantierter Schutz: <strong>SP ${cyber}</strong></p>${controls(true,cyber)}`:''}</div>`;
  };
  return `<section class="play-panel play-tracking" aria-label="Spielstand verfolgen"><div class="play-heading"><h3>Spielstand verfolgen</h3>${button('Letzte Änderung zurücknehmen','data-play-undo="true"',!state.playUndo)}</div><p class="inline-note">Wird im Charakter gespeichert und ist beim nächsten JSON-Export enthalten. Bereits hier erfassten Verbrauch im Session-Bericht nicht nochmals abziehen.</p><div class="play-tracker-grid"><section><h4>Trefferpunkte · ${v.health.current} / ${v.health.maximum}</h4><form data-play-form="damage"><label for="play-damage">TP-Verlust nach Rüstung</label><div class="play-tracker-actions"><input id="play-damage" name="amount" type="number" min="1" max="10000" step="1" value="1" required><button class="primary" type="submit">Schaden abziehen</button></div></form>${renderCriticalControls(character,state)}${v.health.current<=0?'<p class="notice" role="alert">Sterbend: Todesrettungen und Stabilisierung beachten!</p>':v.health.current<=(v.derived.find(d=>d.id==='wound')?.value??0)?'<p class="notice">Schwer verwundet: −2 auf Aktionsproben. Dieser situative Abzug ist in den Würfen unten nicht enthalten.</p>':''}</section><section><h4>Rüstung abnutzen</h4><p class="inline-note">Getroffenen Bereich wählen. −1 SP oder −2 SP nach der verwendeten Munition/Wirkung. TP-Schaden getrennt abziehen.</p>${armor('head','Kopf')}${armor('body','Körper')}</section><section>${renderMagazines(character,rules)}</section></div>${renderCriticalDialog(state)}</section>`;
}
