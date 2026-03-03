import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Film, Tv, Sparkles, BookOpen, LayoutDashboard, LogOut, Plus, Menu, X, ChevronDown } from 'lucide-react'
import Dashboard from '../components/Dashboard'
import MediaList from '../components/MediaList'
import AddMediaModal from '../components/AddMediaModal'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'movies', label: 'Movies', icon: Film, category: 'movie' },
  { id: 'series', label: 'TV Series', icon: Tv, category: 'series' },
  { id: 'anime', label: 'Anime', icon: Sparkles, category: 'anime' },
  { id: 'animation', label: 'Animation', icon: Film, category: 'animation' },
  { id: 'donghua', label: 'Donghua', icon: Tv, category: 'donghua' },
  { id: 'manhwa', label: 'Manhwa', icon: BookOpen, category: 'manhwa' },
]

export default function MainApp({ session }) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showAdd, setShowAdd] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const username = session?.user?.user_metadata?.username || session?.user?.email?.split('@')[0] || 'User'

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const handleAdded = () => {
    setRefreshKey(k => k + 1)
    setShowAdd(false)
  }

  const activeItem = NAV_ITEMS.find(n => n.id === activeTab)

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{
        width: '240px', minWidth: '240px', background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 100,
        transform: sidebarOpen || window.innerWidth > 768 ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s ease'
      }}>
        {/* Logo */}
        <div style={{
          padding: '20px 20px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Film size={18} color="white" />
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', letterSpacing: '0.1em' }}>
              WATCHVAULT
            </span>
          </div>
          <button className="btn-ghost btn" style={{ padding: '4px' }}
            onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* User info */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-card)'
          }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', fontWeight: 700, color: 'white', flexShrink: 0
            }}>
              {username[0].toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', truncate: true }}>
                {username}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>My Vault</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {NAV_ITEMS.map(item => (
            <button key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => { setActiveTab(item.id); setSidebarOpen(false) }}>
              <item.icon size={16} />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Add button */}
        <div style={{ padding: '12px', borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => setShowAdd(true)}>
            <Plus size={16} />
            Add Entry
          </button>
          <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: '6px' }}
            onClick={handleLogout}>
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          zIndex: 99, display: window.innerWidth > 768 ? 'none' : 'block'
        }} />
      )}

      {/* Main content */}
      <main style={{
        flex: 1, marginLeft: '240px', overflow: 'auto', minHeight: '100vh',
        background: 'var(--bg-primary)'
      }}>
        {/* Top bar */}
        <header style={{
          padding: '16px 28px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: '16px',
          background: 'var(--bg-primary)', position: 'sticky', top: 0, zIndex: 50
        }}>
          <button className="btn btn-ghost" style={{ padding: '6px' }}
            onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {activeItem?.label || 'Dashboard'}
            </h1>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
              <Plus size={16} /> Add Entry
            </button>
          </div>
        </header>

        {/* Page content */}
        <div style={{ padding: '24px 28px' }} key={refreshKey}>
          {activeTab === 'dashboard'
            ? <Dashboard onNavigate={setActiveTab} userId={session.user.id} />
            : <MediaList
                category={activeItem?.category}
                userId={session.user.id}
                onAdd={() => setShowAdd(true)}
              />
          }
        </div>
      </main>

      {/* Add Modal */}
      {showAdd && (
        <AddMediaModal
          onClose={() => setShowAdd(false)}
          onSaved={handleAdded}
          userId={session.user.id}
        />
      )}
    </div>
  )
}
