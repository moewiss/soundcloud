import { useState, useRef, useEffect, useCallback } from 'react'
import ReactDOM from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext'
import { toast } from 'react-hot-toast'
import { MoreHorizontal, X, Music } from 'lucide-react'
import { copyToClipboard } from '../utils/clipboard'

const isMobile = () => window.innerWidth <= 768

export default function TrackMenu({
  track,
  trackList,
  onAddToPlaylist,
  onLike,
  onRepost,
  isLiked,
  isReposted,
  size = 16,
  className = '',
}) {
  const [open, setOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState({})
  const [mobile, setMobile] = useState(false)
  const menuRef = useRef(null)
  const btnRef = useRef(null)
  const navigate = useNavigate()
  const { addToQueue, insertNext } = usePlayer()

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) &&
          btnRef.current && !btnRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    const onScroll = () => { if (!mobile) setOpen(false) }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    window.addEventListener('scroll', onScroll, true)
    // Prevent body scroll on mobile when sheet is open
    if (mobile) document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
      window.removeEventListener('scroll', onScroll, true)
      if (mobile) document.body.style.overflow = ''
    }
  }, [open, mobile])

  const handleToggle = (e) => {
    e.stopPropagation()
    e.preventDefault()
    const mob = isMobile()
    setMobile(mob)
    if (!open && !mob && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const goUp = spaceBelow < 340
      setMenuStyle({
        position: 'fixed',
        right: Math.max(8, window.innerWidth - rect.right),
        ...(goUp
          ? { bottom: window.innerHeight - rect.top + 4 }
          : { top: rect.bottom + 4 }),
        zIndex: 9999,
      })
    }
    setOpen(o => !o)
  }

  const close = useCallback(() => setOpen(false), [])

  const handleAddToQueue = (e) => {
    e.stopPropagation()
    if (!track.audio_url) { toast.error('Track not available'); close(); return }
    addToQueue(track)
    toast.success('Added to queue')
    close()
  }

  const handlePlayNext = (e) => {
    e.stopPropagation()
    if (!track.audio_url) { toast.error('Track not available'); close(); return }
    insertNext(track)
    toast.success('Playing next')
    close()
  }

  const handleShare = (e) => {
    e.stopPropagation()
    copyToClipboard(`${window.location.origin}/tracks/${track.id}`)
    toast.success('Link copied')
    close()
  }

  const handleGoToArtist = (e) => {
    e.stopPropagation()
    if (track.user?.id) navigate(`/users/${track.user.id}`)
    close()
  }

  const handleGoToTrack = (e) => {
    e.stopPropagation()
    navigate(`/tracks/${track.id}`)
    close()
  }

  const menuItems = (
    <>
      <button className="tm-item" onClick={handleAddToQueue}>
        <i className="fas fa-list-ol"></i>
        <span>Add to Queue</span>
      </button>
      <button className="tm-item" onClick={handlePlayNext}>
        <i className="fas fa-step-forward"></i>
        <span>Play Next</span>
      </button>

      <div className="tm-divider" />

      {onAddToPlaylist && (
        <button className="tm-item" onClick={(e) => { e.stopPropagation(); onAddToPlaylist(track); close() }}>
          <i className="fas fa-plus"></i>
          <span>Add to Playlist</span>
        </button>
      )}
      {onLike && (
        <button className={`tm-item${isLiked ? ' tm-item--active' : ''}`} onClick={(e) => { e.stopPropagation(); onLike(track.id, e); close() }}>
          <i className="fas fa-heart"></i>
          <span>{isLiked ? 'Unlike' : 'Like'}</span>
        </button>
      )}
      {onRepost && (
        <button className={`tm-item${isReposted ? ' tm-item--active' : ''}`} onClick={(e) => { e.stopPropagation(); onRepost(track.id, e); close() }}>
          <i className="fas fa-retweet"></i>
          <span>{isReposted ? 'Unrepost' : 'Repost'}</span>
        </button>
      )}

      <div className="tm-divider" />

      <button className="tm-item" onClick={handleGoToTrack}>
        <i className="fas fa-music"></i>
        <span>Go to Track</span>
      </button>
      {track.user?.id && (
        <button className="tm-item" onClick={handleGoToArtist}>
          <i className="fas fa-user"></i>
          <span>Go to Artist</span>
        </button>
      )}
      <button className="tm-item" onClick={handleShare}>
        <i className="fas fa-share-alt"></i>
        <span>Share</span>
      </button>
    </>
  )

  // Desktop: fixed dropdown
  // Mobile: bottom sheet
  const menuContent = open && ReactDOM.createPortal(
    mobile ? (
      <>
        <div className="tm-sheet-backdrop" onClick={close} />
        <div ref={menuRef} className="tm-sheet" onClick={e => e.stopPropagation()}>
          <div className="tm-sheet-handle" />

          {/* Track info header */}
          <div className="tm-sheet-track">
            <div className="tm-sheet-art">
              {track.cover_url
                ? <img src={track.cover_url} alt="" />
                : <div className="tm-sheet-art-placeholder"><Music size={18} /></div>}
            </div>
            <div className="tm-sheet-info">
              <span className="tm-sheet-title">{track.title}</span>
              <span className="tm-sheet-artist">{track.user?.name || 'Unknown'}</span>
            </div>
            <button className="tm-sheet-close" onClick={close}><X size={18} /></button>
          </div>

          <div className="tm-sheet-divider" />

          {/* Menu items */}
          <div className="tm-sheet-items">
            {menuItems}
          </div>
        </div>
      </>
    ) : (
      <div ref={menuRef} className="tm-menu" style={menuStyle} onClick={e => e.stopPropagation()}>
        {menuItems}
      </div>
    ),
    document.body
  )

  return (
    <div className="tm-wrap">
      <button
        ref={btnRef}
        className={`tm-trigger ${className}`}
        onClick={handleToggle}
        aria-label="Track menu"
      >
        <MoreHorizontal size={size} />
      </button>
      {menuContent}
    </div>
  )
}
