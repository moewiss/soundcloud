import { useState } from 'react'

const CATEGORIES = [
  { icon: 'fa-music',           title: 'Nasheeds',   desc: 'Beautiful Islamic vocals and melodies',   color: '#1F7A5A' },
  { icon: 'fa-book-quran',      title: 'Quran',      desc: 'Recitations from world-renowned Qaris',  color: '#2A6B4F' },
  { icon: 'fa-hands-praying',   title: 'Duas',       desc: 'Supplications for every occasion',       color: '#C9A24D' },
  { icon: 'fa-microphone',      title: 'Lectures',   desc: 'Learn from top Islamic scholars',        color: '#4B7BBE' },
  { icon: 'fa-book-open',       title: 'Stories',    desc: 'Inspiring tales from Islamic history',    color: '#7B59B6' },
  { icon: 'fa-broadcast-tower', title: 'Radio',      desc: 'Live Islamic radio stations 24/7',       color: '#C05040' },
]

/* 8-point star polygon for geometric decoration */
const S8 = "50,6 58.5,30 82,18 68,43 94,50 68,57 82,82 58.5,70 50,94 41.5,70 18,82 32,57 6,50 32,43 18,18 41.5,30"

/* 12-point rosette polygon */
const S12 = "50,2 56,26 74,8 62,30 92,22 68,40 98,50 68,60 92,78 62,70 74,92 56,74 50,98 44,74 26,92 38,70 8,78 32,60 2,50 32,40 8,22 38,30 26,8 44,26"

export default function ComingSoon() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const stars = Array.from({ length: 10 }, (_, i) => ({
    id: i,
    left: `${5 + (i * 11) % 88}%`,
    top: `${5 + (i * 14) % 80}%`,
    size: 20 + (i % 4) * 18,
    delay: i * 0.5,
    duration: 22 + (i % 5) * 5,
    opacity: 0.08 + (i % 3) * 0.05,
    isRosette: i % 3 === 0,
  }))

  const handleNotify = (e) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="cs-page">
      {/* Background geometric tessellation */}
      <div className="cs-tessellation" aria-hidden="true">
        <svg width="100%" height="100%" opacity="0.03">
          <defs>
            <pattern id="cs-geo" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
              <polygon points="60,3 65,28 84,16 72,38 97,50 72,62 84,84 65,72 60,97 55,72 36,84 48,62 23,50 48,38 36,16 55,28" fill="none" stroke="rgba(201,168,76,0.6)" strokeWidth="0.5"/>
              <circle cx="60" cy="50" r="18" fill="none" stroke="rgba(45,155,110,0.4)" strokeWidth="0.3"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#cs-geo)"/>
        </svg>
      </div>

      {/* Floating geometric stars */}
      <div className="cs-stars" aria-hidden="true">
        {stars.map(s => (
          <svg key={s.id} className="cs-star" viewBox="0 0 100 100"
            style={{
              left: s.left, top: s.top,
              width: s.size, height: s.size,
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.duration}s`,
              opacity: s.opacity,
            }}>
            <polygon points={s.isRosette ? S12 : S8} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
        ))}
      </div>

      {/* Radial glow effects */}
      <div className="cs-glow cs-glow--emerald" aria-hidden="true"/>
      <div className="cs-glow cs-glow--gold" aria-hidden="true"/>

      {/* Main content */}
      <div className="cs-content">
        {/* Logo */}
        <div className="cs-logo">
          <img src="/logo.png" alt="Nashidify" draggable="false"/>
        </div>

        <div className="cs-badge">
          <span className="cs-badge-dot"/>
          In Development
        </div>

        <h1 className="cs-title">
          Something Beautiful<br/>
          is <span className="cs-title-accent">Coming Soon</span>
        </h1>

        <p className="cs-subtitle">
          We're crafting new features to enrich your halal listening experience.
          Stay tuned — great things are on the way, in sha Allah.
        </p>

        {/* Notify form */}
        <form className="cs-notify" onSubmit={handleNotify}>
          {!submitted ? (
            <>
              <input
                type="email"
                className="cs-notify-input"
                placeholder="Enter your email for updates"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <button type="submit" className="cs-notify-btn">
                <i className="fas fa-bell" style={{ marginRight: 8, fontSize: '0.8rem' }}/>
                Notify Me
              </button>
            </>
          ) : (
            <div className="cs-notify-success">
              <i className="fas fa-check-circle"/>
              Jazak Allah Khair! We'll keep you posted.
            </div>
          )}
        </form>

        {/* Category cards */}
        <div className="cs-features">
          {CATEGORIES.map((c, i) => (
            <div key={i} className="cs-feature" style={{ animationDelay: `${0.3 + i * 0.08}s` }}>
              <div className="cs-feature-icon" style={{ color: c.color, background: `${c.color}18` }}>
                <i className={`fas ${c.icon}`}/>
              </div>
              <h3 className="cs-feature-title">{c.title}</h3>
              <p className="cs-feature-desc">{c.desc}</p>
            </div>
          ))}
        </div>

        {/* Footer tagline */}
        <div className="cs-footer">
          <div className="cs-footer-line"/>
          <p className="cs-footer-text">Nashidify — Your Halal Listening Companion</p>
        </div>
      </div>
    </div>
  )
}
