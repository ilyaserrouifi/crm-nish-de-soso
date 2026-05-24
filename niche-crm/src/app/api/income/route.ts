import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const incomes = await prisma.income.findMany({ orderBy: { date: 'desc' } })
    return NextResponse.json(incomes)
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const income = await prisma.income.create({ data: { ...body, date: new Date(body.date), amount: parseFloat(body.amount) } })
    return NextResponse.json(income)
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}
