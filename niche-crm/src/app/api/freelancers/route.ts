import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isNonEmptyString, isOptionalString } from '@/lib/validation'

type CreateFreelancerPayload = {
  name: unknown
  username: unknown
  phone: unknown
  role: unknown
  skills?: unknown
  portfolioUrl?: unknown
  rate?: unknown
  rateType?: unknown
  timezone?: unknown
  available?: unknown
  rating?: unknown
  score?: unknown
}

function toNumber(value: unknown, fallback: number) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const n = Number(value)
    if (Number.isFinite(n)) return n
  }
  return fallback
}

function normalizeCreateFreelancer(payload: CreateFreelancerPayload) {
  if (!isNonEmptyString(payload.name)) return { error: 'name is required' }
  if (!isNonEmptyString(payload.username)) return { error: 'username is required' }
  if (!isNonEmptyString(payload.phone)) return { error: 'phone is required' }
  if (!isNonEmptyString(payload.role)) return { error: 'role is required' }
  if (!isOptionalString(payload.skills)) return { error: 'skills must be a string' }
  if (!isOptionalString(payload.portfolioUrl)) return { error: 'portfolioUrl must be a string' }
  if (!isOptionalString(payload.rateType)) return { error: 'rateType must be a string' }
  if (!isOptionalString(payload.timezone)) return { error: 'timezone must be a string' }
  if (!isOptionalString(payload.score)) return { error: 'score must be a string' }

  return {
    data: {
      name: payload.name.trim(),
      username: payload.username.trim(),
      phone: payload.phone.trim(),
      role: payload.role.trim(),
      skills: payload.skills?.trim() || '',
      portfolioUrl: payload.portfolioUrl?.trim() || null,
      rate: toNumber(payload.rate, 0),
      rateType: payload.rateType?.trim() || 'Hourly',
      timezone: payload.timezone?.trim() || 'UTC',
      available: payload.available !== false,
      rating: toNumber(payload.rating, 5),
      score: payload.score?.trim() || 'B',
    },
  }
}

export async function GET() {
  try {
    const freelancers = await prisma.freelancer.findMany()
    return NextResponse.json(freelancers)
  } catch (error) {
    console.error('GET /api/freelancers failed', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateFreelancerPayload
    const normalized = normalizeCreateFreelancer(body)

    if ('error' in normalized) {
      return NextResponse.json({ error: normalized.error }, { status: 400 })
    }

    const freelancer = await prisma.freelancer.create({
      data: normalized.data,
    })

    return NextResponse.json(freelancer, { status: 201 })
  } catch (error) {
    console.error('POST /api/freelancers failed', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
