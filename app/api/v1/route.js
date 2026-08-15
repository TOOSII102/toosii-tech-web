import { apiResponse, optionsResponse } from '../../../lib/publicApi'

const endpoints = [
  { method: 'GET', path: '/api/v1/health', category: 'Core', description: 'Check the service status and current API version.' },
  { method: 'GET', path: '/api/v1', category: 'Core', description: 'List the public Toosii API routes and their categories.' },
  { method: 'GET', path: '/api/v1/weather?latitude=-1.2864&longitude=36.8172', category: 'Data', description: 'Get a compact three-day weather forecast for geographic coordinates.' },
  { method: 'GET', path: '/api/v1/holidays?country=KE&year=2026', category: 'Data', description: 'List public holidays for an ISO country code and year.' },
  { method: 'GET', path: '/api/v1/books/search?query=things%20fall%20apart&limit=5', category: 'Data', description: 'Run a small, user-initiated book discovery search.' },
  { method: 'GET', path: '/api/tools/movies?action=trending', category: 'Media', description: 'Browse the current movie and series catalogue.' },
  { method: 'GET', path: '/api/tools/dramabox?action=trending&page=1', category: 'Media', description: 'Browse the short-drama catalogue and episode metadata.' },
  { method: 'GET', path: '/api/search/youtube?q=kenya%20music', category: 'Media Search', description: 'Search YouTube with normalized video metadata.' },
  { method: 'GET', path: '/api/search/spotify?q=afrobeats', category: 'Media Search', description: 'Search Spotify track metadata.' },
  { method: 'GET', path: '/api/models', category: 'AI', description: 'List the AI models currently available through Toosii tools.' },
  { method: 'GET', path: '/api/tools/tempemail?count=1', category: 'Tools', description: 'Generate temporary email addresses for testing.' },
  { method: 'GET', path: '/api/qr', category: 'Bot', description: 'Request the current Toosii WhatsApp session QR payload.' },
  { method: 'GET', path: '/api/pair?number=254712345678', category: 'Bot', description: 'Generate a Toosii WhatsApp session pairing code.' },
  { method: 'GET', path: '/api/v1/utils/base64/encode?text=Hello', category: 'Utilities', description: 'Encode plain text as Base64.' },
  { method: 'GET', path: '/api/v1/utils/base64/decode?text=SGVsbG8%3D', category: 'Utilities', description: 'Decode a Base64 value into UTF-8 text.' },
  { method: 'GET', path: '/api/v1/utils/qr?text=https%3A%2F%2Ftoosiitech.com&size=320', category: 'Utilities', description: 'Generate a QR code as a PNG data URL.' },
  { method: 'GET', path: '/api/v1/utils/uuid?count=3', category: 'Utilities', description: 'Generate one or more RFC 4122 UUIDs locally.' },
  { method: 'GET', path: '/api/v1/utils/slugify?text=Toosii%20API%20Release', category: 'Utilities', description: 'Convert text into a clean URL-friendly slug.' },
  { method: 'GET', path: '/api/v1/utils/hash?text=Toosii%20Tech&algorithm=sha256', category: 'Utilities', description: 'Create a SHA-256, SHA-384, or SHA-512 text hash.' },
  { method: 'GET', path: '/api/v1/sports?league=eng.1', category: 'Sports', description: 'Get a normalized live scoreboard for a supported league.' },
]

export async function GET() {
  return apiResponse({
    message: 'Welcome to Toosii API.',
    documentation: '/api',
    endpointCount: endpoints.length,
    endpoints,
  }, { cacheControl: 'public, max-age=60, s-maxage=60' })
}

export async function OPTIONS() {
  return optionsResponse()
}
