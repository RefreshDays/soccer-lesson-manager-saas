// 시연·영상 촬영용 가상 데이터 (관리 화면에서 최고 관리자만 불러올 수 있습니다)
(function () {
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // days: 0=일 … 6=토, regMonth: 몇 달 전 등록(0=이번 달), keep: 남길 잔여 회차(없으면 자연스럽게)
  const PEOPLE = [
    { name: '김하은', by: 2014, g: '여성', aff: '피아노 · 체르니 30', memo: '12월 콩쿠르 준비 중. 왼손 연습 보강.', days: [2, 4], time: '16:00', regMonth: 5, regDay: 6, pack: 10, price: 50000, parent: true, keep: 2 },
    { name: '이준호', by: 2009, g: '남성', aff: '영어 회화 · △△고', memo: '수능 영어 + 회화 병행.', days: [1, 3], time: '19:00', regMonth: 4, regDay: 3, pack: 8, price: 55000, keep: 0 },
    { name: '박서준', by: 2013, g: '남성', aff: '축구 · ○○초 축구부', memo: '골키퍼 개인 훈련.', days: [6], time: '10:00', regMonth: 3, regDay: 9, pack: 8, price: 45000, parent: true },
    { name: '최민지', by: 1995, g: '여성', aff: '성인 필라테스', memo: '1:1 기구 필라테스. 허리 주의.', days: [2, 5], time: '20:00', regMonth: 5, regDay: 14, pack: 10, price: 60000, keep: 1 },
    { name: '정우진', by: 2012, g: '남성', aff: '수영 · 자유형', memo: '호흡 교정 중.', days: [1], time: '17:00', regMonth: 2, regDay: 11, pack: 8, price: 40000, parent: true },
    { name: '한지민', by: 1988, g: '여성', aff: '골프 · 입문', memo: '드라이버 스윙 교정.', days: [3], time: '11:00', regMonth: 2, regDay: 20, pack: 10, price: 70000 },
    { name: '윤서아', by: 2016, g: '여성', aff: '미술 · 수채화', memo: '색감이 좋음. 풍경화 진행.', days: [5], time: '15:00', regMonth: 1, regDay: 4, pack: 8, price: 40000, parent: true },
    { name: '강도윤', by: 2010, g: '남성', aff: '통기타 · 중급', memo: '핑거스타일 곡 연습.', days: [4], time: '18:30', regMonth: 1, regDay: 12, pack: 8, price: 45000, parent: true },
    { name: '오수빈', by: 2001, g: '여성', aff: '테니스', memo: '백핸드 집중.', days: [6], time: '14:00', regMonth: 1, regDay: 22, pack: 10, price: 55000 },
    { name: '임태양', by: 2011, g: '남성', aff: '농구 · 중등부', memo: '슈팅 폼 교정.', days: [0], time: '11:00', regMonth: 0, regDay: 2, pack: 8, price: 40000, parent: true },
    { name: '송예린', by: 2015, g: '여성', aff: '바이올린 · 스즈키 2권', memo: '활 쓰기 연습.', days: [3], time: '16:30', regMonth: 0, regDay: 5, pack: 8, price: 50000, parent: true },
    { name: '장현우', by: 1992, g: '남성', aff: '보컬 트레이닝', memo: '고음 발성. 축가 준비.', days: [1], time: '20:30', regMonth: 0, regDay: 8, pack: 8, price: 60000 },
  ];

  // 오늘 레슨 (시간순) — 앞의 둘은 완료
  const TODAY = [
    { who: '한지민', time: '10:00', done: true },
    { who: '윤서아', time: '13:30', done: true },
    { who: '김하은', time: '16:00' },
    { who: '강도윤', time: '18:30' },
    { who: '이준호', time: '20:00' },
  ];
  // 처리 안 된 지난 레슨
  const OVERDUE = [{ who: '정우진', daysAgo: 3, time: '17:00' }, { who: '오수빈', daysAgo: 1, time: '14:00' }];

  function phoneFor(r) { return '010-' + (2000 + Math.floor(r() * 7000)) + '-' + (1000 + Math.floor(r() * 8999)); }

  function build(now) {
    const r = rng(20261022);
    const today = new Date(now || Date.now());
    today.setHours(12, 0, 0, 0);
    const todayIso = iso(today);
    const players = [];
    const schedules = [];
    let sid = 0;
    const idOf = {};

    PEOPLE.forEach((p, i) => {
      const id = 'demo' + (i + 1);
      idOf[p.name] = id;
      const reg = new Date(today.getFullYear(), today.getMonth() - p.regMonth, Math.min(p.regDay, 28), 12);
      if (reg > today) reg.setDate(1);
      const overdue = OVERDUE.find((o) => o.who === p.name);
      const overdueIso = overdue ? iso(addDays(today, -overdue.daysAgo)) : null;

      // 지난 레슨: 등록일 ~ 어제
      const doneDates = [];
      for (let d = new Date(reg); iso(d) < todayIso; d = addDays(d, 1)) {
        if (!p.days.includes(d.getDay())) continue;
        const dIso = iso(d);
        if (dIso === overdueIso) continue;
        const canceled = r() < 0.07;
        schedules.push({ id: 'ds' + ++sid, date: dIso, time: p.time, player_id: id, status: canceled ? 'canceled' : 'completed' });
        if (!canceled) doneDates.push(dIso);
      }
      if (overdue) schedules.push({ id: 'ds' + ++sid, date: overdueIso, time: overdue.time, player_id: id, status: 'scheduled' });
      const todays = TODAY.find((t) => t.who === p.name);
      if (todays) {
        schedules.push({ id: 'ds' + ++sid, date: todayIso, time: todays.time, player_id: id, status: todays.done ? 'completed' : 'scheduled' });
        if (todays.done) doneDates.push(todayIso);
      }
      // 앞으로 2주 예정
      for (let k = 1; k <= 14; k++) {
        const d = addDays(today, k);
        if (p.days.includes(d.getDay())) schedules.push({ id: 'ds' + ++sid, date: iso(d), time: p.time, player_id: id, status: 'scheduled' });
      }

      // 결제: 등록일에 첫 결제, 회차를 다 쓰면 그날 다시 결제
      const used = doneDates.length;
      const target = p.keep != null ? used + p.keep : null;
      const history = [];
      let total = 0;
      const pay = (date, sessions) => { history.push({ date, amount: sessions * p.price, sessions }); total += sessions; };
      pay(iso(reg), p.pack);
      const need = () => (target != null ? total < target : total < used || total - used < 3);
      while (need()) pay(doneDates[Math.min(total, used) - 1] || iso(reg), p.pack);
      if (target != null && total > target) {
        const last = history[history.length - 1];
        const fixed = last.sessions - (total - target);
        if (fixed > 0) { last.sessions = fixed; last.amount = fixed * p.price; total = target; }
      }

      players.push({
        id, name: p.name, birth_year: p.by, gender: p.g,
        phone: phoneFor(r), parent_phone: p.parent ? phoneFor(r) : '',
        registered_at: iso(reg), affiliation: p.aff, memo: p.memo,
        payment_history: history, used_sessions: used,
      });
    });
    return { players, schedules };
  }

  window.buildShowcaseData = build;
})();
