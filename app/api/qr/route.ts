import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'
import pino from 'pino'
import QRCode from 'qrcode'

const logger = pino({ level: 'silent' })
const SESSION_DIR = path.join(process.cwd(), '.sessions')
const SESSION_PREFIX = process.env.SESSION_PREFIX || 'TOOSII~'

export const dynamic = 'force-dynamic'

function randomId(len = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

async function removeFile(p: string) {
  if (!fs.existsSync(p)) return
  await fs.promises.rm(p, { recursive: true, force: true })
}

export async function GET(req: NextRequest) {
  if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true })

  const id = randomId(8)
  const sessionPath = path.join(SESSION_DIR, id)

  try {
    const {
      default: makeWASocket,
      useMultiFileAuthState,
      fetchLatestBaileysVersion,
      makeCacheableSignalKeyStore,
      Browsers,
      DisconnectReason,
    } = await import('gifted-baileys')

    let version: number[]
    try {
      const v = await fetchLatestBaileysVersion()
      version = v.version
    } catch {
      version = [2, 3000, 1023456789]
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath)

    let qrResolved = false
    let qrDataUrl: string | null = null

    const qrPromise = new Promise<string>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('QR timeout')), 30000)

      const sock = makeWASocket({
        version,
        logger,
        printQRInTerminal: false,
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        browser: Browsers.macOS('Safari'),
        syncFullHistory: false,
        connectTimeoutMs: 30000,
        getMessage: async () => ({ conversation: '' }),
      })

      sock.ev.on('connection.update', async ({ qr, connection, lastDisconnect }) => {
        if (qr && !qrResolved) {
          qrResolved = true
          clearTimeout(timeout)
          const dataUrl = await QRCode.toDataURL(qr, { width: 256, margin: 2, color: { dark: '#000000', light: '#ffffff' } })
          resolve(dataUrl)
        }
        if (connection === 'open') {
          try {
            const credsRaw = fs.readFileSync(path.join(sessionPath, 'creds.json'), 'utf8')
            const sessionId = SESSION_PREFIX + Buffer.from(credsRaw).toString('base64')
            await sock.sendMessage(sock.user!.id, {
              text: `*🔑 Your TOOSII XD ULTRA Session ID:*\n\n\`\`\`${sessionId}\`\`\`\n\n_Keep this safe._`,
            })
          } catch {}
          setTimeout(() => { sock.end(undefined); removeFile(sessionPath).catch(() => {}) }, 5000)
        } else if (connection === 'close') {
          removeFile(sessionPath).catch(() => {})
        }
      })

      sock.ev.on('creds.update', saveCreds)
    })

    qrDataUrl = await qrPromise
    return NextResponse.json({ qr: qrDataUrl, sessionId: id })
  } catch (err: unknown) {
    await removeFile(sessionPath)
    const msg = err instanceof Error ? err.message : 'QR generation failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
