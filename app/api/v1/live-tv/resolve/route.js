import { apiError, apiResponse, optionsResponse } from '../../../../../lib/publicApi'
import { getIptvIndex } from '../../../../../lib/iptv'
import { resolvePlayable } from '../../../../../lib/streamHealth'

export const runtime = 'nodejs'
export const maxDuration = 30
export const dynamic = 'force-dynamic'

// Re-checks one channel's sources immediately before playback.
//
// The grid is filtered against cached health verdicts, which can be a few
// minutes old — long enough for a stream to drop. This endpoint re-probes the
// channel's sources on demand so the URL handed to the player was confirmed
// working seconds ago, and reports honestly when nothing is left.
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const id = (searchParams.get('id') || '').trim()
  if (!id) return apiError("The 'id' query parameter is required.", { status: 400, code: 'MISSING_ID' })

  try {
    const index = await getIptvIndex()
    const channel = index.items.find(c => c.id === id)
    if (!channel) return apiError('Unknown channel.', { status: 404, code: 'CHANNEL_NOT_FOUND' })

    const secure = channel.streams.filter(s => s.secure)
    const stream = await resolvePlayable(secure.length ? secure : channel.streams)

    if (!stream) {
      return apiError('This channel just went offline. Please pick another.', {
        status: 404,
        code: 'CHANNEL_OFFLINE',
      })
    }

    return apiResponse(
      {
        operation: 'live-tv.resolve',
        id: channel.id,
        name: channel.name,
        stream: { url: stream.url, quality: stream.quality || null },
      },
      { cacheControl: 'no-store' },
    )
  } catch (err) {
    return apiError('Could not resolve this channel right now.', {
      status: 503,
      code: 'RESOLVE_FAILED',
      details: err?.message,
    })
  }
}

export async function OPTIONS() {
  return optionsResponse()
}
