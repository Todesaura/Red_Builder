const skill=(data,id)=>data.skills.find(entry=>entry.id===id)?.base??0;
const roll=base=>`**${base} + 1W10**`;

export function meleeAttackRows(data,weaponRows=[]) {
  const body=data.attributes.BODY.effective;
  const dice=body<=4?1:body<=6?2:body<=10?3:4;
  const cyberarm=data.cyberware.some(entry=>entry.definition.foundation==='arm');
  const damage=Math.max(dice,cyberarm?3:0)+'W6';
  const brawling=skill(data,'brawling'), attack=brawling+(data.attackBonus??0);
  const martial=data.skills.filter(entry=>entry.specialty==='martial-arts'&&entry.level>0);
  const unarmed=[{id:'brawling',name:'Faust / Fuß'+(cyberarm?' (Cyberarm)':''),base:attack,damage,armor:'voll'},
    ...martial.map(entry=>({id:entry.id,name:entry.specialtyName,base:entry.base+(data.attackBonus??0),damage:dice+'W6',armor:'halb'}))];
  return [...unarmed.flatMap(row=>[
    {...row,name:row.name+' / Normal',mode:'normal',rof:2,reach:2},
    {...row,id:row.id+'.aimed',name:row.name+' / Gezielt',mode:'aimed',base:row.base-8,rof:1,reach:2}
  ]),...weaponRows.filter(row=>row.melee).map(row=>({...row,armor:'halb'}))];
}

export function meleeReferenceColumns(data) {
  const body=data.attributes.BODY.effective;
  const brawling=skill(data,'brawling');
  const martial=data.skills.filter(entry=>entry.specialty==='martial-arts'&&entry.level>0);
  const weapons=data.attackOptions.filter(entry=>entry.item.skill==='melee-weapon');
  return [[
    ['SCHLAGEN / TRETEN',[
      'Faust, Fuß und Kopfstoß verwenden Handgemenge. Bei zwei Angriffen je ein eigener Treffer- und Schadenswurf; deine Werte stehen in der Tabelle.'
    ]],
    ['NAHKAMPFWAFFEN',[
      ...weapons.filter(({item})=>item.cyberRule||item.qualityBonus).map(({item})=>`**${item.shortName??item.name}:** ${item.qualityBonus?'Qualitätsbonus bereits in den Würfelwerten enthalten. ':''}${item.cyberRule??''}`),
      ...(!weapons.length?['Aktuell keine Nahkampfwaffe vorhanden.']:[]),
      'Durchdringt der Schaden die Rüstung, verliert der tatsächliche Schutzwert 1 Punkt. Kopf- und Körperrüstung getrennt führen.'
    ]],
    ...(martial.length?[['KAMPFKUNST',[
      'Besondere Stilmanöver haben eigene Voraussetzungen; Greifen verwendet Handgemenge.'
    ]]]:[]),
    ['MENSCHLICHER SCHUTZSCHILD',[
      '**Ziel bereits im Griff: 1 zusätzliche Aktion**, kein neuer Wurf. Kein anderer Schild; dieselbe Hand hält Griff und Schild.',
      '**Deckung gegen sichtbare Fernangreifer**, nicht gegen Nahkampf oder gezielte Kopfschüsse. Vorschieben statt selbst auszuweichen; der Schuss kann trotzdem verfehlen.',
      '**Treffer:** Person erleidet normalen Schaden mit ihrer Rüstung; darf auch mit Reflexe 8+ nicht ausweichen. Du darfst sie weiterhin selbst angreifen.',
      '**Loslassen:** lebend kostenlos den Griff beenden. Stirbt sie: Leichenschild mit Trefferpunkten gleich ihrer Körperkraft; Ablegen kostet 1 Aktion.'
    ]]
  ],[
    ['GREIFEN / FESTHALTEN',[
      `**1 Aktion, mindestens eine freie Hand.** Handgemenge ${roll(brawling)} gegen **Geschicklichkeit + Handgemenge + 1W10**. Gleichstand verteidigt.`,
      'Erfolg: Person festhalten oder einen gehaltenen Gegenstand in deine freie Hand nehmen.',
      '**Beide: -2 auf Aktionsproben.** Festhaltender kann jederzeit ohne Aktion loslassen.'
    ]],
    ['AUS EINEM GRIFF BEFREIEN',[
      `**1 Aktion:** Handgemenge ${roll(brawling-2)} (Griffabzug enthalten) gegen Handgemenge des Festhaltenden, ebenfalls mit -2.`,
      'Erfolg: Griff endet. Im Griff: Bewegung folgt dem Festhaltenden; keine Zweihandwaffen.'
    ]],
    ['WÜRGEN',[
      '**Ziel bereits im Griff. 1 Aktion, kein Angriffswurf.**',
      `**${body} direkte Trefferpunkte** Schaden (deine Körperkraft); Rüstung schützt nicht.`,
      '**Drei aufeinanderfolgende Runden würgen:** Ziel bewusstlos, auch mit übrigen Trefferpunkten. Jede Runde kostet deine Aktion.'
    ]],
    ['WERFEN / ZU BODEN SCHLEUDERN',[
      '**Ziel bereits im Griff. 1 Aktion, kein Angriffswurf.**',
      `**${body} direkte Trefferpunkte** Schaden, Rüstung schützt nicht. Ziel liegt auf einem benachbarten Feld; der Griff endet.`,
    ]]
  ],[
    ['AUSWEICHEN / REICHWEITE',[
      `**Dein Ausweichen:** ${roll(skill(data,'evasion'))}. Ziel würfelt **Geschicklichkeit + Fertigkeitsrang Ausweichen + situative Modifikatoren + 1W10**.`,
      '**Angreifer muss den Gegenwurf übertreffen.** Abzüge für Verwundung oder Griff zusätzlich berücksichtigen. Gegenwurf kostet keine Aktion.',
    ]],
    ['GEZIELT IM NAHKAMPF',[
      'Wert „Gezielt“ in der Tabelle verwenden (-8 bereits enthalten). Vorher ansagen; **1 ganze Aktion, nur 1 Angriff**.',
      '**Kopf:** Schaden nach Kopfrüstung verdoppeln. **Gehaltener Gegenstand:** bei durchdrungener Körperrüstung fallen lassen.',
      '**Bein:** bei Durchdringung Gebrochenes Bein einschließlich 5 Zusatzschaden, sofern noch ein intaktes Bein vorhanden ist.'
    ]],
    ['LIEGEND / AUFSTEHEN',[
      '**Liegend: -2 auf Aktionsproben.** Aufstehen kostet 1 Aktion.'
    ]],
    ['ANGRIFFE KOMBINIEREN',[
      '**Feuerrate 2:** zwei passende Angriffsarten kombinierbar, etwa Faust und Messer; je eigene Fertigkeit.',
      '**Greifen, Würgen, Werfen, Schutzschild: je 1 ganze Aktion.** Greifen und Würgen gehen nicht in derselben Aktion.',
      'Würgen und gewöhnliches Werfen: kein Schadenswurf, deshalb keine kritische Verletzung durch zwei Sechsen. Allgemeine Regeln: Cheatsheet 1.'
    ]]
  ]];
}
