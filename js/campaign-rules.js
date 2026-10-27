// Core RED pp. 229–232, 411; prices are provider prices, not raw drug/material costs.
export const THERAPIES={
  standard:{name:'Standardtherapie',cost:500,days:7,dice:2,dv:15},
  intensive:{name:'Intensivtherapie',cost:1000,days:7,dice:4,dv:17},
  addiction:{name:'Suchttherapie',cost:1000,days:7,dice:0,dv:15}
};
export const TRANSACTION_TYPES={earned:'Verdienst',reward:'Geldbelohnung',spent:'Ausgabe',lost:'Verloren / gestohlen',sale:'Verkaufserlös'};
export function improvementCost(from,to,multiplier=1) {
  if(!Number.isInteger(from)||!Number.isInteger(to)||from<0||to<=from||to>10||![1,2,3].includes(multiplier))throw Error('Ungültige Steigerung (höchstens Rang 10).');
  return Array.from({length:to-from},(_,i)=>(from+i+1)*20*multiplier).reduce((a,b)=>a+b,0);
}
export const SESSION_SOURCES=[
 ['Cyberware-Wiedereinbau: offizielle RED-FAQ S. 6','https://rtalsoriangames.com/wp-content/uploads/2021/07/RTG-CPR-CoreBookFAQv1.3.pdf'],
 ['IP: Grundregelwerk S. 411','https://rtalsoriangames.com/cyberpunk/'],
 ['Menschlichkeit / Therapie: Grundregelwerk S. 229–232 und RTG-Regelklärung','https://rtalsoriangames.com/2021/02/05/cyberpunk-from-the-mayors-desk-2-5-21/'],
 ['Heilung / kritische Verletzungen: offizielle Roll20-Regeln','https://roll20.net/compendium/cpunk/Playing%20the%20Game']
];

export const INJURY_STATUS={active:'aktiv',quickfix:'Quick Fix (bis Tagesende)',treated:'dauerhaft behandelt',resolved:'aufgehoben'};

export function humanityRollText(definition){const r=definition.humanityRoll;return !r?.dice?'0':r.dice+'W6'+(r.divisor===2?' / 2 (aufrunden)':'');}
export function humanityRollBounds(definitions){return definitions.reduce((sum,d)=>{const r=d.humanityRoll;if(!r)throw Error('Für diese Cyberware fehlt ein geprüfter Menschlichkeitswurf.');return {min:sum.min+Math.ceil(r.dice/r.divisor),max:sum.max+Math.ceil(r.dice*6/r.divisor)};},{min:0,max:0});}
