import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export async function GET(_: Request, { params }: { params: { id: string } }) {
  return NextResponse.json(await prisma.outreacher.findUnique({ where: { id: params.id } }));
}
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  return NextResponse.json(await prisma.outreacher.update({ where: { id: params.id }, data: await req.json() }));
}
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await prisma.outreacher.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
