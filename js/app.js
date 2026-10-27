import {needsCyberwareSide} from './cyberware-placement.js?v=budget2';
import {bindSessionEvents} from './session-events.js?v=budget2';
import { quickAddCyberware } from './cyberware-quick-add.js?v=budget2';
import { emptyCustomEquipmentDraft } from './ui-custom-equipment.js';
import { characterSheetReadiness } from './pdf-character-data.js?v=budget2';
import { archivedCharacters, readArchivedCharacter, switchCharacter, resetCharacterUi, deleteArchivedCharacter } from './character-library.js?v=budget2';
import { removeCustomEquipment } from './custom-equipment.js';
import { chooseLifepath, editLifepath, editLifepathCost, evaluateLifepath } from './lifepath.js?v=budget2';
import { assignRolePoint, choosePharmaceutical } from './role-points.js?v=budget2';
import { equipArmor } from './armor.js?v=budget2';
import { createCharacter } from './model.js?v=budget2';
import { assignAttribute, applyRecommendation, pointsRemaining, evaluateCharacter } from './rules.js?v=budget2';
import { removeCyberware, canUndoCyberwarePurchase, cyberwareRemovalItems } from './cyberware.js?v=budget2';
import { addToCyberwareDraft, removeFromCyberwareDraft, commitCyberwareDraft } from './cyberware-draft.js?v=budget2';
import { baseStats, bindBodyDrag } from './ui-body.js?v=budget2';
import { initialInstallationLocation } from './cyberware-ui-model.js?v=budget2';
import { buyEquipment, removeEquipment, useStreetDrug, buyWeaponWithAmmo, saveCustomEquipment, addWeaponAttachment, removeWeaponAttachment } from './economy.js?v=budget2';
import { loadCharacter, saveCharacter, STORAGE_KEY } from './storage.js?v=budget2';
import { render } from './ui.js?v=budget2';
import { readPortrait, readGalleryPortrait } from './portraits.js?v=budget2';
import { assignSkill, addSpecialty, skillPointsRemaining, markSkillsEdited, resetSkillPoints } from './skills.js?v=budget2';
import { applySkillRecommendation, automaticallyRecommendSkills, isInitialSkillAllocation } from './skill-recommendations.js?v=budget2';

const root = document.getElementById('app');

async function start() {
  let portraitRequest = 0;
  const responses = await Promise.all(['rules.json', 'skills.json', 'cyberware.json', 'equipment.json'].map(file => fetch(new URL(`../data/${file}?v=budget2`, import.meta.url))));
  if (responses.some(response => !response.ok)) throw new Error('Die Regelkonfiguration konnte nicht geladen werden.');
  const [rules, skillRules, cyberwareRules, equipmentRules] = await Promise.all(responses.map(response => response.json()));
  rules.skillRules = skillRules;
  rules.cyberwareRules = cyberwareRules;
  rules.equipmentRules = equipmentRules;
  const loaded = loadCharacter(rules);
  const views = ['identity', 'attributes', 'skills', 'role-abilities', 'lifepath', 'cyberware', 'review', 'session'];
  const state = {
    character: loaded.character ?? createCharacter(rules),
    view: 'identity',
    storageBlocked: loaded.blocked,
    storageMessage: loaded.message,
    storageStatus: loaded.character ? 'saved' : 'draft',
    error: '', sessionDraft:null, sessionCyber:null, lifepathQuestion: null, cyberDraft: [], removingCyberware: null, removalFee: '', archivedCharacters: archivedCharacters(rules),
    skillSearch: '', skillCategory: 'all', customSkillFields: [],
    cyberSearch: '', cyberCategory: 'accessories', cyberSort: 'foundation', onlyInstallable: false, selectedCyberware: null, pendingLocation: null, inspectedLocation: null, installationOpen: false, equipmentTab: 'cyberware', customEquipmentDraft: emptyCustomEquipmentDraft()
  };
  const refresh = () => render(root, state, rules);
  const sessionEvents=bindSessionEvents(root,state,rules,refresh);
  function announceBudget() {
    const cyber = state.view === 'cyberware' ? evaluateCharacter(state.character, rules).cyberware : null;
    document.getElementById('announcement').textContent = state.error || (state.view === 'lifepath' ? `${evaluateLifepath(state.character).answered} Lebensweg-Fragen beantwortet.` : '') || (state.view === 'role-abilities' ? `Rollenfähigkeit Rang ${evaluateCharacter(state.character,rules).roleAbilities.rank}. ${evaluateCharacter(state.character, rules).roleAbilities.remaining} Rollenpunkte übrig.` : '') || (cyber ? `${cyber.entries.length} Komponenten eingebaut. Kosten ${cyber.cost} Eurobucks. Menschlichkeit ${cyber.current}, Maximum ${cyber.maximum}.` : state.view === 'skills' ? `${skillPointsRemaining(state.character, rules)} Fertigkeitspunkte übrig.` : state.character.method === 'recommendation'
      ? 'Rollenspezifische Empfehlung ausgewählt. 62 Punkte verteilt.'
      : `${pointsRemaining(state.character, rules)} Punkte übrig.`);
  }
  root.addEventListener('toggle',event=>{
    const key=event.target.dataset?.weaponSection;if(!key)return;
    const open=new Set(state.weaponSections??[]);if(event.target.open)open.add(key);else open.delete(key);state.weaponSections=[...open];
  },true);
  function persist() {
    state.pdfExportMessage = '';
    if (state.storageBlocked) return;
    const result = saveCharacter(state.character);
    state.storageStatus = result.ok ? 'saved' : 'error';
    state.storageMessage = result.ok ? '' : result.error;
  }
  if (state.character.role && isInitialSkillAllocation(state.character.skills, rules.skillRules)) {
    applySkillRecommendation(state.character, rules);
    persist();
  }
  function navigate(view) {
    if (!views.includes(view)) return;
    if(view==='session'&&!state.character.campaign.sessionUnlocked)view='review';
    if (view !== 'identity' && (!state.character.name.trim() || !state.character.role)) {
      state.view = 'identity';
      state.error = 'Gib zuerst einen Namen ein und wähle deine Rolle.';
      history.replaceState(null, '', '#identity');
      refresh();
      document.getElementById('character-name').focus();
      return;
    }
    if (view === 'skills' && isInitialSkillAllocation(state.character.skills, rules.skillRules)) {
      applySkillRecommendation(state.character, rules);
      persist();
    }
    state.view = view;
    state.error = '';
    if (location.hash !== `#${view}`) history.replaceState(null, '', `#${view}`);
    refresh();
    document.getElementById('main').focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function cancelArchiveDeletion() {
    const key=state.pendingArchiveDeletion?.key;
    state.pendingArchiveDeletion=null;refresh();
    [...root.querySelectorAll('[data-delete-character]')].find(button=>button.dataset.deleteCharacter===key)?.focus({preventScroll:true});
  }
  root.addEventListener('cancel',event=>{
    if(event.target.id!=='delete-character-dialog')return;
    event.preventDefault();cancelArchiveDeletion();
  },true);
  function activateCharacter(character, archiveKey=null) {
    if(state.sessionDraft&&!window.confirm('Der offene Session-Entwurf ist noch nicht übernommen. Verwerfen und Charakter wechseln?'))return;
    if (state.pdfExportBusy) return;
    if (state.storageBlocked) { state.error='Das Speichern ist pausiert. Löse zuerst den Speicherkonflikt, damit dein aktueller Charakter gesichert werden kann.';refresh();return; }
    const result=switchCharacter(state.character,character,rules,undefined,{nextKey:archiveKey});
    if(!result.ok) {state.error=result.error;refresh();return;}
    resetCharacterUi(state,result.character);
    state.storageStatus='saved';state.storageMessage='';state.archivedCharacters=archivedCharacters(rules);
    navigate('identity');
    document.getElementById('announcement').textContent='Charakter geöffnet. Der vorherige Stand bleibt unter Gespeicherte Charaktere erhalten.';
    document.getElementById('character-name')?.focus();
  }
  function updateSkillName(id, text) {
    const value = text.slice(0, 60);
    if (id === 'native-language') state.character.skills.nativeLanguage.name = value;
    else if (id === 'hometown') state.character.skills.hometown = value;
    else {
      state.character.skills.specialties.find(item => item.id === id).name = value;
      markSkillsEdited(state.character);
    }
  }
  function announceSelection() {
    const name = rules.cyberwareRules.items.find(item => item.id === state.selectedCyberware)?.name;
    document.getElementById('announcement').textContent = name ? name + ' ausgewählt. Ziehe es in einen Bereich oder füge es dem gemeinsamen Entwurf hinzu.' : '';
  }
  function insertCyberware(id, location) {
    const result = addToCyberwareDraft(state.character,rules,state.cyberDraft,id,location);
    state.error = result.ok ? '' : result.error;
    if(result.ok){const purchase=commitCyberwareDraft(state.character,rules,result.additions);state.error=purchase.ok?'':purchase.error;if(purchase.ok){state.cyberDraft=[];state.cyberPlacement=null;state.selectedCyberware=null;state.pendingLocation=null;persist();}}
    refresh(); announceBudget();
    if (result.ok&&!state.error) document.getElementById('announcement').textContent = 'Cyberware gekauft und eingebaut.';
  }
  function selectCyberware(id,location) {
    const item=rules.cyberwareRules.items.find(item=>item.id===id);
    if (!item) return;
    state.selectedCyberware=id; state.pendingLocation=location??initialInstallationLocation(item);
    state.installationOpen=true; state.error=''; refresh(); announceSelection();
  }
  function chooseInstallation(id,location) {
    insertCyberware(id,location);
  }
  function removeDraft(id) {
    state.cyberDraft = removeFromCyberwareDraft(state.character,rules,state.cyberDraft,id);
    state.error = ''; refresh();
    document.getElementById('announcement').textContent = `${state.cyberDraft.length} Implantate im Entwurf. Herausnehmen war kostenlos.`;
  }
  bindBodyDrag(root,state,(id,location)=>state.view==='session'?sessionEvents.queueCyber(id,location):chooseInstallation(id,location),id=>state.view==='session'?sessionEvents.removeCyberDraft(id):removeDraft(id));
  root.addEventListener('input', event => {
    if (event.target.id === 'removal-fee') { state.removalFee = event.target.value; return; }
    if (event.target.dataset.customField && ['name','cost','quantity','notes'].includes(event.target.dataset.customField)) { state.customEquipmentDraft[event.target.dataset.customField] = event.target.value; return; }
    if(event.target.dataset.lifepathCost){if(event.target.validity.badInput)return;const result=editLifepathCost(state.character,event.target.dataset.lifepathCost,event.target.value===''?undefined:Number(event.target.value));state.error=result.ok?'':result.error;if(result.ok)persist();refresh();return;}
    if (event.target.dataset.lifepathText) {
      const result = editLifepath(state.character, event.target.dataset.lifepathText, event.target.value);
      state.error = result.ok ? '' : result.error; persist(); refresh(); return;
    }
    if (event.target.id === 'cyber-search') { state.cyberSearch = event.target.value; refresh(); return; }
    if (event.target.id === 'skill-search') { state.skillSearch = event.target.value; refresh(); return; }
    if (event.target.dataset.skillText) {
      updateSkillName(event.target.dataset.skillText, event.target.value);
      persist(); refresh(); return;
    }
    if (event.target.id !== 'character-name') return;
    state.character.name = event.target.value.slice(0, 60);
    persist();
    refresh();
  });
  root.addEventListener('submit', event => {
    if(state.character.campaign?.active&&state.view!=='session'){event.preventDefault();state.error='Änderungen am Kampagnencharakter bitte in Schritt 8 erfassen.';refresh();return;}
    if (event.target.id === 'cyberware-removal-form') {
      event.preventDefault();
      if (state.cyberDraft.length) { state.error = 'Installiere oder leere zuerst den offenen Entwurf.'; refresh(); return; }
      const fee = state.removalFee.trim() === '' ? NaN : Number(state.removalFee);
      const result = removeCyberware(state.character,rules,state.removingCyberware,baseStats(evaluateCharacter(state.character,rules)),fee);
      state.error = result.ok ? '' : result.error;
      if (result.ok) { state.removingCyberware = null; state.removalFee = ''; persist(); }
      refresh(); announceBudget(); return;
    }
    if (event.target.id !== 'custom-equipment-form') return;
    event.preventDefault();
    const draft = state.customEquipmentDraft;
    const result = saveCustomEquipment(state.character, rules, {name:draft.name,cost:Number(draft.cost),quantity:Number(draft.quantity),notes:draft.notes}, draft.id);
    state.error = result.ok ? '' : result.error;
    if (result.ok) { state.customEquipmentDraft = emptyCustomEquipmentDraft(); persist(); }
    refresh(); announceBudget();
  });
  root.addEventListener('change', async event => {
    if(event.target.dataset.drugFilter){state.drugFilters={...state.drugFilters,[event.target.dataset.drugFilter]:event.target.value};refresh();return;}
    if (event.target.dataset.lifepathChoice) {
      const id = event.target.dataset.lifepathChoice;
      const result = chooseLifepath(state.character, id, event.target.value);
      state.lifepathQuestion = event.target.value === 'custom' ? id : null;
      state.error = result.ok ? '' : result.error; persist(); refresh(); announceBudget();
      if (result.ok && event.target.value !== 'custom') document.getElementById('lifepath-step')?.focus({preventScroll:true});
      if (result.ok && event.target.value === 'custom') document.getElementById(`life-text-${id}`)?.focus();
      return;
    }
    if (event.target.dataset.pharmaceutical) {
      const result = choosePharmaceutical(state.character, event.target.dataset.pharmaceutical, event.target.checked);
      state.error = result.ok ? '' : result.error; persist(); refresh(); announceBudget(); return;
    }
    if (event.target.dataset.armorSlot) {
      const result = equipArmor(state.character, rules, event.target.dataset.armorSlot, event.target.value || null);
      state.error = result.ok ? '' : result.error; persist(); refresh(); return;
    }
    if (event.target.id === 'cyber-sort') { state.cyberSort=event.target.value; refresh(); return; }
    if (event.target.id === 'cyber-installable') { state.onlyInstallable=event.target.checked; refresh(); return; }
    if (event.target.id === 'installation-location') { state.pendingLocation=event.target.value||null; refresh(); return; }
    if (event.target.dataset.skillChoice) {
      const id = event.target.dataset.skillChoice;
      const controlId = event.target.id;
      const custom = event.target.value === '__custom';
      state.customSkillFields = state.customSkillFields.filter(target => target !== id);
      if (custom) state.customSkillFields.push(id);
      updateSkillName(id, custom ? '' : event.target.value);
      persist(); refresh();
      if (custom) document.getElementById(`custom-${controlId}`).focus();
      return;
    }
    if (event.target.id === 'skill-category') { state.skillCategory = event.target.value; refresh(); return; }
    if (event.target.id !== 'portrait-file' || !event.target.files[0]) return;
    const character = state.character;
    const request = ++portraitRequest;
    try {
      const portrait = await readPortrait(event.target.files[0]);
      if (state.character !== character || request !== portraitRequest) return;
      state.character.portrait = portrait;
      state.character.portraitSource = null;
      state.error = '';
      persist();
    } catch (error) { state.error = error.message; }
    refresh();
  });
  root.addEventListener('click', async event => {
    const button = event.target.closest('button');
    if (!button) return;
    if(button.dataset.useDrug){
      const result=useStreetDrug(state.character,rules,button.dataset.useDrug);
      state.error=result.ok?'':result.error;if(result.ok)persist();refresh();return;
    }
    if (state.character.campaign?.active && !button.dataset.view && !['generate-character-sheet','new-character','resume-storage','cancel-delete-character','confirm-delete-character','lifepath-next','unlock-session'].includes(button.dataset.action) && !button.dataset.openCharacter && !button.dataset.deleteCharacter && !button.dataset.lifepathEdit && !button.dataset.lifepathClear && !button.dataset.lifepathSection && !button.dataset.equipmentTab && !button.dataset.warningEquipment) return;
    if (button.dataset.action==='unlock-session') { state.character.campaign.sessionUnlocked=true;persist();return navigate('session'); }
    if(button.dataset.hometown){updateSkillName('hometown',button.dataset.hometown);persist();refresh();return;}
    if (button.dataset.view) return navigate(button.dataset.view);
    if (button.dataset.openCharacter) {
      const character=readArchivedCharacter(button.dataset.openCharacter,rules);
      if(character)activateCharacter(character,button.dataset.openCharacter);
      else {state.error='Dieser gespeicherte Charakter konnte nicht geöffnet werden.';refresh();}
      return;
    }
    if (button.dataset.deleteCharacter) {
      if(state.pdfExportBusy)return;
      const key=button.dataset.deleteCharacter;
      const character=readArchivedCharacter(key,rules);
      if(!character){state.error='Dieser gespeicherte Charakter ist nicht mehr verfügbar.';state.archivedCharacters=archivedCharacters(rules);refresh();return;}
      state.pendingArchiveDeletion={key,name:character.name || 'Unbenannter Charakter'};
      refresh();return;
    }
    if(button.dataset.action==='cancel-delete-character'){
      cancelArchiveDeletion();return;
    }
    if(button.dataset.action==='confirm-delete-character'){
      const pending=state.pendingArchiveDeletion;
      if(!pending||state.pdfExportBusy)return;
      const result=deleteArchivedCharacter(pending.key,rules);
      state.pendingArchiveDeletion=null;
      state.error=result.ok?'':result.error;
      state.archivedCharacters=archivedCharacters(rules);
      refresh();
      document.getElementById('character-name')?.focus({preventScroll:true});
      document.getElementById('announcement').textContent=result.ok?'Gespeicherter Charakter permanent gelöscht.':result.error;
      return;
    }

    if (button.dataset.portrait) {
      const character = state.character, role = character.role;
      const request = ++portraitRequest;
      button.disabled = true;
      try {
        const portrait = await readGalleryPortrait(button.dataset.portrait);
        if (state.character !== character || character.role !== role || request !== portraitRequest) return;
        character.portrait = portrait;
        character.portraitSource = button.dataset.portrait;
        state.error = ''; persist();
      } catch (error) { state.error = error.message; }
      finally { refresh(); }
      return;
    }
    if (button.dataset.action === 'new-character') { activateCharacter(createCharacter(rules)); return; }
    if (button.dataset.action === 'reset-skill-points') {
      resetSkillPoints(state.character,rules);state.error='';persist();refresh();announceBudget();return;
    }
    if (button.dataset.action === 'generate-character-sheet') {
      if (state.pdfExportBusy) return;
      const readiness = characterSheetReadiness(state.character,rules,state);
      if (!readiness.ready) { state.error=readiness.errors.join(' '); refresh(); return; }
      const snapshot=structuredClone(state.character);
      state.pdfExportBusy=true;state.pdfExportMessage='';state.error='';refresh();
      try {
        const { downloadCharacterSheet } = await import('./pdf-character.js?v=budget2');
        const filename=await downloadCharacterSheet(snapshot,rules);
        state.pdfExportMessage=`PDF erstellt: ${filename}. Der Download wurde gestartet.`;
      } catch (error) { state.error=`Charactersheet konnte nicht erstellt werden: ${error.message}`; }
      finally { state.pdfExportBusy=false;refresh(); }
      return;
    }
    state.error = '';
    if(button.dataset.lifepathSection){state.lifepathSection=button.dataset.lifepathSection;state.lifepathQuestion=null;refresh();document.getElementById('lifepath-step')?.focus({preventScroll:true});return;}
    if (button.dataset.lifepathEdit) { state.lifepathSection=null;state.lifepathQuestion=button.dataset.lifepathEdit; refresh(); document.getElementById('lifepath-step')?.scrollIntoView({block:'start'}); return; }
    if (button.dataset.action === 'lifepath-next') { state.lifepathQuestion=null; refresh(); document.getElementById('lifepath-step')?.focus({preventScroll:true}); return; }
    if (button.dataset.warningEquipment) { state.equipmentTab=button.dataset.warningEquipment; navigate('cyberware'); return; }
    if (button.dataset.equipmentTab) { state.equipmentTab = button.dataset.equipmentTab; refresh(); return; }
    if (button.dataset.cyberCategory) {
      state.cyberCategory=button.dataset.cyberCategory; state.selectedCyberware=null; state.pendingLocation=null; state.installationOpen=false; refresh(); return;
    }
    if (button.dataset.selectCyberware) { if (state.selectedCyberware === button.dataset.selectCyberware) { state.selectedCyberware = null; state.pendingLocation = null; refresh(); } else selectCyberware(button.dataset.selectCyberware); return; }
    if(button.dataset.action==='cancel-cyber-placement'){state.cyberPlacement=null;refresh();return;}
    if (button.dataset.queueCyberware||button.dataset.confirmCyberLocation) {
      const id=button.dataset.queueCyberware??state.cyberPlacement?.id;
      if(!id)return;
      if(!button.dataset.confirmCyberLocation&&needsCyberwareSide(rules,id)){state.cyberPlacement={id};refresh();return;}
      const result=quickAddCyberware(state.character,rules,state.cyberDraft,id,button.dataset.confirmCyberLocation??null);
      state.error=result.ok?'':result.error;
      if(result.ok){
        const purchase=commitCyberwareDraft(state.character,rules,result.additions);
        state.error=purchase.ok?'':purchase.error;
        if(purchase.ok){state.cyberDraft=[];state.cyberPlacement=null;state.selectedCyberware=null;state.pendingLocation=null;persist();}
      }
      refresh();announceBudget();
      return;
    }
    if (button.dataset.action === 'queue-selection') { if (state.selectedCyberware && state.pendingLocation) insertCyberware(state.selectedCyberware,state.pendingLocation); return; }
    if (button.dataset.removeDraft) { removeDraft(button.dataset.removeDraft); return; }
    if (button.dataset.action === 'clear-cyber-draft') { state.cyberDraft = []; state.error = ''; refresh(); return; }
    if (button.dataset.action === 'cancel-removal') { state.removingCyberware = null; state.removalFee = ''; refresh(); return; }
    if (button.dataset.action === 'show-installation') { state.installationOpen=true; refresh(); document.getElementById('installation-preview')?.scrollIntoView({block:'start',behavior:'instant'}); document.getElementById('installation-preview')?.focus({preventScroll:true}); return; }
    if (button.dataset.action === 'toggle-installation') { state.installationOpen=!state.installationOpen; refresh(); if(!state.installationOpen) document.querySelector('.cyber-catalog')?.scrollIntoView({block:'start',behavior:'instant'}); return; }
    if (button.dataset.action === 'confirm-installation') {
      const result = commitCyberwareDraft(state.character,rules,state.cyberDraft);
      state.error = result.ok ? '' : result.error;
      if (result.ok) { state.cyberDraft = []; state.selectedCyberware = null; state.pendingLocation = null; persist(); }
      refresh(); announceBudget();
      return;
    }
    if (button.dataset.bodyLocation) {
      if (state.selectedCyberware) chooseInstallation(state.selectedCyberware,button.dataset.bodyLocation);
      else { state.inspectedLocation = button.dataset.bodyLocation; refresh(); }
      return;
    }
    if (button.dataset.action === 'clear-cyber-selection') { const previous=state.selectedCyberware; state.selectedCyberware = null; state.pendingLocation=null; state.installationOpen=false; refresh(); document.getElementById('select-'+previous)?.focus(); return; }
    if (button.dataset.editCustom) {
      const item = state.character.equipment.custom.find(item=>item.id===button.dataset.editCustom);
      if (item) state.customEquipmentDraft = {id:item.id,name:item.name,cost:String(item.cost),quantity:String(item.quantity),notes:item.notes};
      refresh(); document.getElementById('custom-equipment-name')?.focus(); return;
    }
    if (button.dataset.action === 'cancel-custom-equipment') { state.customEquipmentDraft = emptyCustomEquipmentDraft(); refresh(); return; }
    if (button.dataset.removeCustom) {
      removeCustomEquipment(state.character,button.dataset.removeCustom);
      if (state.customEquipmentDraft.id === button.dataset.removeCustom) state.customEquipmentDraft=emptyCustomEquipmentDraft();
    }
    else if (button.dataset.lifepathClear) {
      state.lifepathQuestion=button.dataset.lifepathClear;
      const result = chooseLifepath(state.character, button.dataset.lifepathClear, null);
      if (!result.ok) state.error = result.error;
    }
    else if (button.dataset.rolePoint) {
      const current = state.character.rolePoints[state.character.role]?.[button.dataset.rolePoint];
      const result = assignRolePoint(state.character, button.dataset.rolePoint, current + Number(button.dataset.roleDelta));
      if (!result.ok) state.error = result.error;
    }
    else if(button.dataset.attachWeapon){
      const result=addWeaponAttachment(state.character,rules,button.dataset.attachWeapon,button.dataset.attachment);if(!result.ok)state.error=result.error;
    }
    else if(button.dataset.detachWeapon){const result=removeWeaponAttachment(state.character,rules,button.dataset.detachWeapon,button.dataset.attachment);if(!result.ok)state.error=result.error;}
    else if (button.dataset.buyAmmoBundle) {
      const result = buyWeaponWithAmmo(state.character, rules, button.dataset.buyAmmoBundle);
      if (!result.ok) state.error = result.error;
    }
    else if (button.dataset.buyEquipment) {
      const result = buyEquipment(state.character,rules,button.dataset.buyEquipment);
      if (!result.ok) state.error = result.error;
      else if (button.dataset.wearArmor) equipArmor(state.character, rules, button.dataset.wearArmor, button.dataset.buyEquipment);
    }
    else if (button.dataset.removeEquipment) removeEquipment(state.character,button.dataset.removeEquipment);
    else if (button.dataset.removeCyberware) {
      if(canUndoCyberwarePurchase(state.character)&&cyberwareRemovalItems(state.character,rules,button.dataset.removeCyberware).length===1){const result=removeCyberware(state.character,rules,button.dataset.removeCyberware,baseStats(evaluateCharacter(state.character,rules)),0);state.error=result.ok?'':result.error;if(result.ok)persist();refresh();announceBudget();return;}
      state.removingCyberware = button.dataset.removeCyberware; state.removalFee = '';
      refresh(); document.getElementById('removal-panel')?.scrollIntoView({block:'nearest',behavior:'instant'}); document.getElementById('removal-panel')?.focus({preventScroll:true}); return;
    }
    else if (button.dataset.method) state.character.method = button.dataset.method;
    else if (button.dataset.skillAdjust) {
      const id = button.dataset.skill;
      const entry = state.character.skills.specialties.find(item => item.id === id);
      const current = id === 'native-language' ? state.character.skills.nativeLanguage.level : entry?.level ?? state.character.skills.ranks[id];
      const result = assignSkill(state.character, rules, id, current + Number(button.dataset.skillAdjust));
      if (!result.ok) state.error = result.error;
    }
    else if (button.dataset.addSpecialty) {
      const result = addSpecialty(state.character, rules, button.dataset.addSpecialty);
      if (!result.ok) state.error = result.error;
    }
    else if (button.dataset.removeSpecialty) {
      state.character.skills.specialties = state.character.skills.specialties.filter(item => item.id !== button.dataset.removeSpecialty);
      markSkillsEdited(state.character);
    }
    else if (button.dataset.role) {
      ++portraitRequest;
      state.character.role = button.dataset.role;
      automaticallyRecommendSkills(state.character, rules);
    }
    else if (button.dataset.action === 'remove-portrait') { ++portraitRequest; state.character.portrait = null; state.character.portraitSource = null; }
    else if (button.dataset.action === 'customize-recommendation') {
      if (Object.values(state.character.allocations.points).some(value => value !== rules.pointBuy.min) && !window.confirm('Deine eigene Punkteverteilung mit der aktuellen Empfehlung ersetzen?')) return;
      const result = applyRecommendation(state.character, rules);
      if (!result.ok) state.error = result.error;
    }
    else if (button.dataset.adjust) {
      const id = button.dataset.stat;
      if (state.character.method === 'recommendation') { const result = applyRecommendation(state.character, rules); if (!result.ok) { state.error=result.error;refresh();return; } }
      const result = assignAttribute(state.character, rules, id, state.character.allocations.points[id] + Number(button.dataset.adjust));
      if (!result.ok) state.error = result.error;
    } else if (button.dataset.action === 'reset') {
      if (!window.confirm('Den aktuellen Entwurf mit Name, Bild, Rolle, Attributen, Fertigkeiten und Cyberware unwiderruflich zurücksetzen?')) return;
      state.character = createCharacter(rules);
      state.cyberDraft = []; state.removingCyberware = null; state.removalFee = '';
      state.customSkillFields = [];
      state.customEquipmentDraft = emptyCustomEquipmentDraft();
      state.selectedCyberware = null; state.pendingLocation=null; state.inspectedLocation=null;
    } else if (button.dataset.action === 'resume-storage') {
      if (!window.confirm('Den gespeicherten Stand mit dem Entwurf aus diesem Tab ersetzen? Der bisher gespeicherte Stand wird überschrieben.')) return;
      state.storageBlocked = false;
    } else return;
    persist();
    refresh();
    announceBudget();
  });
  window.addEventListener('hashchange', () => {
    const view = location.hash.slice(1);
    if (views.includes(view)) navigate(view);
  });
  window.addEventListener('storage', event => {
    if(event.key?.startsWith('red-builder.character.archive.')){state.archivedCharacters=archivedCharacters(rules);refresh();return;}
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    state.storageBlocked = true;
    state.storageMessage = 'Der gespeicherte Stand wurde in einem anderen Tab geändert oder gelöscht. Dein Entwurf bleibt hier erhalten. Automatisches Speichern ist zum Schutz beider Stände pausiert.';
    refresh();
  });
  navigate(views.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'identity');
}

start().catch(error => {
  const message = document.createElement('p');
  message.className = 'notice loading';
  message.textContent = `${error.message} Starte die Anwendung über einen lokalen HTTP-Server (siehe README). Ein direkter Aufruf über file:// unterstützt ES-Module und JSON nicht zuverlässig.`;
  root.replaceChildren(message);
});
