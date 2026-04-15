import { useState, useEffect, useRef, useCallback } from 'react'
import { api } from '../services/api'

export default function SponsoredTrack({ onPlay, currentTrack, isPlaying, navigate, style }) {
  const [items, setItems] = useState([])
  const [viewedIds, setViewedIds] = useState(new Set())
  const containerRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    api.getSponsoredTracks().then(res => {
      if (!cancelled && res.tracks?.length > 0) {
        setItems(res.tracks)
      }
    }).catch(() => {})
    return () => { cancelled = true }
  }, [])

  // Record view impression via IntersectionObserver
  const observerRef = useRef(null)
  const setRef = useCallback((node) => {
    if (observerRef.current) observerRef.current.disconnect()
    if (!node) return
    containerRef.current = node
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          items.forEach(item => {
            if (!viewedIds.has(item.ad_id)) {
              setViewedIds(prev => new Set([...prev, item.ad_id]))
              api.recordAdImpression(item.ad_id, 'view').catch(() => {})
            }
          })
        }
      },
      { threshold: 0.3 }
    )
    observerRef.current.observe(node)
  }, [items, viewedIds])

  useEffect(() => {
    return () => { if (observerRef.current) observerRef.current.disconnect() }
  }, [])

  if (!items.length) return null

  const handlePlay = (item, e) => {
    e.stopPropagation()
    api.recordAdImpression(item.ad_id, 'click').catch(() => {})
    if (onPlay) onPlay(item.track, items.map(i => i.track))
  }

  const handleNavigate = (item) => {
    api.recordAdImpression(item.ad_id, 'click').catch(() => {})
    if (navigate) navigate(`/tracks/${item.track.id}`)
  }

  const formatDuration = (s) => {
    if (!s) return ''
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const formatPlays = (n) => {
    if (!n) return '0'
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
    return n.toString()
  }

  return (
    <div ref={setRef} style={{ padding: '0 20px', ...style }}>
      {/* Section header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        marginBottom: 14, paddingLeft: 2,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: 'linear-gradient(135deg, var(--sp-gold, #C9A24D), var(--sp-gold-light, #D9B563))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff">
            <path d="M12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2Z"/>
          </svg>
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--sp-text, #1C2B29)', lineHeight: 1.2 }}>
            Promoted Tracks
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--sp-text-muted, #8FA09D)', marginTop: 1 }}>
            Sponsored
          </div>
        </div>
      </div>

      {/* Track cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map(item => {
          const track = item.track
          const isCurrent = currentTrack?.id === track.id

          return (
            <div
              key={item.ad_id}
              onClick={() => handleNavigate(item)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '12px 14px',
                borderRadius: 14,
                background: isCurrent
                  ? 'linear-gradient(135deg, rgba(201,162,77,0.12), rgba(26,112,80,0.08))'
                  : 'var(--sp-bg-card, #FEFCF8)',
                boxShadow: '0 1px 8px rgba(0,0,0,0.04), 0 0 0 1px rgba(201,162,77,0.12)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08), 0 0 0 1px rgba(201,162,77,0.2)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.boxShadow = '0 1px 8px rgba(0,0,0,0.04), 0 0 0 1px rgba(201,162,77,0.12)' }}
            >
              {/* Gold left accent */}
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
                background: 'linear-gradient(180deg, var(--sp-gold, #C9A24D), var(--sp-gold-light, #D9B563))',
                borderRadius: '14px 0 0 14px',
              }} />

              {/* Cover art */}
              <div style={{
                width: 56, height: 56, borderRadius: 10, overflow: 'hidden',
                flexShrink: 0, position: 'relative',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}>
                {track.cover_url ? (
                  <img src={track.cover_url} alt={track.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                ) : (
                  <div style={{
                    width: '100%', height: '100%',
                    background: 'linear-gradient(135deg, var(--sp-green, #1A7050), var(--sp-green-dark, #145A3E))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="rgba(255,255,255,0.7)">
                      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                    </svg>
                  </div>
                )}
                {/* Play overlay */}
                <button
                  onClick={(e) => handlePlay(item, e)}
                  style={{
                    position: 'absolute', inset: 0,
                    background: isCurrent && isPlaying ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.3)',
                    border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: isCurrent ? 1 : 0,
                    transition: 'opacity 0.2s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = 1}
                  onMouseLeave={e => { if (!isCurrent) e.currentTarget.style.opacity = 0 }}
                >
                  {isCurrent && isPlaying ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
                      <rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  )}
                </button>
              </div>

              {/* Track info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3,
                }}>
                  <div style={{
                    fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--sp-gold, #C9A24D)',
                    background: 'rgba(201,162,77,0.12)',
                    padding: '1px 6px', borderRadius: 4,
                    flexShrink: 0,
                  }}>
                    Promoted
                  </div>
                  <div style={{
                    fontWeight: 700, fontSize: '0.88rem',
                    color: isCurrent ? 'var(--sp-green, #1A7050)' : 'var(--sp-text, #1C2B29)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {track.title}
                  </div>
                </div>
                <div style={{
                  fontSize: '0.78rem', color: 'var(--sp-text-sub, #5A6E6B)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {track.user?.name || track.user?.profile?.display_name || 'Artist'}
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10, marginTop: 4,
                  fontSize: '0.7rem', color: 'var(--sp-text-muted, #8FA09D)',
                }}>
                  {track.plays != null && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                      {formatPlays(track.plays_count || track.plays)}
                    </span>
                  )}
                  {track.duration_seconds && (
                    <span>{formatDuration(track.duration_seconds)}</span>
                  )}
                  {track.category && (
                    <span style={{
                      background: 'var(--sp-bg-highlight, #EDE7DC)',
                      padding: '1px 6px', borderRadius: 4,
                    }}>
                      {track.category}
                    </span>
                  )}
                </div>
              </div>

              {/* Play button on right */}
              <button
                onClick={(e) => handlePlay(item, e)}
                style={{
                  width: 38, height: 38, borderRadius: '50%',
                  border: 'none', cursor: 'pointer', flexShrink: 0,
                  background: isCurrent && isPlaying
                    ? 'var(--sp-gold, #C9A24D)'
                    : 'linear-gradient(135deg, var(--sp-green, #1A7050), var(--sp-green-light, #208A62))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                  transition: 'transform 0.15s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                {isCurrent && isPlaying ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
                    <rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                )}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
