export const ATTRIBUTE_LABELS = Object.freeze({INT:'INT',REF:'REF',DEX:'GES',TECH:'TCH',COOL:'COO',WILL:'WIL',LUCK:'GLK',MOVE:'BEW',BODY:'KRA',EMP:'EMP'});
export const attributeLabel = id => ATTRIBUTE_LABELS[id] ?? id;
// Apply only to explanatory prose, never to save keys, control IDs or user text.
export const localizeAttributeText = value => String(value).replace(/\b(INT|REF|DEX|TECH|COOL|WILL|LUCK|MOVE|BODY|EMP)\b/g,attributeLabel).replace(/GES\/GES/g,'GES').replace(/KRA\/KRA/g,'KRA');
