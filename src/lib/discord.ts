import crypto from 'node:crypto';
import { decrypt } from '@/lib/crypto';
import { db } from '@/lib/db';

const DISCORD_API = 'https://discord.com/api/v10';
const ED25519_SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');

export const DISCORD_COMMAND_NAME = 'onenote';

export const DISCORD_COMMAND = {
  name: DISCORD_COMMAND_NAME,
  description: 'Create a OneNote page or append to an existing page',
  type: 1,
  options: [
    {
      type: 1,
      name: 'create',
      description: 'Create a page in your default OneNote section',
      options: [
        { type: 3, name: 'title', description: 'Page title', required: true, max_length: 200 },
        { type: 3, name: 'content', description: 'Text to save', required: false, max_length: 4000 },
        { type: 3, name: 'url', description: 'Optional source URL', required: false, max_length: 2000 },
      ],
    },
    {
      type: 1,
      name: 'append',
      description: 'Append text to a page in your default OneNote section',
      options: [
        { type: 3, name: 'page-title', description: 'Exact title of the existing page', required: true, max_length: 200 },
        { type: 3, name: 'content', description: 'Text to append', required: true, max_length: 4000 },
        { type: 3, name: 'url', description: 'Optional source URL', required: false, max_length: 2000 },
      ],
    },
  ],
};

export type DiscordConfig = {
  applicationId: string;
  publicKey: string;
  botToken: string | null;
  testGuildId: string | null;
  userId: string;
  defaultSectionId: string | null;
  allowedUserIds: string[];
  commandId: string | null;
  registeredScope: string | null;
  registeredAt: string | null;
};

type DiscordConfigRow = {
  application_id: string;
  public_key: string;
  bot_token_enc: string | null;
  test_guild_id: string | null;
  user_id: string;
  default_section_id: string | null;
  allowed_user_ids: string | null;
  command_id: string | null;
  registered_scope: string | null;
  registered_at: string | null;
};

export async function discordConfig({ includeBotToken = false }: { includeBotToken?: boolean } = {}): Promise<DiscordConfig | null> {
  const rows = await db()`SELECT d.application_id, d.public_key, d.bot_token_enc,
      d.test_guild_id, d.user_id, d.allowed_user_ids, d.command_id, d.registered_scope,
      d.registered_at, u.default_section_id
    FROM ons_discord_config d
    JOIN ons_users u ON u.id = d.user_id
    WHERE d.id = 1`;
  const row = rows[0] as DiscordConfigRow | undefined;
  if (!row?.application_id || !row.public_key || !row.user_id) return null;
  return {
    applicationId: row.application_id,
    publicKey: row.public_key,
    botToken: includeBotToken && row.bot_token_enc ? decrypt(row.bot_token_enc) : null,
    testGuildId: row.test_guild_id,
    userId: row.user_id,
    defaultSectionId: row.default_section_id,
    allowedUserIds: parseUserIds(row.allowed_user_ids),
    commandId: row.command_id,
    registeredScope: row.registered_scope,
    registeredAt: row.registered_at,
  };
}

// The command writes into one person's OneNote, so membership of the server is
// not permission to use it. Only the Discord accounts listed during setup may
// run it; an empty list denies everyone rather than defaulting to open.
export function parseUserIds(value: string | null | undefined) {
  return String(value ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter((id) => /^\d{17,20}$/.test(id));
}

export function invokingUserId(interaction: {
  member?: { user?: { id?: string } };
  user?: { id?: string };
}) {
  // Discord sends `member.user` inside a server and `user` in a DM.
  return interaction.member?.user?.id ?? interaction.user?.id ?? '';
}

export function verifyDiscordRequest(
  publicKeyHex: string,
  signatureHex: string | null,
  timestamp: string | null,
  rawBody: string,
) {
  if (!signatureHex || !timestamp) return false;
  if (!/^[a-f\d]{64}$/i.test(publicKeyHex) || !/^[a-f\d]{128}$/i.test(signatureHex)) return false;

  const timestampSeconds = Number(timestamp);
  if (!Number.isFinite(timestampSeconds) || Math.abs(Date.now() - timestampSeconds * 1000) > 5 * 60_000) return false;

  try {
    const key = crypto.createPublicKey({
      key: Buffer.concat([ED25519_SPKI_PREFIX, Buffer.from(publicKeyHex, 'hex')]),
      format: 'der',
      type: 'spki',
    });
    return crypto.verify(
      null,
      Buffer.from(timestamp + rawBody),
      key,
      Buffer.from(signatureHex, 'hex'),
    );
  } catch {
    return false;
  }
}

function commandPath(applicationId: string, guildId: string | null) {
  const app = encodeURIComponent(applicationId);
  return guildId
    ? `/applications/${app}/guilds/${encodeURIComponent(guildId)}/commands`
    : `/applications/${app}/commands`;
}

async function discordApi(path: string, token: string, init: RequestInit) {
  const response = await fetch(`${DISCORD_API}${path}`, {
    ...init,
    headers: {
      authorization: `Bot ${token}`,
      'content-type': 'application/json',
      ...init.headers,
    },
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({})) as { message?: string; retry_after?: number };
    const retry = response.status === 429 && data.retry_after
      ? ` Try again in ${Math.ceil(data.retry_after)} seconds.`
      : '';
    throw new Error(`${data.message || `Discord returned ${response.status}`}.${retry}`.replace('..', '.'));
  }
  if (response.status === 204) return null;
  return response.json() as Promise<{ id?: string; name?: string }>;
}

function scopeName(guildId: string | null) {
  return guildId ? `guild:${guildId}` : 'global';
}

function scopePath(applicationId: string, scope: string) {
  if (scope.startsWith('guild:')) return commandPath(applicationId, scope.slice(6));
  return commandPath(applicationId, null);
}

export async function registerDiscordCommand(config: DiscordConfig) {
  if (!config.botToken) throw new Error('A Discord bot token is required to register the command.');
  const desiredScope = scopeName(config.testGuildId);

  if (config.commandId && config.registeredScope && config.registeredScope !== desiredScope) {
    const oldPath = `${scopePath(config.applicationId, config.registeredScope)}/${encodeURIComponent(config.commandId)}`;
    try {
      await discordApi(oldPath, config.botToken, { method: 'DELETE' });
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes('Unknown Application Command')) throw error;
    }
  }

  const command = await discordApi(commandPath(config.applicationId, config.testGuildId), config.botToken, {
    method: 'POST',
    body: JSON.stringify(DISCORD_COMMAND),
  });
  if (!command?.id) throw new Error('Discord registered the command but did not return its ID.');

  await db()`UPDATE ons_discord_config
    SET command_id = ${command.id}, registered_scope = ${desiredScope}, registered_at = now(), updated_at = now()
    WHERE id = 1 AND user_id = ${config.userId}`;
  return { id: command.id, name: command.name ?? DISCORD_COMMAND_NAME, scope: desiredScope };
}

export async function unregisterDiscordCommand(config: DiscordConfig) {
  if (!config.botToken) throw new Error('A Discord bot token is required to remove the command.');
  if (!config.commandId || !config.registeredScope) throw new Error('No registered Discord command was found.');
  const path = `${scopePath(config.applicationId, config.registeredScope)}/${encodeURIComponent(config.commandId)}`;
  try {
    await discordApi(path, config.botToken, { method: 'DELETE' });
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes('Unknown Application Command')) throw error;
  }
  await db()`UPDATE ons_discord_config
    SET command_id = NULL, registered_scope = NULL, registered_at = NULL, updated_at = now()
    WHERE id = 1 AND user_id = ${config.userId}`;
}

export async function editDiscordResponse(applicationId: string, interactionToken: string, content: string) {
  const response = await fetch(
    `${DISCORD_API}/webhooks/${encodeURIComponent(applicationId)}/${encodeURIComponent(interactionToken)}/messages/@original`,
    {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ content: content.slice(0, 2000), allowed_mentions: { parse: [] } }),
    },
  );
  if (!response.ok) {
    const data = await response.json().catch(() => ({})) as { message?: string };
    throw new Error(data.message || `Discord could not update the response (${response.status}).`);
  }
}
