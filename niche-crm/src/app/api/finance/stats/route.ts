import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const incomes = await prisma.income.findMany()
    const expenses = await prisma.expense.findMany()
    const totalRevenue = incomes.reduce((s, i) => s + i.amount, 0)
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
    const mrr = incomes.filter(i => i.type === 'Recurring').reduce((s, i) => s + i.amount, 0)
    return NextResponse.json({ mrr, totalRevenue, totalExpenses, netProfit: totalRevenue - totalExpenses })
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}
