import { adminDb, publicMessage, readJsonBody, sendJson, verifyIdToken } from '../_lib/firebase.js';

// 회원 본인의 결제 내역(카드 자동결제 + 승인된 계좌 입금)을 돌려줍니다.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method Not Allowed' });
    return;
  }
  try {
    const { idToken } = readJsonBody(req);
    const me = await verifyIdToken(idToken);
    const db = adminDb();
    const [cards, banks] = await Promise.all([
      db.collection('paymentRecords').where('uid', '==', me.uid).limit(60).get(),
      db.collection('activationRequests').where('uid', '==', me.uid).limit(60).get(),
    ]);
    const items = [];
    cards.forEach((doc) => {
      const d = doc.data();
      const at = d.approvedAt ? Date.parse(d.approvedAt) : d.createdAt || 0;
      items.push({ at, amount: d.amount || 0, method: 'card', label: d.cardLabel ? `카드 ${d.cardLabel}` : '카드', kind: d.kind || '' });
    });
    banks.forEach((doc) => {
      const d = doc.data();
      if (d.status !== 'approved') return;
      items.push({ at: d.approvedAt || d.createdAt || 0, amount: d.amount || 0, method: 'bank', label: '계좌 입금', kind: 'bank' });
    });
    items.sort((a, b) => b.at - a.at);
    sendJson(res, 200, { items });
  } catch (error) {
    console.error('[account payments]', error);
    sendJson(res, 400, { error: publicMessage(error, '결제 내역을 불러오지 못했습니다.') });
  }
}
