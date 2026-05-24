import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const investments = await prisma.investment.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json(investments)
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const investment = await prisma.investment.create({ data: { ...body, invested: parseFloat(body.invested), expectedRoi: parseFloat(body.expectedRoi), actualRoi: body.actualRoi ? parseFloat(body.actualRoi) : null } })
    return NextResponse.json(investment)
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}
