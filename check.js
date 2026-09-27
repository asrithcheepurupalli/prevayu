// Indian Diabetes Risk Score (Mohan et al., JAPI 2005). Runs entirely in the browser; nothing is sent.
(function () {
  var form = document.getElementById('idrsForm');
  if (!form) return;
  var scoreEl = document.getElementById('idrsScore');
  var bandEl = document.getElementById('idrsBand');
  var barEl = document.getElementById('idrsBar');
  var msgEl = document.getElementById('idrsMsg');
  var cta = document.getElementById('idrsCta');
  var reset = document.getElementById('idrsReset');
  var card = document.getElementById('idrsResult');
  var keys = ['age', 'waist', 'act', 'fam'];

  var MSG = {
    low: 'Low risk on this score. Keep active, keep the waist in check, and check again in a few years or if anything changes.',
    moderate: 'Moderate risk. Worth a fasting glucose and HbA1c test in the next few months, and a closer look at activity and waist.',
    high: 'High risk. A fasting glucose and HbA1c test is worth doing soon, read by a doctor. Many people at this score already have raised sugar without knowing.'
  };

  function waistLabels() {
    var sex = form.querySelector('input[name=sex]:checked').value;
    form.querySelectorAll('[data-f]').forEach(function (s) { s.textContent = s.getAttribute('data-' + sex); });
  }

  function update() {
    var total = 0, answered = 0;
    keys.forEach(function (k) {
      var el = form.querySelector('input[name=' + k + ']:checked');
      if (el) { total += +el.value; answered++; }
    });
    scoreEl.textContent = total;
    barEl.style.width = total + '%';
    if (answered < keys.length) {
      bandEl.textContent = (keys.length - answered) + ' to go';
      msgEl.textContent = 'Pick one answer for each question. The score adds up as you go.';
      cta.hidden = true; reset.hidden = true;
      card.classList.remove('done');
      return;
    }
    var band = total >= 60 ? 'high' : total >= 30 ? 'moderate' : 'low';
    bandEl.textContent = band.charAt(0).toUpperCase() + band.slice(1) + ' risk';
    msgEl.textContent = MSG[band];
    cta.hidden = band === 'low';
    reset.hidden = false;
    card.classList.add('done');
  }

  form.addEventListener('change', function (e) {
    if (e.target.name === 'sex') waistLabels();
    update();
  });
  reset.addEventListener('click', function () {
    keys.forEach(function (k) { form.querySelectorAll('input[name=' + k + ']').forEach(function (i) { i.checked = false; }); });
    update();
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  waistLabels();
  update();
})();
