import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isNonEmptyString } from '@/lib/validation'

type Body = { leadId?: unknown; fromStage?: unknown; toStage?: unknown; note?: unknown; actor?: unknown }

type PipelineHistoryRow = {
  id: string
  leadId: string
  fromStage: string
  toStage: string
  note: string | null
  actor: string
  createdAt: Date
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const leadId = url.searchParams.get('leadId')

  try {
    const rows = leadId
      ? await prisma.$queryRaw<PipelineHistoryRow[]>`
          SELECT id, "leadId", "fromStage", "toStage", note, actor, "createdAt"
          FROM "PipelineHistory"
          WHERE "leadId" = ${leadId}
          ORDER BY "createdAt" DESC
          LIMIT 200
        `
      : await prisma.$queryRaw<PipelineHistoryRow[]>`
          SELECT id, "leadId", "fromStage", "toStage", note, actor, "createdAt"
          FROM "PipelineHistory"
          ORDER BY "createdAt" DESC
          LIMIT 200
        `
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

    const rows = await prisma.$queryRaw<PipelineHistoryRow[]>`
      INSERT INTO "PipelineHistory" ("leadId", "fromStage", "toStage", note, actor)
      VALUES (
        ${body.leadId},
        ${body.fromStage},
        ${body.toStage},
        ${isNonEmptyString(body.note) ? body.note : null},
        ${isNonEmptyString(body.actor) ? body.actor : 'system'}
      )
      RETURNING id, "leadId", "fromStage", "toStage", note, actor, "createdAt"
    `

    return NextResponse.json(rows[0], { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create history event' }, { status: 500 })
  }
}
