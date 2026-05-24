import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const expenses = await prisma.expense.findMany()
    const callers = expenses.filter(e => e.category === 'Team').reduce((s, e) => s + e.amount, 0)
    const outreachers = expenses.filter(e => e.category === 'Team').reduce((s, e) => s + e.amount, 0)
    const freelancers = expenses.filter(e => e.category === 'Freelancers').reduce((s, e) => s + e.amount, 0)
    return NextResponse.json({ callers, outreachers, freelancers, total: callers + freelancers })
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}
