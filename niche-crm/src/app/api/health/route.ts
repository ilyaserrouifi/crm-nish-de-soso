import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const startedAt = Date.now()

  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({
      status: 'ok',
      db: 'up',
      uptimeMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json(
      {
        status: 'degraded',
        db: 'down',
        uptimeMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}
