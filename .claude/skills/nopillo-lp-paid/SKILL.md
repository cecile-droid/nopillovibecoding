---
name: nopillo-lp-paid
description: Reproduit À L'IDENTIQUE la landing page paid Nopillo complète (design + formulaire simulateur 2 étapes + toutes les intégrations : Axeptio, formulaires HubSpot, tag GTM, mêmes IDs). Copie les fichiers exacts dans le projet. Déclenche avec "reproduis la LP paid", "la même LP", "clone la landing paid", "LP paid Nopillo complète", "recrée la landing simulateur", "exactement la même landing".
---

# nopillo-lp-paid — LP paid Nopillo à l'identique

Recrée **exactement** la landing page paid Nopillo (celle avec le simulateur LMNP) : design, formulaire simulateur 2 étapes avec branchement, écrans de sortie, et **toutes les connexions** (Axeptio, HubSpot Forms, GTM) avec **les mêmes IDs**.

Ce skill **copie les fichiers réels** empaquetés dans `assets/` — c'est la garantie d'un résultat identique, pas une reconstruction. Après copie, il reste une **configuration externe** (HubSpot / GTM / Axeptio) à valider, décrite plus bas.

## Prérequis (stack cible)

Le projet cible doit être une app **Astro 6 + Tailwind 4 + React (islands) + TypeScript**, avec la police **Futura PT via Adobe Typekit** (chargée dans `Base.astro`). C'est le cas de `nopillo-landing-exemple`. Sur un projet vierge, initialiser d'abord la stack (cf. skill `init-landing-stack`).

## Étape 1 — Copier les fichiers (résultat identique)

Copie tout `assets/front/` vers le dossier `front/` du projet cible (structure 1:1) :

```bash
# Depuis la racine du skill, TARGET = dossier front/ du projet cible
cp -R assets/front/src/. <TARGET>/src/
```

Fichiers copiés (19) et leur rôle :

| Fichier | Rôle |
|---|---|
| `src/pages/lp-paid.astro` | La page (assemble les sections, `noindex` + `axeptio` + `showChatbot=false`) |
| `src/layouts/Base.astro` | Layout : GTM, Consent Mode, **Axeptio**, preconnects HubSpot, props `noindex/axeptio/showChatbot` |
| `src/components/HeaderPaid.astro` | Navbar minimale (logo seul) |
| `src/components/FooterPaid.astro` | Footer minimal (Politiques / À propos) |
| `src/components/Logo.astro` | Logo SVG Nopillo inline |
| `src/components/HeroPaidHeadline.tsx` | H1 du hero (DKI : « Passez au régime réel… 0 € d'impôts [à Ville] ») |
| `src/components/HeroSimForm.tsx` | **Le formulaire simulateur** (toute la logique, voir plus bas) |
| `src/components/BookingChatbot.tsx` + `.css` | Importé par Base (désactivé sur la LP via `showChatbot=false`) — requis pour compiler |
| `src/components/sections/HeroPaid.astro` | Hero 2 colonnes (texte + form), fond lavande + courbes |
| `src/components/sections/StatsBar.astro` | Barre de stats |
| `src/components/sections/ProblemSolution.astro` | Problème/solution |
| `src/components/sections/Trustpilot.astro` | Avis (3 avis fixes ; TODO widget dynamique) |
| `src/components/sections/Glossaire.astro` | Glossaire (accordéon, fond lavande) |
| `src/components/sections/CtaFinal.astro` | CTA final (« Démarrer maintenant » → `#contact`) |
| `src/styles/tokens.css` + `global.css` | Design system Nopillo (tokens + classes) |
| `src/lib/dki.ts` | Dynamic Keyword Insertion (lecture URL params) |
| `src/lib/tracking.ts` | Helpers dataLayer (GTM) |

> ⚠️ Ne pas écraser des fichiers existants sans vérifier : sur `nopillo-landing-exemple`, `Base.astro`/`tokens.css`/`global.css`/`dki.ts`/`tracking.ts` existent déjà — comparer avant. Sur un autre projet, copier tel quel.

Tous les **IDs sont déjà codés en dur** dans ces fichiers (formulaires HubSpot, GTM, Axeptio, propriétés, API signup). Aucune variable d'env obligatoire — le `.env` peut surcharger mais les défauts reproduisent l'existant.

## Structure de la LP (ordre des sections)

Header (logo) → **Hero** (H1 DKI + formulaire simulateur) → StatsBar → ProblemSolution → Trustpilot → Glossaire → CtaFinal → Footer. Page en `noindex` (paid), Axeptio actif.

## La logique du formulaire (HeroSimForm.tsx)

Parcours en **2 étapes avec branchement** :

1. **Étape 1** — simulateur + coordonnées : loyer, valeur du bien, situation, prénom, nom, email, téléphone, consentement. Validation par champ (bordure/fond rouge). Submit → **Form HubSpot #1**.
2. **Écran résultats + Étape 2** (même carte) : bloc résultats compact (régime réel = **0 €** ; micro-BIC = fourchette hardcodée selon le loyer) + le formulaire de qualification :
   - Situation = « Je réfléchis à investir » (`non`) → **Form 3** (projet investisseur).
   - Sinon (`bientot`/`oui`) → **Form 2** (propriétaire/locataire).
   Submit → **Form HubSpot #2 ou #3** (email repris → même contact enrichi, sans ressaisie).
3. **Écrans de sortie** (après Form 2, selon les réponses) : offre SCI · non-accompagné · calendrier HubSpot location nue · calendrier meublé.

Side-effects intégrés :
- **first_page_seen** : URL d'entrée (+ UTM) stockée en `localStorage`, envoyée dans `marketing_first_page_seen_brut` (indépendant du consentement).
- **Événement GTM** `soumission_simulateur_paid` poussé au dataLayer après succès HubSpot de l'étape 1.
- **Signup conditionnel** : si Form 2 avec `funnel_self_type_bail = location_nue` → POST création de compte Nopillo (`keepalive`, fire-and-forget).

## Tous les IDs / connexions (référence)

Voir [references/integrations.md](references/integrations.md) pour le détail complet (propriétés HubSpot par formulaire, valeurs internes, mapping des résultats). Résumé :

| Intégration | Valeur |
|---|---|
| HubSpot portail / région | `26173790` / `eu1` |
| Form HubSpot #1 (simulateur) | `9577b1d9-d184-4f48-97b8-a3fdae3b2855` |
| Form HubSpot #2 (propriétaire) | `771d8312-7858-4d06-9f74-9e08b016d7fc` |
| Form HubSpot #3 (investisseur) | `821c76ec-0a29-41ff-a870-dee8e17fd36f` |
| GTM (conteneur) | `GTM-W4PCMHP` |
| Événement de conversion | `soumission_simulateur_paid` |
| Axeptio clientId / version | `65a101e82071ac9cf7c32830` / `fr-12-01-2024` |
| API signup (location nue) | `POST https://api.my.nopillo.com/api/auth/email-signup` |

## Étape 2 — Configuration externe à valider (hors code)

La copie des fichiers reproduit le code. Pour que **tout fonctionne**, ces éléments doivent exister côté services (ils existent déjà pour le portail Nopillo `26173790`) :

1. **HubSpot** : les 3 formulaires (GUIDs ci-dessus) + les propriétés contact utilisées (voir `references/integrations.md`). Le RGPD « consentement au traitement » activé sur les forms.
2. **GTM** (`GTM-W4PCMHP`) : déclencheur « Événement personnalisé » = `soumission_simulateur_paid` → tag de conversion Google Ads.
3. **Axeptio** : version `fr-12-01-2024` publiée, avec un vendor **`hubspot`** (le script HubSpot ne se charge qu'après consentement de ce vendor).
4. **API signup** : l'origine de la LP doit être autorisée en **CORS** sur `api.my.nopillo.com`.

## Vérification

1. Lancer le dev (`npm run dev`, souvent port 4321 ; 4322 en secours) et ouvrir `/lp-paid` → **HTTP 200**.
2. Vérifier dans le HTML : `GTM-W4PCMHP`, le clientId Axeptio, `noindex`.
3. Tester le parcours : Form 1 → résultats + Form 2/3 → écran de sortie ; vérifier la remontée dans HubSpot (Contacts) + l'event GTM en mode Aperçu.
4. DKI : `/lp-paid?utm_term=expert+comptable+lmnp+lyon` → « Lyon » dans le H1.

## À NE PAS faire

- ❌ Ne pas « reconstruire » les composants à la main — **copier les assets** (c'est la garantie d'identité).
- ❌ Ne pas changer les IDs/GUIDs/propriétés sans raison — c'est ce qui garantit « exactement la même ».
- ❌ Ne pas retirer Axeptio ni le gate `data-hs-do-not-collect` sur le form.
