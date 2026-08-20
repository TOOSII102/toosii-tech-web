import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

const GROQ_MODELS = new Set(['llama-3.3-70b-versatile','llama-3.1-8b-instant','mixtral-8x7b-32768','gemma2-9b-it'])
const REFERENCE_AI_MODEL = 'toosii-gptlogic'
const REFERENCE_AI_ENDPOINT = 'https://r-bots-free-apis.co08.art/api/gptlogic'
const VISION_MODELS = new Set(['gpt-4o','gpt-4o-mini','claude-3-5-sonnet-20241022','claude-3-5-haiku-20241022','grok-2-vision-1212','gemini-2.0-flash','gemini-1.5-flash','gemini-1.5-pro'])
const VISION_PRIORITY = [
  { id: 'gemini-2.0-flash',          key: 'GEMINI_API_KEY' },
  { id: 'gemini-1.5-flash',          key: 'GEMINI_API_KEY' },
  { id: 'gpt-4o-mini',               key: 'OPENAI_API_KEY' },
  { id: 'gpt-4o',                    key: 'OPENAI_API_KEY' },
  { id: 'claude-3-5-haiku-20241022', key: 'ANTHROPIC_API_KEY' },
  { id: 'grok-2-vision-1212',        key: 'XAI_API_KEY' },
]
const GENERAL_MODEL_PRIORITY = [
  { id: 'llama-3.3-70b-versatile',   key: 'GROQ_API_KEY' },
  { id: 'llama-3.1-8b-instant',      key: 'GROQ_API_KEY' },
  { id: 'gemma2-9b-it',              key: 'GROQ_API_KEY' },
  { id: 'gemini-2.0-flash',          key: 'GEMINI_API_KEY' },
  { id: 'gemini-1.5-flash',          key: 'GEMINI_API_KEY' },
  { id: 'gpt-4o-mini',               key: 'OPENAI_API_KEY' },
  { id: 'claude-3-5-haiku-20241022', key: 'ANTHROPIC_API_KEY' },
    { id: 'grok-3-mini',              key: 'XAI_API_KEY' },
  { id: REFERENCE_AI_MODEL,          key: null },
]
const CONTEXT_BUDGET = { groq: 24_000, default: 120_000 }

function getProvider(model) {
  if (model === REFERENCE_AI_MODEL) return 'reference'
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
function buildReferenceRequest(msgs) {
  const conversation = msgs.filter(m => m.role !== 'system').slice(-8).map(m => `${m.role}: ${String(m.content || '').slice(0, 1400)}`).join('\n')
  const latest = [...msgs].reverse().find(m => m.role === 'user')?.content || 'Hello'
  const prompt = [
    'You are Toosii AI, a concise and professional coding assistant built by Toosii Tech.',
    'Answer the latest user request directly. Use markdown when code is needed.',
    conversation ? `Conversation context:\n${conversation}` : '',
  ].filter(Boolean).join('\n\n').slice(0, 7200)
  const params = new URLSearchParams({ q: String(latest).slice(0, 2400), prompt })
  return `${REFERENCE_AI_ENDPOINT}?${params.toString()}`
}

function extractReferenceText(payload) {
  if (typeof payload === 'string') return payload.trim()
  const candidates = [payload?.response, payload?.answer, payload?.result, payload?.data?.response, payload?.data?.answer, payload?.data?.result]
  const value = candidates.find(item => typeof item === 'string' && item.trim())
  return value ? value.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/<\/?think>/gi, '').trim() : ''
}

async function requestReferenceAI(msgs) {
  const res = await fetch(buildReferenceRequest(msgs), { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(30_000) })
  const payload = await res.json().catch(() => null)
  if (!res.ok || payload?.status === false) throw new Error('Toosii AI fallback is temporarily unavailable')
  const text = extractReferenceText(payload)
  if (!text) throw new Error('Toosii AI fallback returned an empty response')
  return text
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

  let model = (body.model ?? '').trim() || 'llama-3.3-70b-versatile'
  const originalModel = model
  const hasImage = rawMessages.some(m => m.imageBase64)
  if (hasImage && !VISION_MODELS.has(model)) { const best = VISION_PRIORITY.find(v => process.env[v.key])?.id; if (best) model = best }

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
              const text = await requestReferenceAI(msgs)
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
            if ((err?.status === 429 || msg.includes('429') || err?.status === 404 || msg.includes('404 status')) && !contentSent) continue
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
