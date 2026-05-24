import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const freelancers = await prisma.freelancer.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(freelancers);
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const freelancer = await prisma.freelancer.create({ data: body });
    return NextResponse.json(freelancer);
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
