import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { discordConfig, registerDiscordCommand, unregisterDiscordCommand } from '@/lib/discord';

export const runtime = 'nodejs';

async function ownedConfig() {
  const user = await currentUser();
  if (!user) return { error: 'Connect Microsoft before configuring Discord.', status: 401 } as const;
  const config = await discordConfig({ includeBotToken: true });
  if (!config || config.userId !== user.id) return { error: 'Save the Discord settings before registering commands.', status: 409 } as const;
  return { config } as const;
}

export async function POST() {
  try {
    const result = await ownedConfig();
    if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status });
    const command = await registerDiscordCommand(result.config);
    return NextResponse.json({ ok: true, command });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not register the Discord command.' }, { status: 502 });
  }
}

export async function DELETE() {
  try {
    const result = await ownedConfig();
    if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status });
    await unregisterDiscordCommand(result.config);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not remove the Discord command.' }, { status: 502 });
  }
}
