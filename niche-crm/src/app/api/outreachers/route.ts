import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export async function GET() {
  try { return NextResponse.json(await prisma.outreacher.findMany({ orderBy: { createdAt: 'desc' } })); }
  catch { return NextResponse.json([]); }
}
export async function POST(req: Request) {
  try { return NextResponse.json(await prisma.outreacher.create({ data: await req.json() })); }
  catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
