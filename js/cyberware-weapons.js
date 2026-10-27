// Weapons are derived from installed, valid implants, never saved as free inventory.
export function installedCyberWeapons(character,rules,evaluated) {
  if(evaluated.cyberware.errors.length)return [];
  const entries=evaluated.cyberware.entries;
  return entries.filter(e=>e.definition.cyberWeapon&&![e.id,e.parent].some(id=>(character.campaign?.cyberDamaged??[]).includes(id))).map(e=>{
    const d=e.definition,paired=['arm-left','arm-right'].every(location=>entries.some(other=>other.catalogId===e.catalogId&&other.location===location&&![other.id,other.parent].some(id=>(character.campaign?.cyberDamaged??[]).includes(id))));
    const side=e.location==='arm-left'?'links':'rechts';
    let rule=d.description;
    if(e.catalogId==='mantis-blade')rule=`Ausgefahren: Diese Hand hält keine andere Waffe. Eingefahren verdeckbar. ${paired?'Paar installiert: Klettern ohne Bewegungsabzug.':'Nur eine Klinge: kein Kletterbonus des Paars.'}`;
    if(e.catalogId==='gorilla-arm')rule=`Nicht verdeckbar. Nur zum Führen von Waffen gilt Körperkraft 11; keine Änderung an Attributen oder Trefferpunkten. ${paired?'Paar installiert: Türen aufbrechen, schwere Deckung bewegen, Gegner würgen oder zu Boden schleudern.':'Nur ein Arm: keine zusätzlichen Paar-Funktionen.'}`;
    if(e.catalogId==='monowire')rule='Reichweite 6 m; ohne Probe verdeckbar. Kritische Verletzung: zweimal auf der Verletzungstabelle würfeln, ein Ergebnis wählen; Zusatzschaden nur einmal.';
    return {quantity:1,item:{id:'cyber-'+e.id,cyberwareId:e.catalogId,name:`${d.name} (${side})`,shortName:`${d.name} ${side==='links'?'L':'R'}`,kind:'weapon',fireProfile:'melee',hands:1,...d.cyberWeapon,paired,cyberRule:rule,reference:d.source}};
  });
}
