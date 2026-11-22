import {drawPawn, PAWN_HEIGHT_MM} from './pdf-pawn.js?v=pawnbase1';
import {loadPdfAsset, FONT_URL, wrapPdfText} from './pdf-character.js';

export const ENEMY_TYPES = [
  {id:'boostganger', name:'Boostganger', weapon:'Pistole'},
  {id:'street-ganger', name:'Straßenganger', weapon:'Maschinenpistole'},
  {id:'gang-veteran', name:'Gang-Veteran', weapon:'Sturmgewehr'},
  {id:'sniper', name:'Scharfschütze', weapon:'Scharfschützengewehr'}
].map(type => ({...type, portraits:Array.from({length:6}, (_, index) => `data/enemies/${type.id}-${index+1}.jpg`)}));
const columns = 8;
const rows = Math.floor((297 - 20 - 5) / (PAWN_HEIGHT_MM + 4));
export const PAWNS_PER_PAGE = columns * rows;
const mm = value => value * 72 / 25.4;

export function selectedEnemyPawns(quantities) {
  const pawns = [];
  for (const type of ENEMY_TYPES) {
    const count = Number(quantities[type.id] ?? 0);
    if (!Number.isInteger(count) || count < 0 || count > 50) throw new Error('Bitte je Gegnertyp 0 bis 50 Figuren auswählen.');
    for (let number = 1; number <= count; number++) {
      pawns.push({...type, number, portrait:type.portraits[(number-1) % type.portraits.length]});
    }
  }
  if (!pawns.length) throw new Error('Wähle mindestens eine Figur aus.');
  if (pawns.length > 120) throw new Error('Bitte höchstens 120 Figuren pro PDF auswählen.');
  return pawns;
}

export async function generateEnemyPawns(quantities, options = {}) {
  const pawns = selectedEnemyPawns(quantities);
  const [pdfLib, {default:fontkit}, fontBytes] = await Promise.all([
    import('../vendor/pdf-lib/pdf-lib.esm.min.js'), import('../vendor/fontkit/fontkit.es.min.js'),
    options.fontBytes ?? loadPdfAsset(FONT_URL)
  ]);
  const pdf = await pdfLib.PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(fontBytes, {subset:true});
  const images = new Map();
  await Promise.all([...new Set(pawns.map(pawn => pawn.portrait))].map(async portrait => {
    const bytes = options.portraitBytes?.[portrait] ?? await loadPdfAsset(new URL('../'+portrait, import.meta.url));
    images.set(portrait, await pdf.embedJpg(bytes));
  }));
  const pageCount = Math.ceil(pawns.length / PAWNS_PER_PAGE);
  for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
    const page = pdf.addPage([mm(210), mm(297)]);
    page.drawText('GEGNERFIGUREN - RED//BUILDER', {x:mm(5), y:mm(290), size:11, font});
    page.drawText('100 % / tatsächliche Größe drucken | Ausschneiden, mittig falten | '+(pageIndex+1)+' / '+pageCount, {x:mm(5), y:mm(285), size:8, font});
    pawns.slice(pageIndex * PAWNS_PER_PAGE, (pageIndex+1) * PAWNS_PER_PAGE).forEach((pawn, index) => {
      drawPawn(page, images.get(pawn.portrait), pawn.name+' '+pawn.number, {
        ...pdfLib, font, wrap:wrapPdfText, heading:false,
        left:mm(5 + (index % columns) * 25),
        bottom:mm(297 - 20 - PAWN_HEIGHT_MM - Math.floor(index/columns) * (PAWN_HEIGHT_MM + 4))
      });
    });
  }
  pdf.setTitle('Gegnerfiguren - RED//BUILDER');
  pdf.setAuthor('RED//BUILDER');
  return {bytes:await pdf.save(), filename:'RED-BUILDER-Gegnerfiguren.pdf'};
}
