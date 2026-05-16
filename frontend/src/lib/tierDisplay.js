// tierDisplay — web single source of truth for user-facing tier names.
//
// Mirrors the mobile app's @lib/tierDisplay. Backend plan SLUGS
// (`free` / `plus` / `artist` / `artist_pro`) remain the wire contract
// until the backend tier-collapse migration lands; the web only changes
// what the user SEES so the creator tier reads as "Munshid · المنشد"
// while the API still returns `artist_pro`.
//
// Tier-collapse model (target): free · plus · (free basic creator) ·
// Munshid (the paid creator upgrade — full portal + AI + analytics).
// The legacy free `artist` tier is folded away in the UI.

// Slugs that mean "Munshid" (the paid creator tier). Dual-accept across
// the transition: legacy `artist_pro` and the eventual `munshid`.
export const MUNSHID_SLUGS = ['artist_pro', 'munshid']

// Legacy creator slug being collapsed out of the UI.
export const LEGACY_ARTIST_SLUG = 'artist'

const TIER_NAMES = {
  free: { name: 'Free', arabic: null },
  plus: { name: 'Plus', arabic: null },
  // Legacy free-artist tier — folded into Munshid branding if it ever
  // surfaces (it is hidden from pricing).
  artist: { name: 'Munshid', arabic: 'المنشد' },
  artist_pro: { name: 'Munshid', arabic: 'المنشد' },
  munshid: { name: 'Munshid', arabic: 'المنشد' },
}

export function tierName(slug) {
  return TIER_NAMES[slug]?.name ?? (slug ? slug[0].toUpperCase() + slug.slice(1) : 'Free')
}

export function tierArabic(slug) {
  return TIER_NAMES[slug]?.arabic ?? null
}

export function isMunshid(slug) {
  return MUNSHID_SLUGS.includes(slug)
}

// True for any slug that grants the Munshid portal/creator capabilities.
export function isCreator(slug) {
  return isMunshid(slug) || slug === LEGACY_ARTIST_SLUG
}
