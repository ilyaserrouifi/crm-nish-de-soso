import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { isNonEmptyString } from '@/lib/validation'

type SignupPayload = {
  fullName: unknown
  email: unknown
  password: unknown
  phone?: unknown
  role?: unknown
}

const ALLOWED_ROLES = new Set(['ADMIN', 'FINANCE', 'PROJECT_MANAGER', 'CLIENT', 'FREELANCER'])

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SignupPayload

    if (!isNonEmptyString(body.fullName) || !isNonEmptyString(body.email) || !isNonEmptyString(body.password)) {
      return NextResponse.json({ error: 'fullName, email and password are required' }, { status: 400 })
    }

    const email = body.email.toLowerCase().trim()
    const fullName = body.fullName.trim()
    const password = body.password

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const roleInput = isNonEmptyString(body.role) ? body.role.toUpperCase() : 'CLIENT'
    const role = ALLOWED_ROLES.has(roleInput) ? roleInput : 'CLIENT'

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'User already exists with this email' }, { status: 409 })
    }

    const hash = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        email,
        password: hash,
        name: fullName,
        role,
      },
      select: { id: true, email: true, name: true, role: true },
    })

    return NextResponse.json({
      ...user,
      profile: {
        phone: isNonEmptyString(body.phone) ? body.phone : null,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('POST /api/auth/signup failed', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
