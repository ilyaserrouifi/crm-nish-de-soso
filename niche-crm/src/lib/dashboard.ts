import { prisma } from '@/lib/prisma'

export type DashboardOverview = {
  generatedAt: string
  todaysNumbers: {
    callsMade: number
    callsTarget: number
    meetingsBooked: number
    meetingsTarget: number
    dealsClosed: number
    dealsTarget: number
    revenueToday: number
  }
  pipelineValue: {
    total: number
    thisMonth: number
    atRisk: number
  }
  teamPerformance: {
    topPerformer: string
    needsAttention: string
  }
  financeSnapshot: {
    mrr: number
    expenses: number
    netProfit: number
    pendingInvoicesCount: number
  }
  stageStats: Array<{ stage: string; count: number }>
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    coldCallers,
    leads,
    stageStats,
    invoicesToday,
    pendingInvoicesCount,
    expenses,
    recurringPaidInvoices,
  ] = await Promise.all([
    prisma.coldCaller.findMany({
      select: { name: true, callsMade: true, meetingsBooked: true, closes: true, score: true },
    }),
    prisma.lead.findMany({
      select: { stage: true, dealValue: true, createdAt: true, updatedAt: true },
    }),
    prisma.lead.groupBy({ by: ['stage'], _count: true }),
    prisma.invoice.aggregate({ _sum: { amount: true }, where: { status: 'PAID', paidAt: { gte: todayStart } } }),
    prisma.invoice.count({ where: { status: 'PENDING' } }),
    prisma.expense.aggregate({ _sum: { amount: true } }),
    prisma.invoice.aggregate({ _sum: { amount: true }, where: { recurring: true, status: 'PAID' } }),
  ])

  const callsMade = coldCallers.reduce((sum, c) => sum + c.callsMade, 0)
  const meetingsBooked = coldCallers.reduce((sum, c) => sum + c.meetingsBooked, 0)
  const dealsClosed = coldCallers.reduce((sum, c) => sum + c.closes, 0)

  const pipelineTotal = leads
    .filter((l) => !['CLOSED_WON', 'CLOSED_LOST'].includes(l.stage))
    .reduce((sum, l) => sum + (l.dealValue ?? 0), 0)

  const pipelineThisMonth = leads
    .filter((l) => l.createdAt >= monthStart)
    .reduce((sum, l) => sum + (l.dealValue ?? 0), 0)

  const staleDaysThreshold = 7
  const staleMs = staleDaysThreshold * 24 * 60 * 60 * 1000
  const pipelineAtRisk = leads
    .filter((l) => !['CLOSED_WON', 'CLOSED_LOST'].includes(l.stage))
    .filter((l) => now.getTime() - l.updatedAt.getTime() > staleMs)
    .reduce((sum, l) => sum + (l.dealValue ?? 0), 0)

  const sortedByCalls = [...coldCallers].sort((a, b) => b.callsMade - a.callsMade)
  const sortedByScore = [...coldCallers].sort((a, b) => a.score.localeCompare(b.score))

  const topPerformer = sortedByCalls[0]?.name ?? '—'
  const needsAttention = sortedByScore[0]?.name ?? '—'

  const mrr = recurringPaidInvoices._sum.amount ?? 0
  const totalExpenses = expenses._sum.amount ?? 0
  const revenueToday = invoicesToday._sum.amount ?? 0

  return {
    generatedAt: now.toISOString(),
    todaysNumbers: {
      callsMade,
      callsTarget: 1500,
      meetingsBooked,
      meetingsTarget: 30,
      dealsClosed,
      dealsTarget: 6,
      revenueToday,
    },
    pipelineValue: {
      total: pipelineTotal,
      thisMonth: pipelineThisMonth,
      atRisk: pipelineAtRisk,
    },
    teamPerformance: {
      topPerformer,
      needsAttention,
    },
    financeSnapshot: {
      mrr,
      expenses: totalExpenses,
      netProfit: mrr - totalExpenses,
      pendingInvoicesCount,
    },
    stageStats: stageStats.map((s) => ({ stage: s.stage, count: s._count })),
  }
}
