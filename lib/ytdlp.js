import { execFile } from 'child_process'
import { promisify } from 'util'
import { existsSync } from 'fs'
import path from 'path'

const execFileAsync = promisify(execFile)

const NIX_PYTHON_CANDIDATES = [
  '/nix/store/010r29jy64nj14dx7fabacypr4f2q077-python3-3.11.9-env/bin/python3',
  '/usr/bin/python3',
  '/usr/local/bin/python3',
]

let _python3 = null
let _ytdlp   = null

export async function findPython3() {
  if (_python3) return _python3
  const candidates = [...NIX_PYTHON_CANDIDATES, 'python3', 'python']
  for (const py of candidates) {
    try {
      const { stdout } = await execFileAsync(py, ['--version'], { timeout: 5000 })
      if (/python 3/i.test(stdout)) { _python3 = py; return py }
    } catch {}
  }
  return null
}

export function getYtdlpPath() {
  if (_ytdlp) return _ytdlp
  const p = path.join(process.cwd(), 'node_modules/youtube-dl-exec/bin/yt-dlp')
  if (existsSync(p)) { _ytdlp = p; return p }
  return null
}

export async function ytdlpJson(url, extraArgs = []) {
  const python = await findPython3()
  const ytdlp  = getYtdlpPath()
  if (!python || !ytdlp) throw new Error('yt-dlp not available')

  const args = [
    ytdlp,
    '--no-warnings',
    '--no-playlist',
    '--dump-single-json',
    ...extraArgs,
    url,
  ]

  const { stdout } = await execFileAsync(python, args, {
    timeout: 40000,
    maxBuffer: 8 * 1024 * 1024,
    cwd: '/tmp',
  })

  return JSON.parse(stdout)
}

export async function ytdlpGetUrl(url, formatStr, extraArgs = []) {
  const python = await findPython3()
  const ytdlp  = getYtdlpPath()
  if (!python || !ytdlp) throw new Error('yt-dlp not available')

  const args = [
    ytdlp,
    '--no-warnings',
    '--no-playlist',
    '-f', formatStr,
    '--get-url',
    ...extraArgs,
    url,
  ]

  const { stdout } = await execFileAsync(python, args, {
    timeout: 30000,
    maxBuffer: 4 * 1024 * 1024,
    cwd: '/tmp',
  })

  return stdout.trim().split('\n')[0]
}
