import {groupRequest} from './group-client.js?v=group1';
import {renderDm} from './ui-dm.js';
import {splitGroupReward} from './group-rules.js';
import {characterJson,characterJsonFilename} from './character-files.js?v=group1';
const [rules,skillRules,cyberwareRules,equipmentRules]=await Promise.all(['rules','skills','cyberware','equipment'].map(async name=>(await fetch(new URL('../data/'+name+'.json',import.meta.url))).json()));
Object.assign(rules,{skillRules,cyberwareRules,equipmentRules});
const root=document.getElementById('dm-app');
const state={entries:[],receipts:[],selected:new Map(),date:new Date().toLocaleDateString('en-CA'),reward:{name:'',gross:'',expenses:'0'},awardId:crypto.randomUUID(),preview:null,awarded:false,error:'',message:''};
const render=()=>{const open=[...root.querySelectorAll('details[open]')].map(d=>d.dataset.dmKey).filter(Boolean);root.innerHTML=renderDm(state,rules);root.querySelectorAll('details').forEach((d,i)=>{d.dataset.dmKey=String(i);if(open.includes(String(i)))d.open=true;});};
let loading=false;
async function load(){if(loading)return;loading=true;try{const data=await groupRequest();state.entries=data.entries;state.receipts=data.receipts;state.error='';render();}catch(error){state.error=error.message;render();}finally{loading=false;}}
async function post(path,body){state.error='';try{await groupRequest(path,'POST',body);return true;}catch(error){state.error=error.message;render();return false;}}
root.addEventListener('change',event=>{
 if(event.target.dataset.dmPlayer!==undefined){const key=event.target.dataset.dmPlayer;if(event.target.value)state.selected.set(key,event.target.value);else state.selected.delete(key);state.preview=null;render();}
 if(event.target.id==='dm-date'){state.date=event.target.value;state.preview=null;render();}
});
root.addEventListener('input',event=>{if(event.target.closest('#dm-reward')){state.reward[event.target.name]=event.target.value;if(state.preview){state.preview=null;root.querySelector('[data-dm-confirm-reward]')?.setAttribute('disabled','');}}});
root.addEventListener('submit',async event=>{
 event.preventDefault();const form=event.target,data=new FormData(form);
 if(form.id==='dm-reward'){
   try{const request={id:state.awardId,name:String(data.get('name')),gross:Number(data.get('gross')),expenses:Number(data.get('expenses')),date:state.date,ids:[...state.selected.values()],revisions:Object.fromEntries(state.entries.map(e=>[e.id,e.revision]))};state.preview={request,shares:splitGroupReward(state.entries,{...request,rules})};state.error='';render();}catch(error){state.error=error.message;render();}
 }else if(form.dataset.dmRecovery){
   const entry=state.entries.find(e=>e.id===form.dataset.dmRecovery),input=Object.fromEntries(data);for(const key of ['procedures','dv','extraDays','extraCost','nights']){if(input[key]==='')delete input[key];else input[key]=Number(input[key]);}
   if(['treatment','surgery'].includes(input.care)&&!input.dv){state.error='Wähle den höchsten Behandlungs-SG laut Verletzung / Spielleitung.';render();return;}
   if(await post('/recovery',{id:entry.id,revision:entry.revision,input})){state.message='Erholungsplan gespeichert. Keine Kosten oder Heilung gebucht.';await load();}
 }
});
root.addEventListener('click',async event=>{
 const b=event.target.closest('button');if(!b)return;
 if(b.hasAttribute('data-dm-refresh'))await load();
 if(b.dataset.dmStatus){const entry=state.entries.find(e=>e.id===b.dataset.dmStatus);if(await post('/status',{id:entry.id,revision:entry.revision,dead:b.dataset.dead==='true'})){state.preview=null;const key=entry.character.playerName.trim().normalize('NFC').toLocaleLowerCase('de');if(state.selected.get(key)===entry.id)state.selected.delete(key);await load();}}
 if(b.hasAttribute('data-dm-confirm-reward')&&state.preview){b.disabled=true;if(await post('/reward',state.preview.request)){state.awarded=true;state.preview=null;state.message='Verdienst verteilt.';await load();}}
 if(b.hasAttribute('data-dm-cancel-reward')){state.preview=null;render();}
 if(b.hasAttribute('data-dm-new-reward')){state.awardId=crypto.randomUUID();state.awarded=false;state.preview=null;state.reward={name:'',gross:'',expenses:'0'};state.message='';render();}
 if(b.dataset.dmDownload){const c=state.entries.find(e=>e.id===b.dataset.dmDownload).character,url=URL.createObjectURL(new Blob([characterJson(c,rules)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=characterJsonFilename(c);a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
});
await load();
// Poll without destroying an open form or changing a prepared payout preview.
setInterval(()=>{if(!state.preview&&!document.activeElement?.matches('textarea,select,input:not([type=radio]):not([type=checkbox])')&&!root.querySelector('details[open]'))load();},10000);
