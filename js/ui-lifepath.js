import { escapeHtml as e } from './html.js';
import { LIFEPATH_GROUPS, LIFEPATH_QUESTIONS } from './lifepath-data.js?v=finance1';
import { evaluateLifepath, livingCosts, MAX_LIFEPATH_TEXT, LIFEPATH_CHOICES } from './lifepath.js?v=finance1';

const sections=[['flair','Hintergrund & Persönlichkeit','Deine Geschichte, Beziehungen und dein Stil. Diese Antworten verändern weder Geld noch Spielwerte.'],['daily','Finanzen','Wo du heute lebst, wen du unterstützt und wofür du Geld ausgibst oder regelmäßig welches bekommst.']];
const inSection=(q,section)=>(q.group==='daily'?'daily':'flair')===section;
const eb=value=>value===null?'noch offen':value.toLocaleString('de-DE')+' eb';

export function renderLifepathSummary(character, editable = false) {
 const life=evaluateLifepath(character);
 return `<section class="review-lifepath"><h3>Dein Lebensweg</h3><p>${life.answered} von ${life.total} Fragen vollständig beantwortet.</p>${sections.map(([id,title])=>{
  const entries=life.entries.filter(q=>inSection(q,id)&&q.answer);
  return `${editable?`<details class="lifepath-summary-section" id="life-summary-${id}"><summary>${e(title)} · ${entries.length} Antworten</summary>`:`<section class="lifepath-summary-section"><h4>${e(title)}</h4>`}${entries.length?`<dl class="lifepath-summary">${entries.map(entry=>`<div><dt>${e(entry.title)}</dt><dd>${e(entry.answer)}${editable?`<button class="text-button" data-lifepath-edit="${entry.id}">Antwort ändern</button>`:''}</dd></div>`).join('')}</dl>`:'<p>Noch offen.</p>'}${editable?'</details>':'</section>'}`;
 }).join('')}${editable?'':renderLivingCosts(character)}${editable?'':'<button class="text-button" data-view="lifepath">Lebensweg bearbeiten →</button>'}</section>`;
}

export function activeLifepathQuestion(character,state={}){
 const selected=LIFEPATH_QUESTIONS.find(q=>q.id===state.lifepathQuestion);
 if(selected)return selected;
 return evaluateLifepath(character).entries.find(q=>!q.complete&&inSection(q,state.lifepathSection??'flair'))??null;
}

export function renderLifepath(character,state={},completion=''){
 const life=evaluateLifepath(character),question=activeLifepathQuestion(character,state);
 const section=question?(question.group==='daily'?'daily':'flair'):(state.lifepathSection??'flair');
 const current=sections.find(([id])=>id===section);
 const groupQuestions=LIFEPATH_QUESTIONS.filter(q=>inSection(q,section));
 let card='';
 if(question){
  const entry=character.lifepath[question.id]??{choice:null,custom:''};
  const index=groupQuestions.findIndex(q=>q.id===question.id);
  const evaluated=life.entries.find(q=>q.id===question.id);
  const financial=section==='daily';
  const choices=financial?question.options:[...question.options,'Eigene Idee'];
  const amount=value=>value<0?'+'+eb(-value)+' Einnahme':eb(value)+' / Monat';
  const selected=entry.choice==='custom';
  const previous=financial&&selected?`<p class="lifepath-budget-notice"><strong>Bisherige Antwort:</strong> ${e(entry.custom)} · ${entry.monthlyCost===undefined?'Betrag offen. Wähle eine Antwort aus der Liste.':e(amount(entry.monthlyCost))}</p>`:'';
  const custom=!financial&&selected?`<label class="field-label" for="life-text-${question.id}">Deine Idee</label><textarea id="life-text-${question.id}" data-lifepath-text="${question.id}" rows="4" maxlength="${MAX_LIFEPATH_TEXT}">${e(entry.custom)}</textarea><small>${entry.custom.length} / ${MAX_LIFEPATH_TEXT} Zeichen</small>`:'';
  const options=choices.map((text,i)=>{
    const choice=i===question.options.length?'custom':LIFEPATH_CHOICES[i];
    const label=financial?text.replace(/\s[−-]?[0-9.]+ eb\/Monat.*$/,''):text;
    return `<label class="lifepath-option"><input id="life-choice-${question.id}-${choice}" type="radio" name="life-${question.id}" data-lifepath-choice="${question.id}" value="${choice}" ${entry.choice===choice?'checked':''}><span>${e(label)}</span>${financial?`<strong class="lifepath-option-amount">${amount(question.monthlyCosts[i])}</strong>`:''}</label>`;
  }).join('');
  const confirm=selected||financial?`<button class="primary lifepath-confirm" data-action="lifepath-next" ${!evaluated.complete?'disabled':''}>${financial?'Budgetantwort übernehmen →':'Antwort übernehmen →'}</button>`:'';
  card=`<section class="panel lifepath-step" id="lifepath-step" tabindex="-1" aria-label="Aktuelle Lebensweg-Frage">
    <p class="eyebrow">${financial?'FINANZEN':'LORE'} · Frage ${index+1} von ${groupQuestions.length}${financial?'':' · '+e(LIFEPATH_GROUPS.find(([id])=>id===question.group)[1])}</p>
    <fieldset class="lifepath-card" id="life-card-${question.id}"><legend>${e(question.title)}</legend>${question.note?`<p class="inline-note">${e(question.note)}</p>`:''}${previous}${options}${custom}${confirm}</fieldset>
    <div class="lifepath-step-actions">${index?`<button class="text-button" data-lifepath-edit="${groupQuestions[index-1].id}">← Vorherige Frage</button>`:''}${entry.choice!==null?`<button class="text-button" data-lifepath-clear="${question.id}">Auswahl zurücknehmen</button>`:''}</div>
  </section>`;
 }
 return `<section class="panel lifepath-intro"><div class="section-heading"><span class="section-index">05</span><div><h2>Lebensweg</h2></div></div><div class="lifepath-sections" role="group" aria-label="Lebensweg-Bereich">${sections.map(([id,title])=>{const entries=life.entries.filter(q=>inSection(q,id));return `<button class="lifepath-section-${id} ${section===id?'selected':''}" data-lifepath-section="${id}" aria-pressed="${section===id}"><span class="eyebrow">${id==='daily'?'B · GELDFRAGEN':'A · LORE'}</span><strong>${e(title)}</strong><small>${entries.filter(q=>q.complete).length} / ${entries.length} beantwortet · ${id==='daily'?'mit Monatsbudget':'nur Flair'}</small></button>`;}).join('')}</div><h3>${e(current[1])}</h3><p>${e(current[2])}</p>${section==='daily'?'<p class="inline-note">Die Beträge fließen in dein Monatsbudget ein. Zusätzliche Wohn- und Lebensstiloptionen verwenden feste Beträge für diese Runde.</p>':''}<p class="lifepath-progress" role="status">${life.entries.filter(q=>inSection(q,section)&&q.complete).length} von ${groupQuestions.length} Fragen in diesem Bereich beantwortet</p></section>${card||`<section class="panel lifepath-complete"><h2>${section==='flair'?'Lore abgeschlossen.':'Dein Monatsbudget ist vollständig erfasst.'}</h2>${section==='flair'?'<button class="primary" data-lifepath-section="daily">Finanzen →</button>':'<p>Unten kannst du deine Antworten und das Monatsbudget prüfen.</p>'}</section>`}${section==='daily'?renderLivingCosts(character):''}<section class="panel lifepath-preview"><h2>Deine Antworten · getrennt nach Bereich</h2>${renderLifepathSummary(character,true)}</section><div class="bottom-bar completion-actions"><button class="secondary" data-view="role-abilities">← Zurück zu den Rollenfähigkeiten</button>${completion}<button class="primary" data-view="cyberware">Weiter zur Ausstattung →</button></div>`;
}

export function renderLivingCosts(character){
 const costs=livingCosts(character);
 return `<aside class="living-costs"><h3>Dein Monatsbudget</h3><dl class="living-budget-items">${costs.items.map(item=>`<div class="${item.amount<0?'monthly-income':''}"><dt>${e(item.label)}</dt><dd>${item.amount===null?'noch offen':item.amount<0?'+'+eb(-item.amount)+' Einnahme':eb(item.amount)+' Ausgabe'}</dd></div>`).join('')}</dl><dl class="living-budget-total"><div><dt>Ausgaben ${costs.complete?'':'bisher'}</dt><dd>${eb(costs.expenses)}</dd></div><div><dt>Einnahmen ${costs.complete?'':'bisher'}</dt><dd>${eb(costs.income)}</dd></div><div><dt>${costs.total!==null&&costs.total<0?'Monatlicher Überschuss':'Monatliche Belastung'}</dt><dd><strong>${costs.total===null?'noch offen':eb(Math.abs(costs.total))}</strong></dd></div></dl><p>Ausgaben minus Einnahmen ergibt deine monatliche Belastung. Offene Beträge sind kein kostenloser Lebensstil. Die Übersicht verändert weder Startkapital noch Kontostand; die Abrechnung erfolgt gemeinsam mit der Spielleitung.</p><small>Reguläre Mietunterkünfte/Lebensstile: Grundregelwerk S. 377–379 / RTG Night Market Index. Andere Beträge: eigene Erzählbudgets, keine zusätzlichen Spielboni. Lebensstil umfasst den gesamten Alltag, nicht nur Essen.</small></aside>`;
}
