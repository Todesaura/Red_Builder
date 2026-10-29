import {installedCyberWeapons} from './cyberware-weapons.js?v=shopping1';
import {weaponConfiguration,secondaryWeapons,attachmentRuleText} from './weapon-attachments.js?v=shopping1';
// Core weapon types only. No fire mode is inferred from magazine size or skill.
export const WEAPON_PROFILES = Object.freeze({
  'light-melee': 'melee', tomahawk:'melee', 'medium-melee':'melee', 'medium-melee-one-handed':'melee',
  'heavy-melee':'melee', 'heavy-melee-one-handed':'melee', 'very-heavy-melee':'melee', 'very-heavy-melee-one-handed':'melee',
  'medium-pistol':'single', 'heavy-pistol':'single', 'very-heavy-pistol':'single',
  smg:'smg', 'heavy-smg':'smg', 'assault-rifle':'assault', 'sniper-rifle':'single',
  shotgun:'shotgun', bow:'bow', 'grenade-launcher':'explosive', 'rocket-launcher':'explosive'
});
export const weaponProfile=item=>item?.fireProfile??WEAPON_PROFILES[item?.baseWeaponId??item?.id];
export const WEAPON_OPTIONS_SOURCE = 'https://rtalsoriangames.com/wp-content/uploads/2021/07/RTG-CPR-CoreBookFAQv1.3.pdf';
export function weaponOptionLabels(item) {
  const profile=item?.kind==='grenade'?'thrown':weaponProfile(item);
  if(profile==='thrown')return ['Handwurf · Athletik · maximal 25 m'];
  if(!profile)return [];
  if(profile==='explosive')return ['Explosiver Flächenangriff'];
  const labels=[profile==='melee'?'Gezielter Angriff':profile==='shotgun'?'Gezielter Schuss (Slug)':'Gezielter Schuss'];
  if(profile==='smg'||profile==='assault')labels.push(`Autofeuer (${profile==='smg'?3:4})`,'Unterdrückungsfeuer');
  if(profile==='shotgun')labels.push('Schrotpatronen (3W6)');
  return labels;
}
export function weaponOptions(item, evaluated) {
  if(item?.kind==='grenade'){const base=(evaluated.skills.find(s=>s.id==='athletics')?.base??0)+(evaluated.roleAbilities?.bonuses.attack??0);return [{id:'thrown',name:'Handgranate werfen',base,description:`Athletik ${base} + 1W10. Eine Aktion; maximal 25 m. Schwierigkeit 16 bis 6 m, 15 bis 25 m. Wirkung im 10 × 10 m-Bereich. ${item.description}`,reference:item.reference}];}
  const profile=weaponProfile(item);
  if(!profile)return [];
  const precision=evaluated.roleAbilities?.bonuses.attack??0;
  const skill=evaluated.skills.find(entry=>entry.id===item.skill);
  const base=(skill?.base??0)+precision+(item.combatBonus??item.smartBonus??0)+(item.qualityBonus??0);
  const entries=[];
  if(profile!=='explosive')entries.push({id:'aimed',name:profile==='melee'?'Gezielter Angriff':'Gezielter Schuss'+(profile==='shotgun'?' mit Slug':''),base:base-8,
    description:`Eine ganze Aktion, nur ein Angriff (ROF 1). Deine Angriffsbasis ${base} − 8 = ${base-8}; dazu 1W10. ${profile==='melee'?'Wie im Nahkampf gegen Ausweichen.':'Wie beim Einzelschuss: Auch Gegner mit REF 8 oder mehr dürfen stattdessen GES + Ausweichen + 1W10 verwenden. Vor dem Angriff ansagen und zuerst ausweichen; der Gegenwurf ersetzt die Entfernungs-DV.'} Kopf: Waffenschaden nach Kopfrüstung verdoppeln. Gehaltener Gegenstand: Bei durchdrungener Körperrüstung lässt das Ziel ihn fallen. Bein: Bei durchdrungener Körperrüstung entsteht die kritische Verletzung „Gebrochenes Bein“ (einschließlich 5 Zusatzschaden), sofern noch ein nicht gebrochenes Bein vorhanden ist.${profile==='shotgun'?' Nicht mit Schrotpatronen kombinierbar.':''}`,
    reference:'Grundregelwerk S. 170; FAQ: Flächenangriffe und kritische Verletzungen'});
  if((profile==='smg'||profile==='assault')&&(!item.autofirePenalty||item.magazine>=10)) {
    const automatic=evaluated.skills.find(entry=>entry.id==='autofire'),autoBase=automatic?.base??evaluated.attributes.REF.effective??0;
    const maximum=profile==='smg'?3:4;
    entries.push({id:'autofire',name:`Autofeuer (${maximum})`,base:autoBase+precision+(item.combatBonus??item.smartBonus??0)-(item.autofirePenalty??0),rounds:10,maximum,
      description:`Eine Aktion, 10 geladene Schuss. Dauerfeuer statt ${skill?.name??'normaler Waffenfertigkeit'}: Basis ${autoBase+precision+(item.combatBonus??item.smartBonus??0)-(item.autofirePenalty??0)} + 1W10 gegen die eigene Autofeuer-Entfernungs-DV oder zulässiges Ausweichen. Bei Treffer 2W6 × Überschuss über den maßgeblichen Zielwert, höchstens ×${maximum}; anschließend Körper-SP abziehen. Kein gezielter Schuss. Ein Ziel mit REF mindestens 8 darf ausweichen.`,reference:'Grundregelwerk S. 173'});
    entries.push({id:'suppressive',name:'Unterdrückungsfeuer',base:autoBase-(item.autofirePenalty??0),rounds:10,
      description:`Eine Aktion, 10 geladene Schuss. Deine Basis Dauerfeuer ${autoBase-(item.autofirePenalty??0)} + 1W10 wird mit WIL + Konzentration + 1W10 aller sichtbaren Personen zu Fuß ohne Deckung innerhalb von 25 m verglichen. Wer unterliegt, muss mit der nächsten Bewegungsaktion Deckung suchen und, falls nötig, auch seine Aktion zum Rennen nutzen. Dieser Modus verursacht keinen direkten Waffenschaden.`,reference:'Grundregelwerk S. 174'});
  }
  if(profile==='shotgun')entries.push({id:'shell',name:'Schrotpatronen statt Slugs',base,rounds:1,damage:'3W6',dv:13,range:6,
    description:`Slugs verursachen normal ${item.damage} gegen ein Ziel. Mit einer Schrotpatrone stattdessen Basis Schulterwaffen ${base} + 1W10 gegen DV 13: Alle sichtbaren Ziele im 6 m × 6 m großen Bereich unmittelbar vor dir erhalten bei Treffer denselben einmal gewürfelten 3W6-Schaden, je Ziel abzüglich Körper-SP. REF mindestens 8 erlaubt individuelles Ausweichen. Keine gezielten Schüsse. Schrotpatronen separat kaufen; das Startpaket enthält Slugs. Eine Nachladeaktion wechselt den Munitionstyp; im Magazin nur eine Sorte.`,reference:'Grundregelwerk S. 174; FAQ S. 2'});
  if(profile==='bow')entries.push({id:'arrows',name:'Pfeile / Bolzen',description:'Das Einlegen gehört zum Angriff; keine gesonderte Nachladeaktion. Basispfeile können nach dem Schuss wieder eingesammelt werden.',reference:'Grundregelwerk S. 174'});
  if(profile==='explosive')entries.push({id:'explosive',name:'Explosiver Flächenangriff',base,
    description:`Basis Schwere Waffen ${base} + 1W10 gegen die Entfernungs-DV. Ziel ist ein Bereich, keine einzelne Körperstelle. ${item.damage} einmal für die 10 m × 10 m große Explosion würfeln; Rüstung und Deckung je Ziel berücksichtigen. Keine gezielten Schüsse, kein Autofeuer und kein Unterdrückungsfeuer.`,reference:'Grundregelwerk S. 174; FAQ S. 2'});
  const has=id=>item.attachments?.some(a=>a.id===id);
  if(has('compensator'))entries.push({id:'compensated',name:'Kompensierter Einzelschuss',base:base+1,rounds:2,rof:item.rof,description:`${base+1} + 1W10; 2 Patronen je Angriff, ein normaler Schadenswurf. Kein zusätzlicher Treffer und kein Dauerfeuerbonus. Nicht mit anderen situativen Aufsatz-Zielboni addieren.`});
  if(has('laser'))entries.push({id:'laser',name:'Einzelschuss mit Laser',base:base+1,rounds:1,rof:item.rof,description:`${base+1} + 1W10; ein normaler Schuss. Jedes Ziel darf GES + Ausweichen + 1W10 gegenwürfeln, auch unter REF 8. Keine weiteren situativen Aufsatz-Zielboni addieren.`});
  if(has('choke')||has('smart-choke')){
    const shell=entries.find(e=>e.id==='shell');
    shell.description=`Schulterwaffen ${base} + 1W10 gegen 13, 3W6 je sichtbarem Ziel; Körperrüstung und zulässiges Ausweichen berücksichtigen. ${has('smart-choke')?'Vor Schuss frei wählen: 6 × 6 m, 12 × 4 m oder 18 × 2 m Linie.':'Schussfeld 12 m lang × 4 m breit.'} Kein gezielter Schuss, kein zusätzlicher Schaden, eine Schrotpatrone.`;
    shell.pattern=has('smart-choke')?'6x6 / 12x4 / 18x2 m':'12x4 m';
  }
  const enhancements=(item.attachments??[]).map(a=>({id:'attachment-'+a.id,name:a.name,description:attachmentRuleText(a,item,evaluated)}));
  return [...entries,...enhancements,...(item.cyberRule?[{id:'cyber-rule',name:item.name,description:item.cyberRule,reference:item.reference}]:[])];

}
export function ownedWeaponOptions(character,rules,evaluated) {
  const primary=character.equipment.items.map(entry=>({item:rules.equipmentRules.items.find(item=>item.id===entry.catalogId),quantity:entry.quantity}))
    .filter(entry=>['weapon','grenade'].includes(entry.item?.kind)).map(entry=>({...entry,item:weaponConfiguration(character,entry.item)}));
  return [...installedCyberWeapons(character,rules,evaluated),...primary,...secondaryWeapons(character,rules)].map(entry=>({...entry,options:weaponOptions(entry.item,evaluated)}));
}
