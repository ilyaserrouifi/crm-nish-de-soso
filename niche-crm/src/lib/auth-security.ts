const inMemoryBuckets = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now()
  const bucket = inMemoryBuckets.get(key)

  if (!bucket || now > bucket.resetAt) {
    inMemoryBuckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: max - 1 }
  }

  if (bucket.count >= max) {
    return { allowed: false, remaining: 0, retryAfterMs: bucket.resetAt - now }
  }

  bucket.count += 1
  return { allowed: true, remaining: max - bucket.count }
}

export function isStrongPassword(password: string) {
  if (password.length < 10) return false
  const hasUpper = /[A-Z]/.test(password)
  const hasLower = /[a-z]/.test(password)
  const hasDigit = /\d/.test(password)
  const hasSpecial = /[^A-Za-z0-9]/.test(password)
  return hasUpper && hasLower && hasDigit && hasSpecial
}

export function generateOtpCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}
