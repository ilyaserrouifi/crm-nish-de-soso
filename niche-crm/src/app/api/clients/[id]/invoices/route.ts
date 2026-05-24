import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const invoices = await prisma.invoice.findMany({ where: { clientId: id }, orderBy: { createdAt: 'desc' } })
    return NextResponse.json(invoices)
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
