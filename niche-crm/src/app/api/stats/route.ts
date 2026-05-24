import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const today = new Date()
    today.setHours(0,0,0,0)

    const [
      totalLeads,
      closedWon,
      totalClients,
      activeTasks,
      pendingInvoices,
      totalRevenue,
      totalExpenses,
      recentLeads,
      stageStats,
    ] = await Promise.all([
      prisma.lead.count(),
      prisma.lead.count({ where: { stage: 'CLOSED_WON' } }),
      prisma.client.count(),
      prisma.task.count({ where: { status: { not: 'DONE' } } }),
      prisma.invoice.count({ where: { status: 'PENDING' } }),
      prisma.invoice.aggregate({ _sum: { amount: true }, where: { status: 'PAID' } }),
      prisma.expense.aggregate({ _sum: { amount: true } }),
      prisma.lead.findMany({ take: 5, orderBy: { createdAt: 'desc' }, select: { companyName: true, stage: true, dealValue: true, createdAt: true } }),
      prisma.lead.groupBy({ by: ['stage'], _count: true }),
    ])

    const mrr = await prisma.invoice.aggregate({
      _sum: { amount: true },
      where: { recurring: true, status: 'PAID' }
    })

    return NextResponse.json({
      totalLeads,
      closedWon,
      totalClients,
      activeTasks,
      pendingInvoices,
      totalRevenue: totalRevenue._sum.amount ?? 0,
      totalExpenses: totalExpenses._sum.amount ?? 0,
      mrr: mrr._sum.amount ?? 0,
      netProfit: (totalRevenue._sum.amount ?? 0) - (totalExpenses._sum.amount ?? 0),
      recentLeads,
      stageStats,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
