import {ATTACHMENTS,attachmentList} from './weapon-attachments.js?v=shopping1';
import {createCampaign,roleRank} from './campaign-state.js?v=shopping1';
import {validateCharacter} from './model.js?v=shopping1';
import {evaluateCharacter} from './rules.js?v=shopping1';
import {evaluateFunds,buyEquipment,removeEquipment,saveCustomEquipment,addWeaponAttachment,removeWeaponAttachment} from './economy.js?v=shopping1';
import {commitCyberwareDraft} from './cyberware-draft.js?v=shopping1';
import {removeCyberware} from './cyberware.js?v=shopping1';
import {equipArmor} from './armor.js?v=shopping1';
import {rolePool,validateRolePoints,PHARMACEUTICALS} from './role-points.js?v=shopping1';
import {improvementCost,THERAPIES,TRANSACTION_TYPES,humanityRollBounds} from './campaign-rules.js?v=shopping1';
import {evaluateLifepath} from './lifepath.js?v=shopping1';
import {recoveryPlan} from './recovery-plan.js?v=recovery1';

const number=(n,min=0,max=1000000)=>{if(!Number.isSafeInteger(n)||n<min||n>max)throw Error(`Gib eine ganze Zahl von ${min} bis ${max} ein.`);return n;};
const string=(s,max=1000)=>{if(typeof s!=='string'||s.length>max)throw Error(`Text darf höchstens ${max} Zeichen enthalten.`);return s.trim();};
const ensure=result=>{if(!result?.ok)throw Error(result?.error??'Änderung nicht möglich.');};
const uuid=()=>globalThis.crypto.randomUUID();
export function sessionSnapshot(character,rules){
  const v=evaluateCharacter(character,rules),maxHp=v.derived.find(d=>d.id==='hp')?.value??0,c=character.campaign??createCampaign();
  return {cash:v.funds.remaining,ip:c.ip,hp:c.hp??maxHp,maxHp,humanity:v.cyberware.current,maxHumanity:v.cyberware.maximum,empathy:v.cyberware.empathy,roleRank:roleRank(character),reputation:c.reputation,stabilized:c.stabilized};
}
export function sessionBase(character){return JSON.stringify(character);}
export function createSessionDraft(character){return {id:uuid(),number:Math.max(0,...(character.campaign?.history??[]).map(h=>h.number))+1,date:new Date().toLocaleDateString('en-CA'),name:'',notes:'',ipAward:0,actions:[],base:sessionBase(character)};}
// Cancel the creation-bookkeeping drift, then apply the actual agreed cash movement once.
// Existing purchase/install functions still enforce slots, ownership and dependencies.
function transact(c,rules,mutation,cashDelta){
  const old=c.campaign.cashAdjustment,before=evaluateFunds(c,rules).remaining;
  c.campaign.cashAdjustment+=10000000;
  ensure(mutation());
  c.campaign.cashAdjustment=old;
  const drift=evaluateFunds(c,rules).remaining-before;
  c.campaign.cashAdjustment=old-drift+cashDelta;
}
function setSkill(c,id,rank){
  if(id==='native-language')c.skills.nativeLanguage.level=rank;
  else {const s=c.skills.specialties.find(s=>s.id===id);if(s)s.level=rank;else c.skills.ranks[id]=rank;}
}
const readPath=(o,path)=>path.reduce((value,key)=>value?.[key],o);
const writePath=(o,path,value)=>{const parent=path.slice(0,-1).reduce((value,key)=>value[key],o);parent[path.at(-1)]=structuredClone(value);};
const writable=path=>path.length===1&&['skills','rolePoints','cyberware','equipment','lifepath'].includes(path[0])||path.length===2&&path[0]==='campaign'&&Object.hasOwn(createCampaign(),path[1])&&!['history'].includes(path[1]);
function changesBetween(before,after){
  const changes=[];
  for(const key of ['skills','rolePoints','cyberware','equipment','lifepath'])if(JSON.stringify(before[key])!==JSON.stringify(after[key]))changes.push({path:[key],before:before[key],after:after[key]});
  for(const key of Object.keys(after.campaign).filter(k=>k!=='history'))if(JSON.stringify(before.campaign[key])!==JSON.stringify(after.campaign[key]))changes.push({path:['campaign',key],before:before.campaign[key],after:after.campaign[key]});
  return structuredClone(changes);
}
export function previewSession(character,rules,draft){
  const errors=[],warnings=[],log=[],costs=[],cashFlows=[],improved=new Set();
  let c=structuredClone(character),before;
  try{
    c=validateCharacter(c,rules);before=sessionSnapshot(c,rules);
    if(!draft||draft.base!==sessionBase(character))throw Error('Der Charakter wurde seit Beginn des Reports geändert. Verwirf den Entwurf und starte ihn mit dem aktuellen Stand neu.');
    if(c.campaign.history.some(h=>h.id===draft.id))throw Error('Dieser Report wurde bereits abgeschlossen. Er wird nicht nochmals angewendet.');
    if(!string(c.name,60)||!c.role||evaluateCharacter(c,rules).attributeErrors.length||evaluateCharacter(c,rules).skillErrors.length)throw Error('Vervollständige vor dem ersten Report Identität, Attribute und Fertigkeiten.');
    number(draft.number,1,99999);if(c.campaign.history.some(h=>h.number===draft.number))throw Error('Diese Session-Nummer ist bereits vergeben.');
    if(!/^\d{4}-\d{2}-\d{2}$/.test(draft.date)||Number.isNaN(Date.parse(draft.date))||new Date(draft.date).toISOString().slice(0,10)!==draft.date)throw Error('Wähle ein gültiges Session-Datum.');
    string(draft.name,120);string(draft.notes,2000);
    if(!Array.isArray(draft.actions)||draft.actions.length>100)throw Error('Höchstens 100 Änderungen pro Report.');
    const correction=draft.actions.length===1&&draft.actions[0].type==='correction';
    if(!correction){c.campaign.active=true;c.campaign.hp??=before.hp;c.campaign.ip+=number(draft.ipAward);if(draft.ipAward)log.push(`Session-Belohnung: +${draft.ipAward} IP.`);}
    for(const [actionIndex,a] of draft.actions.entries()){
      const state=()=>sessionSnapshot(c,rules),v=()=>evaluateCharacter(c,rules);
      const actionStartCash=state().cash;
      const operationId=typeof a.actionId==='string'&&/^[a-zA-Z0-9-]{1,40}$/.test(a.actionId)?a.actionId:`${draft.id}-${actionIndex}`;
      switch(a.type){
        case 'money':{
          if(!Object.hasOwn(TRANSACTION_TYPES,a.category))throw Error('Unbekannte Geldkategorie.');const amount=number(a.amount),sign=['spent','lost'].includes(a.category)?-1:1;
          c.campaign.cashAdjustment+=sign*amount;log.push(`${TRANSACTION_TYPES[a.category]}: ${sign>0?'+':'−'}${amount} eb${a.description?' · '+string(a.description):''}.`);break;
        }
        case 'skill':{
          const skill=v().skills.find(s=>s.id===a.id);if(!skill)throw Error('Wähle eine vorhandene Fertigkeit.');
          const to=number(a.to,1,10),cost=improvementCost(skill.level,to,skill.cost);
          if((to-skill.level>1||improved.has(a.id))&&!a.timeConfirmed)throw Error('Mehrere Rangschritte: bestätige, dass zwischen den Steigerungen Zeit auf jedem neuen Rang verbracht wurde (S. 411).');
          if(c.campaign.ip<cost)throw Error(`Nicht genügend IP für ${skill.name}: ${cost} benötigt, ${c.campaign.ip} vorhanden.`);
          improved.add(a.id);c.campaign.ip-=cost;c.campaign.skillPointsAdded+=(to-skill.level)*skill.cost;setSkill(c,a.id,to);
          costs.push({name:skill.name,cost});log.push(`${skill.name}: Rang ${skill.level} → ${to}; neue Basis ${v().skills.find(s=>s.id===a.id).base}; ${cost} IP (${Array.from({length:to-skill.level},(_,i)=>(skill.level+i+1)*20*skill.cost).join(' + ')}).`);break;
        }
        case 'role-allocate':{
          if(c.role!=='solo')throw Error('Nur Solo-Kampfpunkte können frei umverteilt werden.');
          c.rolePoints.solo={...a.allocation};c.rolePoints=validateRolePoints(c.rolePoints,roleRank(c),c.role);
          if(v().roleAbilities.errors.length)throw Error(v().roleAbilities.errors.join(' '));log.push('Solo-Kampfpunkte neu verteilt; kein IP-Verbrauch. Im Kampf kostet Umverteilen eine Aktion.');break;
        }
        case 'role':{
          const oldAllocation=structuredClone(c.rolePoints[c.role]),old=roleRank(c),to=number(a.to,5,10),cost=improvementCost(old,to,3);if((to-old>1||improved.has('role'))&&!a.timeConfirmed)throw Error('Bestätige die Zeit auf jedem Zwischenrang.');
          if(c.campaign.ip<cost)throw Error(`Nicht genügend IP für den Rollenrang (${cost} IP).`);
          improved.add('role');c.campaign.roleRank=to;c.campaign.ip-=cost;
          const pool=rolePool(c.role,to);
          if(pool){
            if(!a.allocation)throw Error('Verteile die neuen Rollenpunkte.');c.rolePoints[c.role]={...a.allocation};
            if(c.role==='medtech')c.rolePoints.pharmaceuticals=a.pharmaceuticals??c.rolePoints.pharmaceuticals;
            c.rolePoints=validateRolePoints(c.rolePoints,to,c.role);
            if(c.role==='tech')for(const [key] of pool.fields){const delta=c.rolePoints.tech[key]-oldAllocation[key];if(delta<0||delta>to-old)throw Error('Tech: je Rang zwei verschiedene Fachgebiete um 1 steigern.');}
            if(c.role==='medtech')for(const [key] of pool.fields)if(c.rolePoints.medtech[key]<oldAllocation[key])throw Error('Medtech-Fachränge dürfen nicht umverteilt werden.');
            if(v().roleAbilities.errors.length)throw Error(v().roleAbilities.errors.join(' '));
          }
          costs.push({name:'Rollenfähigkeit',cost});log.push(`Rollenfähigkeit: Rang ${old} → ${to}; ${cost} IP.`);break;
        }
        case 'gear':{
          const d=rules.equipmentRules.items.find(d=>d.id===a.id);if(!d)throw Error('Wähle einen Kataloggegenstand.');const q=number(a.quantity,1,99),owned=c.equipment.items.find(i=>i.catalogId===a.id)?.quantity??0;
          if(d.kind==='ammo'&&a.mode==='consume'&&a.rounds!=null){
            const units=d.units??1,available=owned*units-(c.campaign.ammoSpent[a.id]??0),used=number(a.rounds,1,100000);
            if(used>available)throw Error(`Nur ${available} Schuss / Einheiten verfügbar.`);
            const remain=available-used,quantity=Math.ceil(remain/units);
            transact(c,rules,()=>{c.equipment.items=c.equipment.items.filter(i=>i.catalogId!==a.id);if(quantity)c.equipment.items.push({catalogId:a.id,quantity});return {ok:true};},0);
            if(quantity)c.campaign.ammoSpent[a.id]=quantity*units-remain;else delete c.campaign.ammoSpent[a.id];
            log.push(`Verbraucht: ${used} Schuss / Einheiten ${d.name}; ${remain} verbleiben.`);break;
          }
          if(['buy','loot'].includes(a.mode)){
            const total=a.mode==='loot'?0:number(a.price??(d.cost+attachmentList(c,a.id).reduce((sum,a)=>sum+a.cost,0))*q);
            transact(c,rules,()=>{for(let i=0;i<q;i++)ensure(buyEquipment(c,rules,a.id));return {ok:true};},-total);
            log.push(`${a.mode==='loot'?'Kostenlose Beute':'Kauf'}: +${q} × ${d.name}; ${total} eb.`);
          }else if(['sell','lost','consume'].includes(a.mode)){
            if(owned<q)throw Error(`Du besitzt nur ${owned} × ${d.name}.`);const price=a.mode==='sell'?number(a.price):0;
            transact(c,rules,()=>{for(let i=0;i<q;i++)removeEquipment(c,a.id);return {ok:true};},price);
            if(!c.equipment.items.some(i=>i.catalogId===a.id)){delete c.campaign.armorLoss[a.id];delete c.campaign.ammoSpent[a.id];}
            log.push(`${{sell:'Verkauft',lost:'Verloren / gestohlen',consume:'Verbraucht'}[a.mode]}: −${q} × ${d.name}; ${price} eb.`);
          }else throw Error('Unbekannte Inventaränderung.');break;
        }
        case 'custom':{
          if(!['buy','loot','sell','lost','consume'].includes(a.mode))throw Error('Ungültiger Vorgang.');
          const name=string(a.name,100),q=number(a.quantity,1,99);if(!name)throw Error('Benenne den eigenen Gegenstand.');
          if(['buy','loot'].includes(a.mode))transact(c,rules,()=>saveCustomEquipment(c,rules,{name,quantity:q,cost:0,notes:string(a.notes??'')}),a.mode==='buy'?-number(a.price):0);
          else {const item=c.equipment.custom.find(i=>i.id===a.id);if(!item||item.quantity<q)throw Error('Nicht genügend eigene Gegenstände vorhanden.');transact(c,rules,()=>{item.quantity-=q;c.equipment.custom=c.equipment.custom.filter(i=>i.quantity);return {ok:true};},a.mode==='sell'?number(a.price):0);}
          log.push(`Eigener Gegenstand (${{buy:'gekauft',loot:'erhalten',sell:'verkauft',lost:'verloren',consume:'verbraucht'}[a.mode]}): ${q} × ${name}; ${a.price??0} eb.`);break;
        }
        case 'attachment':{
          const weapon=c.equipment.items.find(i=>i.catalogId===a.id),attachment=ATTACHMENTS.find(d=>d.id===a.attachmentId);if(!weapon||!attachment)throw Error('Wähle eine vorhandene Waffe und einen passenden Aufsatz.');
          const removing=a.mode==='remove';if(!['install','remove'].includes(a.mode))throw Error('Unbekannter Aufsatzvorgang.');
          if(removing&&!c.equipment.attachments.some(i=>i.weaponId===a.id&&i.attachmentId===a.attachmentId))throw Error('Dieser Aufsatz ist nicht zugeordnet.');
          const amount=number(a.price??(removing?0:attachment.cost*weapon.quantity));
          transact(c,rules,()=>removing?removeWeaponAttachment(c,rules,a.id,a.attachmentId):addWeaponAttachment(c,rules,a.id,a.attachmentId),removing?amount:-amount);
          log.push(`${attachment.name}: ${removing?'entfernt':'installiert'} an ${weapon.quantity} × ${rules.equipmentRules.items.find(d=>d.id===a.id).name}; ${amount} eb ${removing?'Erlös':'Kosten'}.`);break;
        }
        case 'armor':{
          if(a.equip){ensure(equipArmor(c,rules,a.slot,a.id||null));log.push(`Rüstung ${a.slot==='head'?'Kopf':'Körper'} angelegt: ${a.id||'keine'}.`);break;}
          const d=rules.equipmentRules.items.find(d=>d.id===a.id&&d.category==='armor');if(!d||!c.equipment.items.some(i=>i.catalogId===a.id))throw Error('Wähle eine vorhandene Rüstung.');
          const loss=number(a.loss,0,d.sp),old=c.campaign.armorLoss[a.id]??0;if(loss<old&&!string(a.confirmation??''))throw Error('Bestätige die regelkonforme Reparatur (Probe/Zeit oder Spielleitung).');
          c.campaign.armorLoss[a.id]=loss;c.campaign.cashAdjustment-=number(a.cost??0);log.push(`${d.name}: Schutzwert ${d.sp-old} → ${d.sp-loss}; ${a.confirmation??'Schaden nach Session'}; ${a.cost??0} eb.`);break;
        }
        case 'cyber-acquire':{
          if(!['buy','loot'].includes(a.mode))throw Error('Ungültiger Cyberware-Erwerb.');
          const d=rules.cyberwareRules.items.find(d=>d.id===a.id);if(!d)throw Error('Unbekannte Cyberware.');number(a.quantity,1,20);
          for(let i=0;i<a.quantity;i++)c.campaign.cyberInventory.push({id:`session-${operationId}-stock-${i}`,catalogId:a.id,used:false});c.campaign.cashAdjustment-=a.mode==='buy'?number(a.price??d.cost*a.quantity):0;
          log.push(`${a.mode==='buy'?'Gekauft':'Erhalten'}: ${a.quantity} × ${d.name}, nur im Besitz; keine Effekte oder Menschlichkeitsverluste.`);break;
        }
        case 'cyber-install':{
          const additions=a.additions;if(!Array.isArray(additions)||!additions.length)throw Error('Wähle Cyberware im Konfigurator.');
          const ownedMap=a.owned??{},used=new Set();let credit=0;
          for(const entry of additions){const id=ownedMap[entry.id];if(!id)continue;const owned=c.campaign.cyberInventory.find(i=>i.id===id);if(!owned||owned.catalogId!==entry.catalogId||used.has(id))throw Error('Cyberware-Besitz passt nicht zum Einbau.');used.add(id);const d=rules.cyberwareRules.items.find(d=>d.id===entry.catalogId);credit+=d.cost;}
          const standard=additions.reduce((sum,i)=>sum+rules.cyberwareRules.items.find(d=>d.id===i.catalogId).cost,0)-credit;
          const price=number(a.price??standard),old=state();
          transact(c,rules,()=>commitCyberwareDraft(c,rules,additions),-price);
          c.campaign.cyberInventory=c.campaign.cyberInventory.filter(i=>!used.has(i.id));
          const definitions=additions.map(i=>rules.cyberwareRules.items.find(d=>d.id===i.catalogId)),bounds=humanityRollBounds(definitions);
          if(bounds.max>0&&a.humanityLoss==null)throw Error('Trage den gewürfelten Menschlichkeitsverlust für alle neuen Einbauten ein (auch bei Wiedereinbau).');
          const rolled=number(a.humanityLoss??0,bounds.min,bounds.max),average=definitions.reduce((sum,d)=>sum+d.humanity,0);
          c.campaign.humanityAdjustment+=average-rolled;

          log.push(`Installiert: ${additions.map(i=>rules.cyberwareRules.items.find(d=>d.id===i.catalogId).name).join(', ')}; ${price} eb (bereits hier verrechnet). Menschlichkeit ${old.humanity}/${old.maxHumanity} → ${state().humanity}/${state().maxHumanity} · gewürfelter Verlust ${rolled}${a.confirmation?' · '+string(a.confirmation):''}.`);break;
        }
        case 'cyber-remove':{
          const item=c.cyberware.items.find(i=>i.id===a.id);if(!item)throw Error('Implantat nicht installiert.');const old=state();
          transact(c,rules,()=>removeCyberware(c,rules,a.id,Object.fromEntries(Object.entries(v().attributes).map(([id,s])=>[id,s.base])),number(a.cost??0)),-number(a.cost??0));
          c.campaign.cyberDamaged=c.campaign.cyberDamaged.filter(id=>id!==a.id);c.campaign.cyberInventory.push({id:`session-${operationId}-removed`,catalogId:item.catalogId,used:true});
          if(state().humanity>old.humanity)c.campaign.humanityAdjustment-=state().humanity-old.humanity;
          log.push(`Ausgebaut und im Besitz: ${rules.cyberwareRules.items.find(d=>d.id===item.catalogId).name}. Menschlichkeit ${old.humanity} → ${state().humanity}; Maximum ${old.maxHumanity} → ${state().maxHumanity}; keine Heilung. Ausbau ${a.cost??0} eb.`);break;
        }
        case 'cyber-dispose':{
          if(!['sell','lost'].includes(a.mode))throw Error('Ungültiger Cyberware-Abgang.');
          const item=c.campaign.cyberInventory.find(i=>i.id===a.id);if(!item)throw Error('Cyberware nicht im Besitz.');c.campaign.cyberInventory=c.campaign.cyberInventory.filter(i=>i.id!==a.id);c.campaign.cashAdjustment+=a.mode==='sell'?number(a.price):0;log.push(`Cyberware ${a.mode==='sell'?'verkauft':'verloren'}: ${item.catalogId}; ${a.price??0} eb.`);break;
        }
        case 'cyber-repair':{
          if(!c.cyberware.items.some(i=>i.id===a.id))throw Error('Implantat nicht installiert.');
          if(!a.damaged&&!string(a.confirmation??''))throw Error('Reparatur/Upgrade benötigt bestätigte Probe, Zeit und Material.');
          c.campaign.cyberDamaged=c.campaign.cyberDamaged.filter(id=>id!==a.id);if(a.damaged)c.campaign.cyberDamaged.push(a.id);c.campaign.cashAdjustment-=number(a.cost??0);
          log.push(`Cyberware ${a.damaged?'beschädigt (Effekte ausgesetzt)':'repariert'}: ${a.id}; ${a.cost??0} eb; ${a.confirmation??''}.`);break;
        }
        case 'humanity':{
          const reason=string(a.reason??'');if(!reason)throw Error('Begründe den manuellen Menschlichkeitsverlust.');const old=state();c.campaign.humanityAdjustment-=number(a.loss,1,1000);log.push(`Manueller Ereignisverlust (Spielleitung): −${a.loss} HUM; ${reason}. ${old.humanity}/${old.maxHumanity} → ${state().humanity}/${state().maxHumanity}; EMP ${old.empathy} → ${state().empathy}.`);break;
        }
        case 'therapy':{
          const therapy=THERAPIES[a.kind];if(!therapy)throw Error('Wähle eine Therapieart.');if(number(a.days,0,365)<therapy.days)throw Error('Therapie erfordert sieben vollständige Tage in sicherer Umgebung.');
          if(!a.safe)throw Error('Bestätige die sichere Umgebung und vollständige Therapiezeit.');const paid=a.provider==='medtech'?number(a.cost??(a.kind==='standard'?100:500)):therapy.cost;
          c.campaign.cashAdjustment-=paid;const old=state();
          if(a.success){
            if(therapy.dice){const rolled=number(a.roll,therapy.dice,therapy.dice*6),actual=Math.max(0,Math.min(rolled,old.maxHumanity-old.humanity));c.campaign.humanityAdjustment+=actual;log.push(`${therapy.name}: gewürfelt ${rolled}, tatsächlich +${actual} HUM; ${old.humanity}/${old.maxHumanity} → ${state().humanity}/${state().maxHumanity}; EMP ${old.empathy} → ${state().empathy}; ${paid} eb, 7 Tage.`);}
            else {if(!string(a.reason??''))throw Error('Benenne die behandelte Sucht.');c.campaign.events.push(`Suchttherapie: ${a.reason}; ein Jahr automatisch misslungene Widerstandsprobe gegen den Sekundäreffekt dieser Droge beachten.`);log.push(`Suchttherapie: ${a.reason}; kein Menschlichkeitsgewinn; ${paid} eb.`);}
          }else log.push(`${therapy.name}: fehlgeschlagen, keine Wiederherstellung; ${paid} eb, 7 Tage.`);break;
        }
        case 'health':{
          const old=state(),max=old.maxHp;
          if(a.mode==='stabilize'){if(!string(a.confirmation??''))throw Error('Bestätige die erfolgreiche Stabilisierungsprobe.');c.campaign.stabilized=true;if(old.hp<1)c.campaign.hp=1;log.push(`Stabilisiert: ${old.hp} → ${c.campaign.hp} TP; ${a.confirmation}.`);break;}
          if(a.mode==='damage'){c.campaign.hp=old.hp-number(a.amount,1,10000);c.campaign.stabilized=false;}
          else if(a.mode==='rest'){if(!c.campaign.stabilized||!a.lightActivity)throw Error('Natürliche Heilung: zuerst stabilisieren, dann volle Tage mit nur leichter Aktivität.');c.campaign.hp=Math.min(max,old.hp+number(a.days,1,365)*v().attributes.BODY.effective);}
          else if(a.mode==='speedheal'){const day=a.date||draft.date;if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||c.campaign.speedhealDates.includes(day))throw Error('An diesem Spieldatum ist Schnellheilung bereits erfasst oder das Datum ungültig.');if(old.hp<=0||!a.medtech||!a.onceDaily)throw Error('Schnellheilung: Medtech verabreicht, höchstens einmal pro Tag, nicht sterbend.');c.campaign.speedhealDates.push(day);c.campaign.hp=Math.min(max,old.hp+v().attributes.BODY.effective+v().attributes.WILL.effective);c.campaign.cashAdjustment-=number(a.cost??0);}
          else if(a.mode==='set'){const hp=number(a.hp,-10000,max);if(hp>old.hp&&!string(a.confirmation??''))throw Error('Erhöhte TP manuell nur mit Begründung/Bestätigung der Spielleitung.');c.campaign.hp=hp;if(hp<old.hp)c.campaign.stabilized=false;}
          else throw Error('Unbekannte Heilungsart.');log.push(`Trefferpunkte (${{damage:'Schaden',rest:'Ruhe / natürliche Heilung',speedheal:'Schnellheilung',set:'manuell eingetragen'}[a.mode]}): ${old.hp}/${max} → ${c.campaign.hp}/${max}${a.mode==='rest'?`; ${a.days} volle Tage × KRA ${v().attributes.BODY.effective}`:''}${a.confirmation?'; '+a.confirmation:''}.`);break;
        }
        case 'injury':{
          if(a.id){const i=c.campaign.injuries.find(i=>i.id===a.id);if(!i)throw Error('Verletzung nicht gefunden.');if(!['active','quickfix','treated','resolved'].includes(a.status))throw Error('Ungültiger Behandlungsstatus.');if(a.status!=='active'&&!string(a.confirmation??''))throw Error('Behandlung: Probe, Zeit, behandelnde Person oder Spielleitung bestätigen.');i.status=a.status;i.notes=string(a.confirmation??i.notes);log.push(`${i.name}: ${a.status}; ${i.notes}. Keine automatische TP-Heilung.`);}
          else {if(!string(a.name,120))throw Error('Benenne die kritische Verletzung.');c.campaign.injuries.push({id:`session-${operationId}-injury`,name:a.name,status:'active',notes:string(a.notes??'')});log.push(`Kritische Verletzung: ${a.name}. Schaden separat erfassen, um ihn nicht doppelt abzuziehen.`);}break;
        }
        case 'story':{
          const allowed=['obligations','contacts','enemies','goals','events'];if(!allowed.includes(a.category))throw Error('Unbekannte Geschichts-Kategorie.');const value=string(a.text);if(!value)throw Error('Ergänze den Eintrag.');c.campaign[a.category].push(value);
          log.push(`${{contacts:'Kontakt',enemies:'Feind',goals:'Nächstes Ziel',events:'Ereignis',obligations:'Verpflichtung'}[a.category]}: ${value}`);break;
        }
        case 'reputation':{const old=c.campaign.reputation;c.campaign.reputation=number(a.value,0,10);if(a.reason)c.campaign.events.push(`Ruf ${a.value}: ${string(a.reason)}`);log.push(`Ruf ${old} → ${a.value}: ${string(a.reason??'')}`);break;}
        case 'note':{const note=string(a.text);if(!note)throw Error('Ergänze die bestätigte Änderung.');c.campaign.events.push(note);c.campaign.cashAdjustment-=number(a.cost??0);log.push(`Bestätigte Reparatur / regelkonformes Upgrade: ${note}; ${a.cost??0} eb. Keine erfundenen automatischen Boni.`);break;}
        case 'correction':{
          const h=c.campaign.history.at(-1);if(!h||h.id!==a.reportId||!string(a.reason??''))throw Error('Nur der letzte Report kann mit Begründung kontrolliert zurückgebucht werden.');
          for(const patch of h.changes){if(!writable(patch.path)||JSON.stringify(readPath(c,patch.path))!==JSON.stringify(patch.after))throw Error('Der Charakter wurde inzwischen verändert; sichere Rückbuchung nicht möglich.');}
          for(const patch of [...h.changes].reverse())writePath(c,patch.path,patch.before);log.push(`Korrekturbuchung zu Session ${h.number}: ${a.reason}. Originalbericht bleibt erhalten.`);break;
        }
        default:throw Error('Unbekannte Session-Änderung.');
      }
      // Do not bank humanity hidden above the current maximum (e.g. a 1-point loss with a 2-point maximum reduction).
      const h=v().cyberware,raw=h.start-h.loss+c.campaign.humanityAdjustment;
      if(h.maximum!==null&&raw>h.maximum)c.campaign.humanityAdjustment-=raw-h.maximum;
      const cashDelta=state().cash-actionStartCash;if(cashDelta)cashFlows.push({action:actionIndex,amount:cashDelta});
    }
    c=validateCharacter(c,rules);const evaluated=evaluateCharacter(c,rules);
    errors.push(...evaluated.errors.filter(error=>!evaluated.cyberware.warnings.includes(error)));
    if(c.campaign.hp!==null&&c.campaign.hp>(evaluated.derived.find(d=>d.id==='hp')?.value??0))errors.push('Aktuelle TP überschreiten das Maximum.');
    warnings.push(...evaluated.cyberware.warnings);
    let recovery=null;
    if(draft.recoveryPlan){
      try{recovery=recoveryPlan(c,rules,draft.recoveryPlan,draft.date);if(!recovery.ok)warnings.push('Erholungsplan aktualisieren: '+recovery.errors.join(' '));}
      catch(error){warnings.push('Erholungsplan aktualisieren: '+error.message);}
    }
    if((c.campaign.hp??before.hp)<=0)warnings.push('Charakter ist sterbend: Todesrettung und Stabilisierung beachten.');
    if(c.campaign.injuries.some(i=>i.status==='quickfix'))warnings.push('Quick Fix unterdrückt den Verletzungseffekt nur bis zum Tagesende; keine dauerhafte Behandlung.');
    return {ok:!errors.length,character:c,before,after:sessionSnapshot(c,rules),errors:[...new Set(errors)],warnings,log,costs,cashFlows,recovery,changes:changesBetween(character,c)};
  }catch(error){errors.push(error.message);return {ok:false,character:c,before:before??null,after:null,errors,warnings,log,costs,cashFlows,changes:[]};}
}
export function completeSession(character,rules,draft){
  const preview=previewSession(character,rules,draft);if(!preview.ok)return {ok:false,error:preview.errors.join(' ')};
  const next=preview.character;
  next.campaign.history.push({id:draft.id,number:draft.number,date:draft.date,name:draft.name,notes:draft.notes,before:preview.before,after:preview.after,changes:preview.changes,log:preview.log,...(preview.recovery?.ok?{recoveryPlan:preview.recovery}:{}),correctionOf:draft.actions[0]?.type==='correction'?draft.actions[0].reportId:null});
  try{return {ok:true,character:validateCharacter(next,rules),report:next.campaign.history.at(-1)};}catch(error){return {ok:false,error:error.message};}
}
