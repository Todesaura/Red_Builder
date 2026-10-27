// Editorial starting suggestions, not mandatory role packages or additional rules.
const lightPair = ['light-melee', 'tomahawk'];
const mediumPair = ['medium-melee-one-handed', 'medium-melee'];
const heavyPair = ['heavy-melee-one-handed', 'heavy-melee'];
const lightArmor = ['armor-light-jack-head', 'armor-light-jack-body'];
const basicGear = ['agent', 'carryall'];
export const EQUIPMENT_RECOMMENDATIONS = {
  rockerboy: { cyberware: ['techhair', 'chemskin', 'light-tattoo', 'cyberaudio-suite', 'audio-recorder'], equipment: [...lightPair, 'medium-pistol', ...lightArmor, ...basicGear, 'instrument', 'camera'] },
  solo: { cyberware: ['biomonitor', 'neural-link', 'kerenzikov', 'cyberarm', 'skin-weave'], equipment: [...heavyPair, 'heavy-pistol', 'assault-rifle', ...lightArmor, ...basicGear, 'radio', 'flashlight'] },
  netrunner: { cyberware: ['biomonitor', 'neural-link', 'interface-plugs', 'cybereye', 'chyron'], equipment: [...lightPair, 'medium-pistol', ...lightArmor, ...basicGear, 'cyberdeck-standard', 'virtuality-goggles', 'net-program-armor', 'net-program-sword', 'net-program-see-ya', 'net-program-worm', 'memory-chip'] },
  tech: { cyberware: ['biomonitor', 'tool-hand', 'cybereye', 'micro-optics'], equipment: [...mediumPair, 'heavy-pistol', ...lightArmor, ...basicGear, 'techtool', 'tech-bag', 'duct-tape'] },
  medtech: { cyberware: ['biomonitor', 'cybereye', 'micro-optics', 'nasal-filters'], equipment: [...lightPair, 'medium-pistol', ...lightArmor, ...basicGear, 'medtech-bag', 'mask', 'flashlight'] },
  media: { cyberware: ['biomonitor', 'cyberaudio-suite', 'audio-recorder', 'voice-stress-analyzer', 'cybereye', 'micro-video'], equipment: [...lightPair, 'medium-pistol', ...lightArmor, ...basicGear, 'camera', 'memory-chip', 'binoculars'] },
  exec: { cyberware: ['biomonitor', 'cyberaudio-suite', 'internal-agent', 'voice-stress-analyzer'], equipment: [...lightPair, 'heavy-pistol', ...lightArmor, 'armor-kevlar-head', 'armor-kevlar-body', ...basicGear, 'computer', 'radio'] },
  lawman: { cyberware: ['biomonitor', 'neural-link', 'interface-plugs', 'cyberaudio-suite', 'radio-communicator', 'skin-weave'], equipment: [...mediumPair, 'heavy-pistol', 'shotgun', ...lightArmor, ...basicGear, 'radio', 'handcuffs', 'flashlight'] },
  fixer: { cyberware: ['chemskin', 'techhair', 'cyberaudio-suite', 'internal-agent', 'voice-stress-analyzer'], equipment: [...lightPair, 'heavy-pistol', ...lightArmor, ...basicGear, 'disposable-phone', 'computer'] },
  nomad: { cyberware: ['biomonitor', 'neural-link', 'interface-plugs', 'nasal-filters'], equipment: [...mediumPair, 'heavy-pistol', 'shotgun', ...lightArmor, ...basicGear, 'techtool', 'radio', 'rope', 'tent'] }
};
export const isRecommended = (role, catalogId, kind = 'equipment') => EQUIPMENT_RECOMMENDATIONS[role]?.[kind]?.includes(catalogId) ?? false;
export const recommendationPriority = (role, kind = 'equipment') => (a, b) => Number(isRecommended(role, b.id, kind)) - Number(isRecommended(role, a.id, kind));
