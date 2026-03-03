import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Film, Eye, EyeOff, Tv, BookOpen } from 'lucide-react'

export default function LoginPage() {
  const [mode, setMode] = useState('login') // login | signup
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async () => {
    setError('')
    setMessage('')
    setLoading(true)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { username } }
      })
      if (error) setError(error.message)
      else setMessage('Account created! Check your email to confirm, or log in if email confirmation is disabled.')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-primary)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', position: 'relative', overflow: 'hidden'
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none'
      }}>
        <div style={{
          position: 'absolute', top: '-20%', right: '-10%',
          width: '600px', height: '600px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(230,57,70,0.08) 0%, transparent 70%)'
        }} />
        <div style={{
          position: 'absolute', bottom: '-20%', left: '-10%',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(67,97,238,0.08) 0%, transparent 70%)'
        }} />
        {/* floating icons */}
        {[Film, Tv, BookOpen].map((Icon, i) => (
          <Icon key={i} size={24} style={{
            position: 'absolute',
            top: `${20 + i * 30}%`,
            left: `${5 + i * 15}%`,
            color: 'rgba(255,255,255,0.04)',
            transform: `rotate(${i * 15}deg)`
          }} />
        ))}
      </div>

      <div style={{ width: '100%', maxWidth: '420px', animation: 'fadeIn 0.4s ease' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '56px', height: '56px', borderRadius: '14px',
            background: 'var(--accent)', marginBottom: '16px',
            boxShadow: '0 0 30px rgba(230,57,70,0.4)'
          }}>
            <Film size={28} color="white" />
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: '2.8rem',
            letterSpacing: '0.12em', color: 'var(--text-primary)'
          }}>WATCHVAULT</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
            Track everything you watch
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '32px' }}>
          {/* Toggle */}
          <div style={{
            display: 'flex', background: 'var(--bg-secondary)',
            borderRadius: '8px', padding: '4px', marginBottom: '28px'
          }}>
            {['login', 'signup'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); setMessage('') }}
                style={{
                  flex: 1, padding: '8px', border: 'none', borderRadius: '6px',
                  fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.2s',
                  background: mode === m ? 'var(--accent)' : 'transparent',
                  color: mode === m ? 'white' : 'var(--text-secondary)',
                  textTransform: 'uppercase', letterSpacing: '0.05em'
                }}>
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {mode === 'signup' && (
              <div className="form-group">
                <label className="form-label">Username</label>
                <input className="input" placeholder="your_username"
                  value={username} onChange={e => setUsername(e.target.value)} />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="input" type="email" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input className="input" type={showPw ? 'text' : 'password'}
                  placeholder="••••••••" value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  style={{ paddingRight: '42px' }} />
                <button onClick={() => setShowPw(!showPw)} style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)'
                }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                padding: '10px 14px', borderRadius: '8px',
                background: 'rgba(230,57,70,0.1)', border: '1px solid rgba(230,57,70,0.3)',
                color: 'var(--accent)', fontSize: '13px'
              }}>{error}</div>
            )}
            {message && (
              <div style={{
                padding: '10px 14px', borderRadius: '8px',
                background: 'rgba(46,196,182,0.1)', border: '1px solid rgba(46,196,182,0.3)',
                color: 'var(--green)', fontSize: '13px'
              }}>{message}</div>
            )}

            <button className="btn btn-primary" onClick={handleSubmit}
              disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: '4px' }}>
              {loading ? 'Please wait...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
