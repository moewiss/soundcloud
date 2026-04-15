import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../services/api'
import toast from 'react-hot-toast'

const PRODUCT_META = {
  'featured-boost': {
    icon: 'fas fa-star',
    color: 'var(--sp-gold, #C9A24D)',
    gradient: 'linear-gradient(135deg, rgba(201,162,77,0.15), rgba(201,162,77,0.05))',
    tagline: 'Get featured on the home page',
  },
  'discovery-push': {
    icon: 'fas fa-compass',
    color: 'var(--sp-green, #1A7050)',
    gradient: 'linear-gradient(135deg, rgba(26,112,80,0.15), rgba(26,112,80,0.05))',
    tagline: 'Appear in search & For You feeds',
  },
  'hero-spotlight': {
    icon: 'fas fa-bolt',
    color: '#E8A838',
    gradient: 'linear-gradient(135deg, rgba(232,168,56,0.15), rgba(232,168,56,0.05))',
    tagline: 'Full-width banner on the home page',
  },
  'playlist-feature': {
    icon: 'fas fa-list-music',
    color: '#8B5CF6',
    gradient: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(139,92,246,0.05))',
    tagline: 'Featured in curated playlists',
  },
}

// Fallback icon for playlist-feature since fa-list-music may not exist in all FA versions
const PRODUCT_ICON_FALLBACK = {
  'playlist-feature': 'fas fa-list',
}

function formatCents(cents) {
  if (cents == null) return '$0.00'
  const dollars = cents / 100
  if (dollars >= 1) return `$${dollars.toFixed(2)}`
  return `$${dollars.toFixed(2)}`
}

function formatCentsShort(cents) {
  if (cents == null) return '$0'
  const dollars = cents / 100
  if (Number.isInteger(dollars)) return `$${dollars}`
  return `$${dollars.toFixed(2)}`
}

export default function PromoteTrack() {
  const [tracks, setTracks] = useState([])
  const [promotions, setPromotions] = useState([])
  const [products, setProducts] = useState([])
  const [freePromotionsRemaining, setFreePromotionsRemaining] = useState(0)
  const [step, setStep] = useState(1)
  const [selectedTrack, setSelectedTrack] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [budgetCents, setBudgetCents] = useState(500) // $5.00 default for CPC
  const [durationDays, setDurationDays] = useState(3) // default for CPD
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [canPromote, setCanPromote] = useState(true)
  const [userPlan, setUserPlan] = useState('free')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    loadData()
    if (searchParams.get('promotion') === 'success') {
      toast.success('Payment received! Your promotion will be active shortly.')
    }
    if (searchParams.get('promotion') === 'cancelled') {
      toast('Promotion payment cancelled. No charges were made.', { icon: 'ℹ️' })
    }
  }, [])

  const loadData = async () => {
    try {
      const [tracksRes, promoRes, pricingRes] = await Promise.all([
        api.getMyTracks(),
        api.getPromotions(),
        api.getPromotionPricing(),
      ])
      const allTracks = Array.isArray(tracksRes) ? tracksRes : (tracksRes?.tracks || tracksRes?.data || [])
      setTracks(allTracks.filter(t => t.status === 'approved'))
      setPromotions(promoRes.promotions || [])
      setProducts(pricingRes.products || [])
      setFreePromotionsRemaining(pricingRes.free_promotions_remaining || 0)
      setCanPromote(pricingRes.can_promote !== false)
      setUserPlan(pricingRes.plan || 'free')
    } catch (e) {
      // fetch error
      toast.error('Failed to load promotion data')
    } finally {
      setLoading(false)
    }
  }

  const isFree = freePromotionsRemaining > 0

  const estimatedClicks = useMemo(() => {
    if (!selectedProduct || selectedProduct.pricing_model !== 'cpc') return 0
    if (selectedProduct.rate_cents <= 0) return 0
    return Math.floor(budgetCents / selectedProduct.rate_cents)
  }, [selectedProduct, budgetCents])

  const totalCostCents = useMemo(() => {
    if (!selectedProduct) return 0
    if (selectedProduct.pricing_model === 'cpc') return budgetCents
    // CPD: rate_cents per day * days
    return selectedProduct.rate_cents * durationDays
  }, [selectedProduct, budgetCents, durationDays])

  const handleSelectProduct = (product) => {
    setSelectedProduct(product)
    // Set sensible defaults
    if (product.pricing_model === 'cpc') {
      setBudgetCents(Math.max(product.min_budget_cents || 500, 500))
    } else {
      setDurationDays(3)
    }
  }

  const handlePromote = async () => {
    if (!selectedTrack || !selectedProduct) return
    setSubmitting(true)
    try {
      const data = { track_id: selectedTrack.id, promotion_product_id: selectedProduct.id }
      if (selectedProduct.pricing_model === 'cpc') {
        data.budget_cents = budgetCents
      } else {
        data.duration_days = durationDays
      }
      const res = await api.promoteTrack(data)
      if (res.checkout_url) {
        window.location.href = res.checkout_url
      } else {
        toast.success('Promotion activated with your free credit!')
        setStep(1)
        setSelectedTrack(null)
        setSelectedProduct(null)
        loadData()
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to create promotion')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = async (promoId) => {
    if (!confirm('Are you sure you want to cancel this promotion?')) return
    try {
      await api.cancelPromotion(promoId)
      toast.success('Promotion cancelled')
      loadData()
    } catch (e) {
      toast.error('Failed to cancel')
    }
  }

  const getProductMeta = (slug) => PRODUCT_META[slug] || {
    icon: 'fas fa-bullhorn',
    color: 'var(--sp-green)',
    gradient: 'linear-gradient(135deg, rgba(26,112,80,0.15), rgba(26,112,80,0.05))',
    tagline: '',
  }

  const getProductIcon = (slug) => {
    const meta = getProductMeta(slug)
    return PRODUCT_ICON_FALLBACK[slug] || meta.icon
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <div style={{ color: 'var(--sp-text-muted)', fontSize: '0.9rem' }}>Loading...</div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '30px 20px 100px' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, var(--sp-gold, #C9A24D), var(--sp-gold-light, #D9B563))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <i className="fas fa-rocket" style={{ color: '#fff', fontSize: '1rem' }}></i>
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--sp-text)', margin: 0 }}>Promote Your Track</h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--sp-text-muted)', margin: 0 }}>Boost your reach with targeted promotions</p>
          </div>
        </div>
      </div>

      {/* Plan upgrade wall for non-artist plans */}
      {!canPromote && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(201,162,77,0.08), rgba(201,162,77,0.02))',
          border: '1px solid rgba(201,162,77,0.2)',
          borderRadius: 16, padding: '32px 24px', textAlign: 'center', marginBottom: 28,
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(135deg, var(--sp-gold, #C9A24D), #D9B563)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <i className="fas fa-crown" style={{ color: '#fff', fontSize: '1.4rem' }}></i>
          </div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--sp-text)', margin: '0 0 8px' }}>
            Promotions Available on Artist Plans
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--sp-text-muted)', margin: '0 0 20px', maxWidth: 400, marginLeft: 'auto', marginRight: 'auto' }}>
            Track promotion is available for <strong>Artist</strong> and <strong>Artist Pro</strong> subscribers.
            Artist Pro includes 2 free promotions per month!
          </p>
          <button
            onClick={() => navigate('/pricing')}
            style={{
              padding: '12px 32px', borderRadius: 50, border: 'none', fontSize: '0.88rem',
              fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              background: 'linear-gradient(135deg, #C9A24D, #A88834)', color: '#0F1E1A',
              boxShadow: '0 2px 12px rgba(201,162,77,0.3)',
            }}
          >
            <i className="fas fa-arrow-up" style={{ marginRight: 8 }}></i>
            Upgrade to Artist Plan
          </button>
        </div>
      )}

      {canPromote && <>
      {/* Free credits banner */}
      {freePromotionsRemaining > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(26,112,80,0.1), rgba(201,162,77,0.1))',
          border: '1px solid rgba(26,112,80,0.2)',
          borderRadius: 14, padding: '14px 18px', marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <i className="fas fa-gift" style={{ color: 'var(--sp-green)', fontSize: '1.1rem' }}></i>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--sp-text)' }}>
              You have {freePromotionsRemaining} free promotion{freePromotionsRemaining > 1 ? 's' : ''} this month!
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--sp-text-sub)' }}>
              Included with your Artist Pro plan
            </div>
          </div>
        </div>
      )}

      {/* Frequency cap notice */}
      <div style={{
        background: 'var(--sp-bg-card)', border: '1px solid var(--sp-border)',
        borderRadius: 14, padding: '12px 16px', marginBottom: 24,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <i className="fas fa-info-circle" style={{ color: 'var(--sp-text-muted)', fontSize: '0.85rem', flexShrink: 0 }}></i>
        <div style={{ fontSize: '0.75rem', color: 'var(--sp-text-muted)', lineHeight: 1.4 }}>
          Promotions are shown to each listener at most <strong style={{ color: 'var(--sp-text-sub)' }}>3 times per 7 days</strong> to ensure a great experience.
          Only approved tracks are eligible. Quran content cannot be promoted.
        </div>
      </div>

      {/* Active promotions */}
      {promotions.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--sp-text)', marginBottom: 12 }}>Your Promotions</h2>
          {promotions.map(promo => {
            const promoProduct = products.find(p => p.id === promo.promotion_product_id)
            const promoMeta = getProductMeta(promoProduct?.slug || '')
            return (
              <div key={promo.id} style={{
                background: 'var(--sp-bg-card)', borderRadius: 14,
                border: '1px solid var(--sp-border)',
                padding: '14px 16px', marginBottom: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                  {promo.track?.cover_url && (
                    <img src={promo.track.cover_url} alt="" style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                  )}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--sp-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {promo.track?.title || promo.name}
                    </div>
                    <div style={{ fontSize: '0.73rem', color: 'var(--sp-text-muted)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      {promoProduct && (
                        <span style={{
                          padding: '1px 7px', borderRadius: 5, fontSize: '0.62rem', fontWeight: 600,
                          background: `${promoMeta.color}18`, color: promoMeta.color,
                        }}>{promoProduct.name}</span>
                      )}
                      <span>{promo.start_date} — {promo.end_date}</span>
                      <span style={{
                        padding: '1px 8px', borderRadius: 6, fontSize: '0.65rem', fontWeight: 600,
                        background: promo.status === 'active' ? 'rgba(26,112,80,0.12)' : promo.status === 'draft' ? 'rgba(230,160,30,0.12)' : 'rgba(150,150,150,0.12)',
                        color: promo.status === 'active' ? 'var(--sp-green)' : promo.status === 'draft' ? '#e6a01e' : 'var(--sp-text-muted)',
                      }}>{promo.status === 'draft' ? 'Awaiting Payment' : promo.status}</span>
                    </div>
                  </div>
                </div>
                {promo.status === 'active' && (
                  <button onClick={() => handleCancel(promo.id)} style={{
                    background: 'none', border: '1px solid var(--sp-border)', borderRadius: 8,
                    padding: '6px 14px', fontSize: '0.75rem', color: 'var(--sp-text-muted)',
                    cursor: 'pointer', flexShrink: 0, marginLeft: 10,
                  }}>Cancel</button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Step indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 24 }}>
        {[1, 2, 3].map(s => (
          <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '0.78rem',
              background: step >= s ? 'linear-gradient(135deg, var(--sp-green), var(--sp-green-light))' : 'var(--sp-bg-highlight)',
              color: step >= s ? '#fff' : 'var(--sp-text-muted)',
              transition: 'all 0.3s ease',
            }}>{s}</div>
            {s < 3 && <div style={{ width: 50, height: 2, background: step > s ? 'var(--sp-green)' : 'var(--sp-bg-highlight)', transition: 'all 0.3s ease' }} />}
          </div>
        ))}
        <div style={{ marginLeft: 12, fontSize: '0.8rem', color: 'var(--sp-text-sub)', fontWeight: 500 }}>
          {step === 1 && 'Select a track'}
          {step === 2 && 'Choose promotion type'}
          {step === 3 && 'Confirm & pay'}
        </div>
      </div>

      {/* Step 1: Select Track */}
      {step === 1 && (
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--sp-text)', marginBottom: 12 }}>Choose a track to promote</h2>
          {tracks.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--sp-text-muted)' }}>
              <i className="fas fa-music" style={{ fontSize: '2rem', marginBottom: 12, display: 'block', opacity: 0.4 }}></i>
              <div>No approved tracks yet. <span style={{ color: 'var(--sp-green)', cursor: 'pointer' }} onClick={() => navigate('/upload')}>Upload one first</span></div>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tracks.map(track => {
              const alreadyPromoted = promotions.some(p => p.track?.id === track.id && (p.status === 'active' || p.status === 'draft'))
              const isQuran = (track.category || '').toLowerCase() === 'quran' || (track.genre || '').toLowerCase() === 'quran'
              const disabled = alreadyPromoted || isQuran
              return (
                <div
                  key={track.id}
                  onClick={() => { if (!disabled) { setSelectedTrack(track); setStep(2) } }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '12px 16px', borderRadius: 14,
                    background: disabled ? 'var(--sp-bg-highlight)' : 'var(--sp-bg-card)',
                    border: '1px solid var(--sp-border)',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.6 : 1,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => { if (!disabled) e.currentTarget.style.borderColor = 'var(--sp-gold)' }}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--sp-border, rgba(60,60,67,0.08))'}
                >
                  <div style={{ width: 48, height: 48, borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
                    {track.cover_url ? (
                      <img src={track.cover_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{
                        width: '100%', height: '100%',
                        background: 'linear-gradient(135deg, var(--sp-green), var(--sp-green-dark))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}><i className="fas fa-music" style={{ color: 'rgba(255,255,255,0.6)' }}></i></div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--sp-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.title}</div>
                    <div style={{ fontSize: '0.73rem', color: 'var(--sp-text-muted)' }}>
                      {track.category}{(track.plays_count || track.plays) ? ` \u00b7 ${(track.plays_count || track.plays)} plays` : ''}
                    </div>
                  </div>
                  {alreadyPromoted ? (
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--sp-gold)', background: 'rgba(201,162,77,0.1)', padding: '3px 10px', borderRadius: 6 }}>Already promoted</span>
                  ) : isQuran ? (
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--sp-text-muted)', background: 'rgba(150,150,150,0.1)', padding: '3px 10px', borderRadius: 6 }}>Quran - not eligible</span>
                  ) : (
                    <i className="fas fa-chevron-right" style={{ color: 'var(--sp-text-muted)', fontSize: '0.8rem' }}></i>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Step 2: Choose Promotion Product */}
      {step === 2 && selectedTrack && (
        <div>
          {/* Selected track preview */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
            borderRadius: 14, background: 'var(--sp-bg-card)', border: '1px solid var(--sp-border)', marginBottom: 20,
          }}>
            <div style={{ width: 52, height: 52, borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
              {selectedTrack.cover_url ? (
                <img src={selectedTrack.cover_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: 'var(--sp-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fas fa-music" style={{ color: '#fff' }}></i>
                </div>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--sp-text)' }}>{selectedTrack.title}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--sp-text-muted)' }}>Promoting this track</div>
            </div>
            <button onClick={() => { setStep(1); setSelectedTrack(null); setSelectedProduct(null) }} style={{
              background: 'none', border: 'none', color: 'var(--sp-text-muted)', cursor: 'pointer', fontSize: '0.78rem',
            }}>Change</button>
          </div>

          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--sp-text)', marginBottom: 14 }}>Choose promotion type</h2>

          {/* Product cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {products.map(product => {
              const meta = getProductMeta(product.slug)
              const iconClass = getProductIcon(product.slug)
              const isSelected = selectedProduct?.id === product.id
              const isCPC = product.pricing_model === 'cpc'

              return (
                <div
                  key={product.id}
                  onClick={() => handleSelectProduct(product)}
                  style={{
                    borderRadius: 14, cursor: 'pointer',
                    background: isSelected ? meta.gradient : 'var(--sp-bg-card)',
                    border: isSelected ? `2px solid ${meta.color}` : '1px solid var(--sp-border)',
                    padding: isSelected ? '17px 17px' : '18px 18px',
                    transition: 'all 0.25s ease',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = meta.color }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = 'var(--sp-border, rgba(60,60,67,0.08))' }}
                >
                  {/* Glass accent */}
                  {isSelected && (
                    <div style={{
                      position: 'absolute', top: -30, right: -30,
                      width: 100, height: 100, borderRadius: '50%',
                      background: `${meta.color}10`,
                      pointerEvents: 'none',
                    }} />
                  )}

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    {/* Icon */}
                    <div style={{
                      width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                      background: `${meta.color}18`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <i className={iconClass} style={{ color: meta.color, fontSize: '1rem' }}></i>
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--sp-text)' }}>{product.name}</span>
                        <span style={{
                          padding: '2px 8px', borderRadius: 6, fontSize: '0.6rem', fontWeight: 700,
                          textTransform: 'uppercase', letterSpacing: '0.04em',
                          background: isCPC ? 'rgba(201,162,77,0.12)' : 'rgba(139,92,246,0.12)',
                          color: isCPC ? 'var(--sp-gold, #C9A24D)' : '#8B5CF6',
                        }}>{isCPC ? 'Per Click' : 'Per Day'}</span>
                        {isFree && (
                          <span style={{
                            padding: '2px 8px', borderRadius: 6, fontSize: '0.58rem', fontWeight: 700,
                            background: 'rgba(26,112,80,0.12)', color: 'var(--sp-green)',
                          }}>
                            <i className="fas fa-gift" style={{ marginRight: 3, fontSize: '0.5rem' }}></i>
                            Free credit
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--sp-text-muted)', marginBottom: 6 }}>
                        {product.placement || meta.tagline}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: meta.color }}>
                          {formatCents(product.rate_cents)}/{isCPC ? 'click' : 'day'}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--sp-text-muted)' }}>
                          Min {formatCentsShort(product.min_budget_cents)} {isCPC ? 'budget' : ''} · Up to {product.max_duration_days} days
                        </span>
                      </div>
                    </div>

                    {/* Selection indicator */}
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                      border: isSelected ? `2px solid ${meta.color}` : '2px solid var(--sp-border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s ease',
                    }}>
                      {isSelected && (
                        <div style={{
                          width: 12, height: 12, borderRadius: '50%',
                          background: meta.color,
                        }} />
                      )}
                    </div>
                  </div>

                  {/* Expanded configuration area */}
                  {isSelected && (
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--sp-border)' }} onClick={e => e.stopPropagation()}>
                      {isCPC ? (
                        /* CPC: Budget slider */
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--sp-text)' }}>
                              <i className="fas fa-wallet" style={{ marginRight: 6, color: 'var(--sp-gold)', fontSize: '0.75rem' }}></i>
                              Budget
                            </span>
                            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--sp-gold, #C9A24D)' }}>
                              {isFree ? (
                                <><span style={{ textDecoration: 'line-through', color: 'var(--sp-text-muted)', fontSize: '0.85rem', marginRight: 6 }}>{formatCents(budgetCents)}</span>Free</>
                              ) : (
                                formatCents(budgetCents)
                              )}
                            </span>
                          </div>

                          {/* Slider */}
                          <div style={{ position: 'relative', marginBottom: 8 }}>
                            <input
                              type="range"
                              min={product.min_budget_cents}
                              max={Math.max(product.min_budget_cents * 20, 10000)}
                              step={50}
                              value={budgetCents}
                              onChange={e => setBudgetCents(Number(e.target.value))}
                              style={{
                                width: '100%', height: 6, appearance: 'none', WebkitAppearance: 'none',
                                borderRadius: 3, outline: 'none', cursor: 'pointer',
                                background: `linear-gradient(to right, var(--sp-gold, #C9A24D) ${((budgetCents - product.min_budget_cents) / (Math.max(product.min_budget_cents * 20, 10000) - product.min_budget_cents)) * 100}%, var(--sp-bg-highlight) ${((budgetCents - product.min_budget_cents) / (Math.max(product.min_budget_cents * 20, 10000) - product.min_budget_cents)) * 100}%)`,
                                accentColor: 'var(--sp-gold, #C9A24D)',
                              }}
                            />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--sp-text-muted)' }}>
                            <span>Min {formatCentsShort(product.min_budget_cents)}</span>
                            <span>Max {formatCentsShort(Math.max(product.min_budget_cents * 20, 10000))}</span>
                          </div>

                          {/* Estimated clicks */}
                          <div style={{
                            marginTop: 14, padding: '12px 14px', borderRadius: 10,
                            background: 'rgba(201,162,77,0.06)', border: '1px solid rgba(201,162,77,0.12)',
                            display: 'flex', alignItems: 'center', gap: 10,
                          }}>
                            <i className="fas fa-mouse-pointer" style={{ color: 'var(--sp-gold)', fontSize: '0.85rem' }}></i>
                            <div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--sp-text-sub)' }}>Estimated clicks</div>
                              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--sp-text)' }}>
                                ~{estimatedClicks.toLocaleString()} clicks
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* CPD: Duration selector */
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--sp-text)' }}>
                              <i className="fas fa-calendar-alt" style={{ marginRight: 6, color: '#8B5CF6', fontSize: '0.75rem' }}></i>
                              Duration
                            </span>
                            <span style={{ fontSize: '0.78rem', color: 'var(--sp-text-muted)' }}>
                              Max {product.max_duration_days} days
                            </span>
                          </div>

                          {/* Duration pill selector */}
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                            {[3, 7, 14, 30].filter(d => d <= product.max_duration_days).map(d => (
                              <button
                                key={d}
                                onClick={() => setDurationDays(d)}
                                style={{
                                  padding: '8px 16px', borderRadius: 10, cursor: 'pointer',
                                  border: durationDays === d ? '2px solid #8B5CF6' : '1px solid var(--sp-border)',
                                  background: durationDays === d ? 'rgba(139,92,246,0.1)' : 'var(--sp-bg-highlight)',
                                  color: durationDays === d ? '#8B5CF6' : 'var(--sp-text-sub)',
                                  fontWeight: durationDays === d ? 700 : 500,
                                  fontSize: '0.82rem',
                                  transition: 'all 0.2s ease',
                                }}
                              >
                                {d} {d === 1 ? 'day' : 'days'}
                              </button>
                            ))}
                          </div>

                          {/* Custom duration input */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                            <span style={{ fontSize: '0.78rem', color: 'var(--sp-text-muted)' }}>or custom:</span>
                            <input
                              type="number"
                              min={1}
                              max={product.max_duration_days}
                              value={durationDays}
                              onChange={e => {
                                const v = Math.max(1, Math.min(product.max_duration_days, Number(e.target.value) || 1))
                                setDurationDays(v)
                              }}
                              style={{
                                width: 70, padding: '6px 10px', borderRadius: 8,
                                border: '1px solid var(--sp-border)',
                                background: 'var(--sp-bg-highlight)',
                                color: 'var(--sp-text)', fontSize: '0.85rem', fontWeight: 600,
                                textAlign: 'center', outline: 'none',
                              }}
                            />
                            <span style={{ fontSize: '0.78rem', color: 'var(--sp-text-muted)' }}>days</span>
                          </div>

                          {/* Total cost display */}
                          <div style={{
                            padding: '12px 14px', borderRadius: 10,
                            background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.12)',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <i className="fas fa-tag" style={{ color: '#8B5CF6', fontSize: '0.85rem' }}></i>
                              <div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--sp-text-sub)' }}>Total cost</div>
                                <div style={{ fontSize: '0.68rem', color: 'var(--sp-text-muted)' }}>
                                  {formatCents(product.rate_cents)}/day x {durationDays} day{durationDays > 1 ? 's' : ''}
                                </div>
                              </div>
                            </div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: isFree ? 'var(--sp-green)' : 'var(--sp-text)' }}>
                              {isFree ? (
                                <><span style={{ textDecoration: 'line-through', color: 'var(--sp-text-muted)', fontSize: '0.85rem', marginRight: 6 }}>{formatCents(totalCostCents)}</span>Free</>
                              ) : (
                                formatCents(totalCostCents)
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Continue / Back buttons */}
          <button
            onClick={() => {
              if (!selectedProduct) {
                toast.error('Please select a promotion type')
                return
              }
              setStep(3)
            }}
            style={{
              width: '100%', marginTop: 20, padding: '14px',
              borderRadius: 12, border: 'none', cursor: selectedProduct ? 'pointer' : 'not-allowed',
              background: selectedProduct
                ? 'linear-gradient(135deg, var(--sp-green), var(--sp-green-light))'
                : 'var(--sp-bg-highlight)',
              color: selectedProduct ? '#fff' : 'var(--sp-text-muted)',
              fontWeight: 700, fontSize: '0.92rem',
              opacity: selectedProduct ? 1 : 0.6,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { if (selectedProduct) e.currentTarget.style.opacity = '0.9' }}
            onMouseLeave={e => { if (selectedProduct) e.currentTarget.style.opacity = '1' }}
          >
            Continue
          </button>
          <button onClick={() => { setStep(1); setSelectedTrack(null); setSelectedProduct(null) }} style={{
            width: '100%', marginTop: 8, padding: '10px', borderRadius: 12,
            border: '1px solid var(--sp-border)', background: 'none',
            color: 'var(--sp-text-muted)', cursor: 'pointer', fontSize: '0.85rem',
          }}>Back</button>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && selectedTrack && selectedProduct && (
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--sp-text)', marginBottom: 16 }}>Confirm your promotion</h2>

          <div style={{
            borderRadius: 14, background: 'var(--sp-bg-card)', border: '1px solid var(--sp-border)',
            overflow: 'hidden',
          }}>
            {/* Track */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderBottom: '1px solid var(--sp-border)' }}>
              <div style={{ width: 56, height: 56, borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
                {selectedTrack.cover_url ? (
                  <img src={selectedTrack.cover_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: 'var(--sp-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fas fa-music" style={{ color: '#fff' }}></i>
                  </div>
                )}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--sp-text)' }}>{selectedTrack.title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--sp-text-muted)' }}>{selectedTrack.category}</div>
              </div>
            </div>

            {/* Product summary */}
            <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--sp-border)' }}>
              {(() => {
                const meta = getProductMeta(selectedProduct.slug)
                const iconClass = getProductIcon(selectedProduct.slug)
                const isCPC = selectedProduct.pricing_model === 'cpc'
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                      background: `${meta.color}18`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <i className={iconClass} style={{ color: meta.color, fontSize: '0.9rem' }}></i>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--sp-text)' }}>{selectedProduct.name}</div>
                      <div style={{ fontSize: '0.73rem', color: 'var(--sp-text-muted)' }}>
                        {selectedProduct.placement || meta.tagline}
                      </div>
                    </div>
                    <span style={{
                      marginLeft: 'auto',
                      padding: '3px 10px', borderRadius: 6, fontSize: '0.65rem', fontWeight: 700,
                      textTransform: 'uppercase',
                      background: isCPC ? 'rgba(201,162,77,0.12)' : 'rgba(139,92,246,0.12)',
                      color: isCPC ? 'var(--sp-gold, #C9A24D)' : '#8B5CF6',
                    }}>{isCPC ? 'CPC' : 'CPD'}</span>
                  </div>
                )
              })()}
            </div>

            {/* Details */}
            <div style={{ padding: '16px 18px' }}>
              {selectedProduct.pricing_model === 'cpc' ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ color: 'var(--sp-text-sub)', fontSize: '0.85rem' }}>Rate</span>
                    <span style={{ fontWeight: 600, color: 'var(--sp-text)', fontSize: '0.85rem' }}>{formatCents(selectedProduct.rate_cents)}/click</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ color: 'var(--sp-text-sub)', fontSize: '0.85rem' }}>Budget</span>
                    <span style={{ fontWeight: 600, color: 'var(--sp-text)', fontSize: '0.85rem' }}>{formatCents(budgetCents)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ color: 'var(--sp-text-sub)', fontSize: '0.85rem' }}>Estimated clicks</span>
                    <span style={{ fontWeight: 600, color: 'var(--sp-text)', fontSize: '0.85rem' }}>~{estimatedClicks.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ color: 'var(--sp-text-sub)', fontSize: '0.85rem' }}>Max duration</span>
                    <span style={{ fontWeight: 600, color: 'var(--sp-text)', fontSize: '0.85rem' }}>Up to {selectedProduct.max_duration_days} days</span>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ color: 'var(--sp-text-sub)', fontSize: '0.85rem' }}>Rate</span>
                    <span style={{ fontWeight: 600, color: 'var(--sp-text)', fontSize: '0.85rem' }}>{formatCents(selectedProduct.rate_cents)}/day</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ color: 'var(--sp-text-sub)', fontSize: '0.85rem' }}>Duration</span>
                    <span style={{ fontWeight: 600, color: 'var(--sp-text)', fontSize: '0.85rem' }}>{durationDays} day{durationDays > 1 ? 's' : ''}</span>
                  </div>
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ color: 'var(--sp-text-sub)', fontSize: '0.85rem' }}>Placement</span>
                <span style={{ fontWeight: 600, color: 'var(--sp-text)', fontSize: '0.85rem' }}>{selectedProduct.placement || getProductMeta(selectedProduct.slug).tagline}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ color: 'var(--sp-text-sub)', fontSize: '0.85rem' }}>Start</span>
                <span style={{ fontWeight: 600, color: 'var(--sp-text)', fontSize: '0.85rem' }}>Immediately</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ color: 'var(--sp-text-sub)', fontSize: '0.85rem' }}>Frequency cap</span>
                <span style={{ fontWeight: 600, color: 'var(--sp-text)', fontSize: '0.85rem' }}>3x per user per 7 days</span>
              </div>

              <div style={{ height: 1, background: 'var(--sp-border)', margin: '14px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: 'var(--sp-text)', fontSize: '1rem' }}>Total</span>
                {isFree ? (
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ textDecoration: 'line-through', color: 'var(--sp-text-muted)', fontSize: '0.85rem', marginRight: 8 }}>{formatCents(totalCostCents)}</span>
                    <span style={{ fontWeight: 700, color: 'var(--sp-green)', fontSize: '1.2rem' }}>Free</span>
                    <div style={{ fontSize: '0.65rem', color: 'var(--sp-text-muted)' }}>Artist Pro perk</div>
                  </div>
                ) : (
                  <span style={{ fontWeight: 700, color: 'var(--sp-gold, #C9A24D)', fontSize: '1.3rem' }}>{formatCents(totalCostCents)}</span>
                )}
              </div>
            </div>
          </div>

          {/* Estimated reach info */}
          <div style={{
            marginTop: 14, padding: '12px 16px', borderRadius: 12,
            background: 'var(--sp-bg-card)', border: '1px solid var(--sp-border)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <i className="fas fa-chart-line" style={{ color: 'var(--sp-green)', fontSize: '0.85rem' }}></i>
            <div style={{ fontSize: '0.78rem', color: 'var(--sp-text-sub)', lineHeight: 1.4 }}>
              {selectedProduct.pricing_model === 'cpc' ? (
                <>Estimated <strong style={{ color: 'var(--sp-text)' }}>~{estimatedClicks.toLocaleString()} clicks</strong> based on your budget of {formatCents(budgetCents)} at {formatCents(selectedProduct.rate_cents)}/click.</>
              ) : (
                <>Your track will be featured for <strong style={{ color: 'var(--sp-text)' }}>{durationDays} day{durationDays > 1 ? 's' : ''}</strong> at {formatCents(selectedProduct.rate_cents)}/day.</>
              )}
            </div>
          </div>

          <button
            onClick={handlePromote}
            disabled={submitting}
            style={{
              width: '100%', marginTop: 20, padding: '14px',
              borderRadius: 12, border: 'none', cursor: submitting ? 'wait' : 'pointer',
              background: isFree
                ? 'linear-gradient(135deg, var(--sp-green), var(--sp-green-light))'
                : 'linear-gradient(135deg, var(--sp-gold), var(--sp-gold-light))',
              color: isFree ? '#fff' : '#111',
              fontWeight: 700, fontSize: '0.92rem',
              opacity: submitting ? 0.7 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            {submitting ? 'Processing...' : isFree ? 'Activate Free Promotion' : `Pay ${formatCents(totalCostCents)} & Promote`}
          </button>
          <button onClick={() => setStep(2)} style={{
            width: '100%', marginTop: 8, padding: '10px', borderRadius: 12,
            border: '1px solid var(--sp-border)', background: 'none',
            color: 'var(--sp-text-muted)', cursor: 'pointer', fontSize: '0.85rem',
          }}>Back</button>

          {!isFree && (
            <div style={{ textAlign: 'center', marginTop: 14, fontSize: '0.72rem', color: 'var(--sp-text-muted)' }}>
              <i className="fas fa-lock" style={{ marginRight: 4 }}></i>
              Secure payment via Stripe. You'll be redirected to checkout.
            </div>
          )}
        </div>
      )}
      </>}
    </div>
  )
}
