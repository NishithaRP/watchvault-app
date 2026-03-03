import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { TrendingUp, Star, Globe, Clock, Award, BarChart2, Film } from 'lucide-react'

const CATEGORY_CONFIG = {
  movie:     { label: 'Movies',    color: '#e63946' },
  series:    { label: 'TV Series', color: '#4361ee' },
  anime:     { label: 'Anime',     color: '#7b2d8b' },
  animation: { label: 'Animation', color: '#f4a261' },
  donghua:   { label: 'Donghua',   color: '#2ec4b6' },
  manhwa:    { label: 'Manhwa',    color: '#a8dadc' },
}

const STATUS_CONFIG = {
  watching:      { label: 'Watching',       color: '#2ec4b6' },
  completed:     { label: 'Completed',      color: '#4361ee' },
  plan_to_watch: { label: 'Plan to Watch',  color: '#f4a261' },
  dropped:       { label: 'Dropped',        color: '#e63946' },
}

function Bar({ value, max, color, height = 120 }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1 }}>
      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>{value}</span>
      <div style={{ width: '100%', height: `${height}px`, background: 'var(--bg-secondary)', borderRadius: '6px', overflow: 'hidden', display: 'flex', alignItems: 'flex-end' }}>
        <div style={{
          width: '100%', height: `${pct}%`, background: color,
          borderRadius: '6px', transition: 'height 0.8s cubic-bezier(0.34,1.56,0.64,1)',
          minHeight: value > 0 ? '4px' : '0'
        }} />
      </div>
    </div>
  )
}

function DonutChart({ data, size = 140 }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) return <div style={{ width: size, height: size, borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>No data</div>

  let offset = 0
  const radius = 50
  const circ = 2 * Math.PI * radius
  const cx = size / 2, cy = size / 2
  const r = (size / 2) * 0.65
  const gap = 1.5

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      {data.map((d, i) => {
        if (d.value === 0) return null
        const pct = d.value / total
        const dash = pct * circ - gap
        const space = circ - dash
        const el = (
          <circle key={i} cx={cx} cy={cy} r={r}
            fill="none" stroke={d.color} strokeWidth={size * 0.13}
            strokeDasharray={`${dash} ${space}`}
            strokeDashoffset={-offset * circ}
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
          />
        )
        offset += pct
        return el
      })}
      <circle cx={cx} cy={cy} r={r * 0.55} fill="var(--bg-card)" />
      <text x={cx} y={cy + 5} textAnchor="middle" fill="var(--text-primary)"
        fontSize={size * 0.13} fontWeight="700" style={{ transform: 'rotate(90deg)', transformOrigin: `${cx}px ${cy}px` }}>
        {total}
      </text>
    </svg>
  )
}

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} style={{ color }} />
        </div>
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '0.05em', color: 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '6px' }}>{label}</div>
      {sub && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{sub}</div>}
    </div>
  )
}

export default function StatsPage({ userId }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('media').select('*').eq('user_id', userId)
      .then(({ data }) => { setData(data || []); setLoading(false) })
  }, [userId])

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
      <div style={{ color: 'var(--text-muted)', animation: 'pulse 1.5s infinite' }}>Loading stats...</div>
    </div>
  )

  const total = data.length
  const completed = data.filter(d => d.status === 'completed').length
  const watching = data.filter(d => d.status === 'watching').length
  const dropped = data.filter(d => d.status === 'dropped').length
  const rated = data.filter(d => d.rating)
  const avgRating = rated.length ? (rated.reduce((s, d) => s + d.rating, 0) / rated.length).toFixed(1) : 'N/A'
  const topRated = [...data].filter(d => d.rating).sort((a, b) => b.rating - a.rating).slice(0, 5)
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

  // By category counts
  const byCat = Object.keys(CATEGORY_CONFIG).map(k => ({
    key: k, ...CATEGORY_CONFIG[k], value: data.filter(d => d.category === k).length
  }))
  const maxCat = Math.max(...byCat.map(c => c.value), 1)

  // By status for donut
  const byStatus = Object.entries(STATUS_CONFIG).map(([k, v]) => ({
    ...v, value: data.filter(d => d.status === k).length
  }))

  // Top countries
  const countryCounts = {}
  data.forEach(d => { if (d.country) countryCounts[d.country] = (countryCounts[d.country] || 0) + 1 })
  const topCountries = Object.entries(countryCounts).sort((a, b) => b[1] - a[1]).slice(0, 6)
  const maxCountry = topCountries[0]?.[1] || 1

  // Rating distribution
  const ratingDist = Array.from({ length: 10 }, (_, i) => ({
    rating: i + 1, count: data.filter(d => d.rating === i + 1).length
  }))
  const maxRating = Math.max(...ratingDist.map(r => r.count), 1)

  if (total === 0) return (
    <div style={{ textAlign: 'center', padding: '80px 40px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px dashed var(--border-light)' }}>
      <BarChart2 size={40} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
      <h3 style={{ marginBottom: '8px' }}>No data yet</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Add some entries to see your stats!</p>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }} className="fade-in">
      <div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '4px' }}>Your Stats</h2>
        <p style={{ color: 'var(--text-muted)' }}>A deep dive into your watching habits</p>
      </div>

      {/* Top stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
        <StatCard icon={Film} label="Total Entries" value={total} color="#e63946" />
        <StatCard icon={Award} label="Completed" value={completed} sub={`${completionRate}% completion rate`} color="#4361ee" />
        <StatCard icon={Clock} label="Watching Now" value={watching} color="#2ec4b6" />
        <StatCard icon={Star} label="Avg Rating" value={avgRating} sub={`from ${rated.length} rated`} color="#f4a261" />
        <StatCard icon={TrendingUp} label="Dropped" value={dropped} sub={total > 0 ? `${Math.round((dropped/total)*100)}% drop rate` : ''} color="#7b2d8b" />
        <StatCard icon={Globe} label="Countries" value={Object.keys(countryCounts).length} sub="tracked" color="#a8dadc" />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

        {/* Category bar chart */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: '20px' }}>By Category</h3>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', height: '140px' }}>
            {byCat.map(cat => (
              <div key={cat.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)' }}>{cat.value}</span>
                <div style={{ width: '100%', height: '110px', background: 'var(--bg-secondary)', borderRadius: '6px', overflow: 'hidden', display: 'flex', alignItems: 'flex-end' }}>
                  <div style={{
                    width: '100%', background: cat.color, borderRadius: '6px',
                    height: `${maxCat > 0 ? (cat.value / maxCat) * 100 : 0}%`,
                    transition: 'height 0.8s cubic-bezier(0.34,1.56,0.64,1)',
                    minHeight: cat.value > 0 ? '4px' : '0'
                  }} />
                </div>
                <span style={{ fontSize: '9px', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.2 }}>{cat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status donut */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: '20px' }}>By Status</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <DonutChart data={byStatus} size={130} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              {byStatus.map(s => s.value > 0 && (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: s.color, flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', flex: 1 }}>{s.label}</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Rating distribution */}
      {rated.length > 0 && (
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Rating Distribution
          </h3>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', height: '100px' }}>
            {ratingDist.map(r => (
              <div key={r.rating} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                {r.count > 0 && <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--gold)' }}>{r.count}</span>}
                <div style={{ width: '100%', height: '72px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden', display: 'flex', alignItems: 'flex-end' }}>
                  <div style={{
                    width: '100%', borderRadius: '4px',
                    background: r.rating >= 8 ? '#f4a261' : r.rating >= 5 ? '#4361ee' : '#e63946',
                    height: `${(r.count / maxRating) * 100}%`,
                    transition: 'height 0.6s ease', minHeight: r.count > 0 ? '3px' : '0'
                  }} />
                </div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{r.rating}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '12px' }}>
            {[['#e63946','1-4 Poor'],['#4361ee','5-7 Good'],['#f4a261','8-10 Great']].map(([c,l]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: c }} />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top countries + Top rated side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

        {/* Top countries */}
        {topCountries.length > 0 && (
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: '16px' }}>Top Countries</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {topCountries.map(([country, count], i) => (
                <div key={country}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '  '} {country}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>{count}</span>
                  </div>
                  <div style={{ height: '4px', background: 'var(--bg-secondary)', borderRadius: '2px' }}>
                    <div style={{
                      height: '100%', borderRadius: '2px',
                      background: `hsl(${i * 40 + 200}, 60%, 55%)`,
                      width: `${(count / maxCountry) * 100}%`, transition: 'width 0.6s ease'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top rated */}
        {topRated.length > 0 && (
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: '16px' }}>Top Rated</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {topRated.map((item, i) => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '16px', flexShrink: 0 }}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{CATEGORY_CONFIG[item.category]?.label}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
                    <Star size={12} style={{ color: 'var(--gold)', fill: 'var(--gold)' }} />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gold)' }}>{item.rating}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
