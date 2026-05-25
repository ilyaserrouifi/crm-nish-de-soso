import { NextResponse } from 'next/server'
import { getDashboardOverview } from '@/lib/dashboard'

export async function GET() {
  try {
    const overview = await getDashboardOverview()
    return NextResponse.json(overview)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch dashboard overview' }, { status: 500 })
  }
}
