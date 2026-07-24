import { randomBytes, scryptSync, timingSafeEqual, createHmac } from 'node:crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'drip-deck-dev-secret-change-in-prod';
const SCRYPT_OPTS = { N: 16384, r: 8, p: 1 };

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64, SCRYPT_OPTS).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  try {
    const [salt, hash] = stored.split(':');
    const derived = scryptSync(password, salt, 64, SCRYPT_OPTS);
    return timingSafeEqual(derived, Buffer.from(hash, 'hex'));
  } catch {
    return false;
  }
}

export function signToken(payload, expiresInDays = 30) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + expiresInDays * 86400,
  })).toString('base64url');
  const sig = createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}

export function verifyToken(token) {
  if (!token || typeof token !== 'string') throw new Error('No token provided');
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Malformed token');
  const [header, body, sig] = parts;
  const expected = createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  if (sig !== expected) throw new Error('Invalid token signature');
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  if (payload.exp < Math.floor(Date.now() / 1000)) throw new Error('Token expired');
  return payload;
}
