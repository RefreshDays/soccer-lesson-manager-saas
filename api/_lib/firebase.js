import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// 사용자에게 그대로 보여줘도 되는 오류입니다. 그 외 오류(라이브러리 내부 메시지 등)는
// 설정값이 섞여 나올 수 있으므로 화면·URL에 노출하지 않고 기본 문구로 바꿉니다.
export function userError(message) {
  const err = new Error(message);
  err.expose = true;
  return err;
}

export function publicMessage(error, fallback) {
  return error && error.expose && error.message ? error.message : fallback;
}

// 서비스 계정 키 (Firebase 콘솔 → 프로젝트 설정 → 서비스 계정 → 새 비공개 키 생성)
// 방법 1) FIREBASE_SERVICE_ACCOUNT: JSON 원문 또는 base64 한 줄
// 방법 2) JSON 안의 세 값을 각각 등록: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
function readServiceAccount() {
  const raw = (process.env.FIREBASE_SERVICE_ACCOUNT || '').trim();
  if (raw) {
    const json = raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
    try {
      return JSON.parse(json);
    } catch (_) {
      throw userError('FIREBASE_SERVICE_ACCOUNT 값을 읽을 수 없습니다. 키 파일 내용을 다시 확인해 주세요.');
    }
  }
  const projectId = (process.env.FIREBASE_PROJECT_ID || '').trim();
  const clientEmail = (process.env.FIREBASE_CLIENT_EMAIL || '').trim();
  if (projectId && !/^[a-z0-9-]{4,40}$/.test(projectId)) {
    throw userError('FIREBASE_PROJECT_ID 값이 올바르지 않습니다. 프로젝트 ID(예: lesson-manager-64d89)만 넣어 주세요.');
  }
  if (clientEmail && !/^[^\s@{}"]+@[^\s@{}"]+\.iam\.gserviceaccount\.com$/.test(clientEmail)) {
    throw userError('FIREBASE_CLIENT_EMAIL 값이 올바르지 않습니다. 서비스 계정 이메일만 넣어 주세요.');
  }
  // 붙여넣을 때 줄바꿈이 '\n' 글자로 들어오므로 실제 줄바꿈으로 되돌립니다. 앞뒤 따옴표도 제거합니다.
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').trim().replace(/^"|"$/g, '').replace(/\\n/g, '\n');
  if (projectId && clientEmail && privateKey) {
    return { project_id: projectId, client_email: clientEmail, private_key: privateKey };
  }
  throw userError('FIREBASE_SERVICE_ACCOUNT 환경변수가 필요합니다.');
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
  if (!idToken) throw userError('로그인이 필요합니다.');
  // 서버 설정 오류(서비스 계정 누락 등)는 그대로 알리고, 토큰 검증 실패만 로그인 만료로 안내합니다.
  const auth = adminAuth();
  try {
    return await auth.verifyIdToken(String(idToken));
  } catch (_) {
    throw userError('로그인이 만료되었습니다. 다시 로그인해 주세요.');
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
