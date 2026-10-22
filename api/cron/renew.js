import { adminDb, publicMessage, sendJson } from '../_lib/firebase.js';
import { chargeAndExtend, stopAutoRenew } from '../_lib/subscription.js';
import { DAY_MS } from '../_lib/toss.js';

const MAX_FAILS = 3;

// Vercel Cron(vercel.json)이 하루 한 번 호출합니다.
// 만료 24시간 안쪽으로 들어온 카드 구독을 결제하고 기간을 연장합니다.
export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    sendJson(res, 401, { error: 'Unauthorized' });
    return;
  }

  const db = adminDb();
  const now = Date.now();
  const due = await db.collection('billing').where('nextChargeAt', '<=', now + DAY_MS).get();
  const result = { due: due.size, renewed: 0, failed: 0, stopped: 0 };

  for (const doc of due.docs) {
    const uid = doc.id;
    const billing = doc.data();
    if (!billing.autoRenew || !billing.billingKey) continue;
    const failCount = billing.failCount || 0;
    const key = `renew_${uid}_${billing.nextChargeAt}_${failCount}`;
    try {
      await chargeAndExtend(uid, {
        orderId: key,
        idempotencyKey: key,
        expectNextChargeAt: billing.nextChargeAt,
      });
      result.renewed++;
    } catch (error) {
      console.error('[cron renew]', uid, error);
      const fails = failCount + 1;
      if (fails >= MAX_FAILS) {
        await stopAutoRenew(uid, 'payment_failed');
        await doc.ref.set({ failCount: fails, lastError: publicMessage(error, '결제 처리 오류') }, { merge: true });
        result.stopped++;
      } else {
        await doc.ref.set(
          { failCount: fails, lastError: publicMessage(error, '결제 처리 오류'), lastFailedAt: now, updatedAt: now },
          { merge: true }
        );
        result.failed++;
      }
    }
  }

  // 법정 보관 기간(5년)이 지난 결제 기록을 파기합니다.
  const expired = await Promise.all([
    db.collection('paymentRecords').where('retainUntil', '<=', now).limit(400).get(),
    db.collection('activationRequests').where('retainUntil', '<=', now).limit(400).get(),
  ]);
  const cleanup = db.batch();
  expired.forEach((snap) => snap.docs.forEach((d) => cleanup.delete(d.ref)));
  await cleanup.commit();
  result.purged = expired[0].size + expired[1].size;

  sendJson(res, 200, result);
}
