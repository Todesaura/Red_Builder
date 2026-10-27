import { characterSheetData } from './pdf-character-data.js?v=session6';
import { characterSheetFields, TEMPLATE_SHA256 } from './pdf-character-layout.js?v=session6';
import { drawCheatsheet } from './pdf-cheatsheet.js?v=session6';

export const TEMPLATE_URL = new URL('../data/Charakterblatt.pdf', import.meta.url);
export const FONT_URL = new URL('../vendor/fonts/Ubuntu-R.ttf', import.meta.url);
export async function loadPdfAsset(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`PDF-Datei konnte nicht geladen werden (${response.status}). Bitte lade die Seite neu und versuche es erneut.`);
  return new Uint8Array(await response.arrayBuffer());
}

// Manual wrapping prevents both oversized words and automatic form scrolling.
export function wrapPdfText(text, font, size, width) {
  const lines=[];
  for(const paragraph of String(text).split('\n')) {
    let line='';
    for(const word of paragraph.split(/\s+/).filter(Boolean)) {
      for(const part of splitWord(word,font,size,width)) {
        const candidate=line?line+' '+part:part;
        if(line && font.widthOfTextAtSize(candidate,size)>width) { lines.push(line);line=part; }
        else line=candidate;
      }
    }
    lines.push(line);
  }
  return lines;
}
function splitWord(word,font,size,width) {
  const parts=[];let current='';
  for(const char of word) { if(current && font.widthOfTextAtSize(current+char,size)>width) {parts.push(current);current='';}current+=char; }
  if(current) parts.push(current);return parts;
}

export async function generateCharacterSheet(character, rules, options = {}) {
  // Recheck independently of the UI before loading assets or creating a download.
  const data=characterSheetData(character,rules,options.state);
  const [{PDFDocument,rgb}, {default:fontkit}, template, fontBytes] = await Promise.all([
    import('../vendor/pdf-lib/pdf-lib.esm.min.js'), import('../vendor/fontkit/fontkit.es.min.js'),
    options.templateBytes ?? loadPdfAsset(TEMPLATE_URL), options.fontBytes ?? loadPdfAsset(FONT_URL)
  ]);
  const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',template))).map(value=>value.toString(16).padStart(2,'0')).join('');
  if(digest!==TEMPLATE_SHA256)throw new Error('Die PDF-Vorlage wurde verändert. Die Feldzuordnung muss vor dem Export angepasst werden.');
  const pdf=await PDFDocument.load(template);
  if(pdf.getPageCount()!==3 || pdf.getPages().some(page=>Math.abs(page.getWidth()-799.37)>1 || Math.abs(page.getHeight()-620.787)>1)) throw new Error('Die PDF-Vorlage wurde verändert. Die Feldzuordnung muss vor dem Export angepasst werden.');
  if(pdf.getForm().getFields().length) throw new Error('Diese Vorlage enthält bereits Formularfelder. Bitte verwende die ursprüngliche Charakterblatt.pdf.');
  pdf.registerFontkit(fontkit);
  // The full font keeps the resulting form editable with additional characters.
  const font=await pdf.embedFont(fontBytes,{subset:false});
  const supported=new Set(font.getCharacterSet());
  const text=value=>String(value??'').normalize('NFC').replace(/\r\n?/g,'\n').replace(/\t/g,'    ').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g,'').replace(/./gu,char=>char==='\n'||supported.has(char.codePointAt(0))?char:`[U+${char.codePointAt(0).toString(16).toUpperCase()}]`);
  const form=pdf.getForm(), fullValues=[];
  const field=(name,page,x,y,width,height,value,size,multiline=false,center=false)=>{
    const f=form.createTextField(name);
    if(multiline)f.enableMultiline();
    f.setText(value);f.setAlignment(center?1:0);
    f.addToPage(page,{x,y,width,height,font,borderColor:undefined,backgroundColor:name==='skills.hometown'?rgb(1,1,1):undefined,textColor:rgb(0.04,0.06,0.08),borderWidth:0});
    f.setFontSize(size);f.disableScrolling();
    f.updateAppearances(font);
    return f;
  };
  for(const cell of characterSheetFields(data)) {
    const page=pdf.getPage(cell.page),scale=page.getWidth()/1500;
    const w=cell.w*scale,h=cell.h*scale;
    const value=text(cell.value),preview=text(cell.displayValue??cell.value),minimum=cell.minSize??6.5;
    let size=cell.size, lines=wrapPdfText(preview,font,size,w-5);
    const fits = () => (lines.length===1?font.heightAtSize(size):lines.length*size*1.2) <= h-1.5;
    while(size>minimum && (!fits() || lines.some(line=>font.widthOfTextAtSize(line,size)>w-5))) {size=Math.max(minimum,size-0.5);lines=wrapPdfText(preview,font,size,w-5);}
    let display=lines.join('\n');
    if(!fits()) {
      size=minimum;
      const count=Math.max(1,Math.floor((h-1.5)/(size*1.2)));
      const short=wrapPdfText(preview,font,size,w-5).slice(0,count);
      let last=short.pop()??'';
      while(last && font.widthOfTextAtSize(last+' …',size)>w-5)last=last.slice(0,-1);
      display=[...short,last+' …'].join('\n');
    }
    const created=field(cell.name,page,cell.x*scale,page.getHeight()-(cell.y+cell.h)*scale,w,h,display,size,display.includes('\n'), /^(stats(?:Base)?\.|hp\.|death\.|humanity\.)/.test(cell.name)||/\.(rank|attribute|base|sp|penalty|rof|magazine|foundation)$/.test(cell.name));
    if(display!==value)fullValues.push([created,value]);
  }
  if(data.portrait) {
    let image;
    if(data.portrait.startsWith('data:image/png'))image=await pdf.embedPng(data.portrait);
    else if(data.portrait.startsWith('data:image/jpeg'))image=await pdf.embedJpg(data.portrait);
    else if(options.portraitBytes)image=await pdf.embedPng(options.portraitBytes);
    else throw new Error('Das WebP-Porträt muss für den PDF-Export umgewandelt werden.');
    const page=pdf.getPage(0),scale=page.getWidth()/1500,box={x:112*scale,y:page.getHeight()-345*scale,w:248*scale,h:239*scale};
    const factor=Math.min(box.w/image.width,box.h/image.height);
    page.drawImage(image,{x:box.x+(box.w-image.width*factor)/2,y:box.y+(box.h-image.height*factor)/2,width:image.width*factor,height:image.height*factor});
  }
  drawCheatsheet(pdf,data,{font,rgb,wrap:wrapPdfText,text});
  pdf.getPages().forEach((page,i)=>page.drawText(`${i+1} / ${pdf.getPageCount()} - RED//BUILDER`,{x:page.getWidth()-144,y:14,size:6,font,color:rgb(0.4,0.4,0.4)}));
  pdf.setTitle(text(`${data.name} - Cyberpunk RED Charactersheet`));pdf.setAuthor('RED//BUILDER');pdf.setSubject('Charakterdaten aus dem lokalen Generator');
  form.updateFieldAppearances(font);
  // Keep the bounded printed preview, but retain the full editable field value.
  // PDF viewers expose the entire content on focus; no duplicate appendix needed.
  for(const [f,value] of fullValues){f.enableScrolling();f.setText(value);form.markFieldAsClean(f.ref);}
  return {bytes:await pdf.save(),filename:data.filename};
}

async function webpToPng(portrait) {
  if(!portrait?.startsWith('data:image/webp'))return undefined;
  const bitmap=await createImageBitmap(await (await fetch(portrait)).blob());
  const canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;
  canvas.getContext('2d').drawImage(bitmap,0,0);bitmap.close();
  return canvas.toDataURL('image/png');
}
export async function downloadCharacterSheet(character,rules,state={}) {
  const portraitBytes=await webpToPng(character.portrait);
  const result=await generateCharacterSheet(character,rules,{state,portraitBytes});
  const blob=new Blob([result.bytes],{type:'application/pdf'}),url=URL.createObjectURL(blob);
  const link=document.createElement('a');link.href=url;link.download=result.filename;document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),60000);
  return result.filename;
}
