import {escapeHtml as e} from './html.js';

export function renderWornArmor(evaluated) {
  return `<section class="armor-loadout"><h3>Deine getragene Rüstung</h3><div class="armor-slots">${['head', 'body'].map(slot => {
    const active = evaluated.armor[slot];
    return `<div><strong>${slot === 'head' ? 'Kopf' : 'Körper'}</strong><span>${active ? `${e(active.armorName)} · SP ${active.sp}` : 'Keine Rüstung'}</span></div>`;
  }).join('')}</div><p><strong>Aktiver Abzug: ${evaluated.armor.penalty ? '−' + evaluated.armor.penalty : '0'} auf REF, GES und BEW.</strong></p>${evaluated.armor.cyberSP ? `<p>Implantierter Schutz: SP ${evaluated.armor.cyberSP} für Kopf und Körper. Je Bereich zählt der höhere Schutzwert aus Implantat und getragener Rüstung.</p>` : ''}<p>Effektiv: REF ${evaluated.attributes.REF.effective ?? '—'} · GES ${evaluated.attributes.DEX.effective ?? '—'} · BEW ${evaluated.attributes.MOVE.effective ?? '—'}</p><details><summary>Rüstung verstehen</summary><p>Der stärkste Abzug zählt einmal. Werte sinken höchstens auf 0. Deine Basiswerte bleiben erhalten.</p><p>SP ist der Schutzwert: Er reduziert eingehenden Schaden am geschützten Bereich. Du kannst je einen Kopf- und Körperschutz kaufen. Entferne das bisherige Teil, um es zu wechseln. Schutzwerte werden nicht addiert.</p><p>Verursacht ein Treffer nach Rüstung noch Schaden an deinen Lebenspunkten, sinkt der betroffene Schutzwert im Spiel normalerweise um 1. Hier erzeugst du deine unbeschädigte Startausstattung.</p></details></section>`;
}
