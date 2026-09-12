import { apiError, apiResponse, optionsResponse } from '../../../../lib/publicApi'
import { partnerLeagueMatches } from '../../../../lib/partnerApi'

const LEAGUES = {
  'eng.1': { name: 'English Premier League', sport: 'soccer', league: 'eng.1' },
  'esp.1': { name: 'Spanish La Liga', sport: 'soccer', league: 'esp.1' },
  'ita.1': { name: 'Italian Serie A', sport: 'soccer', league: 'ita.1' },
  'ger.1': { name: 'German Bundesliga', sport: 'soccer', league: 'ger.1' },
  'fra.1': { name: 'French Ligue 1', sport: 'soccer', league: 'fra.1' },
  'uefa.champions': { name: 'UEFA Champions League', sport: 'soccer', league: 'uefa.champions' },
}

function normalizeEvent(event) {
  const competition = event.competitions?.[0] || {}
  const competitors = competition.competitors || []

  return {
    id: event.id,
    name: event.name,
    shortName: event.shortName,
    date: event.date,
    status: {
      state: event.status?.type?.state || 'pre',
      detail: event.status?.type?.detail || event.status?.type?.description || 'Scheduled',
      clock: event.status?.displayClock || null,
      completed: Boolean(event.status?.type?.completed),
    },
    venue: competition.venue?.fullName || null,
    teams: competitors.map(team => ({
      id: team.team?.id || null,
      name: team.team?.displayName || team.team?.name || 'Unknown team',
      abbreviation: team.team?.abbreviation || null,
      logo: team.team?.logo || null,
      homeAway: team.homeAway || null,
      score: team.score ?? null,
      winner: Boolean(team.winner),
    })),
  }
}

export async function GET(request) {
  const leagueKey = new URL(request.url).searchParams.get('league') || 'eng.1'
  const league = LEAGUES[leagueKey]

  if (!league) {
    return apiError('Unsupported league. Choose one of the supported league codes.', {
      code: 'UNSUPPORTED_LEAGUE',
      details: { supportedLeagues: Object.entries(LEAGUES).map(([code, item]) => ({ code, name: item.name })) },
    })
  }

  const upstream = `https://site.api.espn.com/apis/site/v2/sports/${league.sport}/${league.league}/scoreboard`

  try {
    const response = await fetch(upstream, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 30 },
      signal: AbortSignal.timeout(8000),
    })

    if (!response.ok) {
      throw new Error(`ESPN ${response.status}`)
    }

    const data = await response.json()
    const events = Array.isArray(data.events) ? data.events.map(normalizeEvent) : []
    if (!events.length) throw new Error('ESPN returned no events')

    return apiResponse({
      operation: 'sports.scoreboard',
      league: { code: leagueKey, name: league.name },
      source: 'ESPN',
      eventCount: events.length,
      events,
    }, { cacheControl: 'public, max-age=20, s-maxage=20' })
  } catch {
    // Fallback: Partner API league fixtures.
    const partner = await partnerLeagueMatches(leagueKey)
    if (partner) {
      return apiResponse({
        operation: 'sports.scoreboard',
        league: { code: leagueKey, name: partner.competition || league.name },
        source: 'Toosii Fallback',
        eventCount: partner.events.length,
        events: partner.events,
      }, { cacheControl: 'public, max-age=20, s-maxage=20' })
    }

    return apiError('The live sports source did not respond in time.', {
      status: 504,
      code: 'UPSTREAM_TIMEOUT',
    })
  }
}

export async function OPTIONS() {
  return optionsResponse()
}
