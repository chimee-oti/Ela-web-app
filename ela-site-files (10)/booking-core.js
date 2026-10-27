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
  const f=city(L.from), t=city(L.to), road=roadKm(f,t), base=busFare(f,t);
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

return {reduce,pad,todayISO,tomorrowISO,lateNow,naira,esc,fmtDate,hash,rng,digits,durText,BUS_CITIES,ALL_CITIES,city,roadKm,busFare,VEH,capOf,SLOTS,bookings,persist,makeRef,seatMap,phonesOf,getTrips};
})();
