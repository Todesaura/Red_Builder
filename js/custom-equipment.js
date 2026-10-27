export const MAX_CUSTOM_ITEMS = 40;
export function validateCustomEquipment(input) {
  if (!Array.isArray(input) || input.length > MAX_CUSTOM_ITEMS) throw new Error('Eigene Ausrüstung ist ungültig (höchstens 40 Einträge).');
  const seen = new Set();
  return input.map(item => {
    if (!item || !/^custom-[1-9]\d{0,5}$/.test(item.id) || seen.has(item.id) || typeof item.name !== 'string' || !item.name.trim() || item.name.length > 60 || !Number.isInteger(item.cost) || item.cost < 0 || item.cost > 1000000 || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99 || typeof item.notes !== 'string' || item.notes.length > 600) throw new Error('Eigene Ausrüstung: Name bis 60 Zeichen, Preis in ganzen eb ab 0, Menge 1–99 und Notizen bis 600 Zeichen.');
    seen.add(item.id);
    return { id: item.id, name: item.name.trim(), cost: item.cost, quantity: item.quantity, notes: item.notes };
  });
}
export const customEquipmentCost = character => (character.equipment?.custom ?? []).reduce((sum, item) => sum + item.cost * item.quantity, 0);
export function removeCustomEquipment(character, id) {
  const item = character.equipment.custom.find(item => item.id === id);
  if (!item) return;
  item.quantity--;
  character.equipment.custom = character.equipment.custom.filter(item => item.quantity > 0);
}
