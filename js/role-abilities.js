import {roleRank} from './campaign-state.js?v=shopping1';
import { evaluateRolePoints } from './role-points.js?v=shopping1';
// Explanations use the same saved allocations and effects as the central rules engine.
export const STARTING_ROLE_RANK = 4;
const overviewSource = 'https://rtalsoriangames.com/2020/10/09/cyberpunk-red-alert/';
const compendium = name => `https://app.roll20.net/compendium/cpunk/Rules:${encodeURIComponent(name)}`;
export const ROLE_ABILITIES = {
  rockerboy: {
    name: 'Charismatische Wirkung', original: 'Charismatic Impact',
    description: 'Du gewinnst Fans und bewegst sie dazu, dich zu unterstützen.',
    source: compendium('Charismatic Impact (Rockerboy Role Ability)'), reference: 'Grundregelwerk S. 144–145',
    features: [
      ['Fans gewinnen', 'Außerhalb eines Kampfes kannst du Personen, die dich nicht ablehnen, zu Fans machen: Charismatische Wirkung + 1W10 gegen den passenden Schwierigkeitswert.'],
      ['Unterstützung mobilisieren', 'Bestehende Fans können dir helfen. Wie viele Menschen du erreichst und welche Gefallen möglich sind, richtet sich nach deinem Rollenrang und der Situation.'],
      ['Auftritt und Einfluss', 'Musik, Schauspiel und Überreden bleiben eigene Fertigkeiten. Ein guter Auftritt ersetzt keine Rollenprobe – und umgekehrt.']
    ], skills: ['persuasion', 'acting', 'play-instrument', 'composition']
  },
  solo: {
    name: 'Kampfbewusstsein', original: 'Combat Awareness',
    description: 'Du verteilst einen Vorrat an Punkten auf verschiedene Kampfvorzüge.',
    source: compendium('Combat Awareness (Solo Role Ability)'), reference: 'Grundregelwerk S. 146',
    features: [
      ['Schaden abfangen', 'Je 2 zugewiesene Punkte reduzieren den ersten erlittenen Schaden einer Runde um 1.'],
      ['Patzer abfangen', 'Mit 4 Punkten behandelst du eine gewürfelte 1 bei Angriffen als normale 1, ohne den zusätzlichen Patzerwurf.'],
      ['Schnell reagieren', 'Jeder hier zugewiesene Punkt gibt +1 auf Initiativewürfe.'],
      ['Präzise angreifen', 'Je 3 zugewiesene Punkte geben +1 auf Angriffswürfe.'],
      ['Schwachstellen treffen', 'Jeder Punkt erhöht den Schaden deines ersten erfolgreichen Angriffs pro Runde um 1, vor Rüstung.'],
      ['Gefahren erkennen', 'Jeder Punkt gibt +1 auf Wahrnehmungsproben.']
    ], skills: ['perception', 'handgun', 'shoulder-arms', 'melee-weapon']
  },
  netrunner: {
    name: 'Schnittstelle', original: 'Interface',
    description: 'Du dringst in NET-Architekturen ein und bedienst ihre digitalen Systeme.',
    source: 'https://rtalsoriangames.com/wp-content/uploads/2021/02/RTG-CPRed-SingleShotPackv1.1.pdf', reference: 'Grundregelwerk S. 147, 197–201',
    features: [
      ['Zugänge und Wege', 'Scanner sucht Zugangspunkte. Backdoor überwindet Passwörter; Pathfinder untersucht den weiteren Aufbau der Architektur.'],
      ['Dateien und Geräte', 'Eye-Dee untersucht Daten, Control übernimmt Kontrollknoten, Virus verändert eine Architektur.'],
      ['Spuren und Gegenwehr', 'Cloak verwischt Spuren. Slide hilft beim Entkommen vor Black ICE; Zap ist dein direkter NET-Angriff. Programme können eigene Boni liefern.']
    ], skills: ['electronics-security', 'cryptography', 'library-search', 'concentration']
  },
  tech: {
    name: 'Maker', original: 'Maker',
    description: 'Du reparierst, verbesserst, baust und erfindest technische Gegenstände.',
    source: compendium('Maker (Tech Role Ability)'), reference: 'Grundregelwerk S. 147–149',
    features: [
      ['Feldexpertise · Field Expertise', 'Der zugewiesene Fachrang verbessert passende gewöhnliche Technikproben. Ab Fachrang 1 kannst du auch provisorisch reparieren; die Reparatur hält 10 Minuten je Fachrang.'],
      ['Verbessern · Upgrade Expertise', 'Du ergänzt eine zulässige Verbesserung an einem Gegenstand. Probe: TECH + passende Technikfertigkeit + Fachrang + 1W10; Material und Zeit kommen hinzu.'],
      ['Herstellen · Fabrication Expertise', 'Du baust einen bestehenden Gegenstand aus Material. Technikfertigkeit, Fachrang, Preisstufe und Bauzeit bestimmen die Aufgabe.'],
      ['Erfinden · Invention Expertise', 'Du entwickelst neue Gegenstände oder Verbesserungen mit der Spielleitung. Ein erfolgreicher Entwurf wird anschließend hergestellt oder eingebaut.']
    ], skills: ['basic-tech', 'electronics-security', 'cybertech', 'weaponstech']
  },
  medtech: {
    name: 'Medizin', original: 'Medicine',
    description: 'Du behandelst schwere Verletzungen und nutzt spezialisierte Medizintechnik.',
    source: compendium('Medicine (Medtech Role Ability)'), reference: 'Grundregelwerk S. 149–150',
    features: [
      ['Chirurgie · Surgery', 'Jeder zugewiesene Medizinpunkt gibt 2 Ränge Chirurgie. Damit behandelst du schwere kritische Verletzungen und führst Operationen durch.'],
      ['Pharmazeutik · Pharmaceuticals', 'Jeder Punkt erhöht Medizintechnik um 1 und erschließt ein Pharmazeutikum. Diese Spezialisierung erlaubt medizinische Präparate, keine freie Herstellung beliebiger Straßendrogen.'],
      ['Kryotechnik · Cryosystem Operation', 'Jeder Punkt erhöht Medizintechnik um 1. Weitere Vorteile betreffen Kryopumpen und Kryotanks zur Stasisversorgung.']
    ], skills: ['first-aid', 'paramedic', 'cybertech', 'human-perception']
  },
  media: {
    name: 'Glaubwürdigkeit', original: 'Credibility',
    description: 'Du findest Hinweise und erreichst mit belegten Geschichten ein Publikum.',
    source: compendium('Credibility (Media Role Ability)'), reference: 'Grundregelwerk S. 151–153',
    features: [
      ['Gerüchte aufnehmen', 'Die Spielleitung kann Glaubwürdigkeit + 1W10 verdeckt würfeln, um dir Hinweise aus deinem Netzwerk zu geben.'],
      ['Aktiv recherchieren', 'Für eigene Nachforschungen nutzt du die passende gewöhnliche Fertigkeit, etwa Recherche, Konversation oder Verhör.'],
      ['Geschichten veröffentlichen', 'Rollenrang, Publikum und belastbare Belege beeinflussen die Glaubhaftigkeit und Wirkung. Die Glaubhaftigkeitsprobe ist keine gewöhnliche INT-Probe; Glück ist dafür nicht einsetzbar.']
    ], skills: ['library-search', 'conversation', 'interrogation', 'photography-film']
  },
  exec: {
    name: 'Teamwork', original: 'Teamwork',
    description: 'Du nutzt Firmenressourcen und arbeitest mit zugewiesenen Teammitgliedern.',
    source: overviewSource, reference: 'Grundregelwerk S. 153–158',
    features: [
      ['Firmenunterstützung', 'Dein Rang bestimmt Vorteile wie geschäftliche Kleidung, Unterkunft und später weitere Absicherung. Diese Leistungen sind kein frei verfügbares Bargeld.'],
      ['Teammitglieder', 'Unterstützende Fachkräfte übernehmen Aufgaben entsprechend ihrer eigenen Werte. Du addierst Teamwork nicht pauschal zu ihren oder deinen Proben.'],
      ['Loyalität', 'Behandlung und Entscheidungen beeinflussen die Bindung deiner Leute. Besprich konkrete Teammitglieder und Firmenleistungen mit der Spielleitung.']
    ], skills: ['business', 'bureaucracy', 'conversation', 'persuasion']
  },
  lawman: {
    name: 'Verstärkung', original: 'Backup',
    description: 'In Gefahr rufst du Unterstützung deiner Organisation an den Einsatzort.',
    source: 'https://rtalsoriangames.com/wp-content/uploads/2021/02/RTG-CPRed-SingleShotPackv1.1.pdf', reference: 'Grundregelwerk S. 158–159',
    features: [
      ['Hilfe anfordern', 'Der Ruf kostet eine Aktion. Würfle 1W10: Ein Ergebnis bis einschließlich deines Backup-Rangs bedeutet, dass jemand antwortet.'],
      ['Auf Unterstützung warten', 'Nach erfolgreichem Ruf bestimmt 1W6 die Ankunft in Runden. Bei einer 6 kommt die nächsthöhere Unterstützungsstufe.'],
      ['Verantwortung tragen', 'Verstärkung ist Hilfe in einer Gefahrensituation. Missbrauch kann Konsequenzen deiner Organisation nach sich ziehen.']
    ], skills: ['perception', 'criminology', 'interrogation', 'handgun']
  },
  fixer: {
    name: 'Operator', original: 'Operator',
    description: 'Du vermittelst Kontakte, beschaffst Waren und verhandelst Geschäfte.',
    source: 'https://www.scribd.com/document/509302601/CPR-Corebook-Cyberpunk-Red-v122', reference: 'Grundregelwerk S. 159–160',
    features: [
      ['Kontakte und Beschaffung', 'Dein Rollenrang bestimmt erreichbare Kontakte und beschaffbare Preisstufen. Beschaffen bedeutet nicht, dass du die Ware kostenlos erhältst.'],
      ['Feilschen', 'Probe: COOL + Handeln + Operator + 1W10 gegen die entsprechende Probe des Gegenübers. Ein gewonnener Vergleich erlaubt einen zulässigen Deal; Rabatte gelten nicht automatisch.'],
      ['Kulturelle Kontakte', 'Du kennst soziale Gepflogenheiten weiterer Gruppen. Bei Rang 4 gehört auch eine zusätzliche passende Sprache auf Rang 4 zu den Rollenleistungen; die konkrete Kultur und Sprache wählst du mit der Spielleitung.']
    ], skills: ['trading', 'streetwise', 'persuasion', 'human-perception']
  },
  nomad: {
    name: 'Moto', original: 'Moto',
    description: 'Du beherrschst Fahrzeuge und nutzt den Fuhrpark deiner Familie.',
    source: 'https://www.scribd.com/document/509302601/CPR-Corebook-Cyberpunk-Red-v122', reference: 'Grundregelwerk S. 161–165',
    features: [
      ['Fahrzeuge beherrschen', 'Dein Moto-Rang verbessert Proben zum Fahren oder Steuern von Land-, Luft- und Wasserfahrzeugen. Reiten gehört nicht dazu.'],
      ['Fahrzeugtechnik', 'Der gleiche Rollenbonus gilt auf Land-, Luft- und Wasserfahrzeugtechnik. Andere Technikfertigkeiten bekommen ihn nicht pauschal.'],
      ['Familienfuhrpark', 'Du erhältst Zugang zu Familienfahrzeugen oder passenden Upgrades entsprechend deinem Rang. Das ist kein pauschaler Geldbonus; die Fahrzeugauswahl vereinbarst du mit deiner Gruppe.']
    ], skills: ['drive-land', 'pilot-air', 'pilot-sea', 'land-vehicle-tech', 'air-vehicle-tech', 'sea-vehicle-tech']
  }
};

export function roleAbilityExamples(character, evaluated) {
  const rank = roleRank(character);
  const roles = evaluated.roleAbilities ?? evaluateRolePoints(character);
  const points = roles.state;
  const stat = id => evaluated.attributes[id]?.effective ?? '—';
  const skill = id => evaluated.skills.find(item => item.id === id);
  const base = id => skill(id)?.base ?? '—';
  const level = id => skill(id)?.level ?? 0;
  switch (character.role) {
    case 'rockerboy': return [`Fans gewinnen: ${rank} + 1W10. COOL und Auftrittsfertigkeiten werden hier nicht addiert.`];
    case 'solo': return [`Deine Verteilung nutzt ${roles.spent} von ${rank} Kampfpunkten. Präzise angreifen gibt +${roles.bonuses.attack ?? 0} auf Angriffe; Schnell reagieren gibt +${roles.bonuses.initiative ?? 0} auf Initiativewürfe.`, `Handfeuerwaffen: Basis ${base('handgun')} + Präzision ${roles.bonuses.attack ?? 0} = ${typeof base('handgun') === 'number' ? base('handgun') + (roles.bonuses.attack ?? 0) : '—'} + 1W10. Initiative: ${evaluated.derived.find(item=>item.id==='initiative')?.value ?? '—'} + 1W10.`, `Erster erfolgreicher Angriff pro Runde: +${roles.bonuses.firstDamage ?? 0} Schaden vor Rüstung. Erster erlittener Schaden pro Runde: −${roles.bonuses.damageDeflection ?? 0}. Patzer abfangen: ${roles.bonuses.fumbleRecovery ? 'aktiv' : 'nicht aktiv'}.`];
    case 'netrunner': return [`Eine gewöhnliche Schnittstellenprobe: ${rank} + 1W10, gegebenenfalls plus passendem Programmbonus. INT und Elektronik werden nicht addiert.`];
    case 'tech': {
      const raw = typeof base('basic-tech') === 'number' ? base('basic-tech') - points.tech.field : null;
      const check = id => points.tech[id] ? `${raw === null ? '—' : raw + points.tech[id]} + 1W10` : 'noch nicht erlernt';
      return [`Gewöhnliche Grundlegende Technik: TECH ${stat('TECH')} + Fertigkeitsrang ${level('basic-tech')} + Feldexpertise ${points.tech.field} = Basis ${base('basic-tech')} + 1W10. Weitere feste Boni sind in der Basis enthalten.`, `Maker-Proben mit Grundlegender Technik: Verbessern ${check('upgrade')}; Herstellen ${check('fabrication')}; Erfinden ${check('invention')}. Hier zählt nur der jeweilige Fachrang, ohne zusätzlichen Feldexpertise-Bonus.`, `Provisorische Reparatur: ${points.tech.field ? points.tech.field * 10 + ' Minuten Haltbarkeit' : 'erst ab Feldexpertise 1 verfügbar'}.`];
    }
    case 'medtech': {
      const surgery = points.medtech.surgery * 2;
      const medical = points.medtech.pharma + points.medtech.cryo;
      const total = value => typeof stat('TECH') === 'number' ? stat('TECH') + value : '—';
      return [`Chirurgie: ${surgery ? 'TECH ' + stat('TECH') + ' + Chirurgierang ' + surgery + ' = ' + total(surgery) + ' + 1W10' : 'noch nicht erlernt'}.`, `Medizintechnik: ${medical ? 'TECH ' + stat('TECH') + ' + Pharmazeutik ' + points.medtech.pharma + ' + Kryotechnik ' + points.medtech.cryo + ' = ' + total(medical) + ' + 1W10' : 'noch nicht erlernt'}.`, `Erste Hilfe bleibt unabhängig davon bei Basis ${base('first-aid')} + 1W10. Medizinpunkte verbrauchen keine Fertigkeitspunkte.`];
    }
    case 'media': return [`Passive Hinweise: Glaubwürdigkeit ${rank} + 1W10, von der Spielleitung gewürfelt.`, `Aktive Bibliotheksrecherche: INT ${stat('INT')} + Rang ${level('library-search')} = ${base('library-search')} + 1W10. Glaubwürdigkeit wird hier nicht pauschal addiert.`];
    case 'exec': return [`Deine Geschäftsprobe: INT ${stat('INT')} + Geschäftssinn ${level('business')} = ${base('business')} + 1W10. Teamwork ${rank} wird nicht addiert.`, 'Teammitglieder und Firmenleistungen werden hier erklärt; ihre konkrete Auswahl und Ausstattung werden noch nicht verwaltet.'];
    case 'lawman': return [`Bei Backup ${rank} gelingt der Ruf mit 1 bis ${rank} auf 1W10. Das ist kein Attribut-plus-Fertigkeit-Wurf.`, `Während du auf Hilfe wartest, bleibt etwa Wahrnehmung eine normale Probe mit deiner Basis ${base('perception')} + 1W10.`];
    case 'fixer': return [`Feilschen: COOL ${stat('COOL')} + Handeln ${level('trading')} + Operator ${rank} = ${typeof base('trading') === 'number' ? base('trading') + rank : '—'} + 1W10. Vorhandene feste Fertigkeitsboni sind in dieser Summe enthalten.`, 'Die zusätzliche Rollensprache und konkrete Kontakte werden noch nicht separat gespeichert. Der Kaufkatalog verwendet reguläre Preise; ein ausgehandelter Deal ist situationsabhängig.'];
    case 'nomad': return [`Landfahrzeuge fahren: REF ${stat('REF')} + Rang ${level('drive-land')} + Moto ${rank} = ${base('drive-land')} + 1W10.`, `Landfahrzeugtechnik: TECH ${stat('TECH')} + Rang ${level('land-vehicle-tech')} + Moto ${rank} = ${base('land-vehicle-tech')} + 1W10. Moto ist bereits in diesen Fertigkeitsbasen enthalten. Fahrzeuge und Upgrades werden noch nicht ausgewählt.`];
    default: return [];
  }
}
