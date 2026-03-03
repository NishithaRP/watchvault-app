import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Film, Tv, Sparkles, BookOpen, Eye, CheckCircle, Clock, TrendingUp } from 'lucide-react'

const CATEGORY_CONFIG = {
  movie: { label: 'Movies', icon: Film, color: '#e63946' },
  series: { label: 'TV Series', icon: Tv, color: '#4361ee' },
  anime: { label: 'Anime', icon: Sparkles, color: '#7b2d8b' },
  animation: { label: 'Animation', icon: Film, color: '#f4a261' },
  donghua: { label: 'Donghua', icon: Tv, color: '#2ec4b6' },
  manhwa: { label: 'Manhwa', icon: BookOpen, color: '#a8dadc' },
}

const STATUS_CONFIG = {
  watching: { label: 'Watching', icon: Eye, color: '#2ec4b6' },
  completed: { label: 'Completed', icon: CheckCircle, color: '#4361ee' },
  plan_to_watch: { label: 'Plan to Watch', icon: Clock, color: '#f4a261' },
  dropped: { label: 'Dropped', icon: TrendingUp, color: '#e63946' },
}

export default function Dashboard({ userId, onNavigate }) {
  const [stats, setStats] = useState(null)
  const [recents, setRecents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [userId])

  const loadData = async () => {
    const { data } = await supabase
      .from('media')
      .select('*')
      .eq('user_id', userId)

    if (data) {
      // Count by category
      const byCategory = {}
      const byStatus = {}
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }} className="fade-in">
      {/* Welcome */}
      <div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '4px' }}>Your Vault Overview</h2>
        <p style={{ color: 'var(--text-muted)' }}>
          {stats?.total || 0} total entries tracked
        </p>
      </div>

      {/* Status summary */}
      <div>
        <h3 style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: '14px' }}>
          By Status
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
          {Object.entries(STATUS_CONFIG).map(([status, config]) => {
            const count = stats?.byStatus?.[status] || 0
            return (
              <div key={status} className="card" style={{ padding: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <config.icon size={18} style={{ color: config.color }} />
                  <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}>
                    {count}
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{config.label}</div>
                <div style={{ marginTop: '8px', height: '3px', background: 'var(--bg-secondary)', borderRadius: '2px' }}>
                  <div style={{
                    height: '100%', borderRadius: '2px', background: config.color,
                    width: stats?.total ? `${(count / stats.total) * 100}%` : '0%',
                    transition: 'width 0.6s ease'
                  }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Category breakdown */}
      <div>
        <h3 style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: '14px' }}>
          By Category
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
          {Object.entries(CATEGORY_CONFIG).map(([cat, config]) => {
            const count = stats?.byCategory?.[cat] || 0
            return (
              <button key={cat} onClick={() => onNavigate(cat === 'movie' ? 'movies' : cat === 'series' ? 'series' : cat)}
                className="card" style={{
                  padding: '18px', cursor: 'pointer', textAlign: 'left',
                  borderLeft: `3px solid ${config.color}`, width: '100%'
                }}>
                <config.icon size={18} style={{ color: config.color, marginBottom: '8px' }} />
                <div style={{ fontSize: '26px', fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}>
                  {count}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{config.label}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Recent additions */}
      {recents.length > 0 && (
        <div>
          <h3 style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: '14px' }}>
            Recently Added
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
            {recents.map(item => (
              <div key={item.id} className="card" style={{ cursor: 'default' }}>
                {/* Poster */}
                <div style={{
                  height: '180px', background: 'var(--bg-secondary)',
                  position: 'relative', overflow: 'hidden'
                }}>
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{
                      width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Film size={32} style={{ color: 'var(--text-muted)' }} />
                    </div>
                  )}
                  <div style={{
                    position: 'absolute', top: '8px', right: '8px',
                    background: 'rgba(0,0,0,0.75)', borderRadius: '4px',
                    padding: '2px 6px', fontSize: '10px', color: 'var(--gold)', fontWeight: 600
                  }}>
                    {CATEGORY_CONFIG[item.category]?.label}
                  </div>
                </div>
                <div style={{ padding: '10px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                    {item.name}
                  </div>
                  {item.rating && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '4px' }}>
                      {[...Array(5)].map((_, i) => (
                        <span key={i} style={{ color: i < Math.round(item.rating / 2) ? 'var(--gold)' : 'var(--text-muted)', fontSize: '11px' }}>★</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {stats?.total === 0 && (
        <div style={{
          textAlign: 'center', padding: '60px 40px',
          background: 'var(--bg-card)', borderRadius: '16px', border: '1px dashed var(--border-light)'
        }}>
          <Film size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px' }}>Your vault is empty</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Start by adding movies, series, anime, or manhwa you've watched!
          </p>
        </div>
      )}
    </div>
  )
}
