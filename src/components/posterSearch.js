const TMDB_TOKEN = import.meta.env.VITE_TMDB_TOKEN

// TMDB — best free option, unlimited requests, great posters
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
        title: r.title || r.name,
        poster: `https://image.tmdb.org/t/p/w300${r.poster_path}`,
        year: (r.release_date || r.first_air_date || '').slice(0, 4),
        source: 'TMDB',
      }))
  } catch { return [] }
}

// AniList — free, no key needed
// Covers anime, manhwa, donghua
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
        title: m.title.english || m.title.romaji || m.title.native,
        poster: m.coverImage.large,
        year: m.startDate?.year ? String(m.startDate.year) : '',
        source: 'AniList',
      }))
  } catch { return [] }
}

// Main export — TMDB for movies/series, AniList for everything else
export async function searchPosters(query, category) {
  if (!query || query.trim().length < 2) return []
  if (['movie', 'series'].includes(category)) return searchTMDB(query, category)
  return searchAniList(query, category)
}
