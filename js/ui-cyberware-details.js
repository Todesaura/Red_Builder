import { attributeLabel, localizeAttributeText } from './attribute-labels.js';
import { escapeHtml as e } from './html.js';
const money=n=>`${n.toLocaleString('de-DE')} eb`;
const place=(rules,id)=>rules.cyberwareRules.locations.find(location=>location.id===id)?.name??id;
export function requirementText(item,rules) {
  const required=item.requirements??{}, texts=[];
  const types={arm:'Cyberarm',leg:'Cyberbein',eye:'Cyberauge',neural:'Neural Link',audio:'Cyberaudio-Basisimplantat'};
  if(required.maxInstalled)texts.push(`Höchstens ${required.maxInstalled} Exemplar pro Charakter.`);
  if(required.parentType) texts.push(`Benötigt ein kompatibles Basisimplantat: ${types[required.parentType]??required.parentType}.${required.allowNatural ? ' Alternativ allein in einer natürlichen Gliedmaße.' : ''}`);
  for(const id of required.requires??[]) texts.push(`Benötigt ${rules.cyberwareRules.items.find(entry=>entry.id===id)?.name??id}.`);
  for(const [id,value] of Object.entries(required.minimumStats??{})) texts.push(`Mindestens ${attributeLabel(id)} ${value} als Basiswert.`);
  if(required.naturalLimbOnly) texts.push('Hier als einzige Cyberware in einer natürlichen Gliedmaße installierbar.');
  if(required.exclusive) texts.push('Eine weitere Installation derselben exklusiven Funktion ist nicht möglich.');
  if(required.incompatible?.length) texts.push('Nicht kombinierbar mit: '+required.incompatible.map(id=>rules.cyberwareRules.items.find(entry=>entry.id===id)?.name??id).join(', ')+'.');
  if(item.unavailable) texts.push(item.unavailable);
  if(item.categoryReview) texts.push('Kategorie muss anhand der Quelle geprüft werden: '+item.categoryReview);
  return texts.length?texts:['Kein zusätzliches Basisimplantat erforderlich.'];
}
export function renderImplantDetail(item,rules) {
  const effects=(item.effects??[]).map(effect=>effect.description??`${effect.value>=0?'+':''}${effect.value} auf ${attributeLabel(effect.target)}`);
  if(item.lightTattoo) effects.push('Zählt als eine Light-Tattoo-Installation; drei entsprechende Installationen gewähren zusammen einmal +2 auf Garderobe / Stil.');
  return `<div class="implant-detail" id="implant-detail-${item.id}"><h3>${e(item.name)} · Details</h3><p>${e(localizeAttributeText(item.description))}</p><dl><dt>Regeltechnischer Effekt</dt><dd>${e(localizeAttributeText(effects.join(' ')||item.description))}</dd><dt>Voraussetzungen</dt><dd>${requirementText(item,rules).map(text=>e(text)).join('<br>')}</dd><dt>Installationsbereiche</dt><dd>${e(item.installationSlots.map(id=>place(rules,id)).join(', '))}</dd><dt>Kapazität</dt><dd>${item.foundation?`Basisimplantat mit ${item.capacity} Optionsplätzen`:`${item.slots??1} Platz${(item.slots??1)===1?'':'e'} im jeweiligen Installationsbereich`}</dd><dt>Menschlichkeit</dt><dd>−${item.humanity} bei Charaktererstellung · erreichbares Maximum −${item.maxHumanityLoss}</dd><dt>Sonstige Modifikatoren</dt><dd>${e(effects.join(' ')||'Keine zusätzlichen numerischen Modifikatoren hinterlegt.')}</dd><dt>Einbau</dt><dd>${e(item.install)}</dd></dl><a href="${e(rules.cyberwareRules.sources[item.sourceId]?.url??'#')}" target="_blank" rel="noopener noreferrer">${e(item.source)} ↗</a><button class="text-button" data-action="clear-cyber-selection">Details schließen ×</button></div>`;
}
export function renderInstalledCyberware(evaluated,rules) {
  const entries=evaluated.cyberware.entries, visited=new Set();
  const render=(item,child=false)=>{
    if(visited.has(item.id))return '';visited.add(item.id);
    const definition=item.definition;
    const children=entries.filter(other=>other.parent===item.id);
    return `<li class="installed-entry ${child?'installed-child':''}"><div class="installed-main"><strong>${e(definition.name)}</strong><span class="installed-location">${e(place(rules,item.location))} · ${definition.foundation?`Basis · ${children.reduce((sum,child)=>sum+(child.definition.slots??1),0)} / ${definition.capacity} Optionsplätze belegt`:`${definition.slots??1} Platz${(definition.slots??1)===1?'':'e'}`}</span><details class="installed-info" id="installed-info-${item.id}"><summary>Wirkung und Details</summary><small>Menschlichkeit −${definition.humanity} · Maximum −${definition.maxHumanityLoss}${definition.lightTattoo?' · Light Tattoo':''}</small><small>${e(localizeAttributeText(definition.description))}</small>${definition.effects?.length?`<small>${e(definition.effects.map(effect=>effect.description??`${effect.value>=0?'+':''}${effect.value} auf ${attributeLabel(effect.target)}`).join(' '))}</small>`:''}</details></div><button id="remove-cyberware-${item.id}" class="secondary installed-remove" data-remove-cyberware="${item.id}" aria-label="${e(definition.name)} ausbauen">${evaluated.cyberware.canUndoPurchases?'Kostenlos entfernen':'Ausbaukosten ansehen'}</button>${children.length?`<ul aria-label="Erweiterungen von ${e(definition.name)}">${children.map(child=>render(child,true)).join('')}</ul>`:''}</li>`;
  };
  const roots=entries.filter(item=>!item.parent||!entries.some(other=>other.id===item.parent));
  const html=roots.map(item=>render(item)).join('')+entries.filter(item=>!visited.has(item.id)).map(item=>render(item)).join('');
  return `<section class="installed-cyberware" id="installed-cyberware" tabindex="-1" aria-label="Installierte Cyberware"><div class="installed-heading"><h2>Installierte Cyberware <span>${entries.length}</span></h2><small>${evaluated.cyberware.canUndoPurchases?'Vor der ersten Session kostenlos entfernbar · Kaufpreis und Menschlichkeit werden zurückgerechnet':'Fest eingebaut · Ausbau als eigener Eingriff, ohne Kaufpreiserstattung'}</small></div><p class="installed-instructions">${evaluated.cyberware.canUndoPurchases?'Jede Karte zeigt Name und Einbauort. Mit „Kostenlos entfernen“ machst du den Startkauf rückgängig. Erweiterungen stehen unter ihrem Basisimplantat.':'Jede Karte zeigt Name und Einbauort. „Ausbaukosten ansehen“ öffnet den Eingriff mit Kostenbestätigung. Bei einem Kampagnencharakter erfolgt der Ausbau unter „Nach dem Einsatz → Cyberware“.'}</p>${html?`<ul class="installed-list">${html}</ul>`:'<p>Noch keine Cyberware installiert. Dein Charakter kann auch ohne Implantate starten.</p>'}${evaluated.cyberware.removed?.length?`<details class="removal-history"><summary>Bisherige Ausbauten (${evaluated.cyberware.removed.length})</summary><p>Kaufkosten und Menschlichkeitsverlust bleiben berücksichtigt. Ersatzteile, Wiederverwendung und Verkauf werden hier nicht verwaltet.</p><ul>${evaluated.cyberware.removed.map(item=>`<li>${e(item.definition.name)} · Ausbau ${money(item.fee)}</li>`).join('')}</ul></details>`:''}${[...evaluated.cyberware.errors,...evaluated.cyberware.warnings].map(error=>`<p class="notice" role="alert">${e(error)}</p>`).join('')}</section>`;
}
