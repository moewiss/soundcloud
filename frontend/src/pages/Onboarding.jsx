import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { api } from '../services/api'
import { Globe, Music, Mic2, Heart, Clock, Users, ChevronRight, ChevronLeft, X, Check, Loader2 } from 'lucide-react'

// ─── Step Data ──────────────────────────────────────────────────────────────

const LANGUAGES = [
  { value: 'ar', label: 'Arabic', labelAr: '\u0627\u0644\u0639\u0631\u0628\u064A\u0629' },
  { value: 'en', label: 'English', labelAr: '' },
  { value: 'both', label: 'Both', labelAr: '\u0643\u0644\u0627\u0647\u0645\u0627' },
]

const CONTENT_TYPES = [
  { group: 'Nasheeds', items: [
    { value: 'classical_nasheeds', label: 'Classical / traditional nasheeds' },
    { value: 'modern_nasheeds', label: 'Modern nasheeds' },
    { value: 'children_nasheeds', label: "Children's nasheeds" },
  ]},
  { group: 'Quran', items: [
    { value: 'full_recitations', label: 'Full recitations' },
    { value: 'short_surahs', label: 'Short surahs & daily portions' },
    { value: 'tafsir', label: 'Tafsir & explanations' },
  ]},
  { group: 'Lectures', items: [
    { value: 'aqeedah', label: 'Aqeedah & theology' },
    { value: 'seerah', label: 'Seerah & Islamic history' },
    { value: 'fiqh', label: 'Fiqh & practical rulings' },
    { value: 'tarbiyah', label: 'Tarbiyah & self-development' },
  ]},
  { group: 'Podcasts', items: [
    { value: 'islamic_podcasts', label: 'Islamic podcasts' },
    { value: 'muslim_lifestyle', label: 'Muslim lifestyle & culture' },
  ]},
]

const STYLE_OPTIONS = [
  { value: 'vocals_only', label: 'Vocals only', desc: 'No instruments or percussion' },
  { value: 'acappella', label: 'A cappella', desc: 'Voices with light layering' },
  { value: 'light_percussion', label: 'Light percussion', desc: 'Daf, duff, soft rhythm allowed' },
  { value: 'full_instrumentation', label: 'Full instrumentation', desc: 'Comfortable with instruments' },
  { value: 'no_preference', label: 'No preference', desc: '' },
]

const MOODS = [
  { value: 'worship', label: 'Worship', desc: 'Feeling closer to Allah', icon: '\uD83D\uDD4C' },
  { value: 'focus', label: 'Focus', desc: 'Study, work, reading', icon: '\uD83E\uDDE0' },
  { value: 'calm', label: 'Calm', desc: 'Winding down, sleep, reflection', icon: '\uD83C\uDF19' },
  { value: 'learning', label: 'Learning', desc: 'Lectures, knowledge, growth', icon: '\uD83D\uDCDA' },
  { value: 'meditation', label: 'Meditation', desc: 'Dhikr, contemplation', icon: '\uD83E\uDDD8' },
]

const CONTEXTS = [
  { value: 'commute', label: 'On my commute', icon: '\uD83D\uDE97' },
  { value: 'prayer', label: 'Before or after prayer', icon: '\uD83D\uDD4B' },
  { value: 'night', label: 'Winding down at night', icon: '\uD83C\uDF1C' },
  { value: 'family', label: 'With my family', icon: '\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67\u200D\uD83D\uDC66' },
  { value: 'work_study', label: 'During work or study', icon: '\uD83D\uDCBB' },
  { value: 'home', label: 'While cooking or around the house', icon: '\uD83C\uDFE0' },
]

// ─── Main Component ─────────────────────────────────────────────────────────

export default function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [skipStyleScreen, setSkipStyleScreen] = useState(false)

  // Answers state
  const [languages, setLanguages] = useState([])
  const [contentTypes, setContentTypes] = useState([])
  const [stylePreference, setStylePreference] = useState('')
  const [moods, setMoods] = useState([])
  const [contexts, setContexts] = useState([])
  const [seedArtistIds, setSeedArtistIds] = useState([])
  const [candidateArtists, setCandidateArtists] = useState([])
  const [artistsLoading, setArtistsLoading] = useState(false)

  // Load existing state on mount
  useEffect(() => {
    loadState()
  }, [])

  const loadState = async () => {
    try {
      const data = await api.getOnboardingState()
      if (data.onboarding_state === 'completed' || data.onboarding_state === 'skipped') {
        navigate('/home', { replace: true })
        return
      }
      if (data.current_step > 0) {
        setStep(data.current_step + 1 <= 6 ? data.current_step + 1 : 6)
      }
      if (data.answers) {
        if (data.answers.languages) setLanguages(data.answers.languages)
        if (data.answers.content_types) setContentTypes(data.answers.content_types)
        if (data.answers.style_preference) setStylePreference(data.answers.style_preference)
        if (data.answers.moods) setMoods(data.answers.moods)
        if (data.answers.contexts) setContexts(data.answers.contexts)
        if (data.answers.seed_artist_ids) setSeedArtistIds(data.answers.seed_artist_ids)
      }
    } catch (e) {
      // New user, start fresh
    } finally {
      setLoading(false)
    }
  }

  // Check if nasheeds are selected (for conditional style screen)
  const hasNasheeds = contentTypes.some(t =>
    ['classical_nasheeds', 'modern_nasheeds', 'children_nasheeds'].includes(t)
  )

  const getEffectiveStep = (s) => {
    if (s === 3 && !hasNasheeds) return 4
    return s
  }

  const totalSteps = hasNasheeds ? 6 : 5
  const visualStep = (() => {
    if (!hasNasheeds && step >= 3) return step - 1
    return step
  })()

  // Load candidate artists when reaching step 6
  useEffect(() => {
    if (step === 6 && candidateArtists.length === 0) {
      loadCandidateArtists()
    }
  }, [step])

  const loadCandidateArtists = async () => {
    setArtistsLoading(true)
    try {
      const data = await api.getCandidateArtists()
      setCandidateArtists(data.artists || [])
    } catch (e) {
      toast.error('Failed to load artists')
    } finally {
      setArtistsLoading(false)
    }
  }

  const saveCurrentStep = async () => {
    setSaving(true)
    try {
      let payload = { step }
      switch (step) {
        case 1:
          // Convert "both" to ["ar", "en"]
          const langValues = languages.includes('both') ? ['ar', 'en'] : languages
          payload.languages = langValues
          break
        case 2:
          payload.content_types = contentTypes
          break
        case 3:
          payload.style_preference = stylePreference
          break
        case 4:
          payload.moods = moods
          break
        case 5:
          payload.contexts = contexts
          break
        case 6:
          payload.seed_artist_ids = seedArtistIds
          break
      }
      const res = await api.saveOnboardingStep(step, payload)
      if (res.skipped) {
        setSkipStyleScreen(true)
      }
      return true
    } catch (e) {
      const msg = e.response?.data?.message || e.response?.data?.errors
      if (msg) {
        if (typeof msg === 'object') {
          const firstErr = Object.values(msg)[0]
          toast.error(Array.isArray(firstErr) ? firstErr[0] : String(firstErr))
        } else {
          toast.error(msg)
        }
      } else {
        toast.error('Failed to save')
      }
      return false
    } finally {
      setSaving(false)
    }
  }

  const handleNext = async () => {
    if (!canProceed()) return
    const saved = await saveCurrentStep()
    if (!saved) return

    if (step >= 6) {
      await handleComplete()
    } else {
      let next = step + 1
      if (next === 3 && !hasNasheeds) next = 4
      setStep(next)
    }
  }

  const handleBack = () => {
    let prev = step - 1
    if (prev === 3 && !hasNasheeds) prev = 2
    if (prev >= 1) setStep(prev)
  }

  const handleSkipStep = async () => {
    setSaving(true)
    try {
      // Save as skip — just advance without data
      await api.saveOnboardingStep(step, { step })
    } catch (e) {
      // Ignore skip errors, just advance
    } finally {
      setSaving(false)
    }
    let next = step + 1
    if (next === 3 && !hasNasheeds) next = 4
    if (next > 6) {
      await handleComplete()
    } else {
      setStep(next)
    }
  }

  const handleSkipAll = async () => {
    setSaving(true)
    try {
      await api.skipOnboarding()
      localStorage.setItem('onboarding_state', 'skipped')
      navigate('/home', { replace: true })
    } catch (e) {
      toast.error('Failed to skip')
    } finally {
      setSaving(false)
    }
  }

  const handleComplete = async () => {
    setSaving(true)
    try {
      await api.completeOnboarding()
      localStorage.setItem('onboarding_state', 'completed')
      toast.success('Your feed is being personalized!')
      navigate('/home', { replace: true })
    } catch (e) {
      toast.error('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const canProceed = () => {
    switch (step) {
      case 1: return languages.length > 0
      case 2: return contentTypes.length > 0
      case 3: return stylePreference !== ''
      case 4: return moods.length > 0
      case 5: return contexts.length > 0
      case 6: return seedArtistIds.length >= 2
      default: return false
    }
  }

  const toggleLanguage = (val) => {
    if (val === 'both') {
      setLanguages(languages.includes('both') ? [] : ['both'])
    } else {
      setLanguages(prev => {
        const filtered = prev.filter(l => l !== 'both')
        if (filtered.includes(val)) {
          return filtered.filter(l => l !== val)
        }
        const newLangs = [...filtered, val]
        return newLangs.length === 2 ? ['both'] : newLangs
      })
    }
  }

  const toggleContentType = (val) => {
    setContentTypes(prev =>
      prev.includes(val) ? prev.filter(t => t !== val) : [...prev, val]
    )
  }

  const toggleMood = (val) => {
    setMoods(prev => {
      if (prev.includes(val)) return prev.filter(m => m !== val)
      if (prev.length >= 3) { toast.error('Maximum 3 moods'); return prev }
      return [...prev, val]
    })
  }

  const toggleContext = (val) => {
    setContexts(prev =>
      prev.includes(val) ? prev.filter(c => c !== val) : [...prev, val]
    )
  }

  const toggleArtist = (id) => {
    setSeedArtistIds(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    )
  }

  if (loading) {
    return (
      <div className="ob-loading">
        <Loader2 size={32} className="ob-spin" />
      </div>
    )
  }

  return (
    <div className="ob-page">
      {/* Background decoration */}
      <div className="ob-bg">
        <div className="ob-bg-pattern" />
      </div>

      <div className="ob-container">
        {/* Header */}
        <div className="ob-header">
          <div className="ob-progress-wrap">
            <div className="ob-progress-bar">
              <div
                className="ob-progress-fill"
                style={{ width: `${(visualStep / totalSteps) * 100}%` }}
              />
            </div>
            <span className="ob-progress-text">{visualStep} of {totalSteps}</span>
          </div>
          <button className="ob-skip-btn" onClick={handleSkipStep} disabled={saving}>
            Skip
          </button>
        </div>

        {/* Step Content */}
        <div className="ob-content">
          {step === 1 && (
            <StepLanguage
              selected={languages}
              onToggle={toggleLanguage}
            />
          )}
          {step === 2 && (
            <StepContentTypes
              selected={contentTypes}
              onToggle={toggleContentType}
            />
          )}
          {step === 3 && (
            <StepStyle
              selected={stylePreference}
              onSelect={setStylePreference}
            />
          )}
          {step === 4 && (
            <StepMoods
              selected={moods}
              onToggle={toggleMood}
            />
          )}
          {step === 5 && (
            <StepContexts
              selected={contexts}
              onToggle={toggleContext}
            />
          )}
          {step === 6 && (
            <StepArtists
              artists={candidateArtists}
              selected={seedArtistIds}
              onToggle={toggleArtist}
              loading={artistsLoading}
            />
          )}
        </div>

        {/* Footer */}
        <div className="ob-footer">
          {step > 1 && (
            <button className="ob-back-btn" onClick={handleBack} disabled={saving}>
              <ChevronLeft size={18} />
              Back
            </button>
          )}
          {step === 1 && (
            <button className="ob-skip-all-btn" onClick={handleSkipAll} disabled={saving}>
              Skip onboarding
            </button>
          )}
          <button
            className="ob-next-btn"
            onClick={handleNext}
            disabled={!canProceed() || saving}
          >
            {saving ? (
              <Loader2 size={18} className="ob-spin" />
            ) : step >= 6 ? (
              <>Get Started</>
            ) : (
              <>Continue <ChevronRight size={18} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Step Components ────────────────────────────────────────────────────────

function StepLanguage({ selected, onToggle }) {
  return (
    <div className="ob-step">
      <div className="ob-step-icon"><Globe size={32} /></div>
      <h1 className="ob-title">Which language do you listen in?</h1>
      <p className="ob-subtitle">We'll tailor your feed to content you understand</p>
      <div className="ob-chips">
        {LANGUAGES.map(lang => (
          <button
            key={lang.value}
            className={`ob-chip ob-chip-lg ${selected.includes(lang.value) ? 'ob-chip-active' : ''}`}
            onClick={() => onToggle(lang.value)}
          >
            <span className="ob-chip-label">{lang.label}</span>
            {lang.labelAr && <span className="ob-chip-ar">{lang.labelAr}</span>}
            {selected.includes(lang.value) && <Check size={16} className="ob-chip-check" />}
          </button>
        ))}
      </div>
    </div>
  )
}

function StepContentTypes({ selected, onToggle }) {
  return (
    <div className="ob-step">
      <div className="ob-step-icon"><Music size={32} /></div>
      <h1 className="ob-title">What do you want to listen to?</h1>
      <p className="ob-subtitle">Pick as many as you like</p>
      <div className="ob-content-groups">
        {CONTENT_TYPES.map(group => (
          <div key={group.group} className="ob-group">
            <h3 className="ob-group-label">{group.group}</h3>
            <div className="ob-chips ob-chips-wrap">
              {group.items.map(item => (
                <button
                  key={item.value}
                  className={`ob-chip ${selected.includes(item.value) ? 'ob-chip-active' : ''}`}
                  onClick={() => onToggle(item.value)}
                >
                  {item.label}
                  {selected.includes(item.value) && <Check size={14} className="ob-chip-check" />}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function StepStyle({ selected, onSelect }) {
  return (
    <div className="ob-step">
      <div className="ob-step-icon"><Mic2 size={32} /></div>
      <h1 className="ob-title">How do you prefer your nasheeds?</h1>
      <p className="ob-subtitle">This helps us respect your preferences</p>
      <div className="ob-options">
        {STYLE_OPTIONS.map(opt => (
          <button
            key={opt.value}
            className={`ob-option ${selected === opt.value ? 'ob-option-active' : ''}`}
            onClick={() => onSelect(opt.value)}
          >
            <div className="ob-option-text">
              <span className="ob-option-label">{opt.label}</span>
              {opt.desc && <span className="ob-option-desc">{opt.desc}</span>}
            </div>
            {selected === opt.value && <Check size={18} className="ob-option-check" />}
          </button>
        ))}
      </div>
    </div>
  )
}

function StepMoods({ selected, onToggle }) {
  return (
    <div className="ob-step">
      <div className="ob-step-icon"><Heart size={32} /></div>
      <h1 className="ob-title">What are you looking for?</h1>
      <p className="ob-subtitle">Pick up to 3</p>
      <div className="ob-mood-grid">
        {MOODS.map(mood => (
          <button
            key={mood.value}
            className={`ob-mood-card ${selected.includes(mood.value) ? 'ob-mood-active' : ''}`}
            onClick={() => onToggle(mood.value)}
          >
            <span className="ob-mood-icon">{mood.icon}</span>
            <span className="ob-mood-label">{mood.label}</span>
            <span className="ob-mood-desc">{mood.desc}</span>
            {selected.includes(mood.value) && <Check size={16} className="ob-mood-check" />}
          </button>
        ))}
      </div>
    </div>
  )
}

function StepContexts({ selected, onToggle }) {
  return (
    <div className="ob-step">
      <div className="ob-step-icon"><Clock size={32} /></div>
      <h1 className="ob-title">When do you usually listen?</h1>
      <p className="ob-subtitle">This helps us pick the right track lengths</p>
      <div className="ob-chips ob-chips-wrap ob-chips-context">
        {CONTEXTS.map(ctx => (
          <button
            key={ctx.value}
            className={`ob-chip ob-chip-context ${selected.includes(ctx.value) ? 'ob-chip-active' : ''}`}
            onClick={() => onToggle(ctx.value)}
          >
            <span className="ob-ctx-icon">{ctx.icon}</span>
            <span>{ctx.label}</span>
            {selected.includes(ctx.value) && <Check size={14} className="ob-chip-check" />}
          </button>
        ))}
      </div>
    </div>
  )
}

function StepArtists({ artists, selected, onToggle, loading }) {
  return (
    <div className="ob-step">
      <div className="ob-step-icon"><Users size={32} /></div>
      <h1 className="ob-title">Who do you love listening to?</h1>
      <p className="ob-subtitle">
        Follow at least 2 to continue
        {selected.length > 0 && <span className="ob-artist-count"> &middot; {selected.length} selected</span>}
      </p>
      {loading ? (
        <div className="ob-artists-loading">
          <Loader2 size={24} className="ob-spin" />
          <span>Loading artists...</span>
        </div>
      ) : (
        <div className="ob-artist-grid">
          {artists.map(artist => (
            <button
              key={artist.id}
              className={`ob-artist-card ${selected.includes(artist.id) ? 'ob-artist-active' : ''}`}
              onClick={() => onToggle(artist.id)}
            >
              <div className="ob-artist-avatar">
                {artist.avatar_url ? (
                  <img src={artist.avatar_url} alt={artist.name} />
                ) : (
                  <div className="ob-artist-placeholder">
                    {artist.name?.charAt(0)?.toUpperCase()}
                  </div>
                )}
                {selected.includes(artist.id) && (
                  <div className="ob-artist-check-overlay">
                    <Check size={20} />
                  </div>
                )}
              </div>
              <span className="ob-artist-name">{artist.name}</span>
              <span className="ob-artist-tracks">{artist.track_count} tracks</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
