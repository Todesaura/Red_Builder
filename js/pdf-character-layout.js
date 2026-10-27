import {INJURY_STATUS} from './campaign-rules.js?v=budget2';
// Coordinates measured on the supplied, unmodified 1500 x 1165 rendering.
import {CYBERWARE_PRINT_SUMMARIES,CYBERWARE_PRINT_NAMES} from './pdf-cyberware-summary.js?v=budget2';
// Each rectangle is inside the printed cell, below its printed label.
export const TEMPLATE_SHA256 = '4d5ed61178ef9c927178d0236f596642098af73bf5baff9d3d5046e5b55e4b4c';
export function characterSheetFields(data) {
  const fields = [];
  const add = (name,page,x,y,w,h,value,size=8,options={}) => fields.push({name,page,x,y,w,h,value:String(value ?? ''),size,...options});
  const skill = id => data.skills.find(entry => entry.id === id);
  const skillRow = (entry,x,y,key,label=null) => {
    if (!entry) return;
    if(label !== null) add(`${key}.name`,0,x-130,y,125,20,label,7);
    add(`${key}.rank`,0,x,y,35,20,entry.level);
    add(`${key}.attribute`,0,x+40,y,35,20,entry.attributeValue);
    add(`${key}.base`,0,x+82,y,38,20,entry.base);
  };
  add('identity.name',0,114,373,247,24,data.name,11);
  add('identity.role',0,114,422,247,23,data.role,10);
  add('identity.ability',0,114,473,185,23,data.ability,9);add('identity.rank',0,320,457,41,36,data.rank,13);
  const codes=['INT','REF','DEX','TECH','COOL','WILL','LUCK','MOVE','BODY','EMP'];
  codes.forEach((id,i)=>{
    const split = id==='LUCK'||id==='EMP';
    add(`stats.${id}`,0,395,122+i*76,split?30:57,45,data.attributes[id].effective,split?16:20);
    if(split)add(`statsBase.${id}`,0,441,122+i*76,19,45,data.attributes[id].base,8);
  });
  add('humanity.current',0,120,812,110,35,data.humanity.current,17);add('humanity.maximum',0,250,812,112,35,data.humanity.maximum,17);
  add('hp.maximum',0,112,892,68,30,data.derived.hp,16);add('hp.current',0,202,892,74,30,data.health?.current??data.derived.hp,16);
  if(data.campaign?.injuries.length){const injuries=data.campaign.injuries.filter(i=>i.status!=='resolved');if(injuries.length)add('health.critical',0,286,918,73,61,injuries.map(i=>i.name+' · '+INJURY_STATUS[i.status]+': '+i.notes).join('\n'),6.5,{minSize:5.5,displayValue:({'Gebrochene Rippen':'Rippen-\nbruch','Gebrochener Arm':'Armbruch','Gebrochenes Bein':'Beinbruch','Wirbelsäulenverletzung':'Wirbel-\nsäule'}[injuries[0].name]??injuries[0].name)+'\n'+INJURY_STATUS[injuries[0].status]+(injuries.length>1?'\n+'+(injuries.length-1)+' weitere':'' )});}
  add('hp.wound',0,186,941,89,25,data.derived.wound,14);add('death.base',0,210,1043,65,20,data.derived.death,13);
  add('identity.notes',0,115,529,247,223,`Initiative: ${data.derived.initiative} + 1W10\nGlück: ${data.derived.luck}${data.campaign?'\nIP: '+data.campaign.ip+' · Ruf: '+data.campaign.reputation+'\nAktuelle TP: '+data.health.current+' / '+data.health.maximum:''}\n\nEffektive Werte enthalten Rüstung, Implantate und Rollenboni.\n\nSpielregeln und Entfernungen: siehe Cheatsheet.`,8);
  const col1=[['concentration',127],['lip-reading',153],['conceal-reveal',179],['tracking',204],['perception',230],['athletics',283],['endurance',309],['resist-torture-drugs',334],['stealth',360],['contortionist',386],['dance',412],['drive-land',464],['pilot-air',490],['riding',515],['pilot-sea',541],['education',594],['business',620],['accounting',645],['bureaucracy',671],['library-search',697],['gamble',722],['criminology',748],['cryptography',774],['deduction',799],['tactics',825]];
  col1.forEach(([id,y])=>skillRow(skill(id),665,y,`skills.${id}`));
  const col2=[['local-home',230],['streetslang',334],['animal-handling',412],['composition',438],['wilderness-survival',464],['evasion',515],['brawling',541],['melee-weapon',594],['acting',722],['autofire',774],['archery',799],['handgun',825]];
  col2.forEach(([id,y])=>skillRow(skill(id),985,y,`skills.${id}`));
  add('skills.hometown',0,852,230,125,20,data.hometown,7);
  const slots={science:[153,179], 'local-expert':[257,283], language:[360,386], 'martial-arts':[567], 'play-instrument':[670,696]};
  for(const [group,rows] of Object.entries(slots)) {
    const entries=group==='language'?[skill('native-language'),...data.skills.filter(entry=>entry.specialty===group)]:data.skills.filter(entry=>entry.specialty===group);
    entries.slice(0,rows.length).forEach((entry,i)=>{
      const extra=i===rows.length-1?entries.slice(rows.length):[];
      const label=[entry.specialtyName ?? data.nativeLanguage,...extra.map(s=>`${s.specialtyName}: Rang ${s.level}, Basis ${s.base}`)].join('; ');
      skillRow(entry,985,rows[i],`skills.${entry.id}`,label);
    });
  }
  const col3=[['shoulder-arms',127],['heavy-weapons',153],['bribery',204],['wardrobe-style',230],['streetwise',257],['trading',283],['conversation',309],['personal-grooming',334],['human-perception',360],['persuasion',386],['interrogation',412],['basic-tech',464],['land-vehicle-tech',490],['cybertech',515],['electronics-security',541],['first-aid',567],['photography-film',594],['forgery',620],['paint-draw-sculpt',645],['air-vehicle-tech',671],['paramedic',697],['pick-lock',722],['demolitions',748],['pick-pocket',774],['sea-vehicle-tech',799],['weaponstech',825]];
  col3.forEach(([id,y])=>skillRow(skill(id),1305,y,`skills.${id}`));
  for(const [slot,y] of [['head',960],['body',986]]) {
    const armor=data.armor[slot];add(`armor.${slot}.name`,0,531,y,152,21,armor?.name.replace(/ [·-] (Kopf|Körper)$/,'') ?? (data.armor.cyberSP?'Implantierter Schutz':'Keine'),7);
    add(`armor.${slot}.sp`,0,692,y,50,21,data.armor[slot+'SP']);add(`armor.${slot}.penalty`,0,750,y,63,21,armor?.penalty ? '-'+armor.penalty : '0');
  }
  const sheetWeapons=[...(data.netWeapons??[]),...data.weapons];
  const weaponSummary=e=>e.net?`(Net) ${e.definition.name}: ${e.damage.ordinary}/${e.damage.blackIce} Integrität, Angriff ${e.attackBase??'nur mit Schnittstelle'}`:`${e.quantity}x ${e.definition.name}: ${e.definition.damage}, Angriffe ${e.definition.rof}, Magazin ${e.definition.magazine??'-'}, Basis ${(skill(e.definition.skill)?.base??0)+(e.definition.qualityBonus??0)+(e.definition.combatBonus??e.definition.smartBonus??0)+(data.attackBonus??0)}`;
  sheetWeapons.slice(0,6).forEach((entry,i)=>{
    const d=entry.definition,y=905+i*26;
    if(entry.net){
      const damage=entry.damage.ordinary===entry.damage.blackIce?entry.damage.ordinary:entry.damage.ordinary.replace('W6','')+'/'+entry.damage.blackIce;
      add(`weapons.${i}.name`,0,838,y,173,21,`(Net) ${entry.quantity}x ${d.name}`,7);
      add(`weapons.${i}.damage`,0,1018,y,52,21,damage,7);
      add(`weapons.${i}.magazine`,0,1078,y,63,21,'-');add(`weapons.${i}.rof`,0,1147,y,46,21,'-');
      const detail=`Integrität · ${entry.automatic?'selbstständig':'1 Netz-Aktion'} · Basis ${entry.attackBase??'nur mit Schnittstelle'}`;
      const extra=i===5?sheetWeapons.slice(6).map(weaponSummary).join('; '):'';
      add(`weapons.${i}.notes`,0,1202,y,221,21,detail+(extra?' / Weitere Waffen: '+extra:''),7);return;
    }
    add(`weapons.${i}.name`,0,838,y,173,21,`${entry.quantity}x ${d.name}`,7,{minSize:5.5,displayValue:`${entry.quantity}x ${d.modelName??d.name}`});add(`weapons.${i}.damage`,0,1018,y,52,21,d.damage,7);
    add(`weapons.${i}.magazine`,0,1078,y,63,21,d.magazineCount===2?`${d.magazine}x2`:d.magazine??'-');add(`weapons.${i}.rof`,0,1147,y,46,21,d.rof);
    const extra=i===5?sheetWeapons.slice(6).map(weaponSummary).join('; '):'';
    const attack=(skill(d.skill)?.base??0)+(d.combatBonus??d.smartBonus??0)+(d.qualityBonus??0)+(data.attackBonus??0);
    add(`weapons.${i}.notes`,0,1202,y,221,21,`${d.hands}H · ${d.concealable?'verdeckbar':'nicht verdeckbar'} · Basis ${attack}${d.attachments?.length?' · '+d.attachments.map(a=>a.name).join(', '):''}${extra?' / Weitere Waffen: '+extra:''}`,7,{minSize:5.5,displayValue:`${d.hands}H · ${d.concealable?'verdeckbar':'nicht verdeckbar'} · ${attack}+1W10${extra?' · + weitere':''}`});
  });
  if(data.campaign){add('campaign.ip',1,130,178,210,20,`${data.campaign.ip} IP verfügbar`,9);add('campaign.reputation',1,130,228,245,20,data.campaign.reputation,10);}
  add('identity.alias',1,125,131,520,18,data.name,10);
  const answer=id=>data.lifepath.find(entry=>entry.id===id)?.answer ?? '';
  for(const [id,x,y,w,h] of [['roots',125,343,275,24],['personality',427,343,274,24],['appearance',125,401,275,23],['values',125,459,275,23],['keepsake',427,517,274,23],['family',125,575,275,23],['turning-point',125,634,275,23],['goal',427,634,274,23],['friend',165,699,235,43],['love',470,699,231,43],['enemy',238,907,82,46]]) add(`lifepath.${id}`,1,x,y,w,h,answer(id),7);
  add('lifepath.career',1,747,916,686,145,`Beruf: ${answer('career')}\n\nRuf: ${answer('reputation')}\n\nGrenze: ${answer('boundary')}`,8);
  const outfit=(data.clothing??[]).map(i=>`${i.quantity}× ${i.definition.name}`).join('; ');
  const cosmetics=(data.fashionware??[]).map(i=>i.definition.name).join('; ');
  const costs=data.livingCosts,eb=n=>n===null||n===undefined?'offen':`${n} eb/Monat`;
  const styles=[...new Set((data.clothing??[]).map(i=>i.definition.style))];
  const outfitPreview=(data.clothing??[]).length?`${data.clothing.length} Teile · ${styles.slice(0,2).join(', ')}${styles.length>2?' + weitere Stile':''} (Einzelteile im Inventar)`:'';
  add('fashion.outfit',1,747,710,686,70,[outfit?'Kleidung: '+outfit:'',cosmetics?'Mode-Cyberware: '+cosmetics:'',`Monatlich: Ausgaben ${eb(costs?.expenses)}, Einnahmen ${eb(costs?.income)}, Nettobelastung ${eb(costs?.total)}`].filter(Boolean).join('\n'),7.5,{minSize:7,displayValue:['Nettobelastung monatlich: '+eb(costs?.total),cosmetics?'Mode-Cyberware: '+cosmetics:'',outfitPreview?'Kleidung: '+outfitPreview:''].filter(Boolean).join('\n')});
  add('living.housing',1,747,832,305,18,[data.hometown,answer('housing')].filter(Boolean).join(' · '),7,{displayValue:[(data.hometown??'').split(' – ')[0],answer('housing').split(' – ')[0]].filter(Boolean).join(' · ')});
  add('living.rent',1,1060,832,130,18,eb(costs?.housing),7);
  add('living.lifestyle',1,1205,832,225,18,answer('lifestyle'),7,{displayValue:answer('lifestyle').split(' – ')[0]+': '+eb(costs?.lifestyle)});
  add('lifepath.event',1,395,185,305,56,answer('turning-point'),7);
  const monthly=(costs?.items??[]).filter(i=>!['housing','lifestyle'].includes(i.id)&&i.amount!==null).map(i=>({name:'Monatlich: '+i.label,notes:`${i.amount<0?'Einnahme':'Ausgabe'} ${Math.abs(i.amount)} eb · ${i.answer}`}));
  const gear=[...(data.campaign?.injuries??[]).map(i=>({name:'Verletzung: '+i.name,notes:INJURY_STATUS[i.status]+' · '+i.notes})),...(data.campaign?.obligations??[]).map(note=>({name:'Verpflichtung',notes:note})),...(data.weaponAttachments??[]).flatMap(e=>e.attachments.map(a=>({name:`${e.quantity??1}x ${a.name}`,notes:`An ${e.weapon.shortName??e.weapon.name} · ${a.slots} ${a.slots===1?'Montageplatz':'Montageplätze'} · ${a.cost} eb je Exemplar` }))),...data.equipment.map(entry=>({name:`${entry.quantity}x ${entry.definition.name}`,notes:entry.definition.description??''})),...data.custom.map(entry=>({name:`${entry.quantity}x ${entry.name}`,notes:entry.notes})),...monthly];
  gear.slice(0,18).forEach((entry,i)=>{
    const extra=i===17?gear.slice(18).map(e=>`${e.name}: ${e.notes}`).join('; '):'';
    add(`equipment.${i}.name`,1,747,141+i*26,185,21,entry.name,7,{minSize:5.5});
    add(`equipment.${i}.notes`,1,943,141+i*26,490,21,[entry.notes,extra?'Weitere Gegenstände: '+extra:''].filter(Boolean).join(' / '),7);
  });
  add('equipment.ammo',1,945,607,484,20,data.ammo.map(entry=>`${entry.quantity*(entry.definition.units??1)-(data.campaign?.ammoSpent?.[entry.catalogId]??0)} ${entry.definition.name}`).join('; '),7);
  add('money.remaining',1,945,633,484,20,`${data.funds.remaining} eb · Fashion-Zuschuss übrig: ${data.funds.fashionRemaining} eb`,9);
  const zones={audio:[408,164,370,3], 'eye-left':[125,298,358,3], 'eye-right':[706,296,357,3], 'arm-left':[119,440,358,4], 'arm-right':[706,441,357,4], 'leg-left':[125,994,358,3], 'leg-right':[706,993,357,3], neural:[408,798,370,5], internal:[1107,165,329,7],external:[1107,407,329,7],fashion:[1107,648,329,7],borg:[1107,890,329,7]};
  for(const [zone,[x,y,w,rows]] of Object.entries(zones)) {
    // Borgware stays in its own table even if anatomically located in an eye.
    const entries=data.cyberware.filter(entry=>zone==='borg'?entry.definition.category==='borg':entry.location===zone&&entry.definition.category!=='borg');
    const foundation=entries.find(entry=>entry.definition.foundation);
    if(foundation&&['audio','eye-left','eye-right','arm-left','arm-right','leg-left','leg-right','neural'].includes(zone))add(`cyberware.${zone}.foundation`,2,x+w*0.4,y-24,30,19,'X',9);
    const options=entries.filter(entry=>!entry.definition.foundation || zone==='borg');
    options.slice(0,rows).forEach((entry,i)=>{
      const extra=i===rows-1?options.slice(rows).map(e=>`${e.definition.name}: ${e.definition.description}`).join('; '):'';
      add(`cyberware.${zone}.${i}.name`,2,x,y+i*26,w/2-7,21,entry.definition.name,6.5,{minSize:5.5,displayValue:CYBERWARE_PRINT_NAMES[entry.definition.id]??entry.definition.name});
      const short=CYBERWARE_PRINT_SUMMARIES[entry.definition.id]??entry.definition.description;
      add(`cyberware.${zone}.${i}.data`,2,x+w/2,y+i*26,w/2-4,21,[entry.definition.description,extra?'Weitere Implantate: '+extra:''].filter(Boolean).join(' / '),6.5,{minSize:5.5,displayValue:short+(extra?`; +${options.length-rows}`:'')});
    });
  }
  return fields;
}
