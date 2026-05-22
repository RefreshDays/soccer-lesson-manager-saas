import { getSiteOrigin } from '../lib/toss.js';

export default async function handler(req, res) {
  const origin = getSiteOrigin();
  const { code, message } = req.query || {};
  const text = message || code || '결제가 완료되지 않았습니다.';
  res.writeHead(302, {
    Location: `${origin}/?subscribe=fail&message=${encodeURIComponent(String(text))}`,
  });
  res.end();
}
