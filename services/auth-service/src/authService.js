import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { AppError } from '../../../packages/core/src/errors.js';
import { signJwt, verifyJwt } from '../../../packages/core/src/jwt.js';
import { nowIso } from '../../../packages/core/src/utils.js';

function hashPassword(password) {
  const salt = randomBytes(16);
  const derived = scryptSync(String(password || ''), salt, 64);
  return `${salt.toString('hex')}:${derived.toString('hex')}`;
}

function verifyPassword(password, encoded) {
  const [saltHex, digestHex] = String(encoded || '').split(':');
  if (!saltHex || !digestHex) return false;
  const salt = Buffer.from(saltHex, 'hex');
  const expected = Buffer.from(digestHex, 'hex');
  const actual = scryptSync(String(password || ''), salt, expected.length);
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

export class AuthService {
  #credentialsByEmail = new Map();
  #jwtSecret;

  constructor({ userService, jwtSecret = 'dev-secret' }) {
    this.userService = userService;
    this.#jwtSecret = jwtSecret;
  }

  signup(input) {
    const id = String(input?.id || '').trim();
    const email = String(input?.email || '').toLowerCase().trim();
    const password = String(input?.password || '');
    const name = input?.name;

    if (!id || !email || !password) {
      throw new AppError('Signup requires id, email and password', 400, 'AUTH_SIGNUP_INVALID');
    }

    if (this.#credentialsByEmail.has(email)) {
      throw new AppError('Email already registered', 409, 'AUTH_EMAIL_EXISTS');
    }

    const user = this.userService.upsert({ id, email, name });
    this.#credentialsByEmail.set(email, {
      userId: user.id,
      passwordHash: hashPassword(password),
      updatedAt: nowIso()
    });

    return user;
  }

  login(input) {
    const email = String(input?.email || '').toLowerCase().trim();
    const password = String(input?.password || '');
    const record = this.#credentialsByEmail.get(email);
    if (!record || !verifyPassword(password, record.passwordHash)) {
      throw new AppError('Invalid email or password', 401, 'AUTH_LOGIN_FAILED');
    }

    const token = signJwt({ sub: record.userId, email }, this.#jwtSecret, 3600);
    const user = this.userService.findById(record.userId);
    return { token, user };
  }

  validateToken(token) {
    const payload = verifyJwt(token, this.#jwtSecret);
    const user = this.userService.findById(payload.sub);
    if (!user) {
      throw new AppError('User for token not found', 401, 'AUTH_USER_NOT_FOUND');
    }

    return { payload, user };
  }
}
