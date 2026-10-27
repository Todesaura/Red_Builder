import { PORTRAITS } from './portrait-catalog.js?v=100';

export async function readGalleryPortrait(id) {
  const entry = PORTRAITS.find(portrait => portrait.id === id);
  if (!entry) throw new Error('Dieses Porträt ist nicht in der Galerie.');
  const response = await fetch(entry.src);
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
