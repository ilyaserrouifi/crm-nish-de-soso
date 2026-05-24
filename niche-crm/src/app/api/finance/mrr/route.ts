import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    const thisMonthRecurring = await prisma.income.findMany({ where: { type: 'Recurring', date: { gte: startOfMonth } } })
    const lastMonthRecurring = await prisma.income.findMany({ where: { type: 'Recurring', date: { gte: startOfLastMonth, lte: endOfLastMonth } } })
    const newMrr = thisMonthRecurring.reduce((s, i) => s + i.amount, 0)
    const lastMrr = lastMonthRecurring.reduce((s, i) => s + i.amount, 0)
    const momGrowth = lastMrr ? (((newMrr - lastMrr) / lastMrr) * 100).toFixed(1) : 0
    return NextResponse.json({ newMrr, churnedMrr: 0, expansionMrr: 0, netMrr: newMrr, momGrowth })
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}
