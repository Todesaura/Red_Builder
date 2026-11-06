import {validateCharacter} from './model.js?v=group1';
import {characterSheetReadiness} from './pdf-character-data.js?v=group1';
import {createSessionDraft,completeSession} from './session-report.js?v=group1';
import {evaluateCharacter} from './rules.js?v=group1';
import {recoveryPlan} from './recovery-plan.js?v=recovery1';

export const playerKey=name=>name.trim().normalize('NFC').toLocaleLowerCase('de');
export function splitGroupReward(entries,request) {
  const {ids,gross,expenses}=request;
  if(!Array.isArray(ids)||!ids.length||new Set(ids).size!==ids.length)throw Error('Wähle mindestens einen Charakter.');
  if(!Number.isSafeInteger(gross)||!Number.isSafeInteger(expenses)||gross<0||gross>10000000||expenses<0||expenses>gross)throw Error('Einnahmen und Gruppenausgaben als ganze eb eingeben; Ausgaben höchstens so hoch wie Einnahmen.');
  const selected=ids.map(id=>{const e=entries.find(e=>e.id===id);if(!e||e.dead)throw Error('Ein gewählter Charakter fehlt oder ist verstorben.');if(!characterSheetReadiness(e.character,request.rules).ready)throw Error('Nur vollständig erstellte Charaktere können teilnehmen.');return e;});
  if(new Set(selected.map(e=>playerKey(e.character.playerName))).size!==selected.length)throw Error('Wähle pro Spieler nur einen Charakter.');
  selected.sort((a,b)=>playerKey(a.character.playerName).localeCompare(playerKey(b.character.playerName),'de')||a.id.localeCompare(b.id));
  const net=gross-expenses,base=Math.floor(net/selected.length),remainder=net%selected.length;
  return selected.map((entry,index)=>({id:entry.id,player:entry.character.playerName,name:entry.character.name,amount:base+(index<remainder?1:0)}));
}

export function groupReward(entries,request,rules) {
  if(typeof request.id!=='string'||!/^[-a-f0-9]{36}$/i.test(request.id))throw Error('Ungültige Abrechnungs-ID.');
  if(typeof request.name!=='string'||!request.name.trim()||request.name.length>100)throw Error('Gib einen Session-Namen an.');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(request.date)||Number.isNaN(Date.parse(request.date))||new Date(request.date).toISOString().slice(0,10)!==request.date)throw Error('Ungültiges Spieldatum.');
  const shares=splitGroupReward(entries,{...request,rules});
  const updated=entries.map(entry=>{
    const share=shares.find(s=>s.id===entry.id);if(!share)return entry;
    if(request.revisions?.[entry.id]!==entry.revision)throw Error('Ein Charakter wurde inzwischen geändert. Aktualisiere die Übersicht und prüfe die Aufteilung erneut.');
    const draft=createSessionDraft(entry.character);draft.id='group-'+request.id+'-'+entry.id;draft.name=request.name;draft.date=request.date;
    draft.actions=share.amount?[{type:'money',category:'reward',amount:share.amount}]:[];
    draft.notes='SL-Gruppenabrechnung: '+request.gross+' eb Einnahmen − '+request.expenses+' eb gemeinsame Ausgaben.';
    const result=completeSession(entry.character,rules,draft);if(!result.ok)throw Error(result.errors?.join(' ')||result.error||'Abrechnung fehlgeschlagen.');
    result.character.campaign.sessionUnlocked=true;
    result.character.groupRevision=entry.revision+1;
    return {...entry,revision:entry.revision+1,character:validateCharacter(result.character,rules),updatedAt:new Date().toISOString()};
  });
  return {entries:updated,receipt:{id:request.id,name:request.name,date:request.date,gross:request.gross,expenses:request.expenses,shares}};
}

export function groupHealth(entry,rules,date,groupDays=null) {
  const c=entry.character,v=evaluateCharacter(c,rules),missing=Math.max(0,v.health.maximum-v.health.current),injuries=c.campaign.injuries.filter(i=>['active','quickfix'].includes(i.status));
  let plan=null;
  const input=entry.recoveryInput??(!missing&&!injuries.length?{care:'none'}:null);
  if(input)try{plan=recoveryPlan(c,rules,{...input,...(Number.isFinite(groupDays)?{members:[{name:'Gruppe',days:groupDays}]}:{})},date);}catch(error){plan={ok:false,errors:[error.message]};}
  return {hp:v.health.current,maxHp:v.health.maximum,missing,injuries,minimumDays:Math.ceil(missing/Math.max(1,v.attributes.BODY.effective)),plan};
}
