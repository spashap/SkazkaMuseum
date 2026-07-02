// Loaded AFTER her original site-runtime.js. Overrides only two things:
//   1. navigation (showPage) — turns her SPA page-switch into real route navigation
//   2. form submit handlers — send site forms to /api/leads (admin "Заявки") instead of Telegram
(function () {
  // --- navigation ---
  window.showPage = function (id) {
    var p = id === 'home' ? '/' : '/' + id;
    if (location.pathname !== p) location.href = p;
  };

  // --- forms → /api/leads ---
  var TYPE = {
    tours: 'excursion', birthday: 'birthday', schools: 'school', kindergarten: 'kindergarten',
    masterclasses: 'masterclass', kvesty: 'quest', teatr: 'theatre', lektsii: 'lecture',
    partners: 'partner', tickets: 'ticket'
  };
  function val(form, names) {
    for (var i = 0; i < names.length; i++) {
      var el = form.querySelector('[name="' + names[i] + '"]');
      if (el && el.value) return el.value.trim();
    }
    return '';
  }
  function postLead(form) {
    var page = location.pathname.replace(/^\//, '') || 'home';
    var payload = {
      type: TYPE[page] || 'general', source: page,
      name: val(form, ['name', 'fio', 'imya']),
      phone: val(form, ['phone', 'tel', 'telefon']),
      email: val(form, ['email', 'mail']),
      program: val(form, ['program', 'programma', 'event']),
      date: val(form, ['date', 'data']),
      count: Number(val(form, ['count', 'people', 'kol', 'quantity']) || 0),
      comment: val(form, ['comment', 'message', 'kommentariy', 'text'])
    };
    if (!payload.name && !payload.phone) return; // nothing to send
    try {
      fetch('/api/leads', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (e) {}
  }
  function thanks(form) {
    try {
      form.style.display = 'none';
      var s = form.nextElementSibling;
      if (s) { s.style.display = 'block'; return; }
      var d = document.createElement('div');
      d.textContent = 'Спасибо! Заявка отправлена. Менеджер свяжется с вами.';
      d.style.cssText = 'padding:1rem;background:var(--cream);border-radius:var(--radius);margin-top:1rem;';
      if (form.parentNode) form.parentNode.appendChild(d);
    } catch (e) {}
  }
  function handle(e) {
    if (e && e.preventDefault) e.preventDefault();
    var form = (e && (e.target || e.srcElement)) || null;
    if (form && form.tagName !== 'FORM') form = form.closest ? form.closest('form') : form;
    if (form) { postLead(form); thanks(form); }
    return false;
  }
  window.submitForm = function (e) { return handle(e); };
  ['sendTourToMax', 'sendHomeToMax', 'sendPartnersToMax', 'sendLektsiiToMax', 'sendTeatrToMax', 'sendToWhatsApp']
    .forEach(function (fn) { window[fn] = function (e) { return handle(e); }; });
})();
