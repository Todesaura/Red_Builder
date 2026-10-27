// Advisory only. Never add these to evaluateCharacter.errors or PDF readiness.
export function equipmentWarnings(character,rules,evaluated){
  const inventory=character.equipment.items.filter(e=>e.quantity>0).map(e=>rules.equipmentRules.items.find(d=>d.id===e.catalogId)).filter(Boolean);
  const owned=new Set(inventory.map(i=>i.id));
  const installed=new Set(evaluated.cyberware.errors.length?[]:character.cyberware.items.map(i=>i.catalogId));
  const hasGear=(...ids)=>ids.some(id=>owned.has(id));
  const hasCyber=(...ids)=>ids.some(id=>installed.has(id));
  const warnings=[];
  const add=(id,title,text,tab)=>warnings.push({id,title,text,tab});
  const weapons=inventory.filter(i=>i.kind==='weapon');
  if(!weapons.length&&!hasCyber('chainripp')&&!(evaluated.cyberware.errors.length===0&&evaluated.cyberware.entries.some(e=>e.definition.cyberWeapon)))add('physical-weapon','Keine Waffe für die reale Welt',character.role==='netrunner'?'Du hast keine normale Waffe gekauft. NET-Programme helfen gegen Gegner in der realen Welt nicht. Eine einfache Nahkampfwaffe oder Pistole kann sinnvoll sein; unbewaffnet zu starten bleibt erlaubt.':'Du hast keine Waffe gekauft und keine erfasste Cyberwaffe installiert. Prüfe, ob du bewusst unbewaffnet starten möchtest. Handgemenge bleibt möglich.','weapons');
  const unprotected=['head','body'].filter(slot=>evaluated.armor[slot+'SP']===0);
  if(unprotected.length){
    const purchased=inventory.some(i=>i.category==='armor');
    add('armor',unprotected.length===2?'Kein wirksamer Rüstungsschutz':unprotected[0]==='head'?'Kein Kopfschutz':'Keine Körperpanzerung',
      unprotected.length===2?(purchased?'Du besitzt Rüstung, hast aber keinen wirksamen Schutz angelegt. Wähle Kopf- und Körperrüstung unter Ausstattung aus.':'Du hast keine Rüstung gekauft und keinen wirksamen implantierten Schutz. Kopf- und Körperrüstung sind getrennte Käufe.'):unprotected[0]==='head'?'Dein Körper ist geschützt, dein Kopf hat aber 0 SP. Prüfe, ob du zusätzlich Kopfschutz möchtest.':'Dein Kopf ist geschützt, dein Körper hat aber 0 SP. Prüfe deine Körperrüstung.', 'armor');
  }
  const withoutAmmo=weapons.filter(i=>i.ammoIds?.length&&!i.ammoIds.some(id=>owned.has(id)));
  if(withoutAmmo.length)add('ammunition','Munition fehlt',`Für ${withoutAmmo.map(i=>i.name).join(', ')} ist keine passende Munition gekauft. Die Waffen sind ohne passende Geschosse nicht schussbereit.`, 'weapons');
  const tools=hasGear('techtool','tech-bag')||hasCyber('tool-hand');
  const communication=hasGear('agent','radio','disposable-phone')||hasCyber('internal-agent','radio-communicator');
  switch(character.role){
    case 'netrunner': {
      const missing=[...(!hasCyber('neural-link')?['Neural Link']:[]),...(!hasCyber('interface-plugs')?['Interface Plugs']:[])];
      if(missing.length)add('net-cyberware','Netrunning: benötigte Cyberware fehlt',`Noch nicht installiert: ${missing.join(' und ')}. Ohne diese Verbindung kannst du dein Cyberdeck nicht für Netrunning benutzen. Nur vorgemerkte Implantate zählen noch nicht.`, 'cyberware');
      if(!inventory.some(i=>i.netrunner?.capacity))add('net-deck','Netrunning: kein Cyberdeck','Für die Schnittstellenfähigkeit im Netz fehlt ein gekauftes Cyberdeck. Programme oder Hardware allein ersetzen das Deck nicht.','netrunner');
      if(!inventory.some(i=>i.netrunner?.group==='ice'||i.netrunner?.group==='programs'&&['Anti-Programm','Anti-Person'].includes(i.netrunner.className)))add('net-weapon','Keine NET-Angriffsprogramme','Du hast weder ein Angriffsprogramm noch eigenes Black ICE gekauft. Beispielsweise Schwert ergänzt deinen NET-Kampf. Stromstoß ist auch ohne gekauftes Angriffsprogramm über die Schnittstellenfähigkeit möglich.','netrunner');
      if(!hasGear('virtuality-goggles')&&!hasCyber('virtuality','virtuality-optics'))add('net-vision','Keine Virtuality-Sicht','Keine Virtuality-Brille oder erfasste entsprechende Cyberoptik vorhanden. Netrunning ist ohne sie möglich, aber für die Außenwelt bist du dabei effektiv bewusstlos.','netrunner');
      break;
    }
    case 'tech':
      if(!tools)add('tech-tools','Maker: Werkzeug fehlt','Kein Techtool, keine Technik-Tasche und keine installierte Tool Hand erfasst. Für Reparaturen und Maker-Arbeiten brauchst du zur Aufgabe passendes Werkzeug, gegebenenfalls Material und einen Arbeitsplatz.','misc');
      break;
    case 'medtech':
      if(!hasGear('medtech-bag'))add('medical-tools','Medizin: Behandlungsausrüstung fehlt','Keine Medtech-Tasche gekauft. Prüfe passende medizinische Werkzeuge für Behandlungen und deine gewählten Medizin-Spezialisierungen; benötigte Mittel hängen vom Eingriff ab.','misc');
      if(character.rolePoints.medtech.pharma>0&&!hasGear('airhypo')&&!character.equipment.custom.some(i=>i.quantity>0&&/\bairhypo\b/i.test(i.name)))add('pharma-airhypo','Pharmazeutik: Airhypo prüfen','Du hast Pharmazeutik gewählt, aber kein Airhypo erfasst. Zum Verabreichen deiner Pharmazeutika brauchst du ein Airhypo und eine vorhandene Dosis. Ein Airhypo kann unter Sonstiges als eigener Gegenstand eingetragen werden.','misc');
      // Cryopump access can be granted by the role itself; do not invent a purchase requirement.
      break;
    case 'nomad':
      if(!tools)add('nomad-tools','Moto: Werkzeug für Fahrzeugreparaturen fehlt','Kein Techtool, keine Technik-Tasche und keine installierte Tool Hand erfasst. Für Fahrzeugreparaturen fehlt damit erfasstes Werkzeug; dein Moto-Bonus zum Steuern bleibt davon unabhängig. Vereinbare dein Familienfahrzeug mit der Spielleitung.','misc');
      break;
    case 'rockerboy':
      if(character.skills.specialties.some(s=>s.skill==='play-instrument'&&s.level>0)&&!hasGear('instrument'))add('performance-instrument','Instrument für deine Auftritte prüfen','Du hast Instrument spielen gelernt, aber kein Instrument aus dem Katalog gekauft. Prüfe dein Auftrittsmaterial. Charismatische Wirkung verlangt nicht grundsätzlich ein Instrument.','misc');
      break;
    case 'media':
      if(!hasGear('agent','camera')&&!hasCyber('micro-video','audio-recorder','internal-agent'))add('media-recording','Dokumentation: Aufnahmegerät fehlt','Kein Agent, keine Kamera und keine erfasste Aufnahme-Cyberware vorhanden. Prüfe, wie du Belege und Interviews festhältst. Glaubwürdigkeit selbst benötigt kein Aufnahmegerät.','misc');
      break;
    case 'exec': case 'lawman': case 'fixer':
      if(!communication){
        const task={exec:'deine Teammitglieder',lawman:'deine Verstärkung',fixer:'deine Kontakte'}[character.role];
        add('role-communication','Erreichbarkeit deiner Unterstützung prüfen',`Kein Agent, Telefon, Funkgerät oder passendes Kommunikationsimplantat erfasst. Kläre, wie du ${task} unterwegs erreichst. Die Rollenfähigkeit wird dadurch nicht pauschal als unbenutzbar gewertet.`, 'misc');
      }
      break;
  }
  return warnings;
}
