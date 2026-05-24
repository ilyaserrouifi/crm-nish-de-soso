import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const callers = await prisma.coldCaller.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(callers);
  } catch (e) {
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const caller = await prisma.coldCaller.create({ data: body });
    return NextResponse.json(caller);
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
