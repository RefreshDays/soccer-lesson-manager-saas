import { deleteAccount } from '../_lib/account.js';
import { publicMessage, readJsonBody, sendJson, verifyIdToken } from '../_lib/firebase.js';
import { getAdminEmails } from '../_lib/toss.js';

// 회원 본인이 탈퇴합니다.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method Not Allowed' });
    return;
  }
  try {
    const { idToken } = readJsonBody(req);
    const me = await verifyIdToken(idToken);
    if (getAdminEmails().includes(String(me.email || '').toLowerCase())) {
      sendJson(res, 400, { error: '최고 관리자 계정은 탈퇴할 수 없습니다.' });
      return;
    }
    await deleteAccount(me.uid);
    sendJson(res, 200, { ok: true });
  } catch (error) {
    console.error('[account delete]', error);
    sendJson(res, 400, { error: publicMessage(error, '탈퇴에 실패했습니다.') });
  }
}
