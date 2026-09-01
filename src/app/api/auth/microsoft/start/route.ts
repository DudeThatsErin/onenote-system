import { NextResponse } from 'next/server';
import { randomToken } from '@/lib/crypto';
import { authorizationUrl } from '@/lib/graph';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const state = randomToken();
    const response = NextResponse.redirect(await authorizationUrl(state));
    response.cookies.set('onenote_queue_oauth_state', state, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 600 });
    return response;
  } catch (error) { return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(error instanceof Error ? error.message : 'Microsoft setup failed')}`, process.env.APP_URL)); }
}
