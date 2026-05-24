import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const caller = await prisma.coldCaller.findUnique({ where: { id: params.id } });
  return NextResponse.json(caller);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const body = await req.json();
  const caller = await prisma.coldCaller.update({ where: { id: params.id }, data: body });
  return NextResponse.json(caller);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await prisma.coldCaller.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
