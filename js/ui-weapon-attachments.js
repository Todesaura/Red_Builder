import {attachmentLoadoutError} from './loadout-limits.js?v=shopping1';
import {ATTACHMENTS,attachmentList,canAttach,weaponConfiguration,attachmentConflict,attachmentRuleText,COMMUNITY_SOURCE} from './weapon-attachments.js?v=shopping1';
import {escapeHtml as e} from './html.js';
export function renderWeaponAttachments(character,item,rules,evaluated,state={}) {
  if(item.kind!=='weapon'||item.skill==='melee-weapon')return '';
  const owned=attachmentList(character,item.id),slots=owned.reduce((n,a)=>n+a.slots,0),config=weaponConfiguration(character,item);
  const quantity=character.equipment.items.find(i=>i.catalogId===item.id)?.quantity??1;
  return `<details class="weapon-attachments" data-weapon-section="attach-${item.id}" ${state.weaponSections?.includes('attach-'+item.id)?'open':''}><summary>Waffe erweitern · ${slots}/3 Montageplätze</summary><p>Konfiguration je Waffentyp. Bei mehreren Exemplaren gelten Aufsätze und Kosten für jedes Exemplar. Entfernen korrigiert den Startkauf und erstattet den Preis.</p>${owned.map(a=>`<div class="attachment-row"><div><strong>${e(a.name)}</strong><small>${e(attachmentRuleText(a,config,evaluated))}</small></div><button class="text-button" data-detach-weapon="${item.id}" data-attachment="${a.id}" ${attachmentLoadoutError(character,rules,item.id,a.id,true)?`disabled title="${e(attachmentLoadoutError(character,rules,item.id,a.id,true))}"`:""}>Entfernen −</button></div>`).join('')}<p class="inline-note">Der erweiterte Katalog übernimmt angepasste <a href="${COMMUNITY_SOURCE}" target="_blank" rel="noopener noreferrer">Community-Ideen</a>. Feste Änderungen gelten in den Waffenwerten; bedingte Boni stehen beim Aufsatz. Situative Aufsatz-Zielboni nicht addieren; Waffenpräzision aus Smartgun/Griff/Anschlagschaft höchstens +1.</p>${Object.entries({standard:'Standardaufsätze',barrel:'Läufe & Feueroptionen',optics:'Visiere & Bildübertragung',handling:'Griffe, Schäfte & Tragesysteme',security:'Sicherung, Injektor & Tarnung',loading:'Magazine & Schnellladen',style:'Finish & Licht'}).map(([section,label])=>{
    const choices=ATTACHMENTS.filter(a=>(a.section??'standard')===section&&canAttach(item,a)&&!owned.some(o=>o.id===a.id));
    if(!choices.length)return '';
    const key='attach-'+item.id+'-'+section;
    return `<details class="attachment-group" data-weapon-section="${key}" ${state.weaponSections?.includes(key)?'open':''}><summary>${label} · ${choices.length}</summary><div class="attachment-choices">${choices.map(a=>{
      const limitError=attachmentLoadoutError(character,rules,item.id,a.id);
      const reason=attachmentConflict(owned,a)||(limitError?'Tragegrenze erreicht':'')||(evaluated.funds.remaining<a.cost*quantity?'Zu wenig Geld':'');
      return `<article><strong>${e(a.name)}</strong>${a.use?`<span class="attachment-use">${e(a.use)}</span>`:''}<small>${(a.cost*quantity).toLocaleString('de-DE')} eb · ${a.slots} ${a.slots===1?'Platz':'Plätze'} · ${e(a.description)}</small><button class="secondary" data-attach-weapon="${item.id}" data-attachment="${a.id}" ${reason?'disabled':''} ${limitError?`title="${e(limitError)}"`:''}>${reason||`Hinzufügen · ${(a.cost*quantity).toLocaleString('de-DE')} eb`}</button></article>`;
    }).join('')}</div></details>`;
  }).join('')}</details>`;
}
