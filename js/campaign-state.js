export const createCampaign = () => ({active:false,cashAdjustment:0,ip:0,roleRank:4,skillPointsAdded:0,humanityAdjustment:0,hp:null,stabilized:false,speedhealDates:[],injuries:[],armorLoss:{},ammoSpent:{},cyberInventory:[],cyberDamaged:[],reputation:0,obligations:[],contacts:[],enemies:[],goals:[],events:[],history:[]});
const integer=(n,min,max)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
const text=(s,max=1000)=>typeof s==='string'&&s.length<=max;
export function validateCampaign(input,rules) {
  if(input==null)return createCampaign();
  const c=createCampaign();
  if(typeof input.active!=='boolean')throw Error('Ungültiger Kampagnenstatus.');
  c.active=input.active;
  for(const [key,min,max] of [['cashAdjustment',-100000000,100000000],['ip',0,1000000],['roleRank',4,10],['skillPointsAdded',0,5000],['humanityAdjustment',-100000,100000],['reputation',0,10]]){
    if(!integer(input[key],min,max))throw Error('Ungültiger Kampagnenwert: '+key);c[key]=input[key];
  }
  if(input.hp!==null&&!integer(input.hp,-10000,10000)||typeof input.stabilized!=='boolean')throw Error('Ungültige Trefferpunkte/Stabilisierung.');
  c.hp=input.hp;c.stabilized=input.stabilized;
  const speedhealDates=input.speedhealDates??[];
  if(!Array.isArray(speedhealDates)||speedhealDates.length>1000||new Set(speedhealDates).size!==speedhealDates.length||speedhealDates.some(d=>typeof d!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(d)))throw Error('Ungültige Schnellheilungsdaten.');
  c.speedhealDates=[...speedhealDates];
  for(const key of ['obligations','contacts','enemies','goals','events']){
    if(!Array.isArray(input[key])||input[key].length>200||input[key].some(s=>!text(s)))throw Error('Ungültige Kampagnennotizen.');c[key]=[...input[key]];
  }
  if(!Array.isArray(input.injuries)||input.injuries.length>60)throw Error('Zu viele Verletzungen.');
  c.injuries=input.injuries.map(i=>{if(!text(i.id,60)||!text(i.name,120)||!text(i.notes)||!['active','quickfix','treated','resolved'].includes(i.status))throw Error('Ungültige Verletzung.');return {id:i.id,name:i.name,notes:i.notes,status:i.status};});
  if(!input.armorLoss||typeof input.armorLoss!=='object'||Array.isArray(input.armorLoss))throw Error('Ungültiger Rüstungsschaden.');
  c.armorLoss=Object.fromEntries(Object.entries(input.armorLoss).map(([id,loss])=>{const d=rules.equipmentRules?.items.find(d=>d.id===id&&d.category==='armor');if(!d||!integer(loss,0,d.sp))throw Error('Ungültiger Schutzwertverlust.');return [id,loss];}));
  if(!input.ammoSpent||typeof input.ammoSpent!=='object'||Array.isArray(input.ammoSpent))throw Error('Ungültige angebrochene Munition.');
  c.ammoSpent=Object.fromEntries(Object.entries(input.ammoSpent).map(([id,spent])=>{const d=rules.equipmentRules?.items.find(d=>d.id===id&&d.kind==='ammo');if(!d||!integer(spent,0,(d.units??1)-1))throw Error('Ungültiger Munitionsverbrauch.');return [id,spent];}));
  if(!Array.isArray(input.cyberInventory)||input.cyberInventory.length>100||!Array.isArray(input.cyberDamaged)||input.cyberDamaged.length>60)throw Error('Ungültiger Cyberware-Bestand.');
  c.cyberInventory=input.cyberInventory.map(i=>{if(!text(i.id,60)||!rules.cyberwareRules.items.some(d=>d.id===i.catalogId)||typeof i.used!=='boolean')throw Error('Ungültiger Cyberware-Besitz.');return {id:i.id,catalogId:i.catalogId,used:i.used};});
  if(new Set(c.cyberInventory.map(i=>i.id)).size!==c.cyberInventory.length)throw Error('Doppelte Cyberware-Besitz-ID.');
  c.cyberDamaged=input.cyberDamaged.map(id=>{if(!/^implant-[1-9]\d{0,5}$/.test(id))throw Error('Ungültige beschädigte Cyberware.');return id;});
  if(!Array.isArray(input.history)||input.history.length>200||JSON.stringify(input.history).length>1500000)throw Error('Die Session-Historie ist zu groß. Sichere deinen Charakter als JSON.');
  const seen=new Set();
  c.history=input.history.map(h=>{
    if(!h||!text(h.id,80)||seen.has(h.id)||!integer(h.number,1,99999)||!/^\d{4}-\d{2}-\d{2}$/.test(h.date)||!text(h.name,120)||!text(h.notes,2000)||!Array.isArray(h.changes)||h.changes.length>150||!Array.isArray(h.log)||h.log.length>150||h.log.some(s=>!text(s,3000)))throw Error('Ungültiger Session-Bericht.');
    seen.add(h.id);
    for(const change of h.changes)if(!change||!Array.isArray(change.path)||change.path.length<1||change.path.length>2||change.path.some(k=>typeof k!=='string'||['__proto__','constructor','prototype','history','portrait'].includes(k)))throw Error('Ungültige Session-Änderung.');
    // Reports are inert audit data; only the validated correction workflow can apply patches.
    return JSON.parse(JSON.stringify(h));
  });
  return c;
}
export const roleRank=character=>character.campaign?.roleRank??4;
export const campaignSkillConfig=(character,config)=>character.campaign?.active?{...config,maxRank:10,budget:config.budget+(character.campaign.skillPointsAdded??0)}:config;
