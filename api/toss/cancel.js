import { publicMessage, readJsonBody, sendJson, verifyIdToken } from '../_lib/firebase.js';
import { stopAutoRenew } from '../_lib/subscription.js';

// 회원이 카드 자동결제를 해지합니다.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method Not Allowed' });
    return;
  }
  try {
    const { idToken } = readJsonBody(req);
    const { uid } = await verifyIdToken(idToken);
    await stopAutoRenew(uid, 'user_cancel');
    sendJson(res, 200, { ok: true });
  } catch (error) {
    console.error('[toss cancel]', error);
    sendJson(res, 400, { error: publicMessage(error, '해지에 실패했습니다.') });
  }
}
