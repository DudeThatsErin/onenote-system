import { neon } from '@neondatabase/serverless';

export function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not configured. Add a Neon, Supabase, or Postgres connection string.');
  return neon(url);
}

// Deployments created before the OneNote Queue → OneNote System rename use an
// `oq_` table prefix. Rename them in place rather than creating a second, empty
// set of `ons_` tables beside them, which would silently disconnect every
// existing Microsoft connection and API key. Renaming carries indexes,
// constraints, and foreign keys with it, so no data moves.
async function renameLegacyTables(sql: ReturnType<typeof db>) {
  await sql`DO $$
    DECLARE name TEXT;
    BEGIN
      FOREACH name IN ARRAY ARRAY['config', 'users', 'api_keys', 'discord_config'] LOOP
        IF to_regclass('public.oq_' || name) IS NOT NULL
           AND to_regclass('public.ons_' || name) IS NULL THEN
          EXECUTE format('ALTER TABLE %I RENAME TO %I', 'oq_' || name, 'ons_' || name);
        END IF;
      END LOOP;
    END $$`;
}

export async function ensureSchema() {
  const sql = db();
  await renameLegacyTables(sql);
  await sql`CREATE TABLE IF NOT EXISTS ons_config (
    id INTEGER PRIMARY KEY, client_id TEXT, client_secret_enc TEXT, configured_at TIMESTAMPTZ DEFAULT now()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS ons_users (
    id UUID PRIMARY KEY, microsoft_id TEXT UNIQUE NOT NULL, email TEXT, display_name TEXT,
    access_token_enc TEXT NOT NULL, refresh_token_enc TEXT NOT NULL, expires_at TIMESTAMPTZ NOT NULL,
    default_section_id TEXT, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS ons_api_keys (
    id UUID PRIMARY KEY, user_id UUID REFERENCES ons_users(id) ON DELETE CASCADE,
    label TEXT NOT NULL, token_hash TEXT UNIQUE NOT NULL, created_at TIMESTAMPTZ DEFAULT now(), last_used_at TIMESTAMPTZ
  )`;
  await sql`CREATE TABLE IF NOT EXISTS ons_discord_config (
    id INTEGER PRIMARY KEY, application_id TEXT, public_key TEXT, bot_token_enc TEXT, test_guild_id TEXT,
    user_id UUID REFERENCES ons_users(id) ON DELETE CASCADE, command_id TEXT, registered_scope TEXT,
    registered_at TIMESTAMPTZ, updated_at TIMESTAMPTZ DEFAULT now()
  )`;
  await sql`ALTER TABLE ons_discord_config ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES ons_users(id) ON DELETE CASCADE`;
  await sql`ALTER TABLE ons_discord_config ADD COLUMN IF NOT EXISTS command_id TEXT`;
  await sql`ALTER TABLE ons_discord_config ADD COLUMN IF NOT EXISTS registered_scope TEXT`;
  await sql`ALTER TABLE ons_discord_config ADD COLUMN IF NOT EXISTS registered_at TIMESTAMPTZ`;
}
