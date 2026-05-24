import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = Promise<{ id: string }>

export async function GET(_: Request, { params }: { params: Params }) {
  const { id } = await params
  try {
    const client = await prisma.client.findUnique({ where: { id } })
    if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(client)
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: Params }) {
  const { id } = await params
  try {
    const body = await req.json()
    const client = await prisma.client.update({ where: { id }, data: body })
    return NextResponse.json(client)
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: { params: Params }) {
  const { id } = await params
  try {
    await prisma.client.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
