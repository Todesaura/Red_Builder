import { PORTRAITS } from './portrait-catalog.js?v=creationfix1';

export async function ensureDefaultPortrait(character, {random=Math.random, read=id=>readGalleryPortrait(id,true), isCurrent=()=>true}={}) {
  if (character.portrait || !character.role) return false;
  const role=character.role;
  const choices=PORTRAITS.filter(entry=>entry.role===role);
  if (!choices.length) return false;
  const entry=choices[Math.min(choices.length-1,Math.floor(random()*choices.length))];
  const portrait=await read(entry.id);
  if (!isCurrent() || character.role!==role || character.portrait) return false;
  character.portrait=portrait;
  character.portraitSource=entry.id;
  return true;
}

export async function readGalleryPortrait(id, useThumbnail=false) {
  const entry = PORTRAITS.find(portrait => portrait.id === id);
  if (!entry) throw new Error('Dieses Porträt ist nicht in der Galerie.');
  const response = await fetch(new URL('../' + (useThumbnail?entry.thumbnail:entry.src), import.meta.url));
  if (!response.ok) throw new Error('Das Porträt konnte nicht geladen werden. Bitte erneut versuchen.');
  return readPortrait(await response.blob());
}

// Re-encode raster uploads to keep localStorage small and exclude active image formats.
export async function readPortrait(file) {
  if (!file || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Wähle ein JPG-, PNG- oder WebP-Bild.');
  if (file.size > 5 * 1024 * 1024) throw new Error('Das Bild darf höchstens 5 MB groß sein.');
  const bitmap = await createImageBitmap(file).catch(() => { throw new Error('Dieses Bild konnte nicht gelesen werden.'); });
  try {
    const scale = Math.min(1, 400 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    context.fillStyle = '#191b20';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.82);
  } finally { bitmap.close(); }
}
