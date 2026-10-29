import { createCharacter, migrateCharacter, validateCharacter, MAX_PORTRAIT_LENGTH } from './model.js?v=shopping1';
import { STORAGE_KEY } from './storage.js?v=shopping1';
const PREFIX = 'red-builder.character.archive.';
export const ACTIVE_ARCHIVE_KEY = 'red-builder.character.activeArchive';

export function deleteArchivedCharacter(key, rules, storage) {
  try {
    storage ??= globalThis.localStorage;
    if (!readArchivedCharacter(key, rules, storage)) return {ok:false,error:'Dieser gespeicherte Charakter ist nicht mehr verfügbar.'};
    storage.removeItem(key);
    return {ok:true};
  } catch {
    return {ok:false,error:'Der gespeicherte Charakter konnte nicht gelöscht werden. Bitte erneut versuchen.'};
  }
}

export function archivedCharacters(rules, storage) {
  try {
    storage ??= globalThis.localStorage;
    const entries=[];
    for(let i=0;i<storage.length;i++) {
      const key=storage.key(i);
      if(!key?.startsWith(PREFIX)) continue;
      const character=readArchivedCharacter(key,rules,storage);
      if(character)entries.push({key,name:character.name || 'Unbenannter Charakter',role:character.role});
    }
    return entries.sort((a,b)=>b.key.localeCompare(a.key));
  } catch { return []; }
}
export function readArchivedCharacter(key,rules,storage) {
  try {
    storage ??= globalThis.localStorage;
    if(typeof key!=='string'||!key.startsWith(PREFIX))return null;
    const raw=storage.getItem(key);
    if(!raw||raw.length>MAX_PORTRAIT_LENGTH+1800000)return null;
    return migrateCharacter(JSON.parse(raw),rules);
  } catch { return null; }
}
// An opened profile keeps its archive key, including after reload and edits.
// Legacy drafts without a binding may reuse an exactly matching saved snapshot.
export function switchCharacter(current,next,rules,storage,options={}) {
  try {
    storage ??= globalThis.localStorage;
    const safeCurrent=validateCharacter(current,rules),safeNext=validateCharacter(next,rules);
    const raw=JSON.stringify(safeCurrent),freshRaw=JSON.stringify(validateCharacter(createCharacter(rules),rules));
    const matchingKey=character=>{
      const value=JSON.stringify(character);
      if(value===freshRaw)return null;
      return archivedCharacters(rules,storage).find(entry=>JSON.stringify(readArchivedCharacter(entry.key,rules,storage))===value)?.key??null;
    };
    const previousBinding=storage.getItem(ACTIVE_ARCHIVE_KEY)??'';
    const currentKey=readArchivedCharacter(previousBinding,rules,storage)?previousBinding:matchingKey(safeCurrent);
    let nextKey=options.nextKey??matchingKey(safeNext);
    if(options.nextKey){
      const storedNext=readArchivedCharacter(options.nextKey,rules,storage);
      if(!storedNext||JSON.stringify(storedNext)!==JSON.stringify(safeNext))throw new Error('Das Zielprofil ist nicht mehr verfügbar oder wurde geändert.');
    }
    // Reopening the active profile must not restore an older snapshot over its edits.
    const sameProfile=nextKey&&nextKey===currentKey;
    const target=sameProfile?safeCurrent:safeNext;
    if(raw!==freshRaw) {
      let key=currentKey;
      if(!key){
        const base=PREFIX+Date.now();key=base;let index=0;
        while(storage.getItem(key)!==null)key=base+'-'+String(++index).padStart(4,'0');
      }
      storage.setItem(key,raw);
      if(sameProfile)nextKey=key;
    }
    // Commit the binding before replacing the active draft; restore it on failure.
    storage.setItem(ACTIVE_ARCHIVE_KEY,nextKey??'');
    try {storage.setItem(STORAGE_KEY,JSON.stringify(target));}
    catch(error){try{storage.setItem(ACTIVE_ARCHIVE_KEY,previousBinding);}catch{}throw error;}
    return {ok:true,character:target};
  } catch { return {ok:false,error:'Der bisherige Charakter konnte nicht sicher gespeichert werden. Der Wechsel wurde abgebrochen; dein aktueller Charakter bleibt erhalten.'}; }
}

export function resetCharacterUi(state, character) {
  state.pendingArchiveDeletion=null;state.sessionSaved=null;state.sessionPage='info';state.sessionTask='';state.sessionFields=null;state.sessionDraft=null;state.sessionCyber=null;state.sessionEditing=null;state.sessionCorrection=null;
  Object.assign(state,{character,drugFilters:{},lifepathSection:null,lifepathQuestion:null,error:'',pdfExportMessage:'',skillSearch:'',skillCategory:'all',customSkillFields:[],cyberSearch:'',cyberCategory:'accessories',cyberSort:'foundation',onlyInstallable:false,cyberPlacement:null,selectedCyberware:null,pendingLocation:null,inspectedLocation:null,installationOpen:false,equipmentTab:'cyberware',cyberDraft:[],removingCyberware:null,removalFee:'',customEquipmentDraft:{id:null,name:'',cost:'',quantity:'1',notes:''}});
}
