import {renderWornArmor} from './ui-armor-loadout.js?v=shoplabels1';
import {armorPurchaseError} from './armor.js?v=shopcompact1';
import {fundingPrice} from './ui-funding.js?v=inline1';
import {renderClothing} from './ui-clothing.js?v=shopcompact1';
import {renderStreetDrugs} from './ui-street-drugs.js?v=shopcompact1';
import {evaluateLoadout,purchaseLoadoutError} from './loadout-limits.js?v=shopping1';
import {attachmentList,secondaryWeapons,weaponConfiguration} from './weapon-attachments.js?v=shopping1';
import {renderWeaponAttachments} from './ui-weapon-attachments.js?v=shopping1';
import {netrunnerStats,NETRUNNER_GROUPS} from './netrunner.js';
import {renderNetrunnerHelp} from './ui-netrunner.js';
import {renderWeaponOptionCard} from './ui-weapon-options.js?v=weaponhelp1';
import {isRecommended,recommendationPriority} from './equipment-recommendations.js';
import {renderCustomEquipment} from './ui-custom-equipment.js?v=shopcompact1';
import {escapeHtml as e} from './html.js';
import {weaponAmmoBundle} from './economy.js?v=shopcompact1';

const names={weapons:'Waffen',armor:'Rüstung',misc:'Sonstiges',netrunner:'Netrunner-Waffen'};
const recommendationLabel='<small class="role-recommendation-label">Empfehlung</small>';
const groupOf=item=>item.skill==='melee-weapon'?'melee':item.kind==='weapon'?'ranged':item.kind==='grenade'?'grenades':'ammo';
const grenadeGroups=['Normale Granaten','Militärische Granaten','Spezialgranaten'];
const grenadeGroup=item=>item.grenadeEffect?(item.grenadeEffect.military?1:0):2;
const weaponGroups={
  melee:['Nahkampfwaffen','Gegen GES + Ausweichen + 1W10 des Ziels würfeln. Gleichstand verteidigt. Reichweite 2 m. Vom Schaden den halben SP (aufgerundet) abziehen. Bei Durchdringung verliert der getroffene Bereich 1 SP.'],
  ranged:['Fernkampfwaffen','Gegen die Schwierigkeit der Entfernung würfeln. Ziele ab REF 8 können vorher Ausweichen ansagen. Ihr Wurf aus GES + Ausweichen + 1W10 ersetzt die Schwierigkeit. Bei normalen Treffern vollen SP abziehen.'],
  grenades:['Handgranaten','Mit Athletik bis zu 25 m werfen. Kein Werfer nötig.'],
  ammo:['Munition','Passende Sorten erscheinen beim Waffenkauf. Im Magazin nur eine Sorte laden.']
};

function remove(item){
  const label=item.kind==='ammo'?'Packung entfernen':'Entfernen';
  return `<button type="button" class="text-button" id="remove-equipment-${item.id}" data-remove-equipment="${item.id}" aria-label="${label}: ${e(item.name)}">${label} −</button>`;
}

const unitCost=(character,item)=>item.cost+attachmentList(character,item.id).reduce((sum,attachment)=>sum+attachment.cost,0);

function controls(item,character,rules,evaluated,quantity,{allowRemove=true,bundle=null}={}){
  const cost=unitCost(character,item);
  const armorError=armorPurchaseError(character,rules,item);
  const limit=purchaseLoadoutError(character,rules,item.id);
  const available=evaluated.funds.remaining+(item.funding==='fashion'?evaluated.funds.fashionRemaining:0);
  const reason=armorError??limit;
  const wear=item.category==='armor';
  const buy=!(wear&&quantity)?`<button type="button" class="secondary" id="buy-equipment-${item.id}" data-buy-equipment="${item.id}" ${wear?`data-wear-armor="${item.slot}"`:''} ${reason||available<cost||quantity>=99?'disabled':''} ${reason?`title="${e(reason)}"`:''}>${armorError?'Platz belegt':limit?'Limit erreicht':wear?'Kaufen & anlegen':'Kaufen'} · ${fundingPrice([{cost,funding:item.funding}],evaluated.funds)}</button>`:'';
  const ammoQuantity=bundle?character.equipment.items.find(entry=>entry.catalogId===bundle.ammo.id)?.quantity??0:0;
  const packageButton=bundle?`<button type="button" class="secondary" id="buy-ammo-bundle-${item.id}" data-buy-ammo-bundle="${item.id}" ${limit||available<bundle.cost||quantity>=99||ammoQuantity+bundle.quantity>99?'disabled':''} aria-describedby="bundle-info-${item.id}">Kaufen + Munition · ${fundingPrice([{cost:bundle.cost}],evaluated.funds)}</button><small class="bundle-info" id="bundle-info-${item.id}">${bundle.units} × ${e(bundle.ammo.name)}</small>`:'';
  return `<div class="weapon-buy-actions">${buy}${packageButton}${allowRemove&&quantity?remove(item):''}</div>`;
}

export function renderEquipment(character,rules,evaluated,category,state={}){
  if(category==='drugs')return renderStreetDrugs(character,rules,evaluated);
  if(category==='clothing')return renderClothing(character,rules,evaluated);
  if(category==='netrunner'&&character.role!=='netrunner')return '';
  const owned=new Map(character.equipment.items.map(entry=>[entry.catalogId,entry.quantity]));
  const priority=recommendationPriority(character.role);
  const all=rules.equipmentRules.items.filter(item=>item.category===category).sort(priority);
  const extras=category==='weapons'?secondaryWeapons(character,rules):[];
  const compatibleAmmo=new Set([...all.filter(item=>item.kind==='weapon'&&owned.has(item.id)),...extras.map(entry=>entry.item)].flatMap(item=>item.ammoIds??[]));
  const items=all.filter(item=>item.kind!=='ammo'||compatibleAmmo.has(item.id));
  const weaponStock=category==='weapons'?all.filter(item=>owned.has(item.id)):[];
  const extrasFor=item=>extras.filter(entry=>entry.item.parentWeaponId===item.id);
  const grid=content=>`<div class="equipment-grid">${content}</div>`;

  function card(item){
    const quantity=owned.get(item.id)??0;
    const recommended=isRecommended(character.role,item.id);
    const weapon=item.kind==='weapon',grenade=item.kind==='grenade',ammo=item.kind==='ammo';
    const configured=weapon?weaponConfiguration(character,item):item;
    const bundle=weapon&&item.skill!=='melee-weapon'?weaponAmmoBundle(rules,item.id,character):null;
    const heading=weapon||grenade?renderWeaponOptionCard(configured,evaluated,extrasFor(item),null,state.weaponSections):`<h3>${e(item.name)}</h3>`;
    const stats=weapon?[`<strong>${e(configured.damage)}</strong>`,`ROF ${configured.rof}`,`${configured.hands}-händig`,configured.concealable?'verdeckbar':null,configured.magazine?`Magazin ${configured.magazine}`:null].filter(Boolean).join(' · '):
      grenade?(item.damage==='—'?'Wirkungsgranate':`${e(item.damage)} Schaden`):ammo?`${item.units} pro Packung`:item.netrunner?e(netrunnerStats(item)):'';
    return `<article class="equipment-card shop-card ${recommended?'role-recommended':''}">
      ${heading}${recommended?recommendationLabel:''}${weapon&&item.classification?`<small>${e(item.classification)}</small>`:''}
      ${stats?`<p class="weapon-stats">${stats}</p>`:''}${(!weapon&&!grenade&&!ammo||ammo&&item.ammoType&&item.ammoType!=='basic')?`<p>${e(item.description)}</p>`:''}
      ${quantity&&category!=='weapons'?`<p class="shop-quantity">${quantity} × vorhanden</p>`:''}
      ${controls(item,character,rules,evaluated,quantity,{allowRemove:category!=='weapons',bundle})}
    </article>`;
  }

  function armorCard(item){
    const parts=items.filter(part=>part.armorType===item.armorType);
    const recommended=parts.some(part=>isRecommended(character.role,part.id));
    return `<article class="equipment-card shop-card ${recommended?'role-recommended':''}">
      <h3>${e(item.armorName)}</h3>${recommended?recommendationLabel:''}<p>SP ${item.sp}${item.penalty?` · −${item.penalty} REF / GES / BEW`:''}</p>
      <div class="armor-purchases">${parts.map(part=>{
        const quantity=owned.get(part.id)??0;
        const worn=character.equipment.armor?.[part.slot]===part.id;
        const wear=quantity&&!worn?`<button type="button" class="secondary" data-equip-armor="${part.id}" data-wear-armor="${part.slot}">Anlegen</button>`:'';
        return `<div><strong>${part.slot==='head'?'Kopf':'Körper'}${quantity?` · ${worn?'angelegt':'gekauft'}${quantity>1?` (${quantity} ×)`:''}`:''}</strong>${wear}${controls(part,character,rules,evaluated,quantity)}</div>`;
      }).join('')}</div></article>`;
  }

  function weaponGroup(key,label,help){
    const entries=items.filter(item=>groupOf(item)===key);
    if(!entries.length)return '';
    if(key==='melee')entries.sort((a,b)=>priority(a,b)||parseInt(a.damage)-parseInt(b.damage)||a.hands-b.hands);
    const content=key==='grenades'?grenadeGroups.map((name,index)=>{
      const grenades=entries.filter(item=>grenadeGroup(item)===index);
      return grenades.length?`<h3 class="weapon-group-heading">${name}</h3>${grenades.map(card).join('')}`:'';
    }).join(''):entries.map(card).join('');
    return `<details class="weapon-catalog-group" data-weapon-section="${key}" ${state.weaponSections?.includes(key)?'open':''}><summary>${label} <small>${entries.length} Optionen</small></summary>${grid(`<details class="shop-group-help" id="shop-help-${key}"><summary>Regeln kurz erklärt</summary><p>${help}</p></details>${content}`)}</details>`;
  }

  const loadout=category==='weapons'?evaluateLoadout(character,rules):null;
  const limits=loadout?`<p class="shop-limits">Einhandwaffen: <strong>${loadout.counts.oneHanded} / ${loadout.limits.oneHanded}</strong> · Zweihandwaffen: <strong>${loadout.counts.twoHanded} / ${loadout.limits.twoHanded}</strong> · Granaten: <strong>${loadout.counts.grenades} / ${loadout.limits.grenades}</strong></p>${loadout.errors.length?`<p class="limit-error">${loadout.errors.map(e).join(' ')}</p>`:''}`:'';
  const custom=category==='misc'?`<details class="shop-custom" id="shop-custom-equipment"><summary class="secondary">Eigene Ausrüstung${character.equipment.custom?.length?` (${character.equipment.custom.length})`:''}</summary>${renderCustomEquipment(character,state.customEquipmentDraft)}</details>`:'';
  const netrunner=category==='netrunner'?`<details class="shop-group-help" id="shop-net-help"><summary>Netzregeln nachschlagen</summary>${renderNetrunnerHelp(character,rules,evaluated)}</details>`:'';
  const purchases=weaponStock.length?`<section class="shop-bought-weapons" aria-labelledby="shop-bought-title">
    <h3 id="shop-bought-title">Im Inventar</h3>
    <div class="inventory">${weaponStock.filter(item=>item.kind!=='ammo').map(item=>`<article>
      <div class="stock-weapon-name">${renderWeaponOptionCard(item.kind==='weapon'?weaponConfiguration(character,item):item,evaluated,extrasFor(item),owned.get(item.id),state.weaponSections)}
        <small>${(unitCost(character,item)*owned.get(item.id)).toLocaleString('de-DE')} eb</small></div>
      ${remove(item)}${renderWeaponAttachments(character,item,rules,evaluated,state)}
    </article>`).join('')}</div>
    ${weaponStock.some(item=>item.kind==='ammo')?`<div class="shop-ammo-stock"><h4>Munition</h4><ul>
      ${weaponStock.filter(item=>item.kind==='ammo').map(item=>`<li><span>${e(item.name)} <strong>${owned.get(item.id)*item.units-(character.campaign?.ammoSpent?.[item.id]??0)} Stück</strong></span>${remove(item)}</li>`).join('')}
    </ul></div>`:''}
  </section>`:'';
  const cards=category==='weapons'?Object.entries(weaponGroups).map(([key,[label,help]])=>weaponGroup(key,label,help)).join(''):
    category==='armor'?grid(items.filter(item=>item.slot==='head').map(armorCard).join('')):
    category==='netrunner'?Object.entries(NETRUNNER_GROUPS).map(([key,label])=>`<details class="weapon-catalog-group" id="shop-net-${key}"><summary>${e(label)}</summary>${grid(items.filter(item=>item.netrunner.group===key).map(card).join(''))}</details>`).join(''):grid(items.map(card).join(''));
  return `<section class="equipment-section compact-shop"><div class="section-heading"><div><h2>${names[category]}</h2>${category==='armor'?'<p>Ein Kopfschutz und eine Körperpanzerung pro Charakter.</p>':''}</div></div>${limits}${category==='armor'?renderWornArmor(evaluated):''}${custom}${netrunner}${purchases}${cards}</section>`;
}
