import { after, NextRequest, NextResponse } from 'next/server';
import {
  DISCORD_COMMAND_NAME,
  discordConfig,
  editDiscordResponse,
  verifyDiscordRequest,
} from '@/lib/discord';
import { appendToOneNotePage, createOneNotePage, sourceUrl } from '@/lib/onenote';

export const runtime = 'nodejs';

type DiscordOption = {
  name: string;
  type: number;
  value?: string;
  options?: DiscordOption[];
};

type DiscordInteraction = {
  application_id?: string;
  token?: string;
  type?: number;
  data?: { name?: string; options?: DiscordOption[] };
};

const EPHEMERAL = 64;

function option(options: DiscordOption[], name: string) {
  const value = options.find((item) => item.name === name)?.value;
  return typeof value === 'string' ? value.trim() : '';
}

function successMessage(action: string, title: string | undefined, webUrl: string | undefined) {
  const page = title ? `“${title.replace(/[\r\n]+/g, ' ')}”` : 'the page';
  return webUrl
    ? `OneNote ${action} ${page}. [Open it in OneNote](${webUrl})`
    : `OneNote ${action} ${page}.`;
}

async function runCommand(interaction: DiscordInteraction, config: NonNullable<Awaited<ReturnType<typeof discordConfig>>>) {
  if (!interaction.token) throw new Error('Discord did not include an interaction token.');
  const subcommand = interaction.data?.options?.find((item) => item.type === 1);
  const options = subcommand?.options ?? [];

  try {
    if (!config.defaultSectionId) throw new Error('Choose a default OneNote section in Setup Step 4 first.');

    if (subcommand?.name === 'create') {
      const title = option(options, 'title');
      const content = option(options, 'content');
      const enteredUrl = option(options, 'url');
      if (!title) throw new Error('A page title is required.');
      const url = sourceUrl(enteredUrl);
      if (enteredUrl && !url) throw new Error('The source URL must begin with http:// or https://.');
      const page = await createOneNotePage(config.userId, config.defaultSectionId, title, content, url);
      await editDiscordResponse(config.applicationId, interaction.token, successMessage('created', page.title ?? title, page.webUrl));
      return;
    }

    if (subcommand?.name === 'append') {
      const pageTitle = option(options, 'page-title');
      const content = option(options, 'content');
      const enteredUrl = option(options, 'url');
      if (!pageTitle || !content) throw new Error('The page title and text to append are required.');
      const url = sourceUrl(enteredUrl);
      if (enteredUrl && !url) throw new Error('The source URL must begin with http:// or https://.');
      const page = await appendToOneNotePage({
        userId: config.userId,
        sectionId: config.defaultSectionId,
        pageTitle,
        content,
        url,
      });
      await editDiscordResponse(config.applicationId, interaction.token, successMessage('updated', page.title ?? pageTitle, page.webUrl));
      return;
    }

    throw new Error('Choose the create or append action.');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'The OneNote request failed.';
    await editDiscordResponse(config.applicationId, interaction.token, `OneNote System could not finish: ${message}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const config = await discordConfig();
    if (!config) return NextResponse.json({ error: 'Discord is not configured.' }, { status: 503 });

    const verified = verifyDiscordRequest(
      config.publicKey,
      req.headers.get('x-signature-ed25519'),
      req.headers.get('x-signature-timestamp'),
      rawBody,
    );
    if (!verified) return NextResponse.json({ error: 'Invalid request signature.' }, { status: 401 });

    let interaction: DiscordInteraction;
    try {
      interaction = JSON.parse(rawBody) as DiscordInteraction;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
    }

    if (interaction.application_id && interaction.application_id !== config.applicationId) {
      return NextResponse.json({ error: 'Application ID does not match.' }, { status: 401 });
    }
    if (interaction.type === 1) return NextResponse.json({ type: 1 });
    if (interaction.type !== 2 || interaction.data?.name !== DISCORD_COMMAND_NAME) {
      return NextResponse.json({
        type: 4,
        data: { content: 'This interaction is not supported.', flags: EPHEMERAL, allowed_mentions: { parse: [] } },
      });
    }

    after(() => runCommand(interaction, config));
    return NextResponse.json({ type: 5, data: { flags: EPHEMERAL } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Discord interaction failed.' }, { status: 500 });
  }
}
