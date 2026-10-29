// Display the same shared allowance as the economy calculation, including overflow.
export function fundingSplit(parts,funds){
  const eligible=parts.filter(p=>p.funding==='fashion').reduce((sum,p)=>sum+p.cost,0);
  const total=parts.reduce((sum,p)=>sum+p.cost,0),fashion=funds.campaign?0:Math.min(eligible,Math.max(0,funds.fashionRemaining??0));
  return {fashion,cash:total-fashion};
}
export function fundingPrice(parts,funds){
  const {fashion,cash}=fundingSplit(parts,funds),money=n=>n.toLocaleString('de-DE')+' eb';
  return `<span class="funding-price">${fashion?`<span class="money-fashion">${money(fashion)} Fashion</span>`:''}${fashion&&cash?' + ':''}${cash||!fashion?`<span class="money-cash">${money(cash)} Geld</span>`:''}</span>`;
}
