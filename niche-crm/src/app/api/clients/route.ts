import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { isNonEmptyString, isOptionalNumber, isOptionalString } from '@/lib/validation'

type CreateClientPayload = {
  company: unknown
  name: unknown
  email: unknown
  phone?: unknown
  niche?: unknown
  mrr?: unknown
  status?: unknown
  country?: unknown
  city?: unknown
}

type NormalizedClientPayload = {
  company: string
  name: string
  email: string
  phone?: string
  niche?: string
  mrr: number
  status: string
  country?: string
  city?: string
}

function isMissingClientLocationColumnError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2022' &&
    typeof error.meta?.column === 'string' &&
    (error.meta.column.includes('Client.country') || error.meta.column.includes('Client.city'))
  )
}

function normalizeCreateClient(payload: CreateClientPayload): { data: NormalizedClientPayload } | { error: string } {
  if (!isNonEmptyString(payload.company)) return { error: 'company is required' }
  if (!isNonEmptyString(payload.name)) return { error: 'name is required' }
  if (!isNonEmptyString(payload.email) || !payload.email.includes('@')) return { error: 'valid email is required' }
  if (!isOptionalString(payload.phone)) return { error: 'phone must be a string' }
  if (!isOptionalString(payload.niche)) return { error: 'niche must be a string' }
  if (!isOptionalNumber(payload.mrr)) return { error: 'mrr must be a number' }
  if (!isOptionalString(payload.status)) return { error: 'status must be a string' }
  if (!isOptionalString(payload.country)) return { error: 'country must be a string' }
  if (!isOptionalString(payload.city)) return { error: 'city must be a string' }

  return {
    data: {
      company: payload.company.trim(),
      name: payload.name.trim(),
      email: payload.email.toLowerCase().trim(),
      phone: payload.phone?.trim(),
      niche: payload.niche?.trim(),
      mrr: payload.mrr ?? 0,
      status: payload.status?.trim() || 'active',
      country: payload.country?.trim(),
      city: payload.city?.trim(),
    },
  }
}

export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: 'desc' },
      include: { projects: true, invoices: true },
    })

    return NextResponse.json(clients)
  } catch (error) {
    if (isMissingClientLocationColumnError(error)) {
      try {
        const clients = await prisma.client.findMany({
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            company: true,
            name: true,
            email: true,
            phone: true,
            niche: true,
            mrr: true,
            status: true,
            createdAt: true,
            projects: true,
            invoices: true,
          },
        })
        return NextResponse.json(clients.map((c) => ({ ...c, country: null, city: null })))
      } catch (fallbackError) {
        console.error('GET /api/clients fallback failed', fallbackError)
      }
    }

    console.error('GET /api/clients failed', error)
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateClientPayload
    const normalized = normalizeCreateClient(body)

    if ('error' in normalized) {
      return NextResponse.json({ error: normalized.error }, { status: 400 })
    }

    const client = await prisma.client.create({
      data: normalized.data,
    })

    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    console.error('POST /api/clients failed', error)
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
  }
}
