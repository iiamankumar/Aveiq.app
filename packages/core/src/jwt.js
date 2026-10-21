import { createHmac } from 'node:crypto';
import { AppError } from './errors.js';

function toBase64Url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function fromBase64Url(input) {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  return Buffer.from(`${base64}${padding}`, 'base64').toString('utf8');
}

function signRaw(data, secret) {
  return createHmac('sha256', secret)
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export function signJwt(payload, secret, expiresInSeconds = 3600) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const nowSeconds = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: nowSeconds,
    exp: nowSeconds + expiresInSeconds
  };

  const encodedHeader = toBase64Url(JSON.stringify(header));
  const encodedPayload = toBase64Url(JSON.stringify(fullPayload));
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = signRaw(data, secret);
  return `${data}.${signature}`;
}

export function verifyJwt(token, secret) {
  if (!token || typeof token !== 'string') {
    throw new AppError('Missing token', 401, 'AUTH_TOKEN_MISSING');
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new AppError('Invalid token format', 401, 'AUTH_TOKEN_INVALID');
  }

  const [encodedHeader, encodedPayload, signature] = parts;
  const expected = signRaw(`${encodedHeader}.${encodedPayload}`, secret);
  if (expected !== signature) {
    throw new AppError('Invalid token signature', 401, 'AUTH_TOKEN_INVALID');
  }

  let payload;
  try {
    payload = JSON.parse(fromBase64Url(encodedPayload));
  } catch {
    throw new AppError('Invalid token payload', 401, 'AUTH_TOKEN_INVALID');
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (!payload.exp || payload.exp < nowSeconds) {
    throw new AppError('Token expired', 401, 'AUTH_TOKEN_EXPIRED');
  }

  return payload;
}
