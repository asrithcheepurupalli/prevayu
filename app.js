(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // smooth scroll (Lenis), skipped for reduced motion
  if (!reduce) {
    var ls = document.createElement('script');
    ls.src = 'https://unpkg.com/lenis@1/dist/lenis.min.js';
    ls.onload = function () {
      try {
        var lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
        function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
        requestAnimationFrame(raf);
        window.__lenis = lenis;
      } catch (e) {}
    };
    document.head.appendChild(ls);
  }

  // stagger reveals within each parent (set delays before observing)
  document.querySelectorAll('.reveal').forEach(function (el) {
    var kids = Array.prototype.filter.call(el.parentNode.children, function (c) { return c.classList && c.classList.contains('reveal'); });
    var i = kids.indexOf(el);
    if (!reduce) el.style.transitionDelay = (i * 70) + 'ms';
  });

  // family risk map inner stagger
  document.querySelectorAll('.riskmap').forEach(function (rm) {
    rm.querySelectorAll('.dot').forEach(function (d, i) { d.style.transitionDelay = (i * 120) + 'ms'; });
    rm.querySelectorAll('.link').forEach(function (l, i) { l.style.transitionDelay = (i * 120 + 80) + 'ms'; });
    rm.querySelectorAll('.rm-row').forEach(function (r, i) { r.style.transitionDelay = (320 + i * 100) + 'ms'; });
  });

  // reveal on scroll
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.16, rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

  // nav scroll progress + scrolled state
  var nav = document.querySelector('nav');
  var prog = document.getElementById('scrollProg');
  function onScroll() {
    var st = window.scrollY || document.documentElement.scrollTop || 0;
    var h = document.documentElement.scrollHeight - window.innerHeight;
    if (prog) prog.style.width = (h > 0 ? (st / h * 100) : 0) + '%';
    if (nav) nav.classList.toggle('scrolled', st > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // scrollytelling: pinned stage + steps drive what's revealed (desktop only)
  if (window.innerWidth > 900) {
    document.querySelectorAll('.scrolly-ch').forEach(function (ch) {
      ch.classList.add('scrolly');
      var steps = Array.prototype.slice.call(ch.querySelectorAll('.step'));
      var appears = ch.querySelectorAll('[data-appear]');
      function setActive(n, el) {
        appears.forEach(function (a) { a.classList.toggle('on', (+a.getAttribute('data-appear')) <= n); });
        steps.forEach(function (s) { s.classList.toggle('active', s === el); });
      }
      var so = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { setActive(+e.target.getAttribute('data-step'), e.target); } });
      }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
      steps.forEach(function (s) { so.observe(s); });
    });
  }

  // chapter spine (landing only, wide screens)
  if (document.getElementById('score-ch') && window.innerWidth > 1280) {
    var chapters = [
      { id: 'genetics', n: '01' },
      { id: 'act', n: '02' },
      { id: 'score-ch', n: '03' },
      { id: 'outcome', n: '04' },
      { id: 'parents', n: '05' }
    ];
    var spine = document.createElement('div');
    spine.className = 'spine';
    spine.setAttribute('aria-hidden', 'true');
    chapters.forEach(function (c) {
      if (!document.getElementById(c.id)) return;
      var a = document.createElement('a');
      a.href = '#' + c.id;
      a.className = 'spine-item';
      a.setAttribute('data-for', c.id);
      a.innerHTML = '<span class="tick"></span><span class="sn">' + c.n + '</span>';
      spine.appendChild(a);
    });
    document.body.appendChild(spine);
    var sItems = spine.querySelectorAll('.spine-item');
    var spineObs = new IntersectionObserver(function (es) {
      es.forEach(function (e) { e.target._inview = e.isIntersecting; });
      var activeId = null;
      chapters.forEach(function (c) { var el = document.getElementById(c.id); if (el && el._inview) activeId = c.id; });
      sItems.forEach(function (it) { it.classList.toggle('on', it.getAttribute('data-for') === activeId); });
    }, { rootMargin: '-50% 0px -50% 0px', threshold: 0 });
    chapters.forEach(function (c) { var el = document.getElementById(c.id); if (el) spineObs.observe(el); });
  }

  // mobile menu (built from the existing nav)
  var navIn = document.querySelector('nav .nav-in');
  if (navIn) {
    var linksEl = navIn.querySelector('.nav-links');
    var ctaEl = navIn.querySelector('.btn');
    var burger = document.createElement('button');
    burger.className = 'nav-burger';
    burger.setAttribute('aria-label', 'Toggle menu');
    burger.innerHTML = '<span></span><span></span>';
    navIn.appendChild(burger);
    var overlay = document.createElement('div');
    overlay.className = 'nav-overlay';
    if (linksEl) {
      linksEl.querySelectorAll('a').forEach(function (a) {
        var na = document.createElement('a');
        na.href = a.getAttribute('href');
        na.textContent = a.textContent;
        overlay.appendChild(na);
      });
    }
    if (ctaEl) {
      var nc = document.createElement('a');
      nc.href = ctaEl.getAttribute('href');
      nc.textContent = ctaEl.textContent;
      nc.className = 'ov-cta';
      overlay.appendChild(nc);
    }
    document.body.appendChild(overlay);
    burger.addEventListener('click', function () { document.body.classList.toggle('menu-open'); });
    overlay.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { document.body.classList.remove('menu-open'); });
    });
  }

  // lead form -> Formspree (falls back to demo success until a real endpoint is set)
  var form = document.getElementById('leadForm');
  if (form) {
    var okBox = document.getElementById('formSuccess');
    var errBox = document.getElementById('formError');
    function showSuccess() {
      form.style.display = 'none';
      if (okBox) { okBox.classList.add('show'); okBox.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }); }
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      if (errBox) errBox.style.display = 'none';
      var endpoint = form.getAttribute('action') || '';
      if (!endpoint || endpoint.indexOf('YOUR_FORM_ID') !== -1) { showSuccess(); return; } // demo mode until Formspree ID is set
      var btn = form.querySelector('button[type=submit]');
      var label = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Sending...'; }
      fetch(endpoint, { method: 'POST', body: new FormData(form), headers: { 'Accept': 'application/json' } })
        .then(function (res) { if (res.ok) { showSuccess(); } else { throw new Error('bad response'); } })
        .catch(function () {
          if (btn) { btn.disabled = false; btn.textContent = label; }
          if (errBox) errBox.style.display = 'block';
        });
    });
  }
})();
