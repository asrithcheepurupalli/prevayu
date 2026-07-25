(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  // simple client-side form handler (shows success; wire to a backend later)
  var form = document.getElementById('leadForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      form.style.display = 'none';
      var ok = document.getElementById('formSuccess');
      if (ok) { ok.classList.add('show'); ok.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }); }
    });
  }
})();
