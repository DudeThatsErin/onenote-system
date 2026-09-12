import { after, NextRequest, NextResponse } from 'next/server';
import {
  DISCORD_COMMAND_NAME,
  discordConfig,
  editDiscordResponse,
  invokingUserId,
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
  member?: { user?: { id?: string } };
  user?: { id?: string };
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
    // The response edit can fail too -- an expired interaction token, or Discord
    // being down. Letting that escape would replace a useful OneNote error with
    // an anonymous `after()` stack trace, so report both and swallow the second.
    try {
      await editDiscordResponse(config.applicationId, interaction.token, `OneNote System could not finish: ${message}`);
    } catch (replyError) {
      const reason = replyError instanceof Error ? replyError.message : 'unknown error';
      console.error(
        `Discord /${DISCORD_COMMAND_NAME} ${subcommand?.name ?? 'unknown'} failed (${message}), ` +
        `and the reply could not be delivered (${reason}).`,
      );
    }
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

    // Checked before deferring: being able to see the command is not permission
    // to write into someone else's notebook.
    const caller = invokingUserId(interaction);
    if (!config.allowedUserIds.includes(caller)) {
      return NextResponse.json({
        type: 4,
        data: {
          content: config.allowedUserIds.length
            ? `You are not allowed to use this OneNote System deployment.${caller ? ` Your Discord user ID is \`${caller}\`.` : ''}`
            : 'No Discord accounts are allowed to use this deployment yet. Add your Discord user ID in Setup Step 6.',
          flags: EPHEMERAL,
          allowed_mentions: { parse: [] },
        },
      });
    }

    after(() => runCommand(interaction, config));
    return NextResponse.json({ type: 5, data: { flags: EPHEMERAL } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Discord interaction failed.' }, { status: 500 });
  }
}
