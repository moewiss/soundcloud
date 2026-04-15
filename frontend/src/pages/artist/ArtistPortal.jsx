import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import artistApi from '../../services/artistApi'
import { api } from '../../services/api'

/* ═══════════════════════════════════════════════════════════════════════════
   NASHIDIFY ARTIST PORTAL — Standalone
   ═══════════════════════════════════════════════════════════════════════════ */

// ─── Theme — Nashidify Emerald & Gold ───
const T = {
  bg: '#0a1510',
  bgCard: '#112019',
  bgSidebar: '#0c1812',
  bgHover: '#173025',
  bgHighlight: '#1a3028',
  border: 'rgba(197,164,73,0.08)',
  text: '#f2efe8',
  textSub: '#a8b0a0',
  textMuted: '#6b7a6e',
  accent: '#2D9B6E',
  accentLight: '#38B882',
  accentBg: 'rgba(45,155,110,0.12)',
  gold: '#c5a449',
  goldLight: '#d4b65e',
  goldBg: 'rgba(197,164,73,0.1)',
  red: '#ef4444',
  redBg: 'rgba(239,68,68,0.08)',
  green: '#38B882',
  greenBg: 'rgba(56,184,130,0.08)',
  orange: '#f59e0b',
  orangeBg: 'rgba(245,158,11,0.08)',
}

// ─── Shared Components ───
const Card = ({ children, style, ...props }) => (
  <div style={{ background: T.bgCard, borderRadius: 14, padding: '18px 22px', border: `1px solid ${T.border}`, ...style }} {...props}>{children}</div>
)
const Btn = ({ children, variant = 'primary', style, disabled, ...props }) => {
  const styles = {
    primary: { background: T.accent, color: '#fff', border: 'none', fontWeight: 600 },
    secondary: { background: 'rgba(255,255,255,0.04)', color: T.textSub, border: `1px solid ${T.border}` },
    danger: { background: T.redBg, color: T.red, border: `1px solid ${T.red}20` },
    gold: { background: T.goldBg, color: T.gold, border: `1px solid ${T.gold}20` },
    ghost: { background: 'transparent', color: T.textMuted, border: 'none' },
  }
  return (
    <button
      disabled={disabled}
      style={{
        padding: '8px 18px', borderRadius: 10, cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: '0.82rem', opacity: disabled ? 0.5 : 1, transition: 'all 0.15s',
        fontFamily: 'var(--font-sans, Inter, -apple-system, sans-serif)',
        ...styles[variant], ...style,
      }}
      {...props}
    >
      {children}
    </button>
  )
}
const Input = ({ label, style, ...props }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: T.textMuted, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</label>}
    <input style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${T.border}`, background: T.bgHighlight, color: T.text, fontSize: '0.84rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color 0.2s', ...style }} {...props} />
  </div>
)
const Textarea = ({ label, style, ...props }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: T.textMuted, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</label>}
    <textarea style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${T.border}`, background: T.bgHighlight, color: T.text, fontSize: '0.84rem', outline: 'none', minHeight: 80, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color 0.2s', ...style }} {...props} />
  </div>
)
const Select = ({ label, children, style, ...props }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: T.textMuted, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</label>}
    <select style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${T.border}`, background: T.bgHighlight, color: T.text, fontSize: '0.84rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', ...style }} {...props}>{children}</select>
  </div>
)
const Modal = ({ children, onClose }) => (
  <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(10,21,16,0.75)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
    <div onClick={e => e.stopPropagation()} style={{ background: T.bgCard, borderRadius: 18, padding: 28, border: `1px solid ${T.border}`, width: 560, maxWidth: '95vw', maxHeight: '85vh', overflow: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>{children}</div>
  </div>
)
const Badge = ({ status }) => {
  const colors = { approved: T.green, published: T.green, pending: T.orange, draft: T.textMuted, scheduled: '#64b5f6', rejected: T.red, processing: '#facc15' }
  const c = colors[status] || T.textMuted
  return <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 8, fontSize: '0.68rem', fontWeight: 600, background: `${c}15`, color: c, textTransform: 'capitalize', letterSpacing: '0.02em' }}>{status?.replace(/_/g, ' ')}</span>
}
const Spinner = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
    <i className="fas fa-circle-notch fa-spin" style={{ fontSize: 18, color: T.accent, marginRight: 10 }}></i>
    <span style={{ color: T.textMuted, fontSize: '0.85rem' }}>Loading...</span>
  </div>
)
const ChipSelect = ({ options, selected, onChange, labels }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
    {options.map(opt => {
      const active = selected.includes(opt)
      return (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(active ? selected.filter(s => s !== opt) : [...selected, opt])}
          style={{
            padding: '6px 14px', borderRadius: 20, border: `1px solid ${active ? T.accent + '40' : T.border}`,
            background: active ? T.accentBg : 'rgba(255,255,255,0.02)', color: active ? T.accentLight : T.textSub,
            cursor: 'pointer', fontSize: '0.78rem', fontWeight: active ? 600 : 400, transition: 'all 0.15s',
            fontFamily: 'inherit',
          }}
        >
          {labels ? (labels[opt] || opt) : opt}
        </button>
      )
    })}
  </div>
)

const CATEGORIES = ['Quran', 'Nasheed', 'Podcast', 'Lecture', 'Islamic Education', 'Dua', 'Adhkar', 'Children', 'Wedding', 'Other']
const CREATOR_TYPES = ['reciter', 'nasheed_artist', 'podcaster', 'lecturer', 'scholar', 'poet']
const CREATOR_TYPE_LABELS = { reciter: 'Quran Reciter', nasheed_artist: 'Nasheed Artist', podcaster: 'Podcaster', lecturer: 'Lecturer', scholar: 'Scholar', poet: 'Poet' }
const LANGUAGES = ['ar', 'en', 'ur', 'tr', 'ms', 'id', 'fr', 'so', 'bn', 'fa']
const LANGUAGE_LABELS = { ar: 'Arabic', en: 'English', ur: 'Urdu', tr: 'Turkish', ms: 'Malay', id: 'Indonesian', fr: 'French', so: 'Somali', bn: 'Bengali', fa: 'Persian' }
const SOCIAL_KEYS = ['instagram', 'youtube', 'twitter', 'tiktok', 'website']
const SOCIAL_ICONS = { instagram: 'fa-instagram', youtube: 'fa-youtube', twitter: 'fa-twitter', tiktok: 'fa-tiktok', website: 'fa-globe' }
const AUDIO_ACCEPT = '.mp3,.wav,.flac,.ogg,.m4a,.aac'

const sidebarItems = [
  { id: 'dashboard', icon: 'th-large', label: 'Dashboard' },
  { id: 'profile', icon: 'user-edit', label: 'Profile' },
  { id: 'content', icon: 'music', label: 'Content' },
  { id: 'analytics', icon: 'chart-line', label: 'Analytics' },
  { id: 'promotions', icon: 'rocket', label: 'Promotions', link: '/promote' },
  { id: 'audience', icon: 'users', label: 'Audience' },
  { id: 'settings', icon: 'cog', label: 'Settings', link: '/settings' },
]

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function ArtistPortal() {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [onboardingState, setOnboardingState] = useState(null)
  const [onboardingLoading, setOnboardingLoading] = useState(true)

  useEffect(() => {
    if (!localStorage.getItem('token')) { navigate('/login'); return }
    artistApi.getOnboardingState()
      .then(data => {
        setOnboardingState(data)
        setOnboardingLoading(false)
      })
      .catch(() => {
        setOnboardingLoading(false)
      })
  }, [navigate])

  const handleOnboardingComplete = () => {
    setOnboardingState(prev => ({ ...prev, onboarding_state: 'completed' }))
  }

  const handleNavClick = (item) => {
    if (item.link) { navigate(item.link); return }
    if (item.disabled) return
    setActiveSection(item.id)
    setMobileMenuOpen(false)
  }

  if (onboardingLoading) {
    return (
      <div style={{ height: '100vh', background: T.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, fontFamily: 'var(--font-sans, Inter, sans-serif)' }}>
        <img src="/hero-logo.png" alt="" style={{ width: 48, height: 48, opacity: 0.6 }} />
        <div style={{ color: T.textMuted, fontSize: '0.85rem' }}><i className="fas fa-circle-notch fa-spin" style={{ marginRight: 8, color: T.accent }}></i>Loading Artist Studio...</div>
      </div>
    )
  }

  // Show onboarding if not completed
  if (onboardingState && onboardingState.onboarding_state !== 'completed') {
    return <OnboardingFlow state={onboardingState} onComplete={handleOnboardingComplete} />
  }

  const sw = sidebarOpen ? 240 : 64

  return (
    <div style={{ display: 'flex', height: '100vh', background: T.bg, color: T.text, fontFamily: 'var(--font-sans, Inter, -apple-system, BlinkMacSystemFont, sans-serif)' }}>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        style={{
          display: 'none', position: 'fixed', top: 14, left: 14, zIndex: 1001, background: T.bgCard,
          border: `1px solid ${T.border}`, borderRadius: 10, padding: '8px 12px', color: T.text, cursor: 'pointer',
          fontSize: 15, boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        }}
        className="artist-mobile-menu-btn"
      >
        <i className={`fas fa-${mobileMenuOpen ? 'times' : 'bars'}`}></i>
      </button>

      {/* Sidebar */}
      <aside
        className="artist-sidebar"
        style={{
          width: sw, height: '100vh', background: T.bgSidebar,
          borderRight: `1px solid ${T.border}`,
          display: 'flex', flexDirection: 'column', transition: 'width 0.2s ease', flexShrink: 0, overflow: 'hidden',
          position: mobileMenuOpen ? 'fixed' : 'relative', zIndex: mobileMenuOpen ? 1000 : 1,
        }}
      >
        {/* Header — Logo */}
        <div style={{
          padding: sidebarOpen ? '18px 18px' : '18px 12px', borderBottom: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          {(() => {
            const u = JSON.parse(localStorage.getItem('user') || '{}')
            const isPro = u.plan_slug === 'artist_pro'
            return sidebarOpen ? (
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: T.gold, letterSpacing: '0.05em', textTransform: 'uppercase', lineHeight: 1.2 }}>
                  Artist Studio{isPro && <span style={{ fontSize: '0.55rem', marginLeft: 6, padding: '2px 5px', borderRadius: 4, background: T.goldBg, color: T.gold, verticalAlign: 'middle', fontWeight: 700, letterSpacing: '0.04em' }}>PRO</span>}
                </div>
                <div style={{ fontSize: '0.6rem', color: T.textMuted, marginTop: 2 }}>Sound that reminds</div>
              </div>
            ) : (
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: T.gold }}>{isPro ? 'PRO' : 'AS'}</span>
            )
          })()}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
          {sidebarItems.map(item => {
            const isActive = activeSection === item.id && !item.disabled && !item.link
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: sidebarOpen ? '10px 14px' : '10px 0',
                  justifyContent: sidebarOpen ? 'flex-start' : 'center',
                  borderRadius: 10, border: 'none', cursor: item.disabled ? 'default' : 'pointer',
                  marginBottom: 2, transition: 'all 0.15s',
                  background: isActive ? T.accentBg : 'transparent',
                  color: item.disabled ? T.textMuted : (isActive ? T.accentLight : T.textSub),
                  fontWeight: isActive ? 600 : 400, fontSize: '0.82rem',
                  opacity: item.disabled ? 0.45 : 1,
                  fontFamily: 'inherit',
                }}
                title={sidebarOpen ? undefined : item.label}
              >
                <i className={`fas fa-${item.icon}`} style={{ width: 18, textAlign: 'center', fontSize: 13, opacity: isActive ? 1 : 0.7 }}></i>
                {sidebarOpen && (
                  <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
                )}
                {sidebarOpen && item.disabled && (
                  <span style={{ fontSize: '0.58rem', background: T.bgHighlight, color: T.textMuted, padding: '2px 6px', borderRadius: 6, fontWeight: 600, letterSpacing: '0.03em' }}>Soon</span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: '10px 8px', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 6, alignItems: 'center' }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', color: T.textMuted, cursor: 'pointer', fontSize: 12, padding: 7, borderRadius: 8, transition: 'color 0.15s' }} title="Toggle sidebar">
            <i className={`fas fa-${sidebarOpen ? 'angles-left' : 'angles-right'}`}></i>
          </button>
          {sidebarOpen && (
            <button onClick={() => navigate('/home')} style={{ background: 'none', border: 'none', color: T.textMuted, cursor: 'pointer', fontSize: '0.72rem', padding: '6px 8px', borderRadius: 8, transition: 'color 0.15s', fontFamily: 'inherit' }}>
              <i className="fas fa-arrow-left" style={{ marginRight: 5, fontSize: 10 }}></i>Back to Nashidify
            </button>
          )}
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div onClick={() => setMobileMenuOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(10,21,16,0.6)', backdropFilter: 'blur(4px)', zIndex: 999 }}></div>
      )}

      {/* Main Content */}
      <main style={{ flex: 1, overflow: 'auto', padding: '28px 32px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          {activeSection === 'dashboard' && <DashboardSection />}
          {activeSection === 'analytics' && <AnalyticsSection />}
          {activeSection === 'profile' && <ProfileSection />}
          {activeSection === 'audience' && <AudienceSection />}
          {activeSection === 'content' && <ContentSection />}
        </div>
      </main>

      {/* Mobile responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .artist-mobile-menu-btn { display: block !important; }
          .artist-sidebar { position: fixed !important; left: ${mobileMenuOpen ? '0' : '-260px'}; width: 240px !important; z-index: 1000 !important; transition: left 0.2s ease !important; }
          main { padding: 16px 14px !important; }
        }
      `}</style>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION: Dashboard
   ═══════════════════════════════════════════════════════════════════════════ */
function DashboardSection() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    artistApi.getDashboard()
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { toast.error('Failed to load dashboard'); setLoading(false) })
  }, [])

  if (loading) return <Spinner />
  if (!data) return <Card><p style={{ color: T.textMuted }}>Unable to load dashboard data.</p></Card>

  const stats = data.stats || {}
  const isPro = data.is_pro
  const lifetime = data.lifetime || {}

  const statCards = [
    { label: 'Plays', value: stats.plays?.count ?? 0, change: stats.plays?.change ?? 0, icon: 'play', color: T.accent },
    { label: 'Likes', value: stats.likes?.count ?? 0, change: stats.likes?.change ?? 0, icon: 'heart', color: '#ef4444' },
    { label: 'Followers', value: stats.new_followers?.count ?? 0, change: stats.new_followers?.change ?? 0, icon: 'users', color: '#8b5cf6' },
  ]

  const activityIcons = { like: 'heart', follow: 'user-plus', comment: 'comment' }
  const activityColors = { like: '#ef4444', follow: '#8b5cf6', comment: '#3b82f6' }

  const fmtTime = (str) => {
    if (!str) return ''
    const d = new Date(str)
    const now = new Date()
    const diff = Math.floor((now - d) / 1000)
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
    return d.toLocaleDateString()
  }

  return (
    <div>
      {/* Greeting + Plan Badge */}
      <Card style={{ marginBottom: 20, borderLeft: `3px solid ${T.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <p style={{ fontSize: '1.1rem', fontWeight: 600, color: T.text, margin: 0 }}>{data.greeting || 'Welcome back!'}</p>
        <span style={{
          padding: '4px 12px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.06em',
          background: isPro ? `${T.gold}18` : `${T.accent}18`,
          color: isPro ? T.gold : T.accent,
          border: `1px solid ${isPro ? T.gold : T.accent}30`,
        }}>
          <i className={`fas fa-${isPro ? 'crown' : 'palette'}`} style={{ marginRight: 5, fontSize: 10 }} />
          {data.plan === 'artist_pro' ? 'Artist Pro' : data.plan === 'artist' ? 'Artist' : data.plan || 'Artist'}
        </span>
      </Card>

      {/* Pro: Today's Real-time Stats */}
      {isPro && data.today && (
        <Card style={{ marginBottom: 20, background: `linear-gradient(135deg, ${T.bgCard}, #1a1f2e)`, border: `1px solid ${T.accent}20` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: T.green, animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Live Today</span>
          </div>
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700, color: T.text }}>{(data.today.plays || 0).toLocaleString()}</div>
              <div style={{ fontSize: '0.68rem', color: T.textMuted, textTransform: 'uppercase' }}>Plays</div>
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#ef4444' }}>{(data.today.likes || 0).toLocaleString()}</div>
              <div style={{ fontSize: '0.68rem', color: T.textMuted, textTransform: 'uppercase' }}>Likes</div>
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#8b5cf6' }}>{(data.today.followers || 0).toLocaleString()}</div>
              <div style={{ fontSize: '0.68rem', color: T.textMuted, textTransform: 'uppercase' }}>New Followers</div>
            </div>
          </div>
        </Card>
      )}

      {/* Weekly Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
        {statCards.map((s, i) => (
          <Card key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: s.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className={`fas fa-${s.icon}`} style={{ color: s.color, fontSize: 14 }} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: T.text, lineHeight: 1.1 }}>{typeof s.value === 'number' ? s.value.toLocaleString() : s.value}</div>
              <div style={{ fontSize: '0.7rem', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
                {s.label}
                {s.change !== null && s.change !== undefined && (
                  <span style={{ color: s.change >= 0 ? T.green : T.red, fontWeight: 600 }}>
                    <i className={`fas fa-arrow-${s.change >= 0 ? 'up' : 'down'}`} style={{ fontSize: 8, marginRight: 2 }} />
                    {Math.abs(s.change)}%
                  </span>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Plays Sparkline (7 day) */}
      {Array.isArray(data.plays_sparkline) && data.plays_sparkline.length > 0 && (
        <Card style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: T.text, marginBottom: 10 }}>
            <i className="fas fa-chart-area" style={{ color: T.accent, marginRight: 8 }} />Plays — Last 7 Days
          </h3>
          <MiniLineChart data={data.plays_sparkline} color={T.accent} height={130} />
        </Card>
      )}

      {/* Pro: Hourly Activity */}
      {isPro && Array.isArray(data.hourly_plays) && data.hourly_plays.length > 0 && (
        <Card style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: T.text, marginBottom: 10 }}>
            <i className="fas fa-clock" style={{ color: '#3b82f6', marginRight: 8 }} />Today's Activity by Hour
          </h3>
          <MiniLineChart data={data.hourly_plays} color="#3b82f6" height={110} />
        </Card>
      )}

      {/* Pending approvals */}
      {data.pending_count > 0 && (
        <Card style={{ marginBottom: 20, background: T.orangeBg, border: `1px solid ${T.orange}30` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: T.orange }}>
            <i className="fas fa-clock" style={{ fontSize: 16 }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{data.pending_count} track{data.pending_count !== 1 ? 's' : ''} pending review</span>
          </div>
        </Card>
      )}

      {/* Lifetime Stats Bar */}
      <Card style={{ marginBottom: 20, background: `linear-gradient(135deg, ${T.bgCard}, #0f1a14)` }}>
        <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: T.text, marginBottom: 14 }}>
          <i className="fas fa-infinity" style={{ color: T.gold, marginRight: 8 }} />Lifetime
        </h3>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'Total Plays', value: lifetime.total_plays, color: T.accent },
            { label: 'Total Likes', value: lifetime.total_likes, color: '#ef4444' },
            { label: 'Followers', value: lifetime.total_followers, color: '#8b5cf6' },
            { label: 'Comments', value: lifetime.total_comments, color: '#3b82f6' },
            { label: 'Tracks', value: lifetime.total_tracks, color: T.gold },
          ].map((s, i) => (
            <div key={i}>
              <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{(s.value || 0).toLocaleString()}</div>
              <div style={{ fontSize: '0.65rem', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 20 }}>
        {/* Top track */}
        <Card>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 14, color: T.text }}>
            <i className="fas fa-trophy" style={{ color: T.gold, marginRight: 8 }} />Top Track This Week
          </h3>
          {data.top_track ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 10, background: T.bgHighlight, flexShrink: 0,
                backgroundImage: data.top_track.cover_url ? `url(${data.top_track.cover_url})` : 'none',
                backgroundSize: 'cover', backgroundPosition: 'center',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {!data.top_track.cover_url && <i className="fas fa-music" style={{ color: T.textMuted, fontSize: 18 }} />}
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: T.text }}>{data.top_track.title}</div>
                <div style={{ fontSize: '0.75rem', color: T.textSub, marginTop: 2 }}>
                  <i className="fas fa-play" style={{ marginRight: 4, fontSize: 10 }} />
                  {(data.top_track.plays_this_week || 0).toLocaleString()} plays this week · {(data.top_track.total_plays || 0).toLocaleString()} total
                </div>
              </div>
            </div>
          ) : (
            <p style={{ color: T.textMuted, fontSize: '0.82rem', margin: 0 }}>No plays this week yet</p>
          )}
        </Card>

      </div>

      {/* Top 5 Tracks (all time) */}
      {Array.isArray(data.top_5_tracks) && data.top_5_tracks.length > 0 && (
        <Card style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 14, color: T.text }}>
            <i className="fas fa-fire" style={{ color: '#f59e0b', marginRight: 8 }} />Top Tracks — All Time
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {data.top_5_tracks.map((track, i) => {
              const maxPlays = data.top_5_tracks[0]?.plays || 1
              return (
                <div key={track.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                  <span style={{ fontSize: '0.75rem', color: i === 0 ? T.gold : T.textMuted, width: 18, textAlign: 'center', fontWeight: 700 }}>{i + 1}</span>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8, background: T.bgHighlight, flexShrink: 0,
                    backgroundImage: track.cover_url ? `url(${track.cover_url})` : 'none',
                    backgroundSize: 'cover', backgroundPosition: 'center',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {!track.cover_url && <i className="fas fa-music" style={{ color: T.textMuted, fontSize: 11 }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.title}</div>
                    <div style={{ height: 4, borderRadius: 2, background: T.bgHighlight, marginTop: 4 }}>
                      <div style={{ width: `${(track.plays / maxPlays) * 100}%`, height: '100%', borderRadius: 2, background: i === 0 ? T.gold : T.accent, transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: T.textMuted, fontVariantNumeric: 'tabular-nums' }}>{(track.plays || 0).toLocaleString()}</span>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Pro: Two-column — Trending Tracks + Top Listeners */}
      {isPro && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 20 }}>
          {/* Trending Tracks */}
          {Array.isArray(data.trending_tracks) && data.trending_tracks.length > 0 && (
            <Card>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 14, color: T.text }}>
                <i className="fas fa-chart-line" style={{ color: T.accent, marginRight: 8 }} />Trending Now
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {data.trending_tracks.map((t, i) => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 10px', borderRadius: 10, background: T.bgHighlight }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 8, background: T.bgCard, flexShrink: 0,
                      backgroundImage: t.cover_url ? `url(${t.cover_url})` : 'none',
                      backgroundSize: 'cover', backgroundPosition: 'center',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {!t.cover_url && <i className="fas fa-music" style={{ color: T.textMuted, fontSize: 12 }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                      <div style={{ fontSize: '0.68rem', color: T.textMuted, marginTop: 2 }}>
                        <span style={{ color: T.accent, fontWeight: 600 }}>Trend {t.trending}</span> · Viral {t.viral} · Pop {t.popularity}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Top Listeners */}
          {Array.isArray(data.top_listeners) && data.top_listeners.length > 0 && (
            <Card>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 14, color: T.text }}>
                <i className="fas fa-headphones" style={{ color: '#8b5cf6', marginRight: 8 }} />Top Listeners (30d)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.top_listeners.map((l, i) => (
                  <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0', borderBottom: `1px solid ${T.border}` }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#8b5cf620', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#8b5cf6' }}>{i + 1}</span>
                    </div>
                    <span style={{ flex: 1, fontSize: '0.82rem', color: T.text, fontWeight: 500, cursor: 'pointer' }} onClick={() => navigate(`/users/${l.id}`)}>{l.name}</span>
                    <span style={{ fontSize: '0.72rem', color: T.textMuted }}>{l.plays} plays</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Pro: Category Breakdown */}
      {isPro && Array.isArray(data.category_breakdown) && data.category_breakdown.length > 0 && (
        <Card style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 14, color: T.text }}>
            <i className="fas fa-layer-group" style={{ color: T.accent, marginRight: 8 }} />Content Breakdown
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
            {data.category_breakdown.map((cat, i) => {
              const colors = [T.accent, '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', T.gold, '#14b8a6']
              const c = colors[i % colors.length]
              return (
                <div key={i} style={{ padding: '12px 14px', borderRadius: 10, background: c + '10', border: `1px solid ${c}20` }}>
                  <div style={{ fontSize: '0.72rem', color: c, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>{cat.category}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>{cat.tracks} <span style={{ fontSize: '0.7rem', color: T.textMuted, fontWeight: 400 }}>tracks</span></div>
                  <div style={{ fontSize: '0.7rem', color: T.textSub, marginTop: 2 }}>{(cat.plays || 0).toLocaleString()} plays</div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Recent Activity Feed */}
      {Array.isArray(data.recent_activity) && data.recent_activity.length > 0 && (
        <Card style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 14, color: T.text }}>
            <i className="fas fa-stream" style={{ color: T.accent, marginRight: 8 }} />Recent Activity
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {data.recent_activity.slice(0, 12).map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: `1px solid ${T.border}08` }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: (activityColors[a.type] || T.accent) + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className={`fas fa-${activityIcons[a.type] || 'bell'}`} style={{ color: activityColors[a.type] || T.accent, fontSize: 10 }} />
                </div>
                <div style={{ flex: 1, fontSize: '0.78rem', color: T.textSub, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <span style={{ color: T.text, fontWeight: 600 }}>{a.user}</span>
                  {a.type === 'like' && <> liked <span style={{ color: T.text }}>{a.track}</span></>}
                  {a.type === 'follow' && <> started following you</>}
                  {a.type === 'comment' && <> commented on <span style={{ color: T.text }}>{a.track}</span>{a.body ? <>: <span style={{ fontStyle: 'italic', color: T.textMuted }}>"{a.body}"</span></> : ''}</>}
                </div>
                <span style={{ fontSize: '0.65rem', color: T.textMuted, flexShrink: 0 }}>{fmtTime(a.at)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Milestones */}
      {Array.isArray(data.milestones) && data.milestones.length > 0 && (
        <Card style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 14, color: T.text }}>
            <i className="fas fa-award" style={{ color: T.gold, marginRight: 8 }} />Milestones
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {data.milestones.map((m, i) => (
              <div key={i} style={{ padding: '6px 14px', borderRadius: 20, background: T.goldBg, color: T.gold, fontSize: '0.75rem', fontWeight: 600, border: `1px solid ${T.gold}25` }}>
                <i className="fas fa-star" style={{ marginRight: 5, fontSize: 9 }} />
                {m.label || m.title || m}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Quick actions */}
      <Card>
        <h3 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 14, color: T.text }}>Quick Actions</h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Btn onClick={() => {
            const portal = document.querySelector('main')
            if (portal) portal.dispatchEvent(new CustomEvent('artist-nav', { detail: 'content' }))
          }}>
            <i className="fas fa-upload" style={{ marginRight: 6 }} />Upload Track
          </Btn>
          <Btn variant="secondary" onClick={() => {
            const portal = document.querySelector('main')
            if (portal) portal.dispatchEvent(new CustomEvent('artist-nav', { detail: 'analytics' }))
          }}>
            <i className="fas fa-chart-line" style={{ marginRight: 6 }} />View Analytics
          </Btn>
          <Btn variant="secondary" onClick={() => {
            const portal = document.querySelector('main')
            if (portal) portal.dispatchEvent(new CustomEvent('artist-nav', { detail: 'profile' }))
          }}>
            <i className="fas fa-user-edit" style={{ marginRight: 6 }} />Edit Profile
          </Btn>
          <Btn variant="secondary" onClick={() => navigate('/home')}>
            <i className="fas fa-eye" style={{ marginRight: 6 }} />View Public Page
          </Btn>
        </div>
      </Card>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION: Analytics
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── Mini Line Chart (pure SVG) ── */
function MiniLineChart({ data = [], color = T.accent, height = 160, label = '' }) {
  if (!data.length) return (
    <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textMuted, fontSize: '0.82rem' }}>
      No data yet
    </div>
  )

  const maxY = Math.max(...data.map(d => d.y), 1)
  const pad = { top: 16, right: 12, bottom: 28, left: 44 }
  const w = 600
  const h = height
  const chartW = w - pad.left - pad.right
  const chartH = h - pad.top - pad.bottom

  const points = data.map((d, i) => ({
    x: pad.left + (data.length > 1 ? (i / (data.length - 1)) * chartW : chartW / 2),
    y: pad.top + chartH - (d.y / maxY) * chartH,
    label: d.x,
    value: d.y,
  }))

  const line = points.map(p => `${p.x},${p.y}`).join(' ')
  const area = `${points[0].x},${pad.top + chartH} ${line} ${points[points.length - 1].x},${pad.top + chartH}`

  // Y-axis ticks
  const yTicks = [0, Math.round(maxY / 2), maxY]

  // X-axis labels (show ~6 evenly spaced)
  const step = Math.max(1, Math.floor(data.length / 6))
  const xLabels = data.filter((_, i) => i % step === 0 || i === data.length - 1)

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height }} preserveAspectRatio="none">
      {/* Grid lines */}
      {yTicks.map((tick, i) => {
        const y = pad.top + chartH - (tick / maxY) * chartH
        return (
          <g key={i}>
            <line x1={pad.left} y1={y} x2={w - pad.right} y2={y} stroke={T.border} strokeWidth="0.5" />
            <text x={pad.left - 6} y={y + 3} textAnchor="end" fill={T.textMuted} fontSize="9" fontFamily="var(--font-sans)">
              {tick >= 1000 ? `${(tick / 1000).toFixed(1)}k` : tick}
            </text>
          </g>
        )
      })}
      {/* Area fill */}
      <defs>
        <linearGradient id={`areaGrad-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#areaGrad-${color.replace('#','')})`} />
      {/* Line */}
      <polyline points={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Dots */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} opacity="0.8" />
      ))}
      {/* X labels */}
      {xLabels.map((d, i) => {
        const idx = data.indexOf(d)
        const x = pad.left + (data.length > 1 ? (idx / (data.length - 1)) * chartW : chartW / 2)
        const lbl = d.x?.length > 5 ? d.x.slice(5) : d.x // show MM-DD
        return <text key={i} x={x} y={h - 4} textAnchor="middle" fill={T.textMuted} fontSize="8" fontFamily="var(--font-sans)">{lbl}</text>
      })}
    </svg>
  )
}

/* ── Mini Bar Chart (div-based horizontal bars) ── */
function MiniBarChart({ items = [], color = T.accent, maxItems = 10 }) {
  if (!items.length) return <p style={{ color: T.textMuted, fontSize: '0.82rem', margin: 0 }}>No data yet</p>
  const max = Math.max(...items.map(i => i.value), 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {items.slice(0, maxItems).map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '0.75rem', color: T.textSub, minWidth: 120, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.label}
          </span>
          <div style={{ flex: 1, height: 8, background: T.bgHighlight, borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${(item.value / max) * 100}%`, height: '100%', background: item.color || color, borderRadius: 4, transition: 'width 0.4s ease' }} />
          </div>
          <span style={{ fontSize: '0.7rem', color: T.textMuted, minWidth: 36, textAlign: 'right' }}>{item.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

/* ── Pro Gate — blurred overlay for locked sections ── */
function ProGate({ children, title, isPro }) {
  const navigate = useNavigate()
  if (isPro) return children
  return (
    <Card style={{ position: 'relative', overflow: 'hidden', minHeight: 160 }}>
      <div style={{ filter: 'blur(6px)', pointerEvents: 'none', opacity: 0.3, userSelect: 'none' }}>
        {children}
      </div>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', background: 'rgba(11,16,21,0.6)',
        backdropFilter: 'blur(2px)', zIndex: 2,
      }}>
        <i className="fas fa-lock" style={{ fontSize: 22, color: T.gold, marginBottom: 10 }} />
        <span style={{ color: T.text, fontWeight: 600, fontSize: '0.9rem' }}>{title}</span>
        <span style={{ color: T.textMuted, fontSize: '0.75rem', marginTop: 3 }}>Upgrade to Artist Pro</span>
        <Btn variant="gold" style={{ marginTop: 14, fontSize: '0.78rem', padding: '7px 20px' }} onClick={() => navigate('/pricing')}>
          Upgrade
        </Btn>
      </div>
    </Card>
  )
}

function AnalyticsSection() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30d')
  const [sortCol, setSortCol] = useState('plays')
  const [sortDir, setSortDir] = useState('desc')
  const [activeChart, setActiveChart] = useState('plays')

  useEffect(() => {
    setLoading(true)
    artistApi.getAnalytics(period)
      .then(d => { setData(d); setLoading(false) })
      .catch(() => {
        setData({
          period, plan: 'artist', is_pro: false, has_analytics: false,
          overview: { plays: 0, plays_change: 0, likes: 0, likes_change: 0, followers: 0, followers_change: 0, comments: 0, comments_change: 0, reposts: 0, reposts_change: 0, total_followers: 0, total_plays: 0 },
          plays_over_time: [], likes_over_time: [], top_tracks: [],
          follower_growth: { series: [], total: 0, net_change: 0, growth_rate: 0 },
          category_performance: [],
        })
        setLoading(false)
      })
  }, [period])

  if (loading) return <Spinner />
  if (!data) return <Card><p style={{ color: T.textMuted }}>Unable to load analytics.</p></Card>

  const ov = data.overview || {}
  const isPro = data.is_pro
  const aiSummary = data.ai_summary || {}

  const statCards = [
    { label: 'Plays', value: ov.plays ?? 0, change: ov.plays_change, icon: 'play', color: T.accent },
    { label: 'Likes', value: ov.likes ?? 0, change: ov.likes_change, icon: 'heart', color: '#ef4444' },
    { label: 'Followers', value: ov.followers ?? 0, change: ov.followers_change, icon: 'users', color: '#8b5cf6' },
    { label: 'Comments', value: ov.comments ?? 0, change: ov.comments_change, icon: 'comment', color: '#3b82f6' },
    { label: 'Reposts', value: ov.reposts ?? 0, change: ov.reposts_change, icon: 'retweet', color: T.gold },
  ]

  const periods = [
    { key: '7d', label: '7 Days' },
    { key: '30d', label: '30 Days' },
    { key: '90d', label: '90 Days' },
    { key: 'all', label: 'All Time' },
  ]

  const chartTabs = [
    { key: 'plays', label: 'Plays', color: T.accent, data: data.plays_over_time || [] },
    { key: 'likes', label: 'Likes', color: '#ef4444', data: data.likes_over_time || [] },
    { key: 'followers', label: 'Followers', color: '#8b5cf6', data: data.follower_growth?.series || [] },
  ]

  const comparison = [...(data.track_comparison || [])]
  if (sortCol) {
    comparison.sort((a, b) => {
      const av = a[sortCol] ?? 0, bv = b[sortCol] ?? 0
      return sortDir === 'desc' ? bv - av : av - bv
    })
  }

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortCol(col); setSortDir('desc') }
  }

  const insightIcons = { growth: 'chart-line', content: 'music', engagement: 'heart', revenue: 'dollar-sign', retention: 'clock' }
  const insightColors = { growth: T.accent, content: '#3b82f6', engagement: '#f59e0b', revenue: T.gold, retention: '#8b5cf6' }
  const dayNames = ['', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const priorityColors = { high: '#ef4444', medium: '#f59e0b', low: T.accent }

  // ── Export Utilities ──
  const downloadFile = (content, filename, type) => {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
  }

  const toCsv = (headers, rows) => {
    const escape = v => `"${String(v ?? '').replace(/"/g, '""')}"`
    return [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))].join('\n')
  }

  const exportSection = (section) => {
    const ts = new Date().toISOString().slice(0, 10)
    switch (section) {
      case 'overview': {
        const csv = toCsv(['Metric', 'Value', 'Change %'], [
          ['Plays', ov.plays, ov.plays_change], ['Likes', ov.likes, ov.likes_change],
          ['Followers', ov.followers, ov.followers_change], ['Comments', ov.comments, ov.comments_change],
          ['Reposts', ov.reposts, ov.reposts_change], ['Total Plays', ov.total_plays, ''],
          ['Total Followers', ov.total_followers, ''],
        ])
        downloadFile(csv, `nashidify-overview-${ts}.csv`, 'text/csv')
        break
      }
      case 'plays': {
        const csv = toCsv(['Date', 'Plays'], (data.plays_over_time || []).map(d => [d.x, d.y]))
        downloadFile(csv, `nashidify-plays-${ts}.csv`, 'text/csv')
        break
      }
      case 'likes': {
        const csv = toCsv(['Date', 'Likes'], (data.likes_over_time || []).map(d => [d.x, d.y]))
        downloadFile(csv, `nashidify-likes-${ts}.csv`, 'text/csv')
        break
      }
      case 'top_tracks': {
        const csv = toCsv(['Rank', 'Title', 'Plays', 'Likes', 'Comments', 'Trend %'],
          (data.top_tracks || []).map((t, i) => [i + 1, t.title, t.plays, t.likes, t.comments, t.trend]))
        downloadFile(csv, `nashidify-top-tracks-${ts}.csv`, 'text/csv')
        break
      }
      case 'followers': {
        const fg = data.follower_growth || {}
        const csv = toCsv(['Date', 'New Followers'], (fg.series || []).map(d => [d.x, d.y]))
        downloadFile(csv, `nashidify-followers-${ts}.csv`, 'text/csv')
        break
      }
      case 'categories': {
        const csv = toCsv(['Category', 'Tracks', 'Plays', 'Likes', 'Engagement %'],
          (data.category_performance || []).map(c => [c.category, c.tracks, c.plays, c.likes, c.engagement]))
        downloadFile(csv, `nashidify-categories-${ts}.csv`, 'text/csv')
        break
      }
      case 'retention': {
        const csv = toCsv(['Track', 'Completion %', 'Avg Listened (s)', 'Duration (s)', 'Plays'],
          (data.listener_retention?.tracks || []).map(t => [t.title, t.completion_rate, t.avg_listened, t.duration, t.plays]))
        downloadFile(csv, `nashidify-retention-${ts}.csv`, 'text/csv')
        break
      }
      case 'comparison': {
        const csv = toCsv(['Track', 'Plays', 'Likes', 'Comments', 'Reposts', 'Retention %', 'Engagement %', 'Trending Score'],
          (data.track_comparison || []).map(t => [t.title, t.plays, t.likes, t.comments, t.reposts, t.retention, t.engagement_rate, t.trending_score]))
        downloadFile(csv, `nashidify-track-comparison-${ts}.csv`, 'text/csv')
        break
      }
      case 'audience': {
        const ai = data.audience_insights || {}
        const csv = toCsv(['Source', 'Count'], (ai.sources || []).map(s => [s.source, s.count]))
        downloadFile(csv, `nashidify-audience-${ts}.csv`, 'text/csv')
        break
      }
      case 'all': {
        // Export everything as one big CSV report
        let lines = []
        lines.push('NASHIDIFY ANALYTICS REPORT')
        lines.push(`Period: ${period}`)
        lines.push(`Generated: ${new Date().toLocaleString()}`)
        lines.push('')
        lines.push('── OVERVIEW ──')
        lines.push(toCsv(['Metric', 'Value', 'Change %'], [
          ['Plays', ov.plays, ov.plays_change], ['Likes', ov.likes, ov.likes_change],
          ['Followers', ov.followers, ov.followers_change], ['Comments', ov.comments, ov.comments_change],
          ['Reposts', ov.reposts, ov.reposts_change], ['Total Plays (Lifetime)', ov.total_plays, ''],
          ['Total Followers', ov.total_followers, ''],
        ]))
        lines.push('')
        lines.push('── PLAYS OVER TIME ──')
        lines.push(toCsv(['Date', 'Plays'], (data.plays_over_time || []).map(d => [d.x, d.y])))
        lines.push('')
        lines.push('── TOP TRACKS ──')
        lines.push(toCsv(['Rank', 'Title', 'Plays', 'Likes', 'Comments', 'Trend %'],
          (data.top_tracks || []).map((t, i) => [i + 1, t.title, t.plays, t.likes, t.comments, t.trend])))
        lines.push('')
        lines.push('── FOLLOWER GROWTH ──')
        lines.push(toCsv(['Date', 'New Followers'], (data.follower_growth?.series || []).map(d => [d.x, d.y])))
        lines.push('')
        lines.push('── CATEGORY PERFORMANCE ──')
        lines.push(toCsv(['Category', 'Tracks', 'Plays', 'Likes', 'Engagement %'],
          (data.category_performance || []).map(c => [c.category, c.tracks, c.plays, c.likes, c.engagement])))
        if (isPro && data.track_comparison) {
          lines.push('')
          lines.push('── TRACK COMPARISON ──')
          lines.push(toCsv(['Track', 'Plays', 'Likes', 'Comments', 'Retention %', 'Engagement %', 'Trending'],
            data.track_comparison.map(t => [t.title, t.plays, t.likes, t.comments, t.retention, t.engagement_rate, t.trending_score])))
        }
        if (isPro && data.listener_retention) {
          lines.push('')
          lines.push('── LISTENER RETENTION ──')
          lines.push(`Overall Average: ${data.listener_retention.overall_avg}%`)
          lines.push(toCsv(['Track', 'Completion %', 'Plays'],
            (data.listener_retention.tracks || []).map(t => [t.title, t.completion_rate, t.plays])))
        }
        downloadFile(lines.join('\n'), `nashidify-full-report-${ts}.csv`, 'text/csv')
        toast.success('Full analytics report exported')
        break
      }
    }
    if (section !== 'all') toast.success(`${section.replace(/_/g, ' ')} exported`)
  }

  const ExportBtn = ({ section, label }) => (
    <button onClick={() => exportSection(section)} title={`Export ${label || section}`} style={{
      background: 'none', border: `1px solid ${T.border}`, borderRadius: 7, padding: '4px 8px',
      cursor: 'pointer', color: T.textMuted, fontSize: '0.65rem', fontWeight: 600,
      display: 'inline-flex', alignItems: 'center', gap: 4, transition: 'all 0.15s',
      fontFamily: 'inherit', letterSpacing: '0.02em',
    }}>
      <i className="fas fa-download" style={{ fontSize: 9 }} />CSV
    </button>
  )

  return (
    <div>
      {/* Header + Period Selector */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: T.text, margin: 0 }}>
            <i className="fas fa-chart-line" style={{ color: T.accent, marginRight: 8 }} />Analytics
          </h2>
          <button onClick={() => exportSection('all')} style={{
            background: T.accentBg, border: `1px solid ${T.accent}25`, borderRadius: 8, padding: '5px 12px',
            cursor: 'pointer', color: T.accent, fontSize: '0.7rem', fontWeight: 600,
            display: 'inline-flex', alignItems: 'center', gap: 5, transition: 'all 0.15s', fontFamily: 'inherit',
          }}>
            <i className="fas fa-file-export" style={{ fontSize: 10 }} />Export All
          </button>
        </div>
        <div style={{ display: 'flex', gap: 3, background: T.bgCard, borderRadius: 8, padding: 3 }}>
          {periods.map(p => (
            <button key={p.key} onClick={() => setPeriod(p.key)} style={{
              padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
              fontSize: '0.75rem', fontWeight: 600, transition: 'all 0.15s',
              background: period === p.key ? T.accent : 'transparent',
              color: period === p.key ? '#fff' : T.textSub,
            }}>{p.label}</button>
          ))}
        </div>
      </div>

      {/* ═══ AI PERFORMANCE SCORE (Pro) ═══ */}
      {isPro && aiSummary.score > 0 && (
        <Card style={{ marginBottom: 20, background: `linear-gradient(135deg, ${T.bgCard}, #1a1f2e)`, border: `1px solid ${T.gold}20` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            {/* Score circle */}
            <div style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
              <svg viewBox="0 0 80 80" style={{ width: 80, height: 80, transform: 'rotate(-90deg)' }}>
                <circle cx="40" cy="40" r="34" fill="none" stroke={T.bgHighlight} strokeWidth="6" />
                <circle cx="40" cy="40" r="34" fill="none" stroke={aiSummary.score >= 70 ? T.accent : aiSummary.score >= 40 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={`${(aiSummary.score / 100) * 213.6} 213.6`} />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: T.text }}>{aiSummary.score}</span>
                <span style={{ fontSize: '0.55rem', color: T.textMuted, fontWeight: 600 }}>{aiSummary.grade || ''}</span>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <i className="fas fa-robot" style={{ color: T.gold, fontSize: 14 }} />
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: T.gold, textTransform: 'uppercase', letterSpacing: '0.06em' }}>AI Performance Score</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: T.textSub, margin: 0, lineHeight: 1.6 }}>{aiSummary.summary}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Overview Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 20 }}>
        {statCards.map((s, i) => (
          <Card key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: s.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className={`fas fa-${s.icon}`} style={{ color: s.color, fontSize: 13 }} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: T.text, lineHeight: 1.1 }}>{s.value.toLocaleString()}</div>
              <div style={{ fontSize: '0.68rem', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                {s.label}
                {s.change != null && (
                  <span style={{ color: s.change >= 0 ? T.green : T.red, fontWeight: 600 }}>
                    <i className={`fas fa-arrow-${s.change >= 0 ? 'up' : 'down'}`} style={{ fontSize: 7, marginRight: 1 }} />
                    {Math.abs(s.change)}%
                  </span>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Multi-tab Chart */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: T.text, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fas fa-chart-area" style={{ color: chartTabs.find(t => t.key === activeChart)?.color || T.accent, marginRight: 4 }} />Performance
            <ExportBtn section={activeChart === 'followers' ? 'followers' : activeChart} label="chart" />
          </h3>
          <div style={{ display: 'flex', gap: 2 }}>
            {chartTabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveChart(tab.key)} style={{
                padding: '4px 12px', borderRadius: 5, border: 'none', cursor: 'pointer',
                fontSize: '0.7rem', fontWeight: 600, transition: 'all 0.15s',
                background: activeChart === tab.key ? tab.color + '20' : 'transparent',
                color: activeChart === tab.key ? tab.color : T.textMuted,
              }}>{tab.label}</button>
            ))}
          </div>
        </div>
        <MiniLineChart data={chartTabs.find(t => t.key === activeChart)?.data || []} color={chartTabs.find(t => t.key === activeChart)?.color || T.accent} height={200} />
      </Card>

      {/* Two-column: Top Tracks + Category Performance */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 20 }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: T.text, margin: 0 }}>
              <i className="fas fa-trophy" style={{ color: T.gold, marginRight: 8 }} />Top Tracks
            </h3>
            <ExportBtn section="top_tracks" label="top tracks" />
          </div>
          {(data.top_tracks || []).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {data.top_tracks.slice(0, 8).map((track, i) => {
                const maxP = data.top_tracks[0]?.plays || 1
                return (
                  <div key={track.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' }}>
                    <span style={{ fontSize: '0.68rem', color: i < 3 ? T.gold : T.textMuted, width: 16, textAlign: 'center', fontWeight: 700 }}>{i + 1}</span>
                    <div style={{
                      width: 30, height: 30, borderRadius: 6, background: T.bgHighlight, flexShrink: 0,
                      backgroundImage: track.cover_url ? `url(${track.cover_url})` : 'none',
                      backgroundSize: 'cover', backgroundPosition: 'center',
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.title}</div>
                      <div style={{ height: 3, borderRadius: 2, background: T.bgHighlight, marginTop: 3 }}>
                        <div style={{ width: `${(track.plays / maxP) * 100}%`, height: '100%', borderRadius: 2, background: T.accent }} />
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 600, color: T.text }}>{track.plays.toLocaleString()}</div>
                      <span style={{ fontSize: '0.62rem', fontWeight: 600, color: track.trend >= 0 ? T.green : T.red }}>
                        {track.trend >= 0 ? '+' : ''}{track.trend}%
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : <p style={{ color: T.textMuted, fontSize: '0.8rem', margin: 0 }}>No data yet</p>}
        </Card>

        {/* Category Performance */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: T.text, margin: 0 }}>
              <i className="fas fa-layer-group" style={{ color: T.accent, marginRight: 8 }} />Category Performance
            </h3>
            <ExportBtn section="categories" label="categories" />
          </div>
          {(data.category_performance || []).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.category_performance.map((cat, i) => {
                const colors = [T.accent, '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', T.gold]
                const c = colors[i % colors.length]
                return (
                  <div key={i} style={{ padding: '10px 12px', borderRadius: 8, background: c + '08', border: `1px solid ${c}15` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: c }}>{cat.category}</span>
                      <span style={{ fontSize: '0.68rem', color: T.textMuted }}>{cat.tracks} tracks</span>
                    </div>
                    <div style={{ display: 'flex', gap: 12, fontSize: '0.7rem', color: T.textSub }}>
                      <span><i className="fas fa-play" style={{ fontSize: 8, marginRight: 3 }} />{(cat.plays || 0).toLocaleString()}</span>
                      <span><i className="fas fa-heart" style={{ fontSize: 8, marginRight: 3 }} />{cat.likes || 0}</span>
                      <span style={{ color: cat.engagement >= 5 ? T.green : T.textMuted }}>{cat.engagement}% engage</span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : <p style={{ color: T.textMuted, fontSize: '0.8rem', margin: 0 }}>No data yet</p>}
        </Card>
      </div>

      {/* Follower Growth */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: T.text, margin: 0 }}>
            <i className="fas fa-users" style={{ color: '#8b5cf6', marginRight: 8 }} />Follower Growth
          </h3>
          <ExportBtn section="followers" label="followers" />
        </div>
        <div style={{ display: 'flex', gap: 24, marginBottom: 14, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: T.text }}>{(data.follower_growth?.total || 0).toLocaleString()}</div>
            <div style={{ fontSize: '0.65rem', color: T.textMuted, textTransform: 'uppercase' }}>Total</div>
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: (data.follower_growth?.net_change ?? 0) >= 0 ? T.green : T.red }}>
              {(data.follower_growth?.net_change ?? 0) >= 0 ? '+' : ''}{data.follower_growth?.net_change ?? 0}
            </div>
            <div style={{ fontSize: '0.65rem', color: T.textMuted, textTransform: 'uppercase' }}>Net Change</div>
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: T.accent }}>{data.follower_growth?.growth_rate ?? 0}%</div>
            <div style={{ fontSize: '0.65rem', color: T.textMuted, textTransform: 'uppercase' }}>Growth Rate</div>
          </div>
        </div>
        <MiniLineChart data={data.follower_growth?.series || []} color="#8b5cf6" height={130} />
      </Card>

      {/* ═══ PRO-ONLY SECTIONS ═══ */}

      {/* AI Recommendations */}
      <ProGate isPro={isPro} title="AI-Powered Recommendations">
        <Card style={{ marginBottom: 20, borderLeft: `3px solid ${T.gold}` }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: T.text, marginBottom: 14 }}>
            <i className="fas fa-robot" style={{ color: T.gold, marginRight: 8 }} />AI Recommendations
          </h3>
          {Array.isArray(aiSummary.recommendations) && aiSummary.recommendations.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {aiSummary.recommendations.map((rec, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 14px', borderRadius: 10, background: T.bgHighlight }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: (insightColors[rec.type] || T.accent) + '18',
                  }}>
                    <i className={`fas fa-${insightIcons[rec.type] || 'lightbulb'}`} style={{ color: insightColors[rec.type] || T.accent, fontSize: 13 }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: T.text }}>{rec.title}</span>
                      <span style={{ fontSize: '0.58rem', fontWeight: 700, padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase',
                        background: (priorityColors[rec.priority] || T.accent) + '18', color: priorityColors[rec.priority] || T.accent,
                      }}>{rec.priority}</span>
                    </div>
                    <div style={{ fontSize: '0.76rem', color: T.textSub, lineHeight: 1.6 }}>{rec.body}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: T.textMuted, fontSize: '0.8rem', margin: 0 }}>AI recommendations are being generated...</p>
          )}
        </Card>
      </ProGate>

      {/* AI Insights */}
      <ProGate isPro={isPro} title="AI-Powered Insights">
        <Card style={{ marginBottom: 20, borderLeft: `3px solid ${T.accent}` }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: T.text, marginBottom: 14 }}>
            <i className="fas fa-lightbulb" style={{ color: T.accent, marginRight: 8 }} />Quick Insights
          </h3>
          {Array.isArray(data.ai_insights) && data.ai_insights.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
              {data.ai_insights.map((insight, i) => (
                <div key={i} style={{ padding: '12px 14px', borderRadius: 10, background: (insightColors[insight.type] || T.accent) + '08', border: `1px solid ${(insightColors[insight.type] || T.accent)}15` }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: insightColors[insight.type] || T.accent, marginBottom: 4 }}>
                    <i className={`fas fa-${insightIcons[insight.type] || 'lightbulb'}`} style={{ marginRight: 6, fontSize: 11 }} />
                    {insight.title}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: T.textSub, lineHeight: 1.5 }}>{insight.body}</div>
                </div>
              ))}
            </div>
          ) : <p style={{ color: T.textMuted, fontSize: '0.8rem', margin: 0 }}>Generating insights...</p>}
        </Card>
      </ProGate>

      {/* Growth Prediction + Best Posting Times */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 20 }}>
        {/* Growth Prediction */}
        <div>
          <ProGate isPro={isPro} title="Growth Prediction">
            <Card>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: T.text, marginBottom: 14 }}>
                <i className="fas fa-crystal-ball" style={{ color: '#8b5cf6', marginRight: 8 }} />Growth Prediction
              </h3>
              {data.growth_prediction ? (() => {
                const gp = data.growth_prediction
                const trendIcons = { growing: 'arrow-trend-up', declining: 'arrow-trend-down', stable: 'minus' }
                const trendColors = { growing: T.green, declining: '#ef4444', stable: T.textMuted }
                return (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: '8px 12px', borderRadius: 8, background: (trendColors[gp.trend] || T.accent) + '12' }}>
                      <i className={`fas fa-${trendIcons[gp.trend] || 'minus'}`} style={{ color: trendColors[gp.trend], fontSize: 14 }} />
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: trendColors[gp.trend], textTransform: 'capitalize' }}>{gp.trend}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 20, marginBottom: 14 }}>
                      <div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: T.accent }}>{(gp.predicted_plays_next_week || 0).toLocaleString()}</div>
                        <div style={{ fontSize: '0.65rem', color: T.textMuted, textTransform: 'uppercase' }}>Predicted Plays</div>
                        <div style={{ fontSize: '0.62rem', color: T.textMuted }}>next week</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: '#8b5cf6' }}>+{gp.predicted_followers_next_week || 0}</div>
                        <div style={{ fontSize: '0.65rem', color: T.textMuted, textTransform: 'uppercase' }}>Predicted Followers</div>
                        <div style={{ fontSize: '0.62rem', color: T.textMuted }}>next week</div>
                      </div>
                    </div>
                    {Array.isArray(gp.weekly_plays_history) && gp.weekly_plays_history.length > 0 && (
                      <div>
                        <div style={{ fontSize: '0.7rem', color: T.textMuted, marginBottom: 6 }}>Weekly play trend</div>
                        <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 40 }}>
                          {gp.weekly_plays_history.map((v, i) => {
                            const max = Math.max(...gp.weekly_plays_history, 1)
                            return <div key={i} style={{ flex: 1, height: `${(v / max) * 100}%`, background: T.accent, borderRadius: 3, minHeight: 2 }} title={`Week ${i + 1}: ${v}`} />
                          })}
                          <div style={{ flex: 1, height: `${(gp.predicted_plays_next_week / Math.max(...gp.weekly_plays_history, gp.predicted_plays_next_week, 1)) * 100}%`, background: T.accent + '40', borderRadius: 3, minHeight: 2, border: `1px dashed ${T.accent}` }} title={`Predicted: ${gp.predicted_plays_next_week}`} />
                        </div>
                        <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                          {['W1', 'W2', 'W3', 'W4', 'Next'].map((l, i) => (
                            <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: '0.58rem', color: i === 4 ? T.accent : T.textMuted }}>{l}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })() : <p style={{ color: T.textMuted, fontSize: '0.8rem', margin: 0 }}>Not enough data</p>}
            </Card>
          </ProGate>
        </div>

        {/* Best Posting Times */}
        <div>
          <ProGate isPro={isPro} title="Best Posting Times">
            <Card>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: T.text, marginBottom: 14 }}>
                <i className="fas fa-clock" style={{ color: '#f59e0b', marginRight: 8 }} />Best Times to Post
              </h3>
              {data.best_posting_times ? (() => {
                const bt = data.best_posting_times
                const topHours = (bt.hours || []).slice(0, 5)
                const maxH = topHours[0]?.plays || 1

                // Build all 7 days, filling zeros for missing
                const rawDays = bt.days || []
                const allDays = [1,2,3,4,5,6,7].map(d => {
                  const found = rawDays.find(r => r.day === d)
                  return { day: d, plays: found?.plays || 0 }
                })
                const maxD = Math.max(...allDays.map(d => d.plays), 1)

                return (
                  <div>
                    {/* Peak Hours */}
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: T.textMuted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Peak Hours</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                      {topHours.map((h, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{
                            fontSize: '0.75rem', fontWeight: 600, width: 48,
                            color: i === 0 ? '#f59e0b' : T.textSub, fontVariantNumeric: 'tabular-nums',
                          }}>
                            {String(h.hour).padStart(2, '0')}:00
                          </span>
                          <div style={{ flex: 1, height: 10, borderRadius: 5, background: T.bgHighlight, overflow: 'hidden' }}>
                            <div style={{
                              width: `${Math.max(4, (h.plays / maxH) * 100)}%`, height: '100%', borderRadius: 5,
                              background: i === 0 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : T.accent,
                              transition: 'width 0.4s ease',
                            }} />
                          </div>
                          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: i === 0 ? '#f59e0b' : T.textMuted, width: 36, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{h.plays}</span>
                        </div>
                      ))}
                    </div>

                    {/* Peak Days */}
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: T.textMuted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Peak Days</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {allDays.map((d, i) => {
                        const isBest = d.plays === maxD && d.plays > 0
                        const pct = d.plays > 0 ? Math.max(10, (d.plays / maxD) * 100) : 6
                        return (
                          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontSize: '0.6rem', color: isBest ? '#f59e0b' : T.textMuted, fontWeight: 600, fontVariantNumeric: 'tabular-nums', minHeight: 14 }}>
                              {d.plays > 0 ? d.plays : ''}
                            </span>
                            <div style={{ width: '100%', background: T.bgHighlight, borderRadius: 4, overflow: 'hidden', height: 48, display: 'flex', alignItems: 'flex-end' }}>
                              <div style={{
                                width: '100%', height: `${pct}%`, borderRadius: 4,
                                background: d.plays === 0 ? 'transparent' : (isBest ? 'linear-gradient(180deg, #f59e0b, #d97706)' : T.accent),
                                transition: 'height 0.4s ease',
                              }} />
                            </div>
                            <span style={{
                              fontSize: '0.62rem', fontWeight: isBest ? 700 : 500,
                              color: isBest ? '#f59e0b' : T.textMuted,
                            }}>{dayNames[d.day]}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })() : <p style={{ color: T.textMuted, fontSize: '0.8rem', margin: 0 }}>Not enough data</p>}
            </Card>
          </ProGate>
        </div>
      </div>

      {/* Listener Retention + Play Duration Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 20 }}>
        <div>
          <ProGate isPro={isPro} title="Listener Retention">
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: T.text, margin: 0 }}>
                  <i className="fas fa-redo" style={{ color: T.accent, marginRight: 8 }} />Listener Retention
                </h3>
                <ExportBtn section="retention" label="retention" />
              </div>
              {data.listener_retention?.overall_avg != null && (
                <div style={{ marginBottom: 14 }}>
                  <span style={{ fontSize: 28, fontWeight: 700, color: T.text }}>{data.listener_retention.overall_avg}%</span>
                  <span style={{ fontSize: '0.72rem', color: T.textMuted, marginLeft: 8 }}>avg completion</span>
                </div>
              )}
              <MiniBarChart
                items={(data.listener_retention?.tracks || []).map(t => ({
                  label: t.title, value: t.completion_rate,
                  color: t.completion_rate >= 70 ? T.green : t.completion_rate >= 40 ? '#f59e0b' : '#ef4444',
                }))}
                maxItems={8}
              />
            </Card>
          </ProGate>
        </div>

        {/* Play Duration Distribution */}
        <div>
          <ProGate isPro={isPro} title="Listen Duration">
            <Card>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: T.text, marginBottom: 14 }}>
                <i className="fas fa-hourglass-half" style={{ color: '#3b82f6', marginRight: 8 }} />Listen Duration
              </h3>
              {(data.play_duration_distribution || []).length > 0 ? (() => {
                const dist = data.play_duration_distribution
                const total = dist.reduce((s, d) => s + d.count, 0) || 1
                const colors = ['#ef4444', '#f59e0b', '#3b82f6', T.accent, T.green]
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {dist.map((d, i) => {
                      const pct = ((d.count / total) * 100).toFixed(1)
                      return (
                        <div key={i}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, fontSize: '0.72rem' }}>
                            <span style={{ color: T.textSub }}>{d.bucket}</span>
                            <span style={{ color: T.textMuted }}>{pct}%</span>
                          </div>
                          <div style={{ height: 8, borderRadius: 4, background: T.bgHighlight, overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', borderRadius: 4, background: colors[i] || T.accent, transition: 'width 0.5s ease' }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })() : <p style={{ color: T.textMuted, fontSize: '0.8rem', margin: 0 }}>No data yet</p>}
            </Card>
          </ProGate>
        </div>
      </div>

      {/* Audience Insights */}
      <div style={{ marginBottom: 20 }}>
        <ProGate isPro={isPro} title="Audience Insights">
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: T.text, margin: 0 }}>
                <i className="fas fa-globe" style={{ color: '#3b82f6', marginRight: 8 }} />Audience Insights
              </h3>
              <ExportBtn section="audience" label="audience" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: T.textSub, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Play Sources</div>
                {(() => {
                  const sources = data.audience_insights?.sources || []
                  const total = sources.reduce((s, r) => s + r.count, 0) || 1
                  const colors = ['#63b388', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
                  const segments = sources.map((s, i) => ({ ...s, color: colors[i % colors.length], pct: ((s.count / total) * 100).toFixed(1) }))
                  const gradient = segments.length > 0 ? segments.map((s, i) => {
                    const start = segments.slice(0, i).reduce((a, x) => a + parseFloat(x.pct), 0)
                    return `${s.color} ${start}% ${start + parseFloat(s.pct)}%`
                  }).join(', ') : `${T.bgHighlight} 0% 100%`
                  return (
                    <div>
                      <div style={{ width: 110, height: 110, borderRadius: '50%', margin: '0 auto 12px', background: `conic-gradient(${gradient})`, boxShadow: `inset 0 0 0 26px ${T.bgCard}` }} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {segments.map((s, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.68rem' }}>
                            <div style={{ width: 7, height: 7, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                            <span style={{ color: T.textSub, flex: 1, textTransform: 'capitalize' }}>{s.source}</span>
                            <span style={{ color: T.textMuted }}>{s.pct}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: T.textSub, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Listener Loyalty</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: T.text }}>{(data.audience_insights?.unique_listeners || 0).toLocaleString()}</div>
                    <div style={{ fontSize: '0.68rem', color: T.textMuted }}>Unique Listeners</div>
                  </div>
                  {(() => {
                    const newL = data.audience_insights?.new_listeners || 0
                    const retL = data.audience_insights?.returning_listeners || 0
                    const total = newL + retL || 1
                    return (
                      <div>
                        <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', background: T.bgHighlight, marginBottom: 8 }}>
                          <div style={{ width: `${(newL / total) * 100}%`, background: T.accent }} />
                          <div style={{ width: `${(retL / total) * 100}%`, background: '#8b5cf6' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem' }}>
                          <span style={{ color: T.accent }}><span style={{ fontWeight: 700 }}>{newL}</span> New</span>
                          <span style={{ color: '#8b5cf6' }}><span style={{ fontWeight: 700 }}>{retL}</span> Returning</span>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </div>
            </div>
          </Card>
        </ProGate>
      </div>

      {/* Track Comparison */}
      <div style={{ marginBottom: 20 }}>
        <ProGate isPro={isPro} title="Track Comparison">
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: T.text, margin: 0 }}>
                <i className="fas fa-table" style={{ color: T.accent, marginRight: 8 }} />Track Comparison
              </h3>
              <ExportBtn section="comparison" label="comparison" />
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.73rem' }}>
                <thead>
                  <tr>
                    {[
                      { key: 'title', label: 'Track' }, { key: 'plays', label: 'Plays' },
                      { key: 'likes', label: 'Likes' }, { key: 'comments', label: 'Comments' },
                      { key: 'retention', label: 'Retention' }, { key: 'engagement_rate', label: 'Engage' },
                      { key: 'trending_score', label: 'Trend' },
                    ].map(col => (
                      <th key={col.key} onClick={() => col.key !== 'title' && handleSort(col.key)} style={{
                        padding: '8px 5px', textAlign: col.key === 'title' ? 'left' : 'right',
                        color: sortCol === col.key ? T.accent : T.textMuted, cursor: col.key !== 'title' ? 'pointer' : 'default',
                        borderBottom: `1px solid ${T.border}`, fontWeight: 600, whiteSpace: 'nowrap',
                        textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.62rem',
                      }}>
                        {col.label}{sortCol === col.key && <i className={`fas fa-sort-${sortDir === 'desc' ? 'down' : 'up'}`} style={{ marginLeft: 3, fontSize: 8 }} />}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparison.slice(0, 15).map(t => (
                    <tr key={t.id}>
                      <td style={{ padding: '7px 5px', color: T.text, fontWeight: 500, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</td>
                      <td style={{ padding: '7px 5px', textAlign: 'right', color: T.textSub }}>{t.plays?.toLocaleString()}</td>
                      <td style={{ padding: '7px 5px', textAlign: 'right', color: T.textSub }}>{t.likes}</td>
                      <td style={{ padding: '7px 5px', textAlign: 'right', color: T.textSub }}>{t.comments}</td>
                      <td style={{ padding: '7px 5px', textAlign: 'right', color: t.retention != null ? (t.retention >= 70 ? T.green : t.retention >= 40 ? '#f59e0b' : '#ef4444') : T.textMuted }}>{t.retention != null ? `${t.retention}%` : '—'}</td>
                      <td style={{ padding: '7px 5px', textAlign: 'right', color: T.textSub }}>{t.engagement_rate}%</td>
                      <td style={{ padding: '7px 5px', textAlign: 'right', color: T.gold }}>{Math.round(t.trending_score)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </ProGate>
      </div>

      {/* Engagement + Revenue side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 20 }}>
        <div>
          <ProGate isPro={isPro} title="Engagement Analytics">
            <Card>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: T.text, marginBottom: 12 }}>
                <i className="fas fa-fire" style={{ color: '#f59e0b', marginRight: 8 }} />Engagement Rate
              </h3>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 34, fontWeight: 700, color: T.text }}>{data.engagement_rate?.overall ?? 0}%</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: T.textMuted }}>
                {(data.engagement_rate?.total_engagement ?? 0).toLocaleString()} actions from {(data.engagement_rate?.total_plays ?? 0).toLocaleString()} plays
              </div>
            </Card>
          </ProGate>
        </div>

      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION: Audience
   ═══════════════════════════════════════════════════════════════════════════ */
function AudienceSection() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30d')

  useEffect(() => {
    setLoading(true)
    artistApi.getAudience(period)
      .then(d => { setData(d); setLoading(false) })
      .catch(() => {
        setData({ total_followers: 0, new_followers: 0, follower_series: [], total_plays: 0, unique_listeners: 0, new_listeners: 0, returning_listeners: 0, repeat_listeners: 0, repeat_rate: 0, plays_per_listener: 0, sources: [], top_fans: [], top_likers: [], heatmap: [], track_listeners: [], recent_followers: [], is_pro: false, period })
        setLoading(false)
      })
  }, [period])

  if (loading) return <Spinner />
  if (!data) return <Card><p style={{ color: T.textMuted }}>Unable to load audience data.</p></Card>

  const isPro = data.is_pro
  const aiAnalysis = data.ai_analysis || {}
  const periods = [{ key: '7d', label: '7 Days' }, { key: '30d', label: '30 Days' }, { key: '90d', label: '90 Days' }, { key: 'all', label: 'All Time' }]
  const dayNames = ['', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const insightIcons = { fans: 'heart', growth: 'chart-line', retention: 'redo', discovery: 'compass', engagement: 'bolt' }
  const insightColors = { fans: T.gold, growth: T.accent, retention: T.accent, discovery: T.gold, engagement: T.accent }
  const priorityColors = { high: '#ef4444', medium: '#f59e0b', low: T.accent }

  // Build heatmap grid
  const heatmapMax = Math.max(...(data.heatmap || []).map(h => h.count), 1)
  const heatmapGrid = {}
  ;(data.heatmap || []).forEach(h => { heatmapGrid[`${h.day}-${h.hour}`] = h.count })

  const fmtTime = (str) => {
    if (!str) return ''
    const d = new Date(str)
    const diff = Math.floor((Date.now() - d) / 1000)
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
    return d.toLocaleDateString()
  }

  // Softer accent palette for audience page
  const A = { purple: 'rgba(139,92,246,0.7)', purpleBg: 'rgba(139,92,246,0.06)', green: T.accent, rose: 'rgba(236,72,153,0.7)', roseBg: 'rgba(236,72,153,0.06)' }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: T.text, margin: 0 }}>
          <i className="fas fa-users" style={{ color: A.purple, marginRight: 8, fontSize: 14 }} />Audience
        </h2>
        <div style={{ display: 'flex', gap: 3, background: T.bgCard, borderRadius: 10, padding: 3, border: `1px solid ${T.border}` }}>
          {periods.map(p => (
            <button key={p.key} onClick={() => setPeriod(p.key)} style={{
              padding: '6px 14px', borderRadius: 7, border: 'none', cursor: 'pointer',
              fontSize: '0.73rem', fontWeight: 600, transition: 'all 0.15s', fontFamily: 'inherit',
              background: period === p.key ? T.accent : 'transparent',
              color: period === p.key ? '#fff' : T.textMuted,
            }}>{p.label}</button>
          ))}
        </div>
      </div>

      {/* AI Audience Score (Pro) */}
      {isPro && aiAnalysis.score > 0 && (
        <Card style={{ marginBottom: 24, background: `linear-gradient(135deg, ${T.bgCard}, ${T.bgHighlight})` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: 76, height: 76, flexShrink: 0 }}>
              <svg viewBox="0 0 76 76" style={{ width: 76, height: 76, transform: 'rotate(-90deg)' }}>
                <circle cx="38" cy="38" r="32" fill="none" stroke={T.bgHighlight} strokeWidth="5" />
                <circle cx="38" cy="38" r="32" fill="none"
                  stroke={aiAnalysis.score >= 70 ? T.accent : aiAnalysis.score >= 40 ? T.gold : '#ef4444'}
                  strokeWidth="5" strokeLinecap="round"
                  strokeDasharray={`${(aiAnalysis.score / 100) * 201} 201`} />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: T.text }}>{aiAnalysis.score}</span>
                <span style={{ fontSize: '0.52rem', color: T.textMuted, fontWeight: 600 }}>{aiAnalysis.grade || ''}</span>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                <i className="fas fa-robot" style={{ color: T.gold, fontSize: 12 }} />
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: T.gold, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Audience Health Score</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: T.textSub, margin: 0, lineHeight: 1.6 }}>{aiAnalysis.summary}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Key Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Followers', value: data.total_followers, icon: 'users', color: T.accent },
          { label: 'New Followers', value: data.new_followers, icon: 'user-plus', color: T.accent },
          { label: 'Unique Listeners', value: data.unique_listeners, icon: 'headphones', color: T.gold },
          { label: 'Plays / Listener', value: data.plays_per_listener, icon: 'play', color: T.gold },
          { label: 'Repeat Rate', value: `${data.repeat_rate}%`, icon: 'redo', color: T.accent },
        ].map((s, i) => (
          <Card key={i} style={{ padding: '16px 18px' }}>
            <div style={{ fontSize: '0.63rem', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: T.text, lineHeight: 1 }}>{typeof s.value === 'number' ? s.value.toLocaleString() : s.value}</div>
          </Card>
        ))}
      </div>

      {/* Listener Loyalty */}
      <Card style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: '0.82rem', fontWeight: 600, color: T.text, marginBottom: 16 }}>Listener Loyalty</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
          <div>
            {(() => {
              const newL = data.new_listeners || 0, retL = data.returning_listeners || 0, total = newL + retL || 1
              return (
                <div>
                  <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', background: T.bgHighlight, marginBottom: 14 }}>
                    <div style={{ width: `${(newL / total) * 100}%`, background: T.accent, transition: 'width 0.5s ease' }} />
                    <div style={{ width: `${(retL / total) * 100}%`, background: T.gold, transition: 'width 0.5s ease' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.accent }} />
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{newL.toLocaleString()}</div>
                        <div style={{ fontSize: '0.62rem', color: T.textMuted }}>New</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.gold }} />
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{retL.toLocaleString()}</div>
                        <div style={{ fontSize: '0.62rem', color: T.textMuted }}>Returning</div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: T.textSub, marginBottom: 6, lineHeight: 1.5 }}>
              Listeners who come back to play your content again
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 28, fontWeight: 700, color: T.text }}>{data.repeat_rate}%</span>
              <span style={{ fontSize: '0.72rem', color: T.textMuted }}>repeat rate</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: T.textMuted, marginTop: 4 }}>
              {data.repeat_listeners} of {data.unique_listeners} listeners
            </div>
          </div>
        </div>
      </Card>

      {/* Follower Growth */}
      <Card style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: '0.82rem', fontWeight: 600, color: T.text, marginBottom: 14 }}>Follower Growth</h3>
        <MiniLineChart data={data.follower_series || []} color={T.accent} height={150} />
      </Card>

      {/* Top Fans + Engaged Fans */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 24 }}>
        <Card>
          <h3 style={{ fontSize: '0.82rem', fontWeight: 600, color: T.text, marginBottom: 16 }}>Top Fans</h3>
          {(data.top_fans || []).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {data.top_fans.slice(0, 8).map((fan, i) => (
                <div key={fan.id} onClick={() => navigate(`/users/${fan.id}`)} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                  borderRadius: 10, cursor: 'pointer', transition: 'background 0.15s',
                }}>
                  <span style={{ fontSize: '0.68rem', color: T.textMuted, width: 14, fontWeight: 600, textAlign: 'center' }}>{i + 1}</span>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', background: T.bgHighlight, flexShrink: 0, overflow: 'hidden',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {fan.avatar_url ? <img src={fan.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: '0.7rem', fontWeight: 600, color: T.textMuted }}>{(fan.name || '?')[0]}</span>}
                  </div>
                  <span style={{ flex: 1, fontSize: '0.8rem', fontWeight: 500, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fan.name}</span>
                  <span style={{ fontSize: '0.68rem', color: T.textMuted, fontVariantNumeric: 'tabular-nums' }}>{fan.plays}</span>
                </div>
              ))}
            </div>
          ) : <p style={{ color: T.textMuted, fontSize: '0.78rem', margin: 0 }}>No data yet</p>}
        </Card>

        <Card>
          <h3 style={{ fontSize: '0.82rem', fontWeight: 600, color: T.text, marginBottom: 16 }}>Most Engaged</h3>
          {(data.top_likers || []).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {data.top_likers.slice(0, 8).map((fan, i) => (
                <div key={fan.id} onClick={() => navigate(`/users/${fan.id}`)} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                  borderRadius: 10, cursor: 'pointer', transition: 'background 0.15s',
                }}>
                  <span style={{ fontSize: '0.68rem', color: T.textMuted, width: 14, fontWeight: 600, textAlign: 'center' }}>{i + 1}</span>
                  <span style={{ flex: 1, fontSize: '0.8rem', fontWeight: 500, color: T.text }}>{fan.name}</span>
                  <span style={{ fontSize: '0.68rem', color: T.gold, fontWeight: 600 }}>{fan.likes} likes</span>
                </div>
              ))}
            </div>
          ) : <p style={{ color: T.textMuted, fontSize: '0.78rem', margin: 0 }}>No data yet</p>}
        </Card>
      </div>

      {/* Discovery Sources */}
      <Card style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: '0.82rem', fontWeight: 600, color: T.text, marginBottom: 16 }}>How Listeners Find You</h3>
        {(data.sources || []).length > 0 ? (() => {
          const total = data.sources.reduce((s, r) => s + r.count, 0) || 1
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.sources.map((s, i) => {
                const pct = ((s.count / total) * 100)
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: '0.75rem', color: T.text, fontWeight: 500, width: 90, textTransform: 'capitalize' }}>{s.source}</span>
                    <div style={{ flex: 1, height: 8, borderRadius: 4, background: T.bgHighlight, overflow: 'hidden' }}>
                      <div style={{ width: `${Math.max(3, pct)}%`, height: '100%', borderRadius: 4, background: T.accent, opacity: 0.7 + (pct / 200), transition: 'width 0.5s ease' }} />
                    </div>
                    <span style={{ fontSize: '0.7rem', color: T.textMuted, width: 50, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{pct.toFixed(1)}%</span>
                  </div>
                )
              })}
            </div>
          )
        })() : <p style={{ color: T.textMuted, fontSize: '0.78rem', margin: 0 }}>No data yet</p>}
      </Card>

      {/* Track Reach */}
      <Card style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: '0.82rem', fontWeight: 600, color: T.text, marginBottom: 16 }}>Track Reach</h3>
        {(data.track_listeners || []).length > 0 ? (() => {
          const maxL = data.track_listeners[0]?.unique_listeners || 1
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.track_listeners.map((t, i) => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '0.75rem', color: T.text, fontWeight: 500, minWidth: 120, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                  <div style={{ flex: 1, height: 8, borderRadius: 4, background: T.bgHighlight, overflow: 'hidden' }}>
                    <div style={{ width: `${(t.unique_listeners / maxL) * 100}%`, height: '100%', borderRadius: 4, background: T.gold, opacity: 0.75, transition: 'width 0.5s ease' }} />
                  </div>
                  <span style={{ fontSize: '0.68rem', color: T.textMuted, minWidth: 55, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{t.unique_listeners}</span>
                </div>
              ))}
            </div>
          )
        })() : <p style={{ color: T.textMuted, fontSize: '0.78rem', margin: 0 }}>No data yet</p>}
      </Card>

      {/* Activity Heatmap (Pro) */}
      {isPro ? (
        <Card style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: '0.82rem', fontWeight: 600, color: T.text, marginBottom: 16 }}>Listener Activity</h3>
          <div style={{ overflowX: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '36px repeat(24, 1fr)', gap: 2, minWidth: 580 }}>
              <div />
              {Array.from({ length: 24 }, (_, h) => (
                <div key={h} style={{ fontSize: '0.5rem', color: T.textMuted, textAlign: 'center', paddingBottom: 3 }}>
                  {h % 3 === 0 ? `${String(h).padStart(2, '0')}` : ''}
                </div>
              ))}
              {[1, 2, 3, 4, 5, 6, 7].map(day => (
                <div key={day} style={{ display: 'contents' }}>
                  <div style={{ fontSize: '0.6rem', color: T.textMuted, display: 'flex', alignItems: 'center' }}>{dayNames[day]}</div>
                  {Array.from({ length: 24 }, (_, hour) => {
                    const val = heatmapGrid[`${day}-${hour}`] || 0
                    const intensity = heatmapMax > 0 ? val / heatmapMax : 0
                    return (
                      <div key={`${day}-${hour}`} title={`${dayNames[day]} ${String(hour).padStart(2, '0')}:00 — ${val} plays`} style={{
                        height: 13, borderRadius: 2.5,
                        background: val === 0 ? 'rgba(255,255,255,0.02)' : `rgba(45,155,110,${0.12 + intensity * 0.65})`,
                      }} />
                    )
                  })}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 10, justifyContent: 'flex-end' }}>
              <span style={{ fontSize: '0.58rem', color: T.textMuted }}>Less</span>
              {[0.08, 0.2, 0.4, 0.6, 0.8].map((o, i) => (
                <div key={i} style={{ width: 11, height: 11, borderRadius: 2.5, background: `rgba(45,155,110,${o})` }} />
              ))}
              <span style={{ fontSize: '0.58rem', color: T.textMuted }}>More</span>
            </div>
          </div>
        </Card>
      ) : (
        <Card style={{ marginBottom: 24, textAlign: 'center', padding: '32px 20px' }}>
          <i className="fas fa-th" style={{ fontSize: 24, color: T.textMuted, marginBottom: 10 }} />
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: T.text, marginBottom: 4 }}>Activity Heatmap</div>
          <div style={{ fontSize: '0.75rem', color: T.textMuted, marginBottom: 14 }}>See when your audience listens most</div>
          <Btn variant="gold" style={{ fontSize: '0.75rem', padding: '7px 18px' }} onClick={() => navigate('/pricing')}>
            Upgrade to Artist Pro
          </Btn>
        </Card>
      )}

      {/* AI Growth Strategies (Pro) */}
      {isPro && Array.isArray(aiAnalysis.strategies) && aiAnalysis.strategies.length > 0 ? (
        <Card style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: '0.82rem', fontWeight: 600, color: T.text, marginBottom: 16 }}>
            <i className="fas fa-robot" style={{ color: T.gold, marginRight: 8, fontSize: 12 }} />AI Growth Strategies
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {aiAnalysis.strategies.map((rec, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '14px 16px', borderRadius: 10, background: T.bgHighlight }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: (insightColors[rec.type] || T.accent) + '15',
                }}>
                  <i className={`fas fa-${insightIcons[rec.type] || 'lightbulb'}`} style={{ color: insightColors[rec.type] || T.accent, fontSize: 12 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: T.text }}>{rec.title}</span>
                    <span style={{ fontSize: '0.55rem', fontWeight: 700, padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.03em',
                      background: (priorityColors[rec.priority] || T.accent) + '15', color: priorityColors[rec.priority] || T.accent,
                    }}>{rec.priority}</span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: T.textSub, lineHeight: 1.6 }}>{rec.body}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {/* AI Quick Insights (Pro) */}
      {isPro && Array.isArray(data.ai_insights) && data.ai_insights.length > 0 ? (
        <Card style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: '0.82rem', fontWeight: 600, color: T.text, marginBottom: 16 }}>Quick Insights</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 10 }}>
            {data.ai_insights.map((insight, i) => (
              <div key={i} style={{ padding: '14px 16px', borderRadius: 10, background: T.bgHighlight }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 600, color: T.text, marginBottom: 4 }}>
                  <i className={`fas fa-${insightIcons[insight.type] || 'lightbulb'}`} style={{ marginRight: 6, fontSize: 10, color: insightColors[insight.type] || T.accent }} />
                  {insight.title}
                </div>
                <div style={{ fontSize: '0.72rem', color: T.textSub, lineHeight: 1.6 }}>{insight.body}</div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {/* Upgrade prompt for non-Pro */}
      {!isPro && (
        <Card style={{ marginBottom: 24, textAlign: 'center', padding: '32px 20px' }}>
          <i className="fas fa-robot" style={{ fontSize: 22, color: T.textMuted, marginBottom: 10 }} />
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: T.text, marginBottom: 4 }}>AI Audience Intelligence</div>
          <div style={{ fontSize: '0.75rem', color: T.textMuted, marginBottom: 14, maxWidth: 320, margin: '0 auto 14px' }}>Get AI-powered audience health scores, growth strategies, and engagement insights</div>
          <Btn variant="gold" style={{ fontSize: '0.75rem', padding: '7px 18px' }} onClick={() => navigate('/pricing')}>
            Upgrade to Artist Pro
          </Btn>
        </Card>
      )}

      {/* Recent Followers */}
      <Card>
        <h3 style={{ fontSize: '0.82rem', fontWeight: 600, color: T.text, marginBottom: 16 }}>Recent Followers</h3>
        {(data.recent_followers || []).length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {data.recent_followers.slice(0, 12).map((f, i) => (
              <div key={f.id} onClick={() => navigate(`/users/${f.id}`)} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px',
                borderRadius: 10, cursor: 'pointer', transition: 'background 0.15s',
              }}>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%', background: T.bgHighlight, flexShrink: 0, overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {f.avatar_url ? <img src={f.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: '0.68rem', fontWeight: 600, color: T.textMuted }}>{(f.name || '?')[0]}</span>}
                </div>
                <span style={{ flex: 1, fontSize: '0.8rem', fontWeight: 500, color: T.text }}>{f.name}</span>
                <span style={{ fontSize: '0.65rem', color: T.textMuted }}>{fmtTime(f.followed_at)}</span>
              </div>
            ))}
          </div>
        ) : <p style={{ color: T.textMuted, fontSize: '0.78rem', margin: 0 }}>No followers yet</p>}
      </Card>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION: Profile Editor
   ═══════════════════════════════════════════════════════════════════════════ */
function ProfileSection() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [previewData, setPreviewData] = useState(null)
  const [showPreview, setShowPreview] = useState(false)
  const [tracks, setTracks] = useState([])
  const avatarRef = useRef(null)
  const headerRef = useRef(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [headerPreview, setHeaderPreview] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)
  const [headerFile, setHeaderFile] = useState(null)

  useEffect(() => {
    artistApi.getProfile()
      .then(d => {
        const p = d.profile || d
        setProfile({
          display_name: p.display_name || '',
          tagline: p.tagline || '',
          bio: p.bio || '',
          bio_long: p.bio_long || '',
          creator_types: Array.isArray(p.creator_types) ? p.creator_types : [],
          languages: Array.isArray(p.languages) ? p.languages : [],
          location_city: p.location_city || '',
          location_country: p.location_country || '',
          accent_color: p.accent_color || '#63b388',
          content_tags: Array.isArray(p.content_tags) ? p.content_tags.join(', ') : (p.content_tags || ''),
          featured_track_ids: Array.isArray(p.featured_track_ids) ? p.featured_track_ids : [],
          social_links: p.social_links || {},
          avatar_url: p.avatar_url || '',
          header_url: p.header_url || '',
        })
        setLoading(false)
      })
      .catch(() => { toast.error('Failed to load profile'); setLoading(false) })

    artistApi.getTracks({ status: 'approved', per_page: 50 })
      .then(d => setTracks(d.tracks?.data || []))
      .catch(() => {})
  }, [])

  const handleChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }))
  }

  const handleSocialChange = (key, value) => {
    setProfile(prev => ({ ...prev, social_links: { ...prev.social_links, [key]: value } }))
  }

  const [removeAvatar, setRemoveAvatar] = useState(false)
  const [removeHeader, setRemoveHeader] = useState(false)

  const handleAvatarSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
    setRemoveAvatar(false)
  }

  const handleHeaderSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setHeaderFile(file)
    setHeaderPreview(URL.createObjectURL(file))
    setRemoveHeader(false)
  }

  const handleAvatarRemove = () => {
    setAvatarFile(null)
    setAvatarPreview(null)
    setRemoveAvatar(true)
  }

  const handleHeaderRemove = () => {
    setHeaderFile(null)
    setHeaderPreview(null)
    setRemoveHeader(true)
  }

  const handleFeaturedToggle = (trackId) => {
    setProfile(prev => {
      const ids = prev.featured_track_ids || []
      if (ids.includes(trackId)) {
        return { ...prev, featured_track_ids: ids.filter(id => id !== trackId) }
      }
      if (ids.length >= 5) { toast.error('Maximum 5 featured tracks'); return prev }
      return { ...prev, featured_track_ids: [...ids, trackId] }
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('display_name', profile.display_name)
      fd.append('tagline', profile.tagline)
      fd.append('bio', profile.bio)
      fd.append('bio_long', profile.bio_long)
      fd.append('location_city', profile.location_city)
      fd.append('location_country', profile.location_country)
      fd.append('accent_color', profile.accent_color)

      const tags = typeof profile.content_tags === 'string'
        ? profile.content_tags.split(',').map(t => t.trim()).filter(Boolean)
        : profile.content_tags
      fd.append('content_tags', JSON.stringify(tags))
      fd.append('creator_types', JSON.stringify(profile.creator_types))
      fd.append('languages', JSON.stringify(profile.languages))
      fd.append('featured_track_ids', JSON.stringify(profile.featured_track_ids))
      fd.append('social_links', JSON.stringify(profile.social_links))

      if (avatarFile) fd.append('avatar', avatarFile)
      if (headerFile) fd.append('header', headerFile)
      if (removeAvatar) fd.append('remove_avatar', '1')
      if (removeHeader) fd.append('remove_header', '1')

      const result = await artistApi.updateProfile(fd)
      // Update local profile with server response
      const updated = result.profile || result
      if (updated) {
        setProfile(prev => ({ ...prev, ...updated, avatar_url: updated.avatar_url ?? null, header_url: updated.header_url ?? null }))
        // Sync to localStorage so Settings page stays in sync
        try {
          const stored = JSON.parse(localStorage.getItem('user') || '{}')
          const synced = { ...stored, name: updated.display_name || stored.name, bio: updated.bio || '', avatar_url: updated.avatar_url ?? null, header_url: updated.header_url ?? null }
          localStorage.setItem('user', JSON.stringify(synced))
        } catch {}
      }
      toast.success('Profile updated!')
      setAvatarFile(null)
      setHeaderFile(null)
      setAvatarPreview(null)
      setHeaderPreview(null)
      setRemoveAvatar(false)
      setRemoveHeader(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile')
    }
    setSaving(false)
  }

  const handlePreview = async () => {
    try {
      const d = await artistApi.getProfilePreview()
      setPreviewData(d)
      setShowPreview(true)
    } catch {
      toast.error('Failed to load preview')
    }
  }

  if (loading) return <Spinner />
  if (!profile) return <Card><p style={{ color: T.textMuted }}>Unable to load profile.</p></Card>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 700, color: T.text, margin: 0 }}>Edit Profile</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn variant="secondary" onClick={handlePreview}><i className="fas fa-eye" style={{ marginRight: 6 }}></i>Preview</Btn>
          <Btn onClick={handleSave} disabled={saving}>
            {saving ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: 6 }}></i>Saving...</> : <><i className="fas fa-save" style={{ marginRight: 6 }}></i>Save Profile</>}
          </Btn>
        </div>
      </div>

      {/* Media */}
      <Card style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 14, color: T.text }}>Media</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Avatar */}
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: T.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Avatar</label>
            <div style={{ position: 'relative', width: 100, height: 100 }}>
              <div
                onClick={() => avatarRef.current?.click()}
                style={{
                  width: 100, height: 100, borderRadius: '50%', background: T.bgHighlight,
                  backgroundImage: !removeAvatar && (avatarPreview || profile.avatar_url) ? `url(${avatarPreview || profile.avatar_url})` : 'none',
                  backgroundSize: 'cover', backgroundPosition: 'center', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `2px dashed ${T.border}`,
                }}
              >
                {(removeAvatar || (!avatarPreview && !profile.avatar_url)) && <i className="fas fa-camera" style={{ color: T.textMuted, fontSize: 18 }} />}
              </div>
              {!removeAvatar && (avatarPreview || profile.avatar_url) && (
                <button onClick={handleAvatarRemove} title="Remove avatar" style={{
                  position: 'absolute', top: -4, right: -4, width: 22, height: 22, borderRadius: '50%',
                  background: T.bgCard, border: `1px solid ${T.border}`, color: T.textMuted,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, transition: 'color 0.15s',
                }}>
                  <i className="fas fa-times" />
                </button>
              )}
            </div>
            <input ref={avatarRef} type="file" accept="image/*" onChange={handleAvatarSelect} style={{ display: 'none' }} />
          </div>
          {/* Header */}
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: T.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Header Image</label>
            <div style={{ position: 'relative' }}>
              <div
                onClick={() => headerRef.current?.click()}
                style={{
                  width: '100%', height: 100, borderRadius: 10, background: T.bgHighlight,
                  backgroundImage: !removeHeader && (headerPreview || profile.header_url) ? `url(${headerPreview || profile.header_url})` : 'none',
                  backgroundSize: 'cover', backgroundPosition: 'center', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `2px dashed ${T.border}`,
                }}
              >
                {(removeHeader || (!headerPreview && !profile.header_url)) && <i className="fas fa-image" style={{ color: T.textMuted, fontSize: 18 }} />}
              </div>
              {!removeHeader && (headerPreview || profile.header_url) && (
                <button onClick={handleHeaderRemove} title="Remove header" style={{
                  position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: '50%',
                  background: T.bgCard, border: `1px solid ${T.border}`, color: T.textMuted,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, transition: 'color 0.15s',
                }}>
                  <i className="fas fa-times" />
                </button>
              )}
            </div>
            <input ref={headerRef} type="file" accept="image/*" onChange={handleHeaderSelect} style={{ display: 'none' }} />
          </div>
        </div>
      </Card>

      {/* Basic Info */}
      <Card style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 14, color: T.text }}>Basic Info</h3>
        <Input label="Display Name" value={profile.display_name} onChange={e => handleChange('display_name', e.target.value)} />
        <Input label="Tagline" value={profile.tagline} onChange={e => handleChange('tagline', e.target.value)} placeholder="A short description of who you are" />
        <div style={{ position: 'relative' }}>
          <Textarea label="Bio" value={profile.bio} onChange={e => { if (e.target.value.length <= 1000) handleChange('bio', e.target.value) }} placeholder="Tell your audience about yourself..." rows={4} />
          <span style={{ position: 'absolute', bottom: 8, right: 12, fontSize: '0.7rem', color: T.textMuted }}>{profile.bio.length}/1000</span>
        </div>
      </Card>

      {/* Extended Bio */}
      <Card style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 14, color: T.text }}>Extended Bio</h3>
        <div style={{ position: 'relative' }}>
          <Textarea
            label="Long Bio (supports Markdown)"
            value={profile.bio_long}
            onChange={e => { if (e.target.value.length <= 5000) handleChange('bio_long', e.target.value) }}
            placeholder="Write a detailed bio. You can use Markdown formatting..."
            style={{ minHeight: 140 }}
          />
          <span style={{ position: 'absolute', bottom: 8, right: 12, fontSize: '0.7rem', color: T.textMuted }}>{profile.bio_long.length}/5000</span>
        </div>
        <p style={{ fontSize: '0.73rem', color: T.textMuted, margin: '4px 0 0' }}>Supports Markdown: **bold**, *italic*, [links](url), ## headings</p>
      </Card>

      {/* Identity */}
      <Card style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 14, color: T.text }}>Identity</h3>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: T.textMuted, marginBottom: 8, textTransform: 'uppercase' }}>Creator Types</label>
          <ChipSelect options={CREATOR_TYPES} selected={profile.creator_types} onChange={v => handleChange('creator_types', v)} labels={CREATOR_TYPE_LABELS} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: T.textMuted, marginBottom: 8, textTransform: 'uppercase' }}>Languages</label>
          <ChipSelect options={LANGUAGES} selected={profile.languages} onChange={v => handleChange('languages', v)} labels={LANGUAGE_LABELS} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Input label="City" value={profile.location_city} onChange={e => handleChange('location_city', e.target.value)} placeholder="e.g. Istanbul" />
          <Input label="Country" value={profile.location_country} onChange={e => handleChange('location_country', e.target.value)} placeholder="e.g. Turkey" />
        </div>
      </Card>

      {/* Social Links */}
      <Card style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 14, color: T.text }}>Social Links</h3>
        {SOCIAL_KEYS.map(key => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: T.bgHighlight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className={`fab ${SOCIAL_ICONS[key]}`} style={{ color: T.textSub, fontSize: 14 }}></i>
            </div>
            <input
              value={profile.social_links[key] || ''}
              onChange={e => handleSocialChange(key, e.target.value)}
              placeholder={`Your ${key} URL`}
              style={{
                flex: 1, padding: '8px 12px', borderRadius: 8, border: `1px solid ${T.border}`,
                background: T.bgHighlight, color: T.text, fontSize: '0.85rem', outline: 'none',
              }}
            />
          </div>
        ))}
      </Card>

      {/* Bottom save */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
        <Btn variant="secondary" onClick={handlePreview}><i className="fas fa-eye" style={{ marginRight: 6 }}></i>Preview</Btn>
        <Btn onClick={handleSave} disabled={saving}>
          {saving ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: 6 }}></i>Saving...</> : <><i className="fas fa-save" style={{ marginRight: 6 }}></i>Save Profile</>}
        </Btn>
      </div>

      {/* Preview Modal */}
      {showPreview && previewData && (
        <Modal onClose={() => setShowPreview(false)}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: T.text, marginBottom: 16 }}>Profile Preview</h2>
          {previewData.header_url && (
            <div style={{ width: '100%', height: 120, borderRadius: 10, backgroundImage: `url(${previewData.header_url})`, backgroundSize: 'cover', backgroundPosition: 'center', marginBottom: 16 }}></div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', background: T.bgHighlight,
              backgroundImage: previewData.avatar_url ? `url(${previewData.avatar_url})` : 'none',
              backgroundSize: 'cover', backgroundPosition: 'center', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {!previewData.avatar_url && <i className="fas fa-user" style={{ color: T.textMuted, fontSize: 24 }}></i>}
            </div>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: T.text }}>{previewData.display_name || previewData.name}</div>
              {previewData.tagline && <div style={{ fontSize: '0.85rem', color: T.textSub, marginTop: 2 }}>{previewData.tagline}</div>}
            </div>
          </div>
          {previewData.bio && <p style={{ fontSize: '0.85rem', color: T.textSub, lineHeight: 1.6 }}>{previewData.bio}</p>}
          {Array.isArray(previewData.creator_types) && previewData.creator_types.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
              {previewData.creator_types.map(ct => (
                <span key={ct} style={{ padding: '4px 12px', borderRadius: 16, background: T.accentBg, color: T.accent, fontSize: '0.75rem', fontWeight: 500 }}>{CREATOR_TYPE_LABELS[ct] || ct}</span>
              ))}
            </div>
          )}
          <div style={{ marginTop: 20, textAlign: 'right' }}>
            <Btn variant="secondary" onClick={() => setShowPreview(false)}>Close</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION: Content Management
   ═══════════════════════════════════════════════════════════════════════════ */
function ContentSection() {
  const [tracks, setTracks] = useState([])
  const [statusCounts, setStatusCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [showUpload, setShowUpload] = useState(false)
  const [editingTrack, setEditingTrack] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const fetchTracks = (status) => {
    setLoading(true)
    const params = {}
    if (status && status !== 'all') params.status = status
    artistApi.getTracks(params)
      .then(d => {
        setTracks(d.tracks?.data || [])
        setStatusCounts(d.status_counts || {})
        setLoading(false)
      })
      .catch(() => { toast.error('Failed to load tracks'); setLoading(false) })
  }

  useEffect(() => { fetchTracks(activeTab) }, [activeTab])

  const handleDelete = async (id) => {
    try {
      await api.deleteTrack(id)
      toast.success('Track deleted')
      setDeleteConfirm(null)
      fetchTracks(activeTab)
    } catch {
      toast.error('Failed to delete track')
    }
  }

  const handlePublish = async (track) => {
    try {
      await artistApi.updateTrack(track.id, { status: 'pending' })
      toast.success('Track submitted for review')
      fetchTracks(activeTab)
    } catch {
      toast.error('Failed to publish track')
    }
  }

  const statusTabs = [
    { key: 'all', label: 'All' },
    { key: 'approved', label: 'Published' },
    { key: 'pending', label: 'Pending' },
    { key: 'draft', label: 'Drafts' },
    { key: 'scheduled', label: 'Scheduled' },
    { key: 'rejected', label: 'Rejected' },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 700, color: T.text, margin: 0 }}>Content</h1>
        <Btn onClick={() => { setShowUpload(true); setEditingTrack(null) }}>
          <i className="fas fa-plus" style={{ marginRight: 6 }}></i>Upload Track
        </Btn>
      </div>

      {/* Status tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {statusTabs.map(tab => {
          const count = tab.key === 'all'
            ? Object.values(statusCounts).reduce((a, b) => a + b, 0)
            : (statusCounts[tab.key] || 0)
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.8rem',
                background: activeTab === tab.key ? T.accent : T.bgCard,
                color: activeTab === tab.key ? '#111' : T.textSub,
                fontWeight: activeTab === tab.key ? 700 : 400, transition: 'all 0.15s',
              }}
            >
              {tab.label} <span style={{ marginLeft: 4, opacity: 0.7, fontSize: '0.73rem' }}>({count})</span>
            </button>
          )
        })}
      </div>

      {/* Upload / Edit form */}
      {(showUpload || editingTrack) && (
        <Card style={{ marginBottom: 20, border: `1px solid ${T.accent}40` }}>
          <UploadForm
            track={editingTrack}
            onSuccess={() => { setShowUpload(false); setEditingTrack(null); fetchTracks(activeTab) }}
            onCancel={() => { setShowUpload(false); setEditingTrack(null) }}
          />
        </Card>
      )}

      {/* Track list */}
      {loading ? <Spinner /> : tracks.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 40 }}>
          <i className="fas fa-music" style={{ fontSize: 32, color: T.textMuted, marginBottom: 12 }}></i>
          <p style={{ color: T.textMuted, fontSize: '0.9rem' }}>No tracks found</p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {tracks.map(track => (
            <Card key={track.id} style={{ padding: '14px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {/* Cover */}
                <div style={{
                  width: 48, height: 48, borderRadius: 8, background: T.bgHighlight, flexShrink: 0,
                  backgroundImage: track.cover_url ? `url(${track.cover_url})` : 'none',
                  backgroundSize: 'cover', backgroundPosition: 'center',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {!track.cover_url && <i className="fas fa-music" style={{ color: T.textMuted, fontSize: 16 }}></i>}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.title}</span>
                    {track.category && (
                      <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: 4, background: T.bgHighlight, color: T.textSub, fontWeight: 500 }}>{track.category}</span>
                    )}
                    <Badge status={track.status} />
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                    <span style={{ fontSize: '0.73rem', color: T.textMuted }}>
                      <i className="fas fa-play" style={{ marginRight: 4, fontSize: 9 }}></i>
                      {(track.plays_count || 0).toLocaleString()}
                    </span>
                    <span style={{ fontSize: '0.73rem', color: T.textMuted }}>
                      <i className="fas fa-heart" style={{ marginRight: 4, fontSize: 9 }}></i>
                      {(track.likes_count || 0).toLocaleString()}
                    </span>
                    <span style={{ fontSize: '0.73rem', color: T.textMuted }}>
                      {new Date(track.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {track.status === 'draft' && (
                    <Btn variant="gold" style={{ padding: '5px 12px', fontSize: '0.75rem' }} onClick={() => handlePublish(track)}>
                      <i className="fas fa-paper-plane" style={{ marginRight: 4 }}></i>Publish
                    </Btn>
                  )}
                  <Btn variant="secondary" style={{ padding: '5px 12px', fontSize: '0.75rem' }} onClick={() => { setEditingTrack(track); setShowUpload(false) }}>
                    <i className="fas fa-edit"></i>
                  </Btn>
                  <Btn variant="danger" style={{ padding: '5px 12px', fontSize: '0.75rem' }} onClick={() => setDeleteConfirm(track.id)}>
                    <i className="fas fa-trash"></i>
                  </Btn>
                </div>
              </div>

              {/* Rejection notes */}
              {track.status === 'rejected' && track.review_notes && (
                <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 8, background: T.redBg, border: `1px solid ${T.red}20` }}>
                  <div style={{ fontSize: '0.73rem', fontWeight: 600, color: T.red, marginBottom: 4 }}>
                    <i className="fas fa-exclamation-triangle" style={{ marginRight: 6 }}></i>Rejection Reason
                  </div>
                  <p style={{ fontSize: '0.8rem', color: T.textSub, margin: 0 }}>{track.review_notes}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <Modal onClose={() => setDeleteConfirm(null)}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: T.text, marginBottom: 12 }}>Delete Track</h3>
          <p style={{ fontSize: '0.85rem', color: T.textSub, marginBottom: 20 }}>Are you sure you want to delete this track? This action cannot be undone.</p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Btn variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Btn>
            <Btn variant="danger" onClick={() => handleDelete(deleteConfirm)}>
              <i className="fas fa-trash" style={{ marginRight: 6 }}></i>Delete
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   SUB-COMPONENT: Upload / Edit Form
   ═══════════════════════════════════════════════════════════════════════════ */
function UploadForm({ track, onSuccess, onCancel }) {
  const isEdit = !!track
  const [form, setForm] = useState({
    title: track?.title || '',
    category: track?.category || '',
    description: track?.description || '',
    tags: track?.tags ? (Array.isArray(track.tags) ? track.tags.join(', ') : track.tags) : '',
    draft: track?.status === 'draft' || false,
    scheduled_at: track?.scheduled_at ? track.scheduled_at.slice(0, 16) : '',
  })
  const [audioFile, setAudioFile] = useState(null)
  const [coverFile, setCoverFile] = useState(null)
  const [audioInfo, setAudioInfo] = useState(null)
  const [coverPreview, setCoverPreview] = useState(track?.cover_url || null)
  const [submitting, setSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const audioRef = useRef(null)
  const coverRef = useRef(null)

  const processAudioFile = (file) => {
    if (!file) return
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/ogg', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/webm']
    const validExt = /\.(mp3|wav|flac|ogg|m4a|aac|wma|opus|webm|aiff|aif)$/i
    if (!validTypes.includes(file.type) && !validExt.test(file.name)) {
      toast.error('Unsupported audio format. Use MP3, WAV, FLAC, OGG, M4A, or AAC.')
      return
    }
    if (file.size > 200 * 1024 * 1024) {
      toast.error('File too large. Maximum 200MB.')
      return
    }
    setAudioFile(file)
    const info = { name: file.name, size: (file.size / (1024 * 1024)).toFixed(1) + ' MB' }
    if (!form.title) setForm(prev => ({ ...prev, title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') }))
    try {
      const url = URL.createObjectURL(file)
      const audio = new Audio(url)
      audio.addEventListener('loadedmetadata', () => {
        const mins = Math.floor(audio.duration / 60)
        const secs = Math.floor(audio.duration % 60)
        info.duration = `${mins}:${secs.toString().padStart(2, '0')}`
        setAudioInfo({ ...info })
        URL.revokeObjectURL(url)
      })
      audio.addEventListener('error', () => URL.revokeObjectURL(url))
    } catch (e) {}
    setAudioInfo(info)
  }

  const handleAudioSelect = (e) => processAudioFile(e.target.files[0])

  const handleDrag = (e) => { e.preventDefault(); e.stopPropagation() }
  const handleDragIn = (e) => { handleDrag(e); setDragActive(true) }
  const handleDragOut = (e) => { handleDrag(e); setDragActive(false) }
  const handleDrop = (e) => {
    handleDrag(e)
    setDragActive(false)
    if (e.dataTransfer.files?.[0]) processAudioFile(e.dataTransfer.files[0])
  }

  const handleCoverSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Cover image must be under 5MB'); return }
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isEdit && !audioFile) { toast.error('Please select an audio file'); return }
    if (!form.title.trim()) { toast.error('Title is required'); return }

    setSubmitting(true)
    setUploadProgress(0)
    try {
      const fd = new FormData()
      fd.append('title', form.title.trim())
      if (form.category) fd.append('category', form.category)
      if (form.description) fd.append('description', form.description)

      // Send tags as array items (backend expects tags[])
      const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean)
      tags.forEach((t, i) => fd.append(`tags[${i}]`, t))

      if (form.draft) fd.append('draft', '1')
      if (form.scheduled_at && !form.draft) fd.append('scheduled_at', form.scheduled_at)
      if (audioFile) fd.append('file', audioFile)
      if (coverFile) fd.append('cover', coverFile)

      if (isEdit) {
        // For edit, also handle publish action
        if (track.status === 'draft' && !form.draft) fd.append('publish', '1')
        await artistApi.updateTrack(track.id, fd)
        toast.success('Track updated!')
      } else {
        await artistApi.uploadTrack(fd)
        toast.success(form.draft ? 'Draft saved!' : form.scheduled_at ? 'Track scheduled!' : 'Track uploaded!')
      }
      onSuccess()
    } catch (err) {
      const msg = err.response?.data?.message || ''
      const errors = err.response?.data?.errors
      if (errors) {
        const firstError = Object.values(errors)[0]?.[0]
        toast.error(firstError || msg || 'Validation failed')
      } else {
        toast.error(msg || `Failed to ${isEdit ? 'update' : 'upload'} track`)
      }
    }
    setSubmitting(false)
    setUploadProgress(0)
  }

  const removeAudio = (e) => { e.stopPropagation(); setAudioFile(null); setAudioInfo(null) }
  const removeCover = (e) => { e.stopPropagation(); setCoverFile(null); setCoverPreview(null) }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: T.text, margin: 0 }}>
          <i className={`fas fa-${isEdit ? 'edit' : 'cloud-upload-alt'}`} style={{ marginRight: 8, color: T.accent }}></i>
          {isEdit ? 'Edit Track' : 'Upload New Track'}
        </h3>
        <Btn type="button" variant="ghost" onClick={onCancel} style={{ padding: '4px 10px' }}>
          <i className="fas fa-times"></i>
        </Btn>
      </div>

      {/* Audio drop zone - only for new uploads */}
      {!isEdit && (
        <div
          onDragEnter={handleDragIn} onDragLeave={handleDragOut} onDragOver={handleDrag} onDrop={handleDrop}
          onClick={() => !audioFile && audioRef.current?.click()}
          style={{
            padding: audioFile ? '16px 20px' : '32px 20px',
            borderRadius: 12,
            border: `2px dashed ${dragActive ? T.accent : audioFile ? T.accent + '60' : T.border}`,
            background: dragActive ? T.accentBg : audioFile ? T.bgHighlight : T.bgCard,
            cursor: audioFile ? 'default' : 'pointer',
            textAlign: 'center',
            marginBottom: 20,
            transition: 'all 0.2s ease',
          }}
        >
          {audioFile ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10, background: T.accentBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <i className="fas fa-file-audio" style={{ color: T.accent, fontSize: '1.1rem' }}></i>
              </div>
              <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                <div style={{ fontSize: '0.88rem', color: T.text, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{audioInfo?.name}</div>
                <div style={{ fontSize: '0.75rem', color: T.textMuted, marginTop: 2 }}>
                  {audioInfo?.size}{audioInfo?.duration ? ` \u00b7 ${audioInfo.duration}` : ''}{' \u00b7 '}
                  <span style={{ color: T.accent }}>Ready to upload</span>
                </div>
              </div>
              <button type="button" onClick={removeAudio} style={{
                background: T.redBg, border: 'none', color: T.red, width: 30, height: 30,
                borderRadius: 8, cursor: 'pointer', fontSize: '0.75rem', flexShrink: 0,
              }}>
                <i className="fas fa-times"></i>
              </button>
            </div>
          ) : (
            <>
              <i className="fas fa-cloud-upload-alt" style={{ color: T.textMuted, fontSize: '1.8rem', marginBottom: 10, display: 'block' }}></i>
              <div style={{ fontSize: '0.92rem', color: T.text, fontWeight: 600, marginBottom: 4 }}>
                Drag & drop your audio file here
              </div>
              <div style={{ fontSize: '0.78rem', color: T.textMuted, marginBottom: 12 }}>or click to browse</div>
              <div style={{ fontSize: '0.68rem', color: T.textMuted }}>
                MP3, WAV, FLAC, OGG, M4A, AAC \u00b7 Up to 200MB
              </div>
            </>
          )}
        </div>
      )}
      <input ref={audioRef} type="file" accept={AUDIO_ACCEPT} onChange={handleAudioSelect} style={{ display: 'none' }} />

      {/* Upload progress */}
      {submitting && uploadProgress > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: '0.75rem', color: T.textSub }}>Uploading...</span>
            <span style={{ fontSize: '0.75rem', color: T.accent }}>{uploadProgress}%</span>
          </div>
          <div style={{ width: '100%', height: 4, borderRadius: 2, background: T.bgHighlight }}>
            <div style={{ width: `${uploadProgress}%`, height: '100%', borderRadius: 2, background: T.accent, transition: 'width 0.3s' }}></div>
          </div>
        </div>
      )}

      {/* Metadata fields */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Input label="Title *" value={form.title} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))} placeholder="Track title" />
        <Select label="Category" value={form.category} onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}>
          <option value="">Select category...</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </Select>
      </div>

      <Textarea label="Description" value={form.description} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Describe this track..." rows={3} />
      <Input label="Tags (comma-separated)" value={form.tags} onChange={e => setForm(prev => ({ ...prev, tags: e.target.value }))} placeholder="nasheed, arabic, spiritual, peaceful" />

      {/* Cover image */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: T.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          Cover Artwork
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            onClick={() => coverRef.current?.click()}
            style={{
              width: 80, height: 80, borderRadius: 10, overflow: 'hidden',
              border: `2px dashed ${coverPreview ? 'transparent' : T.border}`,
              background: coverPreview ? 'transparent' : T.bgHighlight,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, position: 'relative',
            }}
          >
            {coverPreview ? (
              <img src={coverPreview} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <i className="fas fa-image" style={{ color: T.textMuted, fontSize: '1.2rem' }}></i>
            )}
          </div>
          <div>
            <button type="button" onClick={() => coverRef.current?.click()} style={{
              padding: '6px 14px', borderRadius: 8, border: `1px solid ${T.border}`, background: 'transparent',
              color: T.textSub, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 500,
            }}>
              {coverPreview ? 'Change' : 'Choose image'}
            </button>
            {coverPreview && (
              <button type="button" onClick={removeCover} style={{
                padding: '6px 14px', borderRadius: 8, border: 'none', background: 'transparent',
                color: T.red, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 500, marginLeft: 6,
              }}>
                Remove
              </button>
            )}
            <div style={{ fontSize: '0.68rem', color: T.textMuted, marginTop: 4 }}>JPEG, PNG, WebP \u00b7 Max 5MB</div>
          </div>
        </div>
        <input ref={coverRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleCoverSelect} style={{ display: 'none' }} />
      </div>

      {/* Schedule & Draft options */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 20, padding: '14px 16px',
        background: T.bgHighlight, borderRadius: 10, marginBottom: 20,
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox" id="draft_check"
            checked={form.draft}
            onChange={e => setForm(prev => ({ ...prev, draft: e.target.checked, scheduled_at: e.target.checked ? '' : prev.scheduled_at }))}
            style={{ width: 16, height: 16, accentColor: T.accent }}
          />
          <label htmlFor="draft_check" style={{ fontSize: '0.82rem', color: T.textSub, cursor: 'pointer', fontWeight: 500 }}>
            <i className="fas fa-file-alt" style={{ marginRight: 5, color: T.textMuted, fontSize: '0.75rem' }}></i>
            Save as draft
          </label>
        </div>

        {!form.draft && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 200 }}>
            <i className="fas fa-calendar-alt" style={{ color: T.textMuted, fontSize: '0.82rem' }}></i>
            <label style={{ fontSize: '0.78rem', color: T.textMuted, fontWeight: 500, whiteSpace: 'nowrap' }}>Schedule:</label>
            <input
              type="datetime-local"
              value={form.scheduled_at}
              onChange={e => setForm(prev => ({ ...prev, scheduled_at: e.target.value }))}
              min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
              style={{
                flex: 1, padding: '5px 8px', borderRadius: 6, border: `1px solid ${T.border}`,
                background: T.bgCard, color: T.text, fontSize: '0.78rem', outline: 'none',
              }}
            />
            {form.scheduled_at && (
              <button type="button" onClick={() => setForm(prev => ({ ...prev, scheduled_at: '' }))} style={{
                background: 'none', border: 'none', color: T.textMuted, cursor: 'pointer', fontSize: '0.7rem', padding: '2px 4px',
              }}>
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <Btn type="button" variant="secondary" onClick={onCancel}>Cancel</Btn>
        <Btn type="submit" disabled={submitting} style={{ minWidth: 140 }}>
          {submitting ? (
            <><i className="fas fa-spinner fa-spin" style={{ marginRight: 6 }}></i>{isEdit ? 'Saving...' : 'Uploading...'}</>
          ) : form.draft ? (
            <><i className="fas fa-file-alt" style={{ marginRight: 6 }}></i>Save Draft</>
          ) : form.scheduled_at ? (
            <><i className="fas fa-calendar-check" style={{ marginRight: 6 }}></i>Schedule</>
          ) : (
            <><i className={`fas fa-${isEdit ? 'save' : 'cloud-upload-alt'}`} style={{ marginRight: 6 }}></i>{isEdit ? 'Save Changes' : 'Upload'}</>
          )}
        </Btn>
      </div>
    </form>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   ONBOARDING FLOW
   ═══════════════════════════════════════════════════════════════════════════ */
function OnboardingFlow({ state, onComplete }) {
  const [step, setStep] = useState(state.current_step || 1)
  const [loading, setLoading] = useState(false)

  // Step 2: Compliance
  const [rightsConfirmed, setRightsConfirmed] = useState(false)
  const [valuesConfirmed, setValuesConfirmed] = useState(false)

  // Step 3: Profile basics
  const [profileBasics, setProfileBasics] = useState({
    tagline: '',
    creator_types: [],
    languages: [],
    location_city: '',
    location_country: '',
  })

  const totalSteps = 4
  const progressPercent = Math.round((step / totalSteps) * 100)

  const handleNext = async () => {
    setLoading(true)
    try {
      if (step === 1) {
        setStep(2)
      } else if (step === 2) {
        if (!rightsConfirmed || !valuesConfirmed) {
          toast.error('Please confirm both items to continue')
          setLoading(false)
          return
        }
        await artistApi.submitCompliance({ rights_confirmed: true, values_confirmed: true })
        setStep(3)
      } else if (step === 3) {
        await artistApi.saveProfileBasics(profileBasics)
        setStep(4)
      } else if (step === 4) {
        await artistApi.completeOnboarding()
        onComplete()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <div style={{ width: 600, maxWidth: '95vw', padding: '24px 0' }}>
        {/* Progress bar */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: '0.8rem', color: T.textSub, fontWeight: 500 }}>Step {step} of {totalSteps}</span>
            <span style={{ fontSize: '0.8rem', color: T.textMuted }}>{progressPercent}%</span>
          </div>
          <div style={{ width: '100%', height: 6, borderRadius: 3, background: T.bgCard }}>
            <div style={{ width: `${progressPercent}%`, height: '100%', borderRadius: 3, background: T.accent, transition: 'width 0.3s ease' }}></div>
          </div>
        </div>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <Card style={{ textAlign: 'center', padding: '48px 32px' }}>
            <div style={{ fontSize: '2rem', marginBottom: 16 }}>
              <i className="fas fa-mosque" style={{ color: T.accent }}></i>
            </div>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 700, color: T.text, marginBottom: 12 }}>Welcome to the Nashidify Artist Portal</h1>
            <p style={{ fontSize: '0.9rem', color: T.textSub, lineHeight: 1.7, marginBottom: 8 }}>
              Share your Islamic content with a global audience. Upload nasheeds, Quran recitations,
              lectures, podcasts, and more.
            </p>
            <p style={{ fontSize: '0.85rem', color: T.gold, fontStyle: 'italic', marginBottom: 28 }}>Bismillahir Rahmanir Raheem</p>
            <Btn onClick={handleNext} disabled={loading} style={{ padding: '12px 36px', fontSize: '0.9rem' }}>
              Get Started <i className="fas fa-arrow-right" style={{ marginLeft: 8 }}></i>
            </Btn>
          </Card>
        )}

        {/* Step 2: Compliance */}
        {step === 2 && (
          <Card style={{ padding: '36px 32px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: T.text, marginBottom: 8 }}>Content Guidelines</h2>
            <p style={{ fontSize: '0.85rem', color: T.textSub, marginBottom: 24 }}>Please review and confirm the following before proceeding:</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
              <label style={{
                display: 'flex', gap: 12, padding: '16px', borderRadius: 10, cursor: 'pointer',
                background: rightsConfirmed ? T.accentBg : T.bgHover, border: `1px solid ${rightsConfirmed ? T.accent + '40' : T.border}`,
              }}>
                <input
                  type="checkbox"
                  checked={rightsConfirmed}
                  onChange={e => setRightsConfirmed(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: T.accent, marginTop: 2, flexShrink: 0 }}
                />
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: T.text }}>Content Rights</div>
                  <p style={{ fontSize: '0.8rem', color: T.textSub, margin: '4px 0 0', lineHeight: 1.5 }}>
                    I confirm that I own or have the rights to all content I upload. I will not upload copyrighted material
                    without proper authorization.
                  </p>
                </div>
              </label>

              <label style={{
                display: 'flex', gap: 12, padding: '16px', borderRadius: 10, cursor: 'pointer',
                background: valuesConfirmed ? T.accentBg : T.bgHover, border: `1px solid ${valuesConfirmed ? T.accent + '40' : T.border}`,
              }}>
                <input
                  type="checkbox"
                  checked={valuesConfirmed}
                  onChange={e => setValuesConfirmed(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: T.accent, marginTop: 2, flexShrink: 0 }}
                />
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: T.text }}>Islamic Values</div>
                  <p style={{ fontSize: '0.8rem', color: T.textSub, margin: '4px 0 0', lineHeight: 1.5 }}>
                    I agree to only upload content that aligns with Islamic values and principles. Content must be
                    halal and appropriate for a Muslim audience.
                  </p>
                </div>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Btn onClick={handleNext} disabled={loading || !rightsConfirmed || !valuesConfirmed} style={{ padding: '10px 28px' }}>
                {loading ? <i className="fas fa-spinner fa-spin"></i> : <>Continue <i className="fas fa-arrow-right" style={{ marginLeft: 8 }}></i></>}
              </Btn>
            </div>
          </Card>
        )}

        {/* Step 3: Profile Basics */}
        {step === 3 && (
          <Card style={{ padding: '36px 32px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: T.text, marginBottom: 8 }}>Set Up Your Profile</h2>
            <p style={{ fontSize: '0.85rem', color: T.textSub, marginBottom: 24 }}>Tell your audience about yourself.</p>

            <Input
              label="Tagline"
              value={profileBasics.tagline}
              onChange={e => setProfileBasics(prev => ({ ...prev, tagline: e.target.value }))}
              placeholder="A short description, e.g. 'Nasheed artist from Istanbul'"
            />

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: T.textMuted, marginBottom: 8, textTransform: 'uppercase' }}>Creator Type</label>
              <ChipSelect
                options={CREATOR_TYPES}
                selected={profileBasics.creator_types}
                onChange={v => setProfileBasics(prev => ({ ...prev, creator_types: v }))}
                labels={CREATOR_TYPE_LABELS}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: T.textMuted, marginBottom: 8, textTransform: 'uppercase' }}>Languages</label>
              <ChipSelect
                options={LANGUAGES}
                selected={profileBasics.languages}
                onChange={v => setProfileBasics(prev => ({ ...prev, languages: v }))}
                labels={LANGUAGE_LABELS}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Input label="City" value={profileBasics.location_city} onChange={e => setProfileBasics(prev => ({ ...prev, location_city: e.target.value }))} placeholder="e.g. Istanbul" />
              <Input label="Country" value={profileBasics.location_country} onChange={e => setProfileBasics(prev => ({ ...prev, location_country: e.target.value }))} placeholder="e.g. Turkey" />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
              <Btn variant="secondary" onClick={() => setStep(2)}>
                <i className="fas fa-arrow-left" style={{ marginRight: 6 }}></i>Back
              </Btn>
              <Btn onClick={handleNext} disabled={loading} style={{ padding: '10px 28px' }}>
                {loading ? <i className="fas fa-spinner fa-spin"></i> : <>Continue <i className="fas fa-arrow-right" style={{ marginLeft: 8 }}></i></>}
              </Btn>
            </div>
          </Card>
        )}

        {/* Step 4: Complete */}
        {step === 4 && (
          <Card style={{ textAlign: 'center', padding: '48px 32px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>
              <i className="fas fa-check-circle" style={{ color: T.green }}></i>
            </div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: T.text, marginBottom: 12 }}>Congratulations!</h2>
            <p style={{ fontSize: '0.9rem', color: T.textSub, lineHeight: 1.7, marginBottom: 8 }}>
              Your artist portal is all set up. You are ready to share your Islamic content
              with the Nashidify community.
            </p>
            <p style={{ fontSize: '0.85rem', color: T.gold, fontStyle: 'italic', marginBottom: 28 }}>
              May Allah bless your efforts. Barakallahu feek.
            </p>
            <Btn onClick={handleNext} disabled={loading} style={{ padding: '12px 36px', fontSize: '0.9rem' }}>
              {loading ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-th-large" style={{ marginRight: 8 }}></i>Go to Dashboard</>}
            </Btn>
          </Card>
        )}
      </div>
    </div>
  )
}
