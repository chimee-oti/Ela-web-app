/* ELA booking widget: builds the tabbed search card and sends each search to the booking flow page. */
(function(){
'use strict';
const E = window.ELA, host = document.getElementById('bookingWidget');
if(!E || !host) return;
const $ = (s,r=host)=>r.querySelector(s), $$ = (s,r=host)=>Array.from(r.querySelectorAll(s));
const ARR = '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 7h10M8 3l4 4-4 4"/></svg>';

host.innerHTML = `
<div class="bk-widget rise d3">
  <div class="bk-tabs" role="tablist">
    <button class="bk-tab active" data-tab="seat" role="tab" type="button"><svg viewBox="0 0 24 24"><path d="M5 11V7a3 3 0 013-3h8a3 3 0 013 3v4"/><path d="M3 12a2 2 0 012-2 2 2 0 012 2v3h10v-3a2 2 0 012-2 2 2 0 012 2v6H3z"/><path d="M6 18v2M18 18v2"/></svg>Book a Seat</button>
    <button class="bk-tab" data-tab="bike" role="tab" type="button"><svg viewBox="0 0 24 24"><circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M6 17l3-8h4l3 5h2M9 9h5"/></svg>Book a Bike</button>
    <button class="bk-tab" data-tab="go" role="tab" type="button"><svg viewBox="0 0 24 24"><path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/></svg>ELA Go</button>
    <button class="bk-tab" data-tab="haul" role="tab" type="button"><svg viewBox="0 0 24 24"><path d="M3 16V7a1 1 0 011-1h9v10"/><path d="M13 10h4l3 3.5V16h-7z"/><circle cx="7" cy="18" r="1.8"/><circle cx="17.5" cy="18" r="1.8"/></svg>ELA Haul</button>
    <button class="bk-tab" data-tab="manage" role="tab" type="button"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M9 15l2 2 4-4"/></svg>Manage Booking</button>
    <button class="bk-tab" data-tab="track" role="tab" type="button"><svg viewBox="0 0 24 24"><path d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>Track</button>
  </div>
  <div class="bk-body">
    <form class="pane active" data-pane="seat" id="seatForm" novalidate>
      <div class="pane-title"><h2>Interstate bus travel</h2></div>
      <div class="bkg">
        <div class="fld s4"><label for="sType">Trip type</label><select id="sType"><option value="one">One way</option><option value="round">Round trip</option></select></div>
        <div class="fld s4"><label for="sDepart">Departure date</label><input type="date" id="sDepart"></div>
        <div class="fld s4"><label for="sReturn">Return date</label><input type="date" id="sReturn" disabled></div>
        <div class="fld s3"><label for="sFrom">Travelling from</label><select id="sFrom"></select></div>
        <div class="fld s3"><label for="sTo">Travelling to</label><select id="sTo"></select></div>
        <div class="fld s3 half"><label for="sAdults">Adults</label><select id="sAdults"></select></div>
        <div class="fld s3 half"><label for="sChildren">Children</label><select id="sChildren"></select></div>
      </div>
      <p class="form-err" id="seatErr"></p>
      <div class="actions"><button class="btn btn-primary btn-lg" type="submit">Search ${ARR}</button></div>
    </form>

    <form class="pane" data-pane="bike" id="bikeForm" novalidate>
      <div class="pane-title"><h2>Same-day city delivery</h2><span>ELA Click · e-bike riders</span></div>
      <div class="bkg">
        <div class="fld s6"><label for="bPickup">Pickup address</label><input id="bPickup" placeholder="e.g. Victoria Island, Lagos" autocomplete="off"></div>
        <div class="fld s6"><label for="bDrop">Drop-off address</label><input id="bDrop" placeholder="e.g. Ikorodu, Lagos" autocomplete="off"></div>
        <div class="fld s6"><label for="bItem">What are we moving?</label><select id="bItem"><option>Parcel</option><option>Documents</option><option>Food &amp; groceries</option><option>Errand (pickup / pay-on-behalf)</option></select></div>
        <div class="fld s6"><label for="bWhen">When</label><select id="bWhen"><option>Now (instant dispatch)</option><option>Later today</option><option>Schedule for tomorrow</option></select></div>
      </div>
      <p class="form-err" id="bikeErr"></p>
      <div class="actions"><button class="btn btn-primary btn-lg" type="submit">Get price ${ARR}</button><span class="hint">Instant estimate, no sign-up needed</span></div>
    </form>

    <form class="pane" data-pane="go" id="goForm" novalidate>
      <div class="pane-title"><h2>Nationwide courier, door to door</h2><span>ELA Go</span></div>
      <div class="bkg">
        <div class="fld s4"><label for="gFrom">From</label><select id="gFrom"></select></div>
        <div class="fld s4"><label for="gTo">To</label><select id="gTo"></select></div>
        <div class="fld s4"><label for="gItem">Item type</label><select id="gItem"><option>Parcel</option><option>Document</option></select></div>
        <div class="fld s4"><label for="gWeight">Approx. weight (kg)</label><input id="gWeight" type="number" min="0.1" step="0.1" value="1"></div>
        <div class="fld s8"><label for="gDesc">What's inside? (optional)</label><input id="gDesc" placeholder="e.g. clothing, phone accessories"></div>
      </div>
      <p class="form-err" id="goErr"></p>
      <div class="actions"><button class="btn btn-primary btn-lg" type="submit">Get price ${ARR}</button><span class="hint">Digital proof of delivery on every consignment</span></div>
    </form>

    <form class="pane" data-pane="haul" id="haulForm" novalidate>
      <div class="pane-title"><h2>Freight quote request</h2><span>ELA Haul · priced by our team</span></div>
      <div class="bkg"><div class="fld s4"><label for="hLoad">Load type</label><select id="hLoad"><option>Full truckload (FTL)</option><option>Part / shared load</option><option>Container haulage from the ports</option><option>Project &amp; heavy cargo</option><option value="car">Car carrier (vehicle transport)</option><option>Dedicated fleet contract</option></select></div>
        </div>
      <div class="bkg" id="hStd">
        <div class="fld s4"><label for="hFrom">Origin</label><select id="hFrom"></select></div>
        <div class="fld s4"><label for="hTo">Destination</label><select id="hTo"></select></div>
        <div class="fld s4"><label for="hWeight">Approx. weight (tonnes)</label><input id="hWeight" type="number" min="0" step="0.5" placeholder="e.g. 20"></div>
        <div class="fld s4"><label for="hDate">Preferred pickup date</label><input id="hDate" type="date"></div>
        <div class="fld s4"><label for="hCompany">Company name</label><input id="hCompany" placeholder="Your company"></div>
        <div class="fld s4"><label for="hName">Contact name</label><input id="hName" placeholder="Full name"></div>
        <div class="fld s4"><label for="hPhone">Phone</label><input id="hPhone" type="tel" placeholder="080..."></div>
        <div class="fld s4"><label for="hEmail">Email</label><input id="hEmail" type="email" placeholder="name@company.com"></div>
        <div class="fld s12"><label for="hNotes">Tell us about the shipment (optional)</label><textarea id="hNotes" placeholder="Cargo description, special handling, recurring route..."></textarea></div>
      </div>
      <div class="bkg" id="hCar" hidden>
        <div class="car-sec"><span>1</span>Your cars</div>
        <div class="fld s4"><label for="cCount">Number of cars</label><select id="cCount"></select></div>
        <div class="fld s8"><label for="cDuty">Customs duty status</label><select id="cDuty"><option value="">Select status</option><option>Duty paid (customs cleared)</option><option>Duty not yet paid</option><option>Locally registered (no duty applies)</option><option>Not sure yet</option></select></div>
        <div class="fld s12"><div class="car-list" id="carList"></div></div>
        <div class="fld s12" id="cPhotoFld"><label>Car photos (1 to 10)</label>
          <label class="car-drop" id="carDrop" for="cPhotos"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8a2 2 0 012-2h2l1.5-2h5L16 6h2a2 2 0 012 2v9a2 2 0 01-2 2H6a2 2 0 01-2-2z"/><circle cx="12" cy="12.5" r="3.5"/></svg><b>Add photos of your cars</b><small>Tap to choose, or drag and drop. JPG or PNG.</small><input type="file" id="cPhotos" accept="image/*" multiple></label>
          <div class="car-thumbs" id="carThumbs"></div><p class="car-count" id="carCount">0 of 10 photos added</p></div>
        <div class="car-sec"><span>2</span>Your journey</div>
        <div class="fld s6"><label for="cPickup">Pickup address</label><input id="cPickup" placeholder="Where should we collect the car(s)?" autocomplete="off"></div>
        <div class="fld s6"><label for="cDeliver">Delivery address</label><input id="cDeliver" placeholder="Where should we deliver?" autocomplete="off"></div>
        <div class="fld s6"><label for="cDate">Loading date</label><input type="date" id="cDate"></div>
        <div class="fld s6"><label for="cTime">Loading time</label><select id="cTime"></select></div>
        <div class="car-sec"><span>3</span>Your details</div>
        <div class="fld s4"><label for="cName">Full name</label><input id="cName" placeholder="Full name" autocomplete="name"></div>
        <div class="fld s4"><label for="cPhone">Phone number</label><input id="cPhone" type="tel" placeholder="080..." autocomplete="tel"></div>
        <div class="fld s4"><label for="cEmail">Email address</label><input id="cEmail" type="email" placeholder="you@email.com" autocomplete="email"></div>
      </div>
      <p class="form-err" id="haulErr"></p>
      <div class="actions"><button class="btn btn-primary btn-lg" type="submit">Request a quote ${ARR}</button><span class="hint">A freight specialist will contact you</span></div>
    </form>

    <form class="pane" data-pane="manage" id="manageForm" novalidate>
      <div class="pane-title"><h2>Manage your booking</h2><span>Change travel dates or cancel</span></div>
      <div class="bkg">
        <div class="fld s6"><label for="mRef">Booking reference</label><input id="mRef" placeholder="e.g. ELT-7K2M9Q" autocomplete="off"></div>
        <div class="fld s6"><label for="mPhone">Phone number used when booking</label><input id="mPhone" type="tel" placeholder="080..."></div>
      </div>
      <p class="form-err" id="manageErr"></p>
      <div class="actions"><button class="btn btn-primary btn-lg" type="submit">Find booking</button><span class="hint">Your reference is on your ticket</span></div>
    </form>

    <form class="pane" data-pane="track" id="trackForm" novalidate>
      <div class="pane-title"><h2>Track a trip or shipment</h2><span>Bus trips, ELA Click, Go &amp; Haul</span></div>
      <div class="bkg">
        <div class="fld s8"><label for="tRef">Tracking or booking number</label><input id="tRef" placeholder="e.g. ELA-CLK-4H8P2R" autocomplete="off"></div>
        <div class="fld s4" style="display:flex;align-items:flex-end;"><button class="btn btn-primary btn-lg" type="submit" style="width:100%;justify-content:center;">Track</button></div>
      </div>
      <p class="form-err" id="trackErr"></p>
    </form>
  </div>
</div>`;

/* ---------- tabs ---------- */
function setTab(id){
  $$('.bk-tab').forEach(t=>{ const on=t.dataset.tab===id; t.classList.toggle('active',on); t.setAttribute('aria-selected',on); });
  $$('.pane').forEach(p=>p.classList.toggle('active',p.dataset.pane===id));
}
$$('.bk-tab').forEach(t=>t.addEventListener('click',()=>setTab(t.dataset.tab)));

/* ---------- fields ---------- */
const opts = (arr,sel)=>arr.map(c=>'<option value="'+E.esc(c.n)+'"'+(c.n===sel?' selected':'')+'>'+E.esc(c.n)+'</option>').join('');
$('#sFrom').innerHTML=opts(E.BUS_CITIES,'Lagos'); $('#sTo').innerHTML=opts(E.BUS_CITIES,'Abuja');
$('#sAdults').innerHTML=[1,2,3,4,5,6].map(n=>'<option>'+n+'</option>').join('');
$('#sChildren').innerHTML=[0,1,2,3,4].map(n=>'<option>'+n+'</option>').join('');
$('#gFrom').innerHTML=opts(E.ALL_CITIES,'Lagos'); $('#gTo').innerHTML=opts(E.ALL_CITIES,'Abuja');
$('#hFrom').innerHTML=opts(E.ALL_CITIES,'Lagos'); $('#hTo').innerHTML=opts(E.ALL_CITIES,'Kano');
const today=E.todayISO();
$('#sDepart').value = E.lateNow() ? E.tomorrowISO() : today;
$('#sDepart').min=today; $('#sReturn').min=today; $('#hDate').min=today; $('#cDate').min=today; $('#sReturn').dataset.rangeFrom='sDepart';
E.upgradeDates(host);
function syncReturn(){ const r=$('#sType').value==='round', el=$('#sReturn'); el.disabled=!r; if(r){ el.min=$('#sDepart').value||today; if(!el.value||el.value<el.min) el.value=el.min; } else el.value=''; }
$('#sType').addEventListener('change',syncReturn);
$('#sDepart').addEventListener('change',()=>{ const el=$('#sReturn'); el.min=$('#sDepart').value||today; if(el.value && el.value<el.min) el.value=el.min; });

/* ---------- ELA Haul: car carrier ---------- */
const carCount=$('#cCount'), carList=$('#carList'), carThumbs=$('#carThumbs');
carCount.innerHTML=[1,2,3,4,5,6,7,8,9,10].map(n=>'<option>'+n+'</option>').join('');
$('#cTime').innerHTML='<option value="">Select time</option>'+['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'].map(t=>'<option>'+t+'</option>').join('');
const carMakes=[];
function drawCars(){
  const n=+carCount.value; carMakes.length=n;
  carList.innerHTML=Array.from({length:n},(_,i)=>'<div class="car-item"><h4>Car '+(i+1)+'</h4><div class="fld"><label for="cMake'+i+'">Make and model</label><input id="cMake'+i+'" placeholder="e.g. Toyota Camry 2018" value="'+E.esc(carMakes[i]||'')+'" autocomplete="off"></div></div>').join('');
}
carList.addEventListener('input',e=>{ const m=/^cMake(\d+)$/.exec(e.target.id); if(m) carMakes[+m[1]]=e.target.value; });
carCount.addEventListener('change',drawCars); drawCars();
const photos=[];   // {name, url}
function drawPhotos(){
  carThumbs.innerHTML=photos.map((p,i)=>'<div class="car-th"><img src="'+p.url+'" alt="Car photo '+(i+1)+'"><button type="button" data-rm="'+i+'" aria-label="Remove photo">&times;</button></div>').join('');
  $('#carCount').textContent=photos.length+' of 10 photos added';
}
function addPhotos(files){
  const list=Array.from(files).filter(f=>/^image\//.test(f.type)); let skipped=Array.from(files).length-list.length;
  list.forEach(f=>{ if(photos.length>=10){ skipped++; return; } photos.push({name:f.name,url:URL.createObjectURL(f)}); });
  drawPhotos(); setErr('haulErr', skipped?'Only image files up to a total of 10 photos can be added.':'');
}
$('#cPhotos').addEventListener('change',e=>{ addPhotos(e.target.files); e.target.value=''; });
carThumbs.addEventListener('click',e=>{ const b=e.target.closest('[data-rm]'); if(!b) return; const p=photos.splice(+b.dataset.rm,1)[0]; try{ URL.revokeObjectURL(p.url); }catch(_){} drawPhotos(); });
const drop=$('#carDrop');
['dragenter','dragover'].forEach(ev=>drop.addEventListener(ev,e=>{ e.preventDefault(); drop.classList.add('over'); }));
['dragleave','drop'].forEach(ev=>drop.addEventListener(ev,e=>{ e.preventDefault(); drop.classList.remove('over'); }));
drop.addEventListener('drop',e=>addPhotos(e.dataTransfer.files));
function syncLoad(){ const car=$('#hLoad').value==='car'; $('#hCar').hidden=!car; $('#hStd').hidden=car; $('#haulForm .actions .btn').firstChild.textContent=car?'Request car transport ':'Request a quote '; }
$('#hLoad').addEventListener('change',syncLoad);

/* ---------- prefill from the link (used by "Edit search" and deep links from other pages) ---------- */
const P = new URLSearchParams(location.search);
const TABS = {seat:'seat',transport:'seat',bike:'bike',click:'bike',go:'go',haul:'haul',manage:'manage',track:'track'};
['sType','sFrom','sTo','sDepart','sReturn','sAdults','sChildren','bPickup','bDrop','bItem','bWhen','gFrom','gTo','gItem','gWeight','gDesc'].forEach(id=>{ if(P.get(id)!=null && $('#'+id)) $('#'+id).value=P.get(id); });
if(P.get('load')==='car') $('#hLoad').value='car';
syncReturn(); syncLoad();
if(TABS[P.get('tab')]) setTab(TABS[P.get('tab')]);
const refParam=(P.get('ref')||'').toUpperCase();
if(refParam){ if(TABS[P.get('tab')]==='manage') $('#mRef').value=refParam; else { setTab('track'); $('#tRef').value=refParam; } }

/* ---------- send the search to the booking flow page ---------- */
function go(kind, params){
  const q=new URLSearchParams({kind});
  Object.keys(params).forEach(k=>{ if(params[k]!=='' && params[k]!=null) q.set(k, params[k]); });
  location.href='trips.html?'+q.toString();
}
const IDS={seat:['sType','sFrom','sTo','sDepart','sReturn','sAdults','sChildren'],bike:['bPickup','bDrop','bItem','bWhen'],go:['gFrom','gTo','gItem','gWeight','gDesc']};
const goFields = kind => { const p={}; IDS[kind].forEach(id=>p[id]=$('#'+id).value); go(kind,p); };
const setErr=(id,msg,flds)=>{ $('#'+id).textContent=msg||''; $$('.fld.err').forEach(f=>f.classList.remove('err')); (flds||[]).forEach(f=>{ const e=$('#'+f); if(e) e.closest('.fld').classList.add('err'); }); };

$('#seatForm').addEventListener('submit',e=>{
  e.preventDefault();
  const type=$('#sType').value, from=$('#sFrom').value, to=$('#sTo').value, dep=$('#sDepart').value, ret=$('#sReturn').value;
  if(from===to) return setErr('seatErr','Choose two different terminals.',['sFrom','sTo']);
  if(!dep || dep<today) return setErr('seatErr','Pick a departure date from today onwards.',['sDepart']);
  if(type==='round' && (!ret || ret<dep)) return setErr('seatErr','Your return date must be on or after your departure date.',['sReturn']);
  setErr('seatErr',''); goFields('seat');
});
$('#bikeForm').addEventListener('submit',e=>{
  e.preventDefault();
  const p=$('#bPickup').value.trim(), d=$('#bDrop').value.trim();
  if(!p||!d) return setErr('bikeErr','Enter both a pickup and a drop-off address.',[!p?'bPickup':'', !d?'bDrop':''].filter(Boolean));
  setErr('bikeErr',''); goFields('bike');
});
$('#goForm').addEventListener('submit',e=>{
  e.preventDefault();
  if(!(parseFloat($('#gWeight').value)>0)) return setErr('goErr','Enter the approximate weight in kg.',['gWeight']);
  setErr('goErr',''); goFields('go');
});

function submitCar(){
  const n=+carCount.value, cars=[]; for(let i=0;i<n;i++) cars.push($('#cMake'+i).value.trim());
  const f={duty:$('#cDuty').value,pickup:$('#cPickup').value.trim(),deliver:$('#cDeliver').value.trim(),date:$('#cDate').value,time:$('#cTime').value,name:$('#cName').value.trim(),phone:$('#cPhone').value.trim(),email:$('#cEmail').value.trim()};
  const bad=[]; cars.forEach((c,i)=>{ if(c.length<2) bad.push('cMake'+i); });
  if(!photos.length) bad.push('cPhotoFld'); if(!f.duty) bad.push('cDuty'); if(!f.pickup) bad.push('cPickup'); if(!f.deliver) bad.push('cDeliver');
  if(!f.date||f.date<today) bad.push('cDate'); if(!f.time) bad.push('cTime'); if(f.name.length<3) bad.push('cName'); if(E.digits(f.phone).length<10) bad.push('cPhone'); if(!/^\S+@\S+\.\S+$/.test(f.email)) bad.push('cEmail');
  $$('.fld.err').forEach(x=>x.classList.remove('err'));
  bad.forEach(id=>{ const el=$('#'+id); if(el) (el.closest('.fld')||el).classList.add('err'); });
  if(bad.length){ const first=$('#'+bad[0]); const msg=!photos.length&&bad.length===1?'Please add at least one photo of your car.':'Please complete the highlighted fields.'; setErr('haulErr',msg,bad); if(first&&first.scrollIntoView) (first.closest('.fld')||first).scrollIntoView({block:'center',behavior:'smooth'}); return; }
  setErr('haulErr','');
  const form={load:'Car carrier',from:f.pickup,to:f.deliver,weight:'',date:f.date,company:'',name:f.name,phone:f.phone,email:f.email,notes:'',
    car:{count:n,cars,photos:photos.map(p=>p.name),duty:f.duty,pickup:f.pickup,deliver:f.deliver,date:f.date,time:f.time}};
  const b={ref:E.makeRef('CAR'),kind:'haul',createdAt:Date.now(),status:'received',form};
  E.bookings().push(b); E.persist(); go('haul',{ref:b.ref});
}
$('#haulForm').addEventListener('submit',e=>{
  e.preventDefault();
  if($('#hLoad').value==='car') return submitCar();
  const f={load:$('#hLoad').value,from:$('#hFrom').value,to:$('#hTo').value,weight:$('#hWeight').value,date:$('#hDate').value,company:$('#hCompany').value.trim(),name:$('#hName').value.trim(),phone:$('#hPhone').value.trim(),email:$('#hEmail').value.trim(),notes:$('#hNotes').value.trim()};
  const bad=[]; if(!f.name) bad.push('hName'); if(E.digits(f.phone).length<10) bad.push('hPhone'); if(!/^\S+@\S+\.\S+$/.test(f.email)) bad.push('hEmail'); if(f.from===f.to) bad.push('hFrom','hTo');
  if(bad.length) return setErr('haulErr', f.from===f.to?'Origin and destination must be different.':'Please add your name, a valid phone number and email.', bad);
  setErr('haulErr','');
  const b={ref:E.makeRef('HAUL'),kind:'haul',createdAt:Date.now(),status:'received',form:f};
  E.bookings().push(b); E.persist(); go('haul',{ref:b.ref});     // contact details stay in storage, never in the link
});
$('#manageForm').addEventListener('submit',e=>{
  e.preventDefault();
  const ref=$('#mRef').value.trim().toUpperCase(), ph=E.digits($('#mPhone').value);
  const b=E.bookings().find(x=>x.ref===ref);
  if(!b) return setErr('manageErr','No booking found for that reference. Bookings made in preview mode are stored in this browser only.',['mRef']);
  if(!ph || E.phonesOf(b).indexOf(ph)<0) return setErr('manageErr','That phone number does not match this booking.',['mPhone']);
  setErr('manageErr',''); go('manage',{ref:b.ref});
});
$('#trackForm').addEventListener('submit',e=>{
  e.preventDefault();
  const ref=$('#tRef').value.trim().toUpperCase();
  if(!E.bookings().find(x=>x.ref===ref)) return setErr('trackErr','No trip or shipment found for that number. Bookings made in preview mode are stored in this browser only.',['tRef']);
  setErr('trackErr',''); go('track',{ref});
});
})();
