/* ELA shared site interactions: custom cursor + magnetic buttons.
   Included on every page. Safe no-op on touch devices. */
(function(){
  var isTouch = window.matchMedia('(pointer: coarse)').matches || !window.matchMedia('(pointer: fine)').matches;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(isTouch) return; // don't build a custom cursor on touch devices

  // ---- build cursor elements ----
  var dot = document.createElement('div');
  dot.className = 'ela-cursor-dot';
  var ring = document.createElement('div');
  ring.className = 'ela-cursor-ring';
  var ringLabel = document.createElement('span');
  ringLabel.className = 'ela-cursor-label';
  ring.appendChild(ringLabel);
  document.body.appendChild(dot);
  document.body.appendChild(ring);
  document.documentElement.classList.add('ela-cursor-active');

  var hasGsap = typeof gsap !== 'undefined';
  var moveDot, moveRing;
  if(hasGsap && !reduceMotion){
    moveDot = gsap.quickTo(dot, 'x', {duration:.08, ease:'power3.out'});
    var moveDotY = gsap.quickTo(dot, 'y', {duration:.08, ease:'power3.out'});
    moveRing = gsap.quickTo(ring, 'x', {duration:.35, ease:'power3.out'});
    var moveRingY = gsap.quickTo(ring, 'y', {duration:.35, ease:'power3.out'});
    window.addEventListener('mousemove', function(e){
      moveDot(e.clientX); moveDotY(e.clientY);
      moveRing(e.clientX); moveRingY(e.clientY);
    });
  } else {
    window.addEventListener('mousemove', function(e){
      dot.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px)';
      ring.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px)';
    });
  }

  document.addEventListener('mousedown', function(){ ring.classList.add('down'); });
  document.addEventListener('mouseup', function(){ ring.classList.remove('down'); });

  // ---- hover states ----
  function setHover(el){
    var view = el.getAttribute('data-cursor');
    ring.classList.add('hover');
    if(view){ ringLabel.textContent = view; ring.classList.add('has-label'); }
  }
  function clearHover(){
    ring.classList.remove('hover', 'has-label');
    ringLabel.textContent = '';
  }

  document.addEventListener('mouseover', function(e){
    var target = e.target.closest('a, button:not(.seat), [data-cursor]');
    if(target) setHover(target);
  });
  document.addEventListener('mouseout', function(e){
    var target = e.target.closest('a, button:not(.seat), [data-cursor]');
    var to = e.relatedTarget && e.relatedTarget.closest ? e.relatedTarget.closest('a, button:not(.seat), [data-cursor]') : null;
    if(target && target !== to) clearHover();
  });

  // hide when leaving the window
  document.addEventListener('mouseleave', function(){ dot.style.opacity = 0; ring.style.opacity = 0; });
  document.addEventListener('mouseenter', function(){ dot.style.opacity = 1; ring.style.opacity = 1; });

  // ---- magnetic buttons ----
  if(hasGsap && !reduceMotion){
    document.querySelectorAll('.btn-primary, .svc-card').forEach(function(el){
      var strength = el.classList.contains('svc-card') ? 14 : 10;
      el.addEventListener('mousemove', function(e){
        var r = el.getBoundingClientRect();
        var relX = e.clientX - r.left - r.width/2;
        var relY = e.clientY - r.top - r.height/2;
        gsap.to(el, {x: relX/r.width*strength, y: relY/r.height*strength, duration:.3, ease:'power2.out'});
      });
      el.addEventListener('mouseleave', function(){
        gsap.to(el, {x:0, y:0, duration:.5, ease:'elastic.out(1,0.4)'});
      });
    });
  }
})();
