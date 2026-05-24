import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const freelancer = await prisma.freelancer.findUnique({ where: { id: (await params).id } });
    if (!freelancer) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(freelancer);
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await req.json();
    const freelancer = await prisma.freelancer.update({ where: { id: (await params).id }, data: body });
    return NextResponse.json(freelancer);
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await prisma.freelancer.delete({ where: { id: (await params).id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
