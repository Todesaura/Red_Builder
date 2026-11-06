const endpoint=new URL('../api/group',import.meta.url);
export async function groupRequest(path='',method='GET',body) {
  const response=await fetch(endpoint.href+path,{method,cache:'no-store',...(body?{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});
  let data;try{data=await response.json();}catch{throw Error('Die automatische Gruppe benötigt den lokalen Vorschau-Server. Auf GitHub Pages ist sie noch nicht verfügbar.');}
  if(response.status===409&&data.entry)return data;
  if(!response.ok)throw Error(data.error??'Gruppenspeicher nicht erreichbar.');
  return data;
}

export function bindGroupSync(state,save,refresh,openRemote) {
  let timer,busy=false,again=false,stopped=false,internalSave=false;
  const saveInternal=c=>{internalSave=true;try{save(c);}finally{internalSave=false;}};
  const ackKey=id=>'red-builder.group.ack.'+id;
  const hash=async c=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(c))))).map(b=>b.toString(16).padStart(2,'0')).join('');
  const status=text=>{state.groupSyncMessage=text;const node=document.getElementById('group-sync-status');if(node)node.textContent=text;};
  async function accept(entry){
    if(state.sessionDraft||state.playCriticalSlot){state.groupRemote=entry;status('SL-Änderungen vorhanden. Schließe deinen offenen Vorgang ab.');return;}
    state.character=entry.character;localStorage.setItem(ackKey(entry.id),await hash(entry.character));saveInternal(state.character);state.groupRemote=null;state.playUndo=null;status('SL-Änderungen übernommen.');refresh();
  }
  async function sync(){
    if(stopped||state.storageBlocked||!state.character.playerName?.trim()||!state.character.groupId)return;
    if(busy){again=true;return;}busy=true;
    const snapshot=structuredClone(state.character);
    try{
      const result=await groupRequest('/character','PUT',snapshot);
      if(state.character.groupId!==snapshot.groupId)return;
      if(result.conflict){
        const acknowledged=localStorage.getItem(ackKey(snapshot.groupId));
        const currentRaw=JSON.stringify(state.character),fingerprint=await hash(JSON.parse(currentRaw));
        if(acknowledged&&acknowledged===fingerprint&&currentRaw===JSON.stringify(state.character))await accept(result.entry);
        else {state.groupRemote=result.entry;status('Neuere SL-Änderungen vorhanden. Deinen lokalen Stand zuerst sichern und dann übernehmen.');refresh();}
      }else{
        state.groupRemote=null;
        // Acknowledging a sent snapshot must not erase edits made during the request.
        state.character.groupRevision=result.entry.revision;
        localStorage.setItem(ackKey(snapshot.groupId),await hash(result.entry.character));
        if(state.character.groupId!==snapshot.groupId)return;
        saveInternal(state.character);status('Für die Spielleitung gespeichert.');
        if(JSON.stringify(state.character)!==JSON.stringify(result.entry.character))again=true;
      }
    }catch(error){status(error.message);}
    finally{busy=false;if(again){again=false;schedule();}}
  }
  function schedule(){clearTimeout(timer);timer=setTimeout(sync,600);}
  const onSave=()=>{if(internalSave)return;if(!busy)schedule();else again=true;};
  window.addEventListener('red-builder-saved',onSave);
  const poll=setInterval(()=>{if(!busy&&!state.groupRemote)sync();},10000);
  schedule();
  return {schedule,async acceptRemote(){if(!state.groupRemote)return;const remote=state.groupRemote;if(!await openRemote(remote.character))return;state.groupRemote=null;localStorage.setItem(ackKey(remote.id),await hash(remote.character));status('SL-Stand geöffnet; vorheriger Stand bleibt im lokalen Archiv.');},stop(){stopped=true;clearInterval(poll);clearTimeout(timer);window.removeEventListener('red-builder-saved',onSave);}};
}
