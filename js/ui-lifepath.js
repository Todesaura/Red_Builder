import { escapeHtml as e } from './html.js';
import { LIFEPATH_GROUPS, LIFEPATH_QUESTIONS } from './lifepath-data.js';
import { evaluateLifepath, MAX_LIFEPATH_TEXT, LIFEPATH_CHOICES } from './lifepath.js?v=session6';

export function renderLifepathSummary(character, editable = false) {
  const life = evaluateLifepath(character);
  return `<section class="review-lifepath"><h3>Dein Lebensweg</h3><p>${life.answered} von ${life.total} Fragen beantwortet.</p>${life.answered ? `<dl class="lifepath-summary">${life.entries.filter(entry => entry.answer).map(entry => `<div><dt>${e(entry.title)}</dt><dd>${e(entry.answer)}${editable ? `<button class="text-button" data-lifepath-edit="${entry.id}">Antwort ändern</button>` : ''}</dd></div>`).join('')}</dl>` : '<p>Deine Hintergrundgeschichte ist noch offen.</p>'}${editable ? '' : '<button class="text-button" data-view="lifepath">Lebensweg bearbeiten →</button>'}</section>`;
}

export function activeLifepathQuestion(character, state = {}) {
  return LIFEPATH_QUESTIONS.find(q=>q.id===state.lifepathQuestion) ?? evaluateLifepath(character).entries.find(q=>!q.answer) ?? null;
}
export function renderLifepath(character, state = {}) {
  const life = evaluateLifepath(character), question=activeLifepathQuestion(character,state);
  let card='';
  if(question){
    const entry=character.lifepath[question.id], index=LIFEPATH_QUESTIONS.findIndex(q=>q.id===question.id);
    const answer=life.entries.find(q=>q.id===question.id)?.answer;
    card=`<section class="panel lifepath-step" id="lifepath-step" tabindex="-1" aria-label="Aktuelle Lebensweg-Frage"><p class="eyebrow">Frage ${index+1} von ${life.total} · ${e(LIFEPATH_GROUPS.find(([id])=>id===question.group)[1])}</p><fieldset class="lifepath-card" id="life-card-${question.id}"><legend>${e(question.title)}</legend>${[...question.options,'Eigene Idee'].map((text,i)=>{
      const choice=[...LIFEPATH_CHOICES,'custom'][i];
      return `<label class="lifepath-option"><input id="life-choice-${question.id}-${choice}" type="radio" name="life-${question.id}" data-lifepath-choice="${question.id}" value="${choice}" ${entry.choice===choice?'checked':''}><span>${e(text)}</span></label>`;
    }).join('')}${entry.choice==='custom'?`<label class="field-label" for="life-text-${question.id}">Deine Idee</label><textarea id="life-text-${question.id}" data-lifepath-text="${question.id}" rows="4" maxlength="${MAX_LIFEPATH_TEXT}" aria-describedby="life-count-${question.id}">${e(entry.custom)}</textarea><small id="life-count-${question.id}">${entry.custom.length} / ${MAX_LIFEPATH_TEXT} Zeichen</small><button class="primary" data-action="lifepath-next" ${!answer?'disabled':''}>Antwort übernehmen →</button>`:''}</fieldset><div class="lifepath-step-actions">${index?`<button class="text-button" data-lifepath-edit="${LIFEPATH_QUESTIONS[index-1].id}">← Vorherige Frage</button>`:''}${entry.choice!==null?`<button class="text-button" data-lifepath-clear="${question.id}">Auswahl zurücknehmen</button>`:''}</div></section>`;
  }
  return `<section class="panel lifepath-intro"><div class="section-heading"><span class="section-index">05</span><div><h2>Wer steckt hinter deinem Namen?</h2><p>Vier unterschiedliche Antworten oder deine eigene Idee. Nach deiner Auswahl geht es mit der nächsten Frage weiter.</p></div></div><p class="lifepath-progress" role="status">${life.answered} von ${life.total} Fragen beantwortet</p></section>${card||'<section class="panel lifepath-complete"><h2>Dein Lebensweg ist vollständig.</h2><p>Unten kannst du jede Antwort wieder ändern.</p></section>'}<section class="panel lifepath-preview"><h2>Deine Geschichte bisher</h2>${renderLifepathSummary(character,true)}</section><div class="bottom-bar"><button class="secondary" data-view="role-abilities">← Zurück zu den Rollenfähigkeiten</button><button class="primary" data-view="cyberware">Weiter zur Ausstattung →</button></div>`;
}
