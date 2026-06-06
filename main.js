 
 <!-- ── VIEW CURSOR ────────────────────────────────────────────── -->
 (function () {
  var cursor = document.getElementById('view-cursor');
  var cards  = document.querySelectorAll('.work-card');

  document.addEventListener('mousemove', function (e) {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top  = e.clientY + 'px';
  });

  cards.forEach(function (card) {
    card.addEventListener('mouseenter', function () { cursor.classList.add('active'); });
    card.addEventListener('mouseleave', function () { cursor.classList.remove('active'); });
  });

  // ── Stop video and kill scroll animation before navigating ────
  cards.forEach(function (card) {
    card.addEventListener('click', function () {
      ScrollTrigger.getAll().forEach(function (st) { st.kill(); });
      var video = document.getElementById('heroVideo');
      var frame = document.getElementById('heroFrame');
      if (video) { video.pause(); video.style.opacity = '0'; }
      if (frame) { gsap.set(frame, { clearProps: 'all' }); frame.style.background = 'transparent'; }
    });
  });

  // ── Service rows reveal ────────────────────────────────────
  var srvEls = document.querySelectorAll('.srv-reveal');
  var srvIO  = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('visible'); srvIO.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  srvEls.forEach(function (el) { srvIO.observe(el); });
})();
 
 // ── HEADLINE SIZING ──────────────────────────────────────────
  function fitHeadline() {
    var h = document.getElementById('headline');
    if (!h) return;
    var padX = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--pad-x')) || 64;
    var available = window.innerWidth - padX * 2;
    var size = Math.min(window.innerWidth * 0.9, 300);
    h.style.fontSize = size + 'px';
    while (h.scrollWidth > available + 1 && size > 10) {
      size -= 1;
      h.style.fontSize = size + 'px';
    }
  }
  fitHeadline();
  window.addEventListener('resize', fitHeadline);
  window.addEventListener('load', function () {
    fitHeadline();
    window.dispatchEvent(new Event('resize'));
  });

  // ── SCROLL REVEAL ────────────────────────────────────────────
  (function () {
    var els = document.querySelectorAll('.reveal');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
      });
    }, { threshold: 0.1 });
    els.forEach(function (el) { io.observe(el); });
  })();

// ── GSAP
(function () {
  if ('scrollRestoration' in history) { history.scrollRestoration = 'manual'; }

  gsap.registerPlugin(ScrollTrigger);

  var hero   = document.querySelector('.hero');
  var frame  = document.getElementById('heroFrame');
  var wrap   = document.querySelector('.hero__video-wrap');
  var type   = document.querySelector('.hero__type');
  var topBar = document.querySelector('.top-bar');

  var scrollTl = null;

  // Hard-reset all hero elements to their CSS initial state
  function resetHero() {
    ScrollTrigger.getAll().forEach(function (st) { st.kill(); });
    scrollTl = null;
    window.scrollTo(0, 0);
    gsap.set(frame,  { clearProps: 'transform,borderRadius,boxShadow' });
    gsap.set(wrap,   { clearProps: 'transform' });
    gsap.set(type,   { clearProps: 'transform,opacity' });
    gsap.set(topBar, { clearProps: 'opacity' });
  }

  // ── 1-2-3. SCROLL SCALE-UP + TEXT PARALLAX + PINNING ────────
  function initScrollAnim() {
    if (window.innerWidth > 700) {
      if (scrollTl) { scrollTl.kill(); scrollTl = null; }

      var rect = frame.getBoundingClientRect();
      var vw = window.innerWidth;
      var vh = window.innerHeight;

      // Scale needed to cover full viewport (cover behaviour)
      var targetScale = Math.max(vw / rect.width, vh / rect.height);

      // Translation to re-center the frame on the viewport
      var tx = vw / 2 - (rect.left + rect.width  / 2);
      var ty = vh / 2 - (rect.top  + rect.height / 2);

      scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: hero,
          start: 'top top',
          end: '+=' + vh,       // pin for one full viewport height of scroll
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          // Reset wrap offset when user scrolls all the way back to top
          onLeaveBack: function () {
            gsap.to(wrap, { x: 0, y: 0, duration: 0.6, ease: 'power2.out' });
          }
        }
      });

      // Video card: scale to full-bleed, radius to 0, shadow out
      scrollTl.to(frame, {
        scale: targetScale,
        x: tx,
        y: ty,
        borderRadius: 0,
        boxShadow: '0 0px 0px rgba(0,0,0,0)',
        ease: 'none'
      }, 0);

      // Text: parallax left at 0.3× scroll speed and fade out
      scrollTl.to(type, {
        x: -(vh * 0.3),
        opacity: 0,
        ease: 'none'
      }, 0);

      // Top bar: fade out with scroll
      scrollTl.to(topBar, {
        opacity: 0,
        ease: 'none'
      }, 0);
    }
  }

  // ── 5. STAR SCROLL ROTATION ──────────────────────────────────
  function initStarAnim() {
    var svcStar = document.getElementById('svcStar');
    if (svcStar) {
      gsap.to(svcStar, {
        rotation: 360,
        ease: 'none',
        scrollTrigger: {
          trigger: document.body,
          start: 'top top',
          end: '+=600',
          scrub: 1
        }
      });
    }
  }

  // ── Scroll to top before leaving — prevents bfcache caching a mid-scroll state
  // (also disables bfcache in most browsers, forcing a clean reload on back/forward)
  window.onbeforeunload = function () {
    sessionStorage.setItem('scrollPos', window.scrollY);
  };

  // ── Unconditional reset + reinit on every pageshow (initial load and bfcache restore)
  window.addEventListener('pageshow', function () {
    resetHero();
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        initScrollAnim();
        initStarAnim();
        ScrollTrigger.refresh();
        var savedPos = sessionStorage.getItem('scrollPos');
        sessionStorage.removeItem('scrollPos');
        if (window.location.hash === '#projects') {
          var target = document.querySelector('#projects');
          if (target) { window.scrollTo(0, target.offsetTop); }
        } else if (window.location.hash) {
          var hash = window.location.hash;
          setTimeout(function () {
            var t = document.querySelector(hash);
            if (t) { t.scrollIntoView({ behavior: 'smooth' }); }
          }, 300);
        } else if (savedPos) {
          window.scrollTo(0, parseInt(savedPos, 10));
        }
      });
    });
  });

  // ── 4. MOUSE PARALLAX (on video wrap, max ±20px / ±10px) ─────
  if (window.innerWidth > 700) {
    hero.addEventListener('mousemove', function (e) {
      var vw = window.innerWidth;
      var vh = window.innerHeight;
      var dx = (e.clientX - vw / 2) / (vw / 2);  // −1 → 1
      var dy = (e.clientY - vh / 2) / (vh / 2);  // −1 → 1
      gsap.to(wrap, {
        x: dx * 20,
        y: dy * 10,
        duration: 0.9,
        ease: 'power2.out',
        overwrite: 'auto'
      });
    });

    hero.addEventListener('mouseleave', function () {
      gsap.to(wrap, { x: 0, y: 0, duration: 0.8, ease: 'power2.out' });
    });
  }

})();