import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const EMAIL = 'tsperrouifi@gmail.com'

async function main() {
  const user = await prisma.user.findUnique({ where: { email: EMAIL }, select: { id: true, email: true } })

  if (!user) {
    throw new Error(`User not found: ${EMAIL}`)
  }

  const verifiedAt = new Date()

  await prisma.$executeRaw`
    INSERT INTO "UserProfile" ("id", "userId", "emailVerifiedAt", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), ${user.id}, ${verifiedAt}, NOW(), NOW())
    ON CONFLICT ("userId")
    DO UPDATE SET "emailVerifiedAt" = ${verifiedAt}, "updatedAt" = NOW()
  `

  console.log(`Verified user: ${user.email} at ${verifiedAt.toISOString()}`)
}

main()
  .catch((error) => {
    console.error('verify-user failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
