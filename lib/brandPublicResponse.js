const BRAND_METADATA_KEYS = /^(provider|creator|author|developer|maintainer|owner|poweredby|powered_by|service|source)$/i
const UPSTREAM_BRANDS = /\b(?:casper(?:\s+tech(?:\s+kenya\s+developers?)?)?|keithkeizzah|keith|alpha)\b/i

function cleanValue(value, key) {
  if (typeof value === 'string' && BRAND_METADATA_KEYS.test(key || '') && UPSTREAM_BRANDS.test(value)) {
    return 'Toosii Tech'
  }
  if (Array.isArray(value)) return value.map(item => cleanValue(item, key))
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([childKey, childValue]) => [childKey, cleanValue(childValue, childKey)]))
  }
  return value
}

export function brandPublicResponse(payload) {
  return cleanValue(payload, '')
}
