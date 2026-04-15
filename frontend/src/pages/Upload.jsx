import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { api } from '../services/api'
import { requireAuth } from '../utils/auth'

export default function Upload() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [planFeatures, setPlanFeatures] = useState(null)

  useEffect(() => {
    if (!requireAuth(navigate, 'Please login to upload tracks')) {
      return
    }
    // Fetch plan features
    api.getSubscriptionStatus().then(data => {
      setPlanFeatures(data.features || null)
    }).catch(() => {})
  }, [])

  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [audioFiles, setAudioFiles] = useState([])
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)
  const [audioDuration, setAudioDuration] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadMode, setUploadMode] = useState('file') // 'file' | 'youtube'
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [youtubeLoading, setYoutubeLoading] = useState(false)
  const fileInputRef = useRef(null)
  const coverInputRef = useRef(null)

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    lyrics: '',
    tags: '',
    privacy: 'public'
  })

  const categories = [
    'Nasheeds', 'Quran', 'Duas', 'Stories',
    'Lectures', 'Podcasts', 'Audiobooks',
    'Education', 'Entertainment', 'News', 'Other'
  ]

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    processAudioFiles(files)
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 0) {
      processAudioFiles(files)
    }
  }

  const processAudioFiles = (files) => {
    const audioFilesArray = files.filter(f => {
      const type = f.type.toLowerCase()
      const name = f.name.toLowerCase()
      return type.startsWith('audio/') ||
        type === 'video/mpeg' ||
        type === 'video/mp4' ||
        name.endsWith('.mp3') ||
        name.endsWith('.wav') ||
        name.endsWith('.flac') ||
        name.endsWith('.ogg') ||
        name.endsWith('.m4a') ||
        name.endsWith('.aac') ||
        name.endsWith('.wma') ||
        name.endsWith('.opus') ||
        name.endsWith('.webm')
    })
    if (audioFilesArray.length === 0) {
      toast.error('Please upload audio files')
      return
    }

    setAudioFiles(audioFilesArray)
    setFormData(prev => ({ ...prev, title: audioFilesArray[0].name.replace(/\.[^/.]+$/, '') }))

    const audio = new Audio()
    audio.src = URL.createObjectURL(audioFilesArray[0])
    audio.onloadedmetadata = () => {
      setAudioDuration(audio.duration)
    }

    setStep(2)
  }

  const handleCoverSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      setCoverFile(file)
      setCoverPreview(URL.createObjectURL(file))
    }
  }

  const formatDuration = (sec) => {
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (audioFiles.length === 0) {
      toast.error('Please select audio file(s)')
      return
    }

    if (!formData.title.trim()) {
      toast.error('Please enter a title')
      return
    }

    setLoading(true)
    let successCount = 0

    try {
      for (let i = 0; i < audioFiles.length; i++) {
        const file = audioFiles[i]
        const data = new FormData()
        data.append('file', file)

        const title = audioFiles.length === 1
          ? formData.title
          : `${formData.title} - ${i + 1}`

        data.append('title', title)
        data.append('category', formData.category)
        data.append('description', formData.description)
        if (formData.lyrics) data.append('lyrics', formData.lyrics)
        if (formData.tags) data.append('tags', formData.tags)
        if (coverFile && i === 0) data.append('cover', coverFile)

        const progress = Math.round(((i + 1) / audioFiles.length) * 90)
        setUploadProgress(progress)

        await api.uploadTrack(data)
        successCount++
      }

      setUploadProgress(100)
      toast.success(`${successCount} track(s) uploaded successfully!`)
      navigate('/my-tracks', { state: { fromUpload: true } })
    } catch (error) {
      if (error.response?.status === 403 && error.response?.data?.uploads_remaining !== undefined) {
        toast.error(error.response.data.message || 'Upload limit reached')
        // Refresh plan features
        api.getSubscriptionStatus().then(data => setPlanFeatures(data.features || null)).catch(() => {})
      } else if (successCount > 0) {
        toast.success(`${successCount} of ${audioFiles.length} tracks uploaded`)
      } else {
        toast.error(error.response?.data?.message || 'Failed to upload tracks')
      }
    } finally {
      setLoading(false)
      setUploadProgress(0)
    }
  }

  const resetUpload = () => {
    setAudioFiles([])
    setStep(1)
    setFormData({ title: '', category: '', description: '', lyrics: '', tags: '', privacy: 'public' })
    setCoverFile(null)
    setCoverPreview(null)
  }

  const handleYoutubeImport = async (e) => {
    e.preventDefault()
    if (!youtubeUrl.trim()) return toast.error('Please paste a YouTube link')
    if (!/youtube\.com|youtu\.be/.test(youtubeUrl)) return toast.error('Only YouTube links are supported')
    if (!formData.title.trim()) return toast.error('Please enter a title')

    setYoutubeLoading(true)
    try {
      await api.importFromYoutube({
        url: youtubeUrl,
        title: formData.title,
        category: formData.category,
        description: formData.description,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
      })
      toast.success('Import started! Your track will appear in My Tracks once ready.')
      navigate('/my-tracks')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Import failed')
    } finally {
      setYoutubeLoading(false)
    }
  }

  return (
    <div style={{ padding: '32px', maxWidth: '960px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--sp-white)', marginBottom: '8px' }}>
          Upload
        </h1>
        <p style={{ color: 'var(--sp-text-sub)', letterSpacing: '-0.01em' }}>Share your sounds with the world</p>
      </div>

      {/* Plan usage banner */}
      {planFeatures && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--sp-bg-card)', border: '1px solid rgba(0,0,0,0.05)',
          borderRadius: '14px', padding: '14px 18px', marginBottom: '24px', gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fas fa-cloud-arrow-up" style={{ color: 'var(--sp-green)', fontSize: '1rem' }}></i>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--sp-text)' }}>
                {planFeatures.uploads_remaining === null ? 'Unlimited uploads' : `${planFeatures.uploads_remaining} uploads remaining this month`}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--sp-text-sub)' }}>
                {planFeatures.plan_name} plan · Max {planFeatures.max_file_size_mb}MB per file
              </div>
            </div>
          </div>
          {planFeatures.plan === 'free' && (
            <button onClick={() => navigate('/pricing')} style={{
              padding: '7px 16px', borderRadius: '50px', border: 'none', fontSize: '0.74rem',
              fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              background: 'linear-gradient(135deg, #C9A24D, #A88834)', color: '#0F1E1A',
              boxShadow: '0 2px 8px rgba(201,162,77,0.3)', transition: 'transform 0.2s',
            }}>
              <i className="fas fa-crown" style={{ marginRight: '5px' }}></i>Upgrade
            </button>
          )}
        </div>
      )}

      {/* Upload limit reached */}
      {planFeatures && planFeatures.uploads_remaining !== null && planFeatures.uploads_remaining <= 0 && (
        <div style={{
          background: 'rgba(192,57,43,0.06)', border: '1px solid rgba(192,57,43,0.15)',
          borderRadius: '14px', padding: '20px', marginBottom: '24px', textAlign: 'center',
        }}>
          <i className="fas fa-exclamation-circle" style={{ color: '#c0392b', fontSize: '1.3rem', marginBottom: '8px', display: 'block' }}></i>
          <p style={{ color: 'var(--sp-text)', fontWeight: 600, fontSize: '0.9rem', margin: '0 0 4px' }}>Upload limit reached</p>
          <p style={{ color: 'var(--sp-text-sub)', fontSize: '0.8rem', margin: '0 0 14px' }}>
            Your {planFeatures.plan_name} plan allows {planFeatures.uploads_remaining === 0 ? 'no more' : planFeatures.uploads_remaining} uploads this month.
          </p>
          <button onClick={() => navigate('/pricing')} style={{
            padding: '10px 24px', borderRadius: '50px', border: 'none', fontSize: '0.84rem',
            fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            background: 'linear-gradient(135deg, #C9A24D, #A88834)', color: '#0F1E1A',
          }}>
            Upgrade Plan
          </button>
        </div>
      )}

      {/* Mode toggle */}
      {step === 1 && (
        <div style={{ display: 'flex', gap: '0', marginBottom: '28px', background: 'var(--sp-bg-elevated)', borderRadius: '14px', padding: '4px', width: 'fit-content' }}>
          {[['file', 'fa-upload', 'Upload File'], ['youtube', 'fab fa-youtube', 'Import from YouTube']].map(([mode, icon, label]) => (
            <button key={mode} type="button"
              onClick={() => setUploadMode(mode)}
              style={{
                padding: '10px 22px', borderRadius: '14px', border: 'none', cursor: 'pointer',
                background: uploadMode === mode ? 'var(--sp-green)' : 'rgba(142,142,147,0.08)',
                color: uploadMode === mode ? 'var(--sp-black)' : 'var(--sp-text-sub)',
                fontWeight: uploadMode === mode ? 600 : 400,
                fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px',
                letterSpacing: '-0.01em',
                transition: 'all 0.2s'
              }}>
              <i className={icon.startsWith('fab') ? icon : `fas ${icon}`}></i> {label}
            </button>
          ))}
        </div>
      )}

      {step === 1 && uploadMode === 'youtube' ? (
        <div style={{ maxWidth: '600px' }}>
          <div style={{ background: 'var(--sp-bg-elevated)', borderRadius: '16px', padding: '32px', border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px' }}>
              <div style={{ width: '56px', height: '56px', background: '#ff0000', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fab fa-youtube" style={{ fontSize: '28px', color: 'white' }}></i>
              </div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--sp-white)' }}>Import from YouTube</div>
                <div style={{ fontSize: '13px', color: 'var(--sp-text-muted)', letterSpacing: '-0.01em' }}>Paste a YouTube link to import audio</div>
              </div>
            </div>

            <form onSubmit={handleYoutubeImport}>
              <div className="sp-form-group">
                <label className="sp-form-label">YouTube Link *</label>
                <input
                  type="url"
                  className="sp-form-input"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={youtubeUrl}
                  onChange={e => setYoutubeUrl(e.target.value)}
                  required
                />
              </div>

              <div className="sp-form-group">
                <label className="sp-form-label">Title *</label>
                <input type="text" className="sp-form-input"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Track title" required />
              </div>

              <div className="sp-form-group">
                <label className="sp-form-label">Category</label>
                <select className="sp-form-select"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}>
                  <option value="">Select a category</option>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div className="sp-form-group">
                <label className="sp-form-label">Description</label>
                <textarea className="sp-form-textarea" rows={3}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe this track" />
              </div>

              <div className="sp-form-group">
                <label className="sp-form-label">Lyrics <span style={{ opacity: 0.5, fontWeight: 400, textTransform: 'none' }}>(optional)</span></label>
                <textarea className="sp-form-textarea" rows={5}
                  value={formData.lyrics}
                  onChange={e => setFormData({ ...formData, lyrics: e.target.value })}
                  placeholder="Paste nasheed lyrics or Quran text here..." style={{ fontFamily: "'Amiri', 'Cairo', serif", lineHeight: 1.8 }} />
              </div>

              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '14px', padding: '12px 14px', marginBottom: '20px', fontSize: '13px', color: 'var(--sp-text-muted)', letterSpacing: '-0.01em' }}>
                <i className="fas fa-info-circle" style={{ marginRight: '8px' }}></i>
                The audio will be downloaded in the background. You can check the status in <strong style={{ color: 'var(--sp-text-sub)' }}>My Tracks</strong>.
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="sp-btn sp-btn-ghost" onClick={() => navigate(-1)}>Cancel</button>
                <button type="submit" className="sp-btn sp-btn-primary" disabled={youtubeLoading} style={{ minWidth: '140px' }}>
                  {youtubeLoading ? <><i className="fas fa-spinner fa-spin"></i> Importing...</> : <><i className="fab fa-youtube"></i> Import</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : step === 1 ? (
        <div
          className={`sp-upload-zone${isDragging ? ' dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            accept="audio/*,.mp3,.wav,.flac,.ogg,.m4a,.aac,.wma,.opus,.webm"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />

          <div style={{
            width: '80px',
            height: '80px',
            background: 'var(--sp-green)',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px'
          }}>
            <i className="fas fa-cloud-upload-alt" style={{ fontSize: '32px', color: 'var(--sp-black)' }}></i>
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--sp-white)', marginBottom: '12px' }}>
            Drag and drop your tracks here
          </h2>
          <p style={{ color: 'var(--sp-text-sub)', marginBottom: '24px', letterSpacing: '-0.01em' }}>
            or choose files to upload
          </p>

          <button
            className="sp-btn sp-btn-primary"
            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
            style={{ padding: '14px 40px', fontSize: '15px' }}
          >
            Select Files
          </button>

          <p style={{ color: 'var(--sp-text-muted)', fontSize: '12px', marginTop: '24px', letterSpacing: '-0.01em' }}>
            Supports: MP3, WAV, FLAC, OGG, M4A, AAC, WMA, OPUS, WEBM. Max: {planFeatures?.max_file_size_mb || 200}MB
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: '32px' }}>
            {/* Left Column - Artwork */}
            <div style={{ width: '280px', flexShrink: 0 }}>
              <div
                style={{
                  width: '280px',
                  height: '280px',
                  background: coverPreview ? 'transparent' : 'var(--sp-bg-highlight)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  position: 'relative',
                  marginBottom: '16px',
                  border: 'none'
                }}
                onClick={() => coverInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={coverInputRef}
                  accept="image/*"
                  onChange={handleCoverSelect}
                  style={{ display: 'none' }}
                />

                {coverPreview ? (
                  <>
                    <img src={coverPreview} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,0,0,0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0,
                        transition: 'opacity 0.2s',
                        color: 'white'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
                    >
                      <i className="fas fa-camera" style={{ fontSize: '28px' }}></i>
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <i className="fas fa-image" style={{ fontSize: '40px', color: 'var(--sp-text-muted)', marginBottom: '12px', display: 'block' }}></i>
                    <p style={{ color: 'var(--sp-text-muted)', fontSize: '14px' }}>Upload artwork</p>
                  </div>
                )}
              </div>

              {/* File info */}
              <div style={{
                background: 'var(--sp-bg-elevated)',
                padding: '14px',
                borderRadius: '14px',
                border: 'none'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <i className="fas fa-music" style={{ color: 'var(--sp-green)', fontSize: '18px' }}></i>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--sp-white)', letterSpacing: '-0.01em' }}>
                      {audioFiles.length === 1 ? audioFiles[0]?.name : `${audioFiles.length} files selected`}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--sp-text-muted)', letterSpacing: '-0.01em' }}>
                      {formatDuration(audioDuration)} · {audioFiles[0] ? (audioFiles[0].size / (1024 * 1024)).toFixed(1) : '0'} MB
                      {audioFiles.length > 1 && ` (+ ${audioFiles.length - 1} more)`}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={resetUpload}
                    style={{ background: 'none', border: 'none', color: 'var(--sp-text-muted)', cursor: 'pointer', padding: '4px' }}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column - Form */}
            <div style={{ flex: 1 }}>
              <div className="sp-form-group">
                <label className="sp-form-label">Title *</label>
                <input
                  type="text"
                  className="sp-form-input"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Name your track"
                  required
                />
              </div>

              <div className="sp-form-group">
                <label className="sp-form-label">Category</label>
                <select
                  className="sp-form-select"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="sp-form-group">
                <label className="sp-form-label">Description</label>
                <textarea
                  className="sp-form-textarea"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your track"
                  rows={4}
                />
              </div>

              <div className="sp-form-group">
                <label className="sp-form-label">Lyrics <span style={{ opacity: 0.5, fontWeight: 400, textTransform: 'none' }}>(optional)</span></label>
                <textarea
                  className="sp-form-textarea"
                  value={formData.lyrics}
                  onChange={(e) => setFormData({ ...formData, lyrics: e.target.value })}
                  placeholder="Paste nasheed lyrics or Quran text here..."
                  rows={6}
                  style={{ fontFamily: "'Amiri', 'Cairo', serif", lineHeight: 1.8 }}
                />
              </div>

              <div className="sp-form-group">
                <label className="sp-form-label">Tags</label>
                <input
                  type="text"
                  className="sp-form-input"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="Add tags separated by commas (e.g. nasheed, arabic, vocal)"
                />
                <p style={{ fontSize: '12px', color: 'var(--sp-text-muted)', marginTop: '6px', letterSpacing: '-0.01em' }}>
                  Tags help listeners discover your track.
                </p>
              </div>

              <div className="sp-form-group">
                <label className="sp-form-label">Privacy</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {['public', 'private'].map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setFormData({ ...formData, privacy: opt })}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 20px',
                        background: formData.privacy === opt ? 'var(--sp-green)' : 'rgba(142,142,147,0.08)',
                        color: formData.privacy === opt ? 'var(--sp-black)' : 'var(--sp-text-sub)',
                        borderRadius: '14px',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: formData.privacy === opt ? 600 : 400,
                        fontSize: '14px',
                        transition: 'all 0.2s'
                      }}
                    >
                      <i className={`fas fa-${opt === 'public' ? 'globe' : 'lock'}`}></i>
                      <span style={{ textTransform: 'capitalize' }}>{opt}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Progress Bar */}
              {loading && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--sp-white)', fontSize: '14px' }}>Uploading...</span>
                    <span style={{ color: 'var(--sp-green)', fontSize: '14px', fontWeight: 600 }}>{uploadProgress}%</span>
                  </div>
                  <div style={{
                    height: '4px',
                    background: 'var(--sp-bg-highlight)',
                    borderRadius: '100px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      background: 'var(--sp-green)',
                      width: `${uploadProgress}%`,
                      transition: 'width 0.3s',
                      borderRadius: '100px'
                    }}></div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="sp-btn sp-btn-ghost"
                  onClick={() => navigate(-1)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="sp-btn sp-btn-primary"
                  disabled={loading}
                  style={{ minWidth: '140px' }}
                >
                  {loading ? (
                    <><i className="fas fa-spinner fa-spin"></i> Uploading...</>
                  ) : (
                    <><i className="fas fa-upload"></i> Upload</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}
