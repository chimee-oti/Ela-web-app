/* ELA booking flow (trips.html): choose trip, seats, passengers, payment, ticket; plus quotes, manage and track. */
(function(){
'use strict';
const E = window.ELA, flow = document.getElementById('flow');
if(!E || !flow) return;
const {esc,naira,pad,fmtDate,hash,rng,digits,durText,VEH,reduce} = E;
const $ = (s,r=document)=>r.querySelector(s), $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
const today = E.todayISO();

/* ---------- state ---------- */
const S={kind:null,view:null,q:null,legs:[],leg:0,picks:[],sort:'time',pax:[],contact:null,order:null,pay:'card',form:null,quote:null,pdet:null,booking:null,mb:null,tb:null,trips:[]};
const paxN = () => S.q.adults+S.q.children;
const SEAT_STEPS=['Search','Choose trip','Select seats','Passengers','Payment','Ticket'];
const PARCEL_STEPS=['Request','Price','Details','Payment','Confirmed'];
const WHEEL='<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.5"/><path d="M12 3v6.5M3.5 14l6-2M20.5 14l-6-2"/></svg>';
const OK='<svg class="okring" viewBox="0 0 80 80"><circle cx="40" cy="40" r="36"/><path d="M25 41l10 10 20-22"/></svg>';
let tmr=null; const clearT=()=>{ if(tmr){ clearInterval(tmr); tmr=null; } };

function renderFlow(html){ flow.innerHTML=html; flow.classList.remove('in'); void flow.offsetWidth; flow.classList.add('in'); }
function scrollTop(){ const y=flow.getBoundingClientRect().top+window.scrollY-90; window.scrollTo({top:Math.max(0,y),behavior:reduce?'auto':'smooth'}); }
function show(view, noScroll){ clearT(); S.view=view; draw(); if(!noScroll) scrollTop(); }
const stepper=(labels,i)=>'<ol class="stepper">'+labels.map((l,k)=>'<li class="'+(k<i?'done':k===i?'now':'')+'"><span>'+(k<i?'\u2713':k+1)+'</span><b>'+l+'</b></li>').join('')+'</ol>';
const bars=seed=>{ const r=rng(hash(seed)); let h=''; for(let i=0;i<34;i++) h+='<i style="width:'+(1+Math.floor(r()*3))+'px"></i>'; return '<div class="bars">'+h+'</div>'; };
function editHref(){ const p=new URLSearchParams(location.search); const kind=p.get('kind')||'seat'; p.delete('kind'); if(kind==='haul') p.delete('ref'); p.set('tab',kind); return 'book.html?'+p.toString(); }
function invalid(msg){ renderFlow('<div class="empty" style="max-width:560px;margin:40px auto"><h2 style="font-size:22px;margin-bottom:10px;color:var(--ink)">We couldn\u2019t open that</h2><p>'+esc(msg)+'</p><div class="actions" style="justify-content:center"><a class="btn btn-primary" href="book.html">Back to booking</a></div></div>'); }

function draw(){
  ({results:vResults,seats:vSeats,details:vDetails,pay:vPay,done:vDone,quote:vQuote,pdetails:vPDetails,manage:vManage,track:vTrack})[S.view]();
}

/* ---------- CHOOSE YOUR TRIP ---------- */
const sumBar=()=>{ const L=S.legs[S.leg], q=S.q; const who=q.adults+' adult'+(q.adults>1?'s':'')+(q.children?', '+q.children+' child'+(q.children>1?'ren':''):''); return '<div class="sumbar"><div><b>'+esc(L.from)+' \u2192 '+esc(L.to)+'</b> \u00B7 '+fmtDate(L.date)+' \u00B7 '+who+(S.legs.length>1?' \u00B7 '+(S.leg?'Return':'Outbound'):'')+'</div><a class="link" href="'+editHref()+'">Edit search</a></div>'; };

function tripCard(t,i){
  const left=t.cap-t.taken.length;
  return '<article class="trip" style="animation-delay:'+(i*0.06)+'s"><div class="t-time"><b>'+t.dep+'</b><span>'+esc(t.from)+'</span><small>'+esc(t.term)+'</small></div>'+
    '<div class="t-mid"><span>'+durText(t.durMin)+'</span><i class="line"></i><span class="veh">'+VEH[t.veh].name+'</span></div>'+
    '<div class="t-time"><b>'+t.arr+'</b><span>'+esc(t.to)+'</span><small>'+esc(t.termTo)+(t.next?' \u00B7 +1 day':'')+'</small></div>'+
    '<div class="t-chips"><span>Verified driver</span><span>Live tracking</span><span>Fixed schedule</span></div>'+
    '<div class="t-buy"><div><b>'+naira(t.price)+'</b><small>per seat</small></div><em>'+left+' seat'+(left===1?'':'s')+' left</em><button class="btn btn-primary" type="button" data-act="pick" data-id="'+esc(t.id)+'">Select seats</button></div></article>';
}
function vResults(){
  const L=S.legs[S.leg]; const trips=E.getTrips(L);
  if(S.sort==='price') trips.sort((a,b)=>a.price-b.price||a.dep.localeCompare(b.dep));
  S.trips=trips;
  const label=S.legs.length>1?(S.leg?'return ':'outbound '):'';
  renderFlow(stepper(SEAT_STEPS,1)+sumBar()+'<div class="res-head"><h2>Choose your '+label+'trip</h2><label class="sortsel">Sort by <select id="sortSel"><option value="time"'+(S.sort==='time'?' selected':'')+'>Earliest</option><option value="price"'+(S.sort==='price'?' selected':'')+'>Cheapest</option></select></label></div>'+
    (trips.length?trips.map(tripCard).join(''):'<div class="empty">No more departures on this date. <a class="link" href="'+editHref()+'">Try another day</a>.</div>'));
}

/* ---------- SELECT SEATS ---------- */
function seatCells(t){
  const taken=new Set(t.taken); let n=1, h='';
  const btn=k=>'<span class="cell"><button type="button" class="seat'+(taken.has(k)?' taken':'')+'" data-seat="'+k+'"'+(taken.has(k)?' disabled':'')+' aria-label="Seat '+k+(taken.has(k)?' (taken)':'')+'">'+k+'</button></span>';
  h+='<span class="cell drv" title="Driver">'+WHEEL+'</span>'+btn(n++)+'<span class="cell"></span><span class="cell"></span><span class="cell"></span>';
  for(let r=0;r<VEH[t.veh].rows;r++){ h+=btn(n++)+btn(n++)+'<span class="cell"></span>'+btn(n++)+btn(n++); }
  return h;
}
function vSeats(){
  const p=S.picks[S.leg], t=p.trip, need=paxN(), last=S.leg===S.legs.length-1;
  renderFlow(stepper(SEAT_STEPS,2)+sumBar()+'<div class="seat-layout"><div class="panel"><h3>Select your seat'+(need>1?'s':'')+'</h3><p class="muted">Choose '+need+' seat'+(need>1?'s':'')+' for this trip.</p><div class="bus"><div class="seatgrid">'+seatCells(t)+'</div></div><div class="legend"><span><i></i>Available</span><span><i class="s"></i>Selected</span><span><i class="t"></i>Taken</span></div></div>'+
    '<div class="panel"><h3>Your trip</h3><div class="kv"><span>Route</span><b>'+esc(t.from)+' \u2192 '+esc(t.to)+'</b></div><div class="kv"><span>Date</span><b>'+fmtDate(t.date)+'</b></div><div class="kv"><span>Departs</span><b>'+t.dep+'</b></div><div class="kv"><span>Vehicle</span><b>'+VEH[t.veh].name+'</b></div><div class="kv"><span>Boarding at</span><b>'+esc(t.term)+'</b></div>'+
    '<div class="kv"><span>Seats</span><b id="selCount"></b></div><div class="chosen" id="chosen"></div><div class="kv"><span>Fare per passenger</span><b>'+naira(t.price)+'</b></div><div class="kv total"><span>Subtotal</span><b id="subtotal"></b></div>'+
    '<div class="actions"><button class="btn btn-ghost" type="button" data-act="back-results">Back</button><button class="btn btn-primary" type="button" id="seatNext" data-act="seat-next" disabled>'+(last?'Continue':'Choose return trip')+'</button></div></div></div>');
  updateSeatUI();
}
function updateSeatUI(){
  const p=S.picks[S.leg], need=paxN(), sel=p.seats.slice().sort((a,b)=>a-b);
  $$('.seat').forEach(b=>b.classList.toggle('sel',sel.includes(+b.dataset.seat)));
  $('#selCount').textContent=sel.length+' of '+need;
  $('#chosen').innerHTML=sel.map(n=>'<span>Seat '+n+'</span>').join('');
  $('#subtotal').textContent=naira(p.trip.price*sel.length);
  $('#seatNext').disabled = sel.length!==need;
}

/* ---------- PASSENGERS ---------- */
function summaryPanel(o){ return '<div class="panel"><h3>Order summary</h3>'+o.lines.map(l=>'<div class="kv"><span>'+l[0]+'</span><b>'+naira(l[1])+'</b></div>').join('')+'<div class="kv total"><span>Total</span><b>'+naira(o.total)+'</b></div></div>'; }
function seatOrder(){
  const n=paxN(); const lines=S.legs.map((L,i)=>{ const t=S.picks[i].trip; return [esc(L.from)+' \u2192 '+esc(L.to)+' \u00B7 '+t.dep+' \u00B7 '+n+' \u00D7 '+naira(t.price), t.price*n]; });
  return {lines, total:lines.reduce((s,l)=>s+l[1],0)};
}
function vDetails(){
  const n=paxN(), c=S.contact||{}; let h=stepper(SEAT_STEPS,3)+'<form id="detForm" novalidate><div class="two"><div>';
  for(let i=0;i<n;i++){
    const p=S.pax[i]||{}; const seats=S.picks.map((pk,li)=>'Seat '+pk.seats.slice().sort((a,b)=>a-b)[i]+(S.legs.length>1?(li?' (return)':' (outbound)'):'')).join(' \u00B7 ');
    h+='<div class="pax-card"><h3>Passenger '+(i+1)+'<span>'+(i<S.q.adults?'Adult':'Child')+'</span><span>'+seats+'</span></h3><div class="bkg">'+
      '<div class="fld s6"><label for="pn'+i+'">Full name (as on ID)</label><input id="pn'+i+'" value="'+esc(p.name)+'" autocomplete="off"></div>'+
      '<div class="fld s3"><label for="pg'+i+'">Gender</label><select id="pg'+i+'"><option value="">Select</option><option'+(p.gender==='Female'?' selected':'')+'>Female</option><option'+(p.gender==='Male'?' selected':'')+'>Male</option></select></div>'+
      '<div class="fld s3"><label for="pp'+i+'">Phone'+(i?' (optional)':'')+'</label><input id="pp'+i+'" type="tel" value="'+esc(p.phone)+'"></div></div></div>';
  }
  h+='<div class="pax-card"><h3>Contact &amp; next of kin</h3><div class="bkg"><div class="fld s6"><label for="cEmail">Email for your ticket</label><input id="cEmail" type="email" value="'+esc(c.email)+'"></div><div class="fld s6"></div><div class="fld s6"><label for="kName">Next of kin: full name</label><input id="kName" value="'+esc(c.kinName)+'"></div><div class="fld s6"><label for="kPhone">Next of kin: phone</label><input id="kPhone" type="tel" value="'+esc(c.kinPhone)+'"></div></div>'+
    '<label class="check"><input type="checkbox" id="cTerms"> <span>I confirm the passenger details are correct and agree to the booking terms.</span></label></div>';
  h+='</div><div>'+summaryPanel(seatOrder())+'<p class="form-err" id="detErr"></p><div class="actions"><button class="btn btn-ghost" type="button" data-act="det-back">Back</button><button class="btn btn-primary" type="submit">Continue to payment</button></div></div></div></form>';
  renderFlow(h);
}

/* ---------- PAYMENT & CONFIRMATION ---------- */
function vPay(){
  const o=S.order, seat=S.kind==='seat';
  const M=[['card','Pay with card','Debit or credit card'],['transfer','Bank transfer','Pay from your bank app']];
  renderFlow(stepper(seat?SEAT_STEPS:PARCEL_STEPS,seat?4:3)+'<div class="two"><div class="panel"><h3>Payment method</h3><p class="muted">Demo payment: no money moves in preview mode.</p><div class="paymethods">'+
    M.map(m=>'<label class="pm'+(S.pay===m[0]?' on':'')+'"><input type="radio" name="pm" value="'+m[0]+'"'+(S.pay===m[0]?' checked':'')+'><span><b>'+m[1]+'</b><small>'+m[2]+'</small></span></label>').join('')+'</div></div>'+
    '<div class="panel"><h3>Order summary</h3>'+o.lines.map(l=>'<div class="kv"><span>'+l[0]+'</span><b>'+naira(l[1])+'</b></div>').join('')+'<div class="kv total"><span>Total</span><b>'+naira(o.total)+'</b></div><div class="actions"><button class="btn btn-ghost" type="button" data-act="pay-back">Back</button><button class="btn btn-primary" type="button" data-act="pay-now">Pay '+naira(o.total)+'</button></div></div></div>');
}
function finalize(){
  let b;
  if(S.kind==='seat'){
    b={ref:E.makeRef('ELT'),kind:'seat',createdAt:Date.now(),status:'confirmed',total:S.order.total,pay:S.pay,contact:S.contact,pax:S.pax,
      legs:S.legs.map((L,i)=>{ const t=S.picks[i].trip; return {from:L.from,to:L.to,date:L.date,dep:t.dep,arr:t.arr,next:t.next,durMin:t.durMin,veh:t.veh,price:t.price,term:t.term,termTo:t.termTo,seats:S.picks[i].seats.slice().sort((a,b)=>a-b)}; })};
  } else {
    b={ref:E.makeRef(S.kind==='bike'?'ELA-CLK':'ELA-GO'),kind:S.kind,createdAt:Date.now(),status:'confirmed',total:S.order.total,pay:S.pay,quote:S.quote,pdet:S.pdet};
  }
  E.bookings().push(b); E.persist(); S.booking=b; show('done');
}
function ticketHtml(b,l,i){
  const ps=b.pax.map((p,k)=>esc(p.name)+' \u00B7 seat '+l.seats[k]).join('<br>');
  return '<div class="ticket" style="animation-delay:'+(i*.12)+'s"><div class="tmain"><div class="route">'+esc(l.from)+' \u2192 '+esc(l.to)+'</div><div class="hint">'+(b.legs.length>1?(i?'Return':'Outbound')+' trip \u00B7 ':'')+VEH[l.veh].name+'</div>'+
    '<div class="tgrid"><div><small>Date</small><b>'+fmtDate(l.date)+'</b></div><div><small>Departs</small><b>'+l.dep+'</b></div><div><small>Arrives</small><b>'+l.arr+(l.next?' (+1)':'')+'</b></div><div><small>Boarding at</small><b>'+esc(l.term)+'</b></div><div style="grid-column:span 2"><small>Passengers</small><b>'+ps+'</b></div></div></div>'+
    '<div class="tstub">'+bars(b.ref+i)+'<span class="stubref">'+b.ref+'</span></div></div>';
}
function vDone(){
  const b=S.booking;
  if(b.kind==='seat'){
    renderFlow(stepper(SEAT_STEPS,6)+'<div class="done-head">'+OK+'<h2>You\u2019re booked!</h2><p class="hint" style="font-size:15px">Your ticket'+(b.legs.length>1?'s are':' is')+' ready. Keep your reference handy.</p><span class="refbox">'+b.ref+'</span></div><div class="printable">'+b.legs.map((l,i)=>ticketHtml(b,l,i)).join('')+'</div>'+
      '<div class="done-actions"><button class="btn btn-primary" type="button" data-act="print">Print ticket</button><button class="btn btn-ghost" type="button" data-act="goto-manage" data-ref="'+b.ref+'">Manage booking</button><button class="btn btn-ghost" type="button" data-act="goto-track" data-ref="'+b.ref+'">Track trip</button><a class="btn btn-ghost" href="book.html">Book another trip</a></div>');
  } else if(b.kind==='haul'){
    renderFlow('<div class="done-head">'+OK+'<h2>Quote request received</h2><p class="hint" style="font-size:15px">A freight specialist will contact you on '+esc(b.form.phone)+' with a quote.</p><span class="refbox">'+b.ref+'</span></div>'+
      '<div class="panel" style="max-width:640px;margin:0 auto">'+[['Load',b.form.load],['Route',b.form.from+' \u2192 '+b.form.to],['Weight',b.form.weight?b.form.weight+' tonnes':'To be confirmed'],['Pickup date',b.form.date?fmtDate(b.form.date):'Flexible'],['Company',b.form.company||'\u2014']].map(r=>'<div class="kv"><span>'+r[0]+'</span><b>'+esc(r[1])+'</b></div>').join('')+'</div>'+
      '<div class="done-actions"><button class="btn btn-ghost" type="button" data-act="goto-track" data-ref="'+b.ref+'">Track request</button><a class="btn btn-ghost" href="book.html?tab=haul">Make another request</a></div>');
  } else {
    renderFlow(stepper(PARCEL_STEPS,5)+'<div class="done-head">'+OK+'<h2>Booking confirmed</h2><p class="hint" style="font-size:15px">Use this tracking number to follow your delivery.</p><span class="refbox">'+b.ref+'</span></div>'+
      '<div class="panel" style="max-width:640px;margin:0 auto"><h3>'+esc(b.quote.title)+'</h3>'+b.quote.rows.map(r=>'<div class="kv"><span>'+r[0]+'</span><b>'+esc(r[1])+'</b></div>').join('')+'<div class="kv"><span>Receiver</span><b>'+esc(b.pdet.rName)+'</b></div><div class="kv total"><span>Paid</span><b>'+naira(b.total)+'</b></div></div>'+
      '<div class="done-actions"><button class="btn btn-primary" type="button" data-act="goto-track" data-ref="'+b.ref+'">Track this delivery</button><button class="btn btn-ghost" type="button" data-act="goto-manage" data-ref="'+b.ref+'">Manage booking</button><a class="btn btn-ghost" href="book.html">Book another</a></div>');
  }
}

/* ---------- ELA CLICK & ELA GO: price, details ---------- */
function quoteBike(p){
  const a=(p.get('bPickup')||'').trim(), d=(p.get('bDrop')||'').trim(), item=p.get('bItem')||'Parcel', when=p.get('bWhen')||'Now (instant dispatch)';
  if(!a||!d) return null;
  let price=Math.min(9000,Math.max(1500,1500+(a.length+d.length)*40)); if(item.indexOf('Errand')===0) price+=500; price=Math.round(price/50)*50;
  return {title:'ELA Click delivery',price,note:'Estimate based on your route. Final price is confirmed with your rider.',rows:[['Pickup',a],['Drop-off',d],['Item',item],['When',when]]};
}
function quoteGo(p){
  const from=p.get('gFrom'), to=p.get('gTo'), item=p.get('gItem')||'Parcel', w=parseFloat(p.get('gWeight')), desc=(p.get('gDesc')||'').trim();
  if(!E.city(from)||!E.city(to)||!(w>0)) return null;
  const road=from===to?0:E.roadKm(E.city(from),E.city(to)); let price=2000+road*9+Math.max(0,w-1)*400; if(item==='Document') price=Math.min(price,2000+road*7); price=Math.round(price/100)*100;
  return {title:'ELA Go courier',price,note:'Door-to-door nationwide courier with digital proof of delivery.',rows:[['From',from],['To',to],['Item',item],['Weight',w+' kg']].concat(desc?[['Contents',desc]]:[])};
}
function vQuote(){
  const q=S.quote;
  renderFlow(stepper(PARCEL_STEPS,1)+'<div class="two"><div class="panel"><h3>'+esc(q.title)+'</h3>'+q.rows.map(r=>'<div class="kv"><span>'+r[0]+'</span><b>'+esc(r[1])+'</b></div>').join('')+'</div>'+
    '<div class="panel"><h3>Your price</h3><div class="kv total"><span>Estimated total</span><b>'+naira(q.price)+'</b></div><p class="muted" style="margin-top:10px">'+esc(q.note)+'</p><div class="actions"><a class="btn btn-ghost" href="'+editHref()+'">Edit request</a><button class="btn btn-primary" type="button" data-act="quote-next">Continue</button></div></div></div>');
}
function vPDetails(){
  const d=S.pdet||{}, go=S.kind==='go';
  renderFlow(stepper(PARCEL_STEPS,2)+'<form id="pdetForm" novalidate><div class="two"><div class="pax-card"><h3>Sender</h3><div class="bkg"><div class="fld s6"><label for="sName">Full name</label><input id="sName" value="'+esc(d.sName)+'"></div><div class="fld s6"><label for="sPhone">Phone</label><input id="sPhone" type="tel" value="'+esc(d.sPhone)+'"></div>'+
    (go?'<div class="fld s12"><label for="sAddr">Pickup address</label><input id="sAddr" value="'+esc(d.sAddr)+'" placeholder="Street, area"></div>':'')+'</div></div>'+
    '<div class="pax-card"><h3>Receiver</h3><div class="bkg"><div class="fld s6"><label for="rName">Full name</label><input id="rName" value="'+esc(d.rName)+'"></div><div class="fld s6"><label for="rPhone">Phone</label><input id="rPhone" type="tel" value="'+esc(d.rPhone)+'"></div>'+
    (go?'<div class="fld s12"><label for="rAddr">Delivery address</label><input id="rAddr" value="'+esc(d.rAddr)+'" placeholder="Street, area"></div>':'')+'</div></div></div>'+
    '<div class="pax-card"><div class="fld"><label for="pNote">Note for the rider (optional)</label><textarea id="pNote">'+esc(d.note)+'</textarea></div></div><p class="form-err" id="pdetErr"></p><div class="actions"><button class="btn btn-ghost" type="button" data-act="pdet-back">Back</button><button class="btn btn-primary" type="submit">Continue to payment</button></div></form>');
}

/* ---------- MANAGE & TRACK ---------- */
const BUS_ST=[['Booking confirmed','Your seat is reserved'],['Boarding','Head to the terminal and check in'],['En route','Your bus is on the road'],['Arrived','Trip complete']];
const PARCEL_ST={bike:['Booking confirmed','Rider assigned','Picked up','On the way','Delivered'],go:['Booking confirmed','Collected from sender','In transit','Out for delivery','Delivered'],haul:['Request received','Under review','Specialist assigned']};
const busStage=l=>{ const dep=new Date(l.date+'T'+l.dep+':00').getTime(), arr=dep+l.durMin*60000, now=Date.now(); return now<dep-3600000?0:now<dep?1:now<arr?2:3; };
const parcelStage=b=>Math.min(PARCEL_ST[b.kind].length-1,Math.floor((Date.now()-b.createdAt)/60000));
const timeline=(steps,idx,descs)=>'<ul class="tl">'+steps.map((s,k)=>'<li class="'+(k<=idx?'on':'')+(k<idx?' pre':'')+(k===idx?' cur':'')+'"><i></i><div><b>'+s+'</b>'+(descs&&descs[k]?'<small>'+descs[k]+'</small>':'')+'</div></li>').join('')+'</ul>';
const statusChip=s=>'<span style="display:inline-block;font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;border-radius:999px;padding:4px 12px;background:'+(s==='cancelled'?'#FFF0F0;color:#9B2F2F':'#E8F6EE;color:#1E7A46')+'">'+s+'</span>';
const findB = ref => E.bookings().find(x=>x.ref===ref);

function vManage(){
  const b=findB(S.mb); if(!b) return invalid('We couldn\u2019t find that booking in this browser.');
  let summary='', change='';
  if(b.kind==='seat'){
    summary=b.legs.map((l,i)=>'<div class="kv"><span>'+(b.legs.length>1?(i?'Return':'Outbound'):'Trip')+'</span><b>'+esc(l.from)+' \u2192 '+esc(l.to)+'<br><small style="font-weight:400;color:var(--muted)">'+fmtDate(l.date)+' \u00B7 '+l.dep+' \u00B7 seats '+l.seats.join(', ')+'</small></b></div>').join('')+
      '<div class="kv"><span>Passengers</span><b>'+b.pax.map(p=>esc(p.name)).join(', ')+'</b></div><div class="kv total"><span>Total paid</span><b>'+naira(b.total)+'</b></div>';
    change = b.status==='cancelled' ? '<div class="banner bad">This booking has been cancelled.</div>' :
      '<h3>Change travel date</h3><p class="muted">Pick new dates for your trip. Your seats and times stay the same.</p>'+b.legs.map((l,i)=>'<div class="fld" style="margin-top:14px"><label for="nd'+i+'">'+(b.legs.length>1?(i?'Return date':'Outbound date'):'Travel date')+'</label><input type="date" id="nd'+i+'" value="'+l.date+'" min="'+today+'"></div>').join('')+
      '<p class="form-err" id="mgErr"></p><div class="actions"><button class="btn btn-primary" type="button" data-act="update-dates">Update dates</button><button class="btn btn-ghost" type="button" data-act="cancel-booking">Cancel booking</button></div>';
  } else if(b.kind==='haul'){
    summary=[['Load',b.form.load],['Route',b.form.from+' \u2192 '+b.form.to],['Contact',b.form.name]].map(r=>'<div class="kv"><span>'+r[0]+'</span><b>'+esc(r[1])+'</b></div>').join('');
    change='<h3>Your request</h3><p class="muted">A freight specialist will be in touch. You can follow its progress under Track.</p>';
  } else {
    summary=b.quote.rows.map(r=>'<div class="kv"><span>'+r[0]+'</span><b>'+esc(r[1])+'</b></div>').join('')+'<div class="kv"><span>Receiver</span><b>'+esc(b.pdet.rName)+'</b></div><div class="kv total"><span>Total paid</span><b>'+naira(b.total)+'</b></div>';
    change = b.status==='cancelled' ? '<div class="banner bad">This booking has been cancelled.</div>' : (parcelStage(b)<2 ? '<h3>Need to cancel?</h3><p class="muted">You can cancel until a rider has collected the parcel.</p><div class="actions"><button class="btn btn-ghost" type="button" data-act="cancel-booking">Cancel booking</button></div>' : '<h3>On its way</h3><p class="muted">This parcel has already been collected, so it can no longer be cancelled here.</p>');
  }
  renderFlow('<div class="two"><div class="panel"><div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:10px"><h3 style="margin:0">'+b.ref+'</h3>'+statusChip(b.status)+'</div>'+summary+'</div><div class="panel">'+change+'<div class="actions"><button class="btn btn-ghost" type="button" data-act="goto-track" data-ref="'+b.ref+'">Track</button></div></div></div>');
}
function trackBody(){
  const b=findB(S.tb); if(!b) return '';
  if(b.status==='cancelled') return '<div class="banner bad">This booking was cancelled.</div>';
  if(b.kind==='seat') return b.legs.map((l,i)=>'<div style="margin-bottom:22px"><div class="kv" style="border:0;padding:0 0 6px"><span>'+(b.legs.length>1?(i?'Return':'Outbound'):'Trip')+'</span><b>'+esc(l.from)+' \u2192 '+esc(l.to)+' \u00B7 '+fmtDate(l.date)+' \u00B7 '+l.dep+'</b></div>'+timeline(BUS_ST.map(s=>s[0]),busStage(l),BUS_ST.map(s=>s[1]))+'</div>').join('');
  return timeline(PARCEL_ST[b.kind],parcelStage(b))+'<p class="hint" style="margin-top:14px">Preview mode: status advances automatically about once a minute for demonstration.</p>';
}
function vTrack(){
  const b=findB(S.tb); if(!b) return invalid('We couldn\u2019t find that trip or shipment in this browser.');
  const label={seat:'Bus trip',bike:'ELA Click delivery',go:'ELA Go courier',haul:'ELA Haul request'}[b.kind];
  renderFlow('<div class="two"><div class="panel"><h3>'+b.ref+'</h3><p class="muted">'+label+'</p><div id="trackBody" style="margin-top:14px">'+trackBody()+'</div></div><div class="panel"><h3>Details</h3>'+
    (b.kind==='seat'?b.legs.map(l=>'<div class="kv"><span>Route</span><b>'+esc(l.from)+' \u2192 '+esc(l.to)+'</b></div><div class="kv"><span>Boarding at</span><b>'+esc(l.term)+'</b></div>').join(''):b.kind==='haul'?'<div class="kv"><span>Route</span><b>'+esc(b.form.from+' \u2192 '+b.form.to)+'</b></div><div class="kv"><span>Load</span><b>'+esc(b.form.load)+'</b></div>':b.quote.rows.map(r=>'<div class="kv"><span>'+r[0]+'</span><b>'+esc(r[1])+'</b></div>').join(''))+
    '<div class="actions"><button class="btn btn-ghost" type="button" data-act="goto-manage" data-ref="'+b.ref+'">Manage booking</button></div></div></div>');
  tmr=setInterval(()=>{ const el=$('#trackBody'); if(S.view==='track'&&el) el.innerHTML=trackBody(); },10000);
}

/* ---------- interactions ---------- */
flow.addEventListener('change',e=>{
  if(e.target.id==='sortSel'){ S.sort=e.target.value; draw(); }
  if(e.target.name==='pm'){ S.pay=e.target.value; $$('.pm').forEach(p=>p.classList.toggle('on',p.querySelector('input').checked)); }
});
flow.addEventListener('click',e=>{
  const seat=e.target.closest('.seat'); if(seat && !seat.disabled){
    const p=S.picks[S.leg], n=+seat.dataset.seat, i=p.seats.indexOf(n);
    if(i>=0) p.seats.splice(i,1); else { if(p.seats.length>=paxN()) p.seats.shift(); p.seats.push(n); }
    return updateSeatUI();
  }
  const a=e.target.closest('[data-act]'); if(!a) return;
  switch(a.dataset.act){
    case 'pick': S.picks[S.leg]={trip:S.trips.find(t=>t.id===a.dataset.id),seats:[]}; show('seats'); break;
    case 'back-results': show('results'); break;
    case 'seat-next': if(S.leg<S.legs.length-1){ S.leg++; show('results'); } else show('details'); break;
    case 'det-back': S.leg=S.legs.length-1; show('seats'); break;
    case 'pay-back': show(S.kind==='seat'?'details':'pdetails'); break;
    case 'pay-now': {
      const ov=document.createElement('div'); ov.className='overlay'; ov.innerHTML='<div class="spinner"></div><div>Processing payment\u2026</div>'; document.body.appendChild(ov);
      setTimeout(()=>{ ov.remove(); finalize(); }, reduce?200:1500); break; }
    case 'quote-next': show('pdetails'); break;
    case 'pdet-back': show('quote'); break;
    case 'print': window.print(); break;
    case 'goto-manage': S.mb=a.dataset.ref; show('manage'); break;
    case 'goto-track': S.tb=a.dataset.ref; show('track'); break;
    case 'update-dates': {
      const b=findB(S.mb), ds=b.legs.map((l,i)=>$('#nd'+i).value);
      const err=m=>{ $('#mgErr').textContent=m; };
      if(ds.some(d=>!d||d<today)) return err('Pick a date from today onwards.');
      if(ds.length>1 && ds[1]<ds[0]) return err('Your return date must be on or after your outbound date.');
      const [h,m]=b.legs[0].dep.split(':').map(Number), n=new Date();
      if(ds[0]===today && h*60+m < n.getHours()*60+n.getMinutes()+60) return err('That departure is too soon to change to today. Choose a later date.');
      b.legs.forEach((l,i)=>l.date=ds[i]); E.persist(); vManage(); $('.panel:last-child').insertAdjacentHTML('afterbegin','<div class="banner" style="background:#E8F6EE;color:#1E7A46">Dates updated.</div>'); break; }
    case 'cancel-booking': {
      if(!window.confirm('Cancel this booking?')) return;
      const b=findB(S.mb); b.status='cancelled'; E.persist(); vManage(); break; }
  }
});
flow.addEventListener('submit',e=>{
  e.preventDefault();
  if(e.target.id==='detForm'){
    const n=paxN(), pax=[], bad=[];
    for(let i=0;i<n;i++){ const p={name:$('#pn'+i).value.trim(),gender:$('#pg'+i).value,phone:$('#pp'+i).value.trim()}; pax.push(p);
      if(p.name.length<3||p.name.indexOf(' ')<0) bad.push('pn'+i); if(!p.gender) bad.push('pg'+i); if((i===0&&digits(p.phone).length<10)||(i>0&&p.phone&&digits(p.phone).length<10)) bad.push('pp'+i); }
    const c={email:$('#cEmail').value.trim(),kinName:$('#kName').value.trim(),kinPhone:$('#kPhone').value.trim()};
    if(!/^\S+@\S+\.\S+$/.test(c.email)) bad.push('cEmail'); if(c.kinName.length<3) bad.push('kName'); if(digits(c.kinPhone).length<10) bad.push('kPhone');
    $$('.fld.err').forEach(f=>f.classList.remove('err')); bad.forEach(id=>$('#'+id).closest('.fld').classList.add('err'));
    const err=$('#detErr');
    if(bad.length){ err.textContent='Please complete the highlighted fields (full name needs first and last name; phone numbers need 11 digits).'; return; }
    if(!$('#cTerms').checked){ err.textContent='Please confirm the details and accept the booking terms.'; return; }
    S.pax=pax; S.contact=c; S.order=seatOrder(); show('pay');
  }
  if(e.target.id==='pdetForm'){
    const d={sName:$('#sName').value.trim(),sPhone:$('#sPhone').value.trim(),rName:$('#rName').value.trim(),rPhone:$('#rPhone').value.trim(),note:$('#pNote').value.trim()};
    if(S.kind==='go'){ d.sAddr=$('#sAddr').value.trim(); d.rAddr=$('#rAddr').value.trim(); }
    const bad=[]; if(d.sName.length<3) bad.push('sName'); if(digits(d.sPhone).length<10) bad.push('sPhone'); if(d.rName.length<3) bad.push('rName'); if(digits(d.rPhone).length<10) bad.push('rPhone'); if(S.kind==='go'){ if(!d.sAddr) bad.push('sAddr'); if(!d.rAddr) bad.push('rAddr'); }
    $$('.fld.err').forEach(f=>f.classList.remove('err')); bad.forEach(id=>$('#'+id).closest('.fld').classList.add('err'));
    if(bad.length){ $('#pdetErr').textContent='Please complete the highlighted fields.'; return; }
    S.pdet=d; S.order={lines:[[esc(S.quote.title),S.quote.price]],total:S.quote.price}; show('pay');
  }
});

/* ---------- start from the link the widget sent us ---------- */
(function init(){
  const p=new URLSearchParams(location.search), kind=p.get('kind'), ref=(p.get('ref')||'').toUpperCase();
  S.kind=kind;
  if(kind==='seat'){
    const q={type:p.get('sType')==='round'?'round':'one',from:p.get('sFrom'),to:p.get('sTo'),depart:p.get('sDepart'),ret:p.get('sReturn')||'',adults:Math.min(6,Math.max(1,parseInt(p.get('sAdults'),10)||1)),children:Math.min(4,Math.max(0,parseInt(p.get('sChildren'),10)||0))};
    const ok=c=>E.city(c)&&E.city(c).bus;
    if(!ok(q.from)||!ok(q.to)||q.from===q.to) return invalid('Please choose two different terminals to search for a trip.');
    if(!q.depart||q.depart<today) return invalid('Please pick a departure date from today onwards.');
    if(q.type==='round' && (!q.ret||q.ret<q.depart)) return invalid('Your return date must be on or after your departure date.');
    S.q=q; S.legs=[{from:q.from,to:q.to,date:q.depart}]; if(q.type==='round') S.legs.push({from:q.to,to:q.from,date:q.ret});
    document.title='Choose your trip — '+q.from+' to '+q.to+' | ELA';
    return show('results',true);
  }
  if(kind==='bike'||kind==='go'){
    const q=kind==='bike'?quoteBike(p):quoteGo(p);
    if(!q) return invalid('That request is missing some details. Please fill in the form again.');
    S.quote=q; document.title=q.title+' — price | ELA'; return show('quote',true);
  }
  if(kind==='haul'){ const b=findB(ref); if(!b||b.kind!=='haul') return invalid('We couldn\u2019t find that request in this browser.'); S.booking=b; document.title='Quote request received | ELA'; return show('done',true); }
  if(kind==='manage'){ S.mb=ref; document.title='Manage booking | ELA'; return show('manage',true); }
  if(kind==='track'){ S.tb=ref; document.title='Track | ELA'; return show('track',true); }
  invalid('Start a booking from the search form.');
})();
})();
