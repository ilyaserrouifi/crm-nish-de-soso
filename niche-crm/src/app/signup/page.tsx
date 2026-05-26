'use client'

import { CSSProperties, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const roles = [
  { label: '⚡ Admin', value: 'ADMIN' },
  { label: '🎯 Project Manager', value: 'PROJECT_MANAGER' },
  { label: '💼 Freelancer', value: 'FREELANCER' },
  { label: '👤 Client', value: 'CLIENT' },
]

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('CLIENT')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignup() {
    setLoading(true)
    setError('')

    if (!name.trim() || !email.trim() || !phone.trim() || !password.trim()) {
      setError('Please fill in all fields')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: name, email, phone, password, role }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Signup failed')
        setLoading(false)
        return
      }

      router.push('/login')
    } catch {
      setError('Connection error')
      setLoading(false)
    }
  }

  return (
    <div style={pageStyle}>
      <div style={glowTopStyle} />
      <div style={glowBottomStyle} />

      <div style={{ width: '100%', maxWidth: '480px', position: 'relative', zIndex: 10 }}>
        <div style={cardStyle}>
          <h1 style={{ fontSize: '27px', fontWeight: 600, letterSpacing: '-0.6px', marginBottom: '5px' }}>Create your account</h1>
          <p style={{ color: 'rgba(237,237,242,0.4)', fontSize: '13.5px', marginBottom: '28px' }}>Sign up to access Niche CRM</p>

          <div style={{ display: 'grid', gap: 12 }}>
            <input type="text" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
            <input type="tel" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSignup()}
              style={inputStyle}
            />
          </div>

          <div style={roleLabelStyle}>Sign up as</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px', marginBottom: '20px' }}>
            {roles.map((r) => (
              <button key={r.value} onClick={() => setRole(r.value)} style={roleButtonStyle(role === r.value)}>
                {r.label}
              </button>
            ))}
          </div>

          {error && <div style={{ color: '#f87171', fontSize: '13px', marginBottom: '12px', textAlign: 'center' }}>{error}</div>}

          <button onClick={handleSignup} disabled={loading} style={submitStyle(loading)}>
            {loading ? 'Creating account...' : 'Create account →'}
          </button>

          <p style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(237,237,242,0.4)', marginTop: '20px' }}>
            Already have an account? <Link href="/login" style={{ color: 'rgba(120,130,255,0.85)', textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

const pageStyle: CSSProperties = {
  minHeight: '100vh',
  background: '#0b0b0e',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: "'DM Sans',sans-serif",
  color: '#ededf2',
  backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px,transparent 1px)',
  backgroundSize: '30px 30px',
  padding: '24px',
}
const glowTopStyle: CSSProperties = { position: 'fixed', width: '520px', height: '520px', background: 'rgba(43,47,255,0.13)', borderRadius: '50%', filter: 'blur(100px)', top: '-140px', left: '-140px', pointerEvents: 'none' }
const glowBottomStyle: CSSProperties = { position: 'fixed', width: '380px', height: '380px', background: 'rgba(43,47,255,0.08)', borderRadius: '50%', filter: 'blur(100px)', bottom: '-80px', right: '-80px', pointerEvents: 'none' }
const cardStyle: CSSProperties = { background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '24px', padding: '40px 36px', backdropFilter: 'blur(28px)', boxShadow: '0 0 90px rgba(43,47,255,0.07),0 48px 96px rgba(0,0,0,0.55)' }
const inputStyle: CSSProperties = { width: '100%', background: 'rgba(255,255,255,0.042)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '11px', padding: '12px 15px', color: '#ededf2', fontSize: '14px', fontFamily: 'DM Sans,sans-serif', outline: 'none' }
const roleLabelStyle: CSSProperties = { fontSize: '11px', fontWeight: 500, color: 'rgba(237,237,242,0.4)', letterSpacing: '0.5px', textTransform: 'uppercase', marginTop: '20px', marginBottom: '8px' }
const roleButtonStyle = (active: boolean): CSSProperties => ({ padding: '10px 8px', background: active ? 'rgba(43,47,255,0.15)' : 'rgba(255,255,255,0.03)', border: active ? '1px solid #2b2fff' : '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', color: active ? '#fff' : 'rgba(237,237,242,0.4)', fontSize: '12.5px', fontFamily: 'DM Sans,sans-serif', cursor: 'pointer' })
const submitStyle = (loading: boolean): CSSProperties => ({ width: '100%', padding: '13.5px', background: loading ? 'rgba(43,47,255,0.5)' : '#2b2fff', border: 'none', borderRadius: '11px', color: '#fff', fontSize: '14.5px', fontWeight: 500, fontFamily: 'DM Sans,sans-serif', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 0 30px rgba(43,47,255,0.35)' })
