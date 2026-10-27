import { PORTRAITS } from './portrait-catalog.js?v=100';
import { escapeHtml } from './html.js';

export function portraitsForRole(role) {
  return PORTRAITS.filter(portrait => portrait.role === role);
}

export function renderPortraitGallery(character, rules) {
  const portraits = portraitsForRole(character.role);
  const role = rules.roles.find(role => role.id === character.role);
  return `<section class="portrait-gallery" aria-labelledby="portrait-gallery-title"><h3 id="portrait-gallery-title">Dein Porträt${role ? ` · ${escapeHtml(role.name)}` : ''}</h3><p>${role ? 'Klicke ein Porträt an oder lade dein eigenes Bild hoch. Deine Auswahl wird grün markiert.' : 'Wähle zuerst deine Rolle, um die passenden Porträts zu sehen.'}</p>${renderPortraitControls(character)}${['M','W'].map(gender => {
    const options = portraits.filter(portrait => portrait.gender === gender);
    if (!options.length) return '';
    return `<h4>${gender === 'M' ? 'Männliche Porträts' : 'Weibliche Porträts'}</h4><div class="portrait-options">${options.map(portrait => {
      const selected = character.portraitSource === portrait.id && !!character.portrait;
      const label = `${role.name} · ${gender === 'M' ? 'männlich' : 'weiblich'} · Bild ${portrait.number}`;
      return `<button type="button" class="portrait-option ${selected ? 'selected' : ''}" data-portrait="${portrait.id}" aria-label="${escapeHtml(label)}" aria-pressed="${selected}"><img src="${portrait.thumbnail}" width="180" height="220" loading="lazy" alt=""><span>Bild ${portrait.number}${selected ? ' · Ausgewählt' : ''}</span></button>`;
    }).join('')}</div>`;
  }).join('')}</section>`;
}

function renderPortraitControls(character) {
  return `<div class="portrait-controls">${character.portrait ? `<div class="portrait-current"><div class="portrait-frame"><img src="${escapeHtml(character.portrait)}" alt="Gewähltes Porträt von ${escapeHtml(character.name || 'deinem Charakter')}"></div><div><strong>Dein gewähltes Bild</strong><button type="button" class="text-button" data-action="remove-portrait">Bild entfernen</button></div></div>` : ''}<div class="portrait-editor"><label class="portrait-upload" for="portrait-file">Eigenes Bild hochladen <span>↗</span></label><input class="portrait-file sr-only" id="portrait-file" type="file" accept="image/jpeg,image/png,image/webp" aria-describedby="portrait-help"><small id="portrait-help">JPG, PNG oder WebP · max. 5 MB · Wird lokal gespeichert.</small></div></div>`;
}
