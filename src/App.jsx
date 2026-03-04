import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import LoginPage from './pages/LoginPage'
import MainApp from './pages/MainApp'

// Apply theme immediately before React renders
const savedTheme = localStorage.getItem('wv-theme') || 'dark'
document.documentElement.setAttribute('data-theme', savedTheme)

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState(savedTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('wv-theme', theme)
  }, [theme])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', color: 'var(--accent)', letterSpacing: '0.1em' }}>WATCHVAULT</div>
        <div style={{ color: 'var(--text-muted)', marginTop: '8px', animation: 'pulse 1.5s infinite' }}>Loading...</div>
      </div>
    </div>
  )

  return session
    ? <MainApp session={session} theme={theme} toggleTheme={toggleTheme} />
    : <LoginPage theme={theme} toggleTheme={toggleTheme} />
}
