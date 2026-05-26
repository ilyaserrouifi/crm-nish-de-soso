import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

type GoogleTokenResponse = {
  access_token?: string
  refresh_token?: string
}

type GoogleProfileResponse = {
  sub: string
  email: string
  name?: string
  picture?: string
}


export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_REDIRECT_URI

  if (!code || !clientId || !clientSecret || !redirectUri) {
    return NextResponse.json({ error: 'Invalid Google callback configuration' }, { status: 400 })
  }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenRes.ok) return NextResponse.json({ error: 'Failed to exchange Google code' }, { status: 401 })
  const tokenJson = (await tokenRes.json()) as GoogleTokenResponse
  if (!tokenJson.access_token) return NextResponse.json({ error: 'Missing access token' }, { status: 401 })

  const profileRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  })
  if (!profileRes.ok) return NextResponse.json({ error: 'Failed to fetch Google profile' }, { status: 401 })
  const profile = (await profileRes.json()) as GoogleProfileResponse

  const email = profile.email.toLowerCase()
  let user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true, name: true, role: true } })

  if (!user) {
    const randomPassword = await bcrypt.hash(`${email}:${Date.now()}:google`, 10)
    user = await prisma.user.create({
      data: { email, name: profile.name || email.split('@')[0], password: randomPassword, role: 'CLIENT' },
      select: { id: true, email: true, name: true, role: true },
    })

    await prisma.$executeRaw`
      INSERT INTO "UserProfile" ("userId", "avatarUrl", "emailVerifiedAt")
      VALUES (${user.id}, ${profile.picture ?? null}, NOW())
    `
  } else {
    await prisma.$executeRaw`UPDATE "UserProfile" SET "emailVerifiedAt" = COALESCE("emailVerifiedAt", NOW()) WHERE "userId" = ${user.id}`
  }

  await prisma.$executeRaw`
    INSERT INTO "OAuthAccount" ("userId", provider, "providerUserId", "accessToken", "refreshToken")
    VALUES (${user.id}, 'google', ${profile.sub}, ${tokenJson.access_token}, ${tokenJson.refresh_token ?? null})
    ON CONFLICT (provider, "providerUserId")
    DO UPDATE SET "accessToken" = EXCLUDED."accessToken", "refreshToken" = EXCLUDED."refreshToken"
  `

  const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64url')
  const res = NextResponse.redirect(new URL('/pages/dashboard.html', url.origin))
  res.cookies.set('crm_session', token, { httpOnly: true, secure: true, sameSite: 'lax', path: '/' })
  return res
}
