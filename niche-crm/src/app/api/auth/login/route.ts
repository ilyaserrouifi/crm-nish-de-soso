import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { isNonEmptyString, isValidEmail, isValidPhone, normalizePhone } from '@/lib/validation'
import { checkRateLimit } from '@/lib/auth-security'

type LoginPayload = {
  identifier: unknown
  password: unknown
}

export async function POST(req: Request) {
  try {
    if (!process.env.DATABASE_URL) {
      console.error('POST /api/auth/login failed: DATABASE_URL is missing')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const forwardedFor = req.headers.get('x-forwarded-for')
    const ip = forwardedFor?.split(',')[0]?.trim() || 'local'
    const rl = checkRateLimit(`login:${ip}`, 20, 10 * 60 * 1000)
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many login attempts. Please retry later.' }, { status: 429 })
    }

    let body: LoginPayload
    try {
      body = (await req.json()) as LoginPayload
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }
    if (!isNonEmptyString(body.identifier) || !isNonEmptyString(body.password)) {
      return NextResponse.json({ error: 'Identifier and password required' }, { status: 400 })
    }

    const identifier = body.identifier.trim()
    const identifierIsEmail = isValidEmail(identifier)
    const identifierIsPhone = isValidPhone(identifier)

    if (!identifierIsEmail && !identifierIsPhone) {
      return NextResponse.json({ error: 'Use a valid email or phone number' }, { status: 400 })
    }

    let user: { id: string; name: string; email: string; role: string; password: string } | null = null
    let emailVerifiedAt: Date | null = null

    if (identifierIsEmail) {
      user = await prisma.user.findUnique({ where: { email: identifier.toLowerCase() } })
      if (user) {
        try {
          const matches = await prisma.$queryRaw<Array<{ emailVerifiedAt: Date | null }>>`
            SELECT "emailVerifiedAt"
            FROM "UserProfile"
            WHERE "userId" = ${user.id}
            LIMIT 1
          `
          emailVerifiedAt = matches[0]?.emailVerifiedAt ?? null
        } catch (profileLookupError) {
          console.error('POST /api/auth/login profile lookup warning', profileLookupError)
          emailVerifiedAt = null
        }
      }
    } else {
      const normalizedPhone = normalizePhone(identifier)
      const matches = await prisma.$queryRaw<
        Array<{ id: string; name: string; email: string; role: string; password: string; emailVerifiedAt: Date | null }>
      >`
          SELECT u.id, u.name, u.email, u.role, u.password, p."emailVerifiedAt"
          FROM "UserProfile" p
          JOIN "User" u ON u.id = p."userId"
          WHERE p.phone = ${normalizedPhone}
          LIMIT 1
        `
      if (matches[0]) {
        user = {
          id: matches[0].id,
          name: matches[0].name,
          email: matches[0].email,
          role: matches[0].role,
          password: matches[0].password,
        }
        emailVerifiedAt = matches[0].emailVerifiedAt
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    if (!emailVerifiedAt) {
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
  } catch (error: unknown) {
    console.error('POST /api/auth/login failed', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
