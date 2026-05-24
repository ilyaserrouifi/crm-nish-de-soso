import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const invoices = await prisma.invoice.findMany({ where: { clientId: params.id }, orderBy: { createdAt: 'desc' } })
    return NextResponse.json(invoices)
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
