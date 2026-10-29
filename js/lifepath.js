import { LIFEPATH_QUESTIONS, DAILY_LIFEPATH_QUESTIONS } from './lifepath-data.js';
import { LEGACY_DAILY_QUESTIONS } from './lifepath-budget-legacy.js';

// A choice can advance within Lore, but must never cross into the budget flow.
export function lifepathChoiceNavigation(id,choice){
 const question=LIFEPATH_QUESTIONS.find(q=>q.id===id);
 if(!question)throw Error('Unbekannte Lebensweg-Frage.');
 return {lifepathSection:question.group==='daily'?'daily':'flair',lifepathQuestion:question.group==='daily'||choice==='custom'?id:null};
}
export const MAX_LIFEPATH_TEXT = 600;
export const LIFEPATH_CHOICES = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth'];
const definition = id => LIFEPATH_QUESTIONS.find(question => question.id === id);
const validChoice=(question,choice)=>choice===null||choice==='custom'||LIFEPATH_CHOICES.slice(0,question.options.length).includes(choice);
export function createLifepath() {
  return Object.fromEntries(LIFEPATH_QUESTIONS.map(({ id,group }) => [id, { choice: null, custom: '', ...(group==='daily'?{revision:2}:{}) }]));
}
export function validateLifepath(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Der Lebensweg fehlt oder ist ungültig.');
  return Object.fromEntries(LIFEPATH_QUESTIONS.map(question => {
    const {id,group}=question,daily=group==='daily';
    let entry = input[id] ?? (id==='neighborhood'?input.residence:undefined) ?? (daily?{choice:null,custom:''}:null);
    if (!entry || typeof entry !== 'object' || Array.isArray(entry) || typeof entry.custom !== 'string' || entry.custom.length > MAX_LIFEPATH_TEXT) throw new Error(`Ungültiger Lebensweg-Eintrag: ${id}.`);
    if(daily&&entry.revision!==undefined&&entry.revision!==2)throw Error('Unbekannte Version der Monatsbudget-Antwort.');
    if(entry.monthlyCost!==undefined&&(!Number.isSafeInteger(entry.monthlyCost)||entry.monthlyCost<(question.allowIncome?-1000000:0)||entry.monthlyCost>1000000))throw Error('Ungültige monatliche Kosten.');
    const legacy=daily&&entry.revision===undefined?LEGACY_DAILY_QUESTIONS.find(q=>q.id===(id==='neighborhood'?'residence':id)):null;
    if(legacy&&entry.choice!==null&&entry.choice!=='custom'){
      const index=LIFEPATH_CHOICES.indexOf(entry.choice);
      if(index<0||index>=legacy.options.length)throw Error(`Ungültiger alter Lebensweg-Eintrag: ${id}.`);
      // Old option positions now mean different things. Keep the original answer and
      // its budget as a custom answer rather than silently rewriting the character.
      entry={choice:'custom',custom:legacy.options[index],monthlyCost:legacy.monthlyCosts[index]};
    }
    if(!validChoice(question,entry.choice))throw Error(`Ungültiger Lebensweg-Eintrag: ${id}.`);
    return [id, { choice: entry.choice, custom: entry.custom, ...(entry.monthlyCost!==undefined?{monthlyCost:entry.monthlyCost}:{}), ...(daily?{revision:2}:{}) }];
  }));
}
export function chooseLifepath(character, id, choice) {
  if (!definition(id) || !validChoice(definition(id),choice)) return { ok: false, error: 'Unbekannte Lebensweg-Auswahl.' };
  character.lifepath[id]??={choice:null,custom:''};
  character.lifepath[id].choice = choice;
  if(definition(id).group==='daily')character.lifepath[id].revision=2;
  return { ok: true };
}
export function editLifepath(character, id, text) {
  if (!definition(id) || typeof text !== 'string' || text.length > MAX_LIFEPATH_TEXT) return { ok: false, error: `Deine Idee darf höchstens ${MAX_LIFEPATH_TEXT} Zeichen enthalten.` };
  character.lifepath[id].custom = text;
  return { ok: true };
}
export function lifepathAnswer(question, entry) {
  if (entry?.choice === 'custom') return typeof entry.custom === 'string' ? entry.custom.trim() : '';
  if (LIFEPATH_CHOICES.includes(entry?.choice)) return question.options[LIFEPATH_CHOICES.indexOf(entry.choice)];
  return '';
}
export function evaluateLifepath(character) {
  const additions={friend:'contacts',enemy:'enemies',goal:'goals','turning-point':'events'};
  const entries = LIFEPATH_QUESTIONS.map(question => ({ ...question, answer: [lifepathAnswer(question, character.lifepath?.[question.id]),...(character.campaign?.[additions[question.id]]??[])].filter(Boolean).join('\n') }));
  for(const entry of entries)entry.complete=Boolean(entry.answer)&&(!entry.monthlyCosts||character.lifepath?.[entry.id]?.choice!=='custom'||character.lifepath[entry.id].monthlyCost!==undefined);
  const errors = entries.filter(entry => character.lifepath?.[entry.id]?.choice === 'custom' && !entry.answer).map(entry => `Lebensweg „${entry.title}“: Ergänze deine eigene Idee oder nimm die Auswahl zurück.`);
  for(const q of DAILY_LIFEPATH_QUESTIONS)if(q.monthlyCosts&&character.lifepath?.[q.id]?.choice==='custom'&&character.lifepath[q.id].monthlyCost===undefined)errors.push('Trage den monatlichen Betrag für „'+q.budgetLabel+'“ ein.');
  return { entries, answered: entries.filter(entry => entry.complete).length, total: entries.length, errors };
}

export function editLifepathCost(character,id,value){
 const q=definition(id),minimum=q?.allowIncome?-1000000:0;
 if(!q?.monthlyCosts||!character.lifepath?.[id]||value!==undefined&&(!Number.isSafeInteger(value)||value<minimum||value>1000000))return {ok:false,error:'Trage einen gültigen ganzen monatlichen Betrag ein.'};
 if(value===undefined)delete character.lifepath[id].monthlyCost;else character.lifepath[id].monthlyCost=value;
 return {ok:true};
}
export function livingCosts(character) {
 const items=DAILY_LIFEPATH_QUESTIONS.filter(q=>q.monthlyCosts).map(q=>{
  const entry=character.lifepath?.[q.id];
  const amount=!entry?.choice?null:entry.choice==='custom'?(entry.monthlyCost??null):q.monthlyCosts[LIFEPATH_CHOICES.indexOf(entry.choice)];
  return {id:q.id,label:q.budgetLabel,amount,answer:lifepathAnswer(q,entry)};
 });
 const expenses=items.reduce((sum,i)=>sum+Math.max(0,i.amount??0),0),income=items.reduce((sum,i)=>sum+Math.max(0,-(i.amount??0)),0),complete=items.every(i=>i.amount!==null);
 return {housing:items.find(i=>i.id==='housing').amount,lifestyle:items.find(i=>i.id==='lifestyle').amount,items,expenses,income,complete,total:complete?expenses-income:null};
}
