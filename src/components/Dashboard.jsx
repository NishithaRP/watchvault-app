import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Film, Tv, Sparkles, BookOpen, Eye, CheckCircle, Clock, TrendingUp, Star, Globe, Grid, LayoutGrid, Book } from 'lucide-react'

const CATEGORY_CONFIG = {
  movie:     { label: 'Movie',     emoji: '🎬', icon: Film,     color: '#e63946' },
  series:    { label: 'TV Series', emoji: '📺', icon: Tv,       color: '#4361ee' },
  anime:     { label: 'Anime',     emoji: '✨', icon: Sparkles, color: '#7b2d8b' },
  animation: { label: 'Animation', emoji: '🎨', icon: Film,     color: '#f4a261' },
  donghua:   { label: 'Donghua',   emoji: '🐉', icon: Tv,       color: '#2ec4b6' },
  manhwa:    { label: 'Manhwa',    emoji: '📖', icon: BookOpen, color: '#a8dadc' },
  books:     { label: 'Books',     emoji: '📚', icon: Book,     color: '#e9c46a' },
}

const STATUS_CONFIG = {
  watching:      { label: 'Watching',      icon: Eye,         color: '#2ec4b6', badge: 'badge-watching' },
  completed:     { label: 'Completed',     icon: CheckCircle, color: '#4361ee', badge: 'badge-completed' },
  plan_to_watch: { label: 'Plan to Watch', icon: Clock,       color: '#f4a261', badge: 'badge-plan' },
  dropped:       { label: 'Dropped',       icon: TrendingUp,  color: '#e63946', badge: 'badge-dropped' },
}

function RecentCard({ item, cardSize }) {
  const catCfg = CATEGORY_CONFIG[item.category]
  const statusCfg = STATUS_CONFIG[item.status]
  const isCompact = cardSize === 'compact'

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: isCompact ? '200px' : '260px', background: 'var(--bg-secondary)', position: 'relative', overflow: 'hidden', flexShrink: 0, lineHeight: 0 }}>
        {item.image_url
          ? <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)' }}>
              <Film size={isCompact ? 32 : 40} style={{ color: 'var(--text-muted)' }} />
            </div>
        }
      </div>
      <div style={{ padding: isCompact ? '8px 10px' : '12px 14px', display: 'flex', flexDirection: 'column', gap: isCompact ? '4px' : '8px' }}>
        <div style={{ fontSize: isCompact ? '12px' : '14px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
          {item.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: '5px', padding: '2px 6px' }}>
            {catCfg?.emoji} {catCfg?.label}
          </span>
          {item.country && !isCompact && (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '2px' }}>
              <Globe size={10} /> {item.country}
            </span>
          )}
        </div>
        <span className={`badge ${statusCfg?.badge}`} style={{ fontSize: isCompact ? '10px' : '11px', padding: isCompact ? '2px 7px' : '3px 10px', alignSelf: 'flex-start' }}>
          {statusCfg?.label}
        </span>
        {item.rating && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Star size={isCompact ? 11 : 13} style={{ color: 'var(--gold)', fill: 'var(--gold)' }} />
            <span style={{ fontSize: isCompact ? '11px' : '13px', fontWeight: 700, color: 'var(--gold)' }}>{item.rating}/10</span>
          </div>
        )}
        {item.seasons && (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            📺 {item.current_season ? `S${item.current_season}/${item.seasons}` : `${item.seasons} Season${item.seasons > 1 ? 's' : ''}`}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Dashboard({ userId, onNavigate, onStatusClick }) {
  const [stats, setStats] = useState(null)
  const [recents, setRecents] = useState([])
  const [loading, setLoading] = useState(true)
  const [cardSize, setCardSize] = useState(() => localStorage.getItem('wv-cardsize') || 'detailed')

  useEffect(() => { loadData() }, [userId])

  const toggleCardSize = (size) => {
    setCardSize(size)
    localStorage.setItem('wv-cardsize', size)
  }

  const loadData = async () => {
    const { data } = await supabase.from('media').select('*').eq('user_id', userId)
    if (data) {
      const byCategory = {}, byStatus = {}
      data.forEach(item => {
        byCategory[item.category] = (byCategory[item.category] || 0) + 1
        byStatus[item.status] = (byStatus[item.status] || 0) + 1
      })
      setStats({ byCategory, byStatus, total: data.length })
      setRecents(data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 8))
    }
    setLoading(false)
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
      <div style={{ color: 'var(--text-muted)', animation: 'pulse 1.5s infinite' }}>Loading your vault...</div>
    </div>
  )

  const gridCols = cardSize === 'compact'
    ? 'repeat(auto-fill, minmax(155px, 1fr))'
    : 'repeat(auto-fill, minmax(200px, 1fr))'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }} className="fade-in">
      <div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '4px' }}>Your Vault Overview</h2>
        <p style={{ color: 'var(--text-muted)' }}>{stats?.total || 0} total entries tracked</p>
      </div>

      {/* Status cards */}
      <div>
        <h3 style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: '14px' }}>
          By Status — click to view
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
          {Object.entries(STATUS_CONFIG).map(([status, config]) => {
            const count = stats?.byStatus?.[status] || 0
            return (
              <button key={status} onClick={() => count > 0 && onStatusClick(status)}
                className="card" style={{ padding: '18px', textAlign: 'left', width: '100%', cursor: count > 0 ? 'pointer' : 'default', opacity: count === 0 ? 0.5 : 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <config.icon size={18} style={{ color: config.color }} />
                  <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}>{count}</span>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{config.label}</div>
                {count > 0 && <div style={{ fontSize: '11px', color: config.color, marginTop: '4px' }}>Click to view →</div>}
                <div style={{ marginTop: '8px', height: '3px', background: 'var(--bg-secondary)', borderRadius: '2px' }}>
                  <div style={{ height: '100%', borderRadius: '2px', background: config.color, width: stats?.total ? `${(count / stats.total) * 100}%` : '0%', transition: 'width 0.6s ease' }} />
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Category cards */}
      <div>
        <h3 style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: '14px' }}>
          By Category
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
          {Object.entries(CATEGORY_CONFIG).map(([cat, config]) => {
            const count = stats?.byCategory?.[cat] || 0
            const tabId = cat === 'movie' ? 'movies' : cat
            return (
              <button key={cat} onClick={() => onNavigate(tabId)} className="card"
                style={{ padding: '18px', cursor: 'pointer', textAlign: 'left', borderLeft: `3px solid ${config.color}`, width: '100%' }}>
                <config.icon size={18} style={{ color: config.color, marginBottom: '8px' }} />
                <div style={{ fontSize: '26px', fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}>{count}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{config.label}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Recently added */}
      {recents.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)' }}>
              Recently Added
            </h3>
            <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: '8px', padding: '3px', gap: '2px', border: '1px solid var(--border)' }}>
              <button onClick={() => toggleCardSize('compact')}
                style={{ padding: '5px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', background: cardSize === 'compact' ? 'var(--accent)' : 'transparent', color: cardSize === 'compact' ? 'white' : 'var(--text-muted)', fontSize: '12px', fontWeight: 600, fontFamily: 'var(--font-body)', transition: 'all 0.2s' }}>
                <Grid size={13} /> Compact
              </button>
              <button onClick={() => toggleCardSize('detailed')}
                style={{ padding: '5px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', background: cardSize === 'detailed' ? 'var(--accent)' : 'transparent', color: cardSize === 'detailed' ? 'white' : 'var(--text-muted)', fontSize: '12px', fontWeight: 600, fontFamily: 'var(--font-body)', transition: 'all 0.2s' }}>
                <LayoutGrid size={13} /> Detailed
              </button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: '16px' }}>
            {recents.map(item => (
              <RecentCard key={item.id} item={item} cardSize={cardSize} />
            ))}
          </div>
        </div>
      )}

      {stats?.total === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 40px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px dashed var(--border-light)' }}>
          <Film size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px' }}>Your vault is empty</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Start by adding movies, series, anime, or manhwa!</p>
        </div>
      )}
    </div>
  )
}
