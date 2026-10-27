import {SESSION_PAGES,sessionActionPage,sessionActionTask,setSessionRewards} from './session-guide.js?v=guide5';
import {createSessionDraft,previewSession,completeSession} from './session-report.js?v=guide5';
import {sessionCyberState} from './ui-session-report.js?v=guide5';
import {quickAddCyberware} from './cyberware-quick-add.js?v=session6';
import {addToCyberwareDraft,removeFromCyberwareDraft} from './cyberware-draft.js?v=session6';
import {initialInstallationLocation} from './cyberware-ui-model.js?v=session6';
import {saveCharacter,loadCharacter} from './storage.js?v=session6';
import {evaluateCharacter} from './rules.js?v=session6';
import {ROLE_POOLS} from './role-points.js?v=session6';

function downloadJson(value,name){const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=name.replace(/[<>:"/\\|?*]/g,'');a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function bindSessionEvents(root,state,rules,refresh){
  const cyber=()=>state.sessionCyber??=sessionCyberState();
  const preview=()=>previewSession(state.character,rules,state.sessionDraft);
  const current=()=>{const p=state.sessionEditing!=null?previewSession(state.character,rules,{...state.sessionDraft,actions:state.sessionDraft.actions.slice(0,state.sessionEditing)}):preview();return p.after?p.character:state.character;};
  const error=message=>{state.error=message;refresh();};
  function queue(action){
    const draft=structuredClone(state.sessionDraft),editing=state.sessionEditing;
    if(editing!=null&&draft.actions[editing]?.type!==action.type){error('Beende zuerst die laufende Bearbeitung oder brich sie ab.');return;}
    action.actionId=editing!=null?draft.actions[editing].actionId??crypto.randomUUID():crypto.randomUUID();
    if(editing!=null)draft.actions[editing]=action;else draft.actions.push(action);
    const p=previewSession(state.character,rules,draft);
    if(!p.ok){state.sessionFormError=p.errors.join(' ');state.error='';refresh();document.getElementById('session-question')?.focus();return false;}
    state.sessionDraft=draft;state.sessionEditing=null;state.sessionFormError='';state.error='';state.sessionFields=null;state.sessionTask='';state.sessionToast='Änderung für diese Session gemerkt.';
    if(state.sessionReturn==='review')state.sessionPage='review';state.sessionReturn=null;refresh();return true;
  }
  function queueCyber(id,location=null,ownedId=null){
    if(!state.sessionDraft)return;
    const c=current(),ui=cyber(),planningRules={...rules,equipmentRules:{...rules.equipmentRules,startingCash:rules.equipmentRules.startingCash+10000000}},result=location?addToCyberwareDraft(c,planningRules,ui.cyberDraft,id,location):quickAddCyberware(c,planningRules,ui.cyberDraft,id);
    if(!result.ok){error(result.error);return;}
    ui.cyberDraft=result.additions;
    if(ownedId){const entry=result.additions.toReversed().find(i=>i.catalogId===id&&!ui.owned[i.id]);if(entry)ui.owned[entry.id]=ownedId;}
    state.sessionPage='cyber';state.sessionTask='install';ui.installationOpen=true;ui.selectedCyberware=null;state.error='';refresh();
  }
  function removeCyberDraft(id){const ui=cyber();ui.cyberDraft=removeFromCyberwareDraft(current(),rules,ui.cyberDraft,id);for(const key of Object.keys(ui.owned))if(!ui.cyberDraft.some(i=>i.id===key))delete ui.owned[key];refresh();}
  root.addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button)return;
    const config=button.closest('[data-session-configurator]');
    if(config){event.preventDefault();event.stopImmediatePropagation();const ui=cyber();
      if(button.dataset.cyberCategory)ui.cyberCategory=button.dataset.cyberCategory;
      else if(button.dataset.selectCyberware){const d=rules.cyberwareRules.items.find(d=>d.id===button.dataset.selectCyberware);ui.selectedCyberware=ui.selectedCyberware===d.id?null:d.id;ui.pendingLocation=initialInstallationLocation(d);}
      else if(button.dataset.queueCyberware)return queueCyber(button.dataset.queueCyberware);
      else if(button.dataset.bodyLocation){if(ui.selectedCyberware)return queueCyber(ui.selectedCyberware,button.dataset.bodyLocation);ui.inspectedLocation=button.dataset.bodyLocation;}
      else if(button.dataset.removeDraft)return removeCyberDraft(button.dataset.removeDraft);
      else if(button.dataset.removeCyberware){ui.removingCyberware=button.dataset.removeCyberware;ui.removalFee='';}
      else if(button.dataset.action==='confirm-installation'){
        const additions=structuredClone(ui.cyberDraft),owned={...ui.owned},price=ui.price===''?null:Number(ui.price),loss=ui.loss===''?null:Number(ui.loss);
        const stock=current().campaign.cyberInventory;
        const credit=additions.reduce((sum,i)=>sum+(stock.some(s=>s.id===owned[i.id]&&s.catalogId===i.catalogId)?rules.cyberwareRules.items.find(d=>d.id===i.catalogId).cost:0),0);
        const total=additions.reduce((sum,i)=>sum+rules.cyberwareRules.items.find(d=>d.id===i.catalogId).cost,0)-credit;
        if(queue({type:'cyber-install',additions,owned,price:price??total,humanityLoss:loss,confirmation:ui.confirmation}))state.sessionCyber=sessionCyberState();refresh();return;
      }else if(button.dataset.action==='clear-cyber-draft'){ui.cyberDraft=[];ui.owned={};}
      else if(button.dataset.action==='queue-selection'&&ui.selectedCyberware&&ui.pendingLocation)return queueCyber(ui.selectedCyberware,ui.pendingLocation);
      else if(button.dataset.action==='cancel-removal')ui.removingCyberware=null;
      else if(['show-installation','toggle-installation'].includes(button.dataset.action))ui.installationOpen=!ui.installationOpen;
      refresh();return;
    }
    const key=Object.keys(button.dataset).find(key=>key.startsWith('session'));if(!key)return;
    event.preventDefault();event.stopImmediatePropagation();
    if(button.dataset.sessionPage){state.sessionPage=button.dataset.sessionPage;state.sessionTask='';state.sessionFields=null;state.sessionEditing=null;state.sessionToast='';state.sessionFormError='';refresh();document.getElementById('session-question')?.focus();return;}
    if(button.hasAttribute('data-session-task')){state.sessionTask=button.dataset.sessionTask;state.sessionFields=null;state.sessionEditing=null;state.sessionToast='';state.sessionFormError='';refresh();document.getElementById('session-question')?.focus();return;}
    if(button.hasAttribute('data-session-cancel-edit')){state.sessionEditing=null;state.error='';refresh();return;}
    if(button.hasAttribute('data-session-start')){state.sessionSaved=null;state.sessionDraft=createSessionDraft(state.character);state.sessionPage='info';state.sessionTask='';state.sessionFields=null;state.sessionCyber=sessionCyberState();state.error='';refresh();return;}
    if(button.hasAttribute('data-session-discard')){state.sessionDraft=null;state.sessionCyber=null;state.sessionEditing=null;state.error='';refresh();return;}
    if(button.dataset.sessionRemove!=null){state.sessionDraft.actions.splice(Number(button.dataset.sessionRemove),1);state.sessionEditing=null;state.error='';refresh();return;}
    if(button.dataset.sessionEdit!=null){
      const index=Number(button.dataset.sessionEdit),a=state.sessionDraft.actions[index];if(!a)return;
      if(['cyber-install','correction'].includes(a.type)){error('Entferne diesen Vorgang und stelle ihn im Konfigurator neu zusammen.');return;}
      if(a.wizardReward){state.sessionPage='rewards';state.sessionTask='';state.sessionFields=null;refresh();return;}
      state.sessionReturn=state.sessionPage;state.sessionPage=sessionActionPage(a);state.sessionTask=sessionActionTask(a);state.sessionEditing=index;state.sessionFormError='';state.sessionToast='Bearbeite diesen Eintrag und merke die Änderung erneut.';
      const formType=a.type==='armor'&&a.equip?'armor-equip':a.type==='health'&&a.mode==='set'?'health-status':a.type;
      state.sessionFields={type:formType,task:state.sessionTask,values:{...a,catalog:a.catalog??rules.equipmentRules.items.find(d=>d.id===a.id)?.name}};
      refresh();
      const f=root.querySelector(`[data-session-form="${formType}"]`);if(!f)return;
      const values={...a,catalog:a.type==='gear'?rules.equipmentRules.items.find(d=>d.id===a.id)?.name:a.type==='cyber-acquire'?rules.cyberwareRules.items.find(d=>d.id===a.id)?.name:undefined,sp:a.type==='armor'?rules.equipmentRules.items.find(d=>d.id===a.id)?.sp-a.loss:undefined,success:a.success?'yes':'no',damaged:a.damaged?'yes':'no'};
      for(const [key,value] of Object.entries(values))if(value!==undefined&&value!==null){const el=f.elements.namedItem(key);if(el instanceof HTMLInputElement||el instanceof HTMLSelectElement||el instanceof HTMLTextAreaElement){if(el.type==='checkbox')el.checked=Boolean(value);else el.value=String(value);}}
      for(const [id,value] of Object.entries(a.allocation??{})){const el=f.elements.namedItem('role-'+id);if(el)el.value=String(value);}
      const details=f.closest('details');if(details)details.open=true;f.scrollIntoView({block:'center'});f.querySelector('input,select')?.focus();return;
    }
    if(button.dataset.sessionQueueOwned){const i=current().campaign.cyberInventory.find(i=>i.id===button.dataset.sessionQueueOwned);if(i)queueCyber(i.catalogId,null,i.id);return;}
    if(button.hasAttribute('data-session-complete')){
      if(state.storageBlocked){error('Speichern ist pausiert. Löse zuerst den Speicherkonflikt.');return;}
      if(cyber().cyberDraft.length){error('Übernimm oder leere zuerst den offenen Cyberware-Entwurf.');return;}
      const stored=loadCharacter(rules);if(stored.blocked||stored.character&&JSON.stringify(stored.character)!==JSON.stringify(state.character)){error('Der gespeicherte Charakter wurde geändert. Lade den aktuellen Stand, bevor du diesen Report abschließt.');return;}
      const result=completeSession(state.character,rules,state.sessionDraft);if(!result.ok){error(result.error);return;}
      const saved=saveCharacter(result.character);if(!saved.ok){error(saved.error+' Der Report wurde nicht übernommen; der Entwurf bleibt erhalten.');return;}
      state.character=result.character;state.sessionSaved=result.report.number;state.sessionPage='info';state.sessionTask='';state.sessionFields=null;state.sessionDraft=null;state.sessionCyber=null;state.sessionEditing=null;state.storageStatus='saved';state.error='';state.pdfExportMessage=`Session ${result.report.number} abgeschlossen. Charakter und Historie sind aktualisiert.`;refresh();return;
    }
    if(button.hasAttribute('data-session-export-character')){downloadJson(state.character,`RED-${state.character.name}-Kampagne.json`);return;}
    if(button.dataset.sessionExport){const report=state.character.campaign.history.find(h=>h.id===button.dataset.sessionExport);if(report)downloadJson({character:state.character.name,report},`RED-Session-${report.number}.json`);return;}
    if(button.dataset.sessionCorrect){if(state.sessionDraft){error('Verwirf oder schließe zuerst den offenen Report ab.');return;}state.sessionCorrection=button.dataset.sessionCorrect;refresh();return;}
  },true);
  const update=(event)=>{
    const el=event.target;
    // Text fields already update on input. Re-rendering again on blur can swallow the next button click.
    if(event.type==='change'&&(el.tagName==='TEXTAREA'||el.tagName==='INPUT'&&!['checkbox','radio','file'].includes(el.type))&&(el.dataset.sessionMeta||el.closest('[data-session-form],[data-session-configurator]')))return;
    if(el.dataset.sessionMeta&&state.sessionDraft){event.stopImmediatePropagation();state.sessionDraft[el.dataset.sessionMeta]=['number','ipAward'].includes(el.dataset.sessionMeta)?Number(el.value):el.value;refresh();return;}
    const f=el.closest('[data-session-form]');
    if(f&&!el.closest('[data-session-configurator]')){
      const type=f.dataset.sessionForm,raw=new FormData(f),values=Object.fromEntries(raw.entries());
      for(const checkbox of f.querySelectorAll('input[type="checkbox"]')){const peers=f.querySelectorAll(`input[type="checkbox"][name="${checkbox.name}"]`);values[checkbox.name]=peers.length>1?raw.getAll(checkbox.name):checkbox.checked;}
      if(type==='rewards'){
        event.stopImmediatePropagation();state.sessionDraft=setSessionRewards(state.sessionDraft,Number(values.amount),Number(values.ipAward),values.description);state.sessionFields=null;refresh();return;
      }
      if(type==='armor'&&el.name==='id')delete values.sp;
      if(type==='skill'&&el.name==='id'){const selected=evaluateCharacter(current(),rules).skills.find(s=>s.id===el.value);if(selected)values.to=String(selected.level+1);}
      state.sessionFields={type,task:state.sessionTask??'',values};
      if(el.tagName==='SELECT'||['skill','role'].includes(type)&&el.name==='to'||type==='health-status'&&el.name==='hp'||type==='armor'&&el.name==='sp'){event.stopImmediatePropagation();refresh();}
      return;
    }
    if(!el.closest('[data-session-configurator]'))return;
    event.stopImmediatePropagation();const ui=cyber();
    if(el.id==='cyber-search')ui.cyberSearch=el.value;
    else if(el.id==='cyber-sort')ui.cyberSort=el.value;
    else if(el.id==='cyber-installable')ui.onlyInstallable=el.checked;
    else if(el.id==='installation-location')ui.pendingLocation=el.value;
    else if(el.id==='removal-fee')ui.removalFee=el.value;
    else if(el.dataset.sessionCyberField)ui[el.dataset.sessionCyberField]=el.value;
    else if(el.dataset.sessionOwned)ui.owned[el.dataset.sessionOwned]=el.value;
    refresh();
  };
  root.addEventListener('input',update,true);root.addEventListener('change',update,true);
  root.addEventListener('submit',event=>{
    const f=event.target,config=f.closest('[data-session-configurator]');if(config){event.preventDefault();event.stopImmediatePropagation();if(f.id==='cyberware-removal-form'){if(queue({type:'cyber-remove',id:cyber().removingCyberware,cost:Number(cyber().removalFee)}))cyber().removingCyberware=null;refresh();}return;}
    const type=f.dataset.sessionForm;if(!type)return;event.preventDefault();event.stopImmediatePropagation();
    const raw=new FormData(f),a={type};
    if(type==='rewards'){state.sessionDraft=setSessionRewards(state.sessionDraft,Number(raw.get('amount')),Number(raw.get('ipAward')),String(raw.get('description')??''));state.sessionPage='health';state.sessionTask='';state.sessionFields=null;state.sessionToast='';state.sessionFormError='';refresh();return;}
    if(type==='health-status'){
      const hp=Number(raw.get('hp')),p=preview(),old=p.after?.hp??p.before?.hp,returning=state.sessionReturn==='review';
      if(state.sessionEditing!=null||hp!==old){if(!queue({type:'health',mode:'set',hp,confirmation:raw.get('confirmation')??''}))return;}
      state.sessionPage=returning?'review':'inventory';state.sessionTask='';state.sessionFields=null;refresh();return;
    }
    for(const [key,value] of raw.entries())a[key]=value;
    for(const key of ['rounds','amount','quantity','to','loss','days','roll','hp','sp','value','cost'])if(a[key]!=null)a[key]=a[key]===''?null:Number(a[key]);
    a.price=raw.get('price')==null||raw.get('price')===''?null:Number(raw.get('price'));
    for(const key of ['timeConfirmed','safe','lightActivity','medtech','onceDaily'])a[key]=raw.has(key);
    if(type==='gear'||type==='cyber-acquire'){const d=(type==='gear'?rules.equipmentRules:rules.cyberwareRules).items.find(d=>d.name===a.catalog||d.id===a.catalog||d.id===a.id);if(!d){error('Wähle einen Gegenstand aus der Vorschlagsliste.');return;}a.id=d.id;}
    if(type==='role'||type==='role-allocate'){a.allocation=Object.fromEntries((ROLE_POOLS[state.character.role]?.fields??[]).map(([id])=>[id,Number(raw.get('role-'+id))]));a.pharmaceuticals=raw.getAll('pharmaceuticals');}
    if(type==='custom'&&a.id&&!a.name)a.name=current().equipment.custom.find(i=>i.id===a.id)?.name??'';
    if(type==='armor'){const d=rules.equipmentRules.items.find(d=>d.id===a.id);a.loss=d?d.sp-a.sp:NaN;}
    if(type==='armor-equip'){a.type='armor';a.equip=true;}
    if(type==='therapy'){a.success=a.success==='yes';if(a.cost===null)delete a.cost;}
    if(type==='cyber-repair')a.damaged=a.damaged==='yes';
    if(type==='correction'){state.sessionDraft=createSessionDraft(state.character);a.reportId=state.sessionCorrection;state.sessionCorrection=null;state.sessionPage='review';}
    queue(a);
  },true);
  window.addEventListener('beforeunload',event=>{if(state.sessionDraft){event.preventDefault();event.returnValue='';}});
  return {queueCyber,removeCyberDraft};
}
