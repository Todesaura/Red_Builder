import {escapeHtml as e} from './html.js';

const duration=seconds=>seconds%3600===0?`${seconds/3600} ${seconds===3600?'Stunde':'Stunden'}`:seconds%60===0?`${seconds/60} ${seconds===60?'Minute':'Minuten'}`:`${seconds} Sekunden (${seconds/3} Runden)`;
const combatChemicals=new Set(['drug-rime','drug-terrifier','drug-mortalis','drug-mindfire','drug-deliriant']);

export function renderStreetDrugs(character,rules,evaluated){
  const {items}=rules.equipmentRules;
  const owned=new Map(character.equipment.items.map(entry=>[entry.catalogId,entry.quantity]));
  const campaign=character.campaign?.active;
  const catalog=items.filter(item=>item.kind==='drug').sort((a,b)=>a.name.localeCompare(b.name,'de'));
  const injector=items.find(item=>item.id==='airhypo');
  const injectorQuantity=owned.get('airhypo')??0;
  const buy=(item,quantity)=>`<button type="button" class="secondary" id="buy-equipment-${item.id}" data-buy-equipment="${item.id}" ${evaluated.funds.remaining<item.cost||quantity>=99?'disabled':''}>Kaufen · ${item.cost} eb</button>`;
  const remove=item=>`<button type="button" class="text-button" id="remove-equipment-${item.id}" data-remove-equipment="${item.id}">Entfernen −</button>`;
  const airhypo=injector?`<article class="equipment-card shop-card"><h3>Airhypo · Druckinjektor</h3>
    <p>Verabreicht eine Dosis. Gegen ein unwilliges Ziel würfelst du einen Nahkampfangriff. Bei einem Treffer injizierst du die Droge anstelle von Waffenschaden.</p>
    ${injectorQuantity?`<p class="shop-quantity">${injectorQuantity} × vorhanden</p>`:''}
    ${campaign?'':`<div class="weapon-buy-actions">${buy(injector,injectorQuantity)}${injectorQuantity?remove(injector):''}</div>`}
  </article>`:'';
  const groups=[
    ['consumption','Konsum- und Leistungsdrogen',catalog.filter(item=>!combatChemicals.has(item.id))],
    ['chemicals','Kampfchemikalien und Neurotoxine',catalog.filter(item=>combatChemicals.has(item.id))]
  ];
  return `<section class="equipment-section compact-shop street-drugs"><div class="section-heading"><h2>Straßendrogen</h2></div>
    ${airhypo}
    ${groups.map(([id,label,drugs])=>`<details class="weapon-catalog-group" id="drug-group-${id}"><summary>${label} <small>${drugs.length} Optionen</small></summary><div class="equipment-grid">
    ${drugs.map(d=>{
      const quantity=owned.get(d.id)??0;
      return `<article class="equipment-card shop-card drug-card" data-drug-card="${d.id}">
        <details id="drug-details-${d.id}"><summary><h3>${e(d.name)}</h3></summary>
          <dl><dt>Primärwirkung</dt><dd>${e(d.drug.primary)}</dd><dt>Sekundärwirkung bei misslungener Probe</dt><dd>${e(d.drug.secondary)}</dd><dt>Bestehende Abhängigkeit</dt><dd>${e(d.drug.addiction)}</dd>
          <dt>Dauer und Widerstand</dt><dd>${duration(d.drug.duration)} · WIL + Folter/Drogen widerstehen + 1W10 gegen SG ${d.drug.dv}. Das Ergebnis muss höher sein.</dd>
          <dt>Quelle</dt><dd><a href="${e(d.drug.url)}" target="_blank" rel="noopener noreferrer">${e(d.drug.source)} ↗</a></dd></dl>
        </details>
        ${quantity?`<p class="shop-quantity">${quantity} ${quantity===1?'Dosis':'Dosen'} vorhanden</p>`:''}
        <div class="weapon-buy-actions">${campaign?'':buy(d,quantity)}${quantity?`<button type="button" class="secondary" data-use-drug="${d.id}">1 Dosis verwendet</button>${campaign?'':remove(d)}`:''}</div>
      </article>`;
    }).join('')}</div></details>`).join('')}
  </section>`;
}
