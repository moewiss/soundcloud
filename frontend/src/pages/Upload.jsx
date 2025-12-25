import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { api } from '../services/api'

export default function Upload() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [audioFile, setAudioFile] = useState(null)
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)
  const [audioDuration, setAudioDuration] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)
  const coverInputRef = useRef(null)

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    tags: '',
    privacy: 'public'
  })

  const categories = [
    'Music', 'Podcasts', 'Lectures', 'Audiobooks', 'Stories', 
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
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('audio/')) {
      processAudioFile(file)
    } else {
      toast.error('Please upload an audio file')
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      processAudioFile(file)
    }
  }

  const processAudioFile = (file) => {
    setAudioFile(file)
    setFormData(prev => ({ ...prev, title: file.name.replace(/\.[^/.]+$/, '') }))
    
    const audio = new Audio()
    audio.src = URL.createObjectURL(file)
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
    
    if (!audioFile) {
      toast.error('Please select an audio file')
      return
    }

    if (!formData.title.trim()) {
      toast.error('Please enter a title')
      return
    }

    setLoading(true)

    try {
      const data = new FormData()
      data.append('audio', audioFile)
      data.append('title', formData.title)
      data.append('category', formData.category)
      data.append('description', formData.description)
      if (coverFile) data.append('cover', coverFile)

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      await api.uploadTrack(data)
      
      setUploadProgress(100)
      clearInterval(progressInterval)
      
      toast.success('Track uploaded successfully!')
      navigate('/library')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to upload track')
    } finally {
      setLoading(false)
      setUploadProgress(0)
    }
  }

  return (
    <div className="page">
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ fontSize: '28px', marginBottom: '10px', color: 'var(--text-primary)' }}>Upload to AudioCloud</h1>
          <p style={{ color: 'var(--text-muted)' }}>Share your sounds with the world</p>
        </div>

        {step === 1 ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
              background: isDragging ? 'var(--primary-soft)' : 'var(--bg-white)',
              border: `2px dashed ${isDragging ? 'var(--primary)' : 'var(--border-light)'}`,
              borderRadius: 'var(--radius-lg)',
              padding: '80px 40px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept="audio/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />

            <div style={{
              width: '100px',
              height: '100px',
              background: 'var(--primary)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 30px',
              color: 'white'
            }}>
              <i className="fas fa-cloud-upload-alt" style={{ fontSize: '40px' }}></i>
            </div>

            <h2 style={{ fontSize: '24px', marginBottom: '15px', color: 'var(--text-primary)' }}>
              Drag and drop your tracks & albums here
            </h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '25px' }}>
              or choose files to upload
            </p>

            <button
              className="btn btn-primary"
              style={{ padding: '14px 40px', fontSize: '15px' }}
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
            >
              <i className="fas fa-upload"></i> Select Files
            </button>

            <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '30px' }}>
              Provide FLAC, WAV, ALAC, or AIFF for best audio quality. Max file size: 4GB
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', gap: '30px' }}>
              <div style={{ width: '300px', flexShrink: 0 }}>
                <div
                  style={{
                    width: '300px',
                    height: '300px',
                    background: coverPreview ? 'transparent' : 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-lg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    position: 'relative',
                    marginBottom: '20px',
                    border: '1px solid var(--border-light)'
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
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0,
                        transition: 'opacity 0.3s',
                        color: 'white'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
                      >
                        <i className="fas fa-camera" style={{ fontSize: '30px' }}></i>
                      </div>
                    </>
                  ) : (
                    <div style={{ textAlign: 'center' }}>
                      <i className="fas fa-image" style={{ fontSize: '50px', color: 'var(--text-muted)', marginBottom: '15px', display: 'block' }}></i>
                      <p style={{ color: 'var(--text-muted)' }}>Upload artwork</p>
                    </div>
                  )}
                </div>

                <div style={{
                  background: 'var(--bg-white)',
                  padding: '15px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <i className="fas fa-music" style={{ color: 'var(--primary)', fontSize: '20px' }}></i>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>
                        {audioFile?.name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {formatDuration(audioDuration)} · {(audioFile?.size / (1024 * 1024)).toFixed(1)} MB
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setAudioFile(null); setStep(1); }}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Name your track"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-input"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="">None</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-textarea"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your track"
                    rows={4}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Privacy</label>
                  <div style={{ display: 'flex', gap: '15px' }}>
                    {['public', 'private'].map(opt => (
                      <label
                        key={opt}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          cursor: 'pointer',
                          padding: '10px 20px',
                          background: formData.privacy === opt ? 'var(--primary)' : 'var(--bg-secondary)',
                          color: formData.privacy === opt ? 'white' : 'var(--text-secondary)',
                          borderRadius: 'var(--radius-sm)'
                        }}
                      >
                        <input
                          type="radio"
                          name="privacy"
                          value={opt}
                          checked={formData.privacy === opt}
                          onChange={(e) => setFormData({ ...formData, privacy: e.target.value })}
                          style={{ display: 'none' }}
                        />
                        <i className={`fas fa-${opt === 'public' ? 'globe' : 'lock'}`}></i>
                        <span style={{ textTransform: 'capitalize' }}>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {loading && (
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'var(--text-primary)' }}>
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div style={{
                      height: '8px',
                      background: 'var(--bg-secondary)',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        background: 'var(--primary)',
                        width: `${uploadProgress}%`,
                        transition: 'width 0.3s'
                      }}></div>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn"
                    style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    onClick={() => navigate(-1)}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                    style={{ minWidth: '150px' }}
                  >
                    {loading ? (
                      <><i className="fas fa-spinner fa-spin"></i> Uploading...</>
                    ) : (
                      <><i className="fas fa-upload"></i> Save</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
