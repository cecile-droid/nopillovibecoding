# CDC — Skill `nopillo-lp-paid`

> Cahier des charges du skill Claude Code qui **reproduit à l'identique** la landing page paid Nopillo (simulateur LMNP) : design complet + formulaire simulateur 2 étapes + toutes les intégrations (Axeptio, formulaires HubSpot, tag GTM), avec **les mêmes IDs**.

## Résumé exécutif

**Skill cible** : `nopillo-lp-paid`

**Mission** : permettre à n'importe qui d'obtenir **exactement la même LP paid** que la référence, sans reconstruction — par **copie des fichiers réels** empaquetés dans le skill, puis validation de la config externe (HubSpot / GTM / Axeptio).

**Différence avec `nopillo-lp-builder`** : `nopillo-lp-builder` **compose** une LP au choix (sections variables, slot formulaire vide). `nopillo-lp-paid` **clone** LA LP paid existante, formulaire et intégrations inclus, à l'identique.

**Sorties attendues** :
- La page `lp-paid.astro` + toutes ses sections + le formulaire simulateur complet, copiés dans le projet
- Toutes les connexions câblées avec les mêmes IDs (HubSpot portail 26173790, 3 form GUIDs, GTM-W4PCMHP, Axeptio, API signup)
- Une page qui rend en HTTP 200 avec le parcours complet fonctionnel (sous réserve de la config services)

## Scope

**Inclus dans le skill** :
- Copie 1:1 de 19 fichiers (page, layout, coquille, hero, formulaire, sections, styles, libs) — contenu exact via `assets/`
- Documentation de la structure, de la logique du formulaire, et de **tous les IDs/connexions**
- Checklist de configuration externe (HubSpot forms + propriétés, GTM tag/trigger, Axeptio vendor, CORS API)
- Vérification (HTTP 200, remontée HubSpot, event GTM, DKI)

**Exclus** :
- Le scaffolding de la stack (Astro/Tailwind/React) → prérequis, ou skill `init-landing-stack`
- La création des formulaires/propriétés HubSpot et du tag GTM → config services (existe déjà pour le portail Nopillo)
- La composition de sections « à la carte » → c'est le rôle de `nopillo-lp-builder`

## Stack cible (projet hôte)

| Couche | Techno |
|--------|--------|
| Frontend | Astro 6 |
| Styling | Tailwind 4 + tokens Nopillo (`tokens.css` / `global.css`) |
| Islands | React (TypeScript) — hydratation `client:load` (hero) / `client:visible` |
| Police | Futura PT via Adobe Typekit (dans `Base.astro`) |
| Formulaires | API HubSpot Forms (client-side, region eu1) |
| Consentement | Axeptio (Consent Mode v2) |
| Tracking | GTM + dataLayer |

## Fichiers du CDC

| Fichier | Contenu |
|---------|---------|
| [01-specs.md](01-specs.md) | Spécifications détaillées : livrable, fichiers, logique du formulaire, intégrations, IDs, critères d'acceptation |
| [sources.md](sources.md) | Références (skill, composants, docs liées) |

## Critères d'acceptation (résumé)

- `/lp-paid` répond **200**, `noindex` présent, `GTM-W4PCMHP` + clientId Axeptio dans le HTML.
- Parcours complet : Form 1 → résultats + Form 2/3 (branchement selon situation) → écran de sortie.
- Remontée HubSpot vérifiée (contact enrichi, mêmes propriétés) + event `soumission_simulateur_paid` visible en Aperçu GTM.
- DKI : `?utm_term=…lyon` injecte la ville dans le H1.
