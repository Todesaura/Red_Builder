export function deriveValues(attributes, cyberware) {
  const values = Object.fromEntries(Object.entries(attributes).map(([id, value]) => [id, value.effective]));
  if (['BODY', 'WILL', 'EMP', 'REF', 'LUCK'].some(id => values[id] === null)) return [];
  const { BODY, WILL, EMP, REF, LUCK } = values;
  const average = Math.ceil((BODY + WILL) / 2);
  const hitPoints = 10 + 5 * average;
  const source = 'Cyberpunk RED Grundregelwerk, S. 79 (englische Ausgabe)';
  return [
    { id: 'hp', name: 'Trefferpunkte', value: hitPoints, source,
      meaning: 'Trefferpunkte (TP) zeigen, wie viel Schaden dein Charakter aushält. Hier steht dein Maximum bei voller Gesundheit.',
      play: 'Schaden senkt die aktuellen TP. Ab der Verwundungsschwelle gelten Abzüge; bei 0 TP oder weniger bist du sterbend und musst Todesrettungen würfeln. Aktuelle Verletzungen werden im Spiel separat notiert.',
      explanation: `10 + 5 × aufgerundet((BODY ${BODY} + WILL ${WILL}) / 2) = 10 + 5 × ${average} = ${hitPoints}. Der Mittelwert wird vor der Multiplikation aufgerundet.` },
    { id: 'wound', name: 'Schwer verwundet ab', value: Math.ceil(hitPoints / 2), source: `${source}; Grundregelwerk S. 186; RTG Rules FAQ v1.3`,
      meaning: 'Diese TP-Schwelle zeigt, ab wann deine Verletzungen deine Handlungen erschweren.',
      play: `Bei ${Math.ceil(hitPoints / 2)} aktuellen TP oder weniger bist du schwer verwundet: −2 auf Aktionsproben, etwa Angriffe und Fertigkeiten. Dieser Abzug gilt nicht für Initiative oder Todesrettungen. Bei 0 TP oder weniger gilt stattdessen der schwerere Zustand „sterbend“.`,
      explanation: `Halbe maximale Trefferpunkte, aufgerundet: aufgerundet(${hitPoints} / 2) = ${Math.ceil(hitPoints / 2)}. Die Schwelle gilt bei diesem oder einem niedrigeren aktuellen TP-Wert.` },
    { id: 'death', name: 'Todesrettung: Basis', value: BODY, source: 'Grundregelwerk S. 186–187; Roll20 Free Basic Rules; RTG Rules FAQ v1.3',
      meaning: 'Die Todesrettung entscheidet, ob dein sterbender Charakter seinen nächsten Zug überlebt. Eine höhere BODY verbessert die Chancen.',
      play: `Bei 0 TP oder weniger würfelst du zu Beginn jedes eigenen Zuges 1W10. Das Ergebnis samt Todesrettungsmodifikatoren muss kleiner als BODY ${BODY} sein; Gleichstand oder mehr bedeutet Tod. Eine gewürfelte 10 misslingt immer. Ohne Modifikatoren wären hier 1–${Math.min(9, BODY - 1)} erfolgreich. Jeder weitere Todesrettungswurf erhält einen zusätzlichen Abzug von +1 auf das Würfelergebnis, bis du stabilisiert bist. Verletzungen können weitere Abzüge verursachen. Glück darf diesen Wurf nicht verbessern.`,
      explanation: `Die Basis deiner Todesrettung entspricht BODY ${BODY}. Spätere Verletzungs- und Rettungswurfmodifikatoren sind hier nicht enthalten.` },
    { id: 'humanity', name: 'Menschlichkeit', value: cyberware?.current ?? EMP * 10, source: `${source}; Grundregelwerk S. 230–232; RTG From the Mayor’s Desk 05.02.2021`,
      meaning: 'Menschlichkeit beschreibt deine Verbindung zu anderen Menschen und dein Einfühlungsvermögen. Sie ist mit Empathie (EMP) verknüpft.',
      play: 'Cyberware und traumatische Erlebnisse können Menschlichkeit kosten; dadurch sinkt EMP. Menschlichkeitsverlust und die Senkung des erreichbaren Maximums sind getrennte Größen. Therapie kann verlorene Menschlichkeit nur bis zum Maximum wiederherstellen. Hier wird deine Menschlichkeit bei der Charaktererstellung berechnet.',
      explanation: cyberware ? `Start ${cyberware.start} + Kampagnenänderung ${cyberware.adjustment??0} − Implantatverlust ${cyberware.loss} = ${cyberware.start - cyberware.loss+(cyberware.adjustment??0)}; Maximum ${cyberware.start} − ${cyberware.depression} = ${cyberware.maximum}. Dein Wert: ${cyberware.current}, höchstens das Maximum. EMP = abgerundet(${cyberware.current} / 10), mindestens 0: ${EMP}.` : `EMP ${EMP} × 10 = ${EMP * 10} vor Cyberware.` },
    { id: 'initiative', name: 'Initiative: Basis', value: REF, source: 'Grundregelwerk S. 168; Roll20 Free Basic Rules; RTG Rules FAQ v1.3',
      meaning: 'Initiative bestimmt die Reihenfolge, in der die Beteiligten im Kampf handeln.',
      play: `Zu Kampfbeginn: REF ${REF} + 1W10, zuzüglich passender Boni. Höhere Ergebnisse handeln zuerst; Gleichstände werden ausgewürfelt. Bei einer gewürfelten 10 addierst du einen weiteren W10, bei einer 1 ziehst du einen weiteren ab; dieser Zusatzwurf wird nicht erneut erweitert. Die Reihenfolge bleibt normalerweise über die Runden bestehen. Der Abzug für „schwer verwundet“ senkt die Initiative nicht.`,
      explanation: `REF ${REF} ist die Basis. Im Spiel kommt 1W10 hinzu. Rollenfähigkeiten und situative Modifikatoren sind nicht enthalten.` },
    { id: 'luck', name: 'Glückspool: Start', value: LUCK, source: 'Grundregelwerk S. 129; Roll20 Free Basic Rules; RTG Rules FAQ v1.3',
      meaning: 'Glück ist ein Vorrat an Punkten, mit dem du wichtige Proben gezielt verbessern kannst.',
      play: `Sage vor einem geeigneten Wurf an, wie viele deiner übrigen Glückspunkte du einsetzt: Jeder Punkt gibt +1. Die ausgegebenen Punkte fehlen anschließend im Pool. Zu Beginn der nächsten Spielsitzung füllt er sich wieder auf ${LUCK}. Auch Initiative kann profitieren, Todesrettungen dagegen nicht.`,
      explanation: `Der anfängliche Glückspool entspricht LUCK ${LUCK}. Verbrauch wird im Erstellungseditor nicht verwaltet.` }
  ];
}
