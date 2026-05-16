import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { api } from '../services/api'
import { tierName, tierArabic, isMunshid, LEGACY_ARTIST_SLUG } from '../lib/tierDisplay'

// Per-slug presentation. The legacy free `artist` tier is collapsed out of
// the UI; `artist_pro` is presented as the single paid creator tier:
// Munshid. (artist_pro key kept so the live API's slug still maps until the
// backend tier-collapse migration renames it to `munshid`.)
const MUNSHID_FEATURES = {
  icon: 'fa-crown',
  color: '#E8653A',
  badge: 'For Creators',
  highlights: [
    'The full Munshid Portal — analytics, audience, content',
    'Unlimited uploads, storage & lossless FLAC',
    'AI analytics & growth predictions',
    'AI-assisted upload (title, category, moods, lyrics)',
    'AI growth coach & smart discovery boost',
    'Auto-approval (instant publish) + verified badge',
    'Monetization: tips, premium tracks, 2 free promotions/mo',
  ],
}

const PLAN_FEATURES = {
  free: {
    icon: 'fa-seedling',
    color: '#8A7A60',
    highlights: [
      'Stream with ads',
      '128kbps audio quality',
      'Upload a few tracks per month',
      '5 playlists (25 tracks each)',
      '5 offline downloads/month',
      'Basic recommendations',
      'Full radio access',
    ],
  },
  plus: {
    icon: 'fa-star',
    color: '#C9A24D',
    badge: 'Popular',
    highlights: [
      'Ad-free listening',
      '320kbps HQ audio',
      'More uploads per month',
      'Unlimited playlists',
      '25 offline downloads/month',
      'AI-powered recommendations',
      'Basic analytics dashboard',
    ],
  },
  artist_pro: MUNSHID_FEATURES,
  munshid: MUNSHID_FEATURES,
}

const MUNSHID_SUPERPOWERS = [
  { icon: 'fa-chart-line', title: 'AI Analytics', desc: 'Growth predictions, audience health & what to do next.' },
  { icon: 'fa-wand-magic-sparkles', title: 'AI-Assisted Upload', desc: 'Auto title, category, moods, tags & lyrics.' },
  { icon: 'fa-compass', title: 'AI Discovery Boost', desc: 'Your nasheeds matched to the right listeners.' },
  { icon: 'fa-graduation-cap', title: 'AI Growth Coach', desc: 'A personal advisor for growing your audience.' },
]

export default function Pricing() {
  const [plans, setPlans] = useState([])
  const [pricingTier, setPricingTier] = useState('t1')
  const [billing, setBilling] = useState('monthly')
  const [currentPlan, setCurrentPlan] = useState('free')
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(null)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const token = localStorage.getItem('token')

  useEffect(() => {
    loadData()
    if (searchParams.get('subscription') === 'success') {
      toast.success('Subscription activated! Welcome to your new plan.')
      let attempts = 0
      const pollInterval = setInterval(async () => {
        attempts++
        try {
          const me = await api.getMe()
          const fresh = me.user || me
          const planSlug = fresh.plan_slug || 'free'
          if (planSlug !== 'free' || attempts >= 10) {
            clearInterval(pollInterval)
            localStorage.setItem('user', JSON.stringify(fresh))
            setCurrentPlan(planSlug)
            if (planSlug !== 'free') loadData()
          }
        } catch {
          if (attempts >= 10) clearInterval(pollInterval)
        }
      }, 2000)
      return () => clearInterval(pollInterval)
    }
    if (searchParams.get('cancelled') === 'true') {
      toast('Checkout cancelled', { icon: 'i' })
    }
  }, [])

  const loadData = async () => {
    try {
      const planData = await api.getPlans()
      setPlans(planData.plans || [])
      setPricingTier(planData.pricing_tier || 't1')

      if (token) {
        try {
          const status = await api.getSubscriptionStatus()
          setCurrentPlan(status.features?.plan || 'free')
          setSubscription(status.subscription)
        } catch {}
      }
    } catch {}
    finally { setLoading(false) }
  }

  const handleSubscribe = async (planSlug) => {
    if (!token) {
      localStorage.setItem('redirectAfterLogin', '/pricing')
      navigate('/login')
      return
    }
    if (planSlug === 'free') return
    if (planSlug === currentPlan) return

    setCheckoutLoading(planSlug)
    try {
      const data = await api.createCheckout(planSlug, billing)
      if (data.checkout_url) window.location.href = data.checkout_url
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start checkout')
    }
    finally { setCheckoutLoading(null) }
  }

  const handleCancel = async () => {
    try {
      await api.cancelSubscription()
      toast.success('Subscription will be cancelled at end of billing period')
      loadData()
    } catch { toast.error('Failed to cancel') }
  }

  const handleResume = async () => {
    try {
      await api.resumeSubscription()
      toast.success('Subscription resumed!')
      loadData()
    } catch { toast.error('Failed to resume') }
  }

  const formatPrice = (cents) => {
    if (!cents) return 'Free'
    return `$${(cents / 100).toFixed(2)}`
  }

  const getDisplayPrice = (plan, cycle) => {
    if (cycle === 'annual') return plan.display_price_annual_cents ?? plan.price_annual_cents
    return plan.display_price_monthly_cents ?? plan.price_monthly_cents
  }

  if (loading) {
    return (
      <div className="sp-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.5rem', color: 'var(--sp-gold)' }}></i>
      </div>
    )
  }

  // Collapse: the legacy free `artist` tier is hidden — only Free, Plus and
  // Munshid (artist_pro) are offered.
  const visiblePlans = plans.filter(p => p.slug !== LEGACY_ARTIST_SLUG)

  return (
    <div className="sp-page nsh-pricing-page">
      {pricingTier !== 't1' && (
        <div className="nsh-pricing-region-banner" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
          padding: '0.625rem 1rem', marginBottom: '1rem', background: 'var(--sp-bg-card, #1a1a2e)',
          border: '1px solid var(--sp-border, #2a2a3e)', borderRadius: '8px',
          color: 'var(--sp-text, #e0e0e0)', fontSize: '0.875rem',
        }}>
          <i className="fas fa-globe" style={{ color: 'var(--sp-green, #1DB954)' }}></i>
          <span>Pricing adjusted for your region</span>
        </div>
      )}

      <div className="nsh-pricing-header">
        <h1>Choose Your Plan</h1>
        <p>Listen freely — or rise as a Munshid and share your voice with the Ummah.</p>

        <div className="nsh-billing-toggle">
          <button className={`nsh-billing-btn ${billing === 'monthly' ? 'active' : ''}`}
            onClick={() => setBilling('monthly')}>Monthly</button>
          <button className={`nsh-billing-btn ${billing === 'annual' ? 'active' : ''}`}
            onClick={() => setBilling('annual')}>
            Annual <span className="nsh-billing-save">Save up to 30%</span>
          </button>
        </div>
      </div>

      {/* ─── Become a Munshid — creator spotlight (signup funnel) ─────────── */}
      <div style={{
        maxWidth: 1040, margin: '0 auto 2rem', padding: '1.75rem 1.5rem',
        borderRadius: 20, border: '1px solid rgba(232,101,58,0.28)',
        background: 'linear-gradient(135deg, rgba(232,101,58,0.10), rgba(201,162,77,0.06) 60%, transparent)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <i className="fas fa-crown" style={{ color: '#E8653A', fontSize: '1.1rem' }}></i>
          <span style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: '#E8653A' }}>
            Become a Munshid
          </span>
          <span style={{ fontFamily: 'Amiri, serif', fontSize: '1.05rem', color: 'var(--sp-gold, #C9A24D)', opacity: 0.9 }}>المنشد</span>
        </div>
        <h2 style={{ margin: '0 0 0.35rem', fontSize: '1.5rem', color: 'var(--sp-text, #ECECEC)', letterSpacing: '-0.5px' }}>
          Your voice. The whole Ummah. Powered by AI.
        </h2>
        <p style={{ margin: '0 0 1.25rem', color: 'var(--sp-text-muted, #9aa0a6)', fontSize: '0.95rem', maxWidth: 720, lineHeight: 1.6 }}>
          The Munshid Portal gives you a professional home for your nasheeds — real analytics,
          effortless AI-assisted publishing, audience growth tools and monetization. Everything
          you need to grow a global listenership.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.75rem' }}>
          {MUNSHID_SUPERPOWERS.map((s) => (
            <div key={s.title} style={{
              display: 'flex', gap: 12, padding: '0.85rem 0.95rem', borderRadius: 14,
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <i className={`fas ${s.icon}`} style={{ color: '#E8653A', fontSize: '1.05rem', marginTop: 2 }}></i>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--sp-text, #ECECEC)' }}>{s.title}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--sp-text-muted, #9aa0a6)', marginTop: 2, lineHeight: 1.45 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="nsh-plans-grid">
        {visiblePlans.map(plan => {
          const features = PLAN_FEATURES[plan.slug] || PLAN_FEATURES.free
          const displayMonthly = getDisplayPrice(plan, 'monthly')
          const displayAnnual = getDisplayPrice(plan, 'annual')
          const price = billing === 'annual' ? displayAnnual : displayMonthly
          const monthlyPrice = billing === 'annual' ? Math.round(displayAnnual / 12) : displayMonthly
          const isCurrentPlan = currentPlan === plan.slug
          const isDowngrade = visiblePlans.findIndex(p => p.slug === plan.slug) < visiblePlans.findIndex(p => p.slug === currentPlan)
          const name = tierName(plan.slug)
          const arabic = tierArabic(plan.slug)

          return (
            <div key={plan.slug} className={`nsh-plan-card ${isCurrentPlan ? 'current' : ''} ${features.badge ? 'featured' : ''}`}
              style={{ '--plan-color': features.color }}>

              {features.badge && <div className="nsh-plan-badge">{features.badge}</div>}

              <div className="nsh-plan-icon">
                <i className={`fas ${features.icon}`}></i>
              </div>

              <h2 className="nsh-plan-name">
                {name}
                {arabic && (
                  <span style={{ fontFamily: 'Amiri, serif', fontSize: '0.95rem', color: 'var(--sp-gold, #C9A24D)', opacity: 0.85, marginInlineStart: 8 }}>
                    {arabic}
                  </span>
                )}
              </h2>
              <p className="nsh-plan-desc">{isMunshid(plan.slug) ? 'For creators ready to grow' : plan.description}</p>

              <div className="nsh-plan-price">
                {displayMonthly === 0 ? (
                  <span className="nsh-plan-amount">Free</span>
                ) : (
                  <>
                    <span className="nsh-plan-amount">{formatPrice(monthlyPrice)}</span>
                    <span className="nsh-plan-period">/month</span>
                    {billing === 'annual' && (
                      <div className="nsh-plan-annual-total">{formatPrice(price)} billed annually</div>
                    )}
                  </>
                )}
              </div>

              <ul className="nsh-plan-features">
                {features.highlights.map((f, i) => (
                  <li key={i}><i className="fas fa-check"></i><span>{f}</span></li>
                ))}
              </ul>

              {isCurrentPlan ? (
                <div className="nsh-plan-current-badge">
                  <i className="fas fa-check-circle"></i> Current Plan
                </div>
              ) : displayMonthly === 0 ? (
                <div className="nsh-plan-current-badge" style={{ opacity: 0.5 }}>Included</div>
              ) : (
                <button className="nsh-plan-cta"
                  disabled={checkoutLoading === plan.slug}
                  onClick={() => handleSubscribe(plan.slug)}>
                  {checkoutLoading === plan.slug ? (
                    <><i className="fas fa-spinner fa-spin"></i> Processing...</>
                  ) : isDowngrade ? 'Downgrade' : isMunshid(plan.slug) ? 'Become a Munshid' : `Get ${name}`}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {subscription && (
        <div className="nsh-subscription-manage">
          <h3>Manage Subscription</h3>
          <p>
            Status: <strong>{subscription.status}</strong>
            {subscription.on_trial && ' (Trial)'}
            {subscription.on_grace_period && ' (Cancelling)'}
          </p>
          {subscription.status === 'active' && !subscription.on_grace_period && (
            <button className="nsh-manage-btn nsh-manage-cancel" onClick={handleCancel}>Cancel Subscription</button>
          )}
          {subscription.on_grace_period && (
            <button className="nsh-manage-btn nsh-manage-resume" onClick={handleResume}>Resume Subscription</button>
          )}
        </div>
      )}

      <div className="nsh-pricing-note">
        <i className="fas fa-book-quran"></i>
        <p>Quran recitations are always free on all plans. Knowledge of the Quran should never be behind a paywall.</p>
      </div>
    </div>
  )
}
