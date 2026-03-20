import { NextResponse } from 'next/server'

const EP = 'https://eliteprotech-apis.zone.id'

export const maxDuration = 60

async function uploadToHost(buf, filename, mimeType) {
  const blob = new Blob([buf], { type: mimeType || 'audio/mpeg' })
  const name = filename || 'audio.mp3'

  // 1️⃣ catbox.moe — 20s timeout
  try {
    const form = new FormData()
    form.append('reqtype', 'fileupload')
    form.append('fileToUpload', blob, name)
    const res  = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST', body: form,
      signal: AbortSignal.timeout(20000),
    })
    const text = (await res.text()).trim()
    if (text.startsWith('http')) { console.log('[vr] catbox ok'); return text }
  } catch (e) { console.log('[vr] catbox fail:', e.message) }

  // 2️⃣ 0x0.st — 20s timeout
  try {
    const form = new FormData()
    form.append('file', blob, name)
    const res  = await fetch('https://0x0.st', {
      method: 'POST', body: form,
      signal: AbortSignal.timeout(20000),
    })
    const text = (await res.text()).trim()
    if (text.startsWith('http')) { console.log('[vr] 0x0.st ok'); return text }
  } catch (e) { console.log('[vr] 0x0.st fail:', e.message) }

  // 3️⃣ tmpfiles.org — 20s timeout
  try {
    const form = new FormData()
    form.append('file', blob, name)
    const res  = await fetch('https://tmpfiles.org/api/v1/upload', {
      method: 'POST', body: form,
      signal: AbortSignal.timeout(20000),
    })
    const json = await res.json()
    const url  = json?.data?.url?.replace('tmpfiles.org/', 'tmpfiles.org/dl/')
    if (url?.startsWith('http')) { console.log('[vr] tmpfiles ok'); return url }
  } catch (e) { console.log('[vr] tmpfiles fail:', e.message) }

  return null
}

export async function POST(req) {
  try {
    const ct = req.headers.get('content-type') || ''
    let audioUrl = null

    if (ct.includes('application/json')) {
      const body = await req.json()
      audioUrl = body.url?.trim()
      if (!audioUrl || !/^https?:\/\//i.test(audioUrl)) {
        return NextResponse.json({ error: 'Please enter a valid audio URL starting with https://.' }, { status: 400 })
      }

    } else if (ct.includes('multipart/form-data')) {
      const formData = await req.formData()
      const file = formData.get('file')
      if (!file) return NextResponse.json({ error: 'No file received. Please select a file and try again.' }, { status: 400 })

      const buf = Buffer.from(await file.arrayBuffer())
      if (buf.length < 1000) return NextResponse.json({ error: 'File appears to be empty or corrupted.' }, { status: 400 })
      if (buf.length > 4 * 1024 * 1024) return NextResponse.json({ error: 'File is too large for upload (max 4 MB). Use the URL mode instead — host your audio on Dropbox, Google Drive, or any public URL.' }, { status: 400 })

      audioUrl = await uploadToHost(buf, file.name || 'audio.mp3', file.type || 'audio/mpeg')
      if (!audioUrl) {
        return NextResponse.json({ error: 'Could not upload your file — all upload services are unavailable right now. Please try the URL mode instead.' }, { status: 502 })
      }

    } else {
      return NextResponse.json({ error: 'Unsupported request format.' }, { status: 400 })
    }

    console.log('[vr] calling EP with:', audioUrl.slice(0, 60))

    const vrRes = await fetch(`${EP}/vocalremove?url=${encodeURIComponent(audioUrl)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(50000),
    })

    if (!vrRes.ok) {
      const body = await vrRes.text().catch(() => '')
      console.error('[vr] EP error', vrRes.status, body.slice(0, 200))
      return NextResponse.json({ error: `Vocal removal service error (${vrRes.status}). Please try again.` }, { status: 502 })
    }

    const text = await vrRes.text()
    let vrd
    try {
      vrd = JSON.parse(text)
    } catch {
      console.error('[vr] EP non-JSON:', text.slice(0, 200))
      return NextResponse.json({ error: 'Vocal removal service returned an unreadable response. Please try again.' }, { status: 502 })
    }

    const instrUrl = vrd.instrumental || vrd.result || vrd.url || vrd.download
    if (!instrUrl) {
      console.error('[vr] no instrumental in:', JSON.stringify(vrd).slice(0, 200))
      return NextResponse.json({ error: 'Processing finished but no output track was returned. Try a different audio file.' }, { status: 502 })
    }

    return NextResponse.json({ instrumental: instrUrl, vocal: vrd.vocal || null, original: audioUrl })

  } catch (e) {
    console.error('[vr] caught:', e.message)
    const isTimeout = e?.name === 'TimeoutError' || e?.message?.includes('timeout')
    return NextResponse.json({
      error: isTimeout
        ? 'Processing timed out — the audio file may be too long. Try a shorter clip (under 3 minutes).'
        : 'Processing error: ' + (e.message || 'Unknown error'),
    }, { status: 500 })
  }
}
