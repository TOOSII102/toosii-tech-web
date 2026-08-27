export const ADMIN_EMAIL = 'toosii042@gmail.com'

export function getAdminCredentials() {
  const password = process.env.ADMIN_PASSWORD?.trim()
  const secret = process.env.ADMIN_SECRET?.trim()

  if (!password || !secret) return null
  return { password, secret }
}

export function isValidAdminSession(token) {
  const credentials = getAdminCredentials()
  return Boolean(credentials && token && token === credentials.secret)
}
