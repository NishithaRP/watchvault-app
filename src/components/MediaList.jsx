import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Film, Search, Star, Trash2, Edit2, Plus, Globe, LayoutGrid, Grid } from 'lucide-react'
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

// Detect if device is touch/mobile
const isTouchDevice = () => window.matchMedia('(hover: none)').matches

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
  const [cardSize, setCardSize] = useState(() => localStorage.getItem('wv-cardsize') || 'detailed')
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    setIsTouch(isTouchDevice())
    loadItems()
  }, [category, userId])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (editItem) {
      document.body.style.overflow = 'hidden'
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [editItem])

  const toggleCardSize = (size) => {
    setCardSize(size)
    localStorage.setItem('wv-cardsize', size)
  }

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

  const gridCols = cardSize === 'compact'
    ? 'repeat(auto-fill, minmax(155px, 1fr))'
    : 'repeat(auto-fill, minmax(200px, 1fr))'

  return (
    <div className="fade-in">
      {/* Filters + size toggle */}
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

        {/* Card size toggle */}
        <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: '8px', padding: '3px', gap: '2px', border: '1px solid var(--border)' }}>
          <button onClick={() => toggleCardSize('compact')} title="Compact view"
            style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', background: cardSize === 'compact' ? 'var(--accent)' : 'transparent', color: cardSize === 'compact' ? 'white' : 'var(--text-muted)', fontSize: '12px', fontWeight: 600, fontFamily: 'var(--font-body)', transition: 'all 0.2s' }}>
            <Grid size={14} /> Compact
          </button>
          <button onClick={() => toggleCardSize('detailed')} title="Detailed view"
            style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', background: cardSize === 'detailed' ? 'var(--accent)' : 'transparent', color: cardSize === 'detailed' ? 'white' : 'var(--text-muted)', fontSize: '12px', fontWeight: 600, fontFamily: 'var(--font-body)', transition: 'all 0.2s' }}>
            <LayoutGrid size={14} /> Detailed
          </button>
        </div>

        <div style={{ color: 'var(--text-muted)', fontSize: '13px', whiteSpace: 'nowrap' }}>
          {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: '16px' }}>
          {[...Array(8)].map((_, i) => <div key={i} className="card" style={{ height: cardSize === 'compact' ? '280px' : '340px', animation: 'pulse 1.5s infinite' }} />)}
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
        <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: '16px' }}>
          {filtered.map(item => (
            <MediaCard key={item.id} item={item}
              onEdit={() => setEditItem(item)}
              onDelete={() => handleDelete(item.id)}
              showCategory={isAllCategories}
              cardSize={cardSize}
              isTouch={isTouch} />
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

function MediaCard({ item, onEdit, onDelete, showCategory, cardSize, isTouch }) {
  const [hovered, setHovered] = useState(false)
  const statusCfg = STATUS_LABELS[item.status]
  const catCfg = CATEGORY_CONFIG[item.category]
  const isCompact = cardSize === 'compact'

  // On touch devices always show buttons, on desktop show on hover
  const showButtons = isTouch || hovered

  return (
    <div className="card" style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>

      {/* Poster */}
      <div style={{ height: isCompact ? '200px' : '260px', background: 'var(--bg-secondary)', position: 'relative', overflow: 'hidden', flexShrink: 0, lineHeight: 0 }}>
        {item.image_url
          ? <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block', transition: 'transform 0.3s', transform: hovered ? 'scale(1.05)' : 'scale(1)' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)' }}><Film size={isCompact ? 32 : 40} style={{ color: 'var(--text-muted)' }} /></div>
        }

        {/* Edit/delete — hover on desktop, always visible on mobile */}
        {isTouch ? (
          // Mobile: small buttons always visible in top-right corner
          <div style={{ position: 'absolute', top: '6px', right: '6px', display: 'flex', gap: '5px' }}>
            <button onClick={onEdit} style={{ padding: '7px', borderRadius: '8px', background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <Edit2 size={13} />
            </button>
            <button onClick={onDelete} style={{ padding: '7px', borderRadius: '8px', background: 'rgba(230,57,70,0.6)', border: '1px solid rgba(230,57,70,0.4)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <Trash2 size={13} />
            </button>
          </div>
        ) : (
          // Desktop: overlay on hover
          hovered && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', animation: 'fadeIn 0.15s ease' }}>
              <button onClick={onEdit} style={{ padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Edit2 size={16} /></button>
              <button onClick={onDelete} style={{ padding: '10px', borderRadius: '10px', background: 'rgba(230,57,70,0.25)', border: '1px solid rgba(230,57,70,0.45)', color: '#ff6b6b', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Trash2 size={16} /></button>
            </div>
          )
        )}
      </div>

      {/* Info section */}
      <div style={{ padding: isCompact ? '8px 10px' : '12px 14px', display: 'flex', flexDirection: 'column', gap: isCompact ? '4px' : '8px', flex: 1 }}>

        <div style={{ fontSize: isCompact ? '12px' : '14px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
          {item.name}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: '5px', padding: '2px 6px' }}>
            {catCfg?.emoji} {item.subcategory ? `${catCfg?.label} ${item.subcategory}` : catCfg?.label}
          </span>
          {item.country && !isCompact && (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '2px' }}>
              <Globe size={10} /> {item.country}
            </span>
          )}
        </div>

        <span className={`badge ${statusCfg?.class}`} style={{ fontSize: isCompact ? '10px' : '11px', padding: isCompact ? '2px 7px' : '3px 10px' }}>
          {statusCfg?.label}
        </span>

        {item.rating ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Star size={isCompact ? 11 : 13} style={{ color: 'var(--gold)', fill: 'var(--gold)' }} />
            <span style={{ fontSize: isCompact ? '11px' : '13px', fontWeight: 700, color: 'var(--gold)' }}>{item.rating}/10</span>
          </div>
        ) : null}

        {item.seasons && (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            📺 {item.current_season ? `S${item.current_season}/${item.seasons}` : `${item.seasons} Season${item.seasons > 1 ? 's' : ''}`}
          </div>
        )}

        {isCompact && item.country && (
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '2px' }}>
            <Globe size={9} /> {item.country}
          </div>
        )}
      </div>
    </div>
  )
}
