import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = Promise<{ id: string }>

export async function GET(_: Request, { params }: { params: Params }) {
  try {
    const { id } = await params
    const invoices = await prisma.invoice.findMany({ where: { clientId: id }, orderBy: { createdAt: 'desc' } })
    return NextResponse.json(invoices)
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
