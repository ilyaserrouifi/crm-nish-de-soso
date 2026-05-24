import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isNonEmptyString, isOptionalNumber, isOptionalString } from '@/lib/validation'

type CreateClientPayload = {
  company: unknown
  name: unknown
  email: unknown
  phone?: unknown
  niche?: unknown
  mrr?: unknown
  status?: unknown
}

function validateCreateClient(payload: CreateClientPayload) {
  if (!isNonEmptyString(payload.company)) return 'company is required'
  if (!isNonEmptyString(payload.name)) return 'name is required'
  if (!isNonEmptyString(payload.email) || !payload.email.includes('@')) return 'valid email is required'
  if (!isOptionalString(payload.phone)) return 'phone must be a string'
  if (!isOptionalString(payload.niche)) return 'niche must be a string'
  if (!isOptionalNumber(payload.mrr)) return 'mrr must be a number'
  if (!isOptionalString(payload.status)) return 'status must be a string'
  return null
}

export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: 'desc' },
      include: { projects: true, invoices: true },
    })

    return NextResponse.json(clients)
  } catch (error) {
    console.error('GET /api/clients failed', error)
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateClientPayload
    const validationError = validateCreateClient(body)

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    const client = await prisma.client.create({
      data: {
        company: body.company,
        name: body.name,
        email: body.email,
        phone: body.phone,
        niche: body.niche,
        mrr: body.mrr ?? 0,
        status: body.status ?? 'active',
      },
    })

    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    console.error('POST /api/clients failed', error)
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
  }
}
