import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { isNonEmptyString, isValidEmail, isValidPhone, normalizePhone } from '@/lib/validation'
import { checkRateLimit, generateOtpCode, isStrongPassword } from '@/lib/auth-security'

type SignupPayload = {
  fullName: unknown
  email: unknown
  password: unknown
  phone?: unknown
  timezone?: unknown
  role?: unknown
}

const ALLOWED_ROLES = new Set(['ADMIN', 'FINANCE', 'PROJECT_MANAGER', 'CLIENT', 'FREELANCER'])

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? 'local'
    const rl = checkRateLimit(`signup:${ip}`, 10, 10 * 60 * 1000)
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many signup attempts. Please retry later.' }, { status: 429 })
    }

    const body = (await req.json()) as SignupPayload

    if (!isNonEmptyString(body.fullName) || !isNonEmptyString(body.email) || !isNonEmptyString(body.password)) {
      return NextResponse.json({ error: 'fullName, email and password are required' }, { status: 400 })
    }

    const email = body.email.toLowerCase().trim()
    const fullName = body.fullName.trim()
    const password = body.password
    const phone = isNonEmptyString(body.phone) ? normalizePhone(body.phone.trim()) : ''

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    if (!phone || !isValidPhone(phone)) {
      return NextResponse.json({ error: 'Invalid phone format. Use +212612345678' }, { status: 400 })
    }

    if (!isStrongPassword(password)) {
      return NextResponse.json({ error: 'Password must be at least 10 chars with upper/lower/number/symbol' }, { status: 400 })
    }

    const roleInput = isNonEmptyString(body.role) ? body.role.toUpperCase() : 'CLIENT'
    const role = ALLOWED_ROLES.has(roleInput) ? roleInput : 'CLIENT'

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'User already exists with this email' }, { status: 409 })
    }

    const hash = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: { email, password: hash, name: fullName, role },
      select: { id: true, email: true, name: true, role: true },
    })

    await prisma.$executeRaw`
      INSERT INTO "UserProfile" ("userId", phone, timezone)
      VALUES (${user.id}, ${phone}, ${isNonEmptyString(body.timezone) ? body.timezone : null})
    `

    const otp = generateOtpCode()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    await prisma.$executeRaw`
      INSERT INTO "EmailVerificationCode" (email, code, "expiresAt")
      VALUES (${email}, ${otp}, ${expiresAt})
    `

    return NextResponse.json(
      {
        ...user,
        verificationRequired: true,
        verificationHint: 'Use the OTP sent to your email (dev fallback returned).',
        devOtp: otp,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('POST /api/auth/signup failed', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
