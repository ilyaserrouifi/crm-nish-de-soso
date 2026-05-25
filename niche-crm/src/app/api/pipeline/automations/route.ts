import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const now = new Date()
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)

    const [contactedStale, proposalStale] = await Promise.all([
      prisma.lead.findMany({ where: { stage: 'CONTACTED', updatedAt: { lte: threeDaysAgo } }, select: { id: true, companyName: true } }),
      prisma.lead.findMany({ where: { stage: 'PROPOSAL_SENT', updatedAt: { lte: fiveDaysAgo } }, select: { id: true, companyName: true } }),
    ])

    const events = [
      ...contactedStale.map((l) => ({ type: 'reminder_contacted_stale', leadId: l.id, company: l.companyName })),
      ...proposalStale.map((l) => ({ type: 'ceo_notification_proposal_stale', leadId: l.id, company: l.companyName })),
    ]

    if (events.length) {
      await prisma.automationEvent.createMany({ data: events.map((e) => ({ ...e, status: 'PENDING' })) })
    }

    return NextResponse.json({ created: events.length, events })
  } catch {
    return NextResponse.json({ error: 'Failed to execute automations' }, { status: 500 })
  }
}
