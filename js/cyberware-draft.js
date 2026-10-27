import { installationErrors, installCyberware } from './cyberware.js?v=session6';
import { evaluateFunds } from './economy.js?v=session6';
import { evaluateCharacter } from './rules.js?v=session6';
import { baseStats, cyberwareCandidate } from './cyberware-ui-model.js?v=session6';

// Only additions live in the draft. Installed components cannot be undone by dragging.
export function draftCharacter(character, additions = []) {
  return { ...character, cyberware: { ...character.cyberware, items: [...character.cyberware.items, ...additions] } };
}

export function addToCyberwareDraft(character, rules, additions, catalogId, location) {
  const copy = structuredClone(draftCharacter(character, additions));
  const candidate = cyberwareCandidate(copy, rules, catalogId, location);
  const result = installCyberware(copy, rules, catalogId, location, candidate.parent, baseStats(evaluateCharacter(character, rules)));
  return result.ok ? { ok: true, additions: copy.cyberware.items.slice(character.cyberware.items.length) } : result;
}

export function removeFromCyberwareDraft(character, rules, additions, id) {
  const removed = new Set([id]);
  let changed;
  do {
    changed = false;
    const remaining = [...character.cyberware.items, ...additions.filter(item => !removed.has(item.id))];
    for (const item of additions) {
      if (removed.has(item.id)) continue;
      const definition = rules.cyberwareRules.items.find(entry => entry.id === item.catalogId);
      if (removed.has(item.parent) || definition?.requirements?.requires?.some(catalogId => !remaining.some(other => other.catalogId === catalogId))) {
        removed.add(item.id); changed = true;
      }
    }
  } while (changed);
  return additions.filter(item => !removed.has(item.id));
}

export function evaluateCyberwareDraft(character, rules, additions = []) {
  const projected = draftCharacter(character, additions);
  const errors = [...installationErrors(projected.cyberware, rules.cyberwareRules, baseStats(evaluateCharacter(character, rules))), ...evaluateFunds(projected, rules).errors];
  if (projected.cyberware.items.length > 60) errors.push('Höchstens 60 Cyberware-Komponenten sind möglich.');
  const ids = new Set(character.cyberware.items.map(item => item.id));
  for (const item of additions) {
    if (!/^implant-[1-9]\d{0,5}$/.test(item.id) || ids.has(item.id)) errors.push('Ungültiger Installationsentwurf.');
    ids.add(item.id);
  }
  return { projected, before: evaluateCharacter(character, rules), after: evaluateCharacter(projected, rules), errors: [...new Set(errors)] };
}

export function commitCyberwareDraft(character, rules, additions) {
  if (!additions.length) return { ok: false, error: 'Ziehe zuerst Cyberware in den Entwurf.' };
  const preview = evaluateCyberwareDraft(character, rules, additions);
  if (preview.errors.length) return { ok: false, error: preview.errors.join(' ') };
  character.cyberware = structuredClone(preview.projected.cyberware);
  return { ok: true };
}
