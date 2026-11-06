import {migrateCharacter, validateCharacter, MAX_PORTRAIT_LENGTH} from './model.js?v=group1';

export const MAX_CHARACTER_JSON_LENGTH = MAX_PORTRAIT_LENGTH + 1800000;
export const MAX_CHARACTER_FILE_BYTES = MAX_CHARACTER_JSON_LENGTH * 3;

export function characterJson(character, rules) {
  const text = JSON.stringify(validateCharacter(character, rules), null, 2);
  if (text.length > MAX_CHARACTER_JSON_LENGTH) throw new Error('Der Charakter ist zu groß für eine JSON-Datei.');
  return text;
}

export function parseCharacterJson(text, rules) {
  if (typeof text !== 'string' || text.length > MAX_CHARACTER_JSON_LENGTH) throw new Error('Die JSON-Datei ist zu groß.');
  let input;
  try { input = JSON.parse(text.replace(/^\uFEFF/, '')); }
  catch { throw new Error('Die Datei enthält kein gültiges JSON.'); }
  return migrateCharacter(input, rules);
}

export async function readCharacterFile(file, rules) {
  if (!file || file.size > MAX_CHARACTER_FILE_BYTES) throw new Error('Die JSON-Datei ist zu groß.');
  return parseCharacterJson(await file.text(), rules);
}

export function characterJsonFilename(character) {
  const name = character.name.trim().replace(/[<>:"/\\|?*\x00-\x1f]/g, '-').replace(/[. ]+$/g, '').slice(0, 60);
  return `RED-Builder-${name || 'Charakter'}.json`;
}
