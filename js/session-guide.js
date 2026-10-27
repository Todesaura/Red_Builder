import {escapeHtml as e} from './html.js';
import {improvementCost,THERAPIES,INJURY_STATUS} from './campaign-rules.js?v=session6';
import {renderCyberware} from './ui-cyberware.js?v=guide5';

export const SESSION_PAGES=[['info','Session'],['rewards','Belohnung'],['health','Gesundheit'],['inventory','Ausrüstung'],['cyber','Cyberware'],['story','Geschichte'],['review','Prüfen']];
export function sessionActionPage(a){
  if(a.type==='money')return a.wizardReward?'rewards':'inventory';
  if(['skill','role','role-allocate'].includes(a.type))return 'rewards';
  if(['health','injury'].includes(a.type))return 'health';
  if(a.type.startsWith('cyber-')||['therapy','humanity'].includes(a.type))return 'cyber';
  if(['story','reputation'].includes(a.type))return 'story';
  return 'inventory';
}
export function sessionActionTask(a){
  if(a.type==='gear')return a.mode==='consume'&&a.rounds!=null?'ammo':'gear-'+a.mode;
  if(a.type==='money')return 'money-'+a.category;
  if(a.type==='health')return a.mode==='set'?'hp':a.mode;
  if(a.type==='injury')return a.id?'injury-treat':'injury-new';
  if(a.type==='story')return 'story-'+a.category;
  return {'cyber-install':'install','cyber-acquire':'stock','cyber-dispose':'dispose','cyber-remove':'install','cyber-repair':'repair'}[a.type]??a.type;
}
export function setSessionRewards(draft,amount,ip,description){
  const next=structuredClone(draft);next.ipAward=ip;
  const index=next.actions.findIndex(a=>a.wizardReward);
  const reward={type:'money',category:'reward',amount,description:description??next.actions[index]?.description??'',wizardReward:true,actionId:'reward'};
  if(index>=0)next.actions[index]=reward;else if(amount!==0||description?.length)next.actions.push(reward);
  return next;
}
const opts=(entries,value)=>entries.map(([id,name])=>`<option value="${e(String(id))}" ${String(id)===String(value)?'selected':''}>${e(name)}</option>`).join('');
const field=(name,label,type='text',attrs='')=>`<label>${e(label)}<input ${/\bid=/.test(attrs)?'':`id="session-value-${name}"`} name="${name}" type="${type}" ${attrs}></label>`;
const pick=(name,label,entries,value)=>`<label>${e(label)}<select id="session-value-${name}" name="${name}">${opts(entries,value)}</select></label>`;
const hidden=(name,value)=>`<input type="hidden" name="${name}" value="${e(String(value))}">`;
const check=(name,label)=>`<label class="session-check"><input type="checkbox" name="${name}">${e(label)}</label>`;
const form=(type,body,label='Änderung merken')=>`<form data-session-form="${type}" class="session-form session-simple-form">${body}<button class="primary">${label}</button></form>`;
const price=()=>field('price','Gesamtpreis (eb) · leer = angezeigter Katalogpreis','number','min="0" max="1000000"');
const count=()=>field('quantity','Wie viele Stück?','number','min="1" max="99" value="1" required');
const choice=(task,title,detail='')=>`<button type="button" class="session-choice" data-session-task="${task}"><strong>${title}</strong>${detail?`<span>${detail}</span>`:''}</button>`;
const choices=items=>`<div class="session-choices">${items.map(args=>choice(...args)).join('')}</div>`;
const more=(page,body,title='Weitere Möglichkeiten')=>`<details id="session-more-${page}" class="session-more"><summary>${title}</summary>${body}</details>`;
const draftCorrection=state=>state.sessionDraft?.actions[0]?.type==='correction';
const titles={skill:'Eine Fertigkeit verbessern',role:'Deine Rollenfähigkeit verbessern','role-allocate':'Kampfpunkte umverteilen',hp:'Aktuelle Trefferpunkte',damage:'Schaden eintragen',rest:'Nach Ruhe erholen',stabilize:'Stabilisierung eintragen',speedheal:'Schnellheilung eintragen',injury:'Verletzung eintragen oder behandeln',ammo:'Munition verbraucht','gear-loot':'Einen Gegenstand erhalten','gear-buy':'Einen Gegenstand kaufen','gear-lost':'Einen Gegenstand verloren','gear-sell':'Einen Gegenstand verkaufen','gear-consume':'Einen Gegenstand verbraucht',custom:'Ein eigener Gegenstand',armor:'Rüstung beschädigt oder repariert',attachment:'Waffenaufsatz hinzufügen oder entfernen','armor-equip':'Rüstung anlegen',note:'Reparatur oder Verbesserung notieren',install:'Cyberware einbauen oder ausbauen',stock:'Cyberware erhalten · noch nicht eingebaut',dispose:'Unverbaute Cyberware verkaufen oder verlieren',repair:'Cyberware beschädigt oder repariert',humanity:'Menschlichkeit verloren',therapy:'Therapie erhalten',reputation:'Dein Ruf hat sich verändert'};
function editor(task,body){return `<div class="session-editor"><button type="button" class="text-button" data-session-task="">← Andere Änderung wählen</button><h3>${titles[task]??'Was hat sich verändert?'}</h3>${body}</div>`;}
function currentValues(state){return state.sessionFields?.task===(state.sessionTask??'')?state.sessionFields.values:{};}

export function renderSessionWelcome({character,initial,metrics,history,exports,correction,savedSession,canExport}){
  return `<section class="panel session-welcome"><span class="eyebrow">NACH DEM EINSATZ</span><h2>${savedSession?`Session ${savedSession} ist gespeichert.`:`Bring ${e(character.name)} auf den neuesten Stand.`}</h2><p>${savedSession?'Dein Charakter ist aktualisiert. Du kannst jetzt den neuen Charakterbogen herunterladen.':'Wir gehen die Session Schritt für Schritt durch. Alles ist zunächst ein Entwurf.'}</p>${savedSession?`<button class="primary" data-action="generate-character-sheet" ${!canExport?'disabled':''}>Charakterbogen herunterladen</button>`:''}<button class="${savedSession?'secondary':'primary'}" data-session-start>${savedSession?'Weitere Session nachtragen':'Session nachtragen →'}</button><details id="session-start-values"><summary>Aktuellen Charakterstand ansehen</summary>${metrics}</details>${correction}</section><details id="session-archive-tools" class="session-tools"><summary>Frühere Sessions & Charakter sichern <span>${character.campaign.history.length} Berichte</span></summary>${history}${exports}</details>`;
}

export function renderSessionGuide({character,rules,state,initial,p,forms,meta,history,exports,summary,cyberState,evaluated,projected,contextSnapshot}){
  const page=draftCorrection(state)?'review':state.sessionPage??'info',task=state.sessionTask??'',index=Math.max(0,SESSION_PAGES.findIndex(([id])=>id===page)),draft=state.sessionDraft;
  const values=currentValues(state);
  const snapshot=contextSnapshot??p.after??initial,c=projected.campaign;
  const gear=rules.equipmentRules.items,owned=projected.equipment.items.map(i=>({...i,definition:gear.find(d=>d.id===i.catalogId)}));
  const quantity=()=>field('quantity','Wie viele Stück?','number','min="1" max="99" value="1" required');
  const listed=(id,items)=>`<datalist id="${id}">${items.map(d=>`<option value="${e(d.name)}">${d.cost} eb</option>`).join('')}</datalist>`;
  const catalog=(items=gear)=>listed('session-gear-options',items)+field('catalog','Welcher Gegenstand?','text','list="session-gear-options" placeholder="Name eingeben oder auswählen" required');
  const ownSelect=(items=owned)=>pick('id','Welcher Gegenstand?',items.map(i=>[i.catalogId,`${i.definition.name} · ${i.quantity} vorhanden`]),values.id);
  const notes=()=>field('description','Wofür? (optional)','text','maxlength="1000"');
  let title='',intro='',body='',continueLabel='Weiter',mainForm=false;
  if(page==='info'){
    title='Welche Session möchtest du nachtragen?';intro='Datum und Nummer sind schon eingetragen. Einen Namen oder Notizen kannst du ergänzen.';
    body=`<div class="session-form">${field('number','Session-Nummer','number',`id="session-number" data-session-meta="number" min="1" max="99999" value="${draft.number}"`)}${field('date','Datum','date',`id="session-date" data-session-meta="date" value="${e(draft.date)}"`)}</div>${more('info',field('name','Session-Name (optional)','text',`id="session-name" data-session-meta="name" maxlength="120" value="${e(draft.name)}"`)+`<label>Was ist passiert? (optional)<textarea id="session-notes" data-session-meta="notes" maxlength="2000">${e(draft.notes)}</textarea></label>`)}`;continueLabel='Weiter zur Belohnung →';
  }else if(page==='rewards'){
    title='Was hat eure Spielleitung vergeben?';intro='Trage Geld und Verbesserungspunkte ein. Wenn es nichts gab, lass die 0 stehen.';
    const rewardAction=draft.actions.find(a=>a.wizardReward),reward=rewardAction?.amount??0;
    if(!task){
      body=form('rewards',field('amount','Erhaltenes Geld (eb)','number',`min="0" max="1000000" value="${reward}" required`)+field('ipAward','Erhaltene Verbesserungspunkte (IP)','number',`min="0" max="1000000" value="${draft.ipAward}" required`)+more('reward-note',field('description','Woher kommt die Belohnung? (optional)','text',`maxlength="1000" value="${e(rewardAction?.description??'')}"`),'Notiz zur Belohnung'),'Belohnung merken und weiter →')+`<p class="session-hint">Du hast danach <strong>${snapshot.ip} IP</strong>. Du kannst sie für eine spätere Session aufheben.</p>`+more(page,choices([['skill','Eine Fertigkeit verbessern','Kosten und neue Werte werden angezeigt.'],['role','Rollenfähigkeit steigern','Dein Spezialgebiet verbessern.'],...(character.role==='solo'?[['role-allocate','Kampfpunkte umverteilen','Kostet keine IP.']]:[])]));mainForm=true;
    }else if(task==='skill'){
      const skills=evaluated.skills.filter(s=>s.level<10),selected=skills.find(s=>s.id===values.id)??skills.find(s=>(s.level+1)*20*s.cost<=snapshot.ip)??skills[0];
      if(!selected)body='<p>Alle vorhandenen Fertigkeiten haben bereits Rang 10.</p>';
      else {const to=Number(values.to??selected.level+1),cost=to>selected.level&&to<=10?improvementCost(selected.level,to,selected.cost):null;
        body=form('skill',pick('id','Welche Fertigkeit?',skills.map(s=>[s.id,`${s.name} · Rang ${s.level} → ${s.level+1} · ${(s.level+1)*20*s.cost} IP`]),selected.id)+field('to','Neuer Rang','number',`min="${selected.level+1}" max="10" value="${to}" required`)+`<p class="session-outcome"><strong>${e(selected.name)}</strong><br>Rang ${selected.level} → ${to} · Basis ${selected.base} → ${selected.base+to-selected.level}<br><strong>${cost??'–'} IP</strong> · ${snapshot.ip} IP verfügbar</p>`+((to>selected.level+1||draft.actions.slice(0,state.sessionEditing??draft.actions.length).some(a=>a.type==='skill'&&a.id===selected.id))?check('timeConfirmed','Seit der vorherigen Steigerung wurde Zeit auf dem neuen Rang verbracht.'):'' ));}
    }else if(task==='role'){
      const target=Number(values.to??snapshot.roleRank+1),cost=target>snapshot.roleRank&&target<=10?improvementCost(snapshot.roleRank,target,3):null;
      body=cost!==null?`<p class="session-outcome">Rang ${snapshot.roleRank} → ${target} · <strong>${cost} IP</strong> · ${snapshot.ip} IP verfügbar</p>`+(cost<=snapshot.ip?forms.role:`<p>Dir fehlen ${cost-snapshot.ip} IP. Du kannst deine Punkte bis zur nächsten Session aufheben.</p>`):'<p>Deine Rollenfähigkeit hat bereits den höchsten Rang.</p>';
    }else body=forms[task]??'';
    continueLabel='Weiter zur Gesundheit →';
  }else if(page==='health'){
    title='Wie geht es deinem Charakter?';intro=`Zuletzt hattest du ${snapshot.hp} von ${snapshot.maxHp} Trefferpunkten. Es wird nichts automatisch geheilt.`;
    if(!task||task==='hp'){
      const hp=Number(values.hp??snapshot.hp);
      body=form('health-status',field('hp','Wie viele Trefferpunkte hast du jetzt?','number',`min="-10000" max="${snapshot.maxHp}" value="${hp}" required`)+(hp>snapshot.hp?field('confirmation','Was hat dich geheilt? Bestätigung der Spielleitung','text','required maxlength="1000"'):''),'Trefferpunkte merken und weiter →')+more(page,choices([['injury','Verletzung eintragen oder behandeln'],['stabilize','Stabilisiert worden','Beginnt die natürliche Heilung.'],['rest','Ausgeruht','Volle Ruhetage eintragen.'],['speedheal','Schnellheilung erhalten','Durch einen Medtech.']]));mainForm=true;
    }else if(task==='injury'&&c.injuries.length)body=choices([['injury-new','Neue Verletzung eintragen'],['injury-treat','Vorhandene Verletzung behandeln']]);
    else if(task==='injury'||task==='injury-new')body=form('injury',field('name','Welche kritische Verletzung hast du erlitten?','text','maxlength="120" required list="session-injury-options"')+`<datalist id="session-injury-options">${['Abgetrennter Arm','Abgetrennte Hand','Kollabierte Lunge','Gebrochene Rippen','Gebrochener Arm','Fremdkörper','Gebrochenes Bein','Muskelriss','Wirbelsäulenverletzung','Zerquetschte Finger','Abgetrenntes Bein','Gehirnerschütterung','Beschädigtes Auge','Beschädigtes Ohr'].map(n=>`<option value="${n}">`).join('')}</datalist>`+field('notes','Was musst du dabei beachten? (optional)','text','maxlength="1000"')+'<p class="session-hint">Trefferpunkte werden hier nicht nochmals abgezogen.</p>');
    else if(task==='injury-treat')body=form('injury',pick('id','Welche Verletzung?',c.injuries.map(i=>[i.id,i.name]),values.id)+pick('status','Wie wurde sie behandelt?',[['quickfix','Vorübergehend versorgt (Quick Fix)'],['treated','Dauerhaft behandelt'],['resolved','Längerfristige Folge aufgehoben'],['active','Weiterhin aktiv']],values.status)+field('confirmation','Erfolgreiche Probe, Behandlungszeit oder Bestätigung der Spielleitung','text','required maxlength="1000"'));

    else {
      const common=hidden('mode',task);
      body=form('health',common+(task==='stabilize'?field('confirmation','Welche erfolgreiche Probe hat dich stabilisiert?','text','required maxlength="1000"'):task==='damage'?field('amount','Wie viele Trefferpunkte hast du verloren?','number','min="1" max="10000" required'):task==='rest'?field('days','Wie viele volle Tage hast du dich ausgeruht?','number','min="1" max="365" value="1" required')+check('lightActivity','Ich war stabilisiert und habe mich nur leicht betätigt.'):field('date','An welchem Spieldatum?','date',`value="${e(draft.date)}"`)+check('medtech','Ein Medtech hat die Dosis verabreicht.')+check('onceDaily','Das war meine erste Schnellheilung an diesem Tag.')+field('cost','Bezahlte Behandlungskosten (eb)','number','min="0" value="0"')));
    }continueLabel='Weiter zur Ausrüstung →';
  }else if(page==='inventory'){
    title='Hat sich deine Ausrüstung verändert?';intro='Wähle nur, was passiert ist. Du kannst mehrere Änderungen nacheinander eintragen.';
    if(!task)body=choices([['ammo','Munition verschossen','Verbrauchte Schuss eintragen.'],['gear-loot','Etwas erhalten','Beute oder Geschenk, ohne Kaufpreis.'],['gear-buy','Etwas gekauft','Der Preis wird einmal abgezogen.'],['gear-lost','Etwas verloren','Verloren oder gestohlen.']])+more(page,choices([['gear-consume','Anderen Gegenstand verbraucht'],['gear-sell','Etwas verkauft'],['custom','Eigener Gegenstand'],['armor','Rüstung beschädigt oder repariert'],['armor-equip','Andere Rüstung anlegen'],['attachment','Waffenaufsatz'],['money-spent','Geld ausgegeben'],['money-lost','Geld verloren'],['money-earned','Weiteres Geld erhalten'],['note','Andere Reparatur oder Verbesserung']]));
    else if(task==='ammo'){
      const ammo=owned.filter(i=>i.definition.kind==='ammo');body=ammo.length?form('gear',hidden('mode','consume')+hidden('quantity',1)+ownSelect(ammo)+field('rounds','Wie viele Schuss / Einheiten hast du verbraucht?','number','min="1" max="100000" value="1" required')):'<p>Du hast noch keine Munition im Inventar. Trage neu erhaltene Munition zuerst als Beute oder Kauf ein.</p>';
    }else if(task.startsWith('gear-')){
      const mode=task.slice(5),isNew=['buy','loot'].includes(mode);
      body=!isNew&&!owned.length?'<p>Dein Inventar ist leer.</p>':form('gear',hidden('mode',mode)+(isNew?catalog():ownSelect())+quantity()+(mode==='buy'?price():mode==='sell'?field('price','Wie viel Geld hast du insgesamt dafür bekommen?','number','min="0" required'):'')+(mode==='loot'?'<p class="session-hint">Kostenlos erhalten · es wird kein Geld abgezogen.</p>':''));
    }else if(task.startsWith('money-'))body=form('money',hidden('category',task.slice(6))+field('amount','Wie viele Eurobucks?','number','min="0" max="1000000" required')+notes()+`<p class="session-hint">Käufe und Behandlungen aus diesem Report sind bereits bezahlt. Hier nur weitere Geldbewegungen eintragen.</p>`);
    else if(task==='custom'){
      const mode=values.mode??'loot',fresh=['loot','buy'].includes(mode),item=projected.equipment.custom.find(i=>i.id===values.id)??projected.equipment.custom[0];
      body=form('custom',pick('mode','Was ist passiert?',[['loot','Kostenlos erhalten'],['buy','Gekauft'],['consume','Verbraucht'],['lost','Verloren'],['sell','Verkauft']],mode)+(fresh?field('name','Wie heißt der Gegenstand?','text','maxlength="60" required'):pick('id','Welcher eigene Gegenstand?',projected.equipment.custom.map(i=>[i.id,`${i.name} · ${i.quantity} vorhanden`]),values.id)+hidden('name',item?.name??''))+quantity()+(['buy','sell'].includes(mode)?field('price',mode==='sell'?'Erhaltener Verkaufspreis (eb)':'Bezahlter Gesamtpreis (eb)','number','min="0" required'):'')+(fresh?more('custom-notes',field('notes','Beschreibung (optional)','text','maxlength="600"')):''));
    }else if(task==='attachment'&&!owned.some(i=>i.definition.kind==='weapon'))body='<p>Du hast noch keine Waffe im Inventar, der du einen Aufsatz zuordnen kannst.</p>';
    else if(['armor','armor-equip'].includes(task)&&!owned.some(i=>i.definition.category==='armor'))body='<p>Du hast noch keine Rüstung im Inventar.</p>';
    else if(task==='armor'){
      const armors=owned.filter(i=>i.definition.category==='armor'),selected=armors.find(i=>i.catalogId===values.id)??armors[0],currentSP=selected.definition.sp-(c.armorLoss[selected.catalogId]??0),repair=Number(values.sp??currentSP)>currentSP;
      body=form('armor',pick('id','Welche Rüstung?',armors.map(i=>[i.catalogId,`${i.definition.name} · Schutzwert ${i.definition.sp-(c.armorLoss[i.catalogId]??0)}`]),selected.catalogId)+field('sp','Welchen Schutzwert hat sie jetzt?','number',`min="0" max="${selected.definition.sp}" value="${values.sp??currentSP}" required`)+(repair?field('cost','Reparaturkosten (eb)','number','min="0" value="0"')+field('confirmation','Erfolgreiche Probe und Reparaturzeit / Bestätigung der Spielleitung','text','maxlength="1000" required'):hidden('cost',0)));
    }
    else body=forms[task]??'';
    continueLabel='Weiter zu Cyberware & Menschlichkeit →';
  }else if(page==='cyber'){
    title='Gab es Veränderungen an Cyberware oder Menschlichkeit?';intro=`Deine Menschlichkeit liegt bei ${snapshot.humanity}/${snapshot.maxHumanity}. Wenn sich nichts geändert hat, gehe einfach weiter.`;
    if(!task)body=choices([['install','Cyberware eingebaut oder ausgebaut','Den bekannten Konfigurator öffnen.'],['humanity','Menschlichkeit verloren','Ein Ereignis aus der Session.'],['therapy','Therapie erhalten','Den tatsächlichen Würfelwurf eintragen.']])+more(page,choices([['stock','Cyberware erhalten, noch nicht eingebaut'],['dispose','Unverbaute Cyberware verkauft oder verloren'],['repair','Cyberware beschädigt oder repariert']]));
    else if(task==='install')body=`<p>Hier wird der Einbau nur vorgemerkt. Dauerhaft wird er erst beim Session-Abschluss.</p><div data-session-configurator class="session-configurator"><div class="session-form">${field('session-cyber-loss','Gewürfelter Menschlichkeitsverlust für diesen Einbau','number',`id="session-cyber-loss" data-session-cyber-field="loss" min="0" value="${e(cyberState.loss)}"`)}${more('implant-price',field('session-cyber-price','Vereinbarter Gesamtpreis (leer = Katalogpreis)','number',`id="session-cyber-price" data-session-cyber-field="price" min="0" value="${e(cyberState.price)}"`)+field('session-cyber-confirmation','Würfe / Erläuterung (optional)','text',`id="session-cyber-confirmation" data-session-cyber-field="confirmation" value="${e(cyberState.confirmation)}"`))}</div>${cyberState.cyberDraft.map(i=>`<label>Für ${e(rules.cyberwareRules.items.find(d=>d.id===i.catalogId).name)} verwenden<select data-session-owned="${e(i.id)}"><option value="">Neu kaufen</option>${c.cyberInventory.filter(s=>s.catalogId===i.catalogId).map(s=>`<option value="${e(s.id)}" ${cyberState.owned[i.id]===s.id?'selected':''}>Eigenes Implantat</option>`).join('')}</select></label>`).join('')}${renderCyberware(projected,rules,evaluated,cyberState)}</div>`;
    else if(task==='humanity')body=form('humanity',field('loss','Wie viel Menschlichkeit hast du durch das Ereignis verloren?','number','min="1" max="1000" required')+field('reason','Was ist passiert? Vorgabe der Spielleitung','text','required maxlength="1000"'));
    else if(task==='therapy'){
      const kind=values.kind??'standard',t=THERAPIES[kind]??THERAPIES.standard;
      body=form('therapy',pick('kind','Welche Therapie hast du erhalten?',Object.entries(THERAPIES).map(([id,t])=>[id,`${t.name} · ${t.cost} eb · ${t.dice?t.dice+'W6 Menschlichkeit':'Suchtbehandlung'}`]),kind)+hidden('days',7)+pick('success','War die Behandlung erfolgreich?',[['yes','Ja'],['no','Nein']],values.success??'yes')+(kind==='addiction'?field('reason','Welche Sucht wurde behandelt?','text','maxlength="1000"'):field('roll',`Was war dein Ergebnis auf ${t.dice}W6?`,'number',`min="${t.dice}" max="${t.dice*6}"`))+check('safe','Sieben volle Tage in sicherer Umgebung; das Behandlungsergebnis ist bestätigt.')+`${kind!=='addiction'&&snapshot.humanity>=snapshot.maxHumanity?'<p class="session-hint">Deine Menschlichkeit ist bereits am Maximum. Diese Therapie stellt derzeit keine weiteren Punkte wieder her.</p>':''}<p class="session-hint">${t.cost} eb bei einem Anbieter. Menschlichkeit steigt höchstens bis ${snapshot.maxHumanity}.</p>`+more('therapy-provider',pick('provider','Wer hat dich behandelt?',[['provider','Professioneller Anbieter'],['medtech','Medtech der Gruppe']],values.provider??'provider')+field('cost','Beim Gruppen-Medtech: tatsächlich bezahlte Kosten (eb)','number','min="0"')));
    }else if(task==='stock'){
      const mode=values.mode??'loot';body=form('cyber-acquire',listed('session-cyber-options',rules.cyberwareRules.items)+field('catalog','Welche Cyberware hast du erhalten?','text','list="session-cyber-options" required')+pick('mode','Wie hast du sie erhalten?',[['loot','Beute oder Belohnung'],['buy','Gekauft']],mode)+quantity()+(mode==='buy'?price():'<p class="session-hint">Nur im Besitz: keine Implantatwirkung und kein Menschlichkeitsverlust.</p>'));
    }else if(task==='dispose'){
      const mode=values.mode??'sell';body=c.cyberInventory.length?form('cyber-dispose',pick('id','Welches unverbaute Implantat?',c.cyberInventory.map(i=>[i.id,rules.cyberwareRules.items.find(d=>d.id===i.catalogId).name]),values.id)+pick('mode','Was ist passiert?',[['sell','Verkauft'],['lost','Verloren oder gestohlen']],mode)+(mode==='sell'?field('price','Wie viel hast du dafür bekommen? (eb)','number','min="0" required'):'')):'<p>Du besitzt derzeit keine unverbauten Implantate.</p>';
    }else if(task==='repair'){
      const damaged=values.damaged??'yes';body=projected.cyberware.items.length?form('cyber-repair',pick('id','Welches Implantat?',projected.cyberware.items.map(i=>[i.id,rules.cyberwareRules.items.find(d=>d.id===i.catalogId).name]),values.id)+pick('damaged','Was ist passiert?',[['yes','Es wurde beschädigt'],['no','Es wurde repariert']],damaged)+(damaged==='no'?field('cost','Bezahlte Reparaturkosten (eb)','number','min="0" value="0"')+field('confirmation','Erfolgreiche Probe und Reparaturzeit / Bestätigung der Spielleitung','text','maxlength="1000" required'):hidden('cost',0))):'<p>Du hast derzeit keine Cyberware installiert.</p>';
    }else body='';
    continueLabel='Weiter zur Geschichte →';
  }else if(page==='story'){
    title='Was möchtest du für die nächste Session festhalten?';intro='Neue Kontakte, Feinde oder ein Ziel reichen als kurze Notiz. Diesen Schritt kannst du überspringen.';
    if(!task)body=choices([['story-contacts','Neuer Kontakt'],['story-enemies','Neuer Feind'],['story-goals','Ein Ziel für die nächste Session'],['story-events','Ein wichtiges Ereignis']])+more(page,choices([['story-obligations','Neue Schuld oder Verpflichtung'],['reputation','Ruf verändert']]));
    else if(task.startsWith('story-'))body=form('story',hidden('category',task.slice(6))+field('text','Was möchtest du dir merken?','text','required maxlength="600"'));
    else body=forms.reputation;
    continueLabel='Alles prüfen →';
  }else {title='Passt alles?';intro='Nur diese Änderungen werden übernommen. Du kannst jeden Eintrag noch bearbeiten.';body=summary;}
  const nav=draftCorrection(state)?'':`<nav class="session-progress" aria-label="Schritte des Session-Reports">${SESSION_PAGES.map(([id,label],i)=>`<button type="button" data-session-page="${id}" ${id===page?'aria-current="step"':''}><span>${i+1}</span><small>${label}</small></button>`).join('')}</nav>`;
  const entries=draft.actions.map((a,i)=>({a,i,text:p.log[i+(draft.ipAward?1:0)]})).filter(({a})=>sessionActionPage(a)===page&&!a.wizardReward);
  const staged=page!=='review'&&entries.length?`<section class="session-staged"><h3>Für diese Session gemerkt</h3><ul>${entries.map(({a,i,text})=>`<li><span>${e(text??'Bitte diesen Eintrag prüfen.')}</span><button class="text-button" data-session-edit="${i}" aria-label="Eintrag ${i+1} bearbeiten">Bearbeiten</button><button class="session-remove" data-session-remove="${i}" aria-label="Eintrag ${i+1} entfernen">×</button></li>`).join('')}</ul></section>`:'';
  const error=state.sessionFormError?`<p class="notice" role="alert">${e(state.sessionFormError)}</p>`:'';
  const toast=state.sessionToast?`<p class="session-toast" role="status">✓ ${e(state.sessionToast)}</p>`:'';
  const footer=page==='review'?'':`<div class="session-guide-footer">${index?`<button class="secondary" data-session-page="${SESSION_PAGES[index-1][0]}">← Zurück</button>`:'<span></span>'}${!mainForm&&!task?`<button class="primary" data-session-page="${SESSION_PAGES[index+1][0]}">${continueLabel}</button>`:''}</div>`;
  const stock=page==='cyber'&&!task&&c.cyberInventory.length?`<details id="session-owned-cyber" class="session-more"><summary>Deine unverbauten Implantate (${c.cyberInventory.length})</summary><ul>${c.cyberInventory.map(i=>`<li>${e(rules.cyberwareRules.items.find(d=>d.id===i.catalogId).name)} <button class="text-button" data-session-queue-owned="${e(i.id)}">Einbau vormerken</button></li>`).join('')}</ul></details>`:'';
  return `<div class="session-guide"><div class="session-guide-top"><span>SESSION ${draft.number}${draft.name?' · '+e(draft.name):''} · ${index+1} VON ${SESSION_PAGES.length}</span><button class="text-button" data-session-discard>Entwurf verwerfen</button></div>${nav}<section class="panel session-question" tabindex="-1" id="session-question"><h2>${title}</h2><p class="session-intro">${intro}</p>${toast}${error}${task&&page!=='review'?editor(task,body):body}${stock}${staged}${footer}<small class="session-save-hint">Noch nichts gespeichert · Übernommen wird erst beim Abschluss.</small></section></div>`;
}

// Preserve only the visible form's unfinished input while the preview is re-rendered.
export function restoreSessionForms(root,state){
  for(const f of root.querySelectorAll('[data-session-form]')){
    const saved=state.sessionFields,type=f.dataset.sessionForm;
    for(const control of f.querySelectorAll('input[name],select[name],textarea[name]')){
      if(!control.id)control.id=`session-form-${type}-${control.name}-${control.type==='checkbox'?control.value:''}`;
      if(!saved||saved.type!==type||saved.task!==(state.sessionTask??''))continue;
      const value=saved.values[control.name];if(value===undefined)continue;
      if(control.type==='checkbox')control.checked=Array.isArray(value)?value.includes(control.value):Boolean(value);else control.value=String(value);
    }
  }
}
