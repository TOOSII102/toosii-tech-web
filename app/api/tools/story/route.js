import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const EP = 'https://eliteprotech-apis.zone.id'
const KAALIX = 'https://r-bots-free-apis.co08.art'
// Ordered by how clean their story output is; qwen often leaks reasoning text.
const KAALIX_PROVIDERS = ['/api/gemini', '/api/deepseek-v3', '/api/gptlogic', '/api/qwen']
const REASONING_MARKERS = /(thinking process|deconstruct the prompt|brainstorm|step[- ]by[- ]step reasoning|analyz(e|ing) (the )?(user )?(input|prompt))/i

function buildStoryPrompt(topic) {
  return [
    'You are a professional creative story writer for Toosii Tech.',
    `Write a complete, engaging short story of 450–700 words about the following idea: "${topic}".`,
    'Give it a title as the very first line, then a blank line, then the story in clear paragraphs.',
    'No headers, no reasoning, no notes — just the title line and the story text.',
  ].join(' ')
}

function cleanStory(value) {
  return value
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<\/?think>/gi, '')
    .trim()
    .replace(/^#+\s+/, '')
    .replace(/\*\*/g, '')
    .trim()
}

async function tryEliteProTech(topic) {
  const res = await fetch(`${EP}/story?text=${encodeURIComponent(topic)}`, {
    signal: AbortSignal.timeout(15_000),
  })
  if (!res.ok) throw new Error(`EliteProTech ${res.status}`)
  const data = await res.json().catch(() => null)
  if (!data?.success || typeof data.story !== 'string' || !data.story.trim()) throw new Error('EliteProTech returned no story')
  return data.story.trim()
}

async function tryKaalix(path, topic) {
  const url = `${KAALIX}${path}?${new URLSearchParams({ q: buildStoryPrompt(topic) }).toString()}`
  const res = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(25_000) })
  const payload = await res.json().catch(() => null)
  if (!res.ok || payload?.status === false) throw new Error(`${path} ${res.status}`)
  const candidates = [payload?.response, payload?.message, payload?.result, payload?.answer, payload?.data?.response]
  const value = candidates.find(item => typeof item === 'string' && item.trim())
  if (!value) throw new Error(`${path} returned no story`)
  const story = cleanStory(value)
  if (story.length < 200) throw new Error(`${path} story too short`)
  if (REASONING_MARKERS.test(story)) throw new Error(`${path} leaked reasoning text`)
  return story
}

export async function POST(req) {
  try {
    const { topic } = await req.json().catch(() => ({}))
    const q = String(topic || '').trim()
    if (!q) {
      return NextResponse.json({ error: 'Please enter a story topic.' }, { status: 400 })
    }
    if (q.length > 300) {
      return NextResponse.json({ error: 'Keep your idea under 300 characters for best results.' }, { status: 400 })
    }

    // Primary provider, then the key-less Kaalix fallbacks.
    try {
      return NextResponse.json({ story: await tryEliteProTech(q) })
    } catch (e) {
      console.warn('[story:primary]', e.message)
    }
    for (const path of KAALIX_PROVIDERS) {
      try {
        return NextResponse.json({ story: await tryKaalix(path, q) })
      } catch (e) {
        console.warn('[story:fallback]', path, e.message)
      }
    }

    return NextResponse.json({ error: 'Story generation is busy right now — please try again in a few seconds.' }, { status: 502 })
  } catch (e) {
    console.error('[story]', e.message)
    return NextResponse.json({ error: 'Story generation failed. Try again later.' }, { status: 500 })
  }
}
