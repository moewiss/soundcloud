import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext'
import { Play, Pause, X, GripVertical, Trash2, Music } from 'lucide-react'

/* ── Islamic star for decoration ── */
const S8 = "10,1 11.42,6.58 16.36,3.64 13.42,8.58 19,10 13.42,11.42 16.36,16.36 11.42,13.42 10,19 8.58,13.42 3.64,16.36 6.58,11.42 1,10 6.58,8.58 3.64,3.64 8.58,6.58"

const fmtDur = (s) => {
  if (!s) return '0:00'
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

export default function QueuePanel({ open, onClose }) {
  const navigate = useNavigate()
  const {
    queue, currentIndex, currentTrack, isPlaying,
    togglePlay, playFromQueue, removeFromQueue, moveInQueue, clearQueue,
  } = usePlayer()

  const [dragIdx, setDragIdx] = useState(null)
  const [overIdx, setOverIdx] = useState(null)
  const dragNode = useRef(null)

  const handleDragStart = useCallback((e, idx) => {
    dragNode.current = e.target
    setDragIdx(idx)
    e.dataTransfer.effectAllowed = 'move'
    // Make drag image slightly transparent
    setTimeout(() => { if (dragNode.current) dragNode.current.style.opacity = '0.4' }, 0)
  }, [])

  const handleDragOver = useCallback((e, idx) => {
    e.preventDefault()
    setOverIdx(idx)
  }, [])

  const handleDrop = useCallback((e, toIdx) => {
    e.preventDefault()
    if (dragIdx !== null && dragIdx !== toIdx) {
      moveInQueue(dragIdx, toIdx)
    }
    if (dragNode.current) dragNode.current.style.opacity = '1'
    setDragIdx(null)
    setOverIdx(null)
  }, [dragIdx, moveInQueue])

  const handleDragEnd = useCallback(() => {
    if (dragNode.current) dragNode.current.style.opacity = '1'
    setDragIdx(null)
    setOverIdx(null)
  }, [])

  // Split queue into "now playing" and "up next"
  const nowPlaying = currentIndex >= 0 && currentIndex < queue.length ? queue[currentIndex] : null
  const upNext = queue.filter((_, i) => i > currentIndex)
  const played = queue.filter((_, i) => i < currentIndex)

  return (
    <>
      {/* Backdrop */}
      <div
        className={`q-backdrop${open ? ' open' : ''}`}
        onClick={onClose}
      />

      {/* Panel */}
      <div className={`q-panel${open ? ' open' : ''}`}>
        {/* Header */}
        <div className="q-header">
          <div className="q-header-left">
            <svg width="14" height="14" viewBox="0 0 20 20" style={{ opacity: 0.5 }}>
              <polygon points={S8} fill="none" stroke="var(--sp-gold)" strokeWidth="1.2" />
            </svg>
            <h2 className="q-title">Queue</h2>
            <span className="q-count">{queue.length} track{queue.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="q-header-right">
            {queue.length > 1 && (
              <button className="q-clear-btn" onClick={clearQueue}>
                <Trash2 size={13} />
                Clear
              </button>
            )}
            <button className="q-close-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="q-content">
          {queue.length === 0 ? (
            <div className="q-empty">
              <div className="q-empty-icon">
                <Music size={28} />
              </div>
              <p className="q-empty-title">Your queue is empty</p>
              <p className="q-empty-desc">Play a track or add songs to your queue</p>
            </div>
          ) : (
            <>
              {/* Now Playing */}
              {nowPlaying && (
                <div className="q-section">
                  <div className="q-section-label">Now Playing</div>
                  <div className="q-track q-track-current">
                    <div className="q-track-art" onClick={() => togglePlay()}>
                      {nowPlaying.cover_url || nowPlaying.artwork_url ? (
                        <img src={nowPlaying.cover_url || nowPlaying.artwork_url} alt="" />
                      ) : (
                        <div className="q-track-art-placeholder"><Music size={16} /></div>
                      )}
                      <div className="q-track-art-overlay">
                        {isPlaying ? (
                          <div className="q-eq-bars">
                            <span /><span /><span /><span />
                          </div>
                        ) : (
                          <Play size={14} fill="white" />
                        )}
                      </div>
                    </div>
                    <div className="q-track-info">
                      <span className="q-track-name">{nowPlaying.title}</span>
                      <span className="q-track-artist">
                        {nowPlaying.user?.name || nowPlaying.artist_name || 'Unknown'}
                      </span>
                    </div>
                    <span className="q-track-dur">{fmtDur(nowPlaying.duration)}</span>
                  </div>
                </div>
              )}

              {/* Up Next */}
              {upNext.length > 0 && (
                <div className="q-section">
                  <div className="q-section-label">
                    Up Next
                    <span className="q-section-count">{upNext.length}</span>
                  </div>
                  {upNext.map((track, i) => {
                    const realIdx = currentIndex + 1 + i
                    const isDragging = dragIdx === realIdx
                    const isOver = overIdx === realIdx
                    return (
                      <div
                        key={track.id}
                        className={`q-track${isDragging ? ' dragging' : ''}${isOver ? ' drag-over' : ''}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, realIdx)}
                        onDragOver={(e) => handleDragOver(e, realIdx)}
                        onDrop={(e) => handleDrop(e, realIdx)}
                        onDragEnd={handleDragEnd}
                      >
                        <div className="q-track-grip">
                          <GripVertical size={14} />
                        </div>
                        <div className="q-track-num">{i + 1}</div>
                        <div className="q-track-art" onClick={() => playFromQueue(realIdx)}>
                          {track.cover_url || track.artwork_url ? (
                            <img src={track.cover_url || track.artwork_url} alt="" />
                          ) : (
                            <div className="q-track-art-placeholder"><Music size={14} /></div>
                          )}
                          <div className="q-track-art-overlay">
                            <Play size={12} fill="white" />
                          </div>
                        </div>
                        <div className="q-track-info" onClick={() => playFromQueue(realIdx)}>
                          <span className="q-track-name">{track.title}</span>
                          <span className="q-track-artist">
                            {track.user?.name || track.artist_name || 'Unknown'}
                          </span>
                        </div>
                        <span className="q-track-dur">{fmtDur(track.duration)}</span>
                        <button
                          className="q-track-remove"
                          onClick={() => removeFromQueue(track.id)}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Previously Played */}
              {played.length > 0 && (
                <div className="q-section q-section-played">
                  <div className="q-section-label">Previously Played</div>
                  {played.map((track, i) => (
                    <div
                      key={track.id}
                      className="q-track q-track-played"
                      onClick={() => playFromQueue(i)}
                    >
                      <div className="q-track-num">{i + 1}</div>
                      <div className="q-track-art">
                        {track.cover_url || track.artwork_url ? (
                          <img src={track.cover_url || track.artwork_url} alt="" />
                        ) : (
                          <div className="q-track-art-placeholder"><Music size={14} /></div>
                        )}
                      </div>
                      <div className="q-track-info">
                        <span className="q-track-name">{track.title}</span>
                        <span className="q-track-artist">
                          {track.user?.name || track.artist_name || 'Unknown'}
                        </span>
                      </div>
                      <span className="q-track-dur">{fmtDur(track.duration)}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
