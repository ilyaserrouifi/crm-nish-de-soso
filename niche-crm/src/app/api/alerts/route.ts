import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type AlertSeverity = 'low' | 'medium' | 'high'

type AlertItem = {
  id: string
  type: 'deadline_risk' | 'invoice_unpaid' | 'low_activity' | 'pipeline_stale'
  severity: AlertSeverity
  message: string
  assignee: string
  timestamp: string
}

export async function GET() {
  try {
    const now = new Date()
    const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)

    const [tasks, unpaidInvoices, lowActivityCallers, staleLeads] = await Promise.all([
      prisma.task.findMany({
        where: { status: { not: 'DONE' }, deadline: { lte: threeDays, gte: now } },
        select: { id: true, name: true, deadline: true, project: { select: { name: true } } },
        take: 20,
      }),
      prisma.invoice.findMany({
        where: { status: 'PENDING', dueDate: { lte: threeDays } },
        select: { id: true, amount: true, dueDate: true, client: { select: { company: true } } },
        take: 20,
      }),
      prisma.coldCaller.findMany({
        where: { callsMade: { lt: 20 } },
        select: { id: true, name: true, updatedAt: true, callsMade: true },
        take: 20,
      }),
      prisma.lead.findMany({
        where: {
          stage: { in: ['CONTACTED', 'MEETING_BOOKED', 'PROPOSAL_SENT', 'NEGOTIATING'] },
          updatedAt: { lte: fiveDaysAgo },
        },
        select: { id: true, companyName: true, stage: true, updatedAt: true },
        take: 20,
      }),
    ])

    const alerts: AlertItem[] = []

    for (const task of tasks) {
      alerts.push({
        id: `task-${task.id}`,
        type: 'deadline_risk',
        severity: 'high',
        message: `Task "${task.name}" is due soon (${task.project.name}).`,
        assignee: 'Project Manager',
        timestamp: (task.deadline ?? now).toISOString(),
      })
    }

    for (const invoice of unpaidInvoices) {
      alerts.push({
        id: `invoice-${invoice.id}`,
        type: 'invoice_unpaid',
        severity: 'medium',
        message: `Invoice for ${invoice.client.company} ($${invoice.amount.toFixed(2)}) is still unpaid.`,
        assignee: 'Finance Team',
        timestamp: invoice.dueDate.toISOString(),
      })
    }

    for (const caller of lowActivityCallers) {
      alerts.push({
        id: `caller-${caller.id}`,
        type: 'low_activity',
        severity: 'medium',
        message: `${caller.name} has low activity (${caller.callsMade} calls).`,
        assignee: caller.name,
        timestamp: caller.updatedAt.toISOString(),
      })
    }

    for (const lead of staleLeads) {
      alerts.push({
        id: `lead-${lead.id}`,
        type: 'pipeline_stale',
        severity: 'low',
        message: `${lead.companyName} is stale in ${lead.stage}.`,
        assignee: 'Sales Team',
        timestamp: lead.updatedAt.toISOString(),
      })
    }

    alerts.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))

    return NextResponse.json({ generatedAt: now.toISOString(), total: alerts.length, alerts })
  } catch {
    return NextResponse.json({ error: 'Failed to build alerts' }, { status: 500 })
  }
}
