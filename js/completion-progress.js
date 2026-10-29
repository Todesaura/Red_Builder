import {evaluateCharacter} from './rules.js?v=shopping1';
import {characterSheetReadiness,characterSheetDraftErrors} from './pdf-character-data.js?v=shopping1';
import {equipmentWarnings} from './equipment-warnings.js?v=shopping1';

const issue=(label,view,extra={})=>({label,view,...extra});
const step=(id,title,issues,notes=[])=>({id,title,issues,notes,complete:issues.length===0,status:issues.length?'incomplete':notes.length?'warning':'complete',label:issues.length?issues[0].label:notes.length?`Optional · ${notes.length} ${notes.length===1?'Hinweis':'Hinweise'}`:'Vollständig'});

// Presentation only: reuse the existing rule checks and PDF gate, never change data.
export function completionProgress(character,rules,state={},evaluated=evaluateCharacter(character,rules)){
  const v=evaluated,role=rules.roles.find(r=>r.id===character.role),identity=[];
  if(!character.name.trim())identity.push(issue('Name fehlt','identity',{focus:'character-name'}));
  if(!role)identity.push(issue('Rolle fehlt','identity',{focus:'identity-roles'}));
  const attributes=role?v.attributeErrors.filter(error=>error!=='Gib deinem Charakter einen Namen.'&&error!=='Wähle eine Charakterrolle.').map(error=>issue(error,'attributes',{focus:'attribute-'+rules.attributes[0].id})):[issue('Zuerst Rolle wählen','identity',{focus:'identity-roles'})];
  const skills=role?v.skillErrors.map(error=>{
    if(error==='Benenne deine kulturelle Herkunftssprache.')return issue('Sprache fehlt','skills',{focus:'native-language-name'});
    if(error==='Benenne deine Heimat für die Ortskenntnis.')return issue('Heimat fehlt','skills',{focus:'hometown-name'});
    return issue(error,'skills',{focus:/Herkunftssprache|Straßenslang/.test(error)?'native-language-name':/Heimat/.test(error)?'hometown-name':'skill-search'});
  }):[issue('Zuerst Rolle wählen','identity',{focus:'identity-roles'})];
  const roles=role?v.roleAbilities.errors.map(error=>issue(error,'role-abilities',{focus:/Pharmazeutikum/.test(error)?'role-pharmaceuticals':'role-points'})):[issue('Zuerst Rolle wählen','identity',{focus:'identity-roles'})];
  const missing=v.lifepath.entries.filter(q=>!q.complete),life=[];
  if(missing.length)life.push(issue(`Noch ${missing.length} ${missing.length===1?'Lebensweg-Frage':'Lebensweg-Fragen'} beantworten`,'lifepath',{life:missing[0].id,focus:character.lifepath[missing[0].id]?.choice==='custom'?`life-${missing[0].answer?'cost':'text'}-${missing[0].id}`:'lifepath-step'}));
  for(const q of missing.filter(q=>q.answer&&q.monthlyCosts&&character.lifepath[q.id]?.choice==='custom'))life.push(issue(`Monatsbetrag fehlt: ${q.budgetLabel}`,'lifepath',{life:q.id,focus:'life-cost-'+q.id}));
  const equipment=v.cyberwareErrors.filter(error=>!character.campaign?.active||!v.cyberware.warnings.includes(error)).map(error=>issue(error,'cyberware',{tab:'cyberware',focus:'cyber-status'}));
  for(const error of characterSheetDraftErrors(state))equipment.push(issue(error,'cyberware',{tab:error.includes('Ausrüstungsentwurf')?'misc':'cyberware',focus:error.includes('Ausrüstungsentwurf')?'custom-equipment-form':state.removingCyberware?'removal-panel':'cyber-status'}));
  const notes=equipmentWarnings(character,rules,v).map(note=>issue(note.title,'cyberware',{tab:note.tab}));
  const steps=[step('identity','Identität',identity),step('attributes','Attribute',attributes),step('skills','Fertigkeiten',skills),step('role-abilities','Rollenfähigkeiten',roles),step('lifepath','Lebensweg',life),step('cyberware','Ausstattung',equipment,notes)];
  const sheet=characterSheetReadiness(character,rules,state),remaining=steps.filter(s=>!s.complete);
  const review=step('review','Überprüfung',sheet.ready?[]:remaining.length?remaining.map(s=>issue(`${s.title}: ${s.label}`,s.issues[0].view,{...s.issues[0],label:`${s.title}: ${s.label}`})):sheet.errors.map(error=>issue(error,'review')));
  review.complete=sheet.ready;review.status=sheet.ready?'complete':'incomplete';review.label=sheet.ready?'PDF bereit':`${remaining.length||1} ${remaining.length===1?'Schritt offen':'Schritte offen'}`;
  return {steps:[...steps,review],complete:steps.filter(s=>s.complete).length,total:steps.length,ready:sheet.ready};
}
