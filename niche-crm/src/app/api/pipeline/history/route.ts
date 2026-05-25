import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isNonEmptyString } from '@/lib/validation'

type Body = { leadId?: unknown; fromStage?: unknown; toStage?: unknown; note?: unknown; actor?: unknown }

export async function GET(req: Request) {
  const url = new URL(req.url)
  const leadId = url.searchParams.get('leadId') ?? undefined
  const where = leadId ? { leadId } : undefined

  try {
    const rows = await prisma.pipelineHistory.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200 })
    return NextResponse.json(rows)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body
    if (!isNonEmptyString(body.leadId) || !isNonEmptyString(body.fromStage) || !isNonEmptyString(body.toStage)) {
      return NextResponse.json({ error: 'leadId, fromStage and toStage are required' }, { status: 400 })
    }

    const row = await prisma.pipelineHistory.create({
      data: {
        leadId: body.leadId,
        fromStage: body.fromStage,
        toStage: body.toStage,
        note: isNonEmptyString(body.note) ? body.note : null,
        actor: isNonEmptyString(body.actor) ? body.actor : 'system',
      },
    })

    return NextResponse.json(row, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create history event' }, { status: 500 })
  }
}
