import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type StaleLead = {
  id: string
  companyName: string
}

type AutomationInsert = {
  type: string
  leadid: string | null
  company: string | null
}

export async function POST() {
  try {
    const now = new Date()
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)

    const [contactedStale, proposalStale] = await Promise.all([
      prisma.lead.findMany({
        where: { stage: 'CONTACTED', updatedAt: { lte: threeDaysAgo } },
        select: { id: true, companyName: true },
      }),
      prisma.lead.findMany({
        where: { stage: 'PROPOSAL_SENT', updatedAt: { lte: fiveDaysAgo } },
        select: { id: true, companyName: true },
      }),
    ])

    const events: AutomationInsert[] = [
      ...(contactedStale as StaleLead[]).map((l) => ({
        type: 'reminder_contacted_stale',
        leadid: l.id,
        company: l.companyName,
      })),
      ...(proposalStale as StaleLead[]).map((l) => ({
        type: 'ceo_notification_proposal_stale',
        leadid: l.id,
        company: l.companyName,
      })),
    ]

    if (events.length) {
      await prisma.$executeRaw`
        INSERT INTO "AutomationEvent" ("type", "leadId", "company", "status")
        SELECT x.type, x.leadid, x.company, 'PENDING'
        FROM jsonb_to_recordset(${JSON.stringify(events)}::jsonb) AS x(type text, leadid text, company text)
      `
    }

    return NextResponse.json({ created: events.length, events })
  } catch {
    return NextResponse.json({ error: 'Failed to execute automations' }, { status: 500 })
  }
}
