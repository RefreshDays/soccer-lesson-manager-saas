import { adminDb, publicMessage, userError } from '../_lib/firebase.js';
import { chargeAndExtend } from '../_lib/subscription.js';
import { cardLabelFrom, getSiteOrigin, issueBillingKey } from '../_lib/toss.js';

function redirect(res, location) {
  res.writeHead(302, { Location: location });
  res.end();
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.end('Method Not Allowed');
    return;
  }

  const origin = getSiteOrigin(req);
  const { authKey, customerKey } = req.query || {};
  const fail = (message) =>
    redirect(res, `${origin}/?subscribe=fail&message=${encodeURIComponent(message)}`);

  if (!authKey || !customerKey) {
    fail('결제 정보가 없습니다.');
    return;
  }

  // customerKey 는 결제창을 연 회원의 Firebase uid 입니다.
  const uid = String(customerKey);
  try {
    const db = adminDb();
    const userSnap = await db.doc(`users/${uid}`).get();
    if (!userSnap.exists) throw userError('회원 정보를 찾을 수 없습니다.');

    const billing = await issueBillingKey(String(authKey), uid);
    const now = Date.now();
    // 결제 직전에 회원이 동의한 정기결제 고지 내용을 결제 기록에 남깁니다.
    const consent = userSnap.data().paymentConsent || {};
    await db.doc(`billing/${uid}`).set({
      billingKey: billing.billingKey,
      consentAt: consent.agreedAt || null,
      consentVersion: consent.version || '',
      customerKey: uid,
      cardLabel: cardLabelFrom(billing),
      autoRenew: false,
      failCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    await chargeAndExtend(uid, { orderId: `sub_${uid}_${now}`, kind: 'first' });
    redirect(res, `${origin}/?subscribe=success`);
  } catch (error) {
    console.error('[toss billing-success]', error);
    fail(publicMessage(error, '구독 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.'));
  }
}
