import { useEffect, useMemo, useState } from 'react'
import './BookingChatbot.css'

const DAY_NAMES = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const COUNTDOWN_SECONDS = 150

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]
const WEEKDAY_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const TIME_SLOTS = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00']

const Q_OPTIONS = {
  owner: [
    { value: 'oui', label: 'Oui, je suis propriétaire' },
    { value: 'achat', label: 'En cours d\'achat' },
    { value: 'non', label: 'Non, pas encore' },
  ],
  rental: [
    { value: 'meuble-longue', label: 'LMNP — meublé longue durée' },
    { value: 'meuble-courte', label: 'LMNP — courte durée (Airbnb…)' },
    { value: 'multi', label: 'Multi-biens (≥ 2 logements)' },
    { value: 'autre', label: 'Autre / pas encore défini' },
  ],
  situation: [
    { value: 'premier', label: '1er bien — je débute' },
    { value: 'micro-reel', label: 'Passage micro-BIC → régime réel' },
    { value: 'deja-declare', label: 'Déjà déclaré, je veux optimiser' },
    { value: 'litige', label: 'Contrôle / redressement en cours' },
    { value: 'autre', label: 'Autre cas particulier' },
  ],
}

function getNextDays(count: number) {
  const today = new Date()
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    return { name: DAY_NAMES[d.getDay()], num: d.getDate(), iso: d.toISOString().slice(0, 10) }
  })
}

function formatTimer(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, '0')
  const sec = (s % 60).toString().padStart(2, '0')
  return `${m}:${sec}`
}

export default function BookingChatbot() {
  const [open, setOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState(0)
  const [seconds, setSeconds] = useState(COUNTDOWN_SECONDS)
  const [owner, setOwner] = useState('')
  const [rental, setRental] = useState('')
  const [situation, setSituation] = useState('')

  const days = useMemo(() => getNextDays(5), [])
  const allAnswered = Boolean(owner && rental && situation)

  useEffect(() => {
    if (!open) return
    const id = setInterval(() => {
      setSeconds(s => (s > 0 ? s - 1 : COUNTDOWN_SECONDS))
    }, 1000)
    return () => clearInterval(id)
  }, [open])

  // Lock body scroll when big modal is open
  useEffect(() => {
    if (!modalOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [modalOpen])

  // Close modal on ESC
  useEffect(() => {
    if (!modalOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setModalOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modalOpen])

  const progress = (seconds / COUNTDOWN_SECONDS) * 100

  function openBigModal(dayIndex?: number) {
    if (typeof dayIndex === 'number') setSelectedDay(dayIndex)
    setOpen(false)
    setModalOpen(true)
  }

  return (
    <div className="bc-root">
      {open && (
        <div className="bc-card" role="dialog" aria-label="Prise de rendez-vous">
          <div className="bc-card-inner">
            <div className="bc-header">
              <div className="bc-avatar-wrap">
                <div className="bc-avatar" aria-hidden="true">CD</div>
                <span className="bc-presence" aria-label="En ligne" />
              </div>
              <div className="bc-name">
                <div className="bc-name-title">Camille D.</div>
                <div className="bc-name-role">Experte LMNP Nopillo</div>
              </div>
              <button className="bc-close" onClick={() => setOpen(false)} aria-label="Fermer">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="bc-pitch-title">Réservez un appel gratuit de 20 minutes pour&nbsp;:</div>
            <ul className="bc-pitch-list">
              <li><span className="bc-check">✓</span> Auditer votre situation LMNP</li>
              <li><span className="bc-check">✓</span> Identifier 2 à 3 optimisations fiscales</li>
              <li><span className="bc-check">✓</span> Découvrir l'accompagnement Nopillo</li>
            </ul>

            <div className="bc-urgency">
              <div className="bc-urgency-bar" style={{ width: `${progress}%` }} />
              <div className="bc-urgency-row">
                <span>Plus que quelques créneaux dispo.</span>
                <span className="bc-urgency-timer">{formatTimer(seconds)}</span>
              </div>
            </div>

            <div className="bc-days" role="radiogroup" aria-label="Choisir un jour">
              {days.map((d, i) => (
                <button
                  key={d.iso}
                  className="bc-day"
                  data-selected={selectedDay === i}
                  role="radio"
                  aria-checked={selectedDay === i}
                  onClick={() => openBigModal(i)}
                >
                  <div className="bc-day-name">{d.name}</div>
                  <div className="bc-day-num">{d.num}</div>
                </button>
              ))}
            </div>

            <button className="bc-cta" onClick={() => openBigModal()}>
              Planifier un appel
            </button>
          </div>

          <div className="bc-footer">Nopillo · Sans engagement</div>
        </div>
      )}

      <button
        className="bc-fab"
        data-open={open}
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Fermer la prise de rendez-vous' : 'Ouvrir la prise de rendez-vous'}
        aria-expanded={open}
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        )}
      </button>

      {modalOpen && (
        <BookingModal
          onClose={() => setModalOpen(false)}
          owner={owner}
          rental={rental}
          situation={situation}
          setOwner={setOwner}
          setRental={setRental}
          setSituation={setSituation}
          allAnswered={allAnswered}
        />
      )}
    </div>
  )
}

interface BookingModalProps {
  onClose: () => void
  owner: string
  rental: string
  situation: string
  setOwner: (v: string) => void
  setRental: (v: string) => void
  setSituation: (v: string) => void
  allAnswered: boolean
}

function BookingModal(props: BookingModalProps) {
  const { onClose, owner, rental, situation, setOwner, setRental, setSituation, allAnswered } = props

  function onOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="bc-modal-overlay" onClick={onOverlayClick} role="dialog" aria-modal="true" aria-label="Réserver un rendez-vous">
      <div className="bc-modal">
        <div className="bc-modal-header">
          <div className="bc-modal-title">
            Réserver votre appel
            <small>3 questions, puis votre créneau.</small>
          </div>
          <button className="bc-close" onClick={onClose} aria-label="Fermer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="bc-modal-body">
          {/* --- Colonne gauche : qualification --- */}
          <div className="bc-form-pane">
            <Field
              num={1}
              done={Boolean(owner)}
              label="Êtes-vous propriétaire ?"
              value={owner}
              onChange={setOwner}
              options={Q_OPTIONS.owner}
            />
            <Field
              num={2}
              done={Boolean(rental)}
              label="Quel type de location ?"
              value={rental}
              onChange={setRental}
              options={Q_OPTIONS.rental}
            />
            <Field
              num={3}
              done={Boolean(situation)}
              label="Quel est votre cas particulier ?"
              value={situation}
              onChange={setSituation}
              options={Q_OPTIONS.situation}
            />

            <div className="bc-progress-msg" data-done={allAnswered}>
              {allAnswered ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Choisissez votre créneau →
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Répondez pour débloquer le calendrier.
                </>
              )}
            </div>
          </div>

          {/* --- Colonne droite : calendrier HubSpot (design) --- */}
          <div className="bc-calendar-pane">
            <MockCalendar locked={!allAnswered} />

            {!allAnswered && (
              <div className="bc-calendar-tip" role="status" aria-live="polite">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Répondez aux 3 questions pour voir les créneaux.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface FieldProps {
  num: number
  done: boolean
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}

function MockCalendar({ locked }: { locked: boolean }) {
  const today = useMemo(() => new Date(), [])
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)

  const cells = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth])

  function changeMonth(delta: number) {
    let m = viewMonth + delta
    let y = viewYear
    if (m < 0) { m = 11; y -= 1 }
    if (m > 11) { m = 0; y += 1 }
    setViewMonth(m)
    setViewYear(y)
    setSelectedDay(null)
    setSelectedSlot(null)
  }

  function dayState(day: number | null): 'empty' | 'past' | 'weekend' | 'available' | 'today' | 'selected' {
    if (day == null) return 'empty'
    const date = new Date(viewYear, viewMonth, day)
    const isToday = date.toDateString() === today.toDateString()
    const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const weekday = date.getDay()
    const isWeekend = weekday === 0 || weekday === 6
    if (selectedDay === day) return 'selected'
    if (isPast) return 'past'
    if (isWeekend) return 'weekend'
    if (isToday) return 'today'
    return 'available'
  }

  return (
    <div className="bc-cal" data-locked={locked} aria-hidden={locked}>
      <div className="bc-cal-header">
        <button type="button" className="bc-cal-nav" onClick={() => changeMonth(-1)} aria-label="Mois précédent">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <div className="bc-cal-title">{MONTH_NAMES[viewMonth]} {viewYear}</div>
        <button type="button" className="bc-cal-nav" onClick={() => changeMonth(1)} aria-label="Mois suivant">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      </div>

      <div className="bc-cal-weekdays">
        {WEEKDAY_SHORT.map(w => <div key={w} className="bc-cal-weekday">{w}</div>)}
      </div>

      <div className="bc-cal-grid">
        {cells.map((day, i) => {
          const state = dayState(day)
          const disabled = state === 'past' || state === 'weekend' || state === 'empty'
          return (
            <button
              key={i}
              type="button"
              className="bc-cal-day"
              data-state={state}
              disabled={disabled}
              onClick={() => {
                if (disabled) return
                setSelectedDay(day)
                setSelectedSlot(null)
              }}
            >
              {day ?? ''}
            </button>
          )
        })}
      </div>

      {selectedDay !== null && (
        <div className="bc-cal-slots">
          <div className="bc-cal-slots-label">
            Créneaux le {selectedDay} {MONTH_NAMES[viewMonth].toLowerCase()}
          </div>
          <div className="bc-cal-slots-grid">
            {TIME_SLOTS.map(slot => (
              <button
                key={slot}
                type="button"
                className="bc-cal-slot"
                data-selected={selectedSlot === slot}
                onClick={() => setSelectedSlot(slot)}
              >
                {slot}
              </button>
            ))}
          </div>
          {selectedSlot && (
            <button type="button" className="bc-cal-confirm">
              Confirmer le {selectedDay}/{viewMonth + 1} à {selectedSlot}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function buildMonthGrid(year: number, month: number): (number | null)[] {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  // Monday-first: 0=Mon ... 6=Sun
  const startWeekday = (first.getDay() + 6) % 7
  const cells: (number | null)[] = []
  for (let i = 0; i < startWeekday; i++) cells.push(null)
  for (let d = 1; d <= last.getDate(); d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function Field({ num, done, label, value, onChange, options }: FieldProps) {
  return (
    <div className="bc-field" data-done={done}>
      <label className="bc-label">
        <span className="bc-label-num">{done ? '✓' : num}</span>
        {label}
      </label>
      <select
        className="bc-select"
        data-empty={!value}
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        <option value="">— Choisir —</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}
