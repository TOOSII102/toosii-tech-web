// In-memory reset token store
// Tokens are time-limited (15 minutes) and single-use

const TOKEN_TTL = 15 * 60 * 1000 // 15 minutes

if (!global.__resetTokens) {
  global.__resetTokens = new Map()
}

export function createResetToken(email) {
  const token   = crypto.randomUUID()
  const expires = Date.now() + TOKEN_TTL
  global.__resetTokens.set(token, { email, expires })
  return token
}

export function verifyResetToken(token) {
  const entry = global.__resetTokens.get(token)
  if (!entry) return null
  if (Date.now() > entry.expires) {
    global.__resetTokens.delete(token)
    return null
  }
  return entry.email
}

export function consumeResetToken(token) {
  const email = verifyResetToken(token)
  if (email) global.__resetTokens.delete(token)
  return email
}
