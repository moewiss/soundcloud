import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext'
import { usePrayerTimes } from '../hooks/usePrayerTimes'
import { useMediaSession } from '../hooks/useMediaSession'
import { useVoiceCommands } from '../hooks/useVoiceCommands'
import { api } from '../services/api'
import { STATIONS } from './Radio'
import {
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1,
  Heart, Mic, MicOff, Moon, Sun, X, Radio, ListMusic, Compass,
  ChevronDown, Volume2
} from 'lucide-react'

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatTime(s) {
  if (!s || !isFinite(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function CarBackground({ coverUrl, nightMode }) {
  return (
    <>
      {coverUrl && (
        <div
          className="cm-bg-glow"
          style={{ backgroundImage: `url(${coverUrl})` }}
        />
      )}
      <div className={`cm-bg-pattern ${nightMode ? 'cm-night-pattern' : ''}`}>
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', opacity: 0.06 }}>
          <defs>
            <pattern id="cm-stars" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
              <polygon points="25,2 31,18 48,18 34,28 39,45 25,35 11,45 16,28 2,18 19,18" fill="currentColor" opacity="0.4" />
            </pattern>
          </defs>
          <rect width="200" height="200" fill="url(#cm-stars)" />
        </svg>
      </div>
    </>
  )
}

function PrayerBar({ nextPrayer, nightMode, setNightMode, voiceBtn }) {
  return (
    <div className="cm-prayer-bar">
      <div className="cm-prayer-countdown">
        {nextPrayer ? (
          <>
            <span style={{ opacity: 0.6, fontSize: '0.75rem' }}>{nextPrayer.name}</span>
            <span>{nextPrayer.countdown}</span>
          </>
        ) : (
          <span style={{ opacity: 0.5 }}>Prayer times loading...</span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {voiceBtn}
        <button className="cm-top-btn" onClick={() => setNightMode(n => !n)}>
          {nightMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </div>
  )
}

function GestureHint({ text }) {
  if (!text) return null
  return <div className="cm-gesture-hint" key={text + Date.now()}>{text}</div>
}

function ProgressBar({ progress, duration, seek, isRadio }) {
  const barRef = useRef(null)
  const pct = duration > 0 ? (progress / duration) * 100 : 0

  const handleSeek = useCallback((e) => {
    if (!barRef.current || !duration || isRadio) return
    const rect = barRef.current.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
    seek((x / rect.width) * duration)
  }, [duration, seek, isRadio])

  if (isRadio) {
    return (
      <div className="cm-progress-wrap">
        <div className="cm-radio-live">
          <div className="cm-radio-dot" />
          <span>LIVE</span>
        </div>
      </div>
    )
  }

  return (
    <div className="cm-progress-wrap">
      <div
        className="cm-progress-bar"
        ref={barRef}
        onClick={handleSeek}
        onTouchStart={handleSeek}
      >
        <div className="cm-progress-fill" style={{ width: `${pct}%` }}>
          <div className="cm-progress-thumb" />
        </div>
      </div>
      <div className="cm-progress-times">
        <span>{formatTime(progress)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  )
}

function QueueSheet({ open, queue, currentIndex, playFromQueue }) {
  const upcoming = queue.slice(currentIndex + 1, currentIndex + 6)
  return (
    <div className={`cm-sheet cm-queue-sheet ${open ? 'open' : ''}`}>
      <div className="cm-sheet-handle" />
      <div className="cm-sheet-title">Up Next</div>
      {upcoming.length === 0 && (
        <div className="cm-sheet-empty">Queue is empty</div>
      )}
      {upcoming.map((track, i) => (
        <button
          key={track.id}
          className="cm-queue-item"
          onClick={() => playFromQueue(currentIndex + 1 + i)}
        >
          <div className="cm-queue-art">
            {track.cover_url ? <img src={track.cover_url} alt="" /> : <ListMusic size={20} />}
          </div>
          <div className="cm-queue-info">
            <div className="cm-queue-title">{track.title}</div>
            <div className="cm-queue-artist">{track.user?.name}</div>
          </div>
          <div className="cm-queue-dur">{formatTime(track.duration)}</div>
        </button>
      ))}
    </div>
  )
}

function RadioSheet({ open, onPlay, currentTrack }) {
  const categories = useMemo(() => {
    const cats = {}
    STATIONS.forEach(s => {
      if (!cats[s.category]) cats[s.category] = []
      cats[s.category].push(s)
    })
    return Object.entries(cats)
  }, [])

  return (
    <div className={`cm-sheet cm-radio-sheet ${open ? 'open' : ''}`}>
      <div className="cm-sheet-handle" />
      <div className="cm-sheet-title">Radio Stations</div>
      {categories.map(([cat, stations]) => (
        <div key={cat}>
          <div className="cm-radio-cat">{cat}</div>
          <div className="cm-radio-row">
            {stations.map(s => (
              <button
                key={s.id}
                className={`cm-radio-card ${currentTrack?.id === `radio_${s.id}` ? 'active' : ''}`}
                onClick={() => onPlay(s)}
              >
                <Radio size={16} style={{ opacity: 0.5, marginBottom: 4 }} />
                <div className="cm-radio-name">{s.name}</div>
                <div className="cm-radio-freq">{s.freq}</div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function BrowseSheet({ open, onPlayTrack, onPlayPlaylist }) {
  const [tab, setTab] = useState('trending')
  const [tracks, setTracks] = useState([])
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    if (tab === 'trending') {
      api.getTracks().then(d => {
        setTracks(Array.isArray(d) ? d.slice(0, 20) : (d?.data || []).slice(0, 20))
      }).catch(() => {}).finally(() => setLoading(false))
    } else if (tab === 'playlists') {
      api.getPlaylists().then(d => {
        setPlaylists(Array.isArray(d) ? d : [])
      }).catch(() => {}).finally(() => setLoading(false))
    } else {
      // Categories - load filtered
      api.search(tab, 'tracks').then(d => {
        setTracks(d?.tracks || [])
      }).catch(() => {}).finally(() => setLoading(false))
    }
  }, [open, tab])

  const categories = ['nasheeds', 'quran', 'lectures', 'dua', 'recitation']

  return (
    <div className={`cm-sheet cm-browse-sheet ${open ? 'open' : ''}`}>
      <div className="cm-sheet-handle" />
      <div className="cm-sheet-title">Browse</div>
      <div className="cm-browse-tabs">
        {['trending', 'playlists', ...categories].map(t => (
          <button
            key={t}
            className={`cm-browse-tab ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      <div className="cm-browse-content">
        {loading && <div className="cm-sheet-empty">Loading...</div>}
        {!loading && tab === 'playlists' && playlists.map(pl => (
          <button key={pl.id} className="cm-browse-item" onClick={() => onPlayPlaylist(pl)}>
            <div className="cm-queue-art">
              {pl.cover_url ? <img src={pl.cover_url} alt="" /> : <ListMusic size={20} />}
            </div>
            <div className="cm-queue-info">
              <div className="cm-queue-title">{pl.name}</div>
              <div className="cm-queue-artist">{pl.tracks_count || 0} tracks</div>
            </div>
            <Play size={20} style={{ opacity: 0.4 }} />
          </button>
        ))}
        {!loading && tab !== 'playlists' && tracks.map((track, i) => (
          <button key={track.id} className="cm-browse-item" onClick={() => onPlayTrack(track, tracks, i)}>
            <div className="cm-queue-art">
              {track.cover_url ? <img src={track.cover_url} alt="" /> : <ListMusic size={20} />}
            </div>
            <div className="cm-queue-info">
              <div className="cm-queue-title">{track.title}</div>
              <div className="cm-queue-artist">{track.user?.name}</div>
            </div>
            <div className="cm-queue-dur">{formatTime(track.duration)}</div>
          </button>
        ))}
        {!loading && ((tab === 'playlists' && playlists.length === 0) || (tab !== 'playlists' && tracks.length === 0)) && (
          <div className="cm-sheet-empty">Nothing found</div>
        )}
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function CarMode() {
  const navigate = useNavigate()
  const {
    currentTrack, isPlaying, progress, duration, queue, currentIndex,
    shuffle, repeat, togglePlay, playNext, playPrevious, seek,
    toggleShuffle, toggleRepeat, playRadio, playTrack, playFromQueue,
  } = usePlayer()
  const { nextPrayer } = usePrayerTimes()
  useMediaSession()

  // UI state
  const [nightMode, setNightMode] = useState(() => {
    const h = new Date().getHours()
    return h >= 19 || h < 6
  })
  const [gestureHint, setGestureHint] = useState(null)
  const [liked, setLiked] = useState(false)
  const [activeSheet, setActiveSheet] = useState(null) // 'queue' | 'radio' | 'browse' | null

  // Gesture refs
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const touchStartTime = useRef(0)

  // Night mode auto-check
  useEffect(() => {
    if (localStorage.getItem('nashidify_carmode_nightauto') === 'false') return
    const interval = setInterval(() => {
      const h = new Date().getHours()
      setNightMode(h >= 19 || h < 6)
    }, 300000)
    return () => clearInterval(interval)
  }, [])

  // Check like status
  useEffect(() => {
    setLiked(false) // Reset on track change, would need API for real status
  }, [currentTrack?.id])

  // Show gesture hint
  const showHint = useCallback((text) => {
    setGestureHint(text)
    setTimeout(() => setGestureHint(null), 1200)
  }, [])

  // Like handler
  const handleLike = useCallback(async () => {
    if (!currentTrack?.id || currentTrack.isRadio) return
    try {
      await api.likeTrack(currentTrack.id)
      setLiked(l => !l)
      showHint(liked ? 'Unliked' : 'Liked')
    } catch { showHint('Liked') }
  }, [currentTrack, liked, showHint])

  // Voice command handler
  const handleVoiceCommand = useCallback(({ action, query }) => {
    switch (action) {
      case 'next': playNext(); showHint('Next'); break
      case 'previous': playPrevious(); showHint('Previous'); break
      case 'pause': togglePlay(); showHint('Paused'); break
      case 'play': togglePlay(); showHint('Playing'); break
      case 'shuffle': toggleShuffle(); showHint('Shuffle'); break
      case 'like': handleLike(); break
      case 'repeat': toggleRepeat(); showHint('Repeat'); break
      case 'radio':
        if (query) {
          const station = STATIONS.find(s => s.name.toLowerCase().includes(query))
          if (station) { playRadio(station); showHint(station.name) }
          else showHint('Station not found')
        }
        break
      case 'search':
        setActiveSheet('browse')
        showHint('Searching...')
        break
      case 'browse_trending': setActiveSheet('browse'); showHint('Trending'); break
      case 'browse_nasheeds': setActiveSheet('browse'); showHint('Nasheeds'); break
      case 'browse_quran': setActiveSheet('browse'); showHint('Quran'); break
      case 'browse_lectures': setActiveSheet('browse'); showHint('Lectures'); break
      case 'unknown': showHint('?'); break
      default: break
    }
  }, [playNext, playPrevious, togglePlay, toggleShuffle, toggleRepeat, handleLike, playRadio, showHint])

  const { isListening, startListening, stopListening, isSupported: voiceSupported } = useVoiceCommands({
    onCommand: handleVoiceCommand,
  })

  // Gesture handlers
  const onTouchStart = useCallback((e) => {
    if (activeSheet) return // Don't capture gestures when sheet is open
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    touchStartTime.current = Date.now()
  }, [activeSheet])

  const onTouchEnd = useCallback((e) => {
    if (activeSheet) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    const dt = Date.now() - touchStartTime.current
    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)

    if (dt > 500 || (absDx < 60 && absDy < 60)) return

    if (absDx > absDy) {
      if (dx > 0) { playNext(); showHint('Next') }
      else { playPrevious(); showHint('Previous') }
    } else {
      if (dy < 0) { handleLike() }
      else { navigate(-1) }
    }
  }, [activeSheet, playNext, playPrevious, handleLike, navigate, showHint])

  // Browse handlers
  const handlePlayTrack = useCallback((track, trackList, index) => {
    playTrack(track, trackList)
    setActiveSheet(null)
  }, [playTrack])

  const handlePlayPlaylist = useCallback(async (playlist) => {
    try {
      const data = await api.getPlaylistTracks(playlist.id)
      const tracks = data?.tracks || data || []
      if (tracks.length > 0) {
        playTrack(tracks[0], tracks)
        setActiveSheet(null)
        showHint(playlist.name)
      }
    } catch { showHint('Failed to load') }
  }, [playTrack, showHint])

  const handleRadioPlay = useCallback((station) => {
    playRadio(station)
    setActiveSheet(null)
    showHint(station.name)
  }, [playRadio, showHint])

  const toggleSheet = useCallback((sheet) => {
    setActiveSheet(prev => prev === sheet ? null : sheet)
  }, [])

  const isRadio = currentTrack?.isRadio

  return (
    <div className={`cm-root ${nightMode ? 'cm-night' : 'cm-day'}`}>
      <CarBackground coverUrl={currentTrack?.cover_url} nightMode={nightMode} />

      <PrayerBar
        nextPrayer={nextPrayer}
        nightMode={nightMode}
        setNightMode={setNightMode}
        voiceBtn={voiceSupported ? (
          <button
            className={`cm-top-btn ${isListening ? 'cm-listening' : ''}`}
            onClick={isListening ? stopListening : startListening}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
        ) : null}
      />

      {/* Gesture zone */}
      <div
        className="cm-gesture-zone"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <GestureHint text={gestureHint} />

        {/* Artwork */}
        <div className={`cm-artwork ${isPlaying ? 'cm-artwork--playing' : ''}`}>
          {currentTrack?.cover_url ? (
            <img src={currentTrack.cover_url} alt="" draggable={false} />
          ) : (
            <div className="cm-artwork-placeholder">
              {isRadio ? <Radio size={64} /> : <ListMusic size={64} />}
            </div>
          )}
        </div>

        {/* Track info */}
        <div className="cm-track-info">
          <div className="cm-track-title">
            {currentTrack?.title || 'No track playing'}
          </div>
          <div className="cm-track-artist">
            {currentTrack?.user?.name || (isRadio ? `${currentTrack?.radioFreq} FM` : 'Tap browse to pick a track')}
          </div>
        </div>

        {/* Swipe hints */}
        {!currentTrack && (
          <div className="cm-swipe-hints">
            Swipe to control playback
          </div>
        )}
      </div>

      {/* Progress */}
      <ProgressBar
        progress={progress}
        duration={duration}
        seek={seek}
        isRadio={isRadio}
      />

      {/* Controls */}
      <div className="cm-controls">
        <button className={`cm-mode-btn ${shuffle ? 'active' : ''}`} onClick={toggleShuffle}>
          <Shuffle size={22} />
        </button>
        <button className="cm-skip-btn" onClick={playPrevious}>
          <SkipBack size={24} />
        </button>
        <button className="cm-play-btn" onClick={togglePlay}>
          {isPlaying ? <Pause size={36} /> : <Play size={36} style={{ marginLeft: 3 }} />}
        </button>
        <button className="cm-skip-btn" onClick={playNext}>
          <SkipForward size={24} />
        </button>
        <button className={`cm-mode-btn ${repeat !== 'off' ? 'active' : ''}`} onClick={toggleRepeat}>
          {repeat === 'one' ? <Repeat1 size={22} /> : <Repeat size={22} />}
        </button>
      </div>

      {/* Bottom bar */}
      <div className="cm-bottom-bar">
        <button className={`cm-bottom-action ${activeSheet === 'queue' ? 'active' : ''}`} onClick={() => toggleSheet('queue')}>
          <ListMusic size={20} />
          <span>Queue</span>
        </button>
        <button className={`cm-bottom-action ${activeSheet === 'radio' ? 'active' : ''}`} onClick={() => toggleSheet('radio')}>
          <Radio size={20} />
          <span>Radio</span>
        </button>
        <button className={`cm-bottom-action ${activeSheet === 'browse' ? 'active' : ''}`} onClick={() => toggleSheet('browse')}>
          <Compass size={20} />
          <span>Browse</span>
        </button>
        <button className={`cm-bottom-action ${liked ? 'active' : ''}`} onClick={handleLike}>
          <Heart size={20} fill={liked ? 'currentColor' : 'none'} />
          <span>Like</span>
        </button>
        <button className="cm-bottom-action" onClick={() => navigate(-1)}>
          <X size={20} />
          <span>Exit</span>
        </button>
      </div>

      {/* Sheets */}
      <QueueSheet open={activeSheet === 'queue'} queue={queue} currentIndex={currentIndex} playFromQueue={playFromQueue} />
      <RadioSheet open={activeSheet === 'radio'} onPlay={handleRadioPlay} currentTrack={currentTrack} />
      <BrowseSheet open={activeSheet === 'browse'} onPlayTrack={handlePlayTrack} onPlayPlaylist={handlePlayPlaylist} />

      {/* Overlay to close sheets */}
      {activeSheet && <div className="cm-sheet-overlay" onClick={() => setActiveSheet(null)} />}

      {/* Voice listening indicator */}
      {isListening && (
        <div className="cm-voice-overlay">
          <div className="cm-voice-ring" />
          <Mic size={32} />
          <span>Listening...</span>
        </div>
      )}
    </div>
  )
}
