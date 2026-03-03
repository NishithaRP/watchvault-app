import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { X, Star, Upload } from 'lucide-react'

const CATEGORIES = [
  { value: 'movie', label: '🎬 Movie' },
  { value: 'series', label: '📺 TV Series' },
  { value: 'anime', label: '✨ Anime' },
  { value: 'animation', label: '🎨 Animation' },
  { value: 'donghua', label: '🐉 Donghua' },
  { value: 'manhwa', label: '📖 Manhwa' },
]

const COUNTRIES = [
  'Japan', 'South Korea', 'USA', 'UK', 'China', 'France', 'Germany',
  'Spain', 'Italy', 'India', 'Australia', 'Canada', 'Brazil', 'Mexico',
  'Thailand', 'Philippines', 'Taiwan', 'Hong Kong', 'Other'
]

const HAS_SUBCATEGORY = ['anime', 'animation', 'donghua']
const HAS_SEASONS = ['series', 'anime', 'animation', 'donghua']

export default function AddMediaModal({ onClose, onSaved, userId, initialCategory }) {
  const [form, setForm] = useState({
    name: '',
    category: initialCategory || 'movie',
    subcategory: '',
    country: '',
    status: 'plan_to_watch',
    rating: 0,
    seasons: '',
    current_season: '',
    image_url: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [hoverRating, setHoverRating] = useState(0)

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const isSeries = HAS_SUBCATEGORY.includes(form.category)
  const needsSeasons = HAS_SEASONS.includes(form.category) &&
    (!isSeries || form.subcategory === 'series')

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Name is required'); return }
    setSaving(true)
    setError('')

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
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Category */}
            <div className="form-group">
              <label className="form-label">Category</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {CATEGORIES.map(cat => (
                  <button key={cat.value}
                    onClick={() => { set('category', cat.value); set('subcategory', '') }}
                    style={{
                      padding: '8px 10px', borderRadius: '8px', border: '1px solid',
                      borderColor: form.category === cat.value ? 'var(--accent)' : 'var(--border)',
                      background: form.category === cat.value ? 'var(--accent-dim)' : 'var(--bg-secondary)',
                      color: form.category === cat.value ? 'var(--accent)' : 'var(--text-secondary)',
                      cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                      fontFamily: 'var(--font-body)', transition: 'all 0.15s'
                    }}>
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Subcategory for anime/animation/donghua */}
            {isSeries && (
              <div className="form-group">
                <label className="form-label">Type</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['series', 'movie'].map(sub => (
                    <button key={sub}
                      onClick={() => set('subcategory', sub)}
                      style={{
                        flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid',
                        borderColor: form.subcategory === sub ? 'var(--accent)' : 'var(--border)',
                        background: form.subcategory === sub ? 'var(--accent-dim)' : 'var(--bg-secondary)',
                        color: form.subcategory === sub ? 'var(--accent)' : 'var(--text-secondary)',
                        cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                        fontFamily: 'var(--font-body)', transition: 'all 0.15s',
                        textTransform: 'capitalize'
                      }}>
                      {sub === 'series' ? '📺 Series' : '🎬 Movie'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Name */}
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input className="input" placeholder="Enter title..."
                value={form.name} onChange={e => set('name', e.target.value)} />
            </div>

            {/* Image URL */}
            <div className="form-group">
              <label className="form-label">Poster Image URL</label>
              <input className="input" placeholder="https://image.url/poster.jpg"
                value={form.image_url} onChange={e => set('image_url', e.target.value)} />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Tip: Use an image URL from Google Images, MyAnimeList, or TMDB
              </span>
            </div>

            {/* Status + Country row */}
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

            {/* Seasons (for series types) */}
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
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <button key={n}
                    onMouseEnter={() => setHoverRating(n)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => set('rating', form.rating === n ? 0 : n)}
                    style={{
                      width: '34px', height: '34px', borderRadius: '6px', border: '1px solid',
                      borderColor: (hoverRating >= n || form.rating >= n) ? 'var(--gold)' : 'var(--border)',
                      background: (hoverRating >= n || form.rating >= n) ? 'var(--gold-dim)' : 'var(--bg-secondary)',
                      color: (hoverRating >= n || form.rating >= n) ? 'var(--gold)' : 'var(--text-muted)',
                      cursor: 'pointer', fontSize: '13px', fontWeight: 700,
                      transition: 'all 0.1s', fontFamily: 'var(--font-body)'
                    }}>
                    {n}
                  </button>
                ))}
                {form.rating > 0 && (
                  <span style={{ fontSize: '13px', color: 'var(--gold)', marginLeft: '8px', fontWeight: 600 }}>
                    {form.rating}/10
                  </span>
                )}
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
              <div style={{
                padding: '10px 14px', borderRadius: '8px',
                background: 'rgba(230,57,70,0.1)', border: '1px solid rgba(230,57,70,0.3)',
                color: 'var(--accent)', fontSize: '13px'
              }}>{error}</div>
            )}

            {/* Actions */}
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
