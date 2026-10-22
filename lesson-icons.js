// 레슨 종목 아이콘 (시작 화면·로그인 화면·홍보영상에서 함께 사용)
// 파란 타일 위에 올라가는 64x64 컬러 아이콘입니다.
(function () {
  const ICONS = [
    {
      name: '축구',
      svg: '<circle cx="32" cy="32" r="22" fill="#fff" stroke="#191F28" stroke-width="3"/><path d="M32 22.5l9 6.6-3.4 10.6H26.4L23 29.1z" fill="#191F28"/><path d="M32 10.5v12M41 29.1l11.4-3.7M37.6 39.7l7 9.7M26.4 39.7l-7 9.7M23 29.1l-11.4-3.7" stroke="#191F28" stroke-width="3" stroke-linecap="round"/>',
    },
    {
      name: '피아노',
      svg: '<rect x="9" y="15" width="46" height="34" rx="6" fill="#fff" stroke="#191F28" stroke-width="3"/><path d="M20.5 15v34M32 15v34M43.5 15v34" stroke="#191F28" stroke-width="2.4"/><rect x="16.5" y="15" width="8" height="19" rx="2" fill="#191F28"/><rect x="28" y="15" width="8" height="19" rx="2" fill="#191F28"/><rect x="39.5" y="15" width="8" height="19" rx="2" fill="#191F28"/>',
    },
    {
      name: '영어',
      svg: '<path d="M32 18c-5-4-13-5-21-3v31c8-2 16-1 21 3 5-4 13-5 21-3V15c-8-2-16-1-21 3z" fill="#fff"/><path d="M32 18v31" stroke="#C9D3DF" stroke-width="2.4"/><path d="M11 15v31c8-2 16-1 21 3 5-4 13-5 21-3V15" fill="none" stroke="#FFC542" stroke-width="4" stroke-linejoin="round"/><path d="M16 24h10M16 30h10M38 24h10M38 30h10" stroke="#8B95A1" stroke-width="2.4" stroke-linecap="round"/>',
    },
    {
      name: '수영',
      svg: '<circle cx="24" cy="23" r="8" fill="#FFC542"/><path d="M30 31l12-6" stroke="#fff" stroke-width="5" stroke-linecap="round"/><path d="M8 40c4 0 4-3 8-3s4 3 8 3 4-3 8-3 4 3 8 3 4-3 8-3 4 3 8 3" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/><path d="M8 50c4 0 4-3 8-3s4 3 8 3 4-3 8-3 4 3 8 3 4-3 8-3 4 3 8 3" fill="none" stroke="#9CC8FF" stroke-width="4" stroke-linecap="round"/>',
    },
    {
      name: '골프',
      svg: '<ellipse cx="32" cy="50" rx="22" ry="6" fill="#2FD27A"/><path d="M27 50V12" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/><path d="M28 13l18 7-18 7z" fill="#F04452"/><circle cx="41" cy="45" r="4.5" fill="#fff"/>',
    },
    {
      name: '미술',
      svg: '<path d="M32 10C18 10 9 20 9 31c0 12 10 21 22 21 4 0 6-2 6-5 0-4-4-5-4-8 0-2 2-4 5-4h6c6 0 11-4 11-10 0-8-10-15-23-15z" fill="#FFE2B8"/><circle cx="21" cy="26" r="4" fill="#F04452"/><circle cx="31" cy="19" r="4" fill="#FFC542"/><circle cx="42" cy="22" r="4" fill="#2FD27A"/><circle cx="20" cy="38" r="4" fill="#3182F6"/>',
    },
    {
      name: '야구',
      svg: '<circle cx="32" cy="32" r="22" fill="#fff"/><path d="M17 15.5c6 9.5 6 23.5 0 33M47 15.5c-6 9.5-6 23.5 0 33" fill="none" stroke="#F04452" stroke-width="3" stroke-linecap="round" stroke-dasharray="1 5"/><path d="M17 15.5c6 9.5 6 23.5 0 33M47 15.5c-6 9.5-6 23.5 0 33" fill="none" stroke="#F04452" stroke-width="1.6"/>',
    },
    {
      name: '기타',
      svg: '<path d="M40 24l12-12" stroke="#8A5A2B" stroke-width="5" stroke-linecap="round"/><path d="M49 9l6 6" stroke="#191F28" stroke-width="4" stroke-linecap="round"/><path d="M36 22c-4-1-8 1-9 5-4 0-8 2-10 6-3 6 0 13 6 16s13 3 16-3c2-2 2-6 2-10 4-1 6-5 5-9-1-3-6-6-10-5z" fill="#FF8A3D"/><circle cx="31" cy="34" r="4" fill="#5C3410"/><path d="M27 38l15-15" stroke="#FFE2B8" stroke-width="1.6"/>',
    },
    {
      name: '테니스',
      svg: '<circle cx="32" cy="32" r="22" fill="#D7F05A"/><path d="M13 22c9 3 13 11 10 22M51 42c-9-3-13-11-10-22" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>',
    },
    {
      name: '농구',
      svg: '<circle cx="32" cy="32" r="22" fill="#FF8A3D"/><path d="M10 32h44M32 10v44M16.5 16.5c7 7 7 24 0 31M47.5 16.5c-7 7-7 24 0 31" fill="none" stroke="#5C2A0B" stroke-width="2.6"/>',
    },
  ];

  function iconSvg(i) {
    const icon = ICONS[((i % ICONS.length) + ICONS.length) % ICONS.length];
    return '<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">' + icon.svg + '</svg>';
  }

  // el 안의 아이콘을 interval(ms)마다 다음 종목으로 바꿉니다. 멈추는 함수를 돌려줍니다.
  function startCycle(el, interval) {
    if (!el) return function () {};
    let i = 0;
    el.innerHTML = '<span class="lesson-tile-icon">' + iconSvg(0) + '</span>';
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return function () {};
    const timer = setInterval(function () {
      i++;
      el.innerHTML = '<span class="lesson-tile-icon is-enter">' + iconSvg(i) + '</span>';
    }, interval);
    return function () { clearInterval(timer); };
  }

  window.LESSON_ICONS = { list: ICONS, svg: iconSvg, startCycle: startCycle };
})();
