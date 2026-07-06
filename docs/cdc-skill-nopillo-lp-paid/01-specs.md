# 01 — Spécifications détaillées

## Livrable

Le skill copie **19 fichiers** (contenu exact) dans le `front/` du projet cible, reproduisant la LP paid Nopillo. Structure de la page :

> Header (logo seul) → **Hero** (H1 DKI + formulaire simulateur) → StatsBar → ProblemSolution → Trustpilot (avis fixes) → Glossaire → CtaFinal → Footer.
> Page en `noindex` (paid), Axeptio actif, chatbot désactivé.

## Fichiers copiés

- `src/pages/lp-paid.astro`
- `src/layouts/Base.astro`
- `src/components/` : `HeaderPaid.astro`, `FooterPaid.astro`, `Logo.astro`, `HeroPaidHeadline.tsx`, `HeroSimForm.tsx`, `BookingChatbot.tsx` + `.css`
- `src/components/sections/` : `HeroPaid.astro`, `StatsBar.astro`, `ProblemSolution.astro`, `Trustpilot.astro`, `Glossaire.astro`, `CtaFinal.astro`
- `src/styles/` : `tokens.css`, `global.css`
- `src/lib/` : `dki.ts`, `tracking.ts`

## Logique du formulaire (HeroSimForm.tsx)

Parcours **2 étapes + branchement + écrans de sortie** :

1. **Étape 1 (simulateur + coordonnées)** : loyer, valeur du bien, situation, prénom, nom, email, téléphone, consentement RGPD. Validation par champ (bordure + fond rouge, flèche select rouge, checkbox rouge). Submit → **Form HubSpot #1**.
2. **Résultats + Étape 2 (même carte)** : bloc résultats compact (régime réel = **0 €** ; micro-BIC = fourchette hardcodée par loyer) + formulaire de qualification :
   - situation `non` (« réfléchit à investir ») → **Form #3** (projet investisseur)
   - situation `bientot`/`oui` → **Form #2** (propriétaire/locataire)
3. **Écrans de sortie** (après Form #2) : offre SCI · non-accompagné · calendrier location nue · calendrier meublé (selon réponses).

Side-effects :
- **First page seen** : URL d'entrée (+ UTM) en `localStorage` → propriété `marketing_first_page_seen_brut` (indépendant du consentement).
- **Événement GTM** `soumission_simulateur_paid` (après succès HubSpot étape 1).
- **Signup conditionnel** : Form #2 avec `funnel_self_type_bail = location_nue` → POST création compte Nopillo (`keepalive`).

## Calcul des résultats (hardcodé)

Régime réel = **toujours 0 €**. Micro-BIC selon la tranche de loyer (valeur du bien sans impact) :

| Loyer | min | max |
|---|---|---|
| `< 600€` | 0 | 1 749 |
| `600€ - 800€` | 1 750 | 2 332 |
| `800€ - 1 200€` | 2 332 | 3 499 |
| `> 1 200€` | 3 500 | 14 000 |

## Intégrations & IDs (à respecter à l'identique)

| Intégration | Valeur |
|---|---|
| HubSpot portail / région | `26173790` / `eu1` |
| Form #1 (simulateur) | `9577b1d9-d184-4f48-97b8-a3fdae3b2855` |
| Form #2 (propriétaire) | `771d8312-7858-4d06-9f74-9e08b016d7fc` |
| Form #3 (investisseur) | `821c76ec-0a29-41ff-a870-dee8e17fd36f` |
| GTM | `GTM-W4PCMHP` · event `soumission_simulateur_paid` |
| Axeptio | clientId `65a101e82071ac9cf7c32830` · version `fr-12-01-2024` · vendor `hubspot` |
| API signup | `POST https://api.my.nopillo.com/api/auth/email-signup` |

Détail des propriétés HubSpot par formulaire : voir `.claude/skills/nopillo-lp-paid/references/integrations.md`.

## Configuration externe requise (hors code)

1. **HubSpot** : les 3 formulaires (GUIDs) + propriétés contact existantes + RGPD « consentement au traitement » activé.
2. **GTM** (`GTM-W4PCMHP`) : déclencheur événement perso `soumission_simulateur_paid` → tag conversion Google Ads.
3. **Axeptio** : version `fr-12-01-2024` publiée avec vendor `hubspot` (le script HubSpot ne charge qu'après consentement).
4. **API signup** : origine de la LP autorisée en **CORS** sur `api.my.nopillo.com`.

## Critères d'acceptation

- [ ] `/lp-paid` → HTTP 200, `noindex, nofollow` présent.
- [ ] HTML contient `GTM-W4PCMHP` + clientId Axeptio `65a101e82071ac9cf7c32830`.
- [ ] Form 1 valide → écran résultats (0 € vs micro-BIC correct selon loyer) + Form 2/3 selon situation.
- [ ] Soumission Form 2/3 → contact HubSpot enrichi avec les bonnes propriétés/valeurs internes.
- [ ] Event `soumission_simulateur_paid` poussé au dataLayer (visible en Aperçu GTM).
- [ ] DKI : `?utm_term=expert+comptable+lmnp+lyon` → « Lyon » dans le H1.
- [ ] `location_nue` au Form 2 → POST signup tenté (statut visible en console).
