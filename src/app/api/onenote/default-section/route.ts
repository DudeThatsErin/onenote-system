import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
export const runtime = 'nodejs';
export async function POST(req: NextRequest) { try { const user = await requireUser(); const { sectionId } = await req.json(); if (typeof sectionId !== 'string' || !sectionId) return NextResponse.json({ error: 'sectionId is required' }, { status: 400 }); await db()`UPDATE ons_users SET default_section_id=${sectionId}, updated_at=now() WHERE id=${user.id}`; return NextResponse.json({ ok: true }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Request failed' }, { status: 401 }); } }
