import { escapeHtml } from './html.js';

export function skillNameMenu({ id, target, value, options, customFields = [], unavailable = [] }) {
  const custom = customFields.includes(target);
  const known = options.includes(value);
  const selectValue = custom ? '__custom' : value;
  const normal = text => text.trim().normalize('NFKC').toLocaleLowerCase('de');
  return `<select id="${id}" data-skill-choice="${target}" ${['native-language','hometown'].includes(target)?'required aria-required="true"':''}><option value="" ${!selectValue ? 'selected' : ''}>Bitte auswählen …</option>${!known && value && !custom ? `<option value="${escapeHtml(value)}" selected>Eigener Wert: ${escapeHtml(value)}</option>` : ''}${options.map(option => `<option value="${escapeHtml(option)}" ${selectValue === option ? 'selected' : ''} ${unavailable.some(other => normal(other) === normal(option)) && normal(value) !== normal(option) ? 'disabled' : ''}>${escapeHtml(option)}</option>`).join('')}<option value="__custom" ${custom ? 'selected' : ''}>Anderer Name …</option></select>${custom ? `<label class="sr-only" for="custom-${id}">Eigenen Namen eingeben</label><input id="custom-${id}" type="text" data-skill-text="${target}" maxlength="60" placeholder="Eigenen Namen eingeben" value="${escapeHtml(value)}">` : ''}`;
}

export function specialtyNameField(entry, specialty, character, rules, state) {
  const config = rules.skillRules;
  if (specialty.skill === 'language' || specialty.skill === 'local-expert') {
    const language = specialty.skill === 'language';
    const unavailable = character.skills.specialties.filter(item => item.skill === specialty.skill && item.id !== specialty.id).map(item => item.name);
    unavailable.push(language ? character.skills.nativeLanguage.name : character.skills.hometown);
    return skillNameMenu({ id: `name-${entry.id}`, target: entry.id, value: specialty.name,
      options: language ? config.languages : config.locations, unavailable, customFields: state.customSkillFields });
  }
  if (entry.options) return `<select id="name-${entry.id}" data-skill-choice="${entry.id}"><option value="">Disziplin wählen</option>${entry.options.map(option => `<option value="${option}" ${option.toLowerCase() === specialty.name.toLowerCase() ? 'selected' : ''}>${option}</option>`).join('')}</select>`;
  return `<input id="name-${entry.id}" data-skill-text="${entry.id}" maxlength="60" type="text" placeholder="Spezialisierung benennen" value="${escapeHtml(specialty.name)}">`;
}
