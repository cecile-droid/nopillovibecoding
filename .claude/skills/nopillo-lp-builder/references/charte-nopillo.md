# Charte graphique Nopillo (référence autonome du skill)

Design system à appliquer sur toute LP générée. Ces tokens existent déjà dans
`nopillo-landing-exemple/front/src/styles/tokens.css` (variables CSS) et sont
exposés en classes dans `global.css`. Cette page les résume pour que le skill
soit **autonome** — même si la personne n'a pas la charte Figma.

## Couleurs

### Primary — Indigo
| Token CSS | Hex |
|---|---|
| `--color-indigo-100` | `#DEDAFF` (fonds lavande soft) |
| `--color-indigo-200` | `#BDB5FF` |
| `--color-indigo-500` | `#5747FF` |
| `--color-indigo-600` | `#4033DB` **(couleur de marque / accents)** |
| `--color-indigo-700` | `#2D23B7` |

### Secondary — Émeraude
| Token | Hex |
|---|---|
| `--color-secondary-100` | `#CEFDD8` |
| `--color-secondary-600` | `#0CC28C` |
| Émeraude accent (Figma) | `#11E28F` |

### Neutres
| Token | Hex |
|---|---|
| `--color-brand-black` | `#09090B` (texte + **boutons primaires**, PAS `#000`) |
| `--color-brand-white` | `#FFFFFF` |
| `--color-graycool-700` | `#404968` (texte secondaire) |
| `--color-graycool-500` | `#5D6B98` (texte muted) |
| `--color-neutral-50` | `#FAFAFA` |
| `--color-danger-500` | `#DB3352` (erreurs) · `--color-danger-50` `#FDEAED` |

## Typographie — Futura PT (Adobe Typekit, chargée dans `Base.astro`)

| Usage | Taille / line-height | Graisse |
|---|---|---|
| H1 hero | clamp(40px → 56px) | 700 |
| H2 section | clamp(32px → 56px) | 600 |
| H3 | 20 → 26px | 700 |
| Corps | 16px / 1.5 | 400 |
| Lead | 18px / 1.6 | 450–500 |

Familles : `--font-display` et `--font-body` = `futura-pt, system-ui, sans-serif`.
Titres via `h1`/`h2`/`h3` (déjà stylés dans `global.css`). Accent de mot en `--color-indigo-600`.

## Spacing (px)
`4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 128` (tokens `--space-*`).

## Border radius
`--radius-lg` 16px (cartes) · `--radius-xl` 24px · `--radius-pill` 999px (boutons).

## Ombres
`--shadow-card` `0 1px 10px rgba(0,0,0,.06)` · `--shadow-elevated` `0 1px 16px rgba(0,0,0,.08)`.

## Composants (classes prêtes dans `global.css`)

| Classe | Rôle |
|---|---|
| `.btn .btn-primary` | Bouton **noir** (`#09090B`), pill, texte blanc |
| `.btn .btn-secondary` | Bouton **indigo** (`#4033DB`) |
| `.btn .btn-ghost` / `.btn-outline` | Bouton transparent / contour |
| `.btn-sm` `.btn-md` `.btn-lg` | Tailles |
| `.card-solid` / `.card-nopillo` | Cartes (blanche / translucide + border indigo-100) |
| `.badge-eyebrow` | Petit badge d'accroche au-dessus des titres |
| `.container-regular` (1120px) / `.container-navbar` (1408px) | Conteneurs |
| `.section` + `.section-white` / `.section-soft` (lavande) / `.section-accent` / `.section-cta` (indigo) | Sections + fonds |
| `.stat-display` | Gros chiffres clés |

## Règles d'application

- **Boutons** : primaire = **noir** (pas indigo). Indigo réservé aux CTA de section / accents.
- **Alternance des fonds** : ne jamais enchaîner deux `.section-white`. Intercaler `.section-soft` (lavande) pour rythmer. CTA final en `.section-cta` (indigo).
- **Accents** : mot-clé du titre en `--color-indigo-600` (`<span style="color: var(--color-indigo-600)">…</span>`).
- **Pills** : boutons et chips en `--radius-pill`.
- **Pas de Google Fonts CDN** : Futura PT est chargée via Typekit dans `Base.astro`.

> Source détaillée (si présente dans le repo) : `docs/besoins-lp-paid-ia-nopillo/10-charte-graphique-figma.md` (extraction Figma). Cette page suffit pour appliquer le DS sans elle.
