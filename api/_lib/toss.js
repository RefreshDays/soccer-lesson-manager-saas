import '../../saas-config.js';

const DAY_MS = 86400000;

function getSecretKey() {
  const secret = process.env.TOSS_SECRET_KEY;
  if (!secret) {
    const err = new Error('TOSS_SECRET_KEY 환경변수가 필요합니다.');
    err.expose = true;
    throw err;
  }
  return secret;
}

export function tossAuthHeader() {
  const encoded = Buffer.from(`${getSecretKey()}:`).toString('base64');
  return `Basic ${encoded}`;
}

async function parseTossResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || data.code || '토스페이먼츠 요청 실패');
    err.code = data.code;
    // 토스가 보낸 결제 안내 문구(예: 카드사 거절)는 사용자에게 보여줘도 됩니다.
    err.expose = true;
    throw err;
  }
  return data;
}

export async function issueBillingKey(authKey, customerKey) {
  const res = await fetch('https://api.tosspayments.com/v1/billing/authorizations/issue', {
    method: 'POST',
    headers: {
      Authorization: tossAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ authKey, customerKey }),
  });
  return parseTossResponse(res);
}

export async function approveBillingPayment(billingKey, payload, idempotencyKey) {
  const headers = {
    Authorization: tossAuthHeader(),
    'Content-Type': 'application/json',
  };
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
  const res = await fetch(`https://api.tosspayments.com/v1/billing/${encodeURIComponent(billingKey)}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  return parseTossResponse(res);
}

// 요금·기간은 saas-config.js 한 곳에서 관리합니다.
export function getSubscribeConfig() {
  const config = globalThis.SAAS_CONFIG || {};
  return {
    amount: Number(config.SUBSCRIBE_AMOUNT || 9900),
    orderName: config.SUBSCRIBE_ORDER_NAME || '레슨 매니저 월 구독',
    days: Number(config.SUBSCRIBE_DAYS || 30),
  };
}

export function getAdminEmails() {
  const config = globalThis.SAAS_CONFIG || {};
  return (config.ADMIN_EMAILS || []).map((e) => String(e || '').toLowerCase());
}

export function getSiteOrigin(req) {
  const host = req?.headers?.['x-forwarded-host'] || req?.headers?.host;
  if (host) return `https://${host}`;
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, '');
  return 'https://lesson-manager-saas.vercel.app';
}

export function cardLabelFrom(billing) {
  const number = String(billing?.cardNumber || billing?.card?.number || '');
  // 토스는 '43301234****123*' 처럼 일부를 가려서 주므로 끝 4자리를 그대로 씁니다.
  const tail = number.slice(-4);
  const company = billing?.cardCompany || '';
  return [company, tail ? `****${tail}` : ''].filter(Boolean).join(' ') || '등록 카드';
}

export { DAY_MS };
