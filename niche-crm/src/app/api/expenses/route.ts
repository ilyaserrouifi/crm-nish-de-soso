import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const expenses = await prisma.expense.findMany({ orderBy: { date: 'desc' } })
    return NextResponse.json(expenses)
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const expense = await prisma.expense.create({ data: { ...body, date: new Date(body.date), amount: parseFloat(body.amount) } })
    return NextResponse.json(expense)
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}
