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

  // Core fields the Lead model understands. Each may appear under a few
  // different name= spellings across the page fragments — kept as aliases
  // instead of forcing every fragment to use one exact name.
  var ALIASES = {
    name: ['name', 'fio', 'imya'],
    phone: ['phone', 'tel', 'telefon', 'contact'],
    email: ['email', 'mail'],
    program: ['program', 'programma', 'event', 'show'],
    date: ['date', 'data'],
    count: ['count', 'people', 'kol', 'quantity', 'children'],
    comment: ['comment', 'message', 'kommentariy', 'text']
  };
  var KNOWN_NAMES = [];
  Object.keys(ALIASES).forEach(function (k) {
    ALIASES[k].forEach(function (n) { KNOWN_NAMES.push(n); });
  });

  function val(form, key) {
    var names = ALIASES[key] || [key];
    for (var i = 0; i < names.length; i++) {
      var el = form.querySelector('[name="' + names[i] + '"]');
      if (el && el.value) return el.value.trim();
    }
    return '';
  }

  // A field with a name= that isn't one of the core aliases above (e.g. a
  // school's class, a partner's company, a lecture's subscription type) has
  // no dedicated Lead column — fold it into the comment instead of losing it.
  function extraFieldsText(form) {
    var parts = [];
    var els = form.querySelectorAll('[name]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var nm = el.name;
      if (!nm || KNOWN_NAMES.indexOf(nm) !== -1 || !el.value) continue;
      var label = el.id ? form.querySelector('label[for="' + el.id + '"]') : null;
      var text = label ? label.textContent.replace(/\*/g, '').trim() : nm;
      parts.push(text + ': ' + el.value);
    }
    return parts.join('; ');
  }

  function postLead(form) {
    var page = location.pathname.replace(/^\//, '') || 'home';
    var comment = val(form, 'comment');
    var extra = extraFieldsText(form);
    if (extra) comment = comment ? (comment + ' | ' + extra) : extra;
    var payload = {
      type: TYPE[page] || 'general', source: page,
      name: val(form, 'name'),
      phone: val(form, 'phone'),
      email: val(form, 'email'),
      program: val(form, 'program'),
      date: val(form, 'date'),
      count: Number(val(form, 'count') || 0),
      comment: comment
    };
    if (!payload.name && !payload.phone) return Promise.resolve(false);
    return fetch('/api/leads', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (res) { return res.ok; }).catch(function () { return false; });
  }

  function thanks(form) {
    try {
      form.style.display = 'none';
      var s = form.nextElementSibling;
      if (s && s.classList && s.classList.contains('form-success')) { s.style.display = 'block'; return; }
      var d = document.createElement('div');
      d.className = 'form-success';
      d.textContent = 'Спасибо! Заявка отправлена. Менеджер свяжется с вами.';
      d.style.cssText = 'display:block;padding:1rem;background:var(--cream);border-radius:var(--radius);margin-top:1rem;text-align:center;';
      if (form.parentNode) form.parentNode.insertBefore(d, form.nextSibling);
    } catch (e) {}
  }

  function showFormError(form) {
    try {
      if (form.parentNode && form.parentNode.querySelector('.js-form-error')) return;
      var d = document.createElement('div');
      d.className = 'js-form-error';
      d.textContent = 'Не удалось отправить заявку. Попробуйте ещё раз или позвоните нам напрямую.';
      d.style.cssText = 'padding:0.75rem 1rem;background:#fff3f3;color:#8B1A2F;border:1px solid #f0c9c9;border-radius:8px;margin-top:0.75rem;font-size:0.85rem;';
      if (form.parentNode) form.parentNode.insertBefore(d, form.nextSibling);
    } catch (e) {}
  }

  function handle(e) {
    if (e && e.preventDefault) e.preventDefault();
    var form = (e && (e.target || e.srcElement)) || null;
    if (form && form.tagName !== 'FORM') form = form.closest ? form.closest('form') : form;
    if (!form) return false;
    postLead(form).then(function (ok) {
      if (ok) thanks(form); else showFormError(form);
    });
    return false;
  }

  window.submitForm = function (e) { return handle(e); };
  // Legacy handler names from her original site-runtime.js (pre-dates the
  // /api/leads integration, when forms opened a Telegram deep-link instead).
  // Kept overridden here for backward compatibility with any old markup.
  ['sendTourToMax', 'sendHomeToMax', 'sendPartnersToMax', 'sendLektsiiToMax', 'sendTeatrToMax', 'sendToWhatsApp']
    .forEach(function (fn) { window[fn] = function (e) { return handle(e); }; });
})();
