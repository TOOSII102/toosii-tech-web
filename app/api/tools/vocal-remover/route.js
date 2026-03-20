import { NextResponse } from 'next/server'

const EP = 'https://eliteprotech-apis.zone.id'

export const maxDuration = 60

async function uploadToHost(buf, filename, mimeType) {
  const blob = new Blob([buf], { type: mimeType || 'audio/mpeg' })

  // 1️⃣ Try catbox.moe
  try {
    const form = new FormData()
    form.append('reqtype', 'fileupload')
    form.append('fileToUpload', blob, filename)
    const res  = await fetch('https://catbox.moe/user/api.php', { method: 'POST', body: form })
    const text = (await res.text()).trim()
    if (text.startsWith('http')) return text
  } catch (_) {}

  // 2️⃣ Try 0x0.st
  try {
    const form = new FormData()
    form.append('file', blob, filename)
    const res  = await fetch('https://0x0.st', { method: 'POST', body: form })
    const text = (await res.text()).trim()
    if (text.startsWith('http')) return text
  } catch (_) {}

  // 3️⃣ Try tmpfiles.org
  try {
    const form = new FormData()
    form.append('file', blob, filename)
    const res  = await fetch('https://tmpfiles.org/api/v1/upload', { method: 'POST', body: form })
    const json = await res.json()
    const url  = json?.data?.url?.replace('tmpfiles.org/', 'tmpfiles.org/dl/')
    if (url?.startsWith('http')) return url
  } catch (_) {}

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
        return NextResponse.json({ error: 'Please enter a valid audio URL starting with http or https.' }, { status: 400 })
      }
    } else if (ct.includes('multipart/form-data')) {
      const formData = await req.formData()
      const file = formData.get('file')
      if (!file) return NextResponse.json({ error: 'No file received. Please select a file and try again.' }, { status: 400 })

      const buf = Buffer.from(await file.arrayBuffer())
      if (buf.length < 1000) return NextResponse.json({ error: 'File appears to be empty or corrupted.' }, { status: 400 })
      if (buf.length > 50 * 1024 * 1024) return NextResponse.json({ error: 'File is too large. Max size is 50 MB.' }, { status: 400 })

      audioUrl = await uploadToHost(buf, file.name || 'audio.mp3', file.type || 'audio/mpeg')
      if (!audioUrl) {
        return NextResponse.json({ error: 'Could not upload your file — all upload servers are busy. Try again in a moment.' }, { status: 502 })
      }
    } else {
      return NextResponse.json({ error: 'Unsupported request format.' }, { status: 400 })
    }

    const vrRes = await fetch(`${EP}/vocalremove?url=${encodeURIComponent(audioUrl)}`)
    if (!vrRes.ok) {
      const body = await vrRes.text().catch(() => '')
      console.error('[vocal-remover] EP error', vrRes.status, body.slice(0, 200))
      return NextResponse.json({ error: `Vocal removal service returned an error (${vrRes.status}). Try again.` }, { status: 502 })
    }

    let vrd
    try {
      vrd = await vrRes.json()
    } catch {
      return NextResponse.json({ error: 'Vocal removal service returned an unexpected response. Try again.' }, { status: 502 })
    }

    const instrUrl = vrd.instrumental || vrd.result || vrd.url || vrd.download
    if (!instrUrl) {
      console.error('[vocal-remover] no instrUrl in', JSON.stringify(vrd))
      return NextResponse.json({ error: 'Vocal removal finished but no instrumental track was returned. Try a different audio file.' }, { status: 502 })
    }

    return NextResponse.json({ instrumental: instrUrl, vocal: vrd.vocal || null, original: audioUrl })
  } catch (e) {
    console.error('[vocal-remover]', e.message)
    return NextResponse.json({ error: 'Processing error: ' + (e.message || 'Unknown error') }, { status: 500 })
  }
}
