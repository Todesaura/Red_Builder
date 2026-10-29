import { evaluateFunds } from './economy.js?v=shopping1';
export const CYBERWARE_EFFECT_TYPES = Object.freeze({ PERMANENT: 'permanent', SITUATIONAL: 'situational', SKILL: 'skill' });
export const createCyberware = () => ({ items: [], limit: null, removed: [] });

// Saves contain choices only; rule effects and prices always come from trusted configuration.
export function validateCyberware(input, config) {
  if (!input || !Array.isArray(input.items) || input.items.length > 60 || !(input.limit === null || Number.isInteger(input.limit) && input.limit >= 0 && input.limit <= 1000000)) throw new Error('Ungültige Cyberware-Daten.');
  const seen = new Set();
  const items = input.items.map(item => {
    if (!item || !/^implant-[1-9]\d{0,5}$/.test(item.id) || seen.has(item.id) || !config?.items.some(definition => definition.id === item.catalogId) || !config.locations.some(location => location.id === item.location) || !(item.parent === null || /^implant-[1-9]\d{0,5}$/.test(item.parent))) throw new Error('Ungültiger Cyberware-Eintrag.');
    seen.add(item.id);
    return { id: item.id, catalogId: item.catalogId, location: item.location, parent: item.parent };
  });
  if (!Array.isArray(input.removed) || input.removed.length > 300) throw new Error('Ungültige Ausbauhistorie.');
  const removed = input.removed.map(item => {
    if (!item || !config?.items.some(definition => definition.id === item.catalogId) || !Number.isInteger(item.fee) || item.fee < 0 || item.fee > 1000000) throw new Error('Ungültige Ausbaukosten.');
    return { catalogId: item.catalogId, fee: item.fee };
  });
  return { items, limit: input.limit, removed };
}

export function installationErrors(plan, config, stats = {}) {
  const errors = [];
  const definitions = new Map((config?.items ?? []).map(item => [item.id, item]));
  const used = new Map();
  const ids = new Set();
  for (const item of plan.items) {
    const definition = definitions.get(item.catalogId);
    if (!definition) { errors.push('Unbekannte Cyberware.'); continue; }
    const prefix = `${definition.name}: `;
    if (ids.has(item.id)) errors.push(prefix + 'Doppelte Installations-ID.');
    ids.add(item.id);
    if (definition.requirements?.uniquePerLocation && plan.items.some(other => other.id !== item.id && other.catalogId === item.catalogId && other.location === item.location)) errors.push(prefix + 'Nur einmal pro Arm installierbar.');
    if (definition.categoryReview) errors.push(prefix + 'Kategorie muss vor der Installation geprüft werden.');
    if (definition.unavailable) errors.push(prefix + definition.unavailable);
    if (!definition.installationSlots.includes(item.location)) errors.push(prefix + 'Dieser Installationsbereich ist nicht zulässig.');
    if (definition.requirements?.requires?.some(id => !plan.items.some(other => other.catalogId === id))) errors.push(prefix + 'Ein erforderliches Basisimplantat fehlt.');
    for (const [stat, minimum] of Object.entries(definition.requirements?.minimumStats ?? {})) {
      if (!Number.isFinite(stats[stat]) || stats[stat] < minimum) errors.push(prefix + `${stat} muss mindestens ${minimum} betragen.`);
    }
    if (definition.requirements?.exclusive && plan.items.some(other => other.id !== item.id && definitions.get(other.catalogId)?.requirements?.exclusive === definition.requirements?.exclusive)) errors.push(prefix + 'Mit einer anderen gewählten Komponente inkompatibel.');
    if (definition.requirements?.incompatible?.some(id => plan.items.some(other => other.id !== item.id && other.catalogId === id)) || plan.items.some(other => other.id !== item.id && definitions.get(other.catalogId)?.requirements?.incompatible?.includes(item.catalogId))) errors.push(prefix + 'Diese Kombination ist nicht zulässig.');
    let capacity = config?.locations.find(location => location.id === item.location)?.capacity ?? 0;
    let container = item.location;
    if (definition.foundation) {
      if (item.parent !== null) errors.push(prefix + 'Ein Basisimplantat kann keine eigene Basis haben.');
      if (plan.items.some(other => other.id !== item.id && other.location === item.location && definitions.get(other.catalogId)?.foundation)) errors.push(prefix + 'Dieser Bereich hat bereits ein Basisimplantat.');
    } else if (definition.requirements?.parentType) {
      const parent = plan.items.find(other => other.id === item.parent);
      const base = definitions.get(parent?.catalogId);
      if (item.parent === null && definition.requirements.allowNatural) {
        if (plan.items.some(other => other.id !== item.id && other.location === item.location)) errors.push(prefix + 'In einer natürlichen Gliedmaße muss diese Option allein bleiben.');
      } else {
        if (!parent || base?.foundation !== definition.requirements?.parentType || parent.location !== item.location || parent.id === item.id) errors.push(prefix + 'Wähle ein passendes Basisimplantat im selben Bereich.');
        capacity = base?.capacity ?? 0;
        container = item.parent;
      }
    } else if (item.parent !== null) errors.push(prefix + 'Hier ist kein Basisimplantat vorgesehen.');
    if (definition.requirements?.naturalLimbOnly && plan.items.some(other => other.id !== item.id && other.location === item.location)) errors.push(prefix + 'Diese Option muss die einzige Cyberware in dieser natürlichen Gliedmaße bleiben.');
    const slots = definition.foundation ? 0 : definition.slots ?? 1;
    used.set(container, { used: (used.get(container)?.used ?? 0) + slots, capacity });
  }
  for (const { used: count, capacity } of used.values()) if (count > capacity) errors.push(`Kapazität überschritten: ${count} von ${capacity} Plätzen belegt.`);
  const cost = plan.items.reduce((sum, item) => sum + (definitions.get(item.catalogId)?.cost ?? 0), 0);
  if (plan.limit !== null && cost > plan.limit) errors.push(`Dein eigenes Planungslimit wird um ${cost - plan.limit} eb überschritten.`);
  return [...new Set(errors)];
}

export function evaluateCyberware(character, rules, stats) {
  const plan = character.cyberware ?? createCyberware();
  const config = rules.cyberwareRules;
  const errors = installationErrors(plan, config, stats);
  const entries = plan.items.map(item => ({ ...item, definition: config?.items.find(definition => definition.id === item.catalogId) })).filter(item => item.definition);
  const start = stats.EMP === null ? null : stats.EMP * 10;
  // Invalid plans never contribute effects to the central calculation.
  const active = errors.length ? [] : entries;
  const pastLoss = (plan.removed ?? []).reduce((sum, item) => sum + (config?.items.find(definition => definition.id === item.catalogId)?.humanity ?? 0), 0);
  const loss = pastLoss + active.reduce((sum, item) => sum + item.definition.humanity, 0);
  const depression = active.reduce((sum, item) => sum + item.definition.maxHumanityLoss, 0);
  const maximum = start === null ? null : Math.max(0, start - depression);
  const current = start === null ? null : Math.min(maximum, start - loss + (character.campaign?.humanityAdjustment??0));
  const effectEntries = active.filter(item=>![item.id,item.parent].some(id=>(character.campaign?.cyberDamaged??[]).includes(id))).flatMap(item => (item.definition.effects ?? []).map(effect => ({ ...effect, label: item.definition.name, source: item.definition.source })));
  const effects = effectEntries.filter((effect,index)=>!effect.nonStacking || effectEntries.findIndex(other=>other.type===effect.type && other.target===effect.target && other.label===effect.label)===index);
  if (active.filter(item => item.definition.lightTattoo).length >= 3) effects.push({ type: 'skill', target: 'wardrobe-style', value: 2, label: 'Mindestens drei Light-Tattoo-Installationen', source: 'Must Have Cyberware Deals, S. 3; Grundregelwerk S. 358' });
  if (active.some(item => item.catalogId === 'chemskin') && active.some(item => item.catalogId === 'techhair')) effects.push({ type: 'skill', target: 'personal-grooming', value: 2, label: 'Chemskin und Techhair', source: 'Grundregelwerk S. 358' });
  const duplicateWarnings=(config?.items??[]).filter(d=>d.requirements?.maxInstalled&&entries.filter(e=>e.catalogId===d.id).length>d.requirements.maxInstalled).map(d=>`${d.name} ist mehrfach eingebaut. Entferne überzählige Exemplare; erlaubt: ${d.requirements.maxInstalled}.`);
  const warnings = current !== null && current < 10 ? ['EMP ist auf 0 gesunken. Kläre Cyberpsychose und Spielbarkeit mit deiner Spielleitung.'] : [];
  warnings.push(...duplicateWarnings);
  const removed = (plan.removed ?? []).map(item => ({ ...item, definition: config?.items.find(definition => definition.id === item.catalogId) })).filter(item => item.definition);
  return { canUndoPurchases:canUndoCyberwarePurchase(character), entries, removed, errors, warnings, effects, loss, depression, start, maximum, current,
    empathy: current === null ? null : Math.max(0, Math.floor(current / 10)),
    adjustment:character.campaign?.humanityAdjustment??0, cost: entries.reduce((sum, item) => sum + item.definition.cost, 0), limit: plan.limit };
}

export function installCyberware(character, rules, catalogId, location, parent, stats) {
  const definition=rules.cyberwareRules.items.find(d=>d.id===catalogId);
  if(definition?.requirements?.maxInstalled&&character.cyberware.items.filter(i=>i.catalogId===catalogId).length>=definition.requirements.maxInstalled)return {ok:false,error:`${definition.name}: höchstens ${definition.requirements.maxInstalled} Exemplar installierbar.`};
  const plan = character.cyberware;
  if (plan.items.length >= 60) return { ok: false, error: 'Dein Charakter hat bereits 60 Cyberware-Komponenten.' };
  let number = 1;
  while (plan.items.some(item => item.id === `implant-${number}`)) number++;
  const item = { id: `implant-${number}`, catalogId, location, parent: parent ?? null };
  const next = { ...plan, items: [...plan.items, item] };
  const errors = [...installationErrors(next, rules.cyberwareRules, stats), ...evaluateFunds({ ...character, cyberware: next }, rules).errors];
  if (errors.length) return { ok: false, error: errors.join(' ') };
  plan.items.push(item);
  return { ok: true };
}

export function removeCyberware(character, rules, id, stats, fee) {
  const next = { ...character.cyberware, items: character.cyberware.items.filter(item => item.id !== id) };
  const removed = character.cyberware.items.find(item => item.id === id);
  if (!removed) return { ok: false, error: 'Diese Komponente ist nicht eingebaut.' };
  if(canUndoCyberwarePurchase(character)){next.items=next.items.filter(item=>!cyberwareRemovalItems(character,rules,id).some(removed=>removed.id===item.id));character.cyberware=next;return {ok:true};}
  const dependencies = next.items.filter(item => item.parent === id || rules.cyberwareRules.items.find(definition => definition.id === item.catalogId)?.requirements?.requires?.includes(removed.catalogId) && !next.items.some(other => other.catalogId === removed.catalogId));
  if (dependencies.length) return { ok: false, error: 'Entferne zuerst die abhängigen Optionen dieser Komponente.' };
  if (!Number.isInteger(fee) || fee < 0 || fee > 1000000) return { ok: false, error: 'Trage die mit der Spielleitung vereinbarten Ausbaukosten ein (0 bis 1.000.000 eb).' };
  if ((character.cyberware.removed?.length ?? 0) >= 300) return { ok: false, error: 'Die Ausbauhistorie ist voll.' };
  next.removed = [...(character.cyberware.removed ?? []), { catalogId: removed.catalogId, fee }];
  const funds = evaluateFunds({ ...character, cyberware: next }, rules);
  if (funds.remaining < 0 && fee > 0) return { ok: false, error: 'Dein Guthaben reicht für diesen Ausbau nicht aus.' };
  character.cyberware = next;
  return { ok: true };
}

export function canUndoCyberwarePurchase(character){return !character.campaign?.sessionUnlocked&&!character.campaign?.active&&!(character.campaign?.history?.length);}
export function cyberwareRemovalItems(character,rules,id){
 const removed=new Set([id]);let changed=true;
 while(changed){changed=false;const remaining=character.cyberware.items.filter(i=>!removed.has(i.id));
  for(const item of remaining){const d=rules.cyberwareRules.items.find(d=>d.id===item.catalogId);
   if(removed.has(item.parent)||d.requirements?.requires?.some(required=>character.cyberware.items.some(original=>removed.has(original.id)&&original.catalogId===required)&&!remaining.some(i=>i.catalogId===required))){removed.add(item.id);changed=true;}
  }
 }
 return character.cyberware.items.filter(i=>removed.has(i.id));
}
