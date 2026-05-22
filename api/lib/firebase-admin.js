import admin from 'firebase-admin';

let initialized = false;

export function getAdmin() {
  if (!initialized) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT 환경변수가 필요합니다.');
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(raw)),
    });
    initialized = true;
  }
  return admin;
}
