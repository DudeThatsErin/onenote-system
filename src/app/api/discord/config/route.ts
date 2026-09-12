import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { encrypt } from '@/lib/crypto';
import { db, ensureSchema } from '@/lib/db';
import { parseUserIds } from '@/lib/discord';

export const runtime = 'nodejs';

const SNOWFLAKE = /^\d{17,20}$/;
const PUBLIC_KEY = /^[a-f\d]{64}$/i;

export async function GET() {
  try {
    await ensureSchema();
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Connect Microsoft before configuring Discord.' }, { status: 401 });
    const rows = await db()`SELECT application_id, public_key, bot_token_enc, test_guild_id,
        allowed_user_ids, command_id, registered_scope, registered_at, updated_at
      FROM ons_discord_config WHERE id = 1 AND user_id = ${user.id}`;
    const config = rows[0];
    return NextResponse.json({
      configured: Boolean(config?.application_id && config?.public_key),
      applicationId: config?.application_id ?? '',
      publicKey: config?.public_key ?? '',
      testGuildId: config?.test_guild_id ?? '',
      allowedUserIds: parseUserIds(config?.allowed_user_ids as string | null).join(', '),
      hasBotToken: Boolean(config?.bot_token_enc),
      registered: Boolean(config?.command_id),
      registeredScope: config?.registered_scope ?? null,
      registeredAt: config?.registered_at ?? null,
      updatedAt: config?.updated_at ?? null,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not load Discord configuration.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Connect Microsoft before configuring Discord.' }, { status: 401 });

    const body = await req.json() as Record<string, unknown>;
    const applicationId = typeof body.applicationId === 'string' ? body.applicationId.trim() : '';
    const publicKey = typeof body.publicKey === 'string' ? body.publicKey.trim().toLowerCase() : '';
    const botToken = typeof body.botToken === 'string' ? body.botToken.trim() : '';
    const testGuildId = typeof body.testGuildId === 'string' ? body.testGuildId.trim() : '';
    const rawAllowed = typeof body.allowedUserIds === 'string' ? body.allowedUserIds : '';
    const allowedUserIds = parseUserIds(rawAllowed);

    if (!SNOWFLAKE.test(applicationId)) return NextResponse.json({ error: 'Application ID must be a 17–20 digit Discord ID.' }, { status: 400 });
    if (!PUBLIC_KEY.test(publicKey)) return NextResponse.json({ error: 'Public Key must be the 64-character hexadecimal key from Discord.' }, { status: 400 });
    if (testGuildId && !SNOWFLAKE.test(testGuildId)) return NextResponse.json({ error: 'Test server ID must be a 17–20 digit Discord server ID.' }, { status: 400 });
    if (botToken && (botToken.length < 30 || /\s/.test(botToken))) return NextResponse.json({ error: 'The bot token format is invalid.' }, { status: 400 });
    // Anything the user typed that is not a snowflake is dropped by parseUserIds.
    // Silently ignoring a typo would leave them locked out with no explanation.
    if (rawAllowed.trim() && !allowedUserIds.length) {
      return NextResponse.json({ error: 'Allowed Discord user IDs must be 17–20 digit Discord IDs, separated by commas.' }, { status: 400 });
    }

    const encryptedToken = botToken ? encrypt(botToken) : null;
    await db()`INSERT INTO ons_discord_config
      (id, application_id, public_key, bot_token_enc, test_guild_id, allowed_user_ids, user_id, updated_at)
      VALUES (1, ${applicationId}, ${publicKey}, ${encryptedToken}, ${testGuildId || null}, ${allowedUserIds.join(',') || null}, ${user.id}, now())
      ON CONFLICT (id) DO UPDATE SET
        application_id = excluded.application_id,
        public_key = excluded.public_key,
        bot_token_enc = COALESCE(excluded.bot_token_enc, ons_discord_config.bot_token_enc),
        test_guild_id = excluded.test_guild_id,
        allowed_user_ids = excluded.allowed_user_ids,
        user_id = excluded.user_id,
        updated_at = now()`;
    return NextResponse.json({ ok: true, hasBotToken: Boolean(botToken), allowedUserIds: allowedUserIds.length });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not save Discord configuration.' }, { status: 500 });
  }
}
