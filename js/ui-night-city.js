import { escapeHtml as e } from './html.js';

// Schematic orientation based on RTG's Night City Atlas (2045); no street scale.
const positions={
 'NorCal Military Base':[235,35], 'Watson Development':[310,75], Kabuki:[385,65],
 'New Westbrook':[455,85], 'Charter Hill':[445,145], 'Executive Zone':[495,195],
 'Little Europe':[205,195], 'Upper Marina':[275,170], Downtown:[200,250],
 'The Hot Zone':[280,245], 'Little China':[355,245], 'University District':[205,310],
 'The Glen':[265,365], 'Old Japantown':[350,315], 'South Night City':[170,380],
 'Port of Night City':[150,440], 'Reclamation Zone':[235,445], 'Old Combat Zone':[345,395],
 'Heywood Docks':[440,360], 'North Heywood':[505,350], 'Heywood Industrial Zone':[450,430],
 'Santo Domingo':[510,485], 'Pacific Playground':[375,500], 'Rancho Coronado':[450,550],
 'The Outskirts':[535,560]
};
export function renderNightCity(character,rules) {
 const value=character.skills.hometown;
 return `<section class="night-city-picker" aria-label="Heimat auf der Karte"><div class="district-choices"><p>Viertel anklicken. Darüberfahren oder mit Tab ansteuern zeigt die Lage.</p>${rules.skillRules.locations.map(name=>`<button type="button" data-hometown="${e(name)}" class="district-choice ${name===value?'selected':''}" aria-pressed="${name===value}">${e(name)}</button>`).join('')}</div><figure class="night-city-map"><svg viewBox="0 0 600 620" role="img" aria-labelledby="night-city-title"><title id="night-city-title">Night City 2045 – schematische Lage der Viertel</title><rect width="600" height="620" rx="12" fill="#10232d"/><path d="M190 0H600V620H315L335 520 285 465 125 470 110 390 160 325 145 260 180 185 160 125Z" fill="#252d35" stroke="#6a7b84"/><path d="M175 185L290 275 280 440M300 25L350 210 420 320 455 590M535 0L520 310 400 490" fill="none" stroke="#44505d" stroke-width="12"/><text x="35" y="285" fill="#7db0be" font-size="16" transform="rotate(-90 35 285)">DEL CORONADO BAY</text><text x="25" y="35" fill="#d4dde6" font-size="15">N ↑</text>${Object.entries(positions).map(([name,[x,y]])=>`<g data-district-marker="${e(name)}" class="district-marker ${name===value?'active':''}"><circle cx="${x}" cy="${y}" r="10"/><text x="${x}" y="${y-16}" text-anchor="middle">${e(name)}</text></g>`).join('')}</svg><figcaption id="district-map-caption">${e(value||'Wähle deine Heimat')} · Schematische Orientierung, keine maßstabsgetreuen Grenzen.</figcaption></figure></section>`;
}

export function bindNightCity(root){
 const show=name=>{for(const marker of root.querySelectorAll('[data-district-marker]'))marker.classList.toggle('active',marker.dataset.districtMarker===name);const caption=root.querySelector('#district-map-caption');if(caption)caption.textContent=(name||'Wähle deine Heimat')+' · Schematische Orientierung';};
 for(const button of root.querySelectorAll('[data-hometown]')){
  button.addEventListener('pointerenter',()=>show(button.dataset.hometown));
  button.addEventListener('focus',()=>show(button.dataset.hometown));
  button.addEventListener('pointerleave',()=>show(root.querySelector('[data-hometown][aria-pressed="true"]')?.dataset.hometown));
  button.addEventListener('blur',()=>show(root.querySelector('[data-hometown][aria-pressed="true"]')?.dataset.hometown));
 }
}
