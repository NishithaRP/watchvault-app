import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Film, Search, Star, Trash2, Edit2, Plus, Globe } from 'lucide-react'
import EditMediaModal from './EditMediaModal'

const STATUS_LABELS = {
  watching:      { label: 'Watching',      class: 'badge-watching' },
  completed:     { label: 'Completed',     class: 'badge-completed' },
  plan_to_watch: { label: 'Plan to Watch', class: 'badge-plan' },
  dropped:       { label: 'Dropped',       class: 'badge-dropped' },
}

const CATEGORY_CONFIG = {
  movie:     { label: 'Movie',      emoji: '🎬' },
  series:    { label: 'TV Series',  emoji: '📺' },
  anime:     { label: 'Anime',      emoji: '✨' },
  animation: { label: 'Animation',  emoji: '🎨' },
  donghua:   { label: 'Donghua',    emoji: '🐉' },
  manhwa:    { label: 'Manhwa',     emoji: '📖' },
}

const STATUS_LABELS_MAP = {
  watching: 'Currently Watching', completed: 'Completed',
  plan_to_watch: 'Plan to Watch', dropped: 'Dropped',
}

export default function MediaList({ category, userId, onAdd, defaultStatus }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(defaultStatus || 'all')
  const [countryFilter, setCountryFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [subcatFilter, setSubcatFilter] = useState('all')
  const [editItem, setEditItem] = useState(null)
  const [countries, setCountries] = useState([])

  useEffect(() => { loadItems() }, [category, userId])

  const loadItems = async () => {
    setLoading(true)
    let query = supabase.from('media').select('*').eq('user_id', userId)
    if (category) query = query.eq('category', category)
    const { data } = await query.order('created_at', { ascending: false })
    if (data) {
      setItems(data)
      setCountries([...new Set(data.map(i => i.country).filter(Boolean))])
    }
    setLoading(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this entry?')) return
    await supabase.from('media').delete().eq('id', id)
    loadItems()
  }

  const isAllCategories = !category
  const hasSubcategory = category && ['anime', 'animation', 'donghua'].includes(category)

  const filtered = items.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || item.status === statusFilter
    const matchCountry = countryFilter === 'all' || item.country === countryFilter
    const matchCat = !isAllCategories || categoryFilter === 'all' || item.category === categoryFilter
    const matchSubcat = subcatFilter === 'all' || item.subcategory === subcatFilter
    return matchSearch && matchStatus && matchCountry && matchCat && matchSubcat
  })

  return (
    <div className="fade-in">
      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '24px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '36px' }} />
        </div>
        <select className="input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 'auto', minWidth: '140px' }}>
          <option value="all">All Status</option>
          <option value="watching">Watching</option>
          <option value="completed">Completed</option>
          <option value="plan_to_watch">Plan to Watch</option>
          <option value="dropped">Dropped</option>
        </select>
        {isAllCategories && (
          <select className="input" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ width: 'auto', minWidth: '140px' }}>
            <option value="all">All Categories</option>
            {Object.entries(CATEGORY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        )}
        {hasSubcategory && (
          <select className="input" value={subcatFilter} onChange={e => setSubcatFilter(e.target.value)} style={{ width: 'auto', minWidth: '130px' }}>
            <option value="all">All Types</option>
            <option value="series">Series</option>
            <option value="movie">Movies</option>
          </select>
        )}
        {countries.length > 0 && (
          <select className="input" value={countryFilter} onChange={e => setCountryFilter(e.target.value)} style={{ width: 'auto', minWidth: '140px' }}>
            <option value="all">All Countries</option>
            {countries.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        <div style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '13px', whiteSpace: 'nowrap' }}>
          {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
          {[...Array(8)].map((_, i) => <div key={i} className="card" style={{ height: '340px', animation: 'pulse 1.5s infinite' }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 40px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px dashed var(--border-light)' }}>
          <Film size={40} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
          <h3 style={{ marginBottom: '8px' }}>No entries found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>
            {items.length === 0 ? 'Add your first entry to get started' : 'No results match your filters'}
          </p>
          {items.length === 0 && <button className="btn btn-primary" onClick={onAdd}><Plus size={16} /> Add Entry</button>}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
          {filtered.map(item => (
            <MediaCard key={item.id} item={item}
              onEdit={() => setEditItem(item)}
              onDelete={() => handleDelete(item.id)}
              showCategory={isAllCategories} />
          ))}
        </div>
      )}

      {editItem && (
        <EditMediaModal item={editItem} userId={userId}
          onClose={() => setEditItem(null)}
          onSaved={() => { setEditItem(null); loadItems() }} />
      )}
    </div>
  )
}

function MediaCard({ item, onEdit, onDelete, showCategory }) {
  const [hovered, setHovered] = useState(false)
  const statusCfg = STATUS_LABELS[item.status]
  const catCfg = CATEGORY_CONFIG[item.category]

  return (
    <div className="card" style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>

      {/* Poster */}
      <div style={{ height: '260px', background: 'var(--bg-secondary)', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        {item.image_url
          ? <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s', transform: hovered ? 'scale(1.05)' : 'scale(1)' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Film size={40} style={{ color: 'var(--text-muted)' }} /></div>
        }

        {/* Edit/Delete overlay on hover */}
        {hovered && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', animation: 'fadeIn 0.15s ease' }}>
            <button onClick={onEdit} style={{ padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Edit2 size={16} /></button>
            <button onClick={onDelete} style={{ padding: '10px', borderRadius: '10px', background: 'rgba(230,57,70,0.25)', border: '1px solid rgba(230,57,70,0.45)', color: '#ff6b6b', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Trash2 size={16} /></button>
          </div>
        )}
      </div>

      {/* Info section */}
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>

        {/* Title */}
        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
          {item.name}
        </div>

        {/* Category tag */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: '5px', padding: '2px 8px' }}>
            {catCfg?.emoji} {item.subcategory ? `${catCfg?.label} ${item.subcategory}` : catCfg?.label}
          </span>
          {item.country && (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '2px' }}>
              <Globe size={10} /> {item.country}
            </span>
          )}
        </div>

        {/* Status badge */}
        <div>
          <span className={`badge ${statusCfg?.class}`}>
            {statusCfg?.label}
          </span>
        </div>

        {/* Rating */}
        {item.rating && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Star size={13} style={{ color: 'var(--gold)', fill: 'var(--gold)' }} />
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gold)' }}>{item.rating}/10</span>
          </div>
        )}

        {/* Seasons */}
        {item.seasons && (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            📺 {item.current_season ? `Season ${item.current_season} of ${item.seasons}` : `${item.seasons} Season${item.seasons > 1 ? 's' : ''}`}
          </div>
        )}
      </div>
    </div>
  )
}
