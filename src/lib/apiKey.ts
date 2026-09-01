import { hash } from '@/lib/crypto';
import { db } from '@/lib/db';

export type ApiKeyContext = {
  id: string;
  userId: string;
  defaultSectionId: string | null;
};

export async function authenticateApiKey(authorization: string | null): Promise<ApiKeyContext | null> {
  const match = authorization?.match(/^Bearer\s+(\S+)\s*$/i);
  if (!match) return null;

  const rows = await db()`SELECT k.id, k.user_id, u.default_section_id
    FROM oq_api_keys k
    JOIN oq_users u ON u.id = k.user_id
    WHERE k.token_hash = ${hash(match[1])}`;
  const key = rows[0];
  if (!key) return null;

  return {
    id: key.id as string,
    userId: key.user_id as string,
    defaultSectionId: (key.default_section_id as string | null) ?? null,
  };
}

export async function markApiKeyUsed(id: string) {
  await db()`UPDATE oq_api_keys SET last_used_at = now() WHERE id = ${id}`;
}
