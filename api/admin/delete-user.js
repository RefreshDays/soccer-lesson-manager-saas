import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, adminDb, isAdminToken, readJsonBody, sendJson, verifyIdToken } from '../_lib/firebase.js';
import { getAdminEmails } from '../_lib/toss.js';

// 관리자가 회원을 완전히 삭제합니다 (로그인 계정 · 레슨 데이터 · 구독 · 카드 정보).
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method Not Allowed' });
    return;
  }
  try {
    const { idToken, uid } = readJsonBody(req);
    const admin = await verifyIdToken(idToken);
    const ownerEmails = getAdminEmails();
    if (!(await isAdminToken(admin, ownerEmails))) {
      sendJson(res, 403, { error: '관리자만 삭제할 수 있습니다.' });
      return;
    }
    if (!uid || typeof uid !== 'string') {
      sendJson(res, 400, { error: '삭제할 회원 정보가 없습니다.' });
      return;
    }
    if (uid === admin.uid) {
      sendJson(res, 400, { error: '관리자 본인 계정은 삭제할 수 없습니다.' });
      return;
    }

    const target = await adminAuth()
      .getUser(uid)
      .catch(() => null);
    if (target && ownerEmails.includes(String(target.email || '').toLowerCase())) {
      sendJson(res, 400, { error: '최고 관리자 계정은 삭제할 수 없습니다.' });
      return;
    }

    const db = adminDb();
    await db.recursiveDelete(db.doc(`users/${uid}`));
    await db.recursiveDelete(db.doc(`billing/${uid}`));
    const [registry, requests] = await Promise.all([
      db.collection('coachRegistry').where('uid', '==', uid).get(),
      db.collection('activationRequests').where('uid', '==', uid).get(),
    ]);
    const batch = db.batch();
    registry.docs.forEach((d) => batch.delete(d.ref));
    requests.docs.forEach((d) => batch.delete(d.ref));
    batch.set(db.doc('config/admins'), { uids: FieldValue.arrayRemove(uid) }, { merge: true });
    await batch.commit();
    await adminAuth()
      .deleteUser(uid)
      .catch((e) => {
        if (e.code !== 'auth/user-not-found') throw e;
      });

    sendJson(res, 200, { ok: true });
  } catch (error) {
    console.error('[admin delete-user]', error);
    sendJson(res, 400, { error: error.message || '삭제에 실패했습니다.' });
  }
}
