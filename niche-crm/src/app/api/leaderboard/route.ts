import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const callers = await prisma.caller.findMany({
      orderBy: { score: 'desc' },
      take: 5,
      select: { id: true, name: true, score: true, niche: true }
    })
    return NextResponse.json(callers)
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
