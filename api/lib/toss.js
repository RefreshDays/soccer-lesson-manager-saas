function getSecretKey() {
  const secret = process.env.TOSS_SECRET_KEY;
  if (!secret) throw new Error('TOSS_SECRET_KEY 환경변수가 필요합니다.');
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

export async function approveBillingPayment(billingKey, payload) {
  const res = await fetch(`https://api.tosspayments.com/v1/billing/${billingKey}`, {
    method: 'POST',
    headers: {
      Authorization: tossAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return parseTossResponse(res);
}

export function getSubscribeConfig() {
  return {
    amount: Number(process.env.TOSS_SUBSCRIBE_AMOUNT || 9900),
    orderName: process.env.TOSS_SUBSCRIBE_ORDER_NAME || '축구 레슨 매니저 월 구독',
    days: Number(process.env.TOSS_SUBSCRIBE_DAYS || 30),
  };
}

export function getSiteOrigin() {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, '');
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'https://soccer-lesson-manager-saas.vercel.app';
}
