import { prisma } from '@/lib/prisma'

let userProfileTableExistsCache: boolean | null = null
let userProfileCacheAt = 0
const CACHE_TTL_MS = 60_000

export async function hasUserProfileTable(): Promise<boolean> {
  const now = Date.now()
  if (userProfileTableExistsCache !== null && now - userProfileCacheAt < CACHE_TTL_MS) {
    return userProfileTableExistsCache
  }

  try {
    const rows = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'UserProfile'
      ) AS "exists"
    `

    userProfileTableExistsCache = Boolean(rows[0]?.exists)
    userProfileCacheAt = now
    return userProfileTableExistsCache
  } catch (error) {
    console.error('DB capability check failed for UserProfile table', error)
    userProfileTableExistsCache = false
    userProfileCacheAt = now
    return false
  }
}
