 
 <!-- ── VIEW CURSOR ────────────────────────────────────────────── -->
 (function () {
  var cursor = document.getElementById('view-cursor');
  var cards  = document.querySelectorAll('.work-card');

  // ── Circular rotating badge cursor (SCROLL / MOVE ME) ──
  // Reuses the document mousemove tracker and the cards' mouseenter/
  // mouseleave below instead of adding a second listener of either kind.
  // Both badges are built from the same buildBadge() template and share
  // one fixed circle radius — only their text, font-size/weight, and
  // letter-spacing (to balance the gap before each star) differ.
  var hasFinePointer = window.matchMedia('(pointer: fine)').matches;
  var badgeScroll, badgeAbout, aboutSection;
  var hoveringCard = false, insideAbout = false, hoveringClickable = false;
  var BADGE_RADIUS = 27; // shared, fixed circle radius for both badges
  var BADGE_PAD = 17; // margin from text-path radius to badge edge
  // Generic interactive elements the badge cursor shouldn't sit on top of
  // (the .work-card link is excluded on purpose — it gets its own "View"
  // cursor treatment via hoveringCard below, which takes priority).
  var CLICKABLE_SELECTOR = 'a, button, [role="button"], [onclick], .bottom-nav__burger';

  function buildBadge(id, text, fontSize, letterSpacingEm, fontWeight) {
    var radius = BADGE_RADIUS;
    var size = (radius + BADGE_PAD) * 2;
    var cx = size / 2, cy = size / 2;
    var pathId = id + '-path';
    var d = 'M ' + cx + ' ' + (cy - radius) +
      ' A ' + radius + ' ' + radius + ' 0 1 1 ' + cx + ' ' + (cy + radius) +
      ' A ' + radius + ' ' + radius + ' 0 1 1 ' + cx + ' ' + (cy - radius);

    function textPiece(offsetPct) {
      var style = 'font-size:' + fontSize + 'px' +
        (letterSpacingEm ? ';letter-spacing:' + letterSpacingEm + 'em' : '') +
        (fontWeight ? ';font-weight:' + fontWeight : '');
      return '<text class="badge-cursor__text" style="' + style + '" text-anchor="middle">' +
          '<textPath href="#' + pathId + '" xlink:href="#' + pathId + '" startOffset="' + offsetPct + '%">' + text + '</textPath>' +
        '</text>';
    }

    // Drawn as an explicit path instead of a "✦" glyph — at this size
    // some fonts fall back to a missing-glyph box inside SVG <textPath>,
    // so a real shape guarantees a crisp 4-point star everywhere.
    function starPiece(offsetPct) {
      var theta = (offsetPct / 100) * 360;
      var rad = theta * Math.PI / 180;
      var x = cx + radius * Math.sin(rad);
      var y = cy - radius * Math.cos(rad);
      return '<path class="badge-cursor__star" ' +
        'transform="translate(' + x.toFixed(2) + ',' + y.toFixed(2) + ') rotate(' + theta.toFixed(2) + ')" ' +
        'd="M 0,-4.2 L 0.8,-0.8 L 4.2,0 L 0.8,0.8 L 0,4.2 L -0.8,0.8 L -4.2,0 L -0.8,-0.8 Z"></path>';
    }

    var el = document.createElement('div');
    el.id = id;
    el.className = 'badge-cursor';
    el.style.width = size + 'px';
    el.style.height = size + 'px';
    el.innerHTML =
      '<div class="cursor-badge__glass"></div>' +
      '<div class="badge-cursor__spin">' +
        '<svg viewBox="0 0 ' + size + ' ' + size + '">' +
          '<path id="' + pathId + '" fill="none" d="' + d + '"></path>' +
          // Offsets are shifted off 0%/25%/50%/75% by +20% so that text
          // centered via text-anchor:middle never needs to extend backward
          // past the path's literal start (0%) — a smaller +12.5% margin
          // silently dropped leading characters for longer badge text.
          textPiece(20) +
          starPiece(45) +
          textPiece(70) +
          starPiece(95) +
        '</svg>' +
      '</div>';
    return el;
  }

  if (hasFinePointer) {
    document.body.classList.add('custom-cursor-active');
    badgeScroll = buildBadge('badge-cursor-scroll', 'SCROLL', 9.5, 0.15);
    badgeAbout  = buildBadge('badge-cursor-about', 'MOVE ME', 10.5, 0, 600);
    document.body.appendChild(badgeScroll);
    document.body.appendChild(badgeAbout);
    aboutSection = document.querySelector('.about-me');
  }

  // SCROLL is the default state from the moment the page loads.
  updateCursorState();

  function updateCursorState() {
    if (!hasFinePointer) return;
    if (hoveringCard) {
      cursor.classList.add('active');
      badgeScroll.classList.remove('active');
      badgeAbout.classList.remove('active');
    } else if (hoveringClickable) {
      // Over a link/button/etc: hide both badges entirely so the element
      // and the native (now-restored, see CSS) pointer cursor are clear.
      cursor.classList.remove('active');
      badgeScroll.classList.remove('active');
      badgeAbout.classList.remove('active');
    } else if (insideAbout) {
      cursor.classList.remove('active');
      badgeAbout.classList.add('active');
      badgeScroll.classList.remove('active');
    } else {
      cursor.classList.remove('active');
      badgeScroll.classList.add('active');
      badgeAbout.classList.remove('active');
    }
  }

  document.addEventListener('mousemove', function (e) {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top  = e.clientY + 'px';
    if (hasFinePointer) {
      badgeScroll.style.left = e.clientX + 'px';
      badgeScroll.style.top  = e.clientY + 'px';
      badgeAbout.style.left  = e.clientX + 'px';
      badgeAbout.style.top   = e.clientY + 'px';

      // This page's own dark sections (bottom nav, footer, ticker, etc. —
      // not the visitor's OS theme) are marked with data-cursor-theme,
      // so the badge can switch to its light-on-dark color over them.
      var isDark = !!(e.target && e.target.closest && e.target.closest('[data-cursor-theme="dark"]'));
      badgeScroll.classList.toggle('badge-cursor--dark-ctx', isDark);
      badgeAbout.classList.toggle('badge-cursor--dark-ctx', isDark);

      // Don't let the badge sit on top of links/buttons/etc. and hide
      // what's about to be clicked.
      var isClickable = !!(e.target && e.target.closest && e.target.closest(CLICKABLE_SELECTOR));
      if (isClickable !== hoveringClickable) {
        hoveringClickable = isClickable;
        updateCursorState();
      }
    }
  });

  cards.forEach(function (card) {
    card.addEventListener('mouseenter', function () {
      cursor.classList.add('active');
      hoveringCard = true;
      updateCursorState();
    });
    card.addEventListener('mouseleave', function () {
      cursor.classList.remove('active');
      hoveringCard = false;
      updateCursorState();
    });
  });

  // About Me section uses the same direct-element-listener boundary
  // detection as the mouse-trail effect (see index.html) rather than
  // recomputing getBoundingClientRect on every global mousemove.
  if (hasFinePointer && aboutSection) {
    aboutSection.addEventListener('mouseenter', function () { insideAbout = true; updateCursorState(); });
    aboutSection.addEventListener('mouseleave', function () { insideAbout = false; updateCursorState(); });
  }

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