import { NextResponse } from 'next/server'

const EP = 'https://eliteprotech-apis.zone.id'

export const maxDuration = 60

export async function POST(req) {
  try {
    const ct = req.headers.get('content-type') || ''
    let audioUrl = null

    if (ct.includes('application/json')) {
      const body = await req.json()
      audioUrl = body.url?.trim()
      if (!audioUrl || !/^https?:\/\//i.test(audioUrl)) {
        return NextResponse.json({ error: 'Please provide a valid audio URL.' }, { status: 400 })
      }
    } else if (ct.includes('multipart/form-data')) {
      const formData = await req.formData()
      const file = formData.get('file')
      if (!file) return NextResponse.json({ error: 'No file provided.' }, { status: 400 })

      const buf = Buffer.from(await file.arrayBuffer())
      if (buf.length < 1000) return NextResponse.json({ error: 'File too small or empty.' }, { status: 400 })

      const cbForm = new FormData()
      const blob = new Blob([buf], { type: file.type || 'audio/mpeg' })
      cbForm.append('reqtype', 'fileupload')
      cbForm.append('fileToUpload', blob, file.name || 'audio.mp3')

      const cbRes = await fetch('https://catbox.moe/user/api.php', {
        method: 'POST', body: cbForm, signal: AbortSignal.timeout(30000),
      })
      audioUrl = (await cbRes.text()).trim()
      if (!audioUrl.startsWith('http')) {
        return NextResponse.json({ error: 'Failed to upload audio file. Try again.' }, { status: 502 })
      }
    } else {
      return NextResponse.json({ error: 'Unsupported content type.' }, { status: 400 })
    }

    const vrRes = await fetch(`${EP}/vocalremove?url=${encodeURIComponent(audioUrl)}`, {
      signal: AbortSignal.timeout(55000),
    })
    if (!vrRes.ok) throw new Error(`EliteProTech ${vrRes.status}`)
    const vrd = await vrRes.json()

    const instrUrl = vrd.instrumental || vrd.result || vrd.url || vrd.download
    if (!instrUrl) {
      return NextResponse.json({ error: 'Vocal removal failed. Make sure the audio is clear and accessible.' }, { status: 502 })
    }

    return NextResponse.json({ instrumental: instrUrl, original: audioUrl })
  } catch (e) {
    console.error('[vocal-remover]', e.message)
    return NextResponse.json({ error: 'Processing failed: ' + e.message }, { status: 500 })
  }
}
