import {fundingPrice} from './ui-funding.js?v=inline1';
import {escapeHtml as e} from './html.js';

export function renderClothing(character,rules,evaluated){
  const all=rules.equipmentRules.items.filter(item=>item.category==='clothing');
  const owned=new Set(character.equipment.items.map(entry=>entry.catalogId));
  return `<section class="equipment-section compact-shop clothing-shop"><div class="section-heading"><div><h2>Normale Kleidung</h2><p>Der Fashion-Zuschuss wird automatisch genutzt.</p></div></div>
  ${[...new Set(all.map(item=>item.style))].map(style=>{
    const entries=all.filter(item=>item.style===style);
    return `<details class="clothing-style" id="clothing-${entries[0].styleId}"><summary>${e(style)} <small>${entries.length} Teile</small></summary><div class="equipment-grid">${entries.map(item=>{
      const bought=owned.has(item.id);
      return `<article class="equipment-card shop-card ${bought?'clothing-owned':''}"><h3>${e(item.name)}</h3><p>${e(item.description)}</p>
        ${bought?`<p class="shop-quantity">Gekauft</p><button type="button" class="text-button" id="remove-equipment-${item.id}" data-remove-equipment="${item.id}">Entfernen −</button>`:`<button type="button" class="secondary" id="buy-equipment-${item.id}" data-buy-equipment="${item.id}" ${evaluated.funds.remaining+evaluated.funds.fashionRemaining<item.cost?'disabled':''}>Kaufen · ${fundingPrice([item],evaluated.funds)}</button>`}
      </article>`;
    }).join('')}</div></details>`;
  }).join('')}</section>`;
}
