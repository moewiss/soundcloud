import { useState, useRef, useCallback, useEffect } from 'react'
import { toast } from 'react-hot-toast'

/* ── Helpers ── */
function parseGradientColors(gradient) {
  const hexes = gradient.match(/#[0-9a-fA-F]{6}/g) || ['#512851', '#9f8e73']
  return hexes.map(h => ({ r: parseInt(h.slice(1, 3), 16), g: parseInt(h.slice(3, 5), 16), b: parseInt(h.slice(5, 7), 16) }))
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath()
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/* ── Generate 1080x1920 Story (Spotify-style: minimal, logo, big cover) ── */
async function generateStoryCard(track, gradient, trackUrl) {
  const W = 1080, H = 1920
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')
  const colors = parseGradientColors(gradient)

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, W * 0.4, H)
  colors.forEach((c, i) => bg.addColorStop(i / Math.max(colors.length - 1, 1), `rgb(${c.r},${c.g},${c.b})`))
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)

  // Subtle dark overlay
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(0, 0, W, H)

  // Subtle geometric pattern
  ctx.strokeStyle = 'rgba(255,255,255,0.03)'; ctx.lineWidth = 1
  for (let x = 40; x < W; x += 110) {
    for (let y = 40; y < H; y += 110) {
      ctx.beginPath()
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4, outer = i % 2 === 0 ? 18 : 9
        ctx.lineTo(x + Math.cos(a) * outer, y + Math.sin(a) * outer)
      }
      ctx.closePath(); ctx.stroke()
    }
  }

  // Load logo
  let logoImg = null
  try { logoImg = await loadImage('/logo.png') } catch {}

  // Load cover
  let coverImg = null
  if (track.cover_url) {
    try { coverImg = await loadImage(track.cover_url) } catch {}
  }

  // ── Logo at top (real image, centered) ──
  if (logoImg) {
    const logoH = 44
    const logoW = (logoImg.width / logoImg.height) * logoH
    ctx.globalAlpha = 0.8
    ctx.drawImage(logoImg, (W - logoW) / 2, 120, logoW, logoH)
    ctx.globalAlpha = 1
  }

  // ── Large cover art (Spotify: huge, centered, big shadow) ──
  const coverSize = 600
  const coverX = (W - coverSize) / 2, coverY = 320

  // Shadow behind cover
  ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 60; ctx.shadowOffsetY = 20
  ctx.fillStyle = '#000'
  roundRect(ctx, coverX, coverY, coverSize, coverSize, 24); ctx.fill()
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0

  if (coverImg) {
    ctx.save()
    roundRect(ctx, coverX, coverY, coverSize, coverSize, 24); ctx.clip()
    ctx.drawImage(coverImg, coverX, coverY, coverSize, coverSize)
    ctx.restore()
  } else {
    // Gradient fallback
    const cg = ctx.createLinearGradient(coverX, coverY, coverX + coverSize, coverY + coverSize)
    colors.forEach((c, i) => cg.addColorStop(i / Math.max(colors.length - 1, 1), `rgb(${c.r},${c.g},${c.b})`))
    ctx.fillStyle = cg
    roundRect(ctx, coverX, coverY, coverSize, coverSize, 24); ctx.fill()
    ctx.fillStyle = 'rgba(0,0,0,0.1)'
    roundRect(ctx, coverX, coverY, coverSize, coverSize, 24); ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,0.25)'
    ctx.font = '140px serif'; ctx.textAlign = 'center'
    ctx.fillText('\u{266B}', W / 2, coverY + coverSize / 2 + 45)
  }

  // ── Track title (big, bold, Spotify style) ──
  const titleY = coverY + coverSize + 70
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 52px "Playfair Display", Georgia, serif'; ctx.textAlign = 'center'
  const title = track.title || 'Unknown Track'
  const words = title.split(' ')
  let lines = [], line = ''
  for (const w of words) {
    const test = line ? line + ' ' + w : w
    if (ctx.measureText(test).width > W - 160) { lines.push(line); line = w } else line = test
  }
  if (line) lines.push(line)
  lines = lines.slice(0, 2)
  lines.forEach((l, i) => ctx.fillText(l, W / 2, titleY + i * 62))

  // ── Artist name ──
  const artistY = titleY + lines.length * 62 + 8
  ctx.fillStyle = 'rgba(255,255,255,0.6)'
  ctx.font = '400 34px Inter, sans-serif'
  ctx.fillText(track.user?.name || 'Unknown Artist', W / 2, artistY)

  // ── Link area at bottom ──
  const linkY = H - 200

  // "Listen on Nashidify" pill
  const pillW = 380, pillH = 60, pillX = (W - pillW) / 2
  ctx.fillStyle = 'rgba(255,255,255,0.12)'
  roundRect(ctx, pillX, linkY, pillW, pillH, 30); ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.font = '600 20px Inter, sans-serif'; ctx.textAlign = 'center'
  ctx.fillText('\u25B6  Listen on Nashidify', W / 2, linkY + 38)

  // URL text
  ctx.fillStyle = 'rgba(255,255,255,0.3)'
  ctx.font = '400 18px Inter, sans-serif'
  const shortUrl = trackUrl.replace(/^https?:\/\//, '')
  ctx.fillText(shortUrl, W / 2, linkY + pillH + 40)

  return new Promise(resolve => canvas.toBlob(blob => resolve(blob), 'image/png'))
}

/* ── Generate 600x600 square card for general sharing ── */
async function generateShareCard(track, gradient) {
  const W = 600, H = 600
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')
  const colors = parseGradientColors(gradient)

  const bg = ctx.createLinearGradient(0, 0, W, H)
  colors.forEach((c, i) => bg.addColorStop(i / Math.max(colors.length - 1, 1), `rgb(${c.r},${c.g},${c.b})`))
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(0, 0, W, H)

  let logoImg = null
  try { logoImg = await loadImage('/logo.png') } catch {}
  let coverImg = null
  if (track.cover_url) { try { coverImg = await loadImage(track.cover_url) } catch {} }

  // Logo
  if (logoImg) {
    const lh = 22, lw = (logoImg.width / logoImg.height) * lh
    ctx.globalAlpha = 0.7; ctx.drawImage(logoImg, (W - lw) / 2, 32, lw, lh); ctx.globalAlpha = 1
  }

  // Cover
  const cs = 260, cx = (W - cs) / 2, cy = 72
  ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 10
  if (coverImg) {
    ctx.save(); roundRect(ctx, cx, cy, cs, cs, 16); ctx.clip()
    ctx.drawImage(coverImg, cx, cy, cs, cs); ctx.restore()
  } else {
    const cg = ctx.createLinearGradient(cx, cy, cx + cs, cy + cs)
    colors.forEach((c, i) => cg.addColorStop(i / Math.max(colors.length - 1, 1), `rgb(${c.r},${c.g},${c.b})`))
    ctx.fillStyle = cg; roundRect(ctx, cx, cy, cs, cs, 16); ctx.fill()
  }
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0

  // Title
  const tY = cy + cs + 40
  ctx.fillStyle = '#fff'; ctx.font = 'bold 26px "Playfair Display", Georgia, serif'; ctx.textAlign = 'center'
  const t = track.title || 'Unknown'
  ctx.fillText(t.length > 30 ? t.slice(0, 30) + '...' : t, W / 2, tY)

  // Artist
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '400 18px Inter, sans-serif'
  ctx.fillText(track.user?.name || 'Unknown', W / 2, tY + 32)

  // Bottom pill
  ctx.fillStyle = 'rgba(255,255,255,0.1)'
  roundRect(ctx, (W - 220) / 2, H - 70, 220, 36, 18); ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = '500 13px Inter, sans-serif'
  ctx.fillText('\u25B6  Listen on Nashidify', W / 2, H - 46)

  return new Promise(resolve => canvas.toBlob(blob => resolve(blob), 'image/png'))
}

/* ═══════════════════════════════════════════════════
   SHARE MODAL COMPONENT
   ═══════════════════════════════════════════════════ */

export default function ShareModal({ track, gradient, onClose }) {
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [storyMode, setStoryMode] = useState(false)
  const overlayRef = useRef(null)

  const trackUrl = `${window.location.origin}/tracks/${track.id}`
  const shareText = `${track.title} by ${track.user?.name || 'Unknown'} — Listen on Nashidify`
  const encodedText = encodeURIComponent(`${shareText}\n${trackUrl}`)
  const encodedUrl = encodeURIComponent(trackUrl)

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { storyMode ? setStoryMode(false) : onClose() } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, storyMode])

  const handleOverlayClick = useCallback((e) => {
    if (e.target === overlayRef.current) { storyMode ? setStoryMode(false) : onClose() }
  }, [onClose, storyMode])

  const handleCopyLink = async () => {
    try { await navigator.clipboard.writeText(trackUrl) }
    catch { const ta = document.createElement('textarea'); ta.value = trackUrl; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta) }
    setCopied(true); toast.success('Link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleWhatsApp = () => window.open(`https://wa.me/?text=${encodedText}`, '_blank', 'noopener,noreferrer')
  const handleTwitter = () => window.open(`https://twitter.com/intent/tweet?text=${encodedText}`, '_blank', 'width=600,height=400,noopener,noreferrer')
  const handleFacebook = () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodeURIComponent(shareText)}`, '_blank', 'width=600,height=400,noopener,noreferrer')

  const handleNativeShare = async () => {
    if (navigator.share) { try { await navigator.share({ title: track.title, text: shareText, url: trackUrl }) } catch {} }
    else handleCopyLink()
  }

  const downloadBlob = (blob, name) => {
    const url = URL.createObjectURL(blob); const a = document.createElement('a')
    a.href = url; a.download = name; document.body.appendChild(a); a.click()
    document.body.removeChild(a); URL.revokeObjectURL(url)
  }

  const handleDownloadCard = async () => {
    setSaving(true)
    try {
      const blob = await generateShareCard(track, gradient)
      if (blob) { downloadBlob(blob, `nashidify-${(track.title || 'track').replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`); toast.success('Card saved!') }
    } catch { toast.error('Failed') }
    finally { setSaving(false) }
  }

  const handleInstagramStory = async () => {
    setSaving(true)
    try {
      const blob = await generateStoryCard(track, gradient, trackUrl)
      if (!blob) { toast.error('Failed'); setSaving(false); return }

      // Mobile: native share with file + URL (Instagram picks up the link sticker)
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], 'nashidify-story.png', { type: 'image/png' })
        if (navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({ files: [file], title: track.title, url: trackUrl })
            setSaving(false); return
          } catch { /* user cancelled, fall through */ }
        }
      }

      // Desktop: show story preview + download image
      setStoryMode(true)
      downloadBlob(blob, `nashidify-story-${(track.title || 'track').replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`)
      toast.success('Story image saved! Upload it to Instagram.')
    } catch { toast.error('Failed') }
    finally { setSaving(false) }
  }

  const openInstagram = () => {
    // Try deep link first, fallback to web
    window.location.href = 'instagram://story-camera'
    setTimeout(() => { window.open('https://www.instagram.com/', '_blank') }, 1500)
  }

  /* ══════ FULLSCREEN STORY PREVIEW ══════ */
  if (storyMode) {
    return (
      <div className="story-fullscreen" ref={overlayRef} onClick={handleOverlayClick}>
        <div className="story-container">
          <button className="story-close" onClick={() => setStoryMode(false)}><i className="fas fa-times" /></button>

          {/* 9:16 Story card */}
          <div className="story-card" style={{ background: gradient }}>
            <div className="story-card-overlay" />
            <div className="story-card-geo" />
            <div className="story-card-content">
              {/* Real logo */}
              <img src="/logo.png" alt="Nashidify" className="story-logo" />

              {/* Cover art */}
              <div className="story-cover" style={{ background: track.cover_url ? undefined : gradient }}>
                {track.cover_url ? <img src={track.cover_url} alt="" /> : <i className="fas fa-music" />}
              </div>

              {/* Track info */}
              <h2 className="story-title">{track.title}</h2>
              <p className="story-artist">{track.user?.name || 'Unknown Artist'}</p>

              {/* Link pill — clickable, goes to track */}
              <a href={trackUrl} className="story-link-pill" target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                <i className="fas fa-play" /> Listen on Nashidify
              </a>
              <span className="story-url">{trackUrl.replace(/^https?:\/\//, '')}</span>
            </div>
          </div>

          {/* Bottom actions */}
          <div className="story-bottom-actions">
            <button className="story-action-btn" onClick={openInstagram}>
              <i className="fab fa-instagram" /> Open Instagram
            </button>
            <button className="story-action-btn story-action-btn--outline" onClick={() => setStoryMode(false)}>
              Done
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ══════ SHARE MODAL (default) ══════ */
  return (
    <div className="share-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="share-modal">
        <button className="share-close" onClick={onClose}><i className="fas fa-times" /></button>

        {/* Preview card — Spotify style: minimal, big cover, logo */}
        <div className="share-preview" style={{ background: gradient }}>
          <div className="share-preview-overlay" />
          <div className="share-preview-content">
            <img src="/logo.png" alt="Nashidify" className="share-preview-logo" />
            <div className="share-preview-cover" style={{ background: track.cover_url ? undefined : gradient }}>
              {track.cover_url ? <img src={track.cover_url} alt="" /> : <i className="fas fa-music" />}
            </div>
            <p className="share-preview-title">{track.title}</p>
            <p className="share-preview-artist">{track.user?.name || 'Unknown Artist'}</p>
          </div>
        </div>

        {/* Share actions */}
        <div className="share-actions">
          <h3 className="share-heading">Share this track</h3>
          <div className="share-social-grid">
            <button className="share-social-btn share-social--whatsapp" onClick={handleWhatsApp}>
              <i className="fab fa-whatsapp" /><span>WhatsApp</span>
            </button>
            <button className="share-social-btn share-social--instagram" onClick={handleInstagramStory}>
              {saving ? <i className="fas fa-spinner fa-spin" /> : <i className="fab fa-instagram" />}
              <span>Instagram Story</span>
            </button>
            <button className="share-social-btn share-social--twitter" onClick={handleTwitter}>
              <i className="fab fa-x-twitter" /><span>X / Twitter</span>
            </button>
            <button className="share-social-btn share-social--facebook" onClick={handleFacebook}>
              <i className="fab fa-facebook-f" /><span>Facebook</span>
            </button>
          </div>
          <div className="share-util-row">
            <button className={`share-util-btn ${copied ? 'share-util-btn--done' : ''}`} onClick={handleCopyLink}>
              <i className={`fas fa-${copied ? 'check' : 'link'}`} />{copied ? 'Copied!' : 'Copy Link'}
            </button>
            <button className="share-util-btn" onClick={handleDownloadCard}>
              {saving ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-download" />} Save Card
            </button>
            {navigator.share && (
              <button className="share-util-btn" onClick={handleNativeShare}>
                <i className="fas fa-share-alt" /> More
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
