import { useEffect, useState } from 'react'
import { readDKI, capitalize, type DKIContext } from '../lib/dki'

/**
 * Titre du hero LP Paid (above-the-fold, client:load).
 * HERO DYNAMIQUE SUIVANT LE KW (matrice du brief "LP PAID auto via l'IA") :
 *   H1 = "Passez au régime réel et payez 0 € d'impôts sur vos revenus"
 *        + " à {Ville}" si une ville est detectee dans le KW / search term.
 *   Sous-ligne = correlation semantique avec le KW reel (Quality Score).
 * Le H1 est rendu cote serveur (fallback) puis surcharge a l'hydratation DKI.
 */
export default function HeroPaidHeadline() {
  const [dki, setDki] = useState<DKIContext | null>(null)

  useEffect(() => {
    setDki(readDKI())
  }, [])

  const keyword = capitalize(dki?.keyword)
  const city = dki?.city

  return (
    <>
      <h1 className="hp-h1">
        Passez au régime réel et payez{' '}
        <span style={{ color: 'var(--color-indigo-600)' }}>0 € d’impôts</span>{' '}
        sur vos revenus locatifs{city && <> à {city}</>}
      </h1>

      <p className="hp-subline">
        {keyword
          ? <>Votre <strong>{keyword}</strong>{city && <> à <strong>{city}</strong></>}, en ligne.</>
          : <>Votre déclaration fiscale LMNP, en ligne.</>
        }
      </p>

      <p className="hp-desc">
        Propriétaires bailleurs, Nopillo vous fait économiser <strong>+2000 €/an</strong> sur vos
        impôts locatifs grâce au régime réel. Immatriculation, génération de la liasse fiscale 2031,
        télédéclaration aux impôts… on s’occupe de tout&nbsp;!
      </p>

      <style>{`
        .hp-h1 {
          font-family: var(--font-display);
          font-size: clamp(34px, 4vw + 1rem, 56px);
          font-weight: 700;
          line-height: 1.08;
          letter-spacing: -0.02em;
          color: var(--color-brand-black);
          margin: 0 0 20px;
          text-wrap: balance;
        }
        .hp-subline {
          font-family: var(--font-display);
          font-size: clamp(20px, 2vw + 0.5rem, 28px);
          font-weight: 600;
          line-height: 1.25;
          color: var(--color-indigo-600);
          margin: 0 0 16px;
        }
        .hp-desc {
          font-size: clamp(15px, 1vw + 0.4rem, 17px);
          line-height: 1.55;
          color: var(--color-graycool-700, #404968);
          margin: 0;
          max-width: 52ch;
        }
      `}</style>
    </>
  )
}
