import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const [clients, expenses] = await Promise.all([
      prisma.client.findMany({ select: { mrr: true } }),
      prisma.expense.findMany({ select: { amount: true } }),
    ])

    const mrr = clients.reduce((sum, client) => sum + client.mrr, 0)
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
    const netProfit = mrr - totalExpenses

    return NextResponse.json({
      mrr,
      totalExpenses,
      netProfit,
      clientCount: clients.length,
      expenseCount: expenses.length,
    })
  } catch (error) {
    console.error('GET /api/finance failed', error)
    return NextResponse.json(
      { error: 'Failed to compute finance metrics', mrr: 0, totalExpenses: 0, netProfit: 0 },
      { status: 500 }
    )
  }
}
