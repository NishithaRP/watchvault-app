import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Film, Search, Filter, Star, Trash2, Edit2, Plus, Globe } from 'lucide-react'
import EditMediaModal from './EditMediaModal'

const STATUS_LABELS = {
  watching: { label: 'Watching', class: 'badge-watching' },
  completed: { label: 'Completed', class: 'badge-completed' },
  plan_to_watch: { label: 'Plan to Watch', class: 'badge-plan' },
  dropped: { label: 'Dropped', class: 'badge-dropped' },
}

export default function MediaList({ category, userId, onAdd }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [countryFilter, setCountryFilter] = useState('all')
  const [subcatFilter, setSubcatFilter] = useState('all')
  const [editItem, setEditItem] = useState(null)
  const [countries, setCountries] = useState([])

  useEffect(() => {
    loadItems()
  }, [category, userId])

  const loadItems = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('media')
      .select('*')
      .eq('user_id', userId)
      .eq('category', category)
      .order('created_at', { ascending: false })

    if (data) {
      setItems(data)
      const uniqueCountries = [...new Set(data.map(i => i.country).filter(Boolean))]
      setCountries(uniqueCountries)
    }
    setLoading(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this entry?')) return
    await supabase.from('media').delete().eq('id', id)
    loadItems()
  }

  const hasSubcategory = ['anime', 'animation', 'donghua'].includes(category)

  const filtered = items.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || item.status === statusFilter
    const matchCountry = countryFilter === 'all' || item.country === countryFilter
    const matchSubcat = subcatFilter === 'all' || item.subcategory === subcatFilter
    return matchSearch && matchStatus && matchCountry && matchSubcat
  })

  const CATEGORY_LABELS = {
    movie: 'Movies', series: 'TV Series', anime: 'Anime',
    animation: 'Animation', donghua: 'Donghua', manhwa: 'Manhwa'
  }

  return (
    <div className="fade-in">
      {/* Filters bar */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '10px',
        marginBottom: '24px', alignItems: 'center'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
          <Search size={15} style={{
            position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-muted)'
          }} />
          <input className="input" placeholder="Search..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '36px' }} />
        </div>

        {/* Status */}
        <select className="input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ width: 'auto', minWidth: '140px' }}>
          <option value="all">All Status</option>
          <option value="watching">Watching</option>
          <option value="completed">Completed</option>
          <option value="plan_to_watch">Plan to Watch</option>
          <option value="dropped">Dropped</option>
        </select>

        {/* Subcategory for anime/animation/donghua */}
        {hasSubcategory && (
          <select className="input" value={subcatFilter} onChange={e => setSubcatFilter(e.target.value)}
            style={{ width: 'auto', minWidth: '130px' }}>
            <option value="all">All Types</option>
            <option value="series">Series</option>
            <option value="movie">Movies</option>
          </select>
        )}

        {/* Country */}
        {countries.length > 0 && (
          <select className="input" value={countryFilter} onChange={e => setCountryFilter(e.target.value)}
            style={{ width: 'auto', minWidth: '140px' }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card" style={{ height: '280px', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '80px 40px',
          background: 'var(--bg-card)', borderRadius: '16px',
          border: '1px dashed var(--border-light)'
        }}>
          <Film size={40} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
          <h3 style={{ marginBottom: '8px' }}>No {CATEGORY_LABELS[category]} yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>
            {items.length === 0
              ? `Add your first ${CATEGORY_LABELS[category].toLowerCase()} to get started`
              : 'No results match your filters'}
          </p>
          {items.length === 0 && (
            <button className="btn btn-primary" onClick={onAdd}>
              <Plus size={16} /> Add {CATEGORY_LABELS[category]}
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
          {filtered.map(item => (
            <MediaCard key={item.id} item={item}
              onEdit={() => setEditItem(item)}
              onDelete={() => handleDelete(item.id)} />
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

function MediaCard({ item, onEdit, onDelete }) {
  const [hovered, setHovered] = useState(false)

  const statusCfg = STATUS_LABELS[item.status]

  return (
    <div className="card" style={{ position: 'relative', cursor: 'default' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}>
      {/* Poster */}
      <div style={{ height: '200px', background: 'var(--bg-secondary)', position: 'relative', overflow: 'hidden' }}>
        {item.image_url ? (
          <img src={item.image_url} alt={item.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s',
              transform: hovered ? 'scale(1.05)' : 'scale(1)' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Film size={36} style={{ color: 'var(--text-muted)' }} />
          </div>
        )}
        {/* Status badge overlay */}
        <div style={{ position: 'absolute', top: '8px', left: '8px' }}>
          <span className={`badge ${statusCfg?.class}`} style={{ fontSize: '10px', padding: '2px 7px' }}>
            {statusCfg?.label}
          </span>
        </div>
        {/* Actions overlay on hover */}
        {hovered && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            animation: 'fadeIn 0.15s ease'
          }}>
            <button onClick={onEdit} className="btn btn-secondary" style={{
              padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)', color: 'white'
            }}>
              <Edit2 size={15} />
            </button>
            <button onClick={onDelete} className="btn" style={{
              padding: '8px', borderRadius: '8px', background: 'rgba(230,57,70,0.2)',
              border: '1px solid rgba(230,57,70,0.4)', color: 'var(--accent)'
            }}>
              <Trash2 size={15} />
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '10px 12px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, lineHeight: 1.3, marginBottom: '6px' }}>
          {item.name}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
          {/* Rating */}
          {item.rating ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <Star size={11} style={{ color: 'var(--gold)', fill: 'var(--gold)' }} />
              <span style={{ fontSize: '12px', color: 'var(--gold)', fontWeight: 600 }}>{item.rating}/10</span>
            </div>
          ) : <div />}

          {/* Country */}
          {item.country && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Globe size={11} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.country}</span>
            </div>
          )}
        </div>

        {/* Seasons info */}
        {item.seasons && (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {item.current_season ? `Season ${item.current_season}/${item.seasons}` : `${item.seasons} season${item.seasons > 1 ? 's' : ''}`}
          </div>
        )}

        {/* Subcategory tag */}
        {item.subcategory && (
          <div style={{
            marginTop: '6px', display: 'inline-block',
            fontSize: '10px', color: 'var(--text-muted)',
            background: 'var(--bg-secondary)', borderRadius: '4px', padding: '2px 6px'
          }}>
            {item.subcategory}
          </div>
        )}
      </div>
    </div>
  )
}
