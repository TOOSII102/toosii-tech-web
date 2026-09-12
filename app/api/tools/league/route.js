import { apiError, apiResponse, optionsResponse } from '../../../../lib/publicApi'
import { partnerFetch, PARTNER_API_NAME, firstText } from '../../../../lib/partnerApi'

const LEAGUES = {
  epl: 'English Premier League',
  laliga: 'Spanish La Liga',
  seriea: 'Italian Serie A',
  bundesliga: 'German Bundesliga',
  ligue1: 'French Ligue 1',
  ucl: 'UEFA Champions League',
}

const TYPES = ['matches', 'upcoming', 'standings', 'scorers']

export async function GET(request) {
  const searchParams = new URL(request.url).searchParams
  const league = (searchParams.get('league') || 'epl').trim().toLowerCase()
  const type = (searchParams.get('type') || 'matches').trim().toLowerCase()

  if (!LEAGUES[league]) {
    return apiError('Unsupported league. Choose: ' + Object.keys(LEAGUES).join(', '), {
      code: 'UNSUPPORTED_LEAGUE',
      details: { leagues: Object.entries(LEAGUES).map(([code, name]) => ({ code, name })) },
    })
  }
  if (!TYPES.includes(type)) {
    return apiError('Unsupported type. Choose: ' + TYPES.join(', '), {
      code: 'UNSUPPORTED_TYPE',
      details: { types: TYPES },
    })
  }

  // Partner's per-league endpoints are not uniformly named: upcoming fixtures
  // live under `<league>/upcomingmatches`, the rest under `<league>/<type>`.
  const endpointSuffix = type === 'upcoming' ? 'upcomingmatches' : type
  const payload = await partnerFetch(`/${league}/${endpointSuffix}`, { timeout: 25000 })
  const result = payload?.result
  if (!result || typeof result !== 'object') {
    return apiError('League data is unavailable right now. Try again shortly.', {
      status: 502,
      code: 'LEAGUE_UNAVAILABLE',
    })
  }

  const normalized = {
    competition: firstText(result.competition, LEAGUES[league]),
  }

  if (type === 'standings') {
    const table = Array.isArray(result.table)
      ? result.table
      : Array.isArray(result.standings)
        ? result.standings
        : Array.isArray(result)
          ? result
          : []
    normalized.table = table.map((row, index) => ({
      position: row.position ?? row.rank ?? row.idx ?? index + 1,
      team: firstText(row.team, row.teamName, row.name),
      played: row.played ?? null,
      wins: row.wins ?? null,
      draws: row.draws ?? null,
      losses: row.losses ?? null,
      goalsFor: row.goalsFor ?? row.gf ?? null,
      goalsAgainst: row.goalsAgainst ?? row.ga ?? null,
      goalDifference: row.goalDifference ?? row.gd ?? null,
      points: row.points ?? row.pts ?? null,
      form: Array.isArray(row.form) ? row.form : null,
    })).filter(row => row.team)
  } else if (type === 'scorers') {
    const list = Array.isArray(result.scorers)
      ? result.scorers
      : Array.isArray(result.top_scorers)
        ? result.top_scorers
        : Array.isArray(result)
          ? result
          : []
    normalized.scorers = list.map(row => ({
      player: firstText(row.player, row.playerName, row.name),
      team: firstText(row.team, row.teamName),
      goals: row.goals ?? null,
      assists: row.assists ?? null,
      appearances: row.appearances ?? row.apps ?? null,
    })).filter(row => row.player)
  } else {
    const matches = Array.isArray(result.matches) ? result.matches : Array.isArray(result) ? result : []
    normalized.matches = matches.map(match => ({
      matchday: match.matchday ?? null,
      status: match.status ?? 'SCHEDULED',
      homeTeam: firstText(match.homeTeam, match.home),
      awayTeam: firstText(match.awayTeam, match.away),
      score: match.score ?? null,
      winner: firstText(match.winner) || null,
    })).filter(match => match.homeTeam || match.awayTeam)
  }

  if ((type === 'standings' && !normalized.table.length) ||
      (type === 'scorers' && !normalized.scorers.length) ||
      ((type === 'matches' || type === 'upcoming') && !normalized.matches.length)) {
    return apiError('No ' + type + ' data is available for this league right now.', {
      status: 502,
      code: 'LEAGUE_EMPTY',
    })
  }

  return apiResponse({
    operation: 'sports.league.' + type,
    source: PARTNER_API_NAME,
    league: { code: league, name: LEAGUES[league] },
    ...normalized,
  }, { cacheControl: 'public, max-age=60, s-maxage=60' })
}

export async function OPTIONS() {
  return optionsResponse()
}
