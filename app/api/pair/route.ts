import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'
import pino from 'pino'

const logger = pino({ level: 'silent' })
const SESSION_DIR = path.join(process.cwd(), '.sessions')
const SESSION_PREFIX = process.env.SESSION_PREFIX || 'TOOSII~'

const sessionStatus = new Map<string, { status: string; sessionId?: string }>()
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
  const num = (req.nextUrl.searchParams.get('number') || '').replace(/\D/g, '')
  if (!num) return NextResponse.json({ error: 'Phone number required' }, { status: 400 })

  if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true })

  const id = randomId(8)
  const sessionPath = path.join(SESSION_DIR, id)
  sessionStatus.set(id, { status: 'pending' })

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
      markOnlineOnConnect: true,
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: 10000,
      getMessage: async () => ({ conversation: '' }),
    })

    let code: string | undefined
    if (!sock.authState.creds.registered) {
      await new Promise(r => setTimeout(r, 3000))
      code = await sock.requestPairingCode(num)
    }

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
      if (connection === 'open') {
        try {
          const credsRaw = fs.readFileSync(path.join(sessionPath, 'creds.json'), 'utf8')
          const sessionId = SESSION_PREFIX + Buffer.from(credsRaw).toString('base64')
          await sock.sendMessage(sock.user!.id, {
            text: `*🔑 Your TOOSII XD ULTRA Session ID:*\n\n\`\`\`${sessionId}\`\`\`\n\n_Keep this safe. Do not share it._`,
          })
          sessionStatus.set(id, { status: 'sent', sessionId })
        } catch (err) {
          console.error('[Pair] session send error:', err)
          sessionStatus.set(id, { status: 'failed' })
        }
        setTimeout(() => {
          sock.end(undefined)
          removeFile(sessionPath).catch(() => {})
        }, 5000)
      } else if (connection === 'close') {
        const code = (lastDisconnect?.error as { output?: { statusCode?: number } })?.output?.statusCode
        if (code !== DisconnectReason.loggedOut && code !== 403) {
          sessionStatus.set(id, { status: 'failed' })
        }
        removeFile(sessionPath).catch(() => {})
      }
    })

    return NextResponse.json({ code: code || '--------', sessionId: id })
  } catch (err: unknown) {
    await removeFile(sessionPath)
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
