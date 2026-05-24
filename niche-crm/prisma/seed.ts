import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hash = await bcrypt.hash('admin123', 10)
  
  await prisma.user.upsert({
    where: { email: 'admin@niche.com' },
    update: {},
    create: {
      email: 'admin@niche.com',
      password: hash,
      name: 'Admin',
      role: 'ADMIN',
    }
  })

  console.log('✅ Admin user created: admin@niche.com / admin123')
}

main().catch(console.error).finally(() => prisma.$disconnect())
