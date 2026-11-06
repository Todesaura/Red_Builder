import {readFile,mkdir,writeFile,rename} from 'node:fs/promises';
import {dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateCharacter} from '../js/model.js?v=group1';
import {groupReward} from '../js/group-rules.js';

export function createGroupService(file,rules) {
  if(file instanceof URL)file=fileURLToPath(file);
  let queue=Promise.resolve();
  async function read(){try{return JSON.parse(await readFile(file,'utf8'));}catch(e){if(e.code==='ENOENT')return {entries:[],receipts:[]};throw e;}}
  async function save(data){await mkdir(dirname(file),{recursive:true});await writeFile(file+'.tmp',JSON.stringify(data));await rename(file+'.tmp',file);}
  return async (method,path,body)=>{
    const run=queue.then(async()=>{
      const data=await read();
      if(method==='GET'&&path==='')return {entries:data.entries,receipts:data.receipts};
      if(method==='PUT'&&path==='/character'){
        const c=validateCharacter(body,rules);if(!c.groupId||!c.playerName.trim())throw Error('Spielername und Charakter-ID fehlen.');
        const entry=data.entries.find(e=>e.id===c.groupId);
        if(entry&&entry.revision!==c.groupRevision)return {conflict:true,entry};
        if(!entry&&data.entries.length>=100)throw Error('Der Testgruppen-Speicher ist voll (100 Charaktere).');
        if(entry&&JSON.stringify(entry.character)===JSON.stringify(c))return {entry};
        c.groupRevision=(entry?.revision??0)+1;
        const next={...entry,id:c.groupId,revision:c.groupRevision,character:c,dead:entry?.dead??false,updatedAt:new Date().toISOString()};
        data.entries=data.entries.filter(e=>e.id!==c.groupId);data.entries.push(next);await save(data);return {entry:next};
      }
      if(method==='POST'&&path==='/reward'){
        const fingerprint=JSON.stringify({ids:body.ids,gross:body.gross,expenses:body.expenses,name:body.name,date:body.date});
        const previous=data.receipts.find(r=>r.id===body.id);
        if(previous){if(previous.fingerprint!==fingerprint)throw Error('Diese Abrechnungs-ID wurde bereits anders verwendet.');return {receipt:previous};}
        if(data.receipts.length>=500)throw Error('Maximal 500 Abrechnungen im Testgruppen-Speicher.');
        const result=groupReward(data.entries,body,rules);data.entries=result.entries;
        const receipt={...result.receipt,fingerprint};data.receipts.push(receipt);await save(data);return {receipt};
      }
      if(method==='POST'&&['/status','/recovery'].includes(path)){
        const entry=data.entries.find(e=>e.id===body.id);if(!entry)throw Error('Charakter nicht gefunden.');
        if(body.revision!==entry.revision)throw Error('Charakter inzwischen geändert. Bitte aktualisieren.');
        if(path==='/status'){
          if(typeof body.dead!=='boolean')throw Error('Ungültiger Status.');
          entry.dead=body.dead;entry.revision++;entry.character.groupRevision=entry.revision;entry.updatedAt=new Date().toISOString();
        }else{
          const p=body.input;if(!p||typeof p!=='object'||Array.isArray(p)||JSON.stringify(p).length>5000)throw Error('Ungültiger Erholungsplan.');
          // Only planning inputs; no arbitrary client-supplied computed prices.
          entry.recoveryInput=Object.fromEntries(['care','procedures','dv','extraDays','extraCost','stay','nights','stabilized'].filter(k=>Object.hasOwn(p,k)).map(k=>[k,p[k]]));
        }
        await save(data);return {entry};
      }
      throw Error('Unbekannter Gruppen-Vorgang.');
    });
    queue=run.catch(()=>{});return run;
  };
}
