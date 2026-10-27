import { readFile } from 'node:fs/promises';
import { createCharacter } from '../../js/model.js';
import { applySkillRecommendation } from '../../js/skill-recommendations.js';
import { LIFEPATH_QUESTIONS } from '../../js/lifepath-data.js';
const json=async name=>JSON.parse(await readFile(new URL(`../../data/${name}.json`,import.meta.url),'utf8'));
export const rules=await json('rules');rules.skillRules=await json('skills');rules.cyberwareRules=await json('cyberware');rules.equipmentRules=await json('equipment');
export function completeCharacter(role='solo') {
  const c=createCharacter(rules);c.name='Nyx Müller';c.role=role;applySkillRecommendation(c,rules);
  c.skills.nativeLanguage.name='Deutsch';c.skills.hometown='Watson';
  if(role==='solo')c.rolePoints.solo.initiative=4;
  if(role==='tech'){c.rolePoints.tech.field=4;c.rolePoints.tech.upgrade=4;}
  if(role==='medtech'){c.rolePoints.medtech.surgery=2;c.rolePoints.medtech.pharma=1;c.rolePoints.medtech.cryo=1;c.rolePoints.pharmaceuticals=['speedheal'];}
  for(const q of LIFEPATH_QUESTIONS)c.lifepath[q.id].choice='first';
  return c;
}
export const templateBytes=new Uint8Array(await readFile(new URL('../../data/Charakterblatt.pdf',import.meta.url)));
export const fontBytes=new Uint8Array(await readFile(new URL('../../vendor/fonts/Ubuntu-R.ttf',import.meta.url)));
