    (function(){
      // Calendar exists only on the tickets page; skip on all other pages.
      if(!document.getElementById('calGrid')){return;}
      var WD_SHORT=['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];
      var WD_FULL=['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'];
      var MON_GEN=['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
      var MON_NOM=['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];

      // 0=Вс,1=Пн,...,6=Сб
      var SCHED={
        // ── Понедельник ──────────────────────────────────────────────────
        1:[
          {t:'10:00',te:'20:00',n:'Свободное посещение',tp:'free',age:0,dur:600,
           desc:'Самостоятельное изучение всех залов в своём темпе · взрослый 700 ₽ · детский 500 ₽',
           price:'от 500 ₽',seats:30,allday:true},
          {t:'10:00',te:'19:00',n:'Интерактивная экскурсия',tp:'excursion',age:6,dur:60,
           desc:'Каждый час · путешествие по всем залам с актёром-персонажем, стрельба из лука, чаепитие · взрослый 1 700 ₽ · детский 1 500 ₽',
           price:'от 1 500 ₽',seats:15,hourly:true},
          {t:'10:00',te:'19:00',n:'Квест «Здравствуй, сказка!»',tp:'quest',age:4,dur:45,
           desc:'Захватывающий квест по залам музея · 4+ · до 10 человек · бронирование по времени',
           price:'800 ₽/чел.',seats:10,allday:true},
          {t:'10:00',te:'19:00',n:'Квест «В поисках сокровища»',tp:'quest',age:7,dur:60,
           desc:'Квест-приключение с тайным кладом · 7+ · до 10 человек · бронирование по времени',
           price:'1 000 ₽/чел.',seats:10,allday:true},
          {t:'10:00',te:'19:00',n:'Квест «Седьмая тайна»',tp:'quest',age:10,dur:75,
           desc:'Сложный квест с загадками и испытаниями · 10+ · до 10 человек · бронирование по времени',
           price:'1 000 ₽/чел.',seats:10,allday:true},
          {t:'12:00',n:'МК «Народная кукла»',tp:'workshop',age:5,dur:45,
           desc:'Традиционная кукла-оберег без лица своими руками · 5+ · до 12 человек',
           price:'500 ₽/чел.',seats:12},
          {t:'13:00',n:'МК «Крупеничка»',tp:'workshop',age:7,dur:60,
           desc:'Кукла-зернушка — символ достатка и урожая · 7+ · до 10 человек',
           price:'1 500 ₽/чел.',seats:10},
          {t:'14:00',n:'МК «Народная кукла»',tp:'workshop',age:5,dur:45,
           desc:'Традиционная кукла-оберег без лица своими руками · 5+ · до 12 человек',
           price:'500 ₽/чел.',seats:12},
          {t:'15:00',n:'МК «Крупеничка»',tp:'workshop',age:7,dur:60,
           desc:'Кукла-зернушка — символ достатка и урожая · 7+ · до 10 человек',
           price:'1 500 ₽/чел.',seats:10},
          {t:'16:00',n:'МК «Народная кукла»',tp:'workshop',age:5,dur:45,
           desc:'Традиционная кукла-оберег без лица своими руками · 5+ · до 12 человек',
           price:'500 ₽/чел.',seats:12},
          {t:'17:00',n:'МК «Свеча из вощины»',tp:'workshop',age:6,dur:45,
           desc:'Ароматная свеча из натурального пчелиного воска · 6+ · до 12 человек',
           price:'1 500 ₽/чел.',seats:12},
          {t:'17:00',n:'Клуб богатырей',tp:'show',age:6,dur:45,
           desc:'Испытания силы и ловкости с профессиональными актёрами · 6+ · до 15 человек · ребёнок 1 000 ₽ · сопровождающий 500 ₽',
           price:'от 500 ₽',seats:12},
          {t:'19:00',n:'Клуб богатырей',tp:'show',age:6,dur:45,
           desc:'Испытания силы и ловкости с профессиональными актёрами · 6+ · до 15 человек · ребёнок 1 000 ₽ · сопровождающий 500 ₽',
           price:'от 500 ₽',seats:12},
          {t:'19:00',n:'МК «Сумка в технике лубок»',tp:'workshop',age:6,dur:90,
           desc:'Роспись льняной сумки в технике русского лубка · 6+ · до 10 человек',
           price:'уточняйте',seats:10},
        ],
        // ── Вторник ──────────────────────────────────────────────────────
        2:[
          {t:'10:00',te:'20:00',n:'Свободное посещение',tp:'free',age:0,dur:600,
           desc:'Самостоятельное изучение всех залов в своём темпе · взрослый 700 ₽ · детский 500 ₽',
           price:'от 500 ₽',seats:30,allday:true},
          {t:'10:00',te:'19:00',n:'Интерактивная экскурсия',tp:'excursion',age:6,dur:60,
           desc:'Каждый час · путешествие по всем залам с актёром-персонажем, стрельба из лука, чаепитие · взрослый 1 700 ₽ · детский 1 500 ₽',
           price:'от 1 500 ₽',seats:15,hourly:true},
          {t:'10:00',te:'19:00',n:'Квест «Здравствуй, сказка!»',tp:'quest',age:4,dur:45,
           desc:'Захватывающий квест по залам музея · 4+ · до 10 человек',
           price:'800 ₽/чел.',seats:10,allday:true},
          {t:'10:00',te:'19:00',n:'Квест «В поисках сокровища»',tp:'quest',age:7,dur:60,
           desc:'Квест-приключение с тайным кладом · 7+ · до 10 человек',
           price:'1 000 ₽/чел.',seats:10,allday:true},
          {t:'10:00',te:'19:00',n:'Квест «Седьмая тайна»',tp:'quest',age:10,dur:75,
           desc:'Сложный квест с загадками и испытаниями · 10+ · до 10 человек',
           price:'1 000 ₽/чел.',seats:10,allday:true},
          {t:'16:00',n:'«Гуси-Лебеди» для малышей',tp:'show',age:0,dur:35,
           desc:'Иммерсивный спектакль · 0+ · до 10 детей · живые актёры в народных костюмах',
           price:'1 000 ₽/чел.',seats:8},
          {t:'17:00',n:'МК «Сумка в технике лубок»',tp:'workshop',age:6,dur:90,
           desc:'Роспись льняной сумки в технике русского лубка · 6+ · до 10 человек',
           price:'уточняйте',seats:10},
          {t:'19:00',n:'Иммерсивные чтения + Клуб богатырей',tp:'show',age:6,dur:90,
           desc:'Живое чтение сказок с актёрами + богатырские испытания · ребёнок 1 500 ₽ · сопровождающий 500 ₽',
           price:'от 500 ₽',seats:10},
          {t:'19:00',n:'Лекторий «Русский фольклор»',tp:'lecture',age:18,dur:90,
           desc:'Авторская лекция с чаепитием из самовара · 18+ · до 15 человек · другой зал',
           price:'уточняйте',seats:12},
        ],
        // ── Среда (закрытие в 18:00, вечерние программы — отдельный формат) ──
        3:[
          {t:'10:00',te:'18:00',n:'Свободное посещение',tp:'free',age:0,dur:480,
           desc:'Самостоятельное изучение всех залов · закрытие в 18:00 · взрослый 700 ₽ · детский 500 ₽',
           price:'от 500 ₽',seats:30,allday:true},
          {t:'10:00',te:'17:00',n:'Интерактивная экскурсия',tp:'excursion',age:6,dur:60,
           desc:'Каждый час · путешествие по всем залам с актёром-персонажем, стрельба из лука, чаепитие · взрослый 1 700 ₽ · детский 1 500 ₽',
           price:'от 1 500 ₽',seats:15,hourly:true},
          {t:'10:00',te:'17:00',n:'Квест «Здравствуй, сказка!»',tp:'quest',age:4,dur:45,
           desc:'Захватывающий квест по залам музея · 4+ · до 10 человек',
           price:'800 ₽/чел.',seats:10,allday:true},
          {t:'10:00',te:'17:00',n:'Квест «В поисках сокровища»',tp:'quest',age:7,dur:60,
           desc:'Квест-приключение с тайным кладом · 7+',
           price:'1 000 ₽/чел.',seats:10,allday:true},
          {t:'10:00',te:'17:00',n:'Квест «Седьмая тайна»',tp:'quest',age:10,dur:75,
           desc:'Сложный квест с загадками и испытаниями · 10+',
           price:'1 000 ₽/чел.',seats:10,allday:true},
          {t:'17:00',n:'МК «Сумка в технике лубок»',tp:'workshop',age:6,dur:90,
           desc:'Роспись льняной сумки в технике русского лубка · 6+ · до 10 человек',
           price:'уточняйте',seats:10},
          {t:'19:30',n:'Мрачный фольклор',tp:'show',age:18,dur:75,
           desc:'Иммерсивный спектакль 18+ · тёмная сторона русских поверий, обрядов и преданий',
           price:'2 500 ₽',seats:8,few:true},
        ],
        // ── Четверг ──────────────────────────────────────────────────────
        4:[
          {t:'10:00',te:'20:00',n:'Свободное посещение',tp:'free',age:0,dur:600,
           desc:'Самостоятельное изучение всех залов в своём темпе · взрослый 700 ₽ · детский 500 ₽',
           price:'от 500 ₽',seats:30,allday:true},
          {t:'10:00',te:'19:00',n:'Интерактивная экскурсия',tp:'excursion',age:6,dur:60,
           desc:'Каждый час · путешествие по всем залам с актёром-персонажем, стрельба из лука, чаепитие · взрослый 1 700 ₽ · детский 1 500 ₽',
           price:'от 1 500 ₽',seats:15,hourly:true},
          {t:'10:00',te:'19:00',n:'Квест «Здравствуй, сказка!»',tp:'quest',age:4,dur:45,
           desc:'Захватывающий квест по залам музея · 4+',
           price:'800 ₽/чел.',seats:10,allday:true},
          {t:'10:00',te:'19:00',n:'Квест «В поисках сокровища»',tp:'quest',age:7,dur:60,
           desc:'Квест-приключение с тайным кладом · 7+',
           price:'1 000 ₽/чел.',seats:10,allday:true},
          {t:'10:00',te:'19:00',n:'Квест «Седьмая тайна»',tp:'quest',age:10,dur:75,
           desc:'Сложный квест с загадками и испытаниями · 10+',
           price:'1 000 ₽/чел.',seats:10,allday:true},
          {t:'16:00',n:'«Гуси-Лебеди» для малышей',tp:'show',age:0,dur:35,
           desc:'Иммерсивный спектакль · 0+ · до 10 детей · живые актёры в народных костюмах',
           price:'1 000 ₽/чел.',seats:8},
          {t:'17:00',n:'МК «Свеча из вощины»',tp:'workshop',age:6,dur:45,
           desc:'Ароматная свеча из натурального пчелиного воска · 6+ · до 12 человек',
           price:'1 500 ₽/чел.',seats:12},
          {t:'19:00',n:'МК «Сумка в технике лубок»',tp:'workshop',age:6,dur:90,
           desc:'Роспись льняной сумки в технике русского лубка · 6+ · до 10 человек',
           price:'уточняйте',seats:10},
        ],
        // ── Пятница ──────────────────────────────────────────────────────
        5:[
          {t:'10:00',te:'20:00',n:'Свободное посещение',tp:'free',age:0,dur:600,
           desc:'Самостоятельное изучение всех залов в своём темпе · взрослый 700 ₽ · детский 500 ₽',
           price:'от 500 ₽',seats:30,allday:true},
          {t:'10:00',te:'19:00',n:'Интерактивная экскурсия',tp:'excursion',age:6,dur:60,
           desc:'Каждый час · путешествие по всем залам с актёром-персонажем, стрельба из лука, чаепитие · взрослый 1 700 ₽ · детский 1 500 ₽',
           price:'от 1 500 ₽',seats:15,hourly:true},
          {t:'10:00',te:'19:00',n:'Квест «Здравствуй, сказка!»',tp:'quest',age:4,dur:45,
           desc:'Захватывающий квест по залам музея · 4+',
           price:'800 ₽/чел.',seats:10,allday:true},
          {t:'10:00',te:'19:00',n:'Квест «В поисках сокровища»',tp:'quest',age:7,dur:60,
           desc:'Квест-приключение с тайным кладом · 7+',
           price:'1 000 ₽/чел.',seats:10,allday:true},
          {t:'10:00',te:'19:00',n:'Квест «Седьмая тайна»',tp:'quest',age:10,dur:75,
           desc:'Сложный квест с загадками и испытаниями · 10+',
           price:'1 000 ₽/чел.',seats:10,allday:true},
          {t:'17:00',n:'Иммерсивные чтения сказок',tp:'show',age:6,dur:45,
           desc:'Живое чтение сказок с актёрами в атмосфере музея · ребёнок 1 000 ₽ · сопровождающий 500 ₽',
           price:'от 500 ₽',seats:10},
          {t:'17:00',n:'МК «Сумка в технике лубок»',tp:'workshop',age:6,dur:90,
           desc:'Роспись льняной сумки в технике русского лубка · 6+ · до 10 человек',
           price:'уточняйте',seats:10},
          {t:'19:00',n:'Иммерсивные чтения сказок',tp:'show',age:6,dur:45,
           desc:'Живое чтение сказок с актёрами в атмосфере музея · ребёнок 1 000 ₽ · сопровождающий 500 ₽',
           price:'от 500 ₽',seats:10},
          {t:'19:00',n:'МК «Свеча из вощины»',tp:'workshop',age:6,dur:45,
           desc:'Ароматная свеча из натурального пчелиного воска · 6+ · до 12 человек',
           price:'1 500 ₽/чел.',seats:12},
        ],
        // ── Суббота (выходные цены) ───────────────────────────────────────
        6:[
          {t:'10:00',te:'20:00',n:'Свободное посещение',tp:'free',age:0,dur:600,
           desc:'Самостоятельное изучение всех залов в своём темпе · взрослый 900 ₽ · детский 700 ₽',
           price:'от 700 ₽',seats:30,allday:true,pop:true},
          {t:'10:00',te:'19:00',n:'Интерактивная экскурсия',tp:'excursion',age:6,dur:60,
           desc:'Каждый час · путешествие по всем залам с актёром-персонажем, стрельба из лука, чаепитие · взрослый 1 900 ₽ · детский 1 700 ₽',
           price:'от 1 700 ₽',seats:15,hourly:true,pop:true},
          {t:'10:00',te:'19:00',n:'Квест «Здравствуй, сказка!»',tp:'quest',age:4,dur:45,
           desc:'Захватывающий квест по залам музея · 4+',
           price:'800 ₽/чел.',seats:10,allday:true},
          {t:'10:00',te:'19:00',n:'Квест «В поисках сокровища»',tp:'quest',age:7,dur:60,
           desc:'Квест-приключение с тайным кладом · 7+',
           price:'1 000 ₽/чел.',seats:8,allday:true},
          {t:'10:00',te:'19:00',n:'Квест «Седьмая тайна»',tp:'quest',age:10,dur:75,
           desc:'Сложный квест с загадками и испытаниями · 10+',
           price:'1 000 ₽/чел.',seats:6,allday:true,few:true},
          {t:'16:00',n:'«Гуси-Лебеди» для малышей',tp:'show',age:0,dur:35,
           desc:'Иммерсивный спектакль · 0+ · до 10 детей · живые актёры в народных костюмах',
           price:'1 000 ₽/чел.',seats:5,few:true},
          {t:'17:00',n:'МК «Свеча из вощины»',tp:'workshop',age:6,dur:45,
           desc:'Ароматная свеча из натурального пчелиного воска · 6+ · до 12 человек',
           price:'1 500 ₽/чел.',seats:12},
          {t:'19:00',n:'МК «Сумка в технике лубок»',tp:'workshop',age:6,dur:90,
           desc:'Роспись льняной сумки в технике русского лубка · 6+ · до 10 человек',
           price:'уточняйте',seats:10},
        ],
        // ── Воскресенье (выходные цены) ───────────────────────────────────
        0:[
          {t:'10:00',te:'18:00',n:'Свободное посещение',tp:'free',age:0,dur:480,
           desc:'Самостоятельное изучение всех залов · взрослый 900 ₽ · детский 700 ₽',
           price:'от 700 ₽',seats:30,allday:true,pop:true},
          {t:'10:00',te:'17:00',n:'Интерактивная экскурсия',tp:'excursion',age:6,dur:60,
           desc:'Каждый час · путешествие по всем залам с актёром-персонажем, стрельба из лука, чаепитие · взрослый 1 900 ₽ · детский 1 700 ₽',
           price:'от 1 700 ₽',seats:15,hourly:true,pop:true},
          {t:'10:00',te:'17:00',n:'Квест «Здравствуй, сказка!»',tp:'quest',age:4,dur:45,
           desc:'Захватывающий квест по залам музея · 4+',
           price:'800 ₽/чел.',seats:10,allday:true},
          {t:'10:00',te:'17:00',n:'Квест «В поисках сокровища»',tp:'quest',age:7,dur:60,
           desc:'Квест-приключение с тайным кладом · 7+',
           price:'1 000 ₽/чел.',seats:8,allday:true},
          {t:'10:00',te:'17:00',n:'Квест «Седьмая тайна»',tp:'quest',age:10,dur:75,
           desc:'Сложный квест с загадками и испытаниями · 10+',
           price:'1 000 ₽/чел.',seats:7,allday:true},
          {t:'12:00',n:'МК «Народная кукла»',tp:'workshop',age:5,dur:45,
           desc:'Традиционная кукла-оберег без лица своими руками · 5+ · до 12 человек',
           price:'500 ₽/чел.',seats:12},
          {t:'13:00',n:'МК «Крупеничка»',tp:'workshop',age:7,dur:60,
           desc:'Кукла-зернушка — символ достатка и урожая · 7+ · до 10 человек',
           price:'1 500 ₽/чел.',seats:10},
          {t:'14:00',n:'МК «Народная кукла»',tp:'workshop',age:5,dur:45,
           desc:'Традиционная кукла-оберег без лица своими руками · 5+',
           price:'500 ₽/чел.',seats:12},
          {t:'15:00',n:'МК «Крупеничка»',tp:'workshop',age:7,dur:60,
           desc:'Кукла-зернушка — символ достатка и урожая · 7+',
           price:'1 500 ₽/чел.',seats:10},
          {t:'16:00',n:'МК «Народная кукла»',tp:'workshop',age:5,dur:45,
           desc:'Традиционная кукла-оберег без лица своими руками · 5+',
           price:'500 ₽/чел.',seats:12},
          {t:'17:00',n:'МК «Сумка в технике лубок»',tp:'workshop',age:6,dur:90,
           desc:'Роспись льняной сумки в технике русского лубка · 6+ · до 10 человек',
           price:'уточняйте',seats:10},
          {t:'19:30',n:'Мрачный фольклор',tp:'show',age:18,dur:75,
           desc:'Иммерсивный спектакль 18+ · тёмная сторона русских поверий, обрядов и преданий',
           price:'2 500 ₽',seats:6,few:true},
        ],
      };

      function endT(t,d){var p=t.split(':'),h=+p[0],m=+p[1]+d;h+=Math.floor(m/60);m%=60;return(h<10?'0':'')+h+':'+(m<10?'0':'')+m;}
      function today0(){var d=new Date();d.setHours(0,0,0,0);return d;}

      var curYear, curMonth, selDate=null, filt='all';

      function initMonth(){var n=today0();curYear=n.getFullYear();curMonth=n.getMonth();}

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
          var hasSched=!!(SCHED[wd]&&SCHED[wd].length);
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
        renderSched();
        // On mobile scroll to schedule
        if(window.innerWidth<900){
          document.getElementById('schBody').scrollIntoView({behavior:'smooth',block:'start'});
        }
      }

      function renderSched(){
        if(!selDate){return;}
        var wd=selDate.getDay();
        var sessions=(SCHED[wd]||[]).slice().sort(function(a,b){return a.t.localeCompare(b.t);});
        // Date header
        var wdNames=['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'];
        var monNames=['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
        document.getElementById('schDate').textContent=selDate.getDate()+' '+monNames[selDate.getMonth()]+' '+selDate.getFullYear()+', '+wdNames[wd];
        // Filter
        var list=sessions.filter(function(s){return filt==='all'||s.tp===filt;});
        var body=document.getElementById('schBody');
        if(!list.length){body.innerHTML='<div class="sch-empty"><div class="sch-empty__ico">🔍</div>Сеансов по выбранному фильтру нет</div>';return;}
        body.innerHTML=list.map(function(s){
          var sold=s.sold||s.seats===0;
          var few=!sold&&(s.few||s.seats<=5);
          var seatsHtml=sold?'<span class="sch-seats--sold">Все билеты проданы</span>':few?'<span class="sch-seats--few">Осталось '+s.seats+' мест</span>':'<span class="sch-seats--ok">Мест: '+s.seats+'</span>';
          var endStr=s.te?('до '+s.te):('до '+endT(s.t,s.dur));
          var timeBoxHtml=s.hourly
            ?'<div class="sch-timebox"><span class="sch-time" style="font-size:0.68rem;padding:0.22rem 0;line-height:1.2">каждый<br>час</span><span class="sch-time-end">'+s.t+'–'+s.te+'</span></div>'
            :s.allday
            ?'<div class="sch-timebox"><span class="sch-time" style="font-size:0.72rem;padding:0.22rem 0">с '+s.t+'</span><span class="sch-time-end">'+endStr+'</span></div>'
            :'<div class="sch-timebox"><span class="sch-time">'+s.t+'</span><span class="sch-time-end">'+endStr+'</span></div>';
          var tags='<span class="sch-tag sch-tag--age">'+s.age+'+ лет</span>'
            +(s.hourly?'':'<span class="sch-tag sch-tag--dur">'+s.dur+' мин</span>')
            +(s.allday?'<span class="sch-tag" style="background:#e8f5e9;color:#2e7d32;border-radius:20px;padding:0.18rem 0.55rem;font-size:0.7rem;font-weight:600">весь день</span>':'')
            +(s.hourly?'<span class="sch-tag sch-tag--pop">⏰ каждый час</span>':'')
            +(s.pop?'<span class="sch-tag sch-tag--pop">★ Популярно</span>':'');
          var btn=sold?'<button class="sch-btn sch-btn--sold" disabled>Продано</button>':'<button class="sch-btn sch-btn--buy" onclick="document.getElementById(\'booking\').scrollIntoView({behavior:\'smooth\'})">Купить билет</button>';
          return '<div class="sch-row'+(sold?' sch-row--sold':'')+'">'
            +timeBoxHtml
            +'<div class="sch-info"><div class="sch-name">'+s.n+'</div><div class="sch-desc">'+s.desc+'</div><div class="sch-tags">'+tags+' '+seatsHtml+'</div></div>'
            +'<div class="sch-right"><div class="sch-price">'+s.price+'</div>'+btn+'</div>'
            +'</div>';
        }).join('');
      }

      // Month nav
      document.getElementById('calPrev').addEventListener('click',function(){
        curMonth--;if(curMonth<0){curMonth=11;curYear--;}buildCal();
      });
      document.getElementById('calNext').addEventListener('click',function(){
        curMonth++;if(curMonth>11){curMonth=0;curYear++;}buildCal();
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
      buildCal();
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
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  const page = document.getElementById('page-' + id);
  if (page) {
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
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  const page = document.getElementById('page-' + id);
  if (page) {
    page.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try { history.pushState(null, '', '#' + id); } catch(e) {}
  }
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

