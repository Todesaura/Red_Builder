import {escapeHtml as e} from './html.js';
import {attributeLabel} from './attribute-labels.js';

export function attributeRisk(id,value){
  if(!Number.isFinite(value)||value>=5)return '';
  const risks={
    INT:'Du übersiehst Gefahren leichter. Ein unbemerkter Hinterhalt kann dich treffen, bevor du reagieren kannst.',
    REF:'Du triffst schlechter und hast weniger Initiative. Gegner können dich ausschalten, bevor du zum Zug kommst.',
    DEX:'Dein Ausweichen ist schwächer. Gegner treffen dich im Nahkampf leichter und können dich schneller verletzen.',
    TECH:'Stabilisierung durch Erste Hilfe wird schwieriger. Ohne erfolgreiche Stabilisierung musst du weiter Todesrettungen würfeln.',
    COOL:'Du entschärfst Konflikte schwerer. Das erhöht soziale Risiken, senkt aber weder Trefferpunkte noch Todesrettung direkt.',
    WILL:'Du hast weniger Trefferpunkte und schwächeren Widerstand gegen Folter/Drogen. Wenige schwere Treffer können dich töten.',
    LUCK:'Weniger Bonuspunkte für wichtige Proben. Glück kann dich unterstützen, ist bei Todesrettungen aber nicht einsetzbar.',
    MOVE:`Nur ${value*2} m je Bewegungsaktion: Deckung oder Fluchtwege erreichst du schlechter; im offenen Beschuss wird das gefährlich.`,
    EMP:'Weniger Puffer gegen Menschlichkeitsverlust. Cyberware kann dich schneller Richtung Cyberpsychose bringen; kein direkter Todesrettungs-Malus.'
  };
  if(id==='BODY'){
    const safe=Math.max(0,Math.min(9,Math.ceil(value)-1));
    return `Weniger Trefferpunkte und riskante Todesrettung: Ohne Abzüge retten dich nur ${safe?`1${safe>1?'–'+safe:''}`:'keine Ergebnisse'} auf 1W10 (${safe*10} %). Jeder Fehlschlag bedeutet Tod; Abzüge verschlechtern die Chance.`;
  }
  return risks[id]??'';
}
export function renderAttributeRisk(id,value){
  const text=attributeRisk(id,value);
  return text?`<aside class="attribute-risk" aria-label="Risiko bei niedrigem ${attributeLabel(id)}"><strong>⚠ ${attributeLabel(id)} ${value}: niedriger ${id==='EMP'?'Basiswert':'Wert'}</strong><p>${e(text)}</p></aside>`:'';
}
