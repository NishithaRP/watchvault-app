import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { X, Search, Check, Loader } from 'lucide-react'
import { searchPosters, fetchTMDBDetails, fetchAniListDetails } from './posterSearch'

const CATEGORIES = [
  { value: 'movie',     label: '🎼 Movie' },
  { value: 'series',    label: '📺 TV Series' },
  { value: 'anime',     label: '✨ Anime' },
  { value: 'animation', label: '🎨 Animation' },
  { value: 'donghua',   label: '🐉 Donghua' },
  { value: 'manhwa',    label: '📖 Manhwa' },
]

const COUNTRIES = [
  'Japan', 'South Korea', 'USA', 'UK', 'China', 'France', 'Germany',
  'Spain', 'Italy', 'India', 'Australia', 'Canada', 'Brazil', 'Mexico',
  'Thailand', 'Philippines', 'Taiwan', 'Hong Kong', 'Other'
]

const HAS_SUBCATEGORY = ['anime', 'animation', 'donghua']
const HAS_SEASONS = ['series', 'anime', 'animation', 'donghua']

const SOURCE_LABELS = {
  TMDB: { label: 'TMDB', color: '#01b4e4' },
  AniList: { label: 'AniList', color: '#02a9ff' },
}

const CATEGORY_SEARCH_HINT = {
  movie:     'Searches TMDB — best movie database',
  series:    'Searches TMDB — best TV series database',
  anime:     'Searches AniList — free, no key needed',
  animation: 'Searches TMDB + AniList',
  donghua:   'Searches AniList — Chinese anime',
  manhwa:    'Searches AniList — Korean manhwa',
}

export default function AddMediaModal({ onClose, onSaved, userId, initialCategory }) {
  const [form, setForm] = useState({
    name: '', category: initialCategory || 'movie', subcategory: '',
    country: '', status: 'plan_to_watch', rating: 0,
    seasons: '', current_season: '', image_url: '', notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [hoverRating, setHoverRating] = useState(0)

  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [selectedPoster, setSelectedPoster] = useState(null)
  const [showResults, setShowResults] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const searchTimer = useRef(null)

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const isSeries = HAS_SUBCATEGORY.includes(form.category)
  const needsSeasons = HAS_SEASONS.includes(form.category) &&
    (!isSeries || form.subcategory === 'series')

  useEffect(() => {
    if (!form.name.trim() || form.name.length < 2) {
      setSearchResults([])
      setShowResults(false)
      return
    }
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(async () => {
      setSearching(true)
      const results = await searchPosters(form.name, form.category)
      setSearchResults(results)
      setShowResults(results.length > 0)
      setSearching(false)
    }, 600)
    return () => clearTimeout(searchTimer.current)
  }, [form.name, form.category])

  const handleSelectPoster = async (result) => {
    setSelectedPoster(result)
    set('image_url', result.poster)
    set('name', result.title)
    setShowResults(false)

    // Auto-fill country if already available
    if (result.country) set('country', result.country)

    setLoadingDetails(true)

    // Fetch from TMDB for both movies and TV series
    if (result.source === 'TMDB' && result.tmdbId) {
      const details = await fetchTMDBDetails(result.tmdbId, result.mediaType)
      if (details.country) set('country', details.country)
      if (details.seasons) set('seasons', String(details.seasons))
    }

    if (result.source === 'AniList' && result.anilistId) {
      const details = await fetchAniListDetails(result.anilistId, result.format)
      if (details.country) set('country', details.country)
      if (details.seasons) set('seasons', String(details.seasons))
    }

    setLoadingDetails(false)
  }

  const handleClearPoster = () => {
    setSelectedPoster(null)
    set('image_url', '')
  }

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Name is required'); return }
    setSaving(true); setError('')
    const payload = {
      user_id: userId,
      name: form.name.trim(),
      category: form.category,
      subcategory: isSeries ? form.subcategory || null : null,
      country: form.country || null,
      status: form.status,
      rating: form.rating || null,
      seasons: form.seasons ? parseInt(form.seasons) : null,
      current_season: form.current_season ? parseInt(form.current_season) : null,
      image_url: form.image_url || null,
      notes: form.notes || null,
    }
    const { error } = await supabase.from('media').insert(payload)
    if (error) { setError(error.message); setSaving(false); return }
    onSaved()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Add New Entry</h2>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: '4px' }}><X size={20} /></button>
        </div>

        <div className="modal-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Category */}
            <div className="form-group">
              <label className="form-label">Category</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {CATEGORIES.map(cat => (
                  <button key={cat.value}
                    onClick={() => { set('category', cat.value); set('subcategory', ''); setSearchResults([]); setShowResults(false); setSelectedPoster(null); set('image_url', '') }}
                    style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid', borderColor: form.category === cat.value ? 'var(--accent)' : 'var(--border)', background: form.category === cat.value ? 'var(--accent-dim)' : 'var(--bg-secondary)', color: form.category === cat.value ? 'var(--accent)' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: 'var(--font-body)', transition: 'all 0.15s' }}>
                    {cat.label}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                🔍 {CATEGORY_SEARCH_HINT[form.category]}
              </div>
            </div>

            {/* Subcategory */}
            {isSeries && (
              <div className="form-group">
                <label className="form-label">Type</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['series', 'movie'].map(sub => (
                    <button key={sub} onClick={() => set('subcategory', sub)}
                      style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid', borderColor: form.subcategory === sub ? 'var(--accent)' : 'var(--border)', background: form.subcategory === sub ? 'var(--accent-dim)' : 'var(--bg-secondary)', color: form.subcategory === sub ? 'var(--accent)' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-body)', transition: 'all 0.15s' }}>
                      {sub === 'series' ? '📺 Series' : '🎼 Movie'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Title with auto search */}
            <div className="form-group">
              <label className="form-label">Title *</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'relative' }}>
                  <input className="input"
                    placeholder={`Search ${form.category} title...`}
                    value={form.name}
                    onChange={e => { set('name', e.target.value); if (selectedPoster && e.target.value !== selectedPoster.title) { setSelectedPoster(null); set('image_url', '') } }}
                    style={{ paddingRight: '36px' }} />
                  <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                    {searching
                      ? <Loader size={15} style={{ animation: 'spin 1s linear infinite' }} />
                      : <Search size={15} />}
                  </div>
                </div>

                {/* Results dropdown */}
                {showResults && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 500, background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '10px', marginTop: '6px', padding: '10px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', maxHeight: '220px', overflowY: 'auto' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Select a poster
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                      {searchResults.map(result => (
                        <button key={result.id} onClick={() => handleSelectPoster(result)}
                          style={{ background: 'none', border: '2px solid', borderColor: selectedPoster?.id === result.id ? 'var(--accent)' : 'transparent', borderRadius: '8px', cursor: 'pointer', padding: 0, overflow: 'hidden', position: 'relative', transition: 'border-color 0.15s' }}>
                          <img src={result.poster} alt={result.title}
                            style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', display: 'block' }} />
                          <div style={{ position: 'absolute', top: '5px', left: '5px', background: SOURCE_LABELS[result.source]?.color || '#333', borderRadius: '3px', padding: '1px 5px', fontSize: '9px', fontWeight: 700, color: 'white' }}>
                            {result.source}
                          </div>
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.85))', padding: '18px 6px 6px' }}>
                            <div style={{ fontSize: '10px', fontWeight: 600, color: 'white', lineHeight: 1.2 }}>{result.title}</div>
                            {result.year && <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.6)', marginTop: '1px' }}>{result.year}</div>}
                          </div>
                          {selectedPoster?.id === result.id && (
                            <div style={{ position: 'absolute', top: '5px', right: '5px', background: 'var(--accent)', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Check size={12} color="white" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                    <button onClick={() => setShowResults(false)}
                      style={{ width: '100%', marginTop: '8px', padding: '6px', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Selected poster preview */}
            {selectedPoster ? (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <img src={selectedPoster.poster} alt={selectedPoster.title}
                  style={{ width: '56px', borderRadius: '6px', aspectRatio: '2/3', objectFit: 'cover', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>{selectedPoster.title}</div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '8px' }}>
                    {selectedPoster.year && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{selectedPoster.year}</span>}
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '3px', background: SOURCE_LABELS[selectedPoster.source]?.color, color: 'white' }}>
                      {selectedPoster.source}
                    </span>
                    {loadingDetails && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Fetching details...</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => setShowResults(true)} style={{ fontSize: '11px', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', padding: 0 }}>Change poster</button>
                    <button onClick={handleClearPoster} style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', padding: 0 }}>Remove</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">Or paste image URL manually</label>
                <input className="input" placeholder="https://image.url/poster.jpg"
                  value={form.image_url} onChange={e => set('image_url', e.target.value)} />
              </div>
            )}

            {/* Status + Country */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
                  <option value="plan_to_watch">Plan to Watch</option>
                  <option value="watching">Currently Watching</option>
                  <option value="completed">Completed</option>
                  <option value="dropped">Dropped</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Country</label>
                <select className="input" value={form.country} onChange={e => set('country', e.target.value)}>
                  <option value="">Select country</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Seasons */}
            {needsSeasons && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Total Seasons</label>
                  <input className="input" type="number" min="1" placeholder="e.g. 3"
                    value={form.seasons} onChange={e => set('seasons', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Current Season</label>
                  <input className="input" type="number" min="1" placeholder="e.g. 2"
                    value={form.current_season} onChange={e => set('current_season', e.target.value)} />
                </div>
              </div>
            )}

            {/* Rating */}
            <div className="form-group">
              <label className="form-label">My Rating (out of 10)</label>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <button key={n}
                    onMouseEnter={() => setHoverRating(n)} onMouseLeave={() => setHoverRating(0)}
                    onClick={() => set('rating', form.rating === n ? 0 : n)}
                    style={{ width: '34px', height: '34px', borderRadius: '6px', border: '1px solid', borderColor: (hoverRating >= n || form.rating >= n) ? 'var(--gold)' : 'var(--border)', background: (hoverRating >= n || form.rating >= n) ? 'var(--gold-dim)' : 'var(--bg-secondary)', color: (hoverRating >= n || form.rating >= n) ? 'var(--gold)' : 'var(--text-muted)', cursor: 'pointer', fontSize: '13px', fontWeight: 700, transition: 'all 0.1s', fontFamily: 'var(--font-body)' }}>
                    {n}
                  </button>
                ))}
                {form.rating > 0 && <span style={{ fontSize: '13px', color: 'var(--gold)', marginLeft: '8px', fontWeight: 600, alignSelf: 'center' }}>{form.rating}/10</span>}
              </div>
            </div>

            {/* Notes */}
            <div className="form-group">
              <label className="form-label">Notes (optional)</label>
              <textarea className="input" rows={2} placeholder="Any thoughts..."
                value={form.notes} onChange={e => set('notes', e.target.value)}
                style={{ resize: 'vertical' }} />
            </div>

            {error && (
              <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(230,57,70,0.1)', border: '1px solid rgba(230,57,70,0.3)', color: 'var(--accent)', fontSize: '13px' }}>{error}</div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '4px' }}>
              <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : '+ Add to Vault'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
