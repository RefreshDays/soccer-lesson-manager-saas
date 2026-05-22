import { approveBillingPayment, getSiteOrigin, getSubscribeConfig, issueBillingKey } from '../lib/toss.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.end('Method Not Allowed');
    return;
  }

  const origin = getSiteOrigin();
  const { authKey, customerKey } = req.query || {};

  if (!authKey || !customerKey) {
    res.writeHead(302, {
      Location: `${origin}/?subscribe=fail&message=${encodeURIComponent('결제 정보가 없습니다.')}`,
    });
    res.end();
    return;
  }

  try {
    const { amount, orderName } = getSubscribeConfig();
    const billing = await issueBillingKey(String(authKey), String(customerKey));
    const orderId = `sub_${customerKey}_${Date.now()}`;
    const payment = await approveBillingPayment(billing.billingKey, {
      customerKey: String(customerKey),
      amount,
      orderId,
      orderName,
    });

    const params = new URLSearchParams({
      subscribe: 'success',
      paymentKey: payment.paymentKey,
      orderId,
      billingKey: billing.billingKey,
    });

    res.writeHead(302, { Location: `${origin}/?${params.toString()}` });
    res.end();
  } catch (error) {
    console.error('[toss billing-success]', error);
    const message = error.message || '구독 처리에 실패했습니다.';
    res.writeHead(302, {
      Location: `${origin}/?subscribe=fail&message=${encodeURIComponent(message)}`,
    });
    res.end();
  }
}
