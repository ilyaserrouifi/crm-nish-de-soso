import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = Promise<{ id: string }>

export async function GET(_: Request, { params }: { params: Params }) {
  try {
    const { id } = await params
    const invoices = await prisma.invoice.findMany({
      where: { clientId: id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, amount: true, service: true, status: true, dueDate: true, paidAt: true, createdAt: true },
    })
    return NextResponse.json(invoices)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
  }
}
