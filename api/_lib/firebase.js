import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// FIREBASE_SERVICE_ACCOUNT: Firebase 콘솔 → 프로젝트 설정 → 서비스 계정 → 새 비공개 키 생성 JSON
// (JSON 원문 또는 base64 인코딩 모두 허용)
function readServiceAccount() {
  const raw = (process.env.FIREBASE_SERVICE_ACCOUNT || '').trim();
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT 환경변수가 필요합니다.');
  const json = raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
  return JSON.parse(json);
}

function adminApp() {
  return getApps()[0] || initializeApp({ credential: cert(readServiceAccount()) });
}

export function adminDb() {
  return getFirestore(adminApp());
}

export function adminAuth() {
  return getAuth(adminApp());
}

export async function verifyIdToken(idToken) {
  if (!idToken) throw new Error('로그인이 필요합니다.');
  try {
    return await adminAuth().verifyIdToken(String(idToken));
  } catch (_) {
    throw new Error('로그인이 만료되었습니다. 다시 로그인해 주세요.');
  }
}

// 최고 관리자(saas-config.js ADMIN_EMAILS) 또는 config/admins 에 지정된 관리자인지 확인합니다.
export async function isAdminToken(decoded, ownerEmails) {
  if (decoded.email_verified === true && ownerEmails.includes(String(decoded.email || '').toLowerCase())) return true;
  const snap = await adminDb().doc('config/admins').get();
  const uids = snap.exists && Array.isArray(snap.data().uids) ? snap.data().uids : [];
  return uids.includes(decoded.uid);
}

export function readJsonBody(req) {
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
  return req.body || {};
}

export function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}
