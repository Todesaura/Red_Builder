import { escapeHtml as e } from './html.js';
import { candidateErrors } from './cyberware-ui-model.js?v=budget2';
export { baseStats, cyberwareCandidate, candidateErrors } from './cyberware-ui-model.js?v=budget2';

const points = {'eye-left':[80,14],'eye-right':[20,14],'arm-left':[82,40],'arm-right':[18,40],'leg-left':[77,78],'leg-right':[23,78]};
const silhouette = `<svg viewBox="0 0 360 520" aria-hidden="true" class="body-silhouette"><defs><pattern id="body-grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M 24 0 L 0 0 0 24" fill="none" stroke="#292d36" stroke-width=".5"/></pattern></defs><rect width="360" height="520" fill="url(#body-grid)"/><g fill="#252b34" stroke="#697380" stroke-width="1.5"><path d="M157 34 Q180 18 203 34 L208 61 Q203 86 193 94 L193 112 L167 112 L167 94 Q153 83 152 61Z"/><path d="M167 108 L130 125 L143 223 L152 274 L208 274 L217 223 L230 125 L193 108 L180 132Z"/><path d="M129 126 L113 136 L92 216 L78 291 L92 308 L105 299 L119 224 L143 159Z"/><path d="M231 126 L247 136 L268 216 L282 291 L268 308 L255 299 L241 224 L217 159Z"/><path d="M152 275 L145 333 L151 395 L144 471 L130 487 L132 497 L165 497 L177 405 L180 316 L183 405 L195 497 L228 497 L230 487 L216 471 L209 395 L215 333 L208 275Z"/></g><g fill="none" stroke="#515b6a" stroke-width="1"><path d="M155 59 L205 59 M165 81 L195 81 M180 133 L180 267 M145 157 L174 174 L151 182 M215 157 L186 174 L209 182 M151 200 L209 200 M155 222 L205 222 M159 244 L201 244 M150 333 L170 338 M190 338 L210 333 M153 393 L171 393 M189 393 L207 393"/></g><g fill="#ed6671"><circle cx="168" cy="59" r="3"/><circle cx="192" cy="59" r="3"/><circle cx="180" cy="163" r="3"/></g><text x="180" y="516" text-anchor="middle" fill="#7d8898" font-size="9" letter-spacing="3">VORDERANSICHT</text></svg>`;

export function renderBody(character,rules,evaluated,state) {
  const selected=rules.cyberwareRules.items.find(item=>item.id===state.selectedCyberware);
  const zone=location=>{
    const installed=character.cyberware.items.filter(item=>item.location===location.id && !(state.cyberDraft??[]).some(draft=>draft.id===item.id));
    const planned=(state.cyberDraft??[]).filter(item=>item.location===location.id);
    const errors=selected?candidateErrors(character,rules,selected.id,location.id,evaluated):[];
    const status=selected?(errors.length?'unavailable-zone':'available-zone'):'';
    const position=points[location.id];
    const chosen=state.pendingLocation===location.id;
    return `<button class="body-zone ${position?'body-point':''} ${status} ${chosen?'active-zone':''}" ${position?`style="left:${position[0]}%;top:${position[1]}%"`:''} id="body-zone-${location.id}" data-body-location="${location.id}" aria-pressed="${chosen}" aria-label="${e(location.name)}${selected?': zum Entwurf hinzufügen':''}" title="${e(errors[0]??location.name)}"><span>${e(location.name)}</span><small>${[installed.length?installed.length+' eingebaut':'',planned.length?planned.length+' geplant':''].filter(Boolean).join(' · ')||'Leer'}</small></button>`;
  };
  return `<section class="body-editor"><div class="body-editor-heading"><h3>Installationsbereich</h3><p>${state.sessionMode?'Cyberware in einen Bereich ziehen und den Einbau anschließend bestätigen.':'Cyberware in einen freien Bereich ziehen oder im Katalog „Kaufen & einbauen“ wählen. Der Kauf wird sofort übernommen.'}</p></div><div class="body-map">${silhouette}${rules.cyberwareRules.locations.filter(location=>points[location.id]).map(zone).join('')}</div><div class="body-system-zones">${rules.cyberwareRules.locations.filter(location=>!points[location.id]).map(zone).join('')}</div>${state.inspectedLocation&&!selected?`<p class="zone-inspection">${e(rules.cyberwareRules.locations.find(location=>location.id===state.inspectedLocation)?.name??'')} · ${character.cyberware.items.filter(item=>item.location===state.inspectedLocation).map(item=>e(rules.cyberwareRules.items.find(entry=>entry.id===item.catalogId)?.name??'')).join(', ')||'Keine Cyberware eingebaut.'}</p>`:''}</section>`;
}

// Pointer dragging supports mouse and the touch handle without an external library.
export function bindBodyDrag(root, state, onInstall, onRemoveDraft) {
  let drag = null;
  function clear() {
    drag?.ghost?.remove();
    root.querySelectorAll('.drag-compatible,.drag-over').forEach(zone=>zone.classList.remove('drag-compatible','drag-over'));
    drag = null;
  }
  root.addEventListener('pointerdown', event => {
    const card=event.target.closest('[data-drag-cyberware],[data-drag-draft]');
    if (!card || event.button !== 0 || event.target.closest('button,summary,a,input,select') || event.pointerType !== 'mouse' && !card.dataset.dragDraft && !event.target.closest('.drag-handle')) return;
    event.preventDefault();
    drag={ id:card.dataset.dragCyberware??card.dataset.dragDraft, draft:Boolean(card.dataset.dragDraft), locations:(card.dataset.dragLocations??'').split(','), x:event.clientX, y:event.clientY, pointer:event.pointerId, card, active:false, ghost:null };
    card.setPointerCapture(event.pointerId);
  });
  root.addEventListener('pointermove',event=>{
    if (!drag || drag.pointer !== event.pointerId) return;
    if (!drag.active && Math.hypot(event.clientX-drag.x,event.clientY-drag.y)<7) return;
    event.preventDefault();
    if (!drag.active) {
      drag.active=true;
      const ghost=document.createElement('div'); ghost.className='cyber-drag-ghost'; ghost.textContent=drag.card.querySelector('h3,h4').textContent;
      ghost.setAttribute('aria-hidden','true'); document.body.append(ghost); drag.ghost=ghost;
    }
    drag.ghost.style.left=event.clientX+14+'px'; drag.ghost.style.top=event.clientY+14+'px';
    const hovered=document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-body-location]');
    root.querySelectorAll('[data-body-location]').forEach(zone=>{
      zone.classList.toggle('drag-compatible',drag.locations.includes(zone.dataset.bodyLocation));
      zone.classList.toggle('drag-over',zone===hovered);
    });
  });
  root.addEventListener('pointerup',event=>{
    if (!drag || drag.pointer !== event.pointerId) return;
    const target=drag.active ? document.elementFromPoint(event.clientX,event.clientY) : null;
    const zone=target?.closest('[data-body-location]');
    const remove=drag.draft && target?.closest('[data-draft-remove-zone],.cyber-catalog');
    const id=drag.id;
    const isDraft=drag.draft;
    if (drag.card.hasPointerCapture(event.pointerId)) drag.card.releasePointerCapture(event.pointerId);
    clear();
    if (remove) onRemoveDraft?.(id);
    else if (zone && !isDraft) onInstall(id,zone.dataset.bodyLocation);
  });
  root.addEventListener('pointercancel',clear);
  root.addEventListener('lostpointercapture',()=>{ if(drag) clear(); });
}
