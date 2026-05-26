import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { isNonEmptyString } from '@/lib/validation'
import { checkRateLimit } from '@/lib/auth-security'

type LoginPayload = {
  email: unknown
  password: unknown
}

type VerificationRow = { emailVerifiedAt: Date | null }

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? 'local'
    const rl = checkRateLimit(`login:${ip}`, 20, 10 * 60 * 1000)
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many login attempts. Please retry later.' }, { status: 429 })
    }

    const body = (await req.json()) as LoginPayload

    if (!isNonEmptyString(body.email) || !isNonEmptyString(body.password)) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } })

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const verified = await prisma.$queryRaw<VerificationRow[]>`
      SELECT "emailVerifiedAt"
      FROM "UserProfile"
      WHERE "userId" = ${user.id}
      LIMIT 1
    `

    if (!verified[0]?.emailVerifiedAt) {
      return NextResponse.json({ error: 'Please verify your email before login' }, { status: 403 })
    }

    const valid = await bcrypt.compare(body.password, user.password)

    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64url')
    const response = NextResponse.json({ id: user.id, name: user.name, email: user.email, role: user.role })
    response.cookies.set('crm_session', token, { httpOnly: true, secure: true, sameSite: 'lax', path: '/' })
    return response
  } catch (error) {
    console.error('POST /api/auth/login failed', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
