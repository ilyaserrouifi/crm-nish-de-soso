import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

type Params = Promise<{ id: string }>

function isMissingClientLocationColumnError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2022' &&
    typeof error.meta?.column === 'string' &&
    (error.meta.column.includes('Client.country') || error.meta.column.includes('Client.city'))
  )
}

export async function GET(_: Request, { params }: { params: Params }) {
  const { id } = await params
  try {
    const client = await prisma.client.findUnique({ where: { id } })
    if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(client)
  } catch (error) {
    if (isMissingClientLocationColumnError(error)) {
      try {
        const client = await prisma.client.findUnique({
          where: { id },
          select: {
            id: true,
            company: true,
            name: true,
            email: true,
            phone: true,
            niche: true,
            mrr: true,
            status: true,
            createdAt: true,
          },
        })
        if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        return NextResponse.json({ ...client, country: null, city: null })
      } catch {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
      }
    }
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
