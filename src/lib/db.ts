import { neon } from '@neondatabase/serverless';

export function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not configured. Add a Neon, Supabase, or Postgres connection string.');
  return neon(url);
}

export async function ensureSchema() {
  const sql = db();
  await sql`CREATE TABLE IF NOT EXISTS oq_config (
    id INTEGER PRIMARY KEY, client_id TEXT, client_secret_enc TEXT, configured_at TIMESTAMPTZ DEFAULT now()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS oq_users (
    id UUID PRIMARY KEY, microsoft_id TEXT UNIQUE NOT NULL, email TEXT, display_name TEXT,
    access_token_enc TEXT NOT NULL, refresh_token_enc TEXT NOT NULL, expires_at TIMESTAMPTZ NOT NULL,
    default_section_id TEXT, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS oq_api_keys (
    id UUID PRIMARY KEY, user_id UUID REFERENCES oq_users(id) ON DELETE CASCADE,
    label TEXT NOT NULL, token_hash TEXT UNIQUE NOT NULL, created_at TIMESTAMPTZ DEFAULT now(), last_used_at TIMESTAMPTZ
  )`;
  await sql`CREATE TABLE IF NOT EXISTS oq_discord_config (
    id INTEGER PRIMARY KEY, application_id TEXT, public_key TEXT, bot_token_enc TEXT, test_guild_id TEXT, updated_at TIMESTAMPTZ DEFAULT now()
  )`;
}
