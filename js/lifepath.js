import { LIFEPATH_QUESTIONS } from './lifepath-data.js';
export const MAX_LIFEPATH_TEXT = 600;
export const LIFEPATH_CHOICES = ['first', 'second', 'third', 'fourth'];
const choices = [null, ...LIFEPATH_CHOICES, 'custom'];
const definition = id => LIFEPATH_QUESTIONS.find(question => question.id === id);
export function createLifepath() {
  return Object.fromEntries(LIFEPATH_QUESTIONS.map(({ id }) => [id, { choice: null, custom: '' }]));
}
export function validateLifepath(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Der Lebensweg fehlt oder ist ungültig.');
  return Object.fromEntries(LIFEPATH_QUESTIONS.map(({ id }) => {
    const entry = input[id];
    if (!entry || typeof entry !== 'object' || Array.isArray(entry) || !choices.includes(entry.choice) || typeof entry.custom !== 'string' || entry.custom.length > MAX_LIFEPATH_TEXT) throw new Error(`Ungültiger Lebensweg-Eintrag: ${id}.`);
    return [id, { choice: entry.choice, custom: entry.custom }];
  }));
}
export function chooseLifepath(character, id, choice) {
  if (!definition(id) || !choices.includes(choice)) return { ok: false, error: 'Unbekannte Lebensweg-Auswahl.' };
  character.lifepath[id].choice = choice;
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
  const errors = entries.filter(entry => character.lifepath?.[entry.id]?.choice === 'custom' && !entry.answer).map(entry => `Lebensweg „${entry.title}“: Ergänze deine eigene Idee oder nimm die Auswahl zurück.`);
  return { entries, answered: entries.filter(entry => entry.answer).length, total: entries.length, errors };
}
