/**
 * DKI — Dynamic Keyword Insertion
 * Lit les URL params (Google Ads ValueTrack) cote client.
 */

export type DKIContext = {
  keyword: string | null
  search_term: string | null
  match_type: string | null
  device: string | null
  city: string | null
  gclid: string | null
  utm: {
    source: string | null
    medium: string | null
    campaign: string | null
    term: string | null
    content: string | null
  }
}

const FRENCH_CITIES = [
  'paris', 'lyon', 'marseille', 'toulouse', 'nice', 'nantes', 'strasbourg',
  'montpellier', 'bordeaux', 'lille', 'rennes', 'reims', 'le havre',
  'saint-etienne', 'toulon', 'grenoble', 'dijon', 'angers', 'nimes',
  'villeurbanne', 'aix-en-provence', 'brest', 'limoges', 'tours', 'amiens',
]

function extractCity(searchTerm: string | null): string | null {
  if (!searchTerm) return null
  const lower = searchTerm.toLowerCase()
  for (const city of FRENCH_CITIES) {
    if (lower.includes(city)) {
      return city.charAt(0).toUpperCase() + city.slice(1)
    }
  }
  return null
}

export function readDKI(): DKIContext {
  if (typeof window === 'undefined') {
    return emptyDKI()
  }
  const params = new URLSearchParams(window.location.search)
  const search_term = params.get('searchterm') || params.get('search_term') || null
  const keyword = params.get('utm_term') || params.get('keyword') || null

  return {
    keyword,
    search_term: search_term || keyword,
    match_type: params.get('matchtype') || params.get('match_type') || null,
    device: params.get('device') || null,
    city: extractCity(search_term || keyword),
    gclid: params.get('gclid') || null,
    utm: {
      source: params.get('utm_source') || null,
      medium: params.get('utm_medium') || null,
      campaign: params.get('utm_campaign') || null,
      term: keyword,
      content: params.get('utm_content') || null,
    },
  }
}

function emptyDKI(): DKIContext {
  return {
    keyword: null,
    search_term: null,
    match_type: null,
    device: null,
    city: null,
    gclid: null,
    utm: { source: null, medium: null, campaign: null, term: null, content: null },
  }
}

/**
 * Capitalise un keyword pour affichage : "expert comptable lmnp" -> "Expert Comptable LMNP"
 */
export function capitalize(s: string | null): string | null {
  if (!s) return null
  return s
    .split(' ')
    .map((w) => {
      if (w.toLowerCase() === 'lmnp' || w.toLowerCase() === 'sci') return w.toUpperCase()
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    })
    .join(' ')
}
