// Join the pilot: three short steps, a live family card, and a Formspree submit.
(function () {
  var form = document.getElementById('joinForm');
  if (!form) return;
  var $ = function (id) { return document.getElementById(id); };
  var steps = [].slice.call(form.querySelectorAll('.jstep'));
  var bars = [].slice.call(form.querySelectorAll('.join-prog span'));
  var cur = 1;

  var FIRST = {
    'Type 2 diabetes': 'The diabetes risk check, then a fasting glucose and HbA1c test if the score is moderate or high.',
    'High blood pressure': 'Blood pressure readings on two different days, the way Indian guidelines confirm it.',
    'Heart attack or stroke': 'Blood pressure, cholesterol and a one-time Lp(a) test. An early heart attack in a parent is worth telling the doctor.',
    'Cancer': 'Which cancer and at what age, so the doctor can tell you if screening should start earlier.',
    'Weak bones or arthritis': 'Bone-strengthening habits, and a check if anyone has broken a bone in a small fall.',
    'Thyroid': 'Tell the doctor. A thyroid test only when there are symptoms or a reason.',
    'Not sure': 'A short call to piece the family history together. Most families know more than they think.'
  };
  var WHO_NODES = {
    'Me': ['me'], 'Me and a parent': ['me', 'mother'],
    'My whole family': ['mother', 'father', 'me', 'sib'], 'Someone else in my family': ['sib']
  };

  function checked(name) { return [].slice.call(form.querySelectorAll('input[name=' + name + ']:checked')).map(function (i) { return i.value; }); }
  function digits() { return ($('jphone').value || '').replace(/\D/g, '').replace(/^91(?=\d{10}$)/, ''); }
  function phoneOk() { return /^[6-9]\d{9}$/.test(digits()); }

  function valid(n) {
    if (n === 1) return checked('who').length === 1;
    if (n === 2) {
      var city = checked('city')[0];
      return checked('runs').length > 0 && !!city && (city !== 'Other' || $('cityOther').value.trim().length > 1);
    }
    return $('jname').value.trim().length > 1 && phoneOk() && $('jconsent').checked;
  }

  function show(n) {
    cur = n;
    steps.forEach(function (s) { s.classList.toggle('on', +s.getAttribute('data-step') === n); });
    bars.forEach(function (b, i) { b.classList.toggle('on', i < n); });
    $('stepLabel').textContent = 'Step ' + n + ' of 3';
    refresh();
    var first = steps[n - 1].querySelector('input');
    if (first && window.innerWidth > 900) first.focus({ preventScroll: true });
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function refresh() {
    steps.forEach(function (s) {
      var n = +s.getAttribute('data-step');
      var nx = s.querySelector('[data-next]');
      if (nx) nx.disabled = !valid(n);
    });
    $('jsubmit').disabled = !valid(3);

    var who = checked('who')[0];
    var runs = checked('runs');
    var city = checked('city')[0];
    $('sumWho').textContent = who || 'Not chosen yet';
    $('sumRuns').textContent = runs.length ? runs.join(', ') : 'Not chosen yet';
    $('sumCity').textContent = city ? (city === 'Other' ? ($('cityOther').value.trim() || 'Somewhere else') : city) : 'Not chosen yet';
    document.querySelectorAll('#famViz .n').forEach(function (n) {
      n.classList.toggle('on', !!who && WHO_NODES[who].indexOf(n.getAttribute('data-k')) >= 0);
    });

    var lines = runs.map(function (r) { return FIRST[r]; }).filter(Boolean).slice(0, 3);
    $('firstText').innerHTML = lines.length
      ? '<ul>' + lines.map(function (l) { return '<li>' + l + '</li>'; }).join('') + '</ul>'
      : (who ? 'Tell us what runs in the family, and we will show what usually comes first.' : 'Choose who this is for, and we will show what usually comes first.');

    var here = who === 'Someone else in my family' ? 'Where do they live?' : 'Where do you live?';
    $('whereQ').textContent = here;
  }

  form.addEventListener('change', function (e) {
    var t = e.target;
    if (t.name === 'runs') {
      if (t.hasAttribute('data-exclusive') && t.checked) {
        form.querySelectorAll('input[name=runs]').forEach(function (i) { if (i !== t) i.checked = false; });
      } else if (t.checked) {
        var ns = form.querySelector('input[name=runs][data-exclusive]'); if (ns) ns.checked = false;
      }
    }
    if (t.name === 'city') $('cityOther').hidden = t.value !== 'Other';
    if (t.name === 'who' && cur === 1) setTimeout(function () { if (valid(1)) show(2); }, 250);
    refresh();
  });
  form.addEventListener('input', function (e) {
    if (e.target.id === 'jphone') {
      var d = digits();
      $('phoneErr').hidden = d.length < 10 || phoneOk();
    }
    refresh();
  });
  $('jphone').addEventListener('blur', function () { $('phoneErr').hidden = !digits().length || phoneOk(); });
  form.querySelectorAll('[data-next]').forEach(function (b) { b.addEventListener('click', function () { if (valid(cur)) show(cur + 1); }); });
  form.querySelectorAll('[data-back]').forEach(function (b) { b.addEventListener('click', function () { show(cur - 1); }); });

  // Carry over a result from the homepage risk check
  var q = new URLSearchParams(location.search);
  var map = { me: 'Me', other: 'Someone else in my family' };
  if (q.get('score')) {
    var whoTxt = { me: 'you', mother: 'your mother', father: 'your father', other: 'them' }[q.get('who')] || 'them';
    var riskTxt = q.get('score').replace('-', ' to ') + ' / 100' + (q.get('band') ? ', ' + q.get('band').replace(/-/g, ' ') : '') + ', for ' + whoTxt;
    $('riskField').value = riskTxt;
    $('sumRisk').textContent = riskTxt;
    $('sumRiskRow').hidden = false;
  }
  if (map[q.get('who')]) {
    var r = form.querySelector('input[name=who][value="' + map[q.get('who')] + '"]');
    if (r) r.checked = true;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!valid(3)) return;
    var btn = $('jsubmit'); btn.disabled = true; btn.textContent = 'Sending...';
    $('sendErr').hidden = true;
    var fd = new FormData(form);
    fd.set('phone', '+91 ' + digits());
    fd.set('runs', checked('runs').join(', '));
    fetch(form.action, { method: 'POST', body: fd, headers: { Accept: 'application/json' } })
      .then(function (res) { if (!res.ok) throw new Error('bad'); done(); })
      .catch(function () { btn.disabled = false; btn.textContent = 'Join the pilot'; $('sendErr').hidden = false; });
  });

  function done() {
    form.hidden = true;
    document.querySelector('.jcard').hidden = true;
    var d = $('joinDone'); d.hidden = false;
    var msg = 'I signed up for the Prevayu pilot, a free check of whether what runs in my family is heading for me: https://prevayu.com';
    $('shareWa').href = 'https://wa.me/?text=' + encodeURIComponent(msg);
    d.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  refresh();
})();
