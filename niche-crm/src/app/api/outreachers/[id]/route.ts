import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  return NextResponse.json(await prisma.outreacher.findUnique({ where: { id: (await params).id } }));
}
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return NextResponse.json(await prisma.outreacher.update({ where: { id: (await params).id }, data: await req.json() }));
}
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await prisma.outreacher.delete({ where: { id: (await params).id } });
  return NextResponse.json({ success: true });
}
