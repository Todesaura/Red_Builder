import {COMMUNITY_ATTACHMENTS} from './weapon-attachments-community.js?v=budget2';
export {COMMUNITY_SOURCE} from './weapon-attachments-community.js?v=budget2';
// Configuration is shared by all copies of a catalog weapon; each copy is charged.
export const ATTACHMENTS = Object.freeze([
  {id:'smartgun',name:'Smartgun-Anbindung',cost:500,slots:2,group:'link',description:'+1 auf Angriffe mit dieser Waffe, nur mit Neuralimplantat und Schnittstellenbuchsen oder subdermalem Griff. Montage: 1 Stunde.'},
  {id:'scope',name:'Zielfernrohr',cost:100,slots:1,group:'optic',description:'+1 auf Einzelschüsse und gezielte Schüsse ab 51 m; nicht mit Teleoptik stapelbar. Situativ, nicht pauschal eingerechnet.'},
  {id:'night-scope',name:'Infrarot-/Nachtsichtzielfernrohr',cost:500,slots:1,group:'optic',description:'Beim Blick durch das Visier keine Abzüge durch Dunkelheit, Rauch oder Nebel.'},
  {id:'extended-mag',name:'Erweitertes Magazin',cost:100,slots:1,group:'magazine',description:'Ersetzt das Standardmagazin durch das größere Magazin des Waffentyps.'},
  {id:'drum-mag',name:'Trommelmagazin',cost:500,slots:1,group:'magazine',description:'Ersetzt das Standardmagazin durch eine Trommel. Nachladen kostet zwei Aktionen.'},
  {id:'silencer',name:'Schalldämpfer',cost:100,slots:1,group:'muzzle',description:'Gedämpfter Schuss; Wahrnehmung mit Schwierigkeit nach Spielleitung, Waffengröße, Entfernung und Umgebung, um den Schuss zu hören. Die Waffe wird dadurch nicht lautlos.'},
  ...COMMUNITY_ATTACHMENTS
]);
const magazines={ 'medium-pistol':[18,36],'heavy-pistol':[16,24],'very-heavy-pistol':[16,24],smg:[50,60],'heavy-smg':[55,65],shotgun:[8,16],'assault-rifle':[35,45],'sniper-rifle':[8,12],'grenade-launcher':[4,6],'rocket-launcher':[2,3] };
export const attachmentList=(character,weaponId)=>(character.equipment.attachments??[]).filter(a=>a.weaponId===weaponId).map(a=>ATTACHMENTS.find(d=>d.id===a.attachmentId)).filter(Boolean);
export function canAttach(weapon,attachment) {
  if(!weapon||weapon.kind!=='weapon'||weapon.skill==='melee-weapon')return false;
  if(attachment.community){
    const gun=['handgun','shoulder-arms'].includes(weapon.skill),pistol=['medium-pistol','heavy-pistol','very-heavy-pistol'].includes(weapon.id);
    if(['finish','neon-finish','smart-sling'].includes(attachment.id))return true;
    if(!gun)return false;
    if(['choke','smart-choke'].includes(attachment.id))return weapon.id==='shotgun';
    if(attachment.id.startsWith('underbarrel-')||attachment.id==='foregrip')return weapon.skill==='shoulder-arms';
    if(['autofire-switch','pistol-stock'].includes(attachment.id))return pistol;
    if(['smart-grip','secondary-barrel'].includes(attachment.id))return weapon.skill==='handgun';
    if(['folding-stock','smart-stock'].includes(attachment.id))return weapon.skill==='shoulder-arms'||['smg','heavy-smg'].includes(weapon.id);
    return true;
  }
  if(attachment.group==='magazine')return !!magazines[weapon.id];
  if(attachment.id==='silencer')return ['handgun','shoulder-arms'].includes(weapon.skill);
  return true;
}
export function attachmentConflict(owned,attachment) {
  if(owned.some(p=>p.id===attachment.id))return 'Bereits montiert';
  if(owned.some(p=>p.group===attachment.group))return 'Position bereits belegt';
  if(owned.reduce((n,p)=>n+p.slots,0)+attachment.slots>3)return 'Zu wenig Montageplätze';
  if((attachment.group==='loader'&&owned.some(p=>p.id==='drum-mag'))||(attachment.id==='drum-mag'&&owned.some(p=>p.group==='loader')))return 'Nicht mit Trommel/Schnelllader kombinierbar';
  return '';
}
export function validateAttachments(input,items,rules) {
  if(input===undefined)return [];
  if(!Array.isArray(input)||input.length>100)throw new Error('Ungültige Waffenaufsätze.');
  const result=[],seen=new Set();
  for(const entry of input){
    const w=rules.equipmentRules.items.find(i=>i.id===entry?.weaponId),a=ATTACHMENTS.find(a=>a.id===entry?.attachmentId);
    if(!a||!items.some(i=>i.catalogId===w?.id)||!canAttach(w,a)||seen.has(w.id+':'+a.id))throw new Error('Ungültige Zuordnung eines Waffenaufsatzes.');
    const previous=result.filter(e=>e.weaponId===w.id).map(e=>ATTACHMENTS.find(a=>a.id===e.attachmentId));
    if(attachmentConflict(previous,a))throw new Error('Die Waffenaufsätze überschreiten Montageplätze oder belegen dieselbe Position: '+attachmentConflict(previous,a));
    seen.add(w.id+':'+a.id);result.push({weaponId:w.id,attachmentId:a.id});
  }
  return result;
}
export function weaponConfiguration(character,weapon) {
  const attachments=attachmentList(character,weapon.id),has=id=>attachments.some(a=>a.id===id);
  const cyber=new Set((character.cyberware?.items??[]).map(i=>i.catalogId));
  const connected=cyber.has('neural-link')&&(cyber.has('interface-plugs')||cyber.has('subdermal-grip'));
  const index=has('drum-mag')?1:has('extended-mag')?0:null;
  const smartBonus=has('smartgun')&&connected?1:0,excellent=['excellent','exzellent'].includes(weapon.quality);
  const passiveBonus=has('smart-grip')&&!excellent||has('pistol-stock')?1:0;
  const capacity=index===null?weapon.magazine:magazines[weapon.id]?.[index]??weapon.magazine;
  const nonconcealable=has('pistol-stock')||attachments.some(a=>a.group==='underbarrel');
  return {...weapon,attachments,smartBonus,passiveBonus,combatBonus:Math.max(smartBonus,passiveBonus)-(has('short-barrel')?1:0),
    hudReady:connected&&(cyber.has('chyron')||character.equipment.items.some(i=>i.catalogId==='virtuality-goggles')),
    scopeBonus:has('scope')?1:0,fireProfile:has('autofire-switch')?'smg':undefined,autofirePenalty:has('autofire-switch')?1:0,
    concealable:nonconcealable?false:has('short-barrel')?true:weapon.concealable,
    hands:has('pistol-stock')?2:weapon.hands,
    magazine:has('form-memory')&&capacity?Math.max(1,Math.floor(capacity/2)):capacity,
    magazineCount:has('mag-switch')?2:1,reloadActions:has('drum-mag')||has('mag-switch')?2:1};
}

// Additional barrels are separate weapons: no inherited main-weapon optics, grips or bonuses.
export function secondaryWeapons(character,rules) {
  const types={
    'underbarrel-ar':['assault-rifle','Unterlaufgewehr',10,'assault'],
    'underbarrel-pistol':['heavy-pistol','Unterlaufpistole',10,'single'],
    'underbarrel-smg':['smg','Unterlauf-MP',10,'smg'],
    'secondary-barrel':['very-heavy-pistol','Einzellauf',1,'single']
  };
  return (character.equipment.attachments??[]).filter(e=>types[e.attachmentId]).map(e=>{
    const [id,label,magazine,fireProfile]=types[e.attachmentId],base=rules.equipmentRules.items.find(i=>i.id===id),parent=rules.equipmentRules.items.find(i=>i.id===e.weaponId);
    return {quantity:character.equipment.items.find(i=>i.catalogId===e.weaponId)?.quantity??0,
      item:{...base,id:e.weaponId+'@'+e.attachmentId,baseWeaponId:id,name:label+' an '+(parent.shortName??parent.name),shortName:label,modelName:label,
        parentWeaponId:e.weaponId,fireProfile,magazine,attachments:[],smartBonus:0,combatBonus:0,scopeBonus:0,concealable:false,hands:parent.hands,
        cost:0,description:'Zusatzlauf: eigene Munition, eigener Angriff, separat nachladen; keine zusätzliche Aktion.'}};
  });
}

export function attachmentRuleText(attachment,weapon,context) {
  const skills=context.skills??[],s=id=>skills.find(s=>s.id===id)?.base??0;
  const base=s(weapon.skill)+(context.roleAbilities?.bonuses.attack??context.attackBonus??0)+(weapon.combatBonus??weapon.smartBonus??0);
  const has=id=>weapon.attachments?.some(a=>a.id===id),roll=n=>`${n} + 1W10`;
  switch(attachment.id){
    case 'smartgun':return weapon.smartBonus?'Aktiv: +1 Waffenpräzision bereits enthalten; nicht mit Griff/Anschlagschaft addieren.':'Inaktiv: benötigte Cyberware fehlt.';
    case 'scope':return `Ab 51 m: Einzelschuss ${roll(base+1)}${weapon.skill==='heavy-weapons'?'; keine gezielten Schüsse':`, gezielt ${roll(base-7)}`}. +1 nur hier, nicht in Tabelle; kein Stapeln mit Teleoptik.`;
    case 'long-barrel':return `Ab 51 m: Einzelschuss ${roll(base+1)}, gezielt ${roll(base-7)}. +1 nur hier; nicht mit anderen situativen Aufsatz-Zielboni addieren.`;
    case 'reflex-sight':return `Bis 50 m: Einzelschuss ${roll(base+1)}, gezielt ${roll(base-7)}. +1 nur hier; kein Dauerfeuerbonus oder Stapeln situativer Aufsatz-Zielboni.`;
    case 'variable-scope':return `Ab 51 m: ${roll(base+1)} / gezielt ${roll(base-7)}. 1/2 ganze Aktionen anlegen: ${roll(base+3)} / ${roll(base+5)} (gezielt ${roll(base-5)} / ${roll(base-3)}). Unter 51 m fehlt jeweils +1. Bewegung/Zielwechsel/Schuss beendet Anlegen; nicht mit anderen situativen Zielboni addieren.`;
    case 'bipod':return `Liegend/aufgesetzt, ab 51 m: ${roll(base+1)} / gezielt ${roll(base-7)}. Aufbau 1 Aktion; Bewegung beendet Auflage. Nicht mit anderen situativen Aufsatz-Zielboni addieren.`;
    case 'smart-grip':return '+1 bereits in Tabellenwürfeln; nicht mit exzellenter Qualität, Smartgun oder Anschlagschaft addieren.';
    case 'pistol-stock':return 'Zweihändig, nicht verdeckbar; +1 bereits enthalten. Mit Griff/Smartgun zusammen höchstens +1.';
    case 'short-barrel':return 'Verdeckbar bzw. +2 Verbergen wenn zuvor verdeckbar. −1 auf Angriffe bereits enthalten; unveränderter Schaden.';
    case 'compensator':return `Optionaler Einzelschuss: ${roll(base+1)}, 2 Patronen je Angriff, normaler Schaden einmal. Keine weiteren situativen Zielboni oder Dauerfeuerbonus.`;
    case 'laser':return `Optionaler Einzelschuss: ${roll(base+1)}; jedes Ziel darf ausweichen, auch unter Reflexe 8. Keine weiteren situativen Zielboni. Ohne Laser: Normalzeile.`;
    case 'underbarrel-ar':case 'underbarrel-pistol':case 'underbarrel-smg':case 'secondary-barrel':return `Zusatzlauf mit eigenen Tabellenwürfeln. Eigene Munition (${attachment.id==='underbarrel-ar'?'Gewehr':attachment.id==='underbarrel-pistol'?'schwere Pistole':attachment.id==='underbarrel-smg'?'mittlere Pistole':'sehr schwere Pistole'}), separat nachladen; keine Bonusaktion. Trägerwaffe nicht verdeckbar; Hauptwaffenboni nicht übertragen.`;
    case 'choke':case 'smart-choke':return `Schrot: ${roll(base)} über 13; 3W6, 1 Patrone. ${attachment.id==='smart-choke'?'Vor Schuss frei 6x6, 12x4 oder 18x2 m wählen.':'Feld 12 m lang, 4 m breit.'} Je Ziel Körperrüstung / zulässiges Ausweichen; nicht gezielt. Magazin nur eine Sorte; Wechsel = Nachladeaktion.`;
    case 'folding-stock':case 'smart-stock':return `Ausgeklappt: Tabellenwerte. Eingeklappt: ${roll(base-1)}, gezielt ${roll(base-9)}; verdeckbar bzw. +2 Verbergen. Umschalten ${attachment.id==='smart-stock'?'frei':'1 Aktion'}.`;
    case 'coupled-mags':case 'power-holster':return `1x/Runde ohne Aktion nachladen: Athletik ${roll(s('athletics'))} über 15. Fehlschlag: ungeladen, normales Nachladen nötig; Reservemunition vorausgesetzt.`;
    case 'foregrip':case 'griplock':case 'smart-sling':case 'forearm-holster':return `${['smart-sling','forearm-holster'].includes(attachment.id)?'Ohne Aktion verstauen; ':''}Gegen Wegreißen: Handgemenge ${roll(s('brawling')+2)}; Haltehilfen zusammen höchstens +2, keine Entwaffnungsimmunität.${attachment.id==='forearm-holster'?' Langwaffe: −2 auf körperliche Tätigkeiten, bei denen sie stört.':''}`;
    case 'finish':case 'neon-finish':{
      const bonus=Math.min(2,(has('finish')?1:0)+(has('neon-finish')?1:0));
      return `Sichtbar: Garderobe & Stil ${roll(s('wardrobe-style')+bonus)}; alle Waffenfinishs zusammen höchstens +2. ${has('neon-finish')?'Licht: 4 m², 10 Std./Batterie; verrät Position.':''}`;
    }
    case 'hud-link':return (weapon.hudReady?'Verbunden. ':'Inaktiv: Neuralimplantat + Buchsen/Griff + Chyron/Virtualitätsbrille nötig. ')+'Um Deckung zielen; Hand/Waffe bleiben angreifbar, keine freien Angriffe.';
    case 'autofire-switch':return weapon.magazine<10?`Inaktiv: Magazin ${weapon.magazine} < 10. Zuerst größeres Magazin montieren. Danach Dauerfeuer ×3 (MP-Tabelle), Dauerfeuerwurf −1.`:'Dauerfeuer ×3 und Unterdrücken: MP-Tabelle, 10 Schuss. −1 auf Dauerfeuer bereits enthalten; unveränderte normale Schüsse.';
    case 'mag-switch':return `2 getrennte Magazine à ${weapon.magazine}; vor Angriff Sorte frei wählen, nicht innerhalb eines Dauerfeuers. Beide nachladen: 2 Aktionen. Munition separat kaufen.`;
    case 'form-memory':return `Magazin ${weapon.magazine}, Halbierung bereits enthalten. Tarnform: Verbergen ${roll(s('conceal-reveal')+2)}; nicht schussbereit. Je 1 Aktion verwandeln; kein automatischer Suchschutz.`;
    default:return attachment.description;
  }
}
