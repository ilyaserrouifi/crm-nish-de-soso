import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isNonEmptyString } from '@/lib/validation'

type Body = {
  clientId?: unknown
  senderRole?: unknown
  senderName?: unknown
  message?: unknown
  attachmentUrl?: unknown
}

type MessageRow = {
  id: string
  clientId: string
  senderRole: string
  senderName: string
  message: string
  attachmentUrl: string | null
  createdAt: Date
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const clientId = url.searchParams.get('clientId')

  if (!clientId) {
    return NextResponse.json({ error: 'clientId is required' }, { status: 400 })
  }

  try {
    const rows = await prisma.$queryRaw<MessageRow[]>`
      SELECT id, "clientId", "senderRole", "senderName", message, "attachmentUrl", "createdAt"
      FROM "ClientPortalMessage"
      WHERE "clientId" = ${clientId}
      ORDER BY "createdAt" DESC
      LIMIT 200
    `
    return NextResponse.json(rows)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body

    if (!isNonEmptyString(body.clientId) || !isNonEmptyString(body.senderRole) || !isNonEmptyString(body.senderName) || !isNonEmptyString(body.message)) {
      return NextResponse.json({ error: 'clientId, senderRole, senderName and message are required' }, { status: 400 })
    }

    const role = body.senderRole.toUpperCase()
    if (role !== 'PROJECT_MANAGER' && role !== 'CLIENT') {
      return NextResponse.json({ error: 'Only CLIENT and PROJECT_MANAGER messages are allowed' }, { status: 403 })
    }

    const attachmentUrl = isNonEmptyString(body.attachmentUrl) ? body.attachmentUrl : null

    const row = await prisma.$queryRaw<MessageRow[]>`
      INSERT INTO "ClientPortalMessage" ("clientId", "senderRole", "senderName", message, "attachmentUrl")
      VALUES (${body.clientId}, ${role}, ${body.senderName}, ${body.message}, ${attachmentUrl})
      RETURNING id, "clientId", "senderRole", "senderName", message, "attachmentUrl", "createdAt"
    `

    return NextResponse.json(row[0], { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 })
  }
}
