import { useState, useEffect, useRef, useCallback } from 'react'
import { api } from '../services/api'

export default function BannerAd({ placement, style }) {
  const [ads, setAds] = useState([])
  const [current, setCurrent] = useState(0)
  const [viewedIds, setViewedIds] = useState(new Set())
  const [imgLoaded, setImgLoaded] = useState({})
  const containerRef = useRef(null)
  const autoplayRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    api.getBannerAds(placement).then(res => {
      if (!cancelled && res.ads?.length > 0) {
        setAds(res.ads)
      }
    }).catch(() => {})
    return () => { cancelled = true }
  }, [placement])

  // Autoplay — rotate every 6 seconds
  useEffect(() => {
    if (ads.length <= 1) return
    autoplayRef.current = setInterval(() => {
      setCurrent(prev => (prev + 1) % ads.length)
    }, 6000)
    return () => clearInterval(autoplayRef.current)
  }, [ads.length])

  const goTo = (index) => {
    setCurrent(index)
    // Reset autoplay timer on manual navigation
    if (autoplayRef.current) clearInterval(autoplayRef.current)
    if (ads.length > 1) {
      autoplayRef.current = setInterval(() => {
        setCurrent(prev => (prev + 1) % ads.length)
      }, 6000)
    }
  }

  const goPrev = (e) => { e.stopPropagation(); goTo((current - 1 + ads.length) % ads.length) }
  const goNext = (e) => { e.stopPropagation(); goTo((current + 1) % ads.length) }

  // IntersectionObserver to record view impression
  const observerRef = useRef(null)
  const setRef = useCallback((node) => {
    if (observerRef.current) observerRef.current.disconnect()
    if (!node) return
    containerRef.current = node
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && ads[current] && !viewedIds.has(ads[current].id)) {
          setViewedIds(prev => new Set([...prev, ads[current].id]))
          api.recordAdImpression(ads[current].id, 'view').catch(() => {})
        }
      },
      { threshold: 0.5 }
    )
    observerRef.current.observe(node)
  }, [ads, current, viewedIds])

  // Record view when slide changes
  useEffect(() => {
    const ad = ads[current]
    if (ad && containerRef.current && !viewedIds.has(ad.id)) {
      setViewedIds(prev => new Set([...prev, ad.id]))
      api.recordAdImpression(ad.id, 'view').catch(() => {})
    }
  }, [current, ads])

  useEffect(() => {
    return () => { if (observerRef.current) observerRef.current.disconnect() }
  }, [])

  if (!ads.length) return null

  const ad = ads[current]

  const handleClick = () => {
    api.recordAdImpression(ad.id, 'click').catch(() => {})
    if (ad.click_url) window.open(ad.click_url, '_blank', 'noopener')
  }

  const arrowStyle = {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    width: 34,
    height: 34,
    borderRadius: '50%',
    border: 'none',
    background: 'rgba(15,30,26,0.6)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
    transition: 'background 0.2s ease, transform 0.2s ease',
  }

  return (
    <div ref={setRef} style={{ position: 'relative', ...style }}>
      {/* Main card */}
      <div onClick={handleClick} style={{
        cursor: ad.click_url ? 'pointer' : 'default',
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
        background: 'var(--sp-bg-card, #FEFCF8)',
        boxShadow: '0 2px 20px rgba(0,0,0,0.06), 0 0 0 1px rgba(201,162,77,0.15)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.10), 0 0 0 1px rgba(201,162,77,0.25)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 20px rgba(0,0,0,0.06), 0 0 0 1px rgba(201,162,77,0.15)' }}
      >
        {/* Image section */}
        {ad.image_url && (
          <div style={{ position: 'relative', overflow: 'hidden' }}>
            <img
              key={ad.id}
              src={ad.image_url}
              alt={ad.title}
              onLoad={() => setImgLoaded(prev => ({ ...prev, [ad.id]: true }))}
              style={{
                width: '100%',
                display: 'block',
                objectFit: 'contain',
                opacity: imgLoaded[ad.id] ? 1 : 0,
                transition: 'opacity 0.4s ease',
              }}
            />
            {/* Gradient overlay */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: 60,
              background: 'linear-gradient(to top, var(--sp-bg-card, #FEFCF8) 0%, transparent 100%)',
              pointerEvents: 'none',
            }} />
          </div>
        )}

        {/* Sponsored badge */}
        <div style={{
          position: 'absolute', top: 10, right: 10,
          display: 'flex', alignItems: 'center', gap: 4,
          fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
          color: 'var(--sp-gold, #C9A24D)',
          background: 'rgba(15,30,26,0.75)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
          padding: '3px 10px', borderRadius: 20, zIndex: 2,
        }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.9 }}>
            <path d="M12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2Z"/>
          </svg>
          Ad
        </div>

        {/* Content section */}
        <div style={{ padding: '10px 16px 14px' }}>
          <div style={{
            width: 32, height: 2.5, borderRadius: 2,
            background: 'linear-gradient(90deg, var(--sp-gold, #C9A24D), var(--sp-gold-light, #D9B563))',
            marginBottom: 8,
          }} />

          <div style={{
            fontWeight: 700, fontSize: '0.95rem',
            color: 'var(--sp-text, #1C2B29)', lineHeight: 1.35, marginBottom: 4,
          }}>
            {ad.title}
          </div>

          {ad.description && (
            <div style={{
              fontSize: '0.8rem', color: 'var(--sp-text-sub, #5A6E6B)',
              lineHeight: 1.45, marginBottom: 8,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {ad.description}
            </div>
          )}

          {/* CTA row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
            {ad.cta_text ? (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '7px 18px', borderRadius: 10,
                background: 'linear-gradient(135deg, var(--sp-green, #1A7050), var(--sp-green-light, #208A62))',
                color: '#fff', fontWeight: 600, fontSize: '0.78rem', letterSpacing: '0.02em',
              }}>
                {ad.cta_text}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
            ) : ad.click_url && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontSize: '0.75rem', fontWeight: 600, color: 'var(--sp-green, #1A7050)',
              }}>
                Learn more
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Arrow buttons */}
        {ads.length > 1 && (
          <>
            <button onClick={goPrev} style={{ ...arrowStyle, left: 10 }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(15,30,26,0.85)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(15,30,26,0.6)'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
            <button onClick={goNext} style={{ ...arrowStyle, right: 50 }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(15,30,26,0.85)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(15,30,26,0.6)'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Dot indicators */}
      {ads.length > 1 && (
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 6, marginTop: 10,
        }}>
          {ads.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              style={{
                width: current === i ? 20 : 7,
                height: 7,
                borderRadius: 4,
                border: 'none',
                cursor: 'pointer',
                background: current === i
                  ? 'linear-gradient(90deg, var(--sp-gold, #C9A24D), var(--sp-gold-light, #D9B563))'
                  : 'var(--sp-border, rgba(60,60,67,0.15))',
                transition: 'all 0.3s ease',
                padding: 0,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
