import {evaluateCharacter} from './rules.js?v=shopping1';
import {livingCosts} from './lifepath.js';
import {roleRank} from './campaign-state.js?v=shopping1';

const integer=(value,label,max=365)=>{
  if(value===''||value==null||!Number.isSafeInteger(Number(value))||Number(value)<0||Number(value)>max)throw Error(`${label}: Gib eine ganze Zahl von 0 bis ${max} ein.`);
  return Number(value);
};
export function recoveryDate(date,days){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date)throw Error('Wähle ein gültiges Spieldatum.');
  const d=new Date(date+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);
}
export const SIDE_JOBS={
  rockerboy:['Kleiner Auftritt','Musik veröffentlichen','Gastauftritt'],solo:['Personenschutz','Türdienst','Begleitschutz'],
  netrunner:['Daten beschaffen','Systeme prüfen','Digitale Auftragsarbeit'],tech:['Geräte reparieren','Waffen warten','Sicherheitstechnik einbauen'],
  medtech:['Schicht in einer Klinik','Patienten versorgen','Medizinischer Bereitschaftsdienst'],media:['Reportage verkaufen','Freie Redaktion','Rechercheauftrag'],
  exec:['Beratung','Projektarbeit','Geschäftskontakte pflegen'],lawman:['Zusatzschicht','Sicherheitsdienst','Sonderauftrag'],
  fixer:['Geschäft vermitteln','Waren beschaffen','Kontakte zusammenbringen'],nomad:['Transportauftrag','Kurierfahrt','Fahrzeugbegleitung']
};

// Core pp. 222–225, 381–385. Living expenses are a transparent daily estimate,
// not an extra official daily fee and never a transaction or automatic healing.
export function recoveryPlan(character,rules,input={},date){
  const v=evaluateCharacter(character,rules),maxHp=v.derived.find(d=>d.id==='hp').value;
  const hp=character.campaign?.hp??maxHp,missing=Math.max(0,maxHp-hp),rate=v.attributes.BODY.effective;
  const care=input.care??'',errors=[];
  if(hp<=0)errors.push('Sterbend: Erst Todesrettung und erfolgreiche Stabilisierung klären. Danach beginnt die Planung mit mindestens 1 TP.');
  if(!['none','treated','stabilize','treatment','surgery'].includes(care))errors.push('Wähle, ob eine Behandlung oder Operation nötig ist.');
  const treatment=['treatment','surgery'].includes(care),procedures=treatment?integer(input.procedures??1,'Behandlungen',20):0;
  if(treatment&&!procedures)errors.push('Trage mindestens eine Behandlung ein.');
  const dv=treatment?integer(input.dv??15,'Höchster Behandlungs-SG',30):0;
  if(treatment&&![10,13,15,17,21,24,29].includes(dv))errors.push('Wähle einen angebotenen Behandlungs-SG.');
  const extraDays=integer(input.extraDays??0,'Zusätzliche Ausfallzeit');
  const extraCost=integer(input.extraCost??0,'Weitere Behandlungskosten',1000000);
  const stabilized=input.stabilized===true||input.stabilized==='yes'||character.campaign?.stabilized===true;
  const injuries=(character.campaign?.injuries??[]).filter(i=>['active','quickfix'].includes(i.status));
  if(injuries.length&&['none','stabilize'].includes(care))errors.push('Es gibt noch aktive kritische Verletzungen. Plane ihre dauerhafte Behandlung oder trage die erfolgte Behandlung ein.');
  if(treatment&&procedures<injuries.length)errors.push('Plane für jede aktive kritische Verletzung eine Behandlung ein.');
  if(injuries.length&&care==='treated')errors.push('Markiere die bereits behandelten Verletzungen zuerst unter „Verletzungen und bisherige Heilung“.');
  if(care==='treated'&&missing&&!stabilized)errors.push('Bestätige, dass die Stabilisierung bereits erfolgreich war.');
  if(care==='none'&&missing&&!stabilized)errors.push('Vor der Heilung ist eine erfolgreiche Stabilisierung nötig. Plane Klinikversorgung oder bestätige die erfolgte Stabilisierung.');
  if(missing&&rate<=0)errors.push('Ohne positive Körperkraft kann keine natürliche Erholungszeit berechnet werden.');
  const stabilizationDV=missing&&!stabilized?(hp<=0?15:hp<=Math.ceil(maxHp/2)?13:10):0;
  const highestDV=Math.max(dv,treatment||care==='stabilize'?stabilizationDV:0);
  const medical=highestDV?(highestDV>=17?1000:highestDV>=15?500:highestDV>=13?100:50):0;
  const healingDays=missing&&rate>0?Math.ceil(missing/rate):0;
  const hours=procedures*4;
  const ownDays=Math.max(healingDays,Math.ceil(hours/24),extraDays);
  if(!['home','hospital'].includes(input.stay??'home'))errors.push('Wähle deinen Erholungsort.');
  const nights=(input.stay??'home')==='hospital'?integer(input.nights??ownDays,'Krankenhausnächte'):0;
  const members=input.members??[];
  if(!Array.isArray(members)||members.length>12)throw Error('Höchstens zwölf weitere Gruppenmitglieder.');
  const crew=[];
  for(const member of members){
    const name=String(member.name??'').trim();
    if(!name&&(member.days===''||member.days==null))continue;
    if(!name||name.length>60||member.days===''||member.days==null){errors.push('Ergänze bei jedem Gruppenmitglied Name und Tage bis zur Einsatzbereitschaft.');continue;}
    crew.push({name,days:integer(member.days,'Erholung der Gruppe')});
  }
  const groupDays=Math.max(ownDays,...crew.map(m=>m.days)),freeDays=groupDays-ownDays;
  const budget=livingCosts(character),expenses=budget.complete?Math.ceil(budget.expenses*groupDays/30):null;
  const income=budget.complete?Math.floor(budget.income*groupDays/30):null;
  const hospital=nights*100,fees=medical+extraCost+hospital;
  const readyDate=recoveryDate(date,ownDays),groupDate=recoveryDate(date,groupDays);
  return {ok:!errors.length,errors,date,maxHp,hp,missing,rate,healingDays,procedures,hours,ownDays,readyDate,groupDays,groupDate,freeDays,
    members:crew.map(m=>({...m,freeDays:groupDays-m.days,readyDate:recoveryDate(date,m.days),weeks:Math.floor((groupDays-m.days)/7)})),
    weeks:Math.floor(freeDays/7),medical,highestDV,extraCost,nights,hospital,expenses,income,fees,total:expenses===null?null:fees+expenses-income,
    roleRank:roleRank(character),jobs:SIDE_JOBS[character.role]??[],injuries:injuries.map(i=>i.name)};
}
