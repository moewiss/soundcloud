import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { api } from '../services/api'

const PLAN_FEATURES = {
  free: {
    icon: 'fa-seedling',
    color: '#8A7A60',
    highlights: [
      'Stream with ads',
      '128kbps audio quality',
      '3 uploads per month',
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
      '10 uploads per month',
      'Unlimited playlists',
      '25 offline downloads/month',
      'AI-powered recommendations',
      'Basic analytics dashboard',
    ],
  },
  artist: {
    icon: 'fa-palette',
    color: '#1F7A5A',
    highlights: [
      'Everything in Plus',
      '50 uploads per month',
      '50 offline downloads/month',
      'Full analytics dashboard',
      'Priority approval',
      'Custom artist branding',
      'Create premium tracks',
    ],
  },
  artist_pro: {
    icon: 'fa-crown',
    color: '#E8653A',
    badge: 'Best Value',
    highlights: [
      'Everything in Artist',
      'Unlimited uploads & storage',
      'Unlimited offline downloads',
      'Lossless FLAC quality',
      'Auto-approval (instant publish)',
      'Verified badge & custom URL',
      'Advanced real-time analytics',
      '2 free promotions/month',
    ],
  },
}

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

  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const token = localStorage.getItem('token')

  useEffect(() => {
    loadData()
    if (searchParams.get('subscription') === 'success') {
      toast.success('Subscription activated! Welcome to your new plan.')
      // Poll to sync plan_slug after Stripe webhook processes
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
            if (planSlug !== 'free') {
              loadData()
            }
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
      if (data.checkout_url) {
        window.location.href = data.checkout_url
      }
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
    if (cycle === 'annual') {
      return plan.display_price_annual_cents ?? plan.price_annual_cents
    }
    return plan.display_price_monthly_cents ?? plan.price_monthly_cents
  }

  if (loading) {
    return (
      <div className="sp-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.5rem', color: 'var(--sp-gold)' }}></i>
      </div>
    )
  }

  return (
    <div className="sp-page nsh-pricing-page">
      {/* Regional pricing banner */}
      {pricingTier !== 't1' && (
        <div className="nsh-pricing-region-banner" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          padding: '0.625rem 1rem',
          marginBottom: '1rem',
          background: 'var(--sp-bg-card, #1a1a2e)',
          border: '1px solid var(--sp-border, #2a2a3e)',
          borderRadius: '8px',
          color: 'var(--sp-text, #e0e0e0)',
          fontSize: '0.875rem',
        }}>
          <i className="fas fa-globe" style={{ color: 'var(--sp-green, #1DB954)' }}></i>
          <span>Pricing adjusted for your region</span>
        </div>
      )}

      {/* Header */}
      <div className="nsh-pricing-header">
        <h1>Choose Your Plan</h1>
        <p>Unlock the full Nashidify experience</p>

        {/* Billing toggle */}
        <div className="nsh-billing-toggle">
          <button className={`nsh-billing-btn ${billing === 'monthly' ? 'active' : ''}`}
            onClick={() => setBilling('monthly')}>Monthly</button>
          <button className={`nsh-billing-btn ${billing === 'annual' ? 'active' : ''}`}
            onClick={() => setBilling('annual')}>
            Annual <span className="nsh-billing-save">Save up to 30%</span>
          </button>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="nsh-plans-grid">
        {plans.map(plan => {
          const features = PLAN_FEATURES[plan.slug] || PLAN_FEATURES.free
          const displayMonthly = getDisplayPrice(plan, 'monthly')
          const displayAnnual = getDisplayPrice(plan, 'annual')
          const price = billing === 'annual' ? displayAnnual : displayMonthly
          const monthlyPrice = billing === 'annual' ? Math.round(displayAnnual / 12) : displayMonthly
          const isCurrentPlan = currentPlan === plan.slug
          const isDowngrade = plans.findIndex(p => p.slug === plan.slug) < plans.findIndex(p => p.slug === currentPlan)

          return (
            <div key={plan.slug} className={`nsh-plan-card ${isCurrentPlan ? 'current' : ''} ${features.badge ? 'featured' : ''}`}
              style={{ '--plan-color': features.color }}>

              {features.badge && <div className="nsh-plan-badge">{features.badge}</div>}

              <div className="nsh-plan-icon">
                <i className={`fas ${features.icon}`}></i>
              </div>

              <h2 className="nsh-plan-name">{plan.name}</h2>
              <p className="nsh-plan-desc">{plan.description}</p>

              <div className="nsh-plan-price">
                {displayMonthly === 0 ? (
                  <span className="nsh-plan-amount">Free</span>
                ) : (
                  <>
                    <span className="nsh-plan-amount">{formatPrice(monthlyPrice)}</span>
                    <span className="nsh-plan-period">/month</span>
                    {billing === 'annual' && (
                      <div className="nsh-plan-annual-total">
                        {formatPrice(price)} billed annually
                      </div>
                    )}
                  </>
                )}
              </div>

              <ul className="nsh-plan-features">
                {features.highlights.map((f, i) => (
                  <li key={i}>
                    <i className="fas fa-check"></i>
                    <span>{f}</span>
                  </li>
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
                  ) : isDowngrade ? 'Downgrade' : (
                    `Get ${plan.name}`
                  )}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Current subscription management */}
      {subscription && (
        <div className="nsh-subscription-manage">
          <h3>Manage Subscription</h3>
          <p>
            Status: <strong>{subscription.status}</strong>
            {subscription.on_trial && ' (Trial)'}
            {subscription.on_grace_period && ' (Cancelling)'}
          </p>
          {subscription.status === 'active' && !subscription.on_grace_period && (
            <button className="nsh-manage-btn nsh-manage-cancel" onClick={handleCancel}>
              Cancel Subscription
            </button>
          )}
          {subscription.on_grace_period && (
            <button className="nsh-manage-btn nsh-manage-resume" onClick={handleResume}>
              Resume Subscription
            </button>
          )}
        </div>
      )}

      {/* Quran note */}
      <div className="nsh-pricing-note">
        <i className="fas fa-book-quran"></i>
        <p>Quran recitations are always free on all plans. Knowledge of the Quran should never be behind a paywall.</p>
      </div>
    </div>
  )
}
