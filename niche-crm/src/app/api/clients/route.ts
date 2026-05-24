import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: 'desc' },
      include: { projects: true, invoices: true }
    })
    return NextResponse.json(clients)
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const client = await prisma.client.create({ data: body })
    return NextResponse.json(client)
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
