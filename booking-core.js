/* ELA booking core: shared data and helpers used by the booking widget and the booking flow. */
window.ELA = (function(){
'use strict';
const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const pad = n => String(n).padStart(2,'0');
const dstr = d => d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const todayISO = () => dstr(new Date());
const tomorrowISO = () => { const d=new Date(); d.setDate(d.getDate()+1); return dstr(d); };
const lateNow = () => { const d=new Date(); return d.getHours()*60+d.getMinutes() > 20*60; };   // last departure 21:00, bookable up to an hour before
const naira = n => '\u20A6' + Math.round(n).toLocaleString('en-NG');
const esc = s => String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtDate = iso => new Date(iso+'T00:00:00').toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short',year:'numeric'});
const hash = str => { let h=2166136261; for(let i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; };
const rng = seed => () => { seed=(seed+0x6D2B79F5)|0; let t=Math.imul(seed^(seed>>>15),1|seed); t=(t+Math.imul(t^(t>>>7),61|t))^t; return ((t^(t>>>14))>>>0)/4294967296; };
const digits = s => String(s||'').replace(/\D/g,'').slice(-10);
const durText = m => Math.floor(m/60)+'h '+pad(m%60)+'m';

/* ---------- network data (terminals from the ELA network list) ---------- */
const BUS = [
  ['Lagos',6.52,3.38,'Jibowu and Ajah axis'],['Ibadan',7.38,3.95,'Samonda - Sango Rd / Old Airport & Iwo Road axis'],
  ['Ore',6.75,4.87,'Ore Junction / Benin-Sagamu Expressway'],['Ondo',7.10,4.84,'NNPC Filling Stn, Lagos-Benin Express, before overhead bridge, Ore'],
  ['Benin',6.34,5.63,'Benin Tollgate Oluku / Uselu-Ugbowo axis'],['Asaba',6.20,6.73,'Asaba-Onitsha Expressway axis'],
  ['Warri',5.52,5.75,'Enerhen / Effurun-Sapele Road axis'],['Kaduna',10.52,7.44,'Kawo / Zaria Road corridor'],
  ['Kano',12.00,8.52,'Yankaba / Kano-Zaria corridor'],['Abuja',9.06,7.49,'Jabi/Utako Motor Park, Zuba or Gwagwalada'],
  ['Port Harcourt',4.82,7.03,'Mile 1 / Oil Mill Road, Eleme Junction'],['Aba',5.12,7.37,'Aba-Owerri Road / Osisioma axis'],
  ['Ekiti',7.62,5.22,'Ijoka Road / Old Garage corridor'],['Benue',7.19,8.13,'KM 1 Aliade-Otukpo Rd, Aliade Trailer Park'],
  ['Lokoja',7.80,6.74,'Lokoja Toll Gate, Crusher Junction, Kogi'],['Mokwa',9.30,5.05,'Ashafa Filling Station, Mokwa Road'],
  ['Sagamu / Ijebu Ode',6.83,3.78,'Sagamu-Benin Expressway / Flyover axis']
].map(b=>({n:b[0],lat:b[1],lng:b[2],bus:b[3]}));
const OTHER = [['Enugu',6.44,7.50],['Owerri',5.48,7.03],['Uyo',5.04,7.93],['Awka',6.21,7.07],['Umuahia',5.53,7.49],['Yenagoa',4.93,6.27],['Abakaliki',6.32,8.11],['Jos',9.90,8.86],['Gombe',10.29,11.17],['Bauchi',10.31,9.84],['Sokoto',13.06,5.24],['Nasarawa',9.00,7.60]].map(o=>({n:o[0],lat:o[1],lng:o[2],bus:''}));
const BUS_CITIES = BUS.slice().sort((a,b)=>a.n.localeCompare(b.n));
const ALL_CITIES = BUS.concat(OTHER).sort((a,b)=>a.n.localeCompare(b.n));
const city = n => ALL_CITIES.find(c=>c.n===n);
const roadKm = (a,b)=>{ const R=6371, r=x=>x*Math.PI/180, dLat=r(b.lat-a.lat), dLng=r(b.lng-a.lng); const h=Math.sin(dLat/2)**2+Math.cos(r(a.lat))*Math.cos(r(b.lat))*Math.sin(dLng/2)**2; return 2*R*Math.asin(Math.sqrt(h))*1.3; };
const busFare = (a,b)=> Math.max(3000, Math.round((2500+roadKm(a,b)*40)/500)*500);
const VEH = { exec:{name:'ELA Executive',rows:4}, std:{name:'ELA Standard',rows:7} };
const capOf = v => 1+VEH[v].rows*4;
const SLOTS = ['05:30','07:00','09:30','12:00','15:00','18:00','21:00'];

/* ---------- storage (browser only, with in-memory fallback) ---------- */
const KEY='ela_demo_bookings_v1'; let mem=null;
const bookings = () => { if(!mem){ try{ mem=JSON.parse(localStorage.getItem(KEY)||'[]'); }catch(e){ mem=[]; } } return mem; };
const persist = () => { try{ localStorage.setItem(KEY, JSON.stringify(mem)); }catch(e){} };
const makeRef = prefix => { const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s=''; const buf=new Uint32Array(6); (window.crypto||{getRandomValues:a=>a.forEach((_,i)=>a[i]=Math.random()*4e9)}).getRandomValues(buf); buf.forEach(v=>s+=A[v%A.length]); return prefix+'-'+s; };
const seatMap = () => { const m={}; bookings().forEach(b=>{ if(b.kind!=='seat'||b.status==='cancelled') return; b.legs.forEach(l=>{ const id=[l.from,l.to,l.date,l.dep].join('|'); (m[id]=m[id]||[]).push(...l.seats); }); }); return m; };
const phonesOf = b => b.kind==='seat' ? b.pax.map(p=>digits(p.phone)) : b.kind==='haul' ? [digits(b.form.phone)] : [digits(b.pdet.sPhone),digits(b.pdet.rPhone)];

/* ---------- trips ---------- */
function getTrips(L){
  const f=city(L.from), t=city(L.to), road=roadKm(f,t), base=Math.max(3000,Math.round(busFare(f,t)*dayFactor(L.date)/500)*500);
  const durMin=Math.max(60,Math.round(road/55*60));
  const now=new Date(), isToday=L.date===todayISO(), booked=seatMap(), out=[];
  SLOTS.forEach((tm,i)=>{
    const [h,m]=tm.split(':').map(Number);
    if(isToday && h*60+m < now.getHours()*60+now.getMinutes()+60) return;
    const veh = i%2 ? 'exec' : 'std', cap=capOf(veh);
    const id=[L.from,L.to,L.date,tm].join('|');
    const r=rng(hash(id)), taken=new Set(booked[id]||[]);
    const target=Math.min(cap-3, taken.size+Math.floor(cap*(0.15+r()*0.5)));
    for(let k=0; taken.size<target && k<600; k++) taken.add(1+Math.floor(r()*cap));
    const tot=h*60+m+durMin;
    out.push({id,dep:tm,arr:pad(Math.floor(tot/60)%24)+':'+pad(tot%60),next:Math.floor(tot/1440),veh,cap,durMin,
      price: veh==='exec' ? Math.round(base*1.15/500)*500 : base, taken:Array.from(taken),
      from:L.from,to:L.to,date:L.date,term:f.bus,termTo:t.bus});
  });
  return out;
}

/* ---------- date-based fares: busier days cost a little more, quieter days a little less ---------- */
const DOW=[1.10,1.04,0.94,0.92,0.98,1.08,1.02];   // Sun..Sat
function dayFactor(iso){ const d=new Date(iso+'T00:00:00'); const jit=((hash('d'+iso)%7)-3)/100; return DOW[d.getDay()]+jit; }
function minFare(from,to,date){ const t=getTrips({from,to,date}); return t.length?Math.min.apply(null,t.map(x=>x.price)):null; }
const addDays=(iso,n)=>{ const d=new Date(iso+'T00:00:00'); d.setDate(d.getDate()+n); return dstr(d); };

/* ---------- modern date picker: upgrades <input type="date"> into a styled calendar popover ---------- */
const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
const WD=['Mo','Tu','We','Th','Fr','Sa','Su'];
const nativeVal=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value'), nativeDis=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'disabled');
const CAL='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>';
let openDP=null;
function closeDP(){ if(openDP){ openDP.close(); } }
function upgradeDate(input){
  if(input._dp) return; input._dp=true;
  const ph=input.placeholder||'Select date';
  const btn=document.createElement('button'); btn.type='button'; btn.className='dp-btn'; btn.id=input.id+'_dp';
  const lab=input.closest('.fld,.f')&&input.closest('.fld,.f').querySelector('label'); if(lab&&input.id) lab.setAttribute('for',btn.id);
  input.parentNode.insertBefore(btn,input); input.type='hidden';
  const get=()=>nativeVal.get.call(input);
  const refresh=()=>{ const v=get(); btn.disabled=nativeDis.get.call(input); btn.innerHTML=CAL+'<span class="'+(v?'':'dp-ph')+'">'+(v?fmtDate(v):ph)+'</span>'; };
  Object.defineProperty(input,'value',{get,set(v){ nativeVal.set.call(input,v); refresh(); },configurable:true});
  Object.defineProperty(input,'disabled',{get(){ return nativeDis.get.call(input); },set(v){ nativeDis.set.call(input,v); refresh(); },configurable:true});
  const minOf=()=>input.getAttribute('min')||todayISO();
  let pop=null, view=null, focusISO=null;
  function draw(){
    const min=minOf(), sel=get(), tdy=todayISO(), y=view.y, m=view.m;
    const first=new Date(y,m,1), lead=(first.getDay()+6)%7, days=new Date(y,m+1,0).getDate();
    const anchor=input.dataset.rangeFrom?document.getElementById(input.dataset.rangeFrom):null, from=anchor&&anchor.value&&anchor.value<=sel?anchor.value:null;
    let cells=''; for(let i=0;i<lead;i++) cells+='<i></i>';
    for(let d=1;d<=days;d++){ const iso=y+'-'+pad(m+1)+'-'+pad(d), off=iso<min;
      const cls=['dp-d']; if(iso===sel) cls.push('sel'); if(iso===tdy) cls.push('tdy'); if(from&&iso>from&&iso<sel) cls.push('rng'); if(from&&iso===from&&sel!==from) cls.push('rs');
      cells+='<button type="button" class="'+cls.join(' ')+'" data-iso="'+iso+'"'+(off?' disabled':'')+' tabindex="'+(iso===focusISO?0:-1)+'" aria-label="'+fmtDate(iso)+'">'+d+'</button>'; }
    const prevOff=(y+'-'+pad(m+1))<=min.slice(0,7);
    const tm=addDays(tdy,1);
    pop.innerHTML='<div class="dp-head"><button type="button" class="dp-nav" data-nav="-1" aria-label="Previous month"'+(prevOff?' disabled':'')+'><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg></button><b>'+MONTHS[m]+' '+y+'</b><button type="button" class="dp-nav" data-nav="1" aria-label="Next month"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></button></div>'+
      '<div class="dp-wd">'+WD.map(w=>'<span>'+w+'</span>').join('')+'</div><div class="dp-grid">'+cells+'</div>'+
      '<div class="dp-foot"><button type="button" data-q="'+tdy+'"'+(tdy<min?' disabled':'')+'>Today</button><button type="button" data-q="'+tm+'"'+(tm<min?' disabled':'')+'>Tomorrow</button><button type="button" data-q="'+addDays(tdy,7)+'"'+(addDays(tdy,7)<min?' disabled':'')+'>In a week</button></div>';
  }
  function place(){
    const r=btn.getBoundingClientRect(), w=Math.min(328,innerWidth-24);
    if(innerWidth<=560){ pop.classList.add('sheet'); pop.style.cssText=''; return; }
    pop.classList.remove('sheet'); const spaceBelow=innerHeight-r.bottom, h=pop.offsetHeight;
    const top=(spaceBelow<h+12&&r.top>h+12)?r.top+scrollY-h-8:r.bottom+scrollY+8;
    pop.style.width=w+'px'; pop.style.top=top+'px'; pop.style.left=Math.max(12,Math.min(r.left+scrollX,innerWidth-w-12))+'px';
  }
  function pick(iso){ nativeVal.set.call(input,iso); refresh(); input.dispatchEvent(new Event('change',{bubbles:true})); api.close(); btn.focus(); }
  const api={ close(){ if(!pop) return; pop.remove(); pop=null; document.removeEventListener('mousedown',outside,true); document.removeEventListener('keydown',keys,true); removeEventListener('resize',place); btn.setAttribute('aria-expanded','false'); if(document.querySelector('.dp-back')) document.querySelector('.dp-back').remove(); openDP=null; } };
  const outside=e=>{ if(pop&&!pop.contains(e.target)&&!btn.contains(e.target)) api.close(); };
  const keys=e=>{
    if(e.key==='Escape'){ api.close(); btn.focus(); return; }
    const cur=pop&&pop.querySelector('.dp-d:focus'); if(!cur) return;
    const step={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7}[e.key]; if(!step) return; e.preventDefault();
    let n=addDays(cur.dataset.iso,step); if(n<minOf()) return; focusISO=n; const d=new Date(n+'T00:00:00'); view={y:d.getFullYear(),m:d.getMonth()}; draw(); pop.querySelector('.dp-d[data-iso="'+n+'"]').focus();
  };
  btn.addEventListener('click',()=>{
    if(pop){ api.close(); return; } closeDP();
    const min=minOf(), start=get()||min, d=new Date(start+'T00:00:00'); view={y:d.getFullYear(),m:d.getMonth()}; focusISO=get()&&get()>=min?get():min;
    pop=document.createElement('div'); pop.className='dp-pop'; pop.setAttribute('role','dialog'); pop.setAttribute('aria-label','Choose a date');
    if(innerWidth<=560){ const b=document.createElement('div'); b.className='dp-back'; b.addEventListener('click',()=>api.close()); document.body.appendChild(b); }
    document.body.appendChild(pop); draw(); place(); btn.setAttribute('aria-expanded','true'); openDP=api;
    pop.addEventListener('click',e=>{
      const nav=e.target.closest('[data-nav]'), day=e.target.closest('.dp-d'), q=e.target.closest('[data-q]');
      if(nav){ view.m+=+nav.dataset.nav; if(view.m<0){view.m=11;view.y--;} if(view.m>11){view.m=0;view.y++;} draw(); }
      else if(day&&!day.disabled) pick(day.dataset.iso); else if(q&&!q.disabled) pick(q.dataset.q);
    });
    document.addEventListener('mousedown',outside,true); document.addEventListener('keydown',keys,true); addEventListener('resize',place);
    const f=pop.querySelector('.dp-d[tabindex="0"]'); if(f&&innerWidth>560) f.focus({preventScroll:true});
  });
  api.refresh=refresh; input._dpApi=api; refresh();
}
const upgradeDates=(root)=>Array.from((root||document).querySelectorAll('input[type="date"]')).forEach(upgradeDate);

return {dayFactor,minFare,addDays,upgradeDates,closeDP,reduce,pad,todayISO,tomorrowISO,lateNow,naira,esc,fmtDate,hash,rng,digits,durText,BUS_CITIES,ALL_CITIES,city,roadKm,busFare,VEH,capOf,SLOTS,bookings,persist,makeRef,seatMap,phonesOf,getTrips};
})();
