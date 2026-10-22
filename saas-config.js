// 요금·기간 설정 (브라우저 화면과 서버 API가 함께 읽습니다)
// TRIAL_DAYS 를 바꾸면 firestore.rules 의 maxTrialDays() 도 같은 값으로 바꿔 주세요.
(typeof window !== 'undefined' ? window : globalThis).SAAS_CONFIG = {
  BANK: {
    bankName: '국민은행',
    accountNumber: '000-000-000000',
    accountHolder: '루비셀',
  },
  TRIAL_DAYS: 7,
  SUBSCRIBE_DAYS: 30,
  SUBSCRIBE_AMOUNT: 9900,
  SUBSCRIBE_ORDER_NAME: '축구 레슨 매니저 월 구독',
  ADMIN_EMAILS: ['sonkh@rubycell.co.kr'],
};
