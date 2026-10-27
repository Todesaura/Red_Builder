import {renderClothing} from './ui-clothing.js?v=budget2';
import {renderStreetDrugs} from './ui-street-drugs.js';
import {evaluateLoadout,purchaseLoadoutError} from './loadout-limits.js?v=budget2';
import {attachmentList,secondaryWeapons} from './weapon-attachments.js?v=budget2';
import {renderWeaponAttachments} from './ui-weapon-attachments.js?v=budget2';
import { netrunnerStats, NETRUNNER_GROUPS } from './netrunner.js';
import { renderNetrunnerHelp } from './ui-netrunner.js';
import { renderWeaponOptionCard,renderOwnedWeaponOptions } from './ui-weapon-options.js?v=budget2';
import { isRecommended, recommendationPriority } from './equipment-recommendations.js';
import { renderCustomEquipment } from './ui-custom-equipment.js';
import { escapeHtml as e } from './html.js';
import { weaponAmmoBundle } from './economy.js?v=budget2';
const eb = value => `${value.toLocaleString('de-DE')} eb`;
const names = { weapons: 'Waffen', armor: 'Rüstung', misc: 'Sonstiges', clothing: 'Normale Kleidung', netrunner: 'Netrunner-Waffen' };
function meleeHelp(evaluated) {
  const melee = evaluated.skills.find(skill => skill.id === 'melee-weapon');
  return `<aside class="melee-help"><h3>Nahkampfwaffen · so funktioniert’s</h3><p><strong>Treffen:</strong> ${evaluated.attributes.DEX.effective ?? '—'} (GES) + ${melee?.level ?? 0} (Nahkampfwaffen)${evaluated.roleAbilities?.bonuses.attack ? ` + ${evaluated.roleAbilities.bonuses.attack} (Solo-Präzision)` : ''} + 1W10 gegen GES + Ausweichen + 1W10 des Ziels. Dein Ergebnis muss höher sein; bei Gleichstand gewinnt die Verteidigung. Reichweite: 2 m.</p><p><strong>Schaden:</strong> Waffenschaden würfeln − aufgerundet(SP ÷ 2), mindestens 0. Kommt Schaden durch, sinkt der ursprüngliche SP des getroffenen Bereichs um 1. Dieser Verlust bleibt bis zur Reparatur bestehen.</p><p class="inline-note">Hausregel für diesen Katalog: Kampfmesser und Tomahawk sind einhändig. Ab Mittel steht links die einhändige Waffe mit 50 % Aufpreis, rechts die zweihändige. ROF gibt die möglichen Angriffe pro Angriffsaktion an.</p></aside>`;
}
function rangedHelp(evaluated) {
  const skills = ['handgun', 'shoulder-arms', 'archery', 'heavy-weapons'].map(id => evaluated.skills.find(skill => skill.id === id)).filter(Boolean);
  return `<aside class="melee-help ranged-help"><h3>Fernkampfangriffe · so funktioniert’s</h3><p><strong>Treffen:</strong> ${evaluated.attributes.REF.effective ?? '—'} (REF) + passende Waffenfertigkeit${evaluated.roleAbilities?.bonuses.attack ? ` + ${evaluated.roleAbilities.bonuses.attack} (Solo-Präzision)` : ''} + 1W10 gegen den Schwierigkeitswert (DV) für Waffentyp und Entfernung. Dein Ergebnis muss höher sein; Gleichstand verfehlt. Auch Gegner mit REF 8 oder mehr können stattdessen mit GES + Ausweichen + 1W10 ausweichen. Sie sagen das vor deinem Angriff an und würfeln zuerst; ihr Ergebnis ersetzt die Entfernungs-DV.</p><p><strong>Deine Fertigkeitsränge:</strong> ${skills.map(skill => `${e(skill.name)} ${skill.level}`).join(' · ')}. Die Karte nennt die passende Fertigkeit; deine Angriffsbasis ist REF + Fertigkeitsrang.</p><p><strong>Schaden:</strong> Bei normalen Einzelschüssen Waffenschaden würfeln − voller SP des getroffenen Bereichs, mindestens 0. Dringt Schaden durch, sinkt dessen SP um 1 bis zur Reparatur. Panzerbrechende Munition senkt ihn dabei um 2. Explosivwaffen, Schrot, Autofeuer und Unterdrückungsfeuer haben zusätzliche Regeln.</p><p class="inline-note">„Kaufen + Munition“ enthält die Waffe und einen Startvorrat: bis zu zwei Magazinfüllungen, auf volle Packungen aufgerundet und bei Granaten auf das verbleibende Limit begrenzt; beim Bogen 20 Pfeile/Bolzen. Das ist eine Einkaufshilfe, keine vorgeschriebene Einsatzmenge. Weitere passende Munition erscheint nach dem Waffenkauf.</p></aside>`;
}
function grenadeHelp(evaluated) {
  const base=(evaluated.skills.find(s=>s.id==='athletics')?.base??0)+(evaluated.roleAbilities?.bonuses.attack??0);
  return `<aside class="melee-help"><h3>Handgranaten · ohne Granatwerfer</h3><p><strong>Werfen: ${base} + 1W10 (Athletik)</strong> gegen Entfernungs-Schwierigkeit: 0–6 m: 16 · 7–12 m: 15 · 13–25 m: 15. Maximal 25 m, eine Aktion, eine Granate verbraucht. Wirkung im 10 × 10 m-Bereich. Bei Fehlschlag Abweichung nach Explosionsregeln; Deckung und zulässiges Ausweichen berücksichtigen. Keine gezielten Schüsse.</p><p>Splitter-/Brandgranaten würfeln Flächenschaden; Gas, EMP und Blendgranaten verwenden die beschriebenen Widerstandsproben. Granatwerfermunition bleibt ein eigener Kauf.</p></aside>`;
}
function buyBundle(item, character, rules, evaluated) {
  const bundle = weaponAmmoBundle(rules, item.id,character);
  if (!bundle) return '';
  const owned = id => character.equipment.items.find(entry => entry.catalogId === id)?.quantity ?? 0;
  const limitError=purchaseLoadoutError(character,rules,item.id);
  const disabled = !!limitError || evaluated.funds.remaining < bundle.cost || owned(item.id) >= 99 || owned(bundle.ammo.id) + bundle.quantity > 99;
  return `<button class="secondary" id="buy-ammo-bundle-${item.id}" data-buy-ammo-bundle="${item.id}" ${disabled ? 'disabled' : ''} aria-describedby="bundle-info-${item.id}" ${limitError?`title="${e(limitError)}"`:""}>${limitError?'Limit erreicht':'Kaufen + Munition'} · ${eb(bundle.cost)}</button>`;
}
function buy(item, character, rules, evaluated, wear = false) {
  const totalCost=item.cost+attachmentList(character,item.id).reduce((sum,a)=>sum+a.cost,0);
  const limitError=purchaseLoadoutError(character,rules,item.id);
  const disabled = !!limitError || evaluated.funds.remaining + (item.funding==='fashion'?evaluated.funds.fashionRemaining:0) < totalCost || (character.equipment.items.find(entry => entry.catalogId === item.id)?.quantity ?? 0) >= 99;
  return `<button class="secondary" id="buy-equipment-${item.id}" data-buy-equipment="${item.id}" ${wear ? `data-wear-armor="${item.slot}"` : ''} ${disabled ? 'disabled' : ''} ${limitError?`title="${e(limitError)}"`:''}>${limitError?'Limit erreicht':wear ? 'Kaufen & anlegen' : 'Kaufen +'} · ${eb(totalCost)}</button>`;
}
function armorSelection(character, rules, evaluated) {
  return `<section class="armor-loadout"><h3>Deine getragene Rüstung</h3><div class="armor-slots">${['head', 'body'].map(slot => {
    const active = evaluated.armor[slot];
    const owned = rules.equipmentRules.items.filter(item => item.category === 'armor' && item.slot === slot && character.equipment.items.some(entry => entry.catalogId === item.id));
    return `<label for="armor-${slot}"><span>${slot === 'head' ? 'Kopf' : 'Körper'} · SP ${slot === 'head' ? evaluated.armor.headSP : evaluated.armor.bodySP}</span><select id="armor-${slot}" data-armor-slot="${slot}"><option value="">Keine Rüstung</option>${owned.map(item => `<option value="${item.id}" ${active?.id === item.id ? 'selected' : ''}>${e(item.armorName)} · SP ${item.sp}</option>`).join('')}</select></label>`;
  }).join('')}</div><p><strong>Aktiver Abzug: ${evaluated.armor.penalty ? '−' + evaluated.armor.penalty : '0'} auf REF, GES und BEW.</strong> Der stärkste Abzug zählt einmal. Werte sinken höchstens auf 0. Deine Basiswerte bleiben erhalten.</p>${evaluated.armor.cyberSP ? `<p>Implantierter Schutz: SP ${evaluated.armor.cyberSP} für Kopf und Körper. Je Bereich zählt der höhere Schutzwert aus Implantat und getragener Rüstung.</p>` : ''}<p>Effektiv: REF ${evaluated.attributes.REF.effective ?? '—'} · GES ${evaluated.attributes.DEX.effective ?? '—'} · BEW ${evaluated.attributes.MOVE.effective ?? '—'}</p><details><summary>Rüstung verstehen</summary><p>SP ist der Schutzwert: Er reduziert eingehenden Schaden am geschützten Bereich. Kopf und Körper sind getrennte Käufe. Hier legst du je Bereich ein Teil an; Ersatzteile im Inventar verursachen keine Abzüge. Schutzwerte werden nicht addiert.</p><p>Verursacht ein Treffer nach Rüstung noch Schaden an deinen Lebenspunkten, sinkt der betroffene Schutzwert im Spiel normalerweise um 1. Hier erzeugst du deine unbeschädigte Startausstattung.</p></details></section>`;
}
function loadoutSummary(character,rules) {
  const loadout=evaluateLoadout(character,rules),labels={grenades:'Granaten',oneHanded:'Einhandwaffen',twoHanded:'Zweihandwaffen'};
  return `<aside class="loadout-limits" aria-label="Ausrüstungsgrenzen"><h3>Deine mitgeführten Waffen</h3><div>${Object.entries(labels).map(([id,label])=>`<span class="${loadout.counts[id]>loadout.limits[id]?'limit-error':''}">${label}: <strong>${loadout.counts[id]} / ${loadout.limits[id]}</strong></span>`).join('')}</div><p>Höchstens 3 Granaten und entweder 3 Einhandwaffen oder 2 Einhandwaffen plus 1 Zweihandwaffe. Stückzahlen zählen; Werfergranaten sind eingeschlossen. Montierte Zusatzläufe sind Teil ihrer Trägerwaffe. Ein Anschlagschaft kann die Handführung ändern.</p>${loadout.errors.length?`<p class="limit-error">${loadout.errors.map(e).join(' ')}</p>`:''}</aside>`;
}
export function renderEquipment(character, rules, evaluated, category, state = {}) {
  if(category==='drugs')return renderStreetDrugs(character,rules,evaluated,state);
  if(category==='clothing')return renderClothing(character,rules,evaluated);
  if(category==='netrunner'&&character.role!=='netrunner')return '';
  const allItems = rules.equipmentRules.items.filter(item => item.category === category);
  const ownedWeapons = allItems.filter(item => item.kind === 'weapon' && character.equipment.items.some(entry => entry.catalogId === item.id));
  const compatibleAmmo = new Set([...ownedWeapons,...secondaryWeapons(character,rules).map(e=>e.item)].flatMap(item => item.ammoIds ?? []));
  const items = allItems.filter(item => item.kind !== 'ammo' || compatibleAmmo.has(item.id));
  const grenadeGroup=item=>item.grenadeEffect?(item.grenadeEffect.military?1:0):2;
  const group = item => item.skill === 'melee-weapon' ? 0 : item.kind === 'weapon' ? 1 : item.kind === 'grenade' ? 2 : 3;
  if (category === 'weapons') items.sort((a,b) => group(a)-group(b) || (a.kind==='grenade'&&b.kind==='grenade'?grenadeGroup(a)-grenadeGroup(b):0) || recommendationPriority(character.role)(a,b) || (a.skill === 'melee-weapon' ? parseInt(a.damage)-parseInt(b.damage) || a.hands-b.hands : 0));
  else if(category==='netrunner') items.sort((a,b)=>Object.keys(NETRUNNER_GROUPS).indexOf(a.netrunner.group)-Object.keys(NETRUNNER_GROUPS).indexOf(b.netrunner.group)||recommendationPriority(character.role)(a,b)||a.cost-b.cost||a.name.localeCompare(b.name,'de'));
  else items.sort(recommendationPriority(character.role));
  const roleName = rules.roles.find(role=>role.id===character.role)?.name ?? '';
  const recommendedCount = items.filter(item=>isRecommended(character.role,item.id)).length;
  const recommendationNote = recommendedCount ? `<div class="catalog-recommendation-note"><h3>Empfehlungen für ${e(roleName)}</h3><p>Grüne Überschriften markieren Vorschläge für deine Rolle. Sie stehen im jeweiligen Bereich zuerst; du kannst weiterhin frei wählen.</p></div>` : '';
  const inventory = character.equipment.items.filter(entry => allItems.some(item => item.id === entry.catalogId));
  const cards = category === 'armor' ? items.filter(item => item.slot === 'head').map(item => {
    const pair = items.filter(entry => entry.armorType === item.armorType);
    const recommended = pair.some(part=>isRecommended(character.role,part.id));
    return `<article class="equipment-card ${recommended?'role-recommended':''}"><span class="eyebrow">SP ${item.sp} · ${item.penalty ? '−' + item.penalty : '0'} REF / GES / BEW</span><h3>${e(item.armorName)}</h3>${recommended?'<small class="role-recommendation-label">Empfehlung</small>':''}<p>${e(item.description)}</p><div class="armor-purchases">${pair.map(part => `<div><strong>${part.slot === 'head' ? 'Kopfschutz' : 'Körperrüstung'}</strong>${buy(part, character, rules, evaluated, !character.equipment.armor?.[part.slot])}</div>`).join('')}</div><small>${e(item.reference)} · Preis je Bereich</small></article>`;
  }).join('') : items.map((item, index) => {
    const skill = item.skill && evaluated.skills.find(skill => skill.id === item.skill);
    const melee = item.skill === 'melee-weapon';
    const heading = category==='netrunner'?(index===0||items[index-1].netrunner.group!==item.netrunner.group?`<h3 class="weapon-group-heading">${NETRUNNER_GROUPS[item.netrunner.group]}</h3>`:''):category !== 'weapons' || (index > 0 && group(items[index-1]) === group(item)) ? '' : group(item) === 0 ? meleeHelp(evaluated) : group(item) === 1 ? rangedHelp(evaluated) : group(item)===2 ? grenadeHelp(evaluated) : '<p class="inline-note">Nur Munition für bereits gekaufte Waffen. Eine Packung enthält die angegebene Stückzahl. Munitionssorte beim Laden wählen; Magazin nicht mischen.</p>';
    const grenadeHeading=category==='weapons'&&item.kind==='grenade'&&(items[index-1]?.kind!=='grenade'||grenadeGroup(items[index-1])!==grenadeGroup(item))?`<h3 class="weapon-group-heading">${['Normale Granaten','Militärische Granaten','Spezialgranaten'][grenadeGroup(item)]}</h3>`:'';
    const ranged = item.kind === 'weapon' && !melee;
    const start=category==='weapons'&&(index===0||group(items[index-1])!==group(item));
    const end=category==='weapons'&&(index===items.length-1||group(items[index+1])!==group(item));
    const key=['melee','ranged','grenades','ammo'][group(item)];
    const label=['Nahkampfwaffen','Fernkampfwaffen','Handgranaten','Passende Munition'][group(item)];
    const recommended = isRecommended(character.role,item.id);
    const bundle = ranged ? weaponAmmoBundle(rules, item.id,character) : null;
    return `${start?`<details class="weapon-catalog-group" data-weapon-section="${key}" ${state.weaponSections?.includes(key)?'open':''}><summary>${label} <small>${items.filter(i=>group(i)===group(item)).length} Optionen</small></summary><div class="equipment-grid">`:''}${heading}${grenadeHeading}<article class="equipment-card ${recommended?'role-recommended':''}"><span class="eyebrow">${item.netrunner?NETRUNNER_GROUPS[item.netrunner.group]:item.kind === 'ammo' ? `MUNITION · ${item.units} STÜCK` : item.kind === 'weapon' ? 'STANDARDQUALITÄT' : item.kind==='grenade'?'HANDGRANATE · 1 STÜCK':'ALLTAG & WERKZEUG'}</span><h3>${e(item.name)}</h3>${recommended?'<small class="role-recommendation-label">Empfehlung</small>':''}${melee ? `<small class="weapon-classification">(${e(item.classification)})</small>` : ''}${item.kind === 'weapon' ? `<p class="weapon-stats"><strong>${item.damage}</strong> Schaden · ROF ${item.rof} · ${item.concealable ? 'Verdeckbar' : 'Nicht verdeckbar'}${item.magazine ? ` · Magazin ${item.magazine}` : ''} · ${item.hands}-händig</p>${ranged ? `<small class="weapon-skill">${e(skill?.name ?? '')}</small>` : ''}` : ''}${item.kind==='grenade'?`<p class="weapon-stats"><strong>${item.damage==='—'?'Wirkungsgranate':item.damage+' Schaden'}</strong> · Handwurf · 1 Aktion · 1 Stück</p>`:''}${(['misc','netrunner','clothing'].includes(category)||item.kind==='grenade'||item.ammoType) ? `<p>${e(item.description)}</p>` : ''}${item.netrunner?`<p class="netrunner-stats">${e(netrunnerStats(item))}</p>`:''}${item.kind==='weapon'||item.kind==='grenade'?renderWeaponOptionCard(item,evaluated):''}<div class="weapon-buy-actions">${buy(item, character, rules, evaluated)}${ranged ? buyBundle(item, character, rules, evaluated) : ''}</div>${bundle ? `<small class="bundle-info" id="bundle-info-${item.id}">Mit Munition: ${bundle.units} × ${e(bundle.ammo.name)}</small>` : ''}<small>${e(item.reference)}${item.houseRule ? ' · Handführung/Preis: Hausregel' : ''}</small></article>${end?'</div></details>':''}`;
  }).join('');
  return `<section class="equipment-section"><div class="section-heading"><span class="section-index">↗</span><div><h2>${names[category]}</h2><p>${category === 'armor' ? 'Kopf und Körper einzeln schützen. Wähle gekaufte Rüstung oben zum Anlegen aus.' : category === 'weapons' ? 'Wähle deine Waffen und passende Munition. ROF ist die Zahl möglicher Angriffe pro Angriffsaktion; Spezialfeuermodi haben eigene Regeln.' : category==='netrunner'?'Cyberdecks, Programme, Black ICE und Hardware für deinen Netrun.':'Kommunikation, Werkzeug und nützliche Begleiter für deinen Alltag.'}</p></div></div>${category==='weapons'?loadoutSummary(character,rules):''}${category==='netrunner'?renderNetrunnerHelp(character,rules,evaluated):''}${category === 'armor' ? armorSelection(character, rules, evaluated) : ''}${category === 'misc' ? renderCustomEquipment(character, state.customEquipmentDraft) : ''}<h3>Im Inventar</h3><div class="inventory">${inventory.map(entry => {
    const item = allItems.find(item => item.id === entry.catalogId);
    const worn = Object.values(character.equipment.armor ?? {}).includes(item.id);
    return `<article><div><strong>${entry.quantity} × ${e(item.name)}${worn ? ' · angelegt' : ''}</strong><small>${eb((item.cost+attachmentList(character,item.id).reduce((sum,a)=>sum+a.cost,0)) * entry.quantity)}${item.units ? ` · ${entry.quantity * item.units} Stück` : ''}</small></div><button class="text-button" id="remove-equipment-${item.id}" data-remove-equipment="${item.id}" aria-label="Ein ${e(item.name)} entfernen">Eins entfernen −</button>${category==='weapons'?renderWeaponAttachments(character,item,rules,evaluated,state):''}</article>`;
  }).join('') || '<p class="empty-results">Hier ist dein Inventar noch leer.</p>'}</div>${category==='weapons'?renderOwnedWeaponOptions(character,rules,evaluated):''}<h3>Zum Kaufen</h3>${recommendationNote}<div class="${category==='weapons'?'weapon-catalog':'equipment-grid'}">${cards}</div><p class="inline-note">Entfernen korrigiert deinen Startkauf und gibt das Geld zurück. Wird das letzte Exemplar einer getragenen Rüstung entfernt, legst du sie automatisch ab.</p><a class="chrome-source" href="${e(rules.equipmentRules.source)}" target="_blank" rel="noopener noreferrer">Preise: offizieller RTG Night Market Index ↗</a></section>`;
}
