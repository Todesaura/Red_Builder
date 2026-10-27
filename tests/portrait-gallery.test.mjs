import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, access } from 'node:fs/promises';
import { PORTRAITS } from '../js/portrait-catalog.js';
import { portraitsForRole, renderPortraitGallery } from '../js/ui-portraits.js';
import { validateCharacter } from '../js/model.js';
import { readGalleryPortrait } from '../js/portraits.js';
import { completeCharacter, rules } from './helpers/pdf-fixture.mjs';

test('Galerie enthält sämtliche benannten Originale, eindeutige IDs und erreichbare Vorschauen', async () => {
  const files=(await readdir(new URL('../data/portraits/',import.meta.url))).filter(name=>/^[A-Za-z]+-[MW]-\d+\.png$/.test(name));
  assert.deepEqual(PORTRAITS.map(entry=>entry.src.split('/').at(-1)).sort(),files.sort());
  assert.equal(new Set(PORTRAITS.map(entry=>entry.id)).size,files.length);
  for (const entry of PORTRAITS) {
    assert.ok(rules.roles.some(role=>role.id===entry.role));
    await access(new URL('../'+entry.thumbnail,import.meta.url));
  }
});

test('Jede Rolle zeigt ausschließlich ihre männlichen und weiblichen Bilder; Auswahl ist erkennbar', () => {
  for (const role of rules.roles) {
    const entries=portraitsForRole(role.id);
    assert.ok(entries.some(entry=>entry.gender==='M'));
    assert.ok(entries.some(entry=>entry.gender==='W'));
    const c=completeCharacter(role.id);
    c.portrait='data:image/jpeg;base64,YWJj';c.portraitSource=entries[0].id;
    const html=renderPortraitGallery(c,rules);
    assert.equal((html.match(/data-portrait=/g)||[]).length,entries.length);
    assert.equal((html.match(/aria-pressed="true"/g)||[]).length,1);
    assert.match(html,/Männliche Porträts/);assert.match(html,/Weibliche Porträts/);
    for(const entry of PORTRAITS.filter(entry=>entry.role!==role.id))assert.ok(!html.includes(entry.thumbnail));
  }
  assert.match(renderPortraitGallery({role:''},rules),/Wähle zuerst deine Rolle/);
});

test('Gespeichertes Galeriebild bleibt erhalten; alte Uploads und unbekannte Quellen bleiben sicher', () => {
  const c=completeCharacter('netrunner');c.portrait='data:image/jpeg;base64,YWJj';c.portraitSource='Netrunner-W-1';
  assert.equal(validateCharacter(c,rules).portraitSource,c.portraitSource);
  assert.equal(validateCharacter(c,rules).portrait,c.portrait);
  delete c.portraitSource;assert.equal(validateCharacter(c,rules).portraitSource,null);
  c.portraitSource='../../unbekannt.png';assert.equal(validateCharacter(c,rules).portraitSource,null);
  c.portrait=null;c.portraitSource='Netrunner-W-1';assert.equal(validateCharacter(c,rules).portraitSource,null);
});

test('Unbekannte Galeriebilder werden vor einem Netzwerkzugriff abgewiesen', async () => {
  await assert.rejects(readGalleryPortrait('../unbekannt.png'),/nicht in der Galerie/);
});
