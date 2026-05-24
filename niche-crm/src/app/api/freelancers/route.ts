import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const freelancers = await prisma.freelancer.findMany()
    return NextResponse.json(freelancers)
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const freelancer = await prisma.freelancer.create({
      data: {
        name: body.name,
        username: body.username || body.name.toLowerCase().replace(/\s+/g, ''),
        phone: body.phone || '',
        role: body.role || 'freelancer',
        skills: body.skills || '',
        portfolioUrl: body.portfolioUrl || null,
        rate: parseFloat(body.rate) || 0,
        rateType: body.rateType || 'Hourly',
        timezone: body.timezone || 'UTC',
        available: body.available !== false,
        rating: parseFloat(body.rating) || 5,
        score: body.score || 'B',
      }
    })
    return NextResponse.json(freelancer)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
