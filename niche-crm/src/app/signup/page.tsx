'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('CLIENT')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignup() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, phone, password, role }),
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
    <div style={{
      minHeight: '100vh', background: '#0b0b0e', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: "'DM Sans',sans-serif", color: '#ededf2',
      backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px,transparent 1px)',
      backgroundSize: '30px 30px', padding: '24px'
    }}>
      <div style={{ position: 'fixed', width: '520px', height: '520px', background: 'rgba(43,47,255,0.13)', borderRadius: '50%', filter: 'blur(100px)', top: '-140px', left: '-140px', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', width: '380px', height: '380px', background: 'rgba(43,47,255,0.08)', borderRadius: '50%', filter: 'blur(100px)', bottom: '-80px', right: '-80px', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: '440px', position: 'relative', zIndex: 10 }}>
        <div style={{
          background: 'rgba(255,255,255,0.035)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '24px', padding: '48px 40px',
          backdropFilter: 'blur(28px)',
          boxShadow: '0 0 90px rgba(43,47,255,0.07),0 48px 96px rgba(0,0,0,0.55)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
            <svg viewBox="0 0 120 120" fill="none" width="56" height="56">
              <circle cx="82" cy="22" r="12" fill="#2b2fff" />
              <rect x="74" y="34" width="4" height="56" rx="2" fill="white" />
              <text x="80" y="90" fontFamily="Georgia,serif" fontSize="28" fontWeight="700" fill="white">che</text>
              <ellipse cx="36" cy="66" rx="28" ry="40" fill="white" />
              <path d="M22 42L22 90L33 90L33 62L48 90L52 90L52 42L41 42L41 68L27 42Z" fill="#0b0b0e" />
            </svg>
            <div>
              <div style={{ fontSize: '19px', fontWeight: 600, color: '#fff' }}>Niche</div>
              <div style={{ fontSize: '10px', letterSpacing: '2.5px', textTransform: 'uppercase', color: 'rgba(237,237,242,0.4)', marginTop: '2px' }}>CRM Platform</div>
            </div>
          </div>

          <h1 style={{ fontSize: '27px', fontWeight: 600, letterSpacing: '-0.6px', marginBottom: '5px' }}>Create your account</h1>
          <p style={{ color: 'rgba(237,237,242,0.4)', fontSize: '13.5px', marginBottom: '32px' }}>Join your workspace</p>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: 'rgba(237,237,242,0.4)', marginBottom: '7px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Full Name</label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.042)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '11px', padding: '12px 15px', color: '#ededf2', fontSize: '14px', fontFamily: 'DM Sans,sans-serif', outline: 'none' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: 'rgba(237,237,242,0.4)', marginBottom: '7px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.042)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '11px', padding: '12px 15px', color: '#ededf2', fontSize: '14px', fontFamily: 'DM Sans,sans-serif', outline: 'none' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: 'rgba(237,237,242,0.4)', marginBottom: '7px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Phone</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.042)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '11px', padding: '12px 15px', color: '#ededf2', fontSize: '14px', fontFamily: 'DM Sans,sans-serif', outline: 'none' }}
            />
          </div>

          <div style={{ marginBottom: '22px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: 'rgba(237,237,242,0.4)', marginBottom: '7px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSignup()}
              style={{ width: '100%', background: 'rgba(255,255,255,0.042)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '11px', padding: '12px 15px', color: '#ededf2', fontSize: '14px', fontFamily: 'DM Sans,sans-serif', outline: 'none' }}
            />
          </div>

          <div style={{ fontSize: '11px', fontWeight: 500, color: 'rgba(237,237,242,0.4)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Sign up as</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px', marginBottom: '28px' }}>
            {[
              { key: 'ADMIN', label: '⚡ Admin' },
              { key: 'PROJECT_MANAGER', label: '🎯 Project Manager' },
              { key: 'FREELANCER', label: '💼 Freelancer' },
              { key: 'CLIENT', label: '👤 Client' },
            ].map(r => (
              <button key={r.key} onClick={() => setRole(r.key)} style={{
                padding: '10px 8px',
                background: role === r.key ? 'rgba(43,47,255,0.15)' : 'rgba(255,255,255,0.03)',
                border: role === r.key ? '1px solid #2b2fff' : '1px solid rgba(255,255,255,0.07)',
                borderRadius: '10px',
                color: role === r.key ? '#fff' : 'rgba(237,237,242,0.4)',
                fontSize: '12.5px', fontFamily: 'DM Sans,sans-serif', cursor: 'pointer',
              }}>
                {r.label}
              </button>
            ))}
          </div>

          {error && <div style={{ color: '#f87171', fontSize: '13px', marginBottom: '12px', textAlign: 'center' }}>{error}</div>}

          <button onClick={handleSignup} disabled={loading} style={{
            width: '100%', padding: '13.5px',
            background: loading ? 'rgba(43,47,255,0.5)' : '#2b2fff',
            border: 'none', borderRadius: '11px', color: '#fff',
            fontSize: '14.5px', fontWeight: 500, fontFamily: 'DM Sans,sans-serif',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 0 30px rgba(43,47,255,0.35)',
          }}>
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
