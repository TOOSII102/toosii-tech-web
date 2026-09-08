import { apiError, apiResponse, optionsResponse } from '../../../../../lib/publicApi'
import { decryptConfig, isDecryptableType } from '../../../../../lib/vpnDecrypt'

export const runtime = 'nodejs'
export const maxDuration = 10

const MAX_CONTENT_LENGTH = 256 * 1024
const SUPPORTED_TYPES = new Set(['ovpn', 'ss', 'v2ray', 'v2', 'singbox', 'sing', 'sb', 'json'])

function cleanType(value = '') {
  return String(value).trim().toLowerCase().replace(/[^a-z0-9]/g, '')
}

function parseJson(content) {
  try {
    return { value: JSON.parse(content) }
  } catch {
    return { error: 'The supplied content is not valid JSON.' }
  }
}

function redactKey(key) {
  return /pass(word)?|secret|token|private.?key|access.?key|auth|credential|payload|headers?/i.test(String(key))
}

function redact(value, depth = 0) {
  if (depth > 5) return '[nested data omitted]'
  if (Array.isArray(value)) return value.slice(0, 20).map(item => redact(item, depth + 1))
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.entries(value).slice(0, 80).map(([key, item]) => [
    key,
    redactKey(key) ? '[redacted]' : redact(item, depth + 1),
  ]))
}

function detectJsonType(config) {
  if (!config || typeof config !== 'object') return null
  if (config.server && (config.server_port || config.port) && config.method) return 'ss'
  if (Array.isArray(config.inbounds) || Array.isArray(config.outbounds)) {
    const values = [...(config.inbounds || []), ...(config.outbounds || [])]
    if (values.some(item => item?.type || config.route || config.experimental)) return 'singbox'
    return 'v2ray'
  }
  return 'json'
}

function summarizeJson(config, type) {
  const normalizedType = type === 'v2' ? 'v2ray' : type === 'sing' || type === 'sb' ? 'singbox' : type
  if (normalizedType === 'ss') {
    const entries = Array.isArray(config) ? config : [config]
    return {
      format: 'shadowsocks',
      servers: entries.slice(0, 20).map(item => ({
        server: item?.server || item?.host || null,
        port: item?.server_port || item?.port || null,
        method: item?.method || null,
        plugin: item?.plugin || item?.plugin_opts || null,
        tag: item?.name || item?.remarks || '',
        password: '[redacted]',
      })),
      redactedFields: ['password'],
    }
  }

  if (normalizedType === 'v2ray') {
    return {
      format: 'v2ray',
      inbounds: Array.isArray(config.inbounds) ? config.inbounds.slice(0, 20).map(item => ({
        protocol: item?.protocol || null,
        port: item?.port || null,
        tag: item?.tag || '',
        network: item?.streamSettings?.network || null,
        security: item?.streamSettings?.security || null,
      })) : [],
      outbounds: Array.isArray(config.outbounds) ? config.outbounds.slice(0, 20).map(item => ({
        protocol: item?.protocol || null,
        tag: item?.tag || '',
        network: item?.streamSettings?.network || null,
        security: item?.streamSettings?.security || null,
      })) : [],
      hasRouting: Boolean(config.routing),
      hasDns: Boolean(config.dns),
      hasPolicy: Boolean(config.policy),
    }
  }

  if (normalizedType === 'singbox') {
    return {
      format: 'sing-box',
      inbounds: Array.isArray(config.inbounds) ? config.inbounds.slice(0, 20).map(item => ({
        type: item?.type || null,
        tag: item?.tag || '',
        listen: item?.listen || null,
        listen_port: item?.listen_port || null,
      })) : [],
      outbounds: Array.isArray(config.outbounds) ? config.outbounds.slice(0, 20).map(item => ({
        type: item?.type || null,
        tag: item?.tag || '',
        server: item?.server || null,
        server_port: item?.server_port || null,
      })) : [],
      hasRoute: Boolean(config.route),
      hasDns: Boolean(config.dns),
      hasExperimental: Boolean(config.experimental),
    }
  }

  return {
    format: 'json',
    keys: Object.keys(config).slice(0, 80),
    preview: redact(config),
  }
}

function parseOvpn(content) {
  const result = { format: 'openvpn', remotes: [], directives: {}, inlineBlocks: [] }
  const lines = content.split(/\r?\n/).map(line => line.trim()).filter(Boolean)
  const blockNames = new Set(['ca', 'cert', 'key', 'tls-auth', 'tls-crypt', 'auth-user-pass'])
  for (const line of lines) {
    if (line.startsWith('#') || line.startsWith(';')) continue
    const match = line.match(/^remote\s+([^\s]+)(?:\s+(\d+))?/i)
    if (match) {
      result.remotes.push({ host: match[1], port: Number(match[2] || 1194) })
      continue
    }
    const directive = line.match(/^([a-z0-9_-]+)(?:\s+(.+))?$/i)
    if (!directive) continue
    const key = directive[1].toLowerCase()
    const value = directive[2] || true
    if (blockNames.has(key) || redactKey(key)) {
      result.inlineBlocks.push(key)
      continue
    }
    if (['proto', 'dev', 'cipher', 'auth', 'compress', 'comp-lzo', 'topology', 'route', 'verb'].includes(key)) {
      result.directives[key] = value
    }
  }
  return {
    ...result,
    remoteCount: result.remotes.length,
    inlineBlocks: [...new Set(result.inlineBlocks)],
    redactedFields: ['ca', 'cert', 'key', 'tls-auth', 'tls-crypt', 'auth-user-pass'],
  }
}

function parseShadowsocksUri(content) {
  const uri = content.trim()
  if (!uri.startsWith('ss://')) return null
  try {
    const parsed = new URL(uri)
    const userInfo = Buffer.from(decodeURIComponent(parsed.username || ''), 'base64').toString('utf8')
    const method = userInfo.split(':')[0] || null
    return {
      format: 'shadowsocks',
      servers: [{
        server: parsed.hostname || null,
        port: parsed.port ? Number(parsed.port) : 443,
        method,
        plugin: parsed.searchParams.get('plugin') || null,
        tag: parsed.hash ? decodeURIComponent(parsed.hash.slice(1)) : '',
        password: '[redacted]',
      }],
      redactedFields: ['password'],
    }
  } catch {
    return null
  }
}

async function getInput(request) {
  const contentType = request.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    const body = await request.json()
    return { type: body?.type, filename: body?.filename || 'config', content: body?.content }
  }
  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData()
    const file = form.get('file')
    if (!file || typeof file.text !== 'function') return { error: 'Upload a configuration file in the file field.' }
    if (Number(file.size || 0) > MAX_CONTENT_LENGTH) return { error: 'Configuration files must be 256 KB or smaller.' }
    // Encrypted containers (.hc/.ehi/.dark/...) are binary, so the raw bytes are
    // kept alongside the text view. Decoding those as UTF-8 mangles them.
    const bytes = Buffer.from(await file.arrayBuffer())
    return {
      type: form.get('type'),
      filename: file.name || 'config',
      content: bytes.toString('utf8'),
      bytes,
    }
  }
  return { error: 'Use JSON with type and content, or multipart form data with a file field.' }
}

export async function POST(request) {
  try {
    const input = await getInput(request)
    if (input.error) return apiError(input.error, { status: 400, code: 'INVALID_INPUT' })

    const requestedType = cleanType(input.type)
    const extension = String(input.filename || '').split('.').pop()?.toLowerCase() || ''
    const type = requestedType || extension

    // ── Encrypted tunnel containers ──────────────────────────────────────────
    // These are binary and app-encrypted, so they are decrypted by the external
    // service before being summarised. This is checked BEFORE the text-content
    // guards below, because a binary file has no meaningful text form.
    if (isDecryptableType(type)) {
      if (!input.bytes) {
        return apiError('Encrypted configs must be uploaded as a file (multipart/form-data), not pasted as text.', {
          status: 400,
          code: 'FILE_UPLOAD_REQUIRED',
        })
      }

      const decrypted = await decryptConfig(type, input.bytes, input.filename)
      if (!decrypted.ok) {
        return apiError(decrypted.message, { status: decrypted.status, code: decrypted.code })
      }

      return apiResponse({
        operation: 'config.inspect',
        format: decrypted.type || type,
        app: decrypted.app,
        filename: String(input.filename || 'config').slice(0, 120),
        decrypted: true,
        redacted: true,
        // redact() strips passwords/tokens/keys; the upstream `raw` plaintext is
        // dropped in lib/vpnDecrypt.js and never reaches this point.
        data: redact(decrypted.data),
        note: 'Decrypted by Toosii API. Sensitive passwords, tokens, private keys, credentials, and payload values are omitted.',
      })
    }

    if (typeof input.content !== 'string' || !input.content.trim()) return apiError('Configuration content is required.', { status: 400, code: 'MISSING_CONTENT' })
    if (input.content.length > MAX_CONTENT_LENGTH) return apiError('Configuration content must be 256 KB or smaller.', { status: 413, code: 'CONTENT_TOO_LARGE' })

    if (!SUPPORTED_TYPES.has(type)) {
      return apiError('Supported types are ovpn, ss, v2ray, singbox, json, and the encrypted hc, ehi, dark, npvt, dtlink and naruto formats.', { status: 400, code: 'UNSUPPORTED_FORMAT' })
    }

    let result
    if (type === 'ovpn') {
      result = parseOvpn(input.content)
    } else {
      const parsed = parseJson(input.content)
      if (parsed.error) return apiError(parsed.error, { status: 400, code: 'INVALID_JSON' })
      const detectedType = type === 'json' ? detectJsonType(parsed.value) : type
      result = summarizeJson(parsed.value, detectedType)
    }

    return apiResponse({
      operation: 'config.inspect',
      format: result.format,
      filename: String(input.filename || 'config').slice(0, 120),
      redacted: true,
      data: result,
      note: 'Sensitive passwords, tokens, private keys, credentials, and payload values are omitted by Toosii API.',
    })
  } catch (error) {
    console.error('[config:inspect]', error.message)
    return apiError('Configuration inspection failed. Check the format and try again.', { status: 500, code: 'INSPECTION_FAILED' })
  }
}

export function OPTIONS() {
  return optionsResponse()
}
