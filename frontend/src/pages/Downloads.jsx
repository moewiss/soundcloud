import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { usePlayer } from '../context/PlayerContext'
import { api } from '../services/api'
import { requireAuth } from '../utils/auth'
import {
  getAllCachedTracks,
  getCachedAudioUrl,
  removeCachedTrack,
  clearAllCache,
  getCacheStats,
  formatBytes,
  requestPersistentStorage,
} from '../services/offlineCache'
import {
  Play, Pause, Trash2, Download, DownloadCloud,
  HardDrive, Wifi, WifiOff, Music, Loader2, Share2,
  Sparkles, ArrowRight,
} from 'lucide-react'
import { copyToClipboard } from '../utils/clipboard'

/* ── Islamic 8-pointed star polygon ── */
const S8 = "10,1 11.42,6.58 16.36,3.64 13.42,8.58 19,10 13.42,11.42 16.36,16.36 11.42,13.42 10,19 8.58,13.42 3.64,16.36 6.58,11.42 1,10 6.58,8.58 3.64,3.64 8.58,6.58"

/* ── Helpers ── */
const fmtCount = (n) => { if (!n && n !== 0) return '0'; if (n >= 1e6) return `${(n/1e6).toFixed(1)}M`; if (n >= 1e3) return `${(n/1e3).toFixed(1)}K`; return String(n) }
const fmtDur = (s) => { if (!s) return '0:00'; return `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}` }

export default function Downloads() {
  const navigate = useNavigate()
  const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayer()
  const [downloads, setDownloads] = useState([])
  const [cachedIds, setCachedIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [cacheStats, setCacheStats] = useState({ count: 0, totalBytes: 0 })
  const [planInfo, setPlanInfo] = useState(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const user = JSON.parse(localStorage.getItem('user') || 'null')

  useEffect(() => {
    if (!requireAuth(navigate, 'Please login to view downloads')) return
    requestPersistentStorage()
    loadData()
    const onOnline = () => setIsOnline(true)
    const onOffline = () => setIsOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline) }
  }, [])

  const loadData = async () => {
    try {
      const [serverData, cachedTracks, stats] = await Promise.all([
        navigator.onLine ? api.getDownloads().catch(() => null) : Promise.resolve(null),
        getAllCachedTracks(),
        getCacheStats(),
      ])
      setCacheStats(stats)
      const cachedIdSet = new Set(cachedTracks.map(t => t.id))
      setCachedIds(cachedIdSet)

      if (serverData) {
        setDownloads((serverData.downloads || []).map(t => ({ ...t, is_cached: cachedIdSet.has(t.id) })))
        setPlanInfo({ downloads_remaining: serverData.downloads_remaining, download_limit: serverData.download_limit, can_download: serverData.can_download })
      } else {
        setDownloads(cachedTracks.map(t => ({ ...t, is_cached: true })))
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handlePlay = async (track, trackList) => {
    if (isPlaying_(track)) { togglePlay(); return }
    const cachedUrl = await getCachedAudioUrl(track.id)
    if (cachedUrl) {
      playTrack({ ...track, audio_url: cachedUrl, _offline: true }, trackList || downloads)
    } else if (isOnline && track.audio_url) {
      playTrack(track, trackList || downloads)
    } else {
      toast.error('Track not cached and you are offline')
    }
  }

  const handlePlayAll = () => {
    if (downloads.length > 0) handlePlay(downloads[0], downloads)
  }

  const isPlaying_ = (track) => currentTrack?.id === track.id && isPlaying

  const handleRemove = async (track) => {
    try {
      await removeCachedTrack(track.id)
      if (isOnline) await api.removeDownload(track.id).catch(() => {})
      setDownloads(prev => prev.filter(t => t.id !== track.id))
      setCachedIds(prev => { const n = new Set(prev); n.delete(track.id); return n })
      setCacheStats(await getCacheStats())
      toast.success('Removed from downloads')
    } catch { toast.error('Failed to remove') }
  }

  const handleClearAll = async () => {
    if (!confirm('Remove all downloaded tracks? You won\'t be able to listen offline.')) return
    try {
      await clearAllCache()
      if (isOnline) { for (const t of downloads) await api.removeDownload(t.id).catch(() => {}) }
      setDownloads([]); setCachedIds(new Set()); setCacheStats({ count: 0, totalBytes: 0 })
      toast.success('All downloads cleared')
    } catch { toast.error('Failed to clear') }
  }

  /* ── Not logged in ── */
  if (!user) return (
    <div className="lib-page">
      <div className="up-empty" style={{ paddingTop: '20vh' }}>
        <DownloadCloud size={48} style={{ color: 'var(--sp-text-muted)', marginBottom: 16 }} />
        <p>Log in to see your downloads</p>
        <button onClick={() => navigate('/login')} className="up-showmore" style={{ marginTop: 16 }}>Log In</button>
      </div>
    </div>
  )

  return (
    <div className="lib-page">
      {/* ── Header ── */}
      <div className="lib-header">
        <h1 className="lib-title">Downloads</h1>

        {/* Online/Offline badge */}
        <div className={`lib-badge ${isOnline ? 'lib-badge--approved' : 'lib-badge--rejected'}`}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 14px', fontSize: '0.74rem' }}>
          {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
          {isOnline ? 'Online' : 'Offline'}
        </div>
      </div>

      <div className="lib-content">
        {/* ── Hero ── */}
        <div className="lib-hero">
          <div className="lib-hero-icon">
            <DownloadCloud size={30} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 className="lib-hero-title">Offline Library</h2>
            <p className="lib-hero-count">
              {loading ? '...' : `${downloads.length} track${downloads.length !== 1 ? 's' : ''}`}
              {cacheStats.totalBytes > 0 && <span style={{ opacity: 0.6 }}> &middot; {formatBytes(cacheStats.totalBytes)}</span>}
              {planInfo && planInfo.downloads_remaining !== null && (
                <span style={{ opacity: 0.6 }}> &middot; {planInfo.downloads_remaining} left this month</span>
              )}
            </p>
          </div>
          {downloads.length > 0 && (
            <>
              <button className="lib-hero-play" onClick={handlePlayAll} title="Play all">
                <Play size={18} style={{ marginLeft: 2 }} />
              </button>
              <button className="lib-hero-play" onClick={handleClearAll} title="Clear all downloads"
                style={{ borderColor: 'rgba(255,59,48,0.4)', color: 'rgba(255,59,48,0.7)' }}>
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>

        {/* ── Upgrade banner ── */}
        {planInfo && !planInfo.can_download && (
          <div className="lib-hero" style={{
            background: 'linear-gradient(135deg, #2a1a08 0%, #1a0f05 50%, #0a1510 100%)',
            cursor: 'pointer', marginBottom: 20,
          }} onClick={() => navigate('/pricing')}>
            <div className="lib-hero-icon" style={{ background: 'var(--sp-gold-dim)', color: 'var(--sp-gold)' }}>
              <Sparkles size={28} />
            </div>
            <div style={{ flex: 1 }}>
              <h2 className="lib-hero-title" style={{ fontSize: '1.05rem' }}>Unlock Offline Listening</h2>
              <p className="lib-hero-count" style={{ color: 'var(--sp-text-muted)' }}>
                Upgrade to Nashidify Plus or higher to save tracks and listen anywhere
              </p>
            </div>
            <ArrowRight size={20} style={{ color: 'var(--sp-gold)', flexShrink: 0 }} />
          </div>
        )}

        {/* ── Loading ── */}
        {loading ? (
          <div className="up-empty"><Loader2 size={20} className="up-spin" /> Loading downloads...</div>
        ) : downloads.length === 0 ? (
          /* ── Empty state ── */
          <div className="up-empty" style={{ paddingTop: 60, paddingBottom: 60 }}>
            <svg width="64" height="64" viewBox="0 0 20 20" style={{ marginBottom: 12, opacity: 0.15 }}>
              <polygon points={S8} fill="none" stroke="var(--sp-gold)" strokeWidth="0.7" />
            </svg>
            <Music size={40} style={{ color: 'var(--sp-text-muted)', marginBottom: 8 }} />
            <p style={{ fontWeight: 600, color: 'var(--sp-text)', fontSize: '1rem', margin: '0 0 6px' }}>No downloads yet</p>
            <p style={{ maxWidth: 320 }}>
              Save tracks for offline listening by tapping the download button on any track page.
            </p>
            <button className="up-showmore" onClick={() => navigate('/home')} style={{ marginTop: 16 }}>
              Browse Tracks
            </button>
          </div>
        ) : (
          /* ── Track list ── */
          <div className="up-tracklist">
            {downloads.map((track, i) => {
              const playing = isPlaying_(track)
              return (
                <div key={track.id} className={`up-track${playing ? ' playing' : ''}`}
                  onClick={() => navigate(`/tracks/${track.id}`)}>
                  <div className="up-track-left">
                    <span className="up-track-num" onClick={e => { e.stopPropagation(); handlePlay(track, downloads) }}>
                      {playing ? <span className="up-track-eq"><span /><span /><span /></span> : i + 1}
                    </span>
                    <div className="up-track-thumb" onClick={e => { e.stopPropagation(); handlePlay(track, downloads) }}>
                      {track.cover_url
                        ? <img src={track.cover_url} alt="" />
                        : <div className="up-track-thumb-placeholder"><Music size={16} /></div>
                      }
                      <div className="up-track-thumb-overlay">
                        {playing ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: 1 }} />}
                      </div>
                    </div>
                    <div className="up-track-info">
                      <span className={`up-track-title${playing ? ' active' : ''}`}>{track.title}</span>
                      <span className="up-track-artist">{track.user?.name || 'Unknown artist'}</span>
                    </div>
                  </div>
                  <div className="up-track-right" onClick={e => e.stopPropagation()}>
                    {/* Cached badge */}
                    <span className={`lib-badge ${track.is_cached ? 'lib-badge--approved' : 'lib-badge--pending'}`}>
                      {track.is_cached ? 'Cached' : 'Pending'}
                    </span>

                    <button className="up-act" onClick={() => { copyToClipboard(`${window.location.origin}/tracks/${track.id}`); toast.success('Link copied') }}>
                      <Share2 size={15} />
                    </button>

                    <button className="up-act" onClick={() => handleRemove(track)} title="Remove download"
                      style={{ color: 'var(--sp-text-muted)' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#FF3B30'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--sp-text-muted)'}>
                      <Trash2 size={15} />
                    </button>

                    <span className="up-track-duration">{fmtDur(track.duration_seconds)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Quran note ── */}
        {!loading && (
          <div style={{
            marginTop: 28, display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 18px', borderRadius: 12,
            background: 'var(--sp-bg-card)',
            border: '1px solid var(--sp-border)',
          }}>
            <svg width="20" height="20" viewBox="0 0 20 20" style={{ flexShrink: 0 }}>
              <polygon points={S8} fill="none" stroke="var(--sp-gold)" strokeWidth="0.8" opacity="0.6" />
            </svg>
            <span style={{ fontSize: '0.78rem', color: 'var(--sp-text-muted)', lineHeight: 1.5 }}>
              Quran recitations are always free to download on all plans. Knowledge of the Quran should never be behind a paywall.
            </span>
          </div>
        )}

        {/* ── Storage info footer ── */}
        {!loading && cacheStats.count > 0 && (
          <div style={{
            marginTop: 14, display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 18px', borderRadius: 10,
            fontSize: '0.72rem', color: 'var(--sp-text-muted)',
          }}>
            <HardDrive size={13} />
            <span>
              {cacheStats.count} track{cacheStats.count !== 1 ? 's' : ''} saved for offline &middot; {formatBytes(cacheStats.totalBytes)} used
              {cacheStats.quota > 0 && <> of {formatBytes(cacheStats.quota)}</>}
              {cacheStats.persistent && <> &middot; Persistent storage</>}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
