(function(){
  const n = parseInt((location.hash||'#1').slice(1), 10) || 1;
  const lb = document.querySelector('[class*="page_left_block"]');
  const rb = document.querySelector('[class*="page_right_block"]');
  const mp = document.querySelector('[class*="page_map_place"]');
  if(!lb||!rb) return JSON.stringify({error:'no blocks'});
  // remove previous injected test cards, keep loader
  lb.querySelectorAll('.testcard').forEach(e=>e.remove());
  for(let i=0;i<n;i++){ const d=document.createElement('div'); d.className='testcard'; d.style.cssText='width:min(416px,100%);height:442px;background:#ddd;border-radius:26px;margin-bottom:16px;flex:none;'; lb.appendChild(d); }
  const r = el => { const b=el.getBoundingClientRect(); return Math.round(b.top)+','+Math.round(b.left)+' '+Math.round(b.width)+'x'+Math.round(b.height); };
  const main = document.querySelector('[class*="page_main"]');
  return JSON.stringify({n, vw:innerWidth, vh:innerHeight, main:r(main), left:r(lb), right:r(rb), mapPlace:r(mp)});
})()
