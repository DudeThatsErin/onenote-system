import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';

const COOKIE = 'onenote_queue_session';

function sign(value: string) {
  const secret = process.env.APP_ENCRYPTION_KEY;
  if (!secret) throw new Error('APP_ENCRYPTION_KEY is not configured.');
  return crypto.createHmac('sha256', secret).update(value).digest('base64url');
}

export function sessionValue(userId: string) {
  return `${userId}.${sign(userId)}`;
}

export async function currentUser() {
  const value = (await cookies()).get(COOKIE)?.value;
  if (!value) return null;
  const [userId, signature] = value.split('.');
  if (!userId || !signature) return null;
  const expected = sign(userId);
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  const sql = db();
  const rows = await sql`SELECT id, email, display_name, default_section_id FROM oq_users WHERE id = ${userId}`;
  return rows[0] ?? null;
}

export async function requireUser() {
  const user = await currentUser();
  if (!user) throw new Error('Unauthorized');
  return user;
}

export async function setSession(userId: string) {
  (await cookies()).set(COOKIE, sessionValue(userId), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30 });
}
