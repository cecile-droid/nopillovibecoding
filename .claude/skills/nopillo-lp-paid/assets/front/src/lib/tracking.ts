/**
 * Tracking helpers — GTM + GA4 + Google Ads
 * Consent Mode v2 ready.
 */

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

function pushEvent(event: string, params: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ event, ...params })
}

export function trackCTAClick(ctaId: string, position: string) {
  pushEvent('cta_click', { cta_id: ctaId, cta_position: position })
}

export function trackSimulatorStart() {
  pushEvent('simulator_start')
}

export function trackSimulatorComplete(resultValue: number) {
  pushEvent('simulator_complete', { result_value: resultValue })
}

export function trackFormStart(formId: string) {
  pushEvent('form_start', { form_id: formId })
}

export function trackFormSubmit(formId: string, keyword: string | null, matchType: string | null) {
  pushEvent('form_submit', {
    form_id: formId,
    keyword: keyword ?? '(none)',
    match_type: matchType ?? '(none)',
  })
}

/**
 * Conversion Google Ads — appelle apres form_submit reussi avec leadId pour dedup.
 */
export function trackConversion(leadId: string, value: number = 50.0) {
  if (typeof window === 'undefined' || !window.gtag) return
  const conversionId = import.meta.env.PUBLIC_GOOGLE_ADS_CONVERSION_ID
  if (!conversionId || conversionId.includes('XXX')) {
    console.log('[tracking] Conversion not fired : PUBLIC_GOOGLE_ADS_CONVERSION_ID not configured')
    return
  }
  window.gtag('event', 'conversion', {
    send_to: conversionId,
    value,
    currency: 'EUR',
    transaction_id: leadId,
  })
}
