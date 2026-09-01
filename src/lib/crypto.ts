import crypto from 'node:crypto';

function key(): Buffer {
  const value = process.env.APP_ENCRYPTION_KEY;
  if (!value || value.length < 32) throw new Error('APP_ENCRYPTION_KEY must be at least 32 characters.');
  return crypto.createHash('sha256').update(value).digest();
}

export function encrypt(value: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const body = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return [iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), body.toString('base64url')].join('.');
}

export function decrypt(value: string): string {
  const [iv, tag, body] = value.split('.');
  if (!iv || !tag || !body) throw new Error('Encrypted value is invalid.');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(body, 'base64url')), decipher.final()]).toString('utf8');
}

export function hash(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function randomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('base64url');
}
