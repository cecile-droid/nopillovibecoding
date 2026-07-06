import { useState, useRef, useEffect } from 'react'
import { readDKI } from '../lib/dki'
import { trackFormStart, trackFormSubmit } from '../lib/tracking'

/**
 * Formulaire simulateur du hero LP Paid — 2 etapes avec branchement.
 * Etape 1 : simulateur (3 questions) + coordonnees -> form HubSpot #1.
 * Etape 2 : selon la reponse "situation" de l'etape 1 :
 *   - "Je reflechis a investir" (non) -> Form 3 (projet investisseur)
 *   - sinon (bientot / oui)           -> Form 2 (qualification proprietaire)
 * L'email est repris en champ cache -> le contact est enrichi sans ressaisie.
 * Chaque champ envoye = nom interne de la propriete HubSpot (valeurs internes).
 */

// Identifiants publics (forms HubSpot exposés côté client de toute façon).
const HS_PORTAL_ID = import.meta.env.PUBLIC_HUBSPOT_PORTAL_ID || '26173790'
const HS_REGION = import.meta.env.PUBLIC_HUBSPOT_REGION || 'eu1' // 'na1' | 'eu1'
const HS_FORM_GUID = import.meta.env.PUBLIC_HUBSPOT_FORM_GUID || '9577b1d9-d184-4f48-97b8-a3fdae3b2855'
const HS_FORM2_GUID = import.meta.env.PUBLIC_HUBSPOT_FORM2_GUID || '771d8312-7858-4d06-9f74-9e08b016d7fc'
const HS_FORM3_GUID = import.meta.env.PUBLIC_HUBSPOT_FORM3_GUID || '821c76ec-0a29-41ff-a870-dee8e17fd36f'
const HS_BASE = HS_REGION === 'na1' ? 'https://api.hsforms.com' : `https://api-${HS_REGION}.hsforms.com`
const submitUrl = (guid: string) => `${HS_BASE}/submissions/v3/integration/submit/${HS_PORTAL_ID}/${guid}`

const CONSENT_TEXT =
  'J’accepte que Nopillo me contacte pour m’envoyer le résultat de ma simulation. Aucun spam, aucune transmission à des tiers.'

// --- Side-effect conditionnel au submit du Form 2 (mécanique "CTA conditionnel") ---
// Si le bien est en location nue, on crée le compte Nopillo du lead en arrière-plan.
// Le gate est lu AU MOMENT du clic ; keepalive pour survivre à une navigation.
const SIGNUP_API_URL = 'https://api.my.nopillo.com/api/auth/email-signup'
const SIGNUP_CALLBACK_URL = 'https://my.nopillo.com/bienvenue'
const SIGNUP_GATE_FIELD = 'funnel_self_type_bail' // select lu pour le gate
const SIGNUP_GATE_VALUE = 'location_nue'          // valeur qui déclenche l'action

type Opt = { value: string; label: string }
const asOpts = (arr: string[]): Opt[] => arr.map((v) => ({ value: v, label: v }))

/** Etape 1 : mapping champ -> propriete HubSpot (proprietes existantes du funnel Nopillo). */
const FIELD_MAP: Record<string, string> = {
  firstname: 'firstname',
  lastname: 'lastname',
  email: 'email',
  phone: 'phone',
  loyer: 'master___montant_du_loyer',
  valeur: 'valeur_du_bien_loue',
  location: 'statut_de_la_mise_en_location',
}

// Etape 1 : valeurs = valeurs internes HubSpot (au caractere pres).
// Loyer (master___montant_du_loyer) & Valeur (valeur_du_bien_loue) : value === label.
const LOYER: Opt[] = [
  { value: '< 600€', label: '< 600€' },
  { value: '600€ - 800€', label: '600€ - 800€' },
  { value: '800€ - 1 200€', label: '800€ - 1 200€' },
  { value: '> 1 200€', label: '> 1 200€' },
]
const VALEUR: Opt[] = [
  { value: '< 100 000€', label: '< 100 000€' },
  { value: '100 000€ - 150 000€', label: '100 000€ - 150 000€' },
  { value: '150 000€ - 250 000€', label: '150 000€ - 250 000€' },
  { value: '> 250 000€', label: '> 250 000€' },
]
// Situation (statut_de_la_mise_en_location) : valeurs internes courtes.
const LOCATION: Opt[] = [
  { value: 'oui', label: 'Mon bien est déjà en location' },
  { value: 'bientot', label: 'J’ai acheté mon appartement et vais le mettre en location dans les mois qui viennent' },
  { value: 'non', label: 'Je réfléchis à réaliser un investissement immobilier' },
]
// Valeur "situation" qui declenche le Form 3 (parcours investisseur).
const SITUATION_FORM3 = 'non'

// Resultats simulateur : le regime reel vaut TOUJOURS 0. Le micro-BIC suit une
// fourchette hardcodee par tranche de loyer (la valeur du bien n'impacte rien).
// Cle = valeur interne du select loyer (master___montant_du_loyer).
const MICRO_BIC_BY_LOYER: Record<string, { min: number; max: number }> = {
  '< 600€': { min: 0, max: 1749 },
  '600€ - 800€': { min: 1750, max: 2332 },
  '800€ - 1 200€': { min: 2332, max: 3499 },
  '> 1 200€': { min: 3500, max: 14000 },
}
const microFor = (loyer: string) => MICRO_BIC_BY_LOYER[(loyer ?? '').trim()] ?? { min: 0, max: 0 }

// Etape 2 — Form 2 (proprietaire / deja loue) : valeurs internes distinctes des libelles.
const STEP2_FIELDS: { name: string; label: string; options: Opt[] }[] = [
  {
    name: 'funnel_self_propriete',
    label: 'Êtes-vous propriétaire ou locataire ?',
    options: [
      { value: 'proprietaire', label: 'Propriétaire' },
      { value: 'locataire', label: 'Locataire' },
    ],
  },
  {
    name: 'funnel_self_type_bail',
    label: 'Disposez-vous d’un bien en location meublée ?',
    options: [
      { value: 'location_meublee', label: 'Bail meublé' },
      { value: 'location_nue', label: 'Location nue' },
      { value: 'je_ne_sais_pas', label: 'Je ne sais pas' },
    ],
  },
  {
    name: 'funnel_self_cas_specifiques',
    label: 'Êtes-vous concerné par un ou plusieurs de ces cas particuliers pour au moins un de vos biens ?',
    options: [
      { value: 'demembrement', label: 'Démembrement' },
      { value: 'tva', label: 'TVA' },
      { value: 'aucun-cas-specifique', label: 'Aucun cas spécifique' },
      { value: 'SCI/SARL', label: 'SCI/SARL' },
    ],
  },
]

// Etape 2 — Form 3 (projet investisseur) : valeurs internes = libelles.
const STEP3_FIELDS: { name: string; label: string; options: Opt[] }[] = [
  {
    name: 'maturite_du_projet',
    label: 'Où en êtes-vous dans votre projet ?',
    options: asOpts([
      'Je débute ma réflexion',
      "J'ai un projet d'achat mais rien de signé",
      "J'ai une promesse de vente",
      "J'ai déjà un bien à louer ou déjà loué",
    ]),
  },
  {
    name: 'date_du_projet_estime',
    label: 'Quand envisagez-vous de concrétiser votre projet ?',
    options: asOpts(['Moins de 3 mois', '3 à 6 mois', 'Plus de 6 mois', 'Je ne sais pas']),
  },
  {
    name: 'type_de_projet_envisage',
    label: "Quel type d'investissement locatif envisagez-vous ?",
    options: asOpts(['LMNP / Meublé', 'Location nue', 'SCI', 'Autre', 'Je ne sais pas']),
  },
]

type Branch = 'form2' | 'form3'
const STEP_CONFIG: Record<Branch, { guid: string; title: [string, string]; fields: typeof STEP2_FIELDS }> = {
  form2: { guid: HS_FORM2_GUID, title: ['Affinez votre', 'estimation'], fields: STEP2_FIELDS },
  form3: { guid: HS_FORM3_GUID, title: ['Parlez-nous de votre', 'projet'], fields: STEP3_FIELDS },
}

// Calendriers HubSpot Meetings (ecrans de sortie 3 & 4)
const CAL_LOCATION_NUE = 'https://meetings-eu1.hubspot.com/coralie-vincent/rdv-coralie-ln?embed=true'
const CAL_MEUBLE = 'https://meetings-eu1.hubspot.com/christopher-dieng/landing-page-simulateur?embed=true'

// Cas "non bloquants" (on peut accompagner). Tout autre cas (hors SCI) = bloquant.
const CAS_NON_BLOQUANT = ['aucun-cas-specifique', 'residence_principale', 'LCD']

type Outcome = 'screen1' | 'screen2' | 'screen3' | 'screen4'

/**
 * Ecran de sortie du Form 2 selon les 3 reponses.
 * Ordre de priorite : SCI d'abord, puis locataire, puis proprietaire.
 */
function form2Outcome(statut: string, location: string, cas: string): Outcome {
  if (cas === 'SCI/SARL') return 'screen2'          // offre SCI a venir
  if (statut === 'locataire') return 'screen1'      // non accompagne
  // statut === 'proprietaire'
  if (location === 'location_nue') return 'screen3' // RDV calendrier location nue
  // location_meublee | je_ne_sais_pas
  if (CAS_NON_BLOQUANT.includes(cas)) return 'screen4' // RDV calendrier meuble
  return 'screen1'                                   // cas bloquant (demembrement, tva...)
}

type Status = 'idle' | 'sending' | 'sent' | 'error'
type Errors = Record<string, string>

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const NAME_RE = /^[A-Za-zÀ-ÿ'’ -]+$/

function validateField(name: string, value: string): string {
  const v = (value ?? '').trim()
  switch (name) {
    case 'firstname':
    case 'lastname': {
      const libelle = name === 'firstname' ? 'prénom' : 'nom'
      if (!v) return 'Ce champ est obligatoire.'
      if (/\d/.test(v)) return `Le ${libelle} ne doit pas contenir de chiffres.`
      if (!NAME_RE.test(v)) return `Le ${libelle} contient des caractères non autorisés.`
      return ''
    }
    case 'email':
      if (!v) return 'Ce champ est obligatoire.'
      if (!EMAIL_RE.test(v)) return 'Adresse mail invalide (ex : jean.dupont@gmail.com).'
      return ''
    case 'phone': {
      if (!v) return 'Ce champ est obligatoire.'
      const clean = v.replace(/[\s.\-()]/g, '')
      if (!/^\+?\d{9,15}$/.test(clean)) return 'Numéro de téléphone invalide.'
      return ''
    }
    default:
      if (!v) return 'Veuillez sélectionner une option.'
      return ''
  }
}

function readHutk(): string | undefined {
  if (typeof document === 'undefined') return undefined
  const match = document.cookie.match(/(?:^|;\s*)hubspotutk=([a-f0-9]+)/i)
  return match?.[1]
}

// First page seen (independant du consentement, comme le script global du site).
// L'URL complete est stockee -> les UTM sont deja dedans, pas de champ separe.
function captureFirstPageSeen() {
  if (typeof window === 'undefined') return
  try {
    if (!localStorage.getItem('first_page_seen')) {
      localStorage.setItem('first_page_seen', window.location.href)
    }
  } catch { /* storage indisponible */ }
}

/** Champ first_page_seen a joindre a la soumission (URL complete, UTM inclus). */
function firstTouchFields(): { name: string; value: string }[] {
  if (typeof window === 'undefined') return []
  try {
    const fps = localStorage.getItem('first_page_seen')
    if (fps) return [{ name: 'marketing_first_page_seen_brut', value: fps }]
  } catch { /* storage indisponible */ }
  return []
}

function baseContext(): Record<string, string> {
  const ctx: Record<string, string> = {
    pageUri: typeof location !== 'undefined' ? location.href : '',
    pageName: typeof document !== 'undefined' ? document.title : '',
  }
  const hutk = readHutk()
  if (hutk) ctx.hutk = hutk
  return ctx
}

function Select({
  name, label, options, error,
}: { name: string; label: string; options: Opt[]; error?: string }) {
  return (
    <div className="hsf-field">
      <label htmlFor={name} className="hsf-label">{label} <span className="hsf-req">*</span></label>
      <div className="hsf-select-wrap">
        <select id={name} name={name} required defaultValue="" className={`hsf-select${error ? ' is-error' : ''}`}>
          <option value="" disabled>Sélectionner</option>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <svg className="hsf-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
      </div>
      {error && <p className="hsf-field-error">{error}</p>}
    </div>
  )
}

export default function HeroSimForm() {
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [errors, setErrors] = useState<Errors>({})
  const [step, setStep] = useState<1 | 2>(1)
  const [branch, setBranch] = useState<Branch>('form2')
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [lead, setLead] = useState({ email: '', firstname: '', lastname: '', phone: '' })
  const [micro, setMicro] = useState({ min: 0, max: 0 })
  const startedRef = useRef(false)
  const signupFiredRef = useRef(false)

  // Capture la 1re page vue des l'arrivee (persiste en localStorage).
  useEffect(() => { captureFirstPageSeen() }, [])

  function onFocus() {
    if (startedRef.current) return
    startedRef.current = true
    trackFormStart(step === 1 ? 'hero_sim_form' : `hero_sim_${branch}`)
  }

  function onChange(e: React.ChangeEvent<HTMLFormElement>) {
    const t = e.target as HTMLInputElement | HTMLSelectElement
    const name = t.name
    if (!name) return
    setErrors((prev) => {
      const next = { ...prev }
      if (name === 'consent') {
        if ((t as HTMLInputElement).checked) delete next.consent
        return next
      }
      if (!prev[name]) return prev
      const err = validateField(name, t.value)
      if (err) next[name] = err
      else delete next[name]
      return next
    })
  }

  async function postToHubSpot(guid: string, fields: { name: string; value: string }[], consent: boolean) {
    const body: Record<string, unknown> = { fields, context: baseContext() }
    if (consent) body.legalConsentOptions = { consent: { consentToProcess: true, text: CONSENT_TEXT } }
    const res = await fetch(submitUrl(guid), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const json = await res.json().catch(() => null)
      throw new Error(json?.errors?.[0]?.message || json?.message || `HTTP ${res.status}`)
    }
  }

  // --- Etape 1 ---
  async function onSubmitStep1(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>
    if (data.website) { setStatus('sent'); return }

    const errs: Errors = {}
    for (const f of ['loyer', 'valeur', 'location', 'firstname', 'lastname', 'email', 'phone']) {
      const err = validateField(f, data[f]); if (err) errs[f] = err
    }
    if (!data.consent) errs.consent = 'Vous devez accepter pour continuer.'
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({}); setStatus('sending'); setErrorMsg(null)

    const dki = readDKI()
    const microResult = microFor(data.loyer ?? '')
    const fields = [
      ...Object.entries(FIELD_MAP)
        .map(([formName, hsProp]) => ({ name: hsProp, value: (data[formName] ?? '').trim() }))
        .filter((f) => f.value),
      ...firstTouchFields(), // nopillo_first_page_seen (URL complete, UTM inclus)
      // Resultats simulateur (regime reel = 0 ; micro-BIC = fourchette par loyer)
      { name: 'new_simul_wf_valeur_mini_reel', value: '0' },
      { name: 'new_simul_wf_valeur_maxi_reel', value: '0' },
      { name: 'new_simul_wf_valeur_mini_microbic', value: String(microResult.min) },
      { name: 'new_simul_wf_valeur_maxi_microbic', value: String(microResult.max) },
    ]

    try {
      await postToHubSpot(HS_FORM_GUID, fields, true)
      trackFormSubmit('hero_sim_form', dki.keyword, dki.match_type)
      // Evenement de conversion dedie (declencheur GTM) — fire uniquement apres succes HubSpot.
      if (typeof window !== 'undefined') {
        window.dataLayer = window.dataLayer || []
        window.dataLayer.push({
          event: 'soumission_simulateur_paid',
          form_id: 'hero_sim_form',
          keyword: dki.keyword ?? '(none)',
          match_type: dki.match_type ?? '(none)',
        })
      }
      setLead({
        email: (data.email ?? '').trim(),
        firstname: (data.firstname ?? '').trim(),
        lastname: (data.lastname ?? '').trim(),
        phone: (data.phone ?? '').trim(),
      })
      setBranch(data.location === SITUATION_FORM3 ? 'form3' : 'form2')
      setMicro(microResult)
      startedRef.current = false
      setStatus('idle')
      setStep(2) // affiche resultats + qualification (Form 2/3) sur le meme ecran
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur inconnue')
      setStatus('error')
    }
  }

  // --- Etape 2 (Form 2 ou Form 3 selon branch) ---
  async function onSubmitStep2(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>
    if (data.website) { setStatus('sent'); return }

    const cfg = STEP_CONFIG[branch]
    const errs: Errors = {}
    for (const f of cfg.fields) { const err = validateField(f.name, data[f.name]); if (err) errs[f.name] = err }
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({}); setStatus('sending'); setErrorMsg(null)

    // Side-effect conditionnel : gate lu au moment du clic. Si location nue,
    // création du compte Nopillo en arrière-plan (fire-and-forget, keepalive).
    if (
      branch === 'form2' &&
      (data[SIGNUP_GATE_FIELD] ?? '') === SIGNUP_GATE_VALUE &&
      lead.email &&
      !signupFiredRef.current
    ) {
      signupFiredRef.current = true
      fetch(SIGNUP_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({
          email: lead.email,
          prenom: lead.firstname,
          nom: lead.lastname,
          phone: lead.phone,
          callbackURL: SIGNUP_CALLBACK_URL,
          sendEmail: false,
        }),
      })
        .then((r) => console.log('[signup] status', r.status))
        .catch((e) => console.error('[signup]', e))
    }

    const dki = readDKI()
    const fields = [
      { name: 'email', value: lead.email }, // repris de l'etape 1 -> meme contact
      ...cfg.fields.map((f) => ({ name: f.name, value: (data[f.name] ?? '').trim() })).filter((x) => x.value),
    ]

    try {
      await postToHubSpot(cfg.guid, fields, false)
      trackFormSubmit(`hero_sim_${branch}`, dki.keyword, dki.match_type)
      if (branch === 'form2') {
        setOutcome(form2Outcome(data.funnel_self_propriete, data.funnel_self_type_bail, data.funnel_self_cas_specifiques))
      } else {
        setOutcome(null)
      }
      setStatus('sent')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur inconnue')
      setStatus('error')
    }
  }

  // --- Ecrans de sortie ---
  if (status === 'sent') {
    if (outcome === 'screen1') return <ScreenBloquant />
    if (outcome === 'screen2') return <ScreenSCI />
    if (outcome === 'screen3') return <ScreenRdv src={CAL_LOCATION_NUE} />
    if (outcome === 'screen4') return <ScreenRdv src={CAL_MEUBLE} />
    return <ScreenMerci />
  }

  // --- Etape 2 : resultats (haut) + qualification Form 2/3 (bas) ---
  if (step === 2) {
    const cfg = STEP_CONFIG[branch]
    return (
      <form onSubmit={onSubmitStep2} onFocus={onFocus} onChange={onChange} className="hsf-card" noValidate data-hs-do-not-collect="true">
        <ResultatsCompact micro={micro} />
        <div>
          <span className="hsf-step">Étape 2 / 2</span>
          <h3 className="hsf-title">{cfg.title[0]} <span style={{ color: 'var(--color-indigo-500)' }}>{cfg.title[1]}</span></h3>
          <p className="hsf-sub" style={{ marginTop: 4 }}>Encore 3 précisions et c’est terminé.</p>
        </div>

        {cfg.fields.map((f) => (
          <Select key={f.name} name={f.name} label={f.label} options={f.options} error={errors[f.name]} />
        ))}

        <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-9999px', opacity: 0 }} />

        <button type="submit" disabled={status === 'sending'} className="hsf-submit">
          {status === 'sending' ? 'Envoi en cours…' : (
            <>Tester mon éligibilité
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </>
          )}
        </button>

        {status === 'error' && errorMsg && (
          <p className="hsf-error">{errorMsg} — ou contactez-nous à <a href="mailto:contact@nopillo.fr">contact@nopillo.fr</a>.</p>
        )}
        <Styles />
      </form>
    )
  }

  // --- Etape 1 ---
  return (
    <form onSubmit={onSubmitStep1} onFocus={onFocus} onChange={onChange} className="hsf-card" noValidate data-hs-do-not-collect="true">
      <h3 className="hsf-title">
        Estimez vos <span style={{ color: 'var(--color-indigo-500)' }}>économies d’impôt</span>
      </h3>

      <Select name="loyer" label="Quel est le montant du loyer mensuel ?" options={LOYER} error={errors.loyer} />
      <Select name="valeur" label="Quelle est la valeur du bien ?" options={VALEUR} error={errors.valeur} />
      <Select name="location" label="Quelle est votre situation ?" options={LOCATION} error={errors.location} />

      <div className="hsf-row">
        <div className="hsf-field">
          <label htmlFor="firstname" className="hsf-label">Prénom <span className="hsf-req">*</span></label>
          <input id="firstname" name="firstname" type="text" autoComplete="given-name" placeholder="Jean" className={`hsf-input${errors.firstname ? ' is-error' : ''}`} />
          {errors.firstname && <p className="hsf-field-error">{errors.firstname}</p>}
        </div>
        <div className="hsf-field">
          <label htmlFor="lastname" className="hsf-label">Nom <span className="hsf-req">*</span></label>
          <input id="lastname" name="lastname" type="text" autoComplete="family-name" placeholder="Dupont" className={`hsf-input${errors.lastname ? ' is-error' : ''}`} />
          {errors.lastname && <p className="hsf-field-error">{errors.lastname}</p>}
        </div>
      </div>

      <div className="hsf-row">
        <div className="hsf-field">
          <label htmlFor="email" className="hsf-label">Adresse mail <span className="hsf-req">*</span></label>
          <input id="email" name="email" type="email" autoComplete="email" placeholder="jean.dupont@gmail.com" className={`hsf-input${errors.email ? ' is-error' : ''}`} />
          {errors.email && <p className="hsf-field-error">{errors.email}</p>}
        </div>
        <div className="hsf-field">
          <label htmlFor="phone" className="hsf-label">Téléphone <span className="hsf-req">*</span></label>
          <input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="06 12 34 56 78" className={`hsf-input${errors.phone ? ' is-error' : ''}`} />
          {errors.phone && <p className="hsf-field-error">{errors.phone}</p>}
        </div>
      </div>

      <div>
        <label className={`hsf-consent${errors.consent ? ' is-error' : ''}`}>
          <input type="checkbox" name="consent" />
          <span>{CONSENT_TEXT}</span>
        </label>
        {errors.consent && <p className="hsf-field-error">{errors.consent}</p>}
      </div>

      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-9999px', opacity: 0 }} />

      <button type="submit" disabled={status === 'sending'} className="hsf-submit">
        {status === 'sending' ? 'Envoi en cours…' : (
          <>Calculez mes économies
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </>
        )}
      </button>

      {status === 'error' && errorMsg && (
        <p className="hsf-error">{errorMsg} — ou contactez-nous à <a href="mailto:contact@nopillo.fr">contact@nopillo.fr</a>.</p>
      )}

      <Styles />
    </form>
  )
}

// --- Ecran par defaut (Form 3) ---
function ScreenMerci() {
  return (
    <div className="hsf-card hsf-success">
      <div className="hsf-success-icon">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7"/></svg>
      </div>
      <h3 className="hsf-title">Merci&nbsp;!</h3>
      <p className="hsf-sub">Vos coordonnées sont bien enregistrées. Un expert vous recontacte sous 24h ouvrées.</p>
      <Styles />
    </div>
  )
}

// --- Ecran 1 : cas non pris en charge ---
function ScreenBloquant() {
  return (
    <div className="hsf-card hsf-outcome">
      <h3 className="hsf-outcome-title">Nous ne sommes pas en mesure de vous accompagner pour l’instant</h3>
      <p className="hsf-sub">
        Malheureusement, votre situation relève d’un cas spécifique qui n’est pas pris en charge par notre équipe ni par les services que nous proposons.
      </p>
      <svg className="hsf-cross" width="128" height="128" viewBox="0 0 128 128" fill="none" aria-hidden="true">
        <g transform="rotate(12 64 64)">
          <rect x="58" y="18" width="16" height="92" rx="8" fill="#09090b" />
          <rect x="18" y="58" width="92" height="16" rx="8" fill="#09090b" />
          <rect x="54" y="16" width="16" height="92" rx="8" fill="#9efcbb" />
          <rect x="16" y="54" width="92" height="16" rx="8" fill="#9efcbb" />
        </g>
      </svg>
      <Styles />
    </div>
  )
}

// --- Ecran 2 : offre SCI a venir ---
function ScreenSCI() {
  return (
    <div className="hsf-card hsf-outcome">
      <h3 className="hsf-outcome-title">Notre offre SCI arrive cet été ☀️</h3>
      <p className="hsf-sub">
        Aujourd’hui, Nopillo accompagne les propriétaires qui détiennent un bien en nom propre (location nue ou meublée). On lance prochainement notre offre dédiée aux SCI. Vos coordonnées sont bien enregistrées, on vous recontactera dès le lancement&nbsp;!
      </p>
      <Styles />
    </div>
  )
}

// --- Ecrans 3 & 4 : on peut accompagner -> RDV calendrier HubSpot ---
function ScreenRdv({ src }: { src: string }) {
  return (
    <div className="hsf-card hsf-outcome">
      <h3 className="hsf-outcome-title">Bonne nouvelle : on peut vous accompagner&nbsp;!</h3>
      <p className="hsf-sub">
        Dans des situations comme la vôtre, nos clients économisent en moyenne{' '}
        <strong style={{ color: 'var(--color-indigo-500)' }}>2 000 € par an</strong>.
      </p>
      <p className="hsf-rdv-chips">RDV gratuit · 30 min · Sans engagement · Vous repartez avec un plan d’action clair</p>
      <MeetingEmbed src={src} />
      <Styles />
    </div>
  )
}

// Embed calendrier HubSpot Meetings : injecte le script qui transforme le div en iframe.
function MeetingEmbed({ src }: { src: string }) {
  useEffect(() => {
    const s = document.createElement('script')
    s.type = 'text/javascript'
    s.src = 'https://static.hsappstatic.net/MeetingsEmbed/ex/MeetingsEmbedCode.js'
    document.body.appendChild(s)
    return () => { try { document.body.removeChild(s) } catch { /* noop */ } }
  }, [src])
  return (
    <div className="meetings-iframe-container" data-src={src} style={{ minHeight: 560 }}>
      <div className="hsf-cal-loading">
        <span className="hsf-spinner" aria-hidden="true" />
        Chargement du calendrier…
      </div>
    </div>
  )
}

// --- Bloc resultats COMPACT, affiche en tete de la carte du Form 2/3 ---
function ResultatsCompact({ micro }: { micro: { min: number; max: number } }) {
  const fmt = (n: number) => n.toLocaleString('fr-FR')
  return (
    <div className="hsf-rc">
      <span className="hsf-results-badge">Bonne nouvelle&nbsp;!</span>
      <div className="hsf-rc-grid">
        <div className="hsf-rc-item hsf-rc-item--reel">
          <span className="hsf-rc-label">Régime réel — vous payez</span>
          <span className="hsf-rc-amount">0 €</span>
        </div>
        <div className="hsf-rc-item">
          <span className="hsf-rc-label">Micro-BIC</span>
          <span className="hsf-rc-amount hsf-rc-amount--micro">{fmt(micro.min)} € — {fmt(micro.max)} €</span>
        </div>
      </div>
      <p className="hsf-rc-note">Le régime réel est <strong>optimal pour vous</strong> : 0 € d’impôts en 2025.</p>
    </div>
  )
}

function Styles() {
  return (
    <style>{`
      .hsf-card {
        background-color: var(--color-brand-white);
        border: 1px solid var(--color-indigo-100, #DEDAFF);
        border-radius: 24px;
        padding: 24px 24px;
        box-shadow: 0 1px 16px rgba(0, 0, 0, 0.08);
        display: flex;
        flex-direction: column;
        gap: 13px;
      }
      .hsf-step {
        display: inline-block;
        font-family: var(--font-display);
        font-size: 13px;
        font-weight: 600;
        color: var(--color-indigo-500, #5747FF);
        margin-bottom: 6px;
      }
      .hsf-title {
        font-family: var(--font-display);
        font-size: 26px;
        font-weight: 700;
        line-height: 1.2;
        color: var(--color-brand-black);
        margin: 0 0 4px;
      }
      .hsf-field { display: flex; flex-direction: column; gap: 6px; }
      .hsf-label {
        font-family: var(--font-display);
        font-size: 16px;
        font-weight: 600;
        color: var(--color-brand-black);
      }
      .hsf-req { color: var(--color-indigo-500, #5747FF); }
      .hsf-input, .hsf-select {
        width: 100%;
        padding: 12px 14px;
        font-family: var(--font-display);
        font-size: 16px;
        color: var(--color-brand-black);
        background-color: var(--color-brand-white);
        border: 1px solid var(--color-indigo-100, #DEDAFF);
        border-radius: 16px;
        outline: none;
        transition: border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
      }
      .hsf-input::placeholder { color: var(--color-graycool-400, #7D89B0); }
      .hsf-input:focus, .hsf-select:focus {
        border-color: var(--color-indigo-500, #5747FF);
        box-shadow: 0 0 0 3px rgba(87, 71, 255, 0.12);
      }
      .hsf-input.is-error, .hsf-select.is-error {
        border-color: var(--color-danger-500, #DB3352);
        background-color: var(--color-danger-50, #FDEAED);
      }
      .hsf-input.is-error:focus, .hsf-select.is-error:focus {
        border-color: var(--color-danger-500, #DB3352);
        box-shadow: 0 0 0 3px rgba(219, 51, 82, 0.15);
      }
      .hsf-field-error {
        margin: 0;
        font-size: 13px;
        font-weight: 500;
        color: var(--color-danger-500, #DB3352);
      }
      .hsf-select-wrap { position: relative; }
      .hsf-select {
        appearance: none;
        -webkit-appearance: none;
        padding-right: 44px;
        cursor: pointer;
      }
      .hsf-select:invalid { color: var(--color-graycool-400, #7D89B0); }
      .hsf-chevron {
        position: absolute;
        right: 16px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--color-indigo-500, #5747FF);
        pointer-events: none;
      }
      .hsf-select.is-error + .hsf-chevron {
        color: var(--color-danger-500, #DB3352);
      }
      .hsf-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }
      @media (max-width: 480px) {
        .hsf-row { grid-template-columns: 1fr; }
        .hsf-card { padding: 24px 20px; }
      }
      .hsf-consent {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        font-size: 14px;
        line-height: 1.45;
        color: var(--color-graycool-700, #404968);
        cursor: pointer;
      }
      .hsf-consent input {
        appearance: none;
        -webkit-appearance: none;
        position: relative;
        width: 22px;
        height: 22px;
        flex-shrink: 0;
        margin-top: 1px;
        border: 1.5px solid var(--color-indigo-200, #BDB5FF);
        border-radius: 6px;
        background-color: var(--color-brand-white);
        cursor: pointer;
        transition: background-color 0.15s ease, border-color 0.15s ease;
      }
      .hsf-consent input:checked {
        background-color: var(--color-indigo-500, #5747FF);
        border-color: var(--color-indigo-500, #5747FF);
      }
      .hsf-consent input:checked::after {
        content: "";
        position: absolute;
        left: 7px;
        top: 3px;
        width: 5px;
        height: 10px;
        border: solid #fff;
        border-width: 0 2px 2px 0;
        transform: rotate(45deg);
      }
      .hsf-consent.is-error input {
        border-color: var(--color-danger-500, #DB3352);
        background-color: var(--color-danger-50, #FDEAED);
      }
      .hsf-submit {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        width: 100%;
        padding: 15px 24px;
        margin-top: 2px;
        font-family: var(--font-display);
        font-size: 18px;
        font-weight: 600;
        color: #fff;
        background-color: var(--color-indigo-500, #5747FF);
        border: none;
        border-radius: 16px;
        cursor: pointer;
        transition: background-color 0.15s ease;
      }
      .hsf-submit:hover { background-color: var(--color-indigo-600, #4033DB); }
      .hsf-submit:disabled { opacity: 0.7; cursor: default; }
      .hsf-error { font-size: 14px; color: var(--color-danger-500, #DB3352); margin: 0; }
      .hsf-error a { text-decoration: underline; }
      .hsf-success { text-align: center; align-items: center; padding: 48px 28px; }
      .hsf-success-icon {
        width: 64px; height: 64px; border-radius: 9999px;
        display: grid; place-items: center; margin: 0 auto 8px;
        background-color: var(--color-secondary-600, #0CC28C);
      }
      .hsf-sub { color: var(--color-graycool-700, #404968); margin: 0; line-height: 1.5; }

      /* Bloc resultats COMPACT (en tete de la carte du Form 2/3) */
      .hsf-rc {
        display: flex; flex-direction: column; gap: 12px;
        padding-bottom: 16px; border-bottom: 1px solid var(--color-indigo-100, #DEDAFF);
      }
      .hsf-results-badge {
        align-self: flex-start;
        display: inline-flex; align-items: center; gap: 8px;
        background: rgba(222, 218, 255, 0.5);
        color: var(--color-indigo-600, #4033DB);
        font-family: var(--font-display); font-weight: 700; font-size: 14px;
        padding: 6px 14px; border-radius: 9999px;
      }
      .hsf-results-badge::before {
        content: ''; width: 8px; height: 8px; border-radius: 9999px;
        background: var(--color-indigo-500, #5747FF);
      }
      .hsf-rc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-items: stretch; }
      .hsf-rc-item {
        display: flex; flex-direction: column; gap: 4px;
        padding: 12px 14px; border-radius: 12px;
        background: var(--color-graycool-50, #F9F9FB);
      }
      .hsf-rc-item--reel { background: rgba(222, 218, 255, 0.45); }
      .hsf-rc-label {
        font-family: var(--font-display); font-size: 11px; letter-spacing: .04em;
        text-transform: uppercase; font-weight: 600; color: var(--color-graycool-500, #5D6B98);
      }
      .hsf-rc-amount {
        font-family: var(--font-display); font-size: 24px; font-weight: 700;
        line-height: 1.1; color: var(--color-brand-black);
      }
      .hsf-rc-amount--micro { font-size: 19px; color: var(--color-graycool-700, #404968); }
      .hsf-rc-note { font-size: 13px; line-height: 1.45; color: var(--color-graycool-700, #404968); margin: 0; }
      .hsf-rc-note strong { color: var(--color-indigo-600, #4033DB); }

      /* Ecrans de sortie */
      .hsf-outcome { gap: 20px; }
      .hsf-outcome-title {
        font-family: var(--font-display);
        font-size: clamp(24px, 2.5vw, 30px);
        font-weight: 700;
        line-height: 1.15;
        letter-spacing: -0.01em;
        color: var(--color-brand-black);
        margin: 0;
        text-wrap: balance;
      }
      .hsf-cross { display: block; margin: 12px auto 0; }
      .hsf-rdv-chips {
        font-family: var(--font-display);
        font-size: 15px;
        font-weight: 500;
        color: var(--color-brand-black);
        margin: 0;
      }
      .meetings-iframe-container { width: 100%; min-height: 560px; }
      .hsf-cal-loading {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        min-height: 560px;
        font-family: var(--font-display);
        font-size: 15px;
        color: var(--color-graycool-500, #5D6B98);
      }
      .hsf-spinner {
        width: 22px;
        height: 22px;
        border: 3px solid var(--color-indigo-100, #DEDAFF);
        border-top-color: var(--color-indigo-500, #5747FF);
        border-radius: 9999px;
        animation: hsf-spin 0.7s linear infinite;
      }
      @keyframes hsf-spin { to { transform: rotate(360deg); } }
      @media (prefers-reduced-motion: reduce) {
        .hsf-spinner { animation: none; }
      }
    `}</style>
  )
}
