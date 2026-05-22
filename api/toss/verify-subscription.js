import { getPayment, getSubscribeConfig, verifyFirebaseIdToken } from '../lib/toss.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const { paymentKey, orderId, billingKey, idToken } = body;

    if (!paymentKey || !orderId || !billingKey || !idToken) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: '필수 정보가 없습니다.' }));
      return;
    }

    const uid = await verifyFirebaseIdToken(idToken);
    if (!String(orderId).startsWith(`sub_${uid}_`)) {
      res.statusCode = 403;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: '주문 정보가 일치하지 않습니다.' }));
      return;
    }

    const payment = await getPayment(String(paymentKey));
    if (payment.status !== 'DONE') {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: '결제가 완료되지 않았습니다.' }));
      return;
    }

    if (payment.orderId !== orderId) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: '결제 주문번호가 일치하지 않습니다.' }));
      return;
    }

    const { amount, days } = getSubscribeConfig();
    const now = Date.now();

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        subscription: {
          status: 'active',
          plan: 'monthly',
          startedAt: now,
          expiresAt: now + days * 86400000,
          billingKey: String(billingKey),
          customerKey: uid,
          lastPaymentKey: payment.paymentKey,
          lastOrderId: orderId,
          amount,
          provider: 'toss',
          updatedAt: now,
        },
      })
    );
  } catch (error) {
    console.error('[toss verify-subscription]', error);
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: error.message || '구독 확인에 실패했습니다.' }));
  }
}
