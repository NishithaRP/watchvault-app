import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { X, Wand2 } from 'lucide-react'
import { searchPosters } from './posterSearch'

const COUNTRIES = [
  'Japan', 'South Korea', 'USA', 'UK', 'China', 'France', 'Germany',
  'Spain', 'Italy', 'India', 'Australia', 'Canada', 'Brazil', 'Mexico',
  'Thailand', 'Philippines', 'Taiwan', 'Hong Kong', 'Poland', 'Russia',
  'Turkey', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Netherlands',
  'Belgium', 'Portugal', 'Argentina', 'Chile', 'Colombia', 'Indonesia',
  'Malaysia', 'Singapore', 'Vietnam', 'South Africa', 'Egypt', 'Nigeria',
  'Israel', 'Saudi Arabia', 'UAE', 'Iran', 'Pakistan', 'Czech Republic',
  'Hungary', 'Romania', 'Ukraine', 'Austria', 'Switzerland', 'New Zealand',
  'Greece', 'Other'
]

const HAS_SUBCATEGORY = ['anime', 'animation', 'donghua']
const HAS_SEASONS = ['series', 'anime', 'animation', 'donghua']

export default function EditMediaModal({ item, onClose, onSaved, userId }) {
  const [form, setForm] = useState({
    name: item.name || '',
    subcategory: item.subcategory || '',
    country: item.country || '',
    status: item.status || 'plan_to_watch',
    rating: item.rating || 0,
    seasons: item.seasons || '',
    current_season: item.current_season || '',
    image_url: item.image_url || '',
    notes: item.notes || '',
    release_year: item.release_year || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [hoverRating, setHoverRating] = useState(0)
  const [fetchingYear, setFetchingYear] = useState(false)
  const [yearFetched, setYearFetched] = useState(false)

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const isSeries = HAS_SUBCATEGORY.includes(item.category)
  const needsSeasons = HAS_SEASONS.includes(item.category) &&
    (!isSeries || form.subcategory === 'series')

  const handleFetchYear = async () => {
    setFetchingYear(true)
    setYearFetched(false)
    try {
      const results = await searchPosters(form.name, item.category)
      const match = results.find(r =>
        r.title?.toLowerCase().trim() === form.name.toLowerCase().trim()
      ) || results[0]
      if (match?.year) {
        set('release_year', match.year)
        setYearFetched(true)
      }
    } catch {}
    setFetchingYear(false)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Name is required'); return }
    setSaving(true)
    setError('')
    const payload = {
      name: form.name.trim(),
      subcategory: isSeries ? form.subcategory || null : null,
      country: form.country || null,
      status: form.status,
      rating: form.rating || null,
      seasons: form.seasons ? parseInt(form.seasons) : null,
      current_season: form.current_season ? parseInt(form.current_season) : null,
      image_url: form.image_url || null,
      notes: form.notes || null,
      release_year: form.release_year ? parseInt(form.release_year) : null,
      updated_at: new Date().toISOString(),
    }
    const { error } = await supabase.from('media').update(payload).eq('id', item.id)
    if (error) { setError(error.message); setSaving(false); return }
    onSaved()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
          <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: 'var(--border-light)' }} />
        </div>
        <div className="modal-header">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Edit Entry</h2>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: '4px' }}><X size={20} /></button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-secondary)', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Category: <strong style={{ color: 'var(--text-primary)' }}>{item.category}</strong>
            </div>

            {isSeries && (
              <div className="form-group">
                <label className="form-label">Type</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['series', 'movie'].map(sub => (
                    <button key={sub} onClick={() => set('subcategory', sub)}
                      style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid', borderColor: form.subcategory === sub ? 'var(--accent)' : 'var(--border)', background: form.subcategory === sub ? 'var(--accent-dim)' : 'var(--bg-secondary)', color: form.subcategory === sub ? 'var(--accent)' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-body)', transition: 'all 0.15s' }}>
                      {sub === 'series' ? '📺 Series' : '🎬 Movie'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Title *</label>
              <input className="input" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>

            {/* Release Year */}
            <div className="form-group">
              <label className="form-label">Release Year</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input className="input" type="number" min="1900" max="2099"
                  placeholder="e.g. 2021" value={form.release_year}
                  onChange={e => set('release_year', e.target.value)} style={{ flex: 1 }} />
                <button onClick={handleFetchYear} disabled={fetchingYear}
                  style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: yearFetched ? 'rgba(46,196,182,0.15)' : 'var(--bg-secondary)', color: yearFetched ? '#2ec4b6' : 'var(--text-secondary)', cursor: fetchingYear ? 'default' : 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>
                  <Wand2 size={13} />
                  {fetchingYear ? 'Fetching...' : yearFetched ? 'Got it! ✓' : 'Auto-fetch'}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Poster Image URL</label>
              <input className="input" placeholder="https://..." value={form.image_url} onChange={e => set('image_url', e.target.value)} />
            </div>

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

            {needsSeasons && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Total Seasons</label>
                  <input className="input" type="number" min="1" value={form.seasons} onChange={e => set('seasons', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Current Season</label>
                  <input className="input" type="number" min="1" value={form.current_season} onChange={e => set('current_season', e.target.value)} />
                </div>
              </div>
            )}

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
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="input" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} style={{ resize: 'vertical' }} />
            </div>

            {error && <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(230,57,70,0.1)', border: '1px solid rgba(230,57,70,0.3)', color: 'var(--accent)', fontSize: '13px' }}>{error}</div>}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingBottom: '8px' }}>
              <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
