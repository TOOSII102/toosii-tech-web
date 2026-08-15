const fs = require('fs')
const path = require('path')

const source = require('ffmpeg-static')
const destination = path.join(__dirname, '..', '.next', 'server', 'app', 'api', 'download', 'audio', process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg')

if (!source || !fs.existsSync(source)) {
  throw new Error(`FFmpeg binary was not found at ${source || 'an empty path'}`)
}

fs.mkdirSync(path.dirname(destination), { recursive: true })
fs.copyFileSync(source, destination)
fs.chmodSync(destination, 0o755)
console.log(`[postbuild] copied FFmpeg to ${destination}`)
