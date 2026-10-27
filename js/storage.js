import { migrateCharacter, MAX_PORTRAIT_LENGTH } from './model.js?v=session6';

export const STORAGE_KEY = 'red-builder.character.v1';
export const BACKUP_KEY = 'red-builder.character.v1.backup';

export function loadCharacter(rules, storage) {
  try {
    const raw = (storage ?? globalThis.localStorage).getItem(STORAGE_KEY);
    if (raw === null) return { character: null, blocked: false, message: '' };
    if (raw.length > MAX_PORTRAIT_LENGTH + 1800000) throw new Error('Die gespeicherten Daten sind zu groß.');
    const input = JSON.parse(raw);
    const character = migrateCharacter(input, rules);
    if (input.version >= 1 && input.version < character.version) {
      const target = storage ?? globalThis.localStorage;
      const backupKey = input.version === 1 ? BACKUP_KEY : `red-builder.character.v${input.version}.backup`;
      if (target.getItem(backupKey) === null) target.setItem(backupKey, raw);
    }
    return { character, blocked: false, message: input.version < character.version ? 'Dein Charakter wurde in die aktuelle Version übernommen. Deine bisherigen Eingaben bleiben erhalten; die ursprünglichen Daten wurden im Browser gesichert.' : '' };
  } catch (error) {
    return { character: null, blocked: true, message: `Gespeicherte Daten konnten nicht geladen werden: ${error.message} Sie werden nicht automatisch überschrieben.` };
  }
}

export function saveCharacter(character, storage) {
  try {
    (storage ?? globalThis.localStorage).setItem(STORAGE_KEY, JSON.stringify(character));
    return { ok: true };
  } catch {
    return { ok: false, error: 'Speichern nicht möglich. Prüfe den Browserspeicher oder den privaten Modus. Dein aktueller Stand bleibt in diesem Tab erhalten.' };
  }
}
