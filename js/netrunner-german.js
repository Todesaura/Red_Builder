// German display terms; stable catalog IDs and numeric core rules stay unchanged.
export const NET_NAMES = {
 'net-program-eraser':'Radierer','net-program-see-ya':'Späher','net-program-speedy-gonzalvez':'Flitzer','net-program-worm':'Wurm',
 'net-program-armor':'Panzerung','net-program-flak':'Flak','net-program-shield':'Schild','net-program-banhammer':'Bannhammer',
 'net-program-sword':'Schwert','net-program-deckkrash':'Deckabsturz','net-program-hellbolt':'Höllenblitz',
 'net-program-nervescrub':'Nervenlöscher','net-program-poison-flatline':'Programmvergifter','net-program-superglue':'Sekundenkleber','net-program-vrizzbolt':'Nervenblitz',
 'net-ice-asp':'Kobra','net-ice-giant':'Riese','net-ice-hellhound':'Höllenhund','net-ice-kraken':'Krake','net-ice-liche':'Leichnam',
 'net-ice-raven':'Rabe','net-ice-scorpion':'Skorpion','net-ice-skunk':'Stinktier','net-ice-wisp':'Irrlicht','net-ice-dragon':'Drache','net-ice-killer':'Mörder','net-ice-sabertooth':'Säbelzahn',
 'net-hardware-backup-drive':'Sicherungslaufwerk','net-hardware-dna-lock':'DNS-Sperre','net-hardware-hardened-circuitry':'Gehärtete Schaltkreise',
 'net-hardware-insulated-wiring':'Isolierte Leitungen','net-hardware-krash-barrier':'Absturzsperre','net-hardware-range-upgrade':'Reichweitenverstärker',
 'virtuality-goggles':'Netzsicht-Brille'
};
const terms = {
 'Black ICE':'Schwarzes ICE','Nicht-Black-ICE':'gewöhnliche','Nicht-Black-ICE-':'gewöhnliche ',
 'ATK':'Angriff','DEF':'Verteidigung','REZ':'Integrität','PER':'Wahrnehmung','SPEED':'Geschwindigkeit',
 'Booster':'Verstärker','Defender':'Verteidiger','Anti-Programm':'gegen Programme','Anti-Person':'gegen Personen',
 'Cloak':'Verschleiern','Pathfinder':'Wegfinder','Backdoor':'Hintertür','Slide':'Entkommen',
 'Range Upgrade':'Reichweitenverstärker','Insulated Wiring':'Isolierte Leitungen','Jack Out':'Ausloggen',
 'NET-Aktionen':'Netz-Aktionen','NET-Aktion':'Netz-Aktion','NET-Angriff':'Netz-Angriff','Netrun':'Netzeinsatz'
};
const pattern=new RegExp('\\b(?:'+Object.keys(terms).sort((a,b)=>b.length-a.length).map(t=>t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')\\b','g');
export const germanNetText = text => String(text).replace(pattern,key=>terms[key]);
export const NET_SUPPORT_SUMMARIES={
 'net-program-eraser':'Verschleiern +2.',
 'net-program-see-ya':'Wegfinder +2.',
 'net-program-speedy-gonzalvez':'Geschwindigkeit +2 beim ersten Kontakt mit wartendem Schutzprogramm; keine zusätzlichen Netz-Aktionen.',
 'net-program-worm':'Hintertür +2.',
 'net-program-armor':'Hirnschaden um 4 senken. Nur eine Kopie aktiv; jede Kopie einmal je Netzeinsatz.',
 'net-program-flak':'Angriffswert gewöhnlicher Angriffsprogramme gegen dich wird 0. Nur eine Kopie aktiv; jede Kopie einmal je Netzeinsatz.',
 'net-program-shield':'Ersten Hirnschadentreffer eines gewöhnlichen Angriffsprogramms abfangen, dann ausgeschaltet. Nur eine Kopie aktiv; jede Kopie einmal je Netzeinsatz.'
};
export function netIntegrityWeapons(inventory,roleId,rank){
  return inventory.filter(e=>e.definition.netrunner?.integrityDamage).map(e=>{
    const n=e.definition.netrunner,automatic=n.group==='ice';
    return {...e,net:true,automatic,attackBase:automatic?n.atk:roleId==='netrunner'?rank+n.atk:null,
      damage:n.integrityDamage,netAttack:n.atk};
  });
}
