---
name: nopillo-lp-builder
description: Cree une nouvelle landing page Nopillo (page Astro dediee dans nopillo-landing-exemple) en composant des sections au choix. La charte, le logo, la navbar et le footer sont FIXES ; Axeptio est toujours inclus ; le hero reserve un slot formulaire rempli par un autre skill. Declenche avec "cree une LP", "nouvelle landing", "nouvelle landing page", "genere une landing", "build lp", "cree une page paid".
---

# nopillo-lp-builder — Générateur de landing page Nopillo

Crée **une nouvelle landing page** dans le projet `nopillo-landing-exemple/front` en assemblant des **sections au choix** de l'utilisateur, sur une **coquille fixe** (charte, logo, navbar, footer, layout).

Ce skill **ne fait QUE la LP** : il ne construit pas le formulaire (slot réservé, rempli par un autre skill), ne câble pas le tracking (autre skill), et n'ajoute pas de DKI.

## Règle d'or : coquille FIXE vs contenu VARIABLE

| FIXE — ne jamais modifier | VARIABLE — au choix de la personne |
|---|---|
| `src/layouts/Base.astro` (GTM, Consent Mode, **Axeptio toujours actif**) | Les **sections** de la page (liste choisie) |
| — | L'**indexation** (`noindex` paid vs indexable) — via la prop `noindex` de Base |
| `src/components/HeaderPaid.astro` (navbar = logo seul) | Le **contenu** de chaque section (fourni ou placeholder) |
| `src/components/FooterPaid.astro` | Les **assets** (fournis ou placeholders) |
| `src/components/Logo.astro` | Le **slug/URL** de la page |
| Charte : `src/styles/tokens.css` + `src/styles/global.css` + [10-charte-graphique-figma.md](../../../docs/besoins-lp-paid-ia-nopillo/10-charte-graphique-figma.md) | |

Réutilise ces éléments tels quels. **Ne réécris jamais** le header, le footer, le layout ou les tokens.

## Étape 1 — Interview (TOUJOURS avant de produire)

Pose ces questions, dans cet ordre, et attends les réponses :

1. **Slug / nom de la page** → la page sera créée en `src/pages/<slug>.astro`.
   - Vérifie que `src/pages/<slug>.astro` **n'existe pas déjà** (ne jamais écraser une LP existante). Si le fichier existe, demande un autre slug ou confirmation d'écrasement.
2. **Quelles sections ?** Présente le catalogue (voir [references/section-catalogue.md](references/section-catalogue.md)) et laisse choisir. Le hero est **toujours** présent (avec le slot formulaire). **Ne demande PAS l'ordre** — utilise l'ordre canonique recommandé (voir plus bas).
3. **Indexation** : « veux-tu que la page soit **indexable** (SEO organique) ou en **noindex** (paid only) ? ». Défaut suggéré : **noindex** (cas paid). → détermine la prop `noindex` de `Base`.
4. **Contenu, section par section** : pour chaque section choisie, demander « tu fournis le texte, ou je mets un placeholder à remplir ? ».
5. **Assets, section par section** (images/illustrations) : « tu fournis les visuels, ou je mets des placeholders ? ».

Ne demande PAS : l'ordre des sections, le DKI, le tracking, ni si Axeptio doit être là (il l'est toujours).

## Étape 2 — Génération de la page

Crée `src/pages/<slug>.astro` sur ce modèle :

```astro
---
import Base from '../layouts/Base.astro'
import HeaderPaid from '../components/HeaderPaid.astro'
import FooterPaid from '../components/FooterPaid.astro'
import Hero<Slug> from '../components/sections/Hero<Slug>.astro'
// + imports des sections choisies
---
<Base
  title="<titre>"
  description="<meta description>"
  showChatbot={false}
  axeptio={true}
  noindex={true}  {/* ou false si la personne veut indexer la page */}
>
  <HeaderPaid />
  <main>
    <Hero<Slug> />
    <!-- sections choisies, dans l'ordre canonique -->
  </main>
  <FooterPaid />
</Base>
```

Points obligatoires :
- **`axeptio={true}`** et **`showChatbot={false}`** sur `<Base>` (Axeptio toujours ; pas de popup chatbot sur les LP).
- **`noindex={...}`** selon la réponse à l'interview (`true` = noindex paid, `false` = page indexable). Défaut `true` si non précisé.
- **Un fichier `.astro` = une section** (convention projet). Crée les nouvelles sections dans `src/components/sections/`.

### Le hero + le SLOT FORMULAIRE (contrat inter-skills)

Le hero est en **2 colonnes desktop** : à gauche le texte (titre + accroche + éventuels chips), à **droite un slot formulaire réservé**. Ce skill n'y met PAS de formulaire — il place le composant `<FormSlot />`.

Crée `src/components/FormSlot.astro` (s'il n'existe pas) : un placeholder visible avec l'ancre standard que le skill « formulaire » viendra remplacer.

```astro
---
// SLOT FORMULAIRE — remplacé par le skill de création de formulaire.
// Contrat : le skill formulaire remplace <FormSlot /> par son island (ex. <MonForm client:load />).
---
<aside class="lp-form-slot" id="lp-form-slot" data-form-slot>
  <p>Emplacement du formulaire — à générer avec le skill « formulaire ».</p>
</aside>
<style>
  .lp-form-slot {
    display: grid; place-items: center; text-align: center;
    min-height: 320px; padding: 32px;
    background: var(--color-brand-white);
    border: 2px dashed var(--color-indigo-200, #BDB5FF);
    border-radius: 24px;
    color: var(--color-graycool-500, #5D6B98);
    font-family: var(--font-display);
  }
</style>
```

Le hero généré importe et place `<FormSlot />` dans la colonne de droite. **Contrat** : le slot est identifiable par `id="lp-form-slot"` et l'attribut `data-form-slot` — le skill formulaire s'appuie dessus pour l'insertion.

### Ordre canonique des sections (le skill ne demande pas l'ordre)

Place les sections choisies dans cet ordre logique (saute celles non choisies) :

1. Hero (toujours, avec slot formulaire)
2. Barre de stats / chiffres clés
3. Problème → Solution / « Notre logiciel » / Features
4. Comment ça marche / Process
5. Comparatif (tableau)
6. Avis / Témoignages / Trustpilot
7. Contenu sémantique / Glossaire
8. FAQ
9. CTA final
10. Footer (fixe)

## Charte à respecter (obligatoire)

Applique le design system Nopillo via les classes de `global.css` et les tokens :
- **Boutons** : `.btn .btn-primary` (noir), `.btn-secondary` (indigo), `.btn-ghost`, pill par défaut.
- **Sections** : alterne `.section-white` / `.section-soft` (lavande) pour éviter deux fonds blancs consécutifs ; `.section-cta` (indigo) pour le CTA final.
- **Conteneur** : `.container-regular` (1120px) ou un container élargi (max 1400px) pour un hero large.
- **Cartes** : `.card-solid` / `.card-nopillo` ; radius 16px.
- **Typo** : Futura PT (chargée dans Base), titres via `h1/h2` (déjà stylés), accents en `--color-indigo-600`.
- **Couleurs** : indigo `#4033DB`, émeraude `#11e28f`, noir `#09090B`, lavande `#DEDAFF`. Détails : voir la charte Figma.
- **Badge d'accroche** : `.badge-eyebrow` au-dessus des titres de section.

## Performance & conventions (à suivre)

- Hydratation : sections statiques en `.astro` pur ; îlots React `client:visible` (jamais `client:load` sans raison — réservé à l'above-the-fold critique).
- Pas d'image lourde dans le hero (LCP < 2s) ; `width`/`height` explicites sur les `<img>`.
- Pas de Google Fonts CDN (Futura PT via Typekit déjà dans Base).

## À NE PAS faire

- ❌ Ne pas modifier `Base.astro`, `HeaderPaid.astro`, `FooterPaid.astro`, `Logo.astro`, `tokens.css`.
- ❌ Ne pas construire le formulaire du hero (→ skill formulaire ; laisser `<FormSlot />`).
- ❌ Ne pas ajouter de tracking/événements dataLayer (→ skill tracking).
- ❌ Ne pas ajouter de DKI.
- ❌ Ne pas retirer Axeptio. (Le `noindex`, lui, dépend du choix d'indexation via la prop `noindex`.)
- ❌ Ne pas écraser une page existante — toujours un nouveau slug.

## Vérification finale

Après génération :
1. `curl -s -o /dev/null -w '%{http_code}' http://localhost:4322/<slug>` → attendu **200** (serveur dev sur 4322 ; 4321 souvent occupé).
2. Vérifier qu'aucune erreur n'apparaît dans le log Astro.
3. Confirmer que le **slot formulaire** est bien présent (`id="lp-form-slot"`), qu'Axeptio est actif, et que l'**indexation** correspond au choix (`noindex` présent ou non selon la réponse).
4. Rappeler à l'utilisateur : générer le **formulaire** (autre skill) et le **tracking** (autre skill) pour compléter la LP.
