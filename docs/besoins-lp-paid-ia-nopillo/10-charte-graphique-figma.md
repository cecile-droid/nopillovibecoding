# 10 — Charte graphique (source Figma « Website redesign »)

> **À respecter à la lettre lors de la création des LP paid.**
> Tokens et structure extraits directement du Figma de refonte du site Nopillo.

## Source

- **Fichier Figma** : `Website redesign` — `https://www.figma.com/design/dncz3C8nOHIMdXWTe4Z0dz/Website-redesign`
- **Canvas** : `🚧 Design screens` (node `4223:99`) — 43 écrans du nouveau site
- **Frame de référence paid** : `LP Paid` (node `7956:4702`, 2749×8283)
- Extraction le 2026-06-30 via MCP Figma (`get_variable_defs` + `get_screenshot`)

⚠️ Le fichier ne contient PAS de page « design system » séparée : les tokens ci-dessous proviennent des variables Figma référencées par la frame LP Paid. Pour les **paddings pixel-exacts d'une section**, ré-extraire via `get_design_context` sur le node de la section concernée (IDs en fin de doc).

## Divergences avec le DS Nopillo actuel du repo

Le nouveau design **conserve la base** du DS existant — **Futura PT** + indigo **`#4033DB`** comme couleur de marque — mais introduit deux changements à appliquer sur les LP paid :

| Élément | DS actuel repo | Nouvelle charte Figma |
|---------|----------------|------------------------|
| Bouton primaire | Indigo `#4033DB` | **Noir `#09090b`**, texte blanc |
| Couleur d'accent secondaire | — (indigo seul) | **Émeraude `#11e28f`** (sections, highlights) |
| Indigo `#4033DB` | Primaire CTA | Couleur de marque / fonds lavande, plus la couleur des CTA |

## Couleurs

### Primary — Indigo
| Token | Hex |
|-------|-----|
| Primary/100 (`indigo/100`) | `#dedaff` |
| Primary/200 (`indigo/200`) | `#bdb5ff` |
| `indigo/300` | `#9c90ff` |
| `indigo/400` | `#8275ff` |
| Primary/500 | `#5747ff` |
| **Primary/600** (marque) | **`#4033db`** |
| Primary/900 | `#0c0854` |

### Secondary — Émeraude
| Token | Hex |
|-------|-----|
| Secondary/100 (`emeraude/100`) | `#cefdd8` |
| Secondary/200 (`emeraude/200`) | `#9efcbb` |
| `emeraude/300` | `#6df6a4` |
| `emeraude/400` | `#48ed9b` |
| **Secondary/500** (`emeraude/500`, accent) | **`#11e28f`** |
| `emeraude/600` | `#0cc28c` |

### Neutres
| Token | Hex |
|-------|-----|
| dark/100% | `#09090b` |
| dark/60% | `#09090b99` |
| neutral/50 | `#fafafa` |
| light/100% | `#ffffff` |

## Typographie — Futura PT

| Style | Famille | Graisse | Taille | Line-height |
|-------|---------|---------|--------|-------------|
| title-xxl-bold | Futura PT Heavy | 600 | 56 | 64 |
| title-xl-bold | Futura PT Heavy | 600 | 48 | 64 |
| title-l-bold | Futura PT Heavy | 600 | 40 | 48 |
| title-m-bold | Futura PT Heavy | 600 | 32 | 40 |
| title-s-bold | Futura PT Heavy | 600 | 24 | 32 |
| text-l-bold | Futura PT Heavy | 600 | 18 | 32 |
| text-l-regular | Futura PT Medium | 450 | 18 | 32 |
| text-m-regular | Futura PT Book | 400 | 16 | 24 |
| text-s-regular | Futura PT Book | 400 | 14 | 22 |

## Spacing

Échelle (px) : `0, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 32, 40, 48, 56, 64, 72, 80, 88, 120, 128`

Sémantique : `2XS 6` · `XS 8` · `S 12` · `M 16` · `L 24` · `XL 32` · `2XL 48`

## Border radius

| Token | Valeur |
|-------|--------|
| rounded-none | 0 |
| rounded-xxs | 16 |
| rounded-full / Round | 9999 (pill) |

## Ombres

| Token | Valeur |
|-------|--------|
| XS | drop-shadow `#0000000F`, offset (0,1), blur 10 |
| S | drop-shadow `#00000014`, offset (0,1), blur 16 |

## Boutons

| Variante | Fond | Texte / icône | Bordure |
|----------|------|---------------|---------|
| **Primary** | `#09090b` (noir) | `#ffffff` | `#09090b` |
| Secondary | transparent (`#ffffff00`) | `#09090b` | `#09090b` |
| Ghost | — | `#09090b` | — |
| Tertiary | — | `#09090b` | `#09090b` |

Rayon par défaut : pill (`rounded-full`, 9999).

## Structure de la LP Paid (ordre des sections)

D'après la frame `7956:4702` (desktop + mobile) :

1. **Header** — logo Nopillo, nav, CTA pill (à droite)
2. **Hero** — H1 « Simplifiée. Optimisée. » + sous-titre (liasse / régime réel LMNP) + **formulaire lead inline à droite** (champs + options radio + CTA). Fond lavande (indigo clair).
3. **Barre de stats** — 3 chiffres clés (`10 M€` / `6000` / `95 %`)
4. **« Notre logiciel »** — fond émeraude clair, mockups produit + liste de bénéfices
5. **« Comment ça marche ? »** — bloc vidéo/visuel (« régime réel »)
6. **Tableau comparatif** — régime réel vs micro-BIC, colonne verte avec checks
7. **« Pourquoi choisir Nopillo ? »** — fond indigo/lavande + carte simulation (« Votre cotisation 0 € » / « 3 366 € »)
8. **« Ce que Nopillo vous propose »** — 3 cards features avec illustrations
9. **« Nos clients parlent de nous »** — témoignages 5★ (3 cards)
10. **Bande CTA** — fond indigo « Simplifiez votre gestion comptable et fiscale » + bouton
11. **Footer** (cf. `Footer V2`, node `8037:34598`)

## Mapping suggéré vers le repo (Astro + Tailwind 4)

- Étendre le preset Tailwind Nopillo avec les ramps `indigo/*` et `emeraude/*` ci-dessus.
- Ajouter la variante bouton `primary` noire (`bg-[#09090b] text-white rounded-full`) en plus de l'indigo existant.
- Mapper les styles typo sur des classes utilitaires (`title-xxl-bold` → `text-[56px]/[64px] font-[600]`, etc.), police `Futura PT` déjà chargée via Adobe Typekit.
- Utiliser l'échelle de spacing native (multiples de 4 + 6/10/14/18/22/26).

## Node IDs pour ré-extraction (get_design_context)

| Écran | Node ID |
|-------|---------|
| **LP Paid** | `7956:4702` |
| Home page | `8522:8437` |
| Hero Homepage | `8924:17902` |
| Tarifs | `8339:6622` |
| LP simulation LMNP | `7695:855` |
| LP logiciel de comptabilité | `8673:9394` |
| Footer V2 | `8037:34598` |
| Template LP auteurs | `9441:12311` |

Autres LP disponibles dans le fichier : LP guides (`7719:1044`), LP avis clients V2 (`7773:1677`), LP PLF (`8444:41301`), LP webinar (`7990:33611`), Case study LP (`9211:12227`).
