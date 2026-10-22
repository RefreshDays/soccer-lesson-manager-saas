// 요금·기간·사업자 정보 (브라우저 화면, 약관 페이지, 서버 API가 함께 읽습니다)
// TRIAL_DAYS 를 바꾸면 firestore.rules 의 maxTrialDays() 도 같은 값으로 바꿔 주세요.
// ADMIN_EMAILS(최고 관리자)를 바꾸면 firestore.rules 의 isOwner() 도 같은 이메일로 바꿔 주세요.
// 최고 관리자는 Google 로그인(이메일 인증된 계정)으로 들어와야 권한이 인정됩니다.
(typeof window !== 'undefined' ? window : globalThis).SAAS_CONFIG = {
  SERVICE_NAME: '레슨 매니저',
  BANK: {
    bankName: '산업은행',
    accountNumber: '020-9506-0826-310',
    accountHolder: '손경희',
  },
  TRIAL_DAYS: 7,
  SUBSCRIBE_DAYS: 30,
  SUBSCRIBE_AMOUNT: 9900,
  SUBSCRIBE_ORDER_NAME: '레슨 매니저 월 구독',
  ADMIN_EMAILS: ['wonzia80@gmail.com'],

  // 화면 하단·약관·개인정보처리방침에 표시됩니다. 빈 값('')은 '(등록 예정)'으로 보입니다.
  BUSINESS: {
    tradeName: '',            // 상호 (사업자등록 후 입력)
    representative: '손경희',  // 대표자
    bizNumber: '',            // 사업자등록번호
    ecommerceNumber: '',      // 통신판매업 신고번호 (간이과세자 등 면제 시 '면제' 등으로 입력)
    address: '',              // 사업장 주소
    phone: '',                // 고객센터 전화번호 (전자상거래법상 표시 사항)
    email: 'wonzia80@gmail.com',
  },
  PRIVACY_OFFICER: {
    name: '손경희',
    email: 'wonzia80@gmail.com',
  },
  // 약관·처리방침 내용을 바꾸면 날짜를 올려 주세요. 가입 시 동의한 버전이 회원 정보에 기록됩니다.
  POLICY_VERSION: '2026-10-22',
};
