import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from './firebase.js';
import { PAYMENT_RECORD_RETENTION_MS } from './subscription.js';

// 회원 계정과 데이터를 삭제합니다 (로그인 계정 · 레슨 데이터 · 구독 · 카드 빌링키).
// 결제 기록(paymentRecords)과 승인된 입금 기록은 법정 보관 기간 동안 남깁니다.
export async function deleteAccount(uid) {
  const db = adminDb();
  const now = Date.now();
  await db.recursiveDelete(db.doc(`users/${uid}`));
  await db.recursiveDelete(db.doc(`billing/${uid}`));
  const [registry, requests] = await Promise.all([
    db.collection('coachRegistry').where('uid', '==', uid).get(),
    db.collection('activationRequests').where('uid', '==', uid).get(),
  ]);
  const batch = db.batch();
  registry.docs.forEach((d) => batch.delete(d.ref));
  requests.docs.forEach((d) => {
    if (d.data().status === 'approved') {
      batch.set(d.ref, { accountDeletedAt: now, retainUntil: now + PAYMENT_RECORD_RETENTION_MS }, { merge: true });
    } else {
      batch.delete(d.ref);
    }
  });
  batch.set(db.doc('config/admins'), { uids: FieldValue.arrayRemove(uid) }, { merge: true });
  await batch.commit();
  await adminAuth()
    .deleteUser(uid)
    .catch((e) => {
      if (e.code !== 'auth/user-not-found') throw e;
    });
}
