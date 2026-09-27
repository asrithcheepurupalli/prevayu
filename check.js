// Free risk check. Runs entirely in the browser; nothing is sent.
// Diabetes: Indian Diabetes Risk Score (Mohan et al., JAPI 2005).
// Blood pressure bands: ICMR Standard Treatment Workflow, Hypertension in Adults (India). Early family heart disease: ACC/AHA 2019 risk-enhancing factor.
(function () {
  var form = document.getElementById('idrsForm');
  if (!form) return;
  var $ = function (id) { return document.getElementById(id); };
  var card = $('idrsResult'), scoreEl = $('idrsScore'), ofEl = $('idrsOf'), ansEl = $('idrsAns');
  var barEl = $('idrsBar'), rangeEl = $('idrsRange'), msgEl = $('idrsMsg'), cta = $('idrsCta'), reset = $('idrsReset');
  var keys = ['age', 'waist', 'act', 'fam'];

  var WHO = {
    me: {
      title: 'Should you get a blood test for diabetes?',
      age: 'How old are you?', waist: 'What is your waist, measured at the belly button?',
      act: 'How active are you, most weeks?', fam: 'Do your parents have diabetes?',
      bp: 'Do you know your last blood pressure reading?',
      heart: 'Did your father have a heart attack or stroke before 55, or your mother before 65?'
    },
    mother: {
      title: 'Should your mother get a blood test for diabetes?', sex: 'f',
      age: 'How old is your mother?', waist: 'What is her waist, measured at the belly button?',
      act: 'How active is she, most weeks?', fam: 'Did her parents (your grandparents) have diabetes?',
      bp: 'Do you know her last blood pressure reading?',
      heart: 'Did her father have a heart attack or stroke before 55, or her mother before 65?'
    },
    father: {
      title: 'Should your father get a blood test for diabetes?', sex: 'm',
      age: 'How old is your father?', waist: 'What is his waist, measured at the belly button?',
      act: 'How active is he, most weeks?', fam: 'Did his parents (your grandparents) have diabetes?',
      bp: 'Do you know his last blood pressure reading?',
      heart: 'Did his father have a heart attack or stroke before 55, or his mother before 65?'
    },
    other: {
      title: 'Should they get a blood test for diabetes?',
      age: 'How old are they?', waist: 'What is their waist, measured at the belly button?',
      act: 'How active are they, most weeks?', fam: 'Do their parents have diabetes?',
      bp: 'Do you know their last blood pressure reading?',
      heart: 'Did their father have a heart attack or stroke before 55, or their mother before 65?'
    }
  };

  var BAND = function (t) { return t >= 60 ? 'high' : t >= 30 ? 'moderate' : 'low'; };
  var LABEL = { low: 'Low', moderate: 'Moderate', high: 'High' };

  function answerFor(band, age35) {
    if (band === 'high') return ['Yes, soon.', 'At this score, a fasting glucose and HbA1c test is worth doing soon, read by a doctor. Many people here already have raised sugar without knowing.'];
    if (band === 'moderate') return ['Yes, in the next few months.', 'A fasting glucose and HbA1c test is the sensible next step. Activity and waist are the two things you can change.'];
    if (age35) return ['One routine test.', 'Low on this score. Guidelines still suggest a first sugar test from age 35, so one routine fasting glucose or HbA1c is sensible.'];
    return ['Not yet.', 'Low on this score. Stay active, keep an eye on the waist, and check again in a few years or if anything changes.'];
  }

  function who() { return form.ownerDocument.querySelector('input[name=who]:checked').value; }

  function applyWho() {
    var w = WHO[who()];
    $('checkTitle').textContent = w.title;
    document.querySelectorAll('[data-q]').forEach(function (el) { el.textContent = w[el.getAttribute('data-q')]; });
    var seg = $('sexSeg');
    if (w.sex) {
      form.querySelector('input[name=sex][value=' + w.sex + ']').checked = true;
      seg.hidden = true;
    } else {
      seg.hidden = false;
    }
    waistLabels();
  }

  function waistLabels() {
    var sex = form.querySelector('input[name=sex]:checked').value;
    form.querySelectorAll('[data-f]').forEach(function (s) { s.textContent = s.getAttribute('data-' + sex); });
  }

  function val(k) { var el = form.querySelector('input[name=' + k + ']:checked'); return el ? el.value : null; }

  function update() {
    var answered = keys.filter(function (k) { return val(k) !== null; }).length;
    var unsure = val('waist') === 'unsure';
    var base = 0;
    keys.forEach(function (k) { var v = val(k); if (v !== null && v !== 'unsure') base += +v; });
    var hi = unsure ? base + 20 : base;

    scoreEl.textContent = unsure ? base + ' to ' + hi : base;
    barEl.style.width = base + '%';
    rangeEl.style.left = base + '%';
    rangeEl.style.width = (hi - base) + '%';

    if (answered < keys.length) {
      ansEl.textContent = (keys.length - answered) + ' to go';
      msgEl.textContent = 'Pick one answer for each question. The score adds up as you go.';
      cta.hidden = true; reset.hidden = true; card.classList.remove('done');
      return;
    }

    var age35 = +val('age') >= 20;
    var bLo = BAND(base), bHi = BAND(hi);
    var a;
    if (bLo === bHi) {
      a = answerFor(bLo, age35);
    } else {
      var top = answerFor(bHi, age35);
      a = [top[0], 'Somewhere between ' + LABEL[bLo].toLowerCase() + ' and ' + LABEL[bHi].toLowerCase() + ' until the waist is measured. ' + top[1]];
    }
    ansEl.textContent = a[0];
    msgEl.textContent = a[1];
    cta.hidden = bHi === 'low';
    cta.href = '/get-started?who=' + who() + '&score=' + (unsure ? base + '-' + hi : base) + '&band=' + (bLo === bHi ? bHi : bLo + '-to-' + bHi);
    reset.hidden = false;
    card.classList.add('done');
  }

  document.querySelectorAll('input[name=who]').forEach(function (i) {
    i.addEventListener('change', function () { applyWho(); update(); });
  });
  form.addEventListener('change', function (e) {
    if (e.target.name === 'sex') waistLabels();
    update();
  });
  reset.addEventListener('click', function () {
    keys.forEach(function (k) { form.querySelectorAll('input[name=' + k + ']').forEach(function (i) { i.checked = false; }); });
    update();
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // Blood pressure (ICMR STW bands: normal <120/80, elevated 120-139/80-89, hypertension ≥140/90 on two visits, grade 3 ≥180/110)
  var sys = $('bpSys'), dia = $('bpDia'), bpOut = $('bpOut');
  function bp() {
    var s = +sys.value, d = +dia.value;
    if (!s || !d) { bpOut.textContent = ''; return; }
    if (s >= 180 || d >= 110) bpOut.textContent = 'Very high. Recheck after a minute of rest, and see a doctor today. With chest pain, breathlessness, weakness or a change in vision, go to a hospital now.';
    else if (s >= 140 || d >= 90) bpOut.textContent = 'In the high range. Indian guidelines confirm high blood pressure with readings on two different days, so recheck and see a doctor.';
    else if (s >= 120 || d >= 80) bpOut.textContent = 'Above normal, not high yet. Worth rechecking every few months. Salt, weight and activity move it.';
    else bpOut.textContent = 'In the normal range. Worth checking once a year.';
  }
  sys.addEventListener('input', bp); dia.addEventListener('input', bp);
  $('bpUnknown').addEventListener('click', function () {
    sys.value = ''; dia.value = '';
    bpOut.textContent = "That's common. About 7 in 10 Indians with high blood pressure don't know they have it. A reading at a pharmacy or clinic takes two minutes.";
  });

  // Early heart disease in the family (ACC/AHA 2019 risk-enhancing factor)
  var heartOut = $('heartOut');
  document.querySelectorAll('input[name=heart]').forEach(function (i) {
    i.addEventListener('change', function () {
      var v = i.value;
      heartOut.textContent = v === 'yes'
        ? 'Worth telling a doctor. Guidelines treat an early heart attack in a parent as a reason to look at heart risk more closely, and a good reason to test Lp(a) once.'
        : v === 'no'
          ? 'Good to know. Blood pressure, sugar and cholesterol are still worth checking from the 30s.'
          : 'Worth asking relatives. Family history is one of the cheapest risk checks there is.';
    });
  });

  applyWho();
  update();
})();
