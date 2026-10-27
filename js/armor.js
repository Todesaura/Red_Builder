export function equipArmor(character, rules, slot, id) {
  if (!['head', 'body'].includes(slot)) return { ok: false, error: 'Unbekannter Rüstungsbereich.' };
  if (id !== null && (!character.equipment.items.some(item => item.catalogId === id && item.quantity > 0) || !rules.equipmentRules?.items.some(item => item.id === id && item.category === 'armor' && item.slot === slot))) return { ok: false, error: 'Wähle eine gekaufte Rüstung für diesen Bereich.' };
  character.equipment.armor ??= { head: null, body: null };
  character.equipment.armor[slot] = id;
  return { ok: true };
}

export function evaluateArmor(character, rules, cyberware = null) {
  const result = { head: null, body: null, penalty: 0, effects: [], errors: [] };
  for (const slot of ['head', 'body']) {
    const id = character.equipment?.armor?.[slot];
    if (!id) continue;
    const item = rules.equipmentRules?.items.find(item => item.id === id && item.category === 'armor' && item.slot === slot);
    if (!item || !character.equipment.items.some(entry => entry.catalogId === id && entry.quantity > 0)) { result.errors.push('Angelegte Rüstung muss zum Bereich passen und im Inventar sein.'); continue; }
    result[slot] = {...item,sp:Math.max(0,item.sp-(character.campaign?.armorLoss?.[item.id]??0))};
    result.penalty = Math.max(result.penalty, item.penalty);
  }
  if (result.penalty) result.effects = ['REF', 'DEX', 'MOVE'].map(target => ({ type: 'equipment', target, value: -result.penalty, min: 0, label: 'Getragene Rüstung', source: 'Grundregelwerk S. 96–97' }));
  result.cyberSP = Math.max(0, ...(cyberware?.effects ?? []).filter(effect => effect.type === 'armor' && effect.target === 'both').map(effect => effect.value));
  result.headSP = Math.max(result.head?.sp ?? 0, result.cyberSP);
  result.bodySP = Math.max(result.body?.sp ?? 0, result.cyberSP);
  return result;
}
