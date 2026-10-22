import { deleteAccount } from '../_lib/account.js';
import { adminAuth, isAdminToken, readJsonBody, sendJson, verifyIdToken } from '../_lib/firebase.js';
import { getAdminEmails } from '../_lib/toss.js';

// 관리자가 회원을 삭제합니다.
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

    await deleteAccount(uid);
    sendJson(res, 200, { ok: true });
  } catch (error) {
    console.error('[admin delete-user]', error);
    sendJson(res, 400, { error: error.message || '삭제에 실패했습니다.' });
  }
}
