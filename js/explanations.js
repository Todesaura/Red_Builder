const uses = {
  INT: 'INT ist für Wahrnehmung, Wissen, Recherche und logisches Denken wichtig.',
  REF: 'REF ist für Fernkampfangriffe, Fahrzeugsteuerung und deine Initiative wichtig.',
  DEX: 'GES ist für Nahkampf, Ausweichen, Athletik und Heimlichkeit wichtig.',
  TECH: 'TCH ist für Reparaturen, Handwerk, Erste Hilfe und andere technische Arbeiten wichtig.',
  COOL: 'COO ist für Überreden, Verhandeln, Schauspiel und deinen persönlichen Auftritt wichtig.',
  WILL: 'WIL ist für Konzentration, Ausdauer und Widerstand gegen Folter oder Drogen wichtig. Es beeinflusst auch deine Trefferpunkte.',
  LUCK: 'GLK bestimmt deinen Glückspool. Vor geeigneten Würfen kannst du Punkte für einen Bonus ausgeben.',
  MOVE: 'BEW bestimmt, wie weit du dich bewegen kannst.',
  BODY: 'KRA beeinflusst deine körperliche Belastbarkeit, Trefferpunkte und Todesrettung.',
  EMP: 'EMP ist für Menschenkenntnis und Gespräche wichtig. Es bestimmt deine anfängliche Menschlichkeit und sinkt bei Menschlichkeitsverlust.'
};
export function explainAttribute(id, value) {
  if (value?.base === null) return 'Wähle zuerst deine Rolle. ' + (uses[id] ?? '');
  return uses[id] ?? 'Dieser Wert bestimmt passende Attribut- und Fertigkeitsproben.';
}
export function explainEmpathy(evaluated) {
  const c = evaluated.cyberware;
  return 'Basis-EMP '+evaluated.attributes.EMP.base+' × 10 = '+c.start+' Menschlichkeit. Bisheriger Implantatverlust: '+c.loss+'. Kampagnenänderung: '+(c.adjustment??0)+'. Übrig: '+c.current+'; erreichbares Maximum: '+c.maximum+'. Daraus ergibt sich EMP '+evaluated.attributes.EMP.effective+' (Menschlichkeit durch 10, abgerundet, mindestens 0).';
}
