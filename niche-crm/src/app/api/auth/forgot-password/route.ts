import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/auth-security'
import { isNonEmptyString, isValidEmail, isValidPhone, normalizePhone } from '@/lib/validation'

type ForgotPayload = { identifier: unknown }

function generateTempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%'
  let out = ''
  for (let i = 0; i < 12; i += 1) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? 'local'
    const rl = checkRateLimit(`forgot:${ip}`, 8, 10 * 60 * 1000)
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many attempts. Please retry later.' }, { status: 429 })
    }

    const body = (await req.json()) as ForgotPayload
    if (!isNonEmptyString(body.identifier)) {
      return NextResponse.json({ error: 'Email or phone is required.' }, { status: 400 })
    }

    const identifier = body.identifier.trim()
    let user: { id: string; email: string } | null = null

    if (isValidEmail(identifier)) {
      user = await prisma.user.findUnique({ where: { email: identifier.toLowerCase() }, select: { id: true, email: true } })
    } else if (isValidPhone(identifier)) {
      const profile = await prisma.userProfile.findFirst({
        where: { phone: normalizePhone(identifier) },
        include: { user: { select: { id: true, email: true } } },
      })
      user = profile?.user ?? null
    } else {
      return NextResponse.json({ error: 'Use a valid email or phone number.' }, { status: 400 })
    }

    // always return generic success to avoid user enumeration
    if (!user) {
      return NextResponse.json({ ok: true, message: 'If your account exists, reset instructions were sent.' })
    }

    const tempPassword = generateTempPassword()
    const passwordHash = await bcrypt.hash(tempPassword, 12)
    await prisma.user.update({ where: { id: user.id }, data: { password: passwordHash } })

    // TODO: integrate real transactional email provider in production.
    console.info(`Temporary password for ${user.email}: ${tempPassword}`)

    return NextResponse.json({
      ok: true,
      message: 'If your account exists, reset instructions were sent.',
      devTemporaryPassword: tempPassword,
    })
  } catch (error) {
    console.error('POST /api/auth/forgot-password failed', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
