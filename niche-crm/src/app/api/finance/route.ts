import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const clients = await prisma.client.findMany();
    const mrr = clients.reduce((sum: number, c: any) => sum + (c.mrr || 0), 0);
    return NextResponse.json({ mrr, totalExpenses: 0, netProfit: mrr });
  } catch (e) {
    return NextResponse.json({ mrr: 0, totalExpenses: 0, netProfit: 0 });
  }
}
