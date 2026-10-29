import {escapeHtml as e} from './html.js';

export function completionLink(item,label=item.label){
  return `<button type="button" class="completion-link" data-progress-step="${e(item.view)}"${item.focus?` data-progress-focus="${e(item.focus)}"`:''}${item.life?` data-progress-life="${e(item.life)}"`:''}${item.tab?` data-progress-tab="${e(item.tab)}"`:''}>${e(label)} <span aria-hidden="true">→</span></button>`;
}

export function renderCompletion(progress,view){
  if(view==='session')return '';
  const current=progress.steps.find(step=>step.id===view);
  if(!current)return '';
  const next=progress.steps.find(step=>step.id!=='review'&&!step.complete);
  const limit=view==='review'?current.issues.length:3;
  return `<section class="completion-panel completion-${current.status}" aria-label="Abschlussanzeige"><div class="completion-heading"><strong>${current.complete?'✓':'○'} ${e(current.title)} · ${e(current.label)}</strong><span>${progress.complete} von ${progress.total} Schritten vollständig</span></div><progress max="${progress.total}" value="${progress.complete}" aria-label="Vollständige Erstellungsschritte">${progress.complete} / ${progress.total}</progress>${current.issues.length?`<ul class="completion-issues">${current.issues.slice(0,limit).map(item=>`<li>${completionLink(item)}</li>`).join('')}</ul>${current.issues.length>limit?`<p class="inline-note">${current.issues.length-limit} weitere Angaben sind in diesem Schritt zu prüfen.</p>`:''}`:current.notes.length?`<p class="completion-note">Diese Ausstattung ist optional. Die Hinweise verhindern den PDF-Abschluss nicht.</p><ul class="completion-issues">${current.notes.slice(0,3).map(item=>`<li>${completionLink(item)}</li>`).join('')}</ul>`:`<p class="completion-note">${view==='review'?'Alle erforderlichen Angaben sind vorhanden. Das PDF kannst du unten erzeugen.':next?'Dieser Schritt ist vollständig.':'Alle erforderlichen Schritte sind vollständig.'}</p>${next&&view!=='review'?completionLink(next.issues[0],`Weiter: ${next.title}`):view!=='review'?completionLink({view:'review',focus:'generate-character-sheet'},'Zur Überprüfung'):''}`}</section>`;
}
