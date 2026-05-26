import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { isNonEmptyString, isValidEmail, isValidPhone, normalizePhone } from '@/lib/validation'
import { checkRateLimit } from '@/lib/auth-security'

type LoginPayload = {
  identifier: unknown
  password: unknown
}

type UserRow = { id: string; name: string; email: string; role: string; password: string; emailVerifiedAt: Date | null }

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? 'local'
    const rl = checkRateLimit(`login:${ip}`, 20, 10 * 60 * 1000)
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many login attempts. Please retry later.' }, { status: 429 })
    }

    const body = (await req.json()) as LoginPayload
    if (!isNonEmptyString(body.identifier) || !isNonEmptyString(body.password)) {
      return NextResponse.json({ error: 'Identifier and password required' }, { status: 400 })
    }

    const identifier = body.identifier.trim()
    const identifierIsEmail = isValidEmail(identifier)
    const identifierIsPhone = isValidPhone(identifier)

    if (!identifierIsEmail && !identifierIsPhone) {
      return NextResponse.json({ error: 'Use a valid email or phone number' }, { status: 400 })
    }

    const normalizedPhone = identifierIsPhone ? normalizePhone(identifier) : null

    const users = await prisma.$queryRaw<UserRow[]>`
      SELECT u.id, u.name, u.email, u.role, u.password, p."emailVerifiedAt"
      FROM "User" u
      LEFT JOIN "UserProfile" p ON p."userId" = u.id
      WHERE u.email = ${identifier.toLowerCase()} OR p.phone = ${normalizedPhone}
      LIMIT 1
    `

    const user = users[0]
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    if (!user.emailVerifiedAt) {
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
