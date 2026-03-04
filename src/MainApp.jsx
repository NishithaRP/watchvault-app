import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Film, Tv, Sparkles, BookOpen, LayoutDashboard, LogOut, Plus, Menu, X, BarChart2, Sun, Moon } from 'lucide-react'
import Dashboard from '../components/Dashboard'
import MediaList from '../components/MediaList'
import AddMediaModal from '../components/AddMediaModal'
import StatsPage from '../components/StatsPage'

const NAV_ITEMS = [
  { id: 'dashboard',  label: 'Dashboard', icon: LayoutDashboard },
  { id: 'stats',      label: 'Stats',     icon: BarChart2 },
  { id: 'movies',     label: 'Movies',    icon: Film,      category: 'movie' },
  { id: 'series',     label: 'TV Series', icon: Tv,        category: 'series' },
  { id: 'anime',      label: 'Anime',     icon: Sparkles,  category: 'anime' },
  { id: 'animation',  label: 'Animation', icon: Film,      category: 'animation' },
  { id: 'donghua',    label: 'Donghua',   icon: Tv,        category: 'donghua' },
  { id: 'manhwa',     label: 'Manhwa',    icon: BookOpen,  category: 'manhwa' },
]

const STATUS_LABELS_MAP = {
  watching: 'Currently Watching', completed: 'Completed',
  plan_to_watch: 'Plan to Watch', dropped: 'Dropped',
}

export default function MainApp({ session, theme, toggleTheme }) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showAdd, setShowAdd] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const username = session?.user?.user_metadata?.username || session?.user?.email?.split('@')[0] || 'User'

  const handleLogout = async () => { await supabase.auth.signOut() }
  const handleAdded = () => { setRefreshKey(k => k + 1); setShowAdd(false) }
  const activeItem = NAV_ITEMS.find(n => n.id === activeTab)

  const handleStatusClick = (status) => { setStatusFilter(status); setActiveTab('all'); setSidebarOpen(false) }
  const handleNavigate = (tab) => { setStatusFilter(null); setActiveTab(tab); setSidebarOpen(false) }
  const closeSidebar = () => setSidebarOpen(false)

  const pageTitle = activeTab === 'all'
    ? STATUS_LABELS_MAP[statusFilter]
    : activeItem?.label || 'Dashboard'

  const sidebarVisible = isMobile ? sidebarOpen : true

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* Sidebar */}
      <aside style={{
        width: '240px',
        minWidth: '240px',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        position: isMobile ? 'fixed' : 'relative',
        top: 0,
        left: 0,
        height: '100vh',
        zIndex: 200,
        transform: sidebarVisible ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: isMobile && sidebarOpen ? '4px 0 24px rgba(0,0,0,0.3)' : 'none',
      }}>
        {/* Logo + close */}
        <div style={{ padding: '16px 16px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Film size={18} color="white" />
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', letterSpacing: '0.1em', color: 'var(--text-primary)' }}>WATCHVAULT</span>
          </div>
          {/* X button — always functional */}
          <button onClick={closeSidebar}
            style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'var(--accent)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card-hover)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border)' }}>
            <X size={16} />
          </button>
        </div>

        {/* User info */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-card)' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: 'white', flexShrink: 0 }}>
              {username[0].toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{username}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>My Vault</div>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {NAV_ITEMS.map(item => (
            <button key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => handleNavigate(item.id)}>
              <item.icon size={16} />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {/* Theme toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              {theme === 'dark' ? <Moon size={15} /> : <Sun size={15} />}
              {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
            </div>
            <button className={`theme-toggle ${theme === 'dark' ? 'dark' : ''}`} onClick={toggleTheme} />
          </div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { setShowAdd(true); setSidebarOpen(false) }}>
            <Plus size={16} /> Add Entry
          </button>
          <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={handleLogout}>
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile overlay backdrop */}
      {isMobile && sidebarOpen && (
        <div onClick={closeSidebar} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 199, backdropFilter: 'blur(2px)' }} />
      )}

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', minHeight: '100vh', background: 'var(--bg-primary)', width: isMobile ? '100%' : 'calc(100% - 240px)' }}>
        {/* Top header */}
        <header style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-primary)', position: 'sticky', top: 0, zIndex: 50 }}>
          <button onClick={() => setSidebarOpen(true)}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <Menu size={18} />
          </button>
          <h1 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {pageTitle}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button onClick={toggleTheme}
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button className="btn btn-primary" onClick={() => setShowAdd(true)} style={{ padding: '8px 14px', fontSize: '13px' }}>
              <Plus size={15} />
              <span style={{ display: isMobile ? 'none' : 'inline' }}>Add Entry</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <div style={{ padding: isMobile ? '16px' : '24px 28px' }} key={refreshKey}>
          {activeTab === 'dashboard' && <Dashboard onNavigate={handleNavigate} onStatusClick={handleStatusClick} userId={session.user.id} />}
          {activeTab === 'stats'     && <StatsPage userId={session.user.id} />}
          {activeTab === 'all'       && <MediaList category={null} userId={session.user.id} onAdd={() => setShowAdd(true)} defaultStatus={statusFilter} />}
          {!['dashboard','stats','all'].includes(activeTab) && (
            <MediaList category={activeItem?.category} userId={session.user.id} onAdd={() => setShowAdd(true)} />
          )}
        </div>
      </main>

      {showAdd && <AddMediaModal onClose={() => setShowAdd(false)} onSaved={handleAdded} userId={session.user.id} />}
    </div>
  )
}
