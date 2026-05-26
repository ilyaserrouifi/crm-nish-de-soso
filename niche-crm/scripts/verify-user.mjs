import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const EMAIL = 'tsperrouifi@gmail.com'

async function main() {
  const user = await prisma.user.findUnique({ where: { email: EMAIL }, select: { id: true, email: true } })

  if (!user) {
    throw new Error(`User not found: ${EMAIL}`)
  }

  const verifiedAt = new Date()

  await prisma.userProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      emailVerifiedAt: verifiedAt,
    },
    update: {
      emailVerifiedAt: verifiedAt,
    },
  })

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
