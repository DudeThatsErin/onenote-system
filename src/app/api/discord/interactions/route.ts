import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
// Endpoint reserved for Discord's signed interaction handler. Verification and
// command registration land with the optional Discord adapter, keeping the
// core capture service deployable without Discord credentials.
export async function POST(_req: NextRequest) { return NextResponse.json({ error: 'Discord interactions are not enabled until Advanced Discord setup is completed.' }, { status: 503 }); }
