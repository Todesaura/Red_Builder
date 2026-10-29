import {cyberwareQuickOffer} from './cyberware-quick-add.js?v=shopping1';
import {draftCharacter} from './cyberware-draft.js?v=shopping1';
import {escapeHtml as e} from './html.js';

export function needsCyberwareSide(rules,id){
 const slots=rules.cyberwareRules.items.find(i=>i.id===id)?.installationSlots??[];
 return ['eye','arm','leg'].some(type=>slots.includes(type+'-left')&&slots.includes(type+'-right'));
}

function occupancy(character,rules,location){
 const entries=character.cyberware.items.filter(i=>i.location===location);
 const base=entries.map(i=>rules.cyberwareRules.items.find(d=>d.id===i.catalogId)).find(d=>d.foundation);
 const capacity=base?.capacity??rules.cyberwareRules.locations.find(l=>l.id===location).capacity;
 const used=entries.reduce((n,i)=>{const d=rules.cyberwareRules.items.find(d=>d.id===i.catalogId);return n+(d.foundation?0:d.slots??1);},0);
 return {base,capacity,used,names:entries.map(i=>rules.cyberwareRules.items.find(d=>d.id===i.catalogId).name)};
}

export function renderCyberwareSide(character,rules,state){
 const id=state.cyberPlacement?.id, item=rules.cyberwareRules.items.find(i=>i.id===id);
 if(!item)return '';
 const additions=state.cyberDraft??[],projected=draftCharacter(character,additions);
 return `<dialog id="cyber-side-dialog" class="cyber-side-dialog" aria-labelledby="cyber-side-title"><h2 id="cyber-side-title">${e(item.name)} · welche Seite?</h2><p>Wähle den Einbauort. Erst deine Auswahl übernimmt ${state.sessionMode?'das Implantat in den Session-Entwurf':'den Kauf und Einbau'}.</p><div class="cyber-side-options">${item.installationSlots.filter(l=>/^(eye|arm|leg)-(left|right)$/.test(l)).map(location=>{
  const before=occupancy(projected,rules,location),offer=cyberwareQuickOffer(character,rules,additions,id,location);
  const after=offer.additions?occupancy(draftCharacter(character,offer.additions),rules,location):null;
  const label=rules.cyberwareRules.locations.find(l=>l.id===location).name;
  const owned=state.sessionMode&&character.campaign?.cyberInventory?.some(i=>i.id===state.cyberPlacement.ownedId&&i.catalogId===id);
  const price=offer.cost===undefined?undefined:offer.cost-(owned?item.cost:0);
  return `<article><h3>${e(label)}</h3><p><strong>Verbaut:</strong> ${e(before.names.join(', ')||'Noch nichts')}</p><p>${before.base?`${before.used} / ${before.capacity} Optionsplätze belegt · ${Math.max(0,before.capacity-before.used)} frei`:`Natürlicher Bereich · ${Math.max(0,before.capacity-before.used)} Basisplatz frei`}</p>${offer.bases?.length?`<p class="side-base">Wird mitgekauft: ${e(offer.bases.map(b=>b.name).join(', '))}</p>`:''}${after?`<p><strong>Nach Einbau:</strong> ${Math.max(0,after.capacity-after.used)} / ${after.capacity} ${after.base?'Optionsplätze':'Plätze'} frei</p>`:''}${!offer.ok?`<p class="notice">${e(offer.error)}</p>`:''}<button type="button" class="primary" data-confirm-cyber-location="${location}" ${!offer.ok?'disabled':''}>${e(label)} wählen${price!==undefined?' · '+price.toLocaleString('de-DE')+' eb':''}</button></article>`;
 }).join('')}</div><button type="button" class="secondary" data-action="cancel-cyber-placement">Abbrechen</button></dialog>`;
}
