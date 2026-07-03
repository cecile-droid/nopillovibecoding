# Catalogue des sections

Menu proposé à la personne à l'étape 2 de l'interview. Elle pioche les sections voulues ; le hero est toujours inclus. Chaque section = 1 fichier `.astro` dans `src/components/sections/`.

Colonne « Réutilisable » : un composant existant peut être repris tel quel (ou dupliqué/adapté pour la nouvelle LP). Sinon, créer la section à partir des patterns du DS.

| Section | Rôle | Réutilisable (existant) |
|---|---|---|
| **Hero (obligatoire)** | Titre + accroche à gauche, **slot formulaire** à droite | patron `HeroPaid.astro` (adapter : remplacer le form par `<FormSlot />`) |
| **Barre de stats** | 3 chiffres clés (ex. « 10 M€ / 6000 / 95 % ») | `StatsBar.astro` |
| **Problème → Solution / Features** | Bénéfices, « Notre logiciel », cartes features | `ProblemSolution.astro` |
| **Comment ça marche / Process** | Étapes du parcours (souvent 3 colonnes + illustrations) | à créer (pattern 3 colonnes) |
| **Comparatif** | Tableau régime réel vs micro-BIC, etc. | à créer (tableau) |
| **Avis / Témoignages** | Cartes de témoignages clients | `Testimonials.astro` |
| **Trustpilot** | Note + avis (fixes pour l'instant ; widget dynamique plus tard via Business Unit ID) | `Trustpilot.astro` |
| **Glossaire / Contenu sémantique** | Accordéon de termes (bon pour le Quality Score) | `Glossaire.astro` |
| **FAQ** | Questions/réponses (accordéon, schema.org FAQPage) | `FAQ.astro` |
| **Bande de logos / TrustBand** | Logos presse / partenaires | `TrustBand.astro` |
| **CTA final** | Bande indigo « démarrez » avant le footer | `CtaFinal.astro` |
| **Cards profils** | Segmentation par profil (cartes photo + texte) | à créer (pattern cards) |

## Règles de composition

- **Alternance des fonds** : ne jamais enchaîner deux sections `section-white`. Intercaler `section-soft` (lavande) ou `section-accent` pour rythmer.
- **CTA final** : recommandé en avant-dernière position (juste avant le footer), en `section-cta` (indigo).
- **Ancrages** : garder des `id` cohérents si des liens internes existent (ex. `#avis`, `#faq`, `#contact`).
- **Contenu / assets** : selon le choix de la personne (fourni ou placeholder). Pour un placeholder texte, écrire un contenu réaliste marqué `<!-- TODO: à remplacer -->`. Pour un placeholder visuel, une zone grise dimensionnée (pas d'image externe).
