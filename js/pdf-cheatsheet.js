import { localizeAttributeText } from './attribute-labels.js';
import {germanNetText} from './netrunner-german.js';
import {quickReferenceColumns} from './pdf-cheatsheet-content.js?v=critical1';
import { WEAPON_PROFILES,weaponProfile } from './weapon-options.js?v=shopping1';

// Cyberpunk RED core, p. 173: single-shot and Autofire are separate tables.
export const RANGE_BANDS = ['0-6 m','7-12 m','13-25 m','26-50 m','51-100 m','101-200 m','201-400 m','401-800 m'];
export const SINGLE_SHOT_DVS = Object.freeze({
  pistol:[13,15,20,25,30,30,null,null], smg:[15,13,15,20,25,25,30,null],
  shotgun:[13,15,20,25,30,35,null,null], assault:[17,16,15,13,15,20,25,30],
  sniper:[30,25,25,20,15,16,17,20], bow:[15,13,15,17,20,22,null,null],
  grenade:[16,15,15,17,20,22,25,null], rocket:[17,16,15,15,20,20,25,30]
});
export const AUTOFIRE_DVS = Object.freeze({smg:[20,17,20,25,30,null,null,null],assault:[22,20,17,20,25,null,null,null]});

// At least two sixes among the dice actually rolled; damage multipliers add no dice.
export function criticalInjuryChance(damage) {
  const match=String(damage??'').match(/^\s*(\d+)\s*[Wd]6\b/i);
  if(!match)return null;
  const dice=Number(match[1]);
  return dice<2?0:1-(5/6)**dice-dice/6*(5/6)**(dice-1);
}

const plainStats={INT:'Intelligenz',REF:'Reflexe',GES:'Geschicklichkeit',TCH:'Technik',COO:'Coolness',WIL:'Willenskraft',GLK:'Glück',BEW:'Bewegung',KRA:'Körperkraft',EMP:'Empathie',SP:'Schutzwert',TP:'Trefferpunkte',HUM:'Menschlichkeit',DV:'Schwierigkeitsgrad',ROF:'Angriffe',Interface:'Schnittstelle',Maker:'Erfinder',Teamwork:'Teamführung',Operator:'Vermittler',Moto:'Fahrzeugmeisterschaft',Speedheal:'Schnellheilung',Stim:'Stimulans',Surge:'Wachmacher',Rapidetox:'Schnellentgiftung',Antibiotic:'Antibiotikum'};
export const cheatsheetGerman = value => germanNetText(localizeAttributeText(String(value).replace(/EMP-Granate/g,'Impulsgranate'))).replace(/Neural Link/g,'Neuralimplantat').replace(/Interface Plugs/g,'Schnittstellenbuchsen').replace(/\b(INT|REF|GES|TCH|COO|WIL|GLK|BEW|KRA|EMP|SP|TP|HUM|DV|ROF|Interface|Maker|Teamwork|Operator|Moto|Speedheal|Stim|Surge|Rapidetox|Antibiotic)\b/g,key=>plainStats[key]).replace(/Cyberware/g,'Implantate').replace(/Slugs/g,'Flintenlaufgeschosse');
export function cheatsheetWeaponRows(data) {
  const physical=data.attackOptions.flatMap(({item,options})=>{
    const profile=item.kind==='grenade'?'thrown':weaponProfile(item);
    const label=item.shortName??item.name;
    const key=item.autofirePenalty?'pistol':item.id==='sniper-rifle'?'sniper':item.id==='grenade-launcher'?'grenade':item.id==='rocket-launcher'?'rocket':profile==='single'?'pistol':profile;
    const aimed=options.find(mode=>mode.id==='aimed');
    const normalBase=aimed?aimed.base+8:options.find(mode=>['explosive','thrown'].includes(mode.id))?.base;
    const normal={id:item.id,name:`${label} / Normal`,mode:'normal',damage:item.damage,rof:item.rof,magazine:item.magazine??'-',capacity:item.magazineCount===2?`${item.magazine}x2`:item.magazine??'-',rounds:profile==='melee'?'-':1,base:normalBase,aimed:aimed?.base??'-',dvs:profile==='thrown'?[16,15,15,null,null,null,null,null]:SINGLE_SHOT_DVS[key]??null,melee:profile==='melee',reach:item.reach??2};
    const rows=[normal];
    if(aimed)rows.push({...normal,id:item.id+'.aimed',name:`${label} / Gezielt`,mode:'aimed',rof:1,base:aimed.base,aimed:'-'});
    for(const id of ['compensated','laser']){
      const mode=options.find(m=>m.id===id);
      if(mode)rows.push({...normal,id:item.id+'.'+id,name:`${label} / ${id==='laser'?'Laser':'Kompensator'}`,mode:id,base:mode.base,rounds:mode.rounds,aimed:'-'});
    }
    const auto=options.find(mode=>mode.id==='autofire');
    if(auto)rows.push({id:item.id+'.auto',name:`${label} / Dauerfeuer x${auto.maximum}`,mode:'auto',damage:'2W6 x'+auto.maximum+' max.',rof:1,magazine:'10*',capacity:item.magazineCount===2?`${item.magazine}x2`:item.magazine,rounds:10,base:auto.base,dvs:AUTOFIRE_DVS[profile]});
    const suppress=options.find(mode=>mode.id==='suppressive');
    if(suppress)rows.push({id:item.id+'.suppressive',name:`${label} / Unterdrücken`,mode:'suppressive',damage:'-',rof:1,magazine:'10*',capacity:item.magazineCount===2?`${item.magazine}x2`:item.magazine,rounds:10,base:suppress.base,dvs:null,suppressive:true});
    if(profile==='shotgun')rows.push({id:item.id+'.shell',name:'Schrotflinte / Schrotpatrone',mode:'shell',damage:'3W6',rof:1,magazine:'1*',capacity:item.magazineCount===2?`${item.magazine}x2`:item.magazine,rounds:1,base:normalBase,dvs:null,shell:true,shellPattern:options.find(m=>m.id==='shell')?.pattern});
    return rows;
  });
  const digital=(data.netWeapons??[]).map(e=>({id:e.definition.id,name:'(Net) '+e.definition.name,net:true,automatic:e.automatic,
    damage:e.damage.ordinary===e.damage.blackIce?e.damage.ordinary:e.damage.ordinary.replace('W6','')+'/'+e.damage.blackIce,
    rof:'-',magazine:'-',base:e.attackBase??'-',dvs:null,
    netNote:e.damage.ordinary===e.damage.blackIce?`${e.damage.ordinary} Integrität gegen Programme${e.automatic?' / selbstständiger Angriff':''}`:`${e.damage.ordinary} gegen gewöhnliche Programme / ${e.damage.blackIce} gegen Schwarzes ICE`}));
  return [...digital,...physical].map(row=>({...row,criticalChance:row.net?null:criticalInjuryChance(row.damage)}));
}

export function cheatsheetColumns(data) {
  return quickReferenceColumns(data).map(column=>column.map(([title,rows])=>[cheatsheetGerman(title),rows.map(cheatsheetGerman)]));
}

// Small rich-text wrapper: bold labels/formulas keep their measured font width.
function richLines(value,font,bold,size,width,text) {
  const runs=[];
  String(value).split(/(\*\*.*?\*\*)/g).forEach(part=>{
    const strong=part.startsWith('**');
    const label=text(strong?part.slice(2,-2):part);
    for(const word of label.match(/-?\d+ \+ 1W10\s*|\S+\s*|\s+/g)??[]){
      // A closing punctuation mark stays with the preceding word, even across bold spans.
      if(/^[.,;:!?)]/.test(word)&&runs.length&&!/\s$/.test(runs.at(-1).text))runs.at(-1).text+=word;
      else runs.push({text:word,font:strong?bold:font});
    }
  });
  const lines=[];let line=[],used=0;
  for(const run of runs){
    const length=run.font.widthOfTextAtSize(run.text,size);
    if(used+length>width&&line.length){lines.push(line);line=[];used=0;run.text=run.text.trimStart();}
    line.push(run);used+=run.font.widthOfTextAtSize(run.text,size);
  }
  if(line.length)lines.push(line);
  return lines;
}

// One A4 landscape page; cards are atomic, so a rule never continues in another column.
export function drawCheatsheet(pdf,data,{font,rgb,text,preferPortrait=false,compactOverride=false}) {
  const rows=cheatsheetWeaponRows(data),columns=cheatsheetColumns(data);
  // Very large inventories retain aimed values in a column; suppressive rules stay below.
  const compactModes=compactOverride||rows.length>26;
  const tableRows=compactModes?rows.filter(row=>!['aimed','suppressive'].includes(row.mode)):rows;
  const portrait=preferPortrait||tableRows.length>10||(data.netPrograms?.length??0)>8;
  const width=portrait?595.28:841.89,height=portrait?841.89:595.28,columnCount=portrait?2:3;
  const margin=22,gap=12,colWidth=(width-2*margin-(columnCount-1)*gap)/columnCount;
  const bold=pdf.embedStandardFont('Helvetica-Bold');
  const ink=rgb(.08,.12,.16),muted=rgb(.32,.38,.42),red=rgb(.7,.08,.12),pale=rgb(.94,.96,.96);
  const rowHeight=tableRows.length>8?11.5:15;
  const tableBottom=height-108-Math.max(1,tableRows.length)*rowHeight;
  const top=tableBottom-19,available=top-44;
  let plan;
  for(const {size,overhead} of [9.2,9,8.8,8.6].flatMap(size=>[{size,overhead:19},{size,overhead:15}])) {
    const lineHeight=size*1.15,paragraphGap=1.5;
    const cards=columns.flatMap((column,originalColumn)=>column.map(([title,paras],index)=>{
      const equipmentCard=/SCHUTZPROGRAMME|DECK \/|DEIN SCHWARZES/.test(title);
      const preferred=(equipmentCard?2:originalColumn)%columnCount,isAnchor=index===0&&originalColumn<columnCount;
      const wrapped=paras.map(p=>richLines(p,font,bold,size,colWidth-12,text));
      return {title,wrapped,preferred,index,isAnchor,height:overhead+wrapped.reduce((sum,lines)=>sum+lines.length*lineHeight+paragraphGap,0),order:originalColumn*100+index};
    }));
    const groups=Array.from({length:columnCount},()=>[]),heights=Array(columnCount).fill(0);
    // Keep the main action, role and wound cards at the top of their usual columns.
    const anchors=cards.filter(c=>c.isAnchor);
    for(const card of anchors){groups[card.preferred].push(card);heights[card.preferred]+=card.height;}
    const rest=cards.filter(c=>!c.isAnchor).sort((a,b)=>b.height-a.height);
    if(cards.reduce((sum,c)=>sum+c.height,0)>available*columnCount)continue;
    const assign=index=>{
      if(index===rest.length)return true;
      const card=rest[index];
      const choices=groups.map((_,i)=>i).sort((a,b)=>(heights[a]+(a===card.preferred?0:1000))-(heights[b]+(b===card.preferred?0:1000)));
      for(const target of choices){
        if(heights[target]+card.height>available)continue;
        groups[target].push(card);heights[target]+=card.height;
        if(assign(index+1))return true;
        groups[target].pop();heights[target]-=card.height;
      }return false;
    };
    if(Math.max(...heights)<=available&&assign(0)){
      groups.forEach(group=>group.sort((a,b)=>a.isAnchor?-1:b.isAnchor?1:a.order-b.order));
      plan={groups,size,lineHeight,paragraphGap,heights,titleSpace:overhead===15?14:15,cardGap:overhead===15?1:4};break;
    }
  }
  if(!plan&&!portrait)return drawCheatsheet(pdf,data,{font,rgb,text,preferPortrait:true,compactOverride});
  if(!plan&&!compactModes)return drawCheatsheet(pdf,data,{font,rgb,text,preferPortrait:true,compactOverride:true});
  if(!plan)throw new Error('Das Cheatsheet passt nicht lesbar auf eine DIN-A4-Seite. Die vorhandenen Ausrüstungsbeschreibungen sind zu umfangreich.');
  const page=pdf.addPage([width,height]);
  const line=(value,x,y,size=9,color=ink,f=font)=>page.drawText(text(value),{x,y,size,font:f,color});
  const oneLine=(value,x,y,w,size=8,color=ink,f=font)=>{
    let label=text(value);if(f.widthOfTextAtSize(label,size)>w){while(label&&f.widthOfTextAtSize(label+'...',size)>w)label=label.slice(0,-1);label+='...';}
    line(label,x,y,size,color,f);
  };
  page.drawRectangle({x:0,y:height-5,width,height:5,color:red});
  line('Cheatsheet',margin,height-32,23,red,bold);
  oneLine(`${data.name} / ${data.role} / Rang ${data.rank}`,181,height-29,width-205,11,ink,bold);
  page.drawRectangle({x:margin,y:height-71,width:width-2*margin,height:30,color:pale});
  const vitals=`Initiative ${data.derived.initiative} + 1W10    Bewegung ${data.attributes.MOVE.effective*2} m    Trefferpunkte ${data.campaign?(data.health.current+'/'+data.derived.hp):data.derived.hp}`;
  const defense=`Kopf / Körper ${data.armor.headSP} / ${data.armor.bodySP}    Ausweichen ${data.skills.find(s=>s.id==='evasion')?.base??0} + 1W10`;
  const humanity=`Menschlichkeit ${data.humanity.current}/${data.humanity.maximum} / Empathie ${data.attributes.EMP.effective}`;
  line(portrait?vitals:vitals+'    '+defense,margin+7,height-55,9,ink,bold);
  line(portrait?defense+'    '+humanity:humanity+`    Rüstungsabzug -${data.armor.penalty} bereits enthalten; situative Boni extra.`,margin+7,height-66,8,muted);
  line('WAFFEN / WÜRFEL / DISTANZ (m) · Krit. % je Schadenswurf nach Treffer; NET: nicht anwendbar.',margin,height-86,8.5,red,bold);
  const factor=(width-2*margin)/794;
  const widths=portrait?[110,35,32,28,55,45,...Array(8).fill((width-2*margin-305)/8)]:[125,40,36,50,60,43,...Array(8).fill(55)].map(n=>n*factor);
  const heads=['Waffe / Modus','Schaden','Krit. %',portrait?'A/M':'Angr./Mag.','Würfel',compactModes?'Gezielt':'Schuss',...RANGE_BANDS.map(range=>portrait?range.replace(' m',''):range)];
  let x=margin;
  page.drawRectangle({x:margin,y:height-108,width:width-2*margin,height:16,color:ink});
  heads.forEach((head,i)=>{
    const size=Math.min(i<6?(portrait?6.8:7.5):7.1,(widths[i]-5)/bold.widthOfTextAtSize(text(head),1));
    oneLine(head,x+3,height-103,widths[i]-5,size,rgb(1,1,1),bold);x+=widths[i];
  });
  const actualRows=tableRows.length?tableRows:[{name:'Keine Waffe gekauft',damage:'-',rof:'-',magazine:'-',base:'-',dvs:null}];
  actualRows.forEach((row,index)=>{
    const y=height-108-rowHeight-index*rowHeight;
    if(index%2===0)page.drawRectangle({x:margin,y:y-2,width:width-2*margin,height:rowHeight,color:pale});
    let rowName=compactModes?row.name.replace(' / Normal',''):row.name;
    if(portrait)rowName=rowName.replace('Schwere Maschinenpistole','Schwere MP').replace('Maschinenpistole','MP').replace('/ Dauerfeuer','/ Dauer').replace('Schrotflinte / Schrotpatrone','Schrotflinte / Schrot');
    const magazine=compactModes?row.magazine:row.capacity??row.magazine;
    const damage=row.mode==='auto'?'2W6 x':row.damage;
    const chance=Number.isFinite(row.criticalChance)?(row.criticalChance*100).toFixed(1).replace('.',',')+'%':'-';
    const values=[rowName,damage,chance,`${row.rof}/${magazine}`,Number.isFinite(row.base)?`${row.base}+1W10`:'-',compactModes?(Number.isFinite(row.aimed)?`${row.aimed}+1W10`:'-'):row.rounds??'-',...(row.melee||row.shell||row.net||row.suppressive?Array(8).fill(''):(row.dvs??Array(8).fill(null)).map(v=>v??'-'))];
    x=margin;values.forEach((value,i)=>{oneLine(String(value),x+3,y+2,widths[i]-5,8,ink,i===4||i===5?bold:font);x+=widths[i];});
    const note=row.net?row.netNote:row.suppressive?'Bis 25 m / Willenskraft + Konzentration + 1W10; kein Schaden':row.melee?`Bis ${row.reach} m / Ziel: GES + Ausweichen + Mod. + 1W10`:row.shell?'Schwierigkeit 13 / '+(row.shellPattern??'6 x 6 m direkt vor dir'):null;
    if(note)oneLine(note,margin+widths.slice(0,6).reduce((a,b)=>a+b,0)+3,y+2,widths.slice(6).reduce((a,b)=>a+b,0)-5,8,muted);
  });
  const bounds=[];
  plan.groups.forEach((cards,index)=>{
    const cx=margin+index*(colWidth+gap);let y=top;
    for(const card of cards){
      const cardTop=y;
      page.drawRectangle({x:cx,y:y-3,width:colWidth,height:13,color:pale});
      oneLine(card.title.toUpperCase(),cx+6,y+1,colWidth-12,8.1,red,bold);y-=plan.titleSpace;
      for(const lines of card.wrapped){
        for(const runs of lines){let rx=cx+6;for(const run of runs){line(run.text,rx,y,plan.size,ink,run.font);rx+=run.font.widthOfTextAtSize(run.text,plan.size);}y-=plan.lineHeight;}
        y-=plan.paragraphGap;
      }
      y-=plan.cardGap;bounds.push({title:card.title,column:index,top:cardTop,bottom:y});
    }
  });
  line(compactModes?'Würfel vollständig; Gezielt enthält -8. A/M = Angriffe/Aktion / Magazin; * = Verbrauch. MP = Maschinenpistole.':'Würfel vollständig angegeben. Gezielt enthält -8. A/M = Angriffe/Aktion / Magazin; Schuss = Verbrauch je Angriff. MP = Maschinenpistole.',margin,29,portrait?6.6:7,muted);
  line('Regeln: Cyberpunk RED S. 129, 144-188, 196-208, 222; RTG-Regelklärungen 1.3. Waffenvarianten: Projekt-Hausregeln.',margin,18,6.6,muted);
  return {rows,page,layout:{fontSize:plan.size,bounds,width,height,compactModes,tableRows:tableRows.length}};
}
