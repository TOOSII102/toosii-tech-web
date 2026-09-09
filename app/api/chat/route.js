import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { createHash } from 'crypto'
import { hostImage } from '../../../lib/imageHost'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const GROQ_MODELS = new Set(['llama-3.3-70b-versatile','llama-3.1-8b-instant','mixtral-8x7b-32768','gemma2-9b-it'])
const REFERENCE_AI_MODEL = 'toosii-gptlogic'
const REFERENCE_AI_ENDPOINT = 'https://r-bots-free-apis.co08.art'
const REFERENCE_AI_MODELS = {
  'toosii-qwen': { path: '/api/qwen', acceptsPrompt: false },
  'toosii-deepseek-v3': { path: '/api/deepseek-v3', acceptsPrompt: false },
  'toosii-deepseek-r1': { path: '/api/deepseek-r1', acceptsPrompt: false },
  'toosii-gemini': { path: '/api/gemini', acceptsPrompt: false },
  'toosii-gptlogic': { path: '/api/gptlogic', acceptsPrompt: true },
}
const VISION_MODELS = new Set(['toosii-vision','gpt-4o','gpt-4o-mini','claude-3-5-sonnet-20241022','claude-3-5-haiku-20241022','grok-2-vision-1212','gemini-2.0-flash','gemini-1.5-flash','gemini-1.5-pro'])
// Keyed providers first (full scene understanding), then the always-available
// key-free Toosii Vision pipeline (image hosting + text extraction + chat).
const VISION_PRIORITY = [
  { id: 'gemini-2.0-flash',          key: 'GEMINI_API_KEY' },
  { id: 'gemini-1.5-flash',          key: 'GEMINI_API_KEY' },
  { id: 'gpt-4o-mini',               key: 'OPENAI_API_KEY' },
  { id: 'gpt-4o',                    key: 'OPENAI_API_KEY' },
  { id: 'claude-3-5-haiku-20241022', key: 'ANTHROPIC_API_KEY' },
  { id: 'grok-2-vision-1212',        key: 'XAI_API_KEY' },
  { id: 'toosii-vision',             key: null },
]
const GENERAL_MODEL_PRIORITY = [
  { id: 'toosii-qwen',               key: null },
  { id: 'toosii-deepseek-v3',        key: null },
  { id: 'toosii-deepseek-r1',        key: null },
  { id: 'toosii-gemini',             key: null },
  { id: REFERENCE_AI_MODEL,          key: null },
  { id: 'llama-3.3-70b-versatile',   key: 'GROQ_API_KEY' },
  { id: 'llama-3.1-8b-instant',      key: 'GROQ_API_KEY' },
  { id: 'gemma2-9b-it',              key: 'GROQ_API_KEY' },
  { id: 'gemini-2.0-flash',          key: 'GEMINI_API_KEY' },
  { id: 'gemini-1.5-flash',          key: 'GEMINI_API_KEY' },
  { id: 'gpt-4o-mini',               key: 'OPENAI_API_KEY' },
  { id: 'claude-3-5-haiku-20241022', key: 'ANTHROPIC_API_KEY' },
  { id: 'grok-3-mini',              key: 'XAI_API_KEY' },
]
const CONTEXT_BUDGET = { groq: 24_000, default: 120_000 }

function getProvider(model) {
  if (model === 'toosii-vision')   return 'freevision'
  if (REFERENCE_AI_MODELS[model]) return 'reference'
  if (model.startsWith('claude-'))  return 'anthropic'
  if (model.startsWith('grok-'))    return 'grok'
  if (model.startsWith('gemini-'))  return 'gemini'
  if (GROQ_MODELS.has(model))       return 'groq'
  return 'openai'
}
function getClient(provider) {
  if (provider === 'reference') return null
  if (provider === 'anthropic') {
    const k = process.env.ANTHROPIC_API_KEY; if (!k) throw new Error('ANTHROPIC_API_KEY not configured')
    return new Anthropic({ apiKey: k })
  }
  const cfg = { grok: { key: 'XAI_API_KEY', baseURL: 'https://api.x.ai/v1' }, groq: { key: 'GROQ_API_KEY', baseURL: 'https://api.groq.com/openai/v1' }, gemini: { key: 'GEMINI_API_KEY', baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/' }, openai: { key: 'OPENAI_API_KEY', baseURL: undefined } }
  const c = cfg[provider] || cfg.openai
  const k = process.env[c.key]; if (!k) throw new Error(c.key + ' not configured')
  return new OpenAI({ apiKey: k, ...(c.baseURL ? { baseURL: c.baseURL } : {}) })
}
function trimMessages(msgs, budget) {
  const safe = msgs.map(m => ({ ...m, content: m.content ?? '' }))
  const system = safe.filter(m => m.role === 'system')
  const convo  = safe.filter(m => m.role !== 'system')
  let total = system.reduce((s, m) => s + m.content.length, 0)
  const kept = []
  for (let i = convo.length - 1; i >= 0; i--) {
    const len = convo[i].content.length + (convo[i].imageBase64?.length ?? 0)
    if (total + len > budget && kept.length > 0) break
    total += len; kept.unshift(convo[i])
  }
  return [...system, ...kept]
}
function buildOAIMessages(msgs, vision) {
  return msgs.map(m => {
    if (m.imageBase64 && vision) return { role: m.role, content: [...(m.content ? [{ type: 'text', text: m.content }] : []), { type: 'image_url', image_url: { url: 'data:' + (m.imageMimeType ?? 'image/jpeg') + ';base64,' + m.imageBase64 } }] }
    if (m.imageBase64) return { role: m.role, content: (m.content || '') + '\n[image attached — switch to a vision model]' }
    return { role: m.role, content: m.content ?? '' }
  })
}
function buildReferenceParams(model, msgs) {
  const reference = REFERENCE_AI_MODELS[model] || REFERENCE_AI_MODELS[REFERENCE_AI_MODEL]
  const conversation = msgs.filter(m => m.role !== 'system').slice(-8).map(m => `${m.role}: ${String(m.content || '').slice(0, 1400)}`).join('\n')
  const latest = [...msgs].reverse().find(m => m.role === 'user')?.content || 'Hello'
  const prompt = [
    'You are Toosii AI, a concise and professional coding assistant built by Toosii Tech.',
    'Answer the latest user request directly. Use markdown when code is needed.',
    'Never identify yourself by an underlying provider or model name. Always identify yourself only as Toosii AI, built by Toosii Tech.',
    conversation ? `Conversation context:\n${conversation}` : '',
  ].filter(Boolean).join('\n\n').slice(0, 7200)
  return reference.acceptsPrompt
    ? new URLSearchParams({ q: String(latest).slice(0, 2400), prompt })
    : new URLSearchParams({ q: prompt.slice(0, 8000) })
}

function brandReferenceText(value) {
  return value
    .replace(/\b(I\s*(?:am|'m|’m))\s+(?:gemini|qwen|deepseek(?:[- ]?(?:v3|r1))?|llama(?:[- ]?[0-9.]+)?|gpt)\b/gi, '$1 Toosii AI')
    .replace(/\ba large language model built by (?:google|alibaba|deepseek|meta|openai)\b/gi, 'a professional AI assistant built by Toosii Tech')
    .replace(/\b(?:gemini|qwen|deepseek(?:[- ]?(?:v3|r1))?|llama(?:[- ]?[0-9.]+)?|gpt)\s+(?:ai|assistant|model)\b/gi, 'Toosii AI')
}

function extractReferenceText(payload) {
  if (typeof payload === 'string') return brandReferenceText(payload.trim())
  const candidates = [payload?.response, payload?.answer, payload?.result, payload?.message, payload?.data?.response, payload?.data?.answer, payload?.data?.result, payload?.data?.message]
  const value = candidates.find(item => typeof item === 'string' && item.trim())
  return value ? brandReferenceText(value.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/<\/?think>/gi, '').trim()) : ''
}

async function callReference(model, qParams) {
  const reference = REFERENCE_AI_MODELS[model] || REFERENCE_AI_MODELS[REFERENCE_AI_MODEL]
  const url = `${REFERENCE_AI_ENDPOINT}${reference.path}?${qParams.toString()}`
  const res = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(25_000) })
  const payload = await res.json().catch(() => null)
  if (!res.ok || payload?.status === false) throw new Error('Toosii AI fallback is temporarily unavailable')
  const text = extractReferenceText(payload)
  if (!text) throw new Error('Toosii AI fallback returned an empty response')
  return text
}

async function requestReferenceAI(model, msgs) {
  return callReference(model, buildReferenceParams(model, msgs))
}

// ── Key-free vision pipeline (Toosii Vision) ────────────────────────────────
// No API key available? We still let users upload images: the image is hosted
// temporarily, text is extracted with a free OCR service, and a free chat
// model then answers the user's question about the image content.

const MAX_IMAGE_BYTES = 8 * 1024 * 1024

async function ocrImage(imageUrl) {
  const r = await fetch(`${REFERENCE_AI_ENDPOINT}/api/ocr?url=${encodeURIComponent(imageUrl)}`, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(20_000) })
  const j = await r.json().catch(() => null)
  const text = j?.success && typeof j?.data?.text === 'string' ? j.data.text.trim() : ''
  return text.slice(0, 2000)
}

const VISION_REFERENCES = ['toosii-qwen', 'toosii-deepseek-v3', 'toosii-gemini', REFERENCE_AI_MODEL]

// OCR results cached per image, so follow-up questions about the same picture
// skip re-hosting + re-extraction and answer in ~2s. In-memory, best-effort.
const VISION_CACHE = globalThis.__toosiiVisionCache || (globalThis.__toosiiVisionCache = new Map())
const VISION_CACHE_TTL = 30 * 60 * 1000
function visionCacheGet(key) {
  const e = VISION_CACHE.get(key)
  if (e && Date.now() - e.ts < VISION_CACHE_TTL) return e
  VISION_CACHE.delete(key)
  return null
}
function visionCacheSet(key, e) {
  if (VISION_CACHE.size >= 100) VISION_CACHE.delete(VISION_CACHE.keys().next().value)
  VISION_CACHE.set(key, { ...e, ts: Date.now() })
}

async function requestFreeVision(msgs) {
  const imgMsg = [...msgs].reverse().find(m => m.imageBase64)
  if (!imgMsg) throw new Error('No image attached')
  const question = String(imgMsg.content || 'Describe this image.').slice(0, 1200)
  const bytes = Buffer.from(String(imgMsg.imageBase64), 'base64')
  if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) throw new Error('That image is too large — please upload one under 8 MB.')

  const cacheKey = createHash('sha256').update(imgMsg.imageBase64).digest('hex').slice(0, 24)
  let entry = visionCacheGet(cacheKey)
  if (!entry) {
    const imageUrl = await hostImage(bytes, imgMsg.imageMimeType)
    let ocrText = ''
    try { ocrText = await ocrImage(imageUrl) } catch {}
    entry = { imageUrl, ocrText }
    visionCacheSet(cacheKey, entry)
  }
  const { ocrText } = entry

  const extracted = ocrText
    ? `Text extracted from the image (may contain recognition errors):\n"""${ocrText}"""`
    : 'No readable text was found in the image.'
  const prompt = [
    'You are Toosii Vision, the image-reading mode of Toosii AI, built by Toosii Tech.',
    'The user uploaded an image. ' + extracted,
    `The user's request about the image: """${question}"""`,
    ocrText
      ? 'Answer the request based on the extracted text. If the text looks garbled or incomplete, answer with what is available and note the uncertainty briefly.'
      : 'Explain politely that the image contains no readable text, so the free vision mode can only read text from images (screenshots, documents, chats, signs). Invite the user to describe the image or type any text they see, and promise to help from there.',
    'Never mention other AI brands, models, or OCR engines. You are Toosii Vision by Toosii Tech. Be concise and friendly.',
  ].join('\n\n')

  let lastErr = null
  for (const refModel of VISION_REFERENCES) {
    try {
      const reference = REFERENCE_AI_MODELS[refModel]
      const params = reference.acceptsPrompt
        ? new URLSearchParams({ q: prompt.slice(0, 2400), prompt: 'Answer as Toosii Vision, built by Toosii Tech.' })
        : new URLSearchParams({ q: prompt.slice(0, 8000) })
      return await callReference(refModel, params)
    } catch (err) { lastErr = err }
  }
  throw lastErr ?? new Error('Toosii Vision is temporarily unavailable')
}

function buildAnthropicMessages(msgs, vision) {
  return msgs.filter(m => m.role !== 'system').map(m => {
    if (m.imageBase64 && vision) return { role: m.role, content: [...(m.content ? [{ type: 'text', text: m.content }] : []), { type: 'image', source: { type: 'base64', media_type: m.imageMimeType || 'image/jpeg', data: m.imageBase64 } }] }
    if (m.imageBase64) return { role: m.role, content: (m.content || '') + '\n[image attached]' }
    return { role: m.role, content: m.content ?? '' }
  })
}

export async function OPTIONS() {
  return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } })
}
export async function POST(req) {
  let body; try { body = await req.json() } catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { 'Content-Type': 'application/json' } }) }
  const rawMessages = body.messages ?? []
  if (!Array.isArray(rawMessages) || rawMessages.length === 0) return new Response(JSON.stringify({ error: 'messages array is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } })

  let model = (typeof body.model === 'string' ? body.model.trim() : '') || 'toosii-qwen'
  const hasImage = rawMessages.some(m => m.imageBase64)
  // Text-only chat on the vision entry? Behave like the default text model, silently.
  if (model === 'toosii-vision' && !hasImage) model = 'toosii-qwen'
  const originalModel = model
  // Image attached: route to a true vision model when its API key is configured,
  // otherwise to the always-available key-free Toosii Vision pipeline.
  if (hasImage && (!VISION_MODELS.has(model) || model === 'toosii-vision')) {
    const best = VISION_PRIORITY.find(v => !v.key || process.env[v.key])?.id
    if (best) model = best
  }

  const priorityList = hasImage ? VISION_PRIORITY : GENERAL_MODEL_PRIORITY
  const fallbacks = priorityList.filter(v => !v.key || process.env[v.key]).map(v => v.id).filter(id => id !== model)
  const modelsToAttempt = [model, ...fallbacks]

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder()
      const send = (data) => { try { controller.enqueue(enc.encode('data: ' + JSON.stringify(data) + '\n\n')) } catch {} }
      let succeeded = false, lastKeyErr = null, contentSent = false
      try {
        for (const attemptModel of modelsToAttempt) {
          const ap = getProvider(attemptModel)
          const msgs = trimMessages(rawMessages, CONTEXT_BUDGET[ap] ?? CONTEXT_BUDGET.default)
          const vision = VISION_MODELS.has(attemptModel)
          try {
            if (ap === 'reference') {
              const text = await requestReferenceAI(attemptModel, msgs)
              if (attemptModel !== originalModel) send({ modelSwitch: attemptModel })
              send({ content: text }); contentSent = true; succeeded = true; break
            }
            if (ap === 'freevision') {
              const text = await requestFreeVision(msgs)
              if (attemptModel !== originalModel) send({ modelSwitch: attemptModel })
              send({ content: text }); contentSent = true; succeeded = true; break
            }
            let client; try { client = getClient(ap) } catch (err) { lastKeyErr = err.message; continue }
            if (ap === 'anthropic') {
              const sys = msgs.filter(m => m.role === 'system').map(m => m.content).join('\n\n') || undefined
              const s = client.messages.stream({ model: attemptModel, max_tokens: 16000, system: sys, messages: buildAnthropicMessages(msgs, vision) })
              let ann = false
              for await (const ev of s) {
                if (!ann) { ann = true; if (attemptModel !== originalModel) send({ modelSwitch: attemptModel }) }
                if (ev.type === 'content_block_delta' && ev.delta.type === 'text_delta') { send({ content: ev.delta.text }); contentSent = true }
              }
            } else {
              const s = await client.chat.completions.create({ model: attemptModel, messages: buildOAIMessages(msgs, vision), stream: true })
              if (attemptModel !== originalModel) send({ modelSwitch: attemptModel })
              for await (const chunk of s) { const c = chunk.choices[0]?.delta?.content; if (c) { send({ content: c }); contentSent = true } }
            }
            succeeded = true; break
          } catch (err) {
            const msg = String(err?.message ?? '')
            if (!contentSent) {
              console.warn('[toosii-ai-provider-failed]', attemptModel, msg)
              continue
            }
            throw err
          }
        }
        if (!succeeded) throw new Error(lastKeyErr ?? 'All models unavailable. Please wait or switch models.')
        send({ done: true })
      } catch (err) { send({ error: err?.message ?? 'Unexpected error' }) }
      finally { try { controller.close() } catch {} }
    }
  })
  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-store', 'Connection': 'keep-alive', 'X-Accel-Buffering': 'no', 'Access-Control-Allow-Origin': '*' } })
}
