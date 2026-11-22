import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PDFDocument} from '../vendor/pdf-lib/pdf-lib.esm.min.js';
import {ENEMY_TYPES, selectedEnemyPawns, generateEnemyPawns} from '../js/enemy-pawns.js';

test('Gegnerauswahl zählt und nummeriert Typen unabhängig und weist ungültige Mengen zurück', () => {
  assert.equal(ENEMY_TYPES.length, 4);
  assert.deepEqual(selectedEnemyPawns({boostganger:2,sniper:1}).map(p => [p.id,p.number]), [['boostganger',1],['boostganger',2],['sniper',1]]);
  for (const type of ENEMY_TYPES) {
    const pawns = selectedEnemyPawns({[type.id]:7});
    assert.equal(new Set(pawns.slice(0,6).map(pawn => pawn.portrait)).size, 6);
    assert.equal(pawns[6].portrait, pawns[0].portrait);
  }
  for (const quantities of [{},{sniper:-1},{sniper:1.5},{sniper:'abc'},{sniper:51},{boostganger:50,'street-ganger':50,'gang-veteran':50}]) {
    assert.throws(() => selectedEnemyPawns(quantities));
  }
});

test('Mehrseitiger Gegnerdruck lädt alle Porträts und erzeugt A4 mit korrekter Seitenzahl', async () => {
  const fontBytes = await readFile(new URL('../vendor/fonts/Ubuntu-R.ttf', import.meta.url));
  const portraitBytes = Object.fromEntries(await Promise.all(ENEMY_TYPES.flatMap(type => type.portraits).map(async portrait => [portrait, await readFile(new URL('../'+portrait, import.meta.url))])));
  const result = await generateEnemyPawns({boostganger:14,'street-ganger':1,'gang-veteran':1,sniper:1}, {fontBytes,portraitBytes});
  const pdf = await PDFDocument.load(result.bytes);
  assert.equal(pdf.getPageCount(), 2);
  for (const page of pdf.getPages()) {
    assert.ok(Math.abs(page.getWidth()-210*72/25.4)<0.01);
    assert.ok(Math.abs(page.getHeight()-297*72/25.4)<0.01);
  }
});
