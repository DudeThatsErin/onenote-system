import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { graph } from '@/lib/graph';
export const runtime = 'nodejs';
export async function GET(req: NextRequest) { try { const notebook = req.nextUrl.searchParams.get('notebook'); if (!notebook) return NextResponse.json({ error: 'notebook is required' }, { status: 400 }); const user = await requireUser(); return NextResponse.json(await (await graph(user.id, `/me/onenote/notebooks/${encodeURIComponent(notebook)}/sections?$select=id,displayName`)).json()); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Request failed' }, { status: 401 }); } }
