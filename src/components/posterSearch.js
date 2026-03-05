const TMDB_TOKEN = import.meta.env.VITE_TMDB_TOKEN

const TMDB_COUNTRY_MAP = {
  US: 'USA', GB: 'UK', JP: 'Japan', KR: 'South Korea', CN: 'China',
  FR: 'France', DE: 'Germany', ES: 'Spain', IT: 'Italy', IN: 'India',
  AU: 'Australia', CA: 'Canada', BR: 'Brazil', MX: 'Mexico',
  TH: 'Thailand', PH: 'Philippines', TW: 'Taiwan', HK: 'Hong Kong',
}

const ANILIST_COUNTRY_MAP = {
  JP: 'Japan', KR: 'South Korea', CN: 'China', TW: 'Taiwan',
}

async function searchTMDB(query, category) {
  if (!TMDB_TOKEN || !query.trim()) return []
  try {
    const isMovie = category === 'movie'
    const searchType = isMovie ? 'movie' : 'multi'
    const res = await fetch(
      `https://api.themoviedb.org/3/search/${searchType}?query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=1`,
      { headers: { Authorization: `Bearer ${TMDB_TOKEN}`, 'Content-Type': 'application/json' } }
    )
    const data = await res.json()
    return (data.results || [])
      .filter(r => r.poster_path)
      .slice(0, 6)
      .map(r => ({
        id: `tmdb-${r.id}`,
        tmdbId: r.id,
        mediaType: r.media_type || (isMovie ? 'movie' : 'tv'),
        title: r.title || r.name,
        poster: `https://image.tmdb.org/t/p/w300${r.poster_path}`,
        year: (r.release_date || r.first_air_date || '').slice(0, 4),
        source: 'TMDB',
      }))
  } catch { return [] }
}

async function searchAniList(query, category) {
  if (!query.trim()) return []

  const formatMap = {
    anime:     { type: 'ANIME' },
    manhwa:    { type: 'MANGA', countryOfOrigin: 'KR' },
    donghua:   { type: 'ANIME', countryOfOrigin: 'CN' },
    animation: { type: 'ANIME' },
  }

  const config = formatMap[category] || { type: 'ANIME' }
  const countryFilter = config.countryOfOrigin ? `, countryOfOrigin: "${config.countryOfOrigin}"` : ''

  const gql = `
    query ($search: String) {
      Page(page: 1, perPage: 6) {
        media(search: $search, type: ${config.type}${countryFilter}, sort: SEARCH_MATCH) {
          id
          format
          title { english romaji native }
          coverImage { large }
          startDate { year }
          countryOfOrigin
        }
      }
    }
  `

  try {
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query: gql, variables: { search: query } }),
    })
    const data = await res.json()
    return (data?.data?.Page?.media || [])
      .filter(m => m.coverImage?.large)
      .map(m => ({
        id: `anilist-${m.id}`,
        anilistId: m.id,
        format: m.format,
        title: m.title.english || m.title.romaji || m.title.native,
        poster: m.coverImage.large,
        year: m.startDate?.year ? String(m.startDate.year) : '',
        country: ANILIST_COUNTRY_MAP[m.countryOfOrigin] || '',
        source: 'AniList',
      }))
  } catch { return [] }
}

// Fetch extra details from TMDB (country + seasons) — works for both movies and TV
export async function fetchTMDBDetails(tmdbId, mediaType) {
  if (!TMDB_TOKEN) return {}
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/${mediaType}/${tmdbId}?language=en-US`,
      { headers: { Authorization: `Bearer ${TMDB_TOKEN}`, 'Content-Type': 'application/json' } }
    )
    const data = await res.json()

    // Try all possible country fields
    const countryCode =
      data.origin_country?.[0] ||
      data.production_countries?.[0]?.iso_3166_1 ||
      ''

    const country = TMDB_COUNTRY_MAP[countryCode] || ''
    const seasons = mediaType === 'tv' ? (data.number_of_seasons || null) : null

    return { country, seasons }
  } catch { return {} }
}

// Fetch anime seasons + country from AniList
export async function fetchAniListDetails(anilistId, format) {
  try {
    const isMovie = ['MOVIE', 'OVA', 'ONA', 'SPECIAL', 'MUSIC'].includes(format)

    const gql = `
      query ($id: Int) {
        Media(id: $id, type: ANIME) {
          countryOfOrigin
          format
          relations {
            edges {
              relationType
              node {
                id
                type
                format
              }
            }
          }
        }
      }
    `
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query: gql, variables: { id: anilistId } }),
    })
    const data = await res.json()
    const media = data?.data?.Media
    if (!media) return {}

    const country = ANILIST_COUNTRY_MAP[media.countryOfOrigin] || ''

    if (isMovie || media.format === 'MOVIE') {
      return { country, seasons: null }
    }

    const sequels = (media.relations?.edges || [])
      .filter(e => e.relationType === 'SEQUEL' && e.node.type === 'ANIME' && e.node.format === 'TV')
    const seasons = sequels.length + 1

    return { country, seasons }
  } catch { return {} }
}

export async function searchPosters(query, category) {
  if (!query || query.trim().length < 2) return []

  if (['movie', 'series'].includes(category)) {
    return searchTMDB(query, category)
  }

  if (category === 'animation') {
    const [tmdbResults, anilistResults] = await Promise.all([
      searchTMDB(query, 'series'),
      searchAniList(query, 'animation'),
    ])
    return [...tmdbResults.slice(0, 3), ...anilistResults.slice(0, 3)]
  }

  return searchAniList(query, category)
}
