import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, userError } from './firebase.js';
import { approveBillingPayment, DAY_MS, getSubscribeConfig } from './toss.js';

// 남은 구독 기간이 있으면 그 끝에서, 없으면 지금부터 연장합니다.
export function extendBase(sub, now) {
  if (sub?.status === 'active' && (sub.expiresAt || 0) > now) return sub.expiresAt;
  // 체험 중에 미리 구독하면 남은 체험 기간 뒤로 이어집니다.
  const trialEnd = sub?.status === 'trial' ? sub.trialEndsAt || sub.expiresAt || 0 : 0;
  if (trialEnd > now) return trialEnd;
  return now;
}

// 저장된 빌링키로 결제하고 구독 기간을 연장합니다.
// expectNextChargeAt 을 넘기면 그 사이 다른 실행이 이미 처리한 경우 연장하지 않습니다(중복 실행 방지).
// 결제 기록은 전자상거래법에 따라 5년간 보관합니다 (회원 탈퇴 후에도 유지).
export const PAYMENT_RECORD_RETENTION_MS = 5 * 365 * DAY_MS;

export async function chargeAndExtend(uid, { orderId, idempotencyKey, expectNextChargeAt, kind = 'renewal' }) {
  const db = adminDb();
  const userRef = db.doc(`users/${uid}`);
  const billingRef = db.doc(`billing/${uid}`);
  const billingSnap = await billingRef.get();
  const billing = billingSnap.exists ? billingSnap.data() : null;
  if (!billing?.billingKey) throw userError('등록된 카드가 없습니다.');

  const { amount, orderName, days } = getSubscribeConfig();
  const payment = await approveBillingPayment(
    billing.billingKey,
    { customerKey: billing.customerKey || uid, amount, orderId, orderName },
    idempotencyKey
  );
  if (payment.status !== 'DONE') throw userError('결제가 완료되지 않았습니다.');

  const now = Date.now();
  let expiresAt = 0;
  await db.runTransaction(async (tx) => {
    const [userSnap, freshBilling] = await Promise.all([tx.get(userRef), tx.get(billingRef)]);
    if (expectNextChargeAt !== undefined && freshBilling.data()?.nextChargeAt !== expectNextChargeAt) {
      expiresAt = userSnap.data()?.subscription?.expiresAt || 0;
      return;
    }
    const user = userSnap.exists ? userSnap.data() : {};
    const sub = user.subscription || {};
    const continuing = sub.status === 'active' && sub.provider === 'toss' && (sub.expiresAt || 0) > now;
    expiresAt = extendBase(sub, now) + days * DAY_MS;
    tx.set(
      userRef,
      {
        subscription: {
          status: 'active',
          plan: 'monthly',
          provider: 'toss',
          startedAt: continuing ? sub.startedAt || now : now,
          expiresAt,
          amount,
          autoRenew: true,
          cardLabel: billing.cardLabel || '',
          lastPaymentAt: now,
          updatedAt: now,
        },
        updatedAt: now,
      },
      { merge: true }
    );
    tx.set(
      billingRef,
      {
        autoRenew: true,
        nextChargeAt: expiresAt,
        failCount: 0,
        lastError: FieldValue.delete(),
        lastPaymentKey: payment.paymentKey,
        lastOrderId: orderId,
        lastPaymentAt: now,
        updatedAt: now,
      },
      { merge: true }
    );
    tx.set(db.doc(`paymentRecords/${orderId}`), {
      uid,
      email: user.email || '',
      coachName: user.coachName || '',
      orderId,
      orderName,
      paymentKey: payment.paymentKey,
      amount,
      method: 'card',
      kind,
      cardLabel: billing.cardLabel || '',
      status: payment.status,
      approvedAt: payment.approvedAt || null,
      consentAt: billing.consentAt || null,
      consentVersion: billing.consentVersion || '',
      createdAt: now,
      retainUntil: now + PAYMENT_RECORD_RETENTION_MS,
    });
  });
  return { expiresAt, payment };
}

// 자동결제를 끕니다. 이미 결제한 기간(expiresAt)까지는 계속 이용할 수 있습니다.
export async function stopAutoRenew(uid, reason) {
  const db = adminDb();
  const now = Date.now();
  const batch = db.batch();
  batch.set(
    db.doc(`billing/${uid}`),
    { autoRenew: false, nextChargeAt: FieldValue.delete(), stoppedReason: reason, updatedAt: now },
    { merge: true }
  );
  batch.set(
    db.doc(`users/${uid}`),
    { subscription: { autoRenew: false, updatedAt: now }, updatedAt: now },
    { merge: true }
  );
  await batch.commit();
}
