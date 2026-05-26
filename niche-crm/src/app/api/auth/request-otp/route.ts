import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, generateOtpCode } from '@/lib/auth-security'
import { isNonEmptyString } from '@/lib/validation'

type Body = { email?: unknown }

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ?? 'local'
  const rl = checkRateLimit(`otp:${ip}`, 10, 10 * 60 * 1000)
  if (!rl.allowed) return NextResponse.json({ error: 'Too many OTP requests' }, { status: 429 })

  const body = (await req.json()) as Body
  if (!isNonEmptyString(body.email)) return NextResponse.json({ error: 'email is required' }, { status: 400 })

  const email = body.email.toLowerCase().trim()
  const code = generateOtpCode()
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

  await prisma.$executeRaw`
    INSERT INTO "EmailVerificationCode" (email, code, "expiresAt")
    VALUES (${email}, ${code}, ${expiresAt})
  `

  return NextResponse.json({ message: 'OTP created', devOtp: code })
}
