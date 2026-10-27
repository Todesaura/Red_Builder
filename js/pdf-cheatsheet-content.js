import {INJURY_STATUS} from './campaign-rules.js?v=budget2';
import {attachmentRuleText} from './weapon-attachments.js?v=budget2';
// Presentation only: use evaluated bases; never apply an effect to character state.
import { NET_SUPPORT_SUMMARIES } from './netrunner-german.js';
const roll = value => `**${value} + 1W10**`;
const skill = (data,id) => data.skills.find(s=>s.id===id)?.base ?? 0;
const stat = (data,id) => data.attributes[id].effective;
const section = (title,rows) => [title,rows.filter(Boolean)];
const owned = (data,id) => [...data.equipment,...data.netPrograms].some(e=>e.definition.id===id);

export function roleReference(data) {
  const s=id=>skill(data,id), r=data.rank, p=data.roleState??{}, b=data.roleBonuses??{};
  const title=`${data.ability} / RANG ${r}`;
  switch(data.roleId) {
    case 'solo': return [section(title,[
      `**Passiv / bereits enthalten:** Initiative ${roll(data.derived.initiative)}; Angriffe +${b.attack??0}; Wahrnehmung ${roll(s('perception'))}.`,
      `Erster Treffer je Runde: **+${b.firstDamage??0} Schaden** vor Rüstung. Erster erlittener Schaden je Runde: **-${b.damageDeflection??0}**.`,
      b.damageDeflection?'Schaden abfangen verhindert keinen Rüstungsabtrag bei vorheriger Durchdringung.':null,
      `Angriffs-Patzer abfangen: **${b.fumbleRecovery?'aktiv (keinen Zusatz-W10 abziehen)':'nicht aktiv'}**.`,
      `Verteilung: ${data.roleDetails.join('; ')}. Punkte vor dem Kampf, mit einer Aktion oder außerhalb des Kampfes neu verteilen.`
    ])];
    case 'tech': {
      const t=p.tech, raw=s('basic-tech')-t.field;
      return [section(title,[
        `**Passiv:** Feldexpertise ${t.field} ist in gewöhnlichen Technikbasen enthalten; Grundlegende Technik ${roll(s('basic-tech'))}.`,
        ...[['upgrade','Verbessern'],['fabrication','Herstellen'],['invention','Erfinden']].map(([id,label])=>`${label}: ${t[id]?roll(raw+t[id])+' mit Grundlegender Technik':'nicht erlernt'}.`),
        'Fachproben: passende Technik verwenden; Feldexpertise durch den jeweiligen Fachrang ersetzen, nicht addieren.',
        `Provisorisch reparieren: ${t.field?'**'+t.field*10+' Minuten** haltbar':'erst ab Feldexpertise 1'}. Material, Schwierigkeit und Arbeitszeit nach Aufgabe; Erfindungen mit Spielleitung abstimmen.`
      ])];
    }
    case 'medtech': {
      const m=p.medtech, surgery=m.surgery*2, medical=m.pharma+m.cryo;
      return [section(title,[
        `Chirurgie: ${surgery?roll(stat(data,'TECH')+surgery)+' (Technik + '+surgery+' Chirurgie)':'nicht erlernt'}; Operationen und schwere kritische Verletzungen.`,
        `Medizintechnik: ${medical?roll(stat(data,'TECH')+medical)+' (Technik + '+m.pharma+' Pharmazeutik + '+m.cryo+' Kryotechnik)':'nicht erlernt'}.`,
        ...data.roleDetails.filter(value=>value.startsWith('Bekannte Pharma')).map(value=>value+'.'),
        `Pharmazeutik erschließt Präparate; Kryotechnik Stasis in Kryopumpe/-tank. Erste Hilfe bleibt ${roll(s('first-aid'))}; Medizinrang nicht addieren.`
      ])];
    }
    case 'rockerboy': return [section(title,[
      `Fans gewinnen: ${roll(r)} gegen Schwierigkeit; außerhalb des Kampfes, nur Personen, die dich nicht ablehnen.`,
      `Fans mobilisieren: Zahl und mögliche Gefallen nach Rollenrang und Situation. Auftritte und Überreden sind eigene Proben; den Rollenrang dort nicht addieren.`,
      `Überreden ${roll(s('persuasion'))}; Schauspiel ${roll(s('acting'))}.`
    ])];
    case 'media': return [section(title,[
      `Passive Hinweise: ${roll(r)}, verdeckt durch die Spielleitung.`,
      `Aktiv recherchieren: Bibliotheksrecherche ${roll(s('library-search'))}; Konversation ${roll(s('conversation'))}; Verhör ${roll(s('interrogation'))}.`,
      `Veröffentlichen: Publikum, Belege und Rollenrang bestimmen Wirkung/Glaubhaftigkeit. Separate Glaubhaftigkeitsprobe, kein Intelligenzbonus und kein Glück.`
    ])];
    case 'exec': return [section(title,[
      `**Firmenleistungen:** rangabhängige Kleidung, Unterkunft und Teammitglieder; kein zusätzliches Bargeld. Konkrete Zusagen mit Spielleitung klären.`,
      `Teammitglied handelt mit **eigenen Werten**. Teamführung nicht auf Proben addieren; Behandlung beeinflusst Loyalität.`,
      `Geschäftssinn ${roll(s('business'))}; Bürokratie ${roll(s('bureaucracy'))}; Überreden ${roll(s('persuasion'))}.`
    ])];
    case 'lawman': return [section(title,[
      `**Verstärkung rufen / 1 Aktion:** **1W10 <= ${r}**; kein Attribut addieren.`,
      `Erfolg: Ankunft nach **1W6 Runden**. Bei einer 6 kommt die nächsthöhere Unterstützungsstufe.`,
      `Nur in Gefahr; Missbrauch hat Konsequenzen. Wahrnehmung ${roll(s('perception'))}; Verhör ${roll(s('interrogation'))}.`
    ])];
    case 'fixer': return [section(title,[
      `Feilschen: ${roll(s('trading')+r)} gegen Feilschen des Gegenübers (Handeln ${s('trading')} + Rollenrang ${r}). Rabatt nur bei gewonnenem, zulässigem Deal.`,
      `Beschaffung: Kontakte/Preisstufen nach Rang; Ware bleibt kostenpflichtig. Straßenwissen ${roll(s('streetwise'))}; Überreden ${roll(s('persuasion'))}.`,
      `Rang 4: zusätzliche Kultur und passende Sprache auf Rang 4 mit Spielleitung festlegen; nicht automatisch in deinen Sprachwerten enthalten.`
    ])];
    case 'nomad': return [section(title,[
      `**Passiv:** Fahrzeugmeisterschaft +${r} bereits in Fahrzeugbasen enthalten; nicht nochmals addieren. Reiten zählt nicht.`,
      `Steuern: Land ${roll(s('drive-land'))}; Luft ${roll(s('pilot-air'))}; Wasser ${roll(s('pilot-sea'))}.`,
      `Fahrzeugtechnik: Land ${roll(s('land-vehicle-tech'))}; Luft ${roll(s('air-vehicle-tech'))}; Wasser ${roll(s('sea-vehicle-tech'))}.`,
      `Familienfuhrpark: rangabhängige Fahrzeuge/Verbesserungen mit Spielleitung festlegen; kein Bargeldbonus.`
    ])];
    case 'netrunner': return netReference(data);
    default: return [section(title,[data.roleDescription,...data.roleExamples])];
  }
}

const NET_ATTACK_EFFECTS={
 'net-program-banhammer':'Programme: 3W6 Integrität / Schwarzes ICE: 2W6.',
 'net-program-sword':'Programme: 2W6 Integrität / Schwarzes ICE: 3W6.',
 'net-program-deckkrash':'Unsicher ausloggen; aktives angetroffenes feindliches ICE wirkt.',
 'net-program-hellbolt':'2W6 Hirnschaden; ohne Isolierung Brand: 2 Trefferpunkte/Zugende, 1 körperliche Aktion löschen; nicht stapelbar.',
 'net-program-nervescrub':'Intelligenz, Reflexe, Geschicklichkeit je -1W6 für 1 Std., mindestens 1.',
 'net-program-poison-flatline':'Zufälliges installiertes gewöhnliches Programm zerstören.',
 'net-program-superglue':'1W6 Runden nicht tiefer/sicher ausloggen; unsicher möglich. 1x/Kopie/Einsatz.',
 'net-program-vrizzbolt':'1W6 Hirnschaden; nächster Zug -1 Netz-Aktion, mindestens 2.'
};

function netReference(data) {
  const r=data.rank, actions=r<=3?2:r<=6?3:r<=9?4:5;
  const check=(label,id)=>`${label}: ${owned(data,id)?`${roll(r+2)} (${data.netPrograms.find(e=>e.definition.id===id).definition.name} aktiv; sonst ${r} + 1W10)`:roll(r)}.`;
  const support=data.netPrograms.filter(e=>e.definition.netrunner.className==='Defender'||e.definition.id==='net-program-speedy-gonzalvez');
  const attacks=data.netPrograms.filter(e=>!['Booster','Defender'].includes(e.definition.netrunner.className));
  const hardware=data.equipment.filter(e=>e.definition.netrunner?.group==='hardware');
  const ice=data.equipment.filter(e=>e.definition.netrunner?.group==='ice');
  return [
    section(`SCHNITTSTELLE / RANG ${r}`, [
      `**${actions} Netz-Aktionen ODER 1 körperliche Aktion** je Zug; Bewegung bleibt. Nicht mischen / ansparen. Netz-Aktion = ein digitaler Befehl.`,
      check('Hintertür (Passwort)', 'net-program-worm'),
      check('Wegfinder (Aufbau)', 'net-program-see-ya'),
      check('Verschleiern (Spuren)', 'net-program-eraser'),
      `Datei identifizieren, Knoten kontrollieren, Zugang scannen: ${roll(r)}. **Über** Schwierigkeit; keine Attribute addieren.`,
      `**Je 1 Netz-Aktion:** Ein-/Ausloggen, Fähigkeit, Programm an/aus. Virus: unten; Wirkung, Schwierigkeit, Aktionszahl mit Spielleitung.`
    ]),
    section('NETZKAMPF / GEGENWÜRFE',[
      `Angriffsprogramm: **eigene Basis + 1W10** (siehe Programme). Gegen Programm: Verteidigung + 1W10; gegen Netrunner: Schnittstelle + 1W10. Gleichstand verteidigt; kein Ausweichen.`,
      `Stromstoß: ${roll(r)}, **1 Netz-Aktion**, ohne Kaufprogramm; **1W6** Integrität (Programm) / Hirnschaden (Person).`,
      `Entkommen: ${roll(r)} gegen ICE-Wahrnehmung + 1W10; **1 Netz-Aktion, 1 Versuch/Zug**. Erfolg: benachbartes freies Stockwerk.`,
      `Wartendes ICE: ${roll(r+(owned(data,'net-program-speedy-gonzalvez')?2:0))}${owned(data,'net-program-speedy-gonzalvez')?' nur mit aktivem Flitzer; sonst '+r+' + 1W10':''} gegen ICE-Geschwindigkeit + 1W10. ICE gewinnt: Sofortangriff; danach Initiative-Spitze/Verfolgung.`,
      `**Integrität:** Programmausdauer. **Hirnschaden:** Trefferpunkte, ignoriert normale Rüstung.`
    ]),
    ...(attacks.length?[section('ANGRIFFSPROGRAMME / 1 NETZ-AKTION',attacks.map(e=>`**${e.quantity}x ${e.definition.name} / ${r+e.definition.netrunner.atk} + 1W10:** ${NET_ATTACK_EFFECTS[e.definition.id]??e.definition.description}`))]:[]),
    ...(support.length?[section('SCHUTZPROGRAMME / NUR AKTIV',[
      ...support.map(e=>`**${e.quantity}x ${e.definition.name}:** ${(NET_SUPPORT_SUMMARIES[e.definition.id]??e.definition.description).replace(' Nur eine Kopie aktiv; jede Kopie einmal je Netzeinsatz.','')}`),
      'Alle Verstärker/Verteidiger: **7 Integrität**, Verteidigung **0 + 1W10**. Verteidiger: je 1 Kopie aktiv, 1x/Kopie/Einsatz.'
    ])]:[]),
    section('DECK / VERBINDUNG / PROGRAMMZUSTAND',[
      `Neuralimplantat + Buchsen + Deck. Zugang: **${owned(data,'net-hardware-range-upgrade')?'8 m mit installiertem Reichweitenverstärker, sonst 6 m':'6 m'}**, keine Wände. Ohne Netzsicht außen effektiv bewusstlos.`,
      'Freie Stockwerke: **0 Aktionen**, keine Sperren überspringen. **Unsicher ausloggen:** aktive angetroffene feindliche ICE wirken.',
      '**Kauf allein aktiviert nichts.** Erst ins Deck laden: Programm 1 Platz, ICE 2. Je Kopie **1x/Runde** aktivieren; Angreifer danach aus, andere bleiben.',
      `0 Integrität: aus; **1 Netz-Aktion aus + 1 an** stellt wieder her. Zerstört: verloren. Einsatzgrenzen bleiben.`,
      !support.length&&data.netPrograms.some(e=>['Booster','Defender'].includes(e.definition.netrunner.className))?'Verstärker/Verteidiger: **7 Integrität**, Verteidigung **0 + 1W10**.':null,
      ...hardware.map(e=>`**Deck-Erweiterung / ${e.definition.name}:** ${e.definition.description}`)
    ]),
    ...(ice.length?[section('DEIN SCHWARZES ICE / SELBSTSTÄNDIG',[
      '**1 Netz-Aktion aktivieren**, zulässiges Ziel wählen; dann eigener Zug, keinen Schnittstellenrang addieren.',
      ...ice.map(e=>`**${e.quantity}x ${e.definition.name}:** Angriff ${roll(e.definition.netrunner.atk)}, Verteidigung ${roll(e.definition.netrunner.defense)}, Integrität ${e.definition.netrunner.rez}; Wahrnehmung ${e.definition.netrunner.per}, Geschwindigkeit ${e.definition.netrunner.speed}. ${e.definition.description}`)
    ])]:[])
  ];
}

export function equipmentReference(data) {
  // Repeated implants do not need repeated prose; effects remain evaluated centrally.
  const entries=[...new Map(data.cyberware.filter(e=>!e.definition.cyberWeapon).map(e=>[e.definition.id,e])).values()];
  return entries.length?[section('DEINE IMPLANTATE / BONUSSTATUS',entries.map(e=>{
    const effects=e.definition.effects??[];
    const conditional=effects.some(effect=>effect.type==='situational');
    const fixed=effects.some(effect=>['skill','derived','permanent','armor'].includes(effect.type));
    const detail=e.definition.id==='sandevistan'?`Aktiv: Initiative **${data.derived.initiative+3} + 1W10**, 1 Minute; 1 Stunde Abklingzeit.`:e.definition.description;
    return `**${e.definition.name} / ${conditional?'bedingt, nicht eingerechnet':fixed?'passiv, bereits enthalten':'Funktion'}:** ${detail}`;
  }))]:[];
}

export function grenadeEffectSummary(definition) {
  const effect=definition.grenadeEffect;if(!effect)return null;
  return `${definition.damage}; bei Durchdringung Schutzwert -${effect.armorLoss}.${effect.burnDamage?` Brand: ${effect.burnDamage} direkte Trefferpunkte pro Runde (eigenes Zugende); 1 Aktion löschen. Nicht stapelbar.`:''}`;
}

function grenadeReference(data) {
  const grenades=data.grenades??[],cards=[];
  const short={
    'hand-grenade-smoke':'1 Min. Rauch; -4 auf sichtabhängige Proben durch die Wolke.',
    'hand-grenade-flash':'Folter/Drogen widerstehen 15; sonst Auge + Ohr beschädigt, 1 Min., kein kritischer Zusatzschaden. Schutzoptik/Gehörschutz beachten.',
    'hand-grenade-emp':'Cybertechnik 15; sonst zwei geeignete Implantate/Elektronikteile nach Spielleitung 1 Min. aus. Abschirmung schützt.',
    'hand-grenade-tear':'Folter/Drogen widerstehen 13; sonst Auge beschädigt, 1 Min., kein kritischer Zusatzschaden.',
    'hand-grenade-poison':'Folter/Drogen widerstehen 13; sonst 2W6 direkte Trefferpunkte.',
    'hand-grenade-biotoxin':'Folter/Drogen widerstehen 15; sonst 3W6 direkte Trefferpunkte.',
    'hand-grenade-sleep':'Folter/Drogen widerstehen 13; sonst 1 Min. bewusstlos, bis Schaden oder Weckaktion.'
  };
  for(let i=0;i<grenades.length;i+=3)cards.push(section(i?'HANDGRANATEN / WEITERE WIRKUNGEN':'DEINE HANDGRANATEN',[
    !i?'Werfen laut Tabelle; maximal 25 m, 1 Aktion / Granate. Wirkung 10 x 10 m; kein Werfer nötig. Gas: Atemschutz/Nasenfilter schützen; Gift/Biotoxin ignorieren Rüstung, keine kritischen Verletzungen.':null,
    ...grenades.slice(i,i+3).map(e=>`**${e.quantity}x ${e.definition.name}:** ${grenadeEffectSummary(e.definition)??short[e.definition.id]??e.definition.description}`)
  ]));
  return cards;
}

function weaponAttachmentReference(data) {
  const entries=data.weaponAttachments??[],cards=[];
  for(const {weapon,attachments} of entries){
    const bothFinishes=attachments.some(a=>a.id==='finish')&&attachments.some(a=>a.id==='neon-finish');
    const rows=attachments.filter(a=>!(a.id==='neon-finish'&&bothFinishes)).map(a=>`**${a.id==='finish'&&bothFinishes?'Chrom- / Neonfinish':a.name}:** ${attachmentRuleText(a,weapon,data).replace(/(-?\d+ \+ 1W10)/g,'**$1**')}`);
    for(let i=0;i<rows.length;i+=3)cards.push(section((weapon.shortName??weapon.name)+' / AUFSÄTZE'+(i?' (FORTS.)':''),rows.slice(i,i+3)));
  }
  return cards;
}

export function quickReferenceColumns(data) {
  const s=id=>skill(data,id), bonus=data.attackBonus??0, move=stat(data,'MOVE')*2;
  const modes=new Set(data.attackOptions.flatMap(e=>e.options.map(o=>o.id)));
  const aimed=data.attackOptions.map(e=>[e.item.name,e.options.find(o=>o.id==='aimed')]).filter(([,o])=>o);
  const auto=data.attackOptions.flatMap(e=>e.options.filter(o=>o.id==='autofire'));
  const suppress=data.attackOptions.flatMap(e=>e.options.filter(o=>o.id==='suppressive'));
  const suppressRolls=new Set(suppress.map(o=>o.base)).size===1?roll(suppress[0].base):data.attackOptions.flatMap(e=>e.options.filter(o=>o.id==='suppressive').map(o=>`${e.item.shortName??e.item.name}: ${roll(o.base)}`)).join('; ');
  const columns=[[
    section('DEIN ZUG / AKTIONEN',[
      `**1 Bewegungsaktion (${move} m) + 1 Aktion**. Rennen statt Aktion: nochmals **${move} m**; Bewegung aufteilbar. Initiative: höher zuerst, Gleichstand neu würfeln.`,
      '**Aktion:** Angriff, Nachladen, Aufstehen, Stabilisieren, Fertigkeit. Zugängliche Waffe ziehen/fallen lassen: frei.',
      `Glück: **${data.derived.luck} Punkte/Sitzung**. Vor Probe **mehrere Punkte zugleich** möglich, je +1; keine Todesrettung. Natürliche 10: +1W10, 1: -1W10; keine Kette.`
    ]),
    section('ANGREIFEN / VERTEIDIGEN',[
      '**Fernkampf:** Basis + 1W10 über Tabelle oder Ausweichen (Ziel mit Reflexe 8+; vorher ansagen/zuerst würfeln).',
      `**Nahkampf:** gegen **Geschicklichkeit + Fertigkeitsrang Ausweichen + situative Modifikatoren + 1W10** des Ziels. Handgemenge ${roll(s('brawling')+bonus)}, 2 Angriffe. Gleichstand verteidigt.`,
      `**Dein Ausweichen: ${s('evasion')} + 1W10**${stat(data,'REF')>=8?' auch gegen Beschuss (Reflexe '+stat(data,'REF')+')':'; gegen Beschuss nicht erlaubt (Reflexe '+stat(data,'REF')+' < 8)'}.`
    ]),
    ...([...modes].some(m=>m!=='thrown')?[section('ANGRIFFSARTEN / EIGENE WAFFEN',[
      aimed.length?`**Gezielt / 1 Aktion, 1 Angriff:** Tabellenbasis + 1W10; **-8 enthalten** (Kurzansicht: Spalte „Gezielt“). Kopf: Schaden nach Kopfrüstung x2. Gegenstand: bei Durchdringung fallen lassen. Bein: bei Durchdringung Gebrochenes Bein +5 Schaden (nur intaktes Bein).`:null,
      auto.length?`**Dauerfeuer / 10 Schuss:** eigene Tabellenzeile; **2W6 x Überschuss**, maximal ${[...new Set(auto.map(o=>'x'+o.maximum))].join('/')}. Danach Körperrüstung; nicht gezielt.`:null,
      suppress.length?`**Unterdrücken / 10 Schuss:** ${suppressRolls} gegen Willenskraft + Konzentration + 1W10 sichtbarer Personen zu Fuß ohne Deckung bis 25 m. Verlierer suchen nächsten Zug Deckung, nötigenfalls Rennen; kein Schaden.`:null,
      modes.has('shell')&&!data.attackOptions.some(e=>e.options.some(m=>m.id==='shell'&&m.pattern))?'**Schrot / 1 Patrone:** Basis der Schrotzeile gegen **13**; sichtbare Ziele im 6 x 6 m-Feld direkt vor dir, einmal **3W6**, je Ziel Körperrüstung / Ausweichen ab Reflexe 8. Nicht gezielt. Flintenlaufgeschoss: normale Zeile, **5W6**, ein Ziel. Magazin nur eine Sorte; Wechsel = Nachladeaktion.':null,
      modes.has('explosive')?'**Explosion / 10 x 10 m:** Schaden einmal würfeln, Deckung und Körperrüstung je Ziel; keine gezielten Schüsse. Fehlschüsse weichen nach Explosionsregeln ab.':null,
      modes.has('arrows')?'**Bogen:** Einlegen im Angriff enthalten; keine Nachladeaktion. Basispfeile wieder einsammelbar.':null
    ])]:[]),
    section('TREFFER / RÜSTUNG / KRITISCH',[
      '**Schaden - Schutzwert**, mindestens 0. Nahkampfwaffen/Kampfkunst halbieren Schutz (aufrunden), Handgemenge nicht. Normalziel: Körper.',
      'Durchdrungen: Trefferpunkte senken, **Schutzwert -1** (panzerbrechend -2) bis Reparatur; Kopf/Körper getrennt.',
      '**2+ Sechsen:** kritische Verletzung (2W6-Tabelle) + **5 Direktschaden**, auch ohne Durchdringung.',
      '**Deckung:** stoppt Beschuss bis 0 Trefferpunkte; kein Restschaden desselben Treffers. Kopf muss erreichbar sein.'
    ])
  ],roleReference(data),[
    section('VERWUNDUNG / TODESRETTUNG',[
      `**${data.derived.wound} Trefferpunkte oder weniger: -2** auf Aktionsproben; nicht Initiative/Todesrettung.`,
      `**0 oder weniger: sterbend, -4** statt -2. Bewegung **${Math.max(1,stat(data,'MOVE')-6)*2} m** (Bewegungswert um 6, mindestens 1). Weitere Treffer: kritische Verletzung, Todesrettungsabzug steigt.`,
      `**Todesrettung / Zugbeginn:** **1W10 + bisherige Todesrettungsabzüge < ${data.derived.death}**. Natürliche 10 oder Fehlschlag: Tod. Je Probe Abzug +1, ggf. mehr durch Verletzungen.`,
      `**Stabilisieren / Aktion:** Erste Hilfe ${roll(s('first-aid'))} oder Sanitäter ${roll(s('paramedic'))}; Schwierigkeit **10 leicht / 13 schwer / 15 sterbend**. Sterbend stabilisiert: 1 Trefferpunkt, 1 Min. bewusstlos.`
    ]),
    ...((data.campaign?.injuries??[]).some(i=>['active','quickfix'].includes(i.status))?[section('DEINE VERLETZUNGEN',data.campaign.injuries.filter(i=>['active','quickfix'].includes(i.status)).slice(0,3).map(i=>`**${i.name} / ${INJURY_STATUS[i.status]}:** ${i.notes.length>160?i.notes.slice(0,150)+'… vollständig im Bogen.':i.notes}`))]:[]),
    ...equipmentReference(data),
    ...[...new Map(data.attackOptions.filter(e=>e.item.cyberwareId).map(e=>[e.item.cyberwareId,section(e.item.name.toUpperCase()+' / CYBERWAFFE',[`${e.item.qualityBonus?'**Exzellente Qualität: +1 bereits in den Würfelwerten enthalten.** ':''}${e.item.cyberRule}`])])).values()],
    ...weaponAttachmentReference(data),
    ...((data.ammo??[]).some(e=>e.definition.ammoType)?[section('DEINE SPEZIALMUNITION',[...new Map(data.ammo.filter(e=>e.definition.ammoType).map(e=>[e.definition.ammoType,`**${e.definition.name.split(' · ').at(-1)}:** ${e.definition.description}`])).values()])]:[]),
    ...grenadeReference(data),

  ]];
  return columns;
}
