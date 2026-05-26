import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isNonEmptyString } from '@/lib/validation'

type Body = { email?: unknown; code?: unknown }
type OtpRow = { id: string; expiresAt: Date; consumedAt: Date | null }
type UserRow = { id: string }

export async function POST(req: Request) {
  const body = (await req.json()) as Body
  if (!isNonEmptyString(body.email) || !isNonEmptyString(body.code)) {
    return NextResponse.json({ error: 'email and code are required' }, { status: 400 })
  }

  const email = body.email.toLowerCase().trim()
  const code = body.code.trim()

  const rows = await prisma.$queryRaw<OtpRow[]>`
    SELECT id, "expiresAt", "consumedAt"
    FROM "EmailVerificationCode"
    WHERE email = ${email} AND code = ${code}
    ORDER BY "createdAt" DESC
    LIMIT 1
  `

  const otp = rows[0]
  if (!otp || otp.consumedAt || new Date(otp.expiresAt).getTime() < Date.now()) {
    return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 })
  }

  await prisma.$executeRaw`UPDATE "EmailVerificationCode" SET "consumedAt" = NOW() WHERE id = ${otp.id}`

  const users = await prisma.$queryRaw<UserRow[]>`SELECT id FROM "User" WHERE email = ${email} LIMIT 1`
  if (users[0]) {
    await prisma.$executeRaw`UPDATE "UserProfile" SET "emailVerifiedAt" = NOW() WHERE "userId" = ${users[0].id}`
  }

  return NextResponse.json({ verified: true })
}
