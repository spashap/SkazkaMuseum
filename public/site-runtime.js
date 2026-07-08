document.documentElement.classList.add('js-ready'); // disables the CSS no-JS fallback for .fade-up

    (function(){
      // Calendar exists only on the tickets page; skip on all other pages.
      if(!document.getElementById('calGrid')){return;}
      var WD_FULL=['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'];
      var MON_GEN=['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
      var MON_NOM=['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
      // Filter chip values match Program.type 1:1 except "workshop" (chip) <-> "masterclass" (Program.type).
      var FILT_TYPE={workshop:'masterclass'};

      function pad(n){return (n<10?'0':'')+n;}
      function dateKey(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
      function today0(){var d=new Date();d.setHours(0,0,0,0);return d;}
      // Sessions are always in Moscow time (the museum's one timezone) — format
      // explicitly against it so a visitor's own device timezone can't shift the
      // displayed time away from what's shown in the admin calendar.
      var timeFmt=new Intl.DateTimeFormat('ru-RU',{hour:'2-digit',minute:'2-digit',hourCycle:'h23',timeZone:'Europe/Moscow'});
      function fmtTime(iso){return timeFmt.format(new Date(iso));}
      function priceLabel(s){
        if(!s.priceAdult&&!s.priceChild){return 'по запросу';}
        if(s.priceChild&&s.priceChild!==s.priceAdult){return 'от '+Math.min(s.priceAdult,s.priceChild)+' ₽';}
        return (s.priceAdult||s.priceChild)+' ₽';
      }

      var curYear, curMonth, selDate=null, filt='all';
      var monthDates=null; // Set of 'YYYY-MM-DD' with sessions, for the visible month
      var daySessions=[]; // last sessions fetched for selDate

      function initMonth(){var n=today0();curYear=n.getFullYear();curMonth=n.getMonth();}

      function loadMonth(){
        fetch('/api/sessions?year='+curYear+'&month='+(curMonth+1))
          .then(function(r){return r.json();})
          .then(function(data){monthDates=new Set(data.dates||[]);buildCal();})
          .catch(function(){monthDates=new Set();buildCal();});
      }

      function buildCal(){
        var t0=today0();
        document.getElementById('calTitle').textContent=MON_NOM[curMonth]+' '+curYear;
        var grid=document.getElementById('calGrid');
        grid.innerHTML='';
        // Day headers starting Monday
        var wdOrder=['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
        wdOrder.forEach(function(w){var d=document.createElement('div');d.className='cal-wd';d.textContent=w;grid.appendChild(d);});
        // First day of month
        var first=new Date(curYear,curMonth,1);
        var startWd=(first.getDay()+6)%7; // Mon=0
        for(var i=0;i<startWd;i++){var e=document.createElement('div');e.className='cal-day cal-day--empty';grid.appendChild(e);}
        var daysInMonth=new Date(curYear,curMonth+1,0).getDate();
        for(var d=1;d<=daysInMonth;d++){
          var dt=new Date(curYear,curMonth,d);
          var wd=dt.getDay();
          var isWeekend=(wd===0||wd===6);
          var isPast=dt<t0;
          var isToday=dt.getTime()===t0.getTime();
          var hasSched=!!(monthDates&&monthDates.has(dateKey(dt)));
          var isSel=selDate&&dt.getTime()===selDate.getTime();
          var cls='cal-day'+(isPast?' cal-day--past':'')+(isToday?' cal-day--today':'')+(isSel?' cal-day--sel':'')+(isWeekend?' cal-day--weekend':'')+(hasSched&&!isPast?' cal-day--ev':' cal-day--noev');
          var cell=document.createElement('div');
          cell.className=cls;
          cell.innerHTML=d+'<span class="cal-dot"></span>';
          if(!isPast&&hasSched){
            (function(date){cell.addEventListener('click',function(){selectDate(date);});})(dt);
          }
          grid.appendChild(cell);
        }
      }

      function selectDate(d){
        selDate=d;
        buildCal();
        document.getElementById('schDate').textContent=d.getDate()+' '+MON_GEN[d.getMonth()]+' '+d.getFullYear()+', '+WD_FULL[d.getDay()];
        document.getElementById('schBody').innerHTML='<div class="sch-empty"><div class="sch-empty__ico">⏳</div>Загрузка расписания…</div>';
        fetch('/api/sessions?date='+dateKey(d))
          .then(function(r){return r.json();})
          .then(function(data){daySessions=data.sessions||[];renderSched();})
          .catch(function(){daySessions=[];renderSched();});
        // On mobile scroll to schedule
        if(window.innerWidth<900){
          document.getElementById('schBody').scrollIntoView({behavior:'smooth',block:'start'});
        }
      }

      function renderSched(){
        if(!selDate){return;}
        var list=daySessions
          .filter(function(s){return filt==='all'||s.type===(FILT_TYPE[filt]||filt);})
          .slice().sort(function(a,b){return a.startAt.localeCompare(b.startAt);});
        var body=document.getElementById('schBody');
        if(!list.length){body.innerHTML='<div class="sch-empty"><div class="sch-empty__ico">🔍</div>Сеансов по выбранному фильтру нет</div>';return;}
        body.innerHTML=list.map(function(s){
          var sold=!!s.sold;
          var few=!sold&&s.free<=5;
          var seatsHtml=sold?'<span class="sch-seats--sold">Все билеты проданы</span>':few?'<span class="sch-seats--few">Осталось '+s.free+' мест</span>':'<span class="sch-seats--ok">Мест: '+s.free+'</span>';
          var timeBoxHtml='<div class="sch-timebox"><span class="sch-time">'+fmtTime(s.startAt)+'</span><span class="sch-time-end">до '+fmtTime(s.endAt)+'</span></div>';
          var tags=(s.ageLimit?'<span class="sch-tag sch-tag--age">'+s.ageLimit+' лет</span>':'')
            +'<span class="sch-tag sch-tag--dur">'+s.durationMin+' мин</span>';
          var btn=sold?'<button class="sch-btn sch-btn--sold" disabled>Продано</button>':'<button class="sch-btn sch-btn--buy" onclick="window.addToCart(\''+s.id+'\')">Купить билет</button>';
          return '<div class="sch-row'+(sold?' sch-row--sold':'')+'">'
            +timeBoxHtml
            +'<div class="sch-info"><div class="sch-name">'+s.title+'</div><div class="sch-desc">'+(s.shortDesc||'')+'</div><div class="sch-tags">'+tags+' '+seatsHtml+'</div></div>'
            +'<div class="sch-right"><div class="sch-price">'+priceLabel(s)+'</div>'+btn+'</div>'
            +'</div>';
        }).join('');
      }

      // Adds the clicked session to the cart (shared localStorage format with
      // src/lib/cart.ts) and goes to /tickets/cart — no form on this page anymore.
      window.addToCart=function(eventId){
        var s=null;
        for(var i=0;i<daySessions.length;i++){ if(daySessions[i].id===eventId){ s=daySessions[i]; break; } }
        if(!s){ location.href='/tickets/cart'; return; }
        var cart=[];
        try{ cart=JSON.parse(localStorage.getItem('museum_cart')||'[]'); }catch(e){ cart=[]; }
        var existing=null;
        for(var j=0;j<cart.length;j++){ if(cart[j].eventId===eventId){ existing=cart[j]; break; } }
        if(existing){ existing.qty=(existing.qty||1)+1; }
        else{
          cart.push({
            eventId:s.id, title:s.title, startAt:s.startAt, endAt:s.endAt,
            priceAdult:s.priceAdult||0, priceChild:s.priceChild||0, qty:1
          });
        }
        localStorage.setItem('museum_cart', JSON.stringify(cart));
        location.href='/tickets/cart';
      };

      // Month nav
      document.getElementById('calPrev').addEventListener('click',function(){
        curMonth--;if(curMonth<0){curMonth=11;curYear--;}loadMonth();
      });
      document.getElementById('calNext').addEventListener('click',function(){
        curMonth++;if(curMonth>11){curMonth=0;curYear++;}loadMonth();
      });

      // Filter chips
      document.getElementById('schFilters').addEventListener('click',function(e){
        var c=e.target.closest('.sch-chip');if(!c)return;
        this.querySelectorAll('.sch-chip').forEach(function(x){x.classList.remove('sch-chip--on');});
        c.classList.add('sch-chip--on');filt=c.dataset.v;renderSched();
      });

      // Details arrow
      var det=document.querySelector('details');
      if(det){det.addEventListener('toggle',function(){var arr=document.getElementById('льготыArr');if(arr){arr.textContent=this.open?'▼':'▶';}});}

      initMonth();
      loadMonth();
      // Auto-select today
      selectDate(today0());
    })();

function sendHomeToMax(e){
  e.preventDefault();
  var f=e.target;
  var msg='ЗАЯВКА С САЙТА%0A';
  msg+='Программа: '+f.program.value+'%0A';
  msg+='Имя: '+f.name.value+'%0A';
  msg+='Телефон: '+f.phone.value+'%0A';
  if(f.date.value) msg+='Дата: '+f.date.value+'%0A';
  if(f.count.value) msg+='Количество: '+f.count.value+' чел.%0A';
  if(f.comment.value) msg+='Комментарий: '+f.comment.value+'%0A';
  window.open('https://t.me/museum_skazki?text='+msg,'_blank');
  f.style.display='none';
  var success=f.nextElementSibling;
  if(success) success.style.display='block';
}
function sendTourToMax(e){
  e.preventDefault();
  var f=e.target;
  var msg='ЭКСКУРСИЯ - Заявка%0A';
  msg+='Программа: '+f.program.value+'%0A';
  msg+='Имя: '+f.name.value+'%0A';
  msg+='Телефон: '+f.phone.value+'%0A';
  if(f.date.value) msg+='Дата: '+f.date.value+'%0A';
  if(f.count.value) msg+='Количество: '+f.count.value+' чел.%0A';
  if(f.comment.value) msg+='Комментарий: '+f.comment.value+'%0A';
  window.open('https://t.me/museum_skazki?text='+msg,'_blank');
  f.style.display='none';
  var success=f.nextElementSibling;
  if(success) success.style.display='block';
}
function sendPartnersToMax(e){
  e.preventDefault();
  var f=e.target;
  var fields=f.querySelectorAll('input,select,textarea');
  var name=fields[0].value, phone=fields[1].value, company=fields[2].value, format=fields[3].value, comment=fields[4].value;
  var msg='ПАРТНЁРЫ - Заявка%0A';
  msg+='Имя: '+name+'%0A';
  msg+='Телефон: '+phone+'%0A';
  if(company) msg+='Компания/канал: '+company+'%0A';
  msg+='Формат: '+format+'%0A';
  if(comment) msg+='Комментарий: '+comment+'%0A';
  window.open('https://t.me/museum_skazki?text='+msg,'_blank');
}
function sendLektsiiToMax(e){
  e.preventDefault();
  var f=e.target;
  var fields=f.querySelectorAll('input,select,textarea');
  var name=fields[0].value, phone=fields[1].value, lektsiya=fields[2].value, abonement=fields[3].value, comment=fields[4].value;
  var msg='ЛЕКЦИИ - Запись%0A';
  msg+='Имя: '+name+'%0A';
  msg+='Телефон: '+phone+'%0A';
  msg+='Лекция: '+lektsiya+'%0A';
  msg+='Абонемент: '+abonement+'%0A';
  if(comment) msg+='Комментарий: '+comment+'%0A';
  window.open('https://t.me/museum_skazki?text='+msg,'_blank');
}
function sendTeatrToMax(e){
  e.preventDefault();
  var f=e.target;
  var msg='ТЕАТР - Бронирование%0A';
  msg+='Спектакль: '+f.show.value+'%0A';
  msg+='Дата: '+f.date.value+'%0A';
  msg+='Детей: '+f.children.value+'%0A';
  msg+='Взрослых: '+(f.adults.value||'0')+'%0A';
  msg+='Имя: '+f.name.value+'%0A';
  msg+='Контакт: '+f.contact.value+'%0A';
  if(f.comment.value) msg+='Комментарий: '+f.comment.value+'%0A';
  window.open('https://t.me/museum_skazki?text='+msg,'_blank');
}
function showPage(id) {
  // Each page is its own route now; the target section usually is NOT in the DOM.
  // Find it BEFORE hiding anything, otherwise a click leaves a blank page.
  // (site-overrides.js replaces this with real navigation once it loads.)
  const page = document.getElementById('page-' + id);
  if (!page) {
    window.location.href = id === 'home' ? '/' : '/' + id;
    return;
  }
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  page.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  // Обновляем URL для SEO и шаринга
  try {
    if (id === 'home') {
      history.pushState(null, '', window.location.pathname);
    } else {
      history.pushState(null, '', '#' + id);
    }
  } catch(e) {}
}

// Инициализация: читаем hash при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
  const hash = window.location.hash.replace('#', '');
  const validPages = ['tickets','tours','birthday','schools','kindergarten','masterclasses','kvesty','teatr','reviews','contacts','poleznoe','skazki'];
  if (hash && validPages.includes(hash)) {
    showPage(hash);
  }
  // Обработка кнопки "назад/вперёд" в браузере
  window.addEventListener('popstate', function() {
    const h = window.location.hash.replace('#', '');
    showPage(h && validPages.includes(h) ? h : 'home');
  });
});

function showArticle(id) {
  // Same guard as showPage: never hide the current page when the target is missing.
  const page = document.getElementById('page-' + id);
  if (!page) return;
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  page.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  try { history.pushState(null, '', '#' + id); } catch(e) {}
}

function showForm(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function submitForm(e, form) {
  e.preventDefault();
  form.style.display = 'none';
  const success = form.nextElementSibling;
  if (success) success.style.display = 'block';
}

function toggleMobile() {
  var nav = document.getElementById('mobileNav');
  if (nav) nav.classList.toggle('open');
}
function closeMobile() {
  var nav = document.getElementById('mobileNav');
  if (nav) nav.classList.remove('open');
}

// FAQ
document.querySelectorAll('.faq__question').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.parentElement;
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq__item.open').forEach(el => el.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  });
});

// Scroll header
const header = document.querySelector('.header');
if (header) {
  window.addEventListener('scroll', () => {
    header.style.background = window.scrollY > 60 ? 'rgba(26,18,9,0.99)' : 'rgba(26,18,9,0.95)';
  }, { passive: true });
}

// Animate on scroll
const obs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.opacity = '1';
      e.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.08 });

document.querySelectorAll('.adv-card,.visit-card,.review-card,.ticket-card,.package-card,.program-card,.catalog-card,.skazka-card,.poleznoe-card').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(18px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  obs.observe(el);
});

  // Fade-up animations
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if(e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

  // --- FAQ toggle (new accordion) ---
  function toggleFaqItem(btn) {
    const item = btn.closest('.faq__item');
    const wasActive = item.classList.contains('active');
    document.querySelectorAll('.faq__item').forEach(i => i.classList.remove('active'));
    if (!wasActive) item.classList.add('active');
  }

  // --- Booking option selector ---
  let selectedBookingType = 'Семья';
  function selectBookingOption(el, type) {
    document.querySelectorAll('.booking__option').forEach(o => o.classList.remove('active'));
    el.classList.add('active');
    selectedBookingType = type || 'Семья';
  }

  // --- WhatsApp form ---
  function sendToWhatsApp() {
    const name  = (document.getElementById('bName')  || {}).value || 'Гость';
    const phone = (document.getElementById('bPhone') || {}).value || 'не указан';
    const date  = (document.getElementById('bDate')  || {}).value || 'уточним';
    const count = (document.getElementById('bCount') || {}).value || 'уточним';
    const msg = [
      'Здравствуйте! Хочу забронировать путешествие.',
      'Тип: ' + selectedBookingType,
      'Имя: ' + name.trim(),
      'Телефон: ' + phone.trim(),
      'Дата: ' + date.trim(),
      'Количество: ' + count.trim() + ' чел.'
    ].join('\n');
    window.open('https://wa.me/78120000000?text=' + encodeURIComponent(msg), '_blank');
  }

  // --- Hero scroll ---
  const heroScrollBtn = document.getElementById('heroScroll');
  if (heroScrollBtn) {
    heroScrollBtn.addEventListener('click', () => {
      const next = document.querySelector('.marquee-wrap') || document.querySelector('.stats');
      if (next) next.scrollIntoView({ behavior: 'smooth' });
    });
  }

