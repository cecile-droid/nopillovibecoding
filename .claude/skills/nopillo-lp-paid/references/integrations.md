# Intégrations LP paid — détail complet

Toutes ces valeurs sont **déjà codées en dur** dans les fichiers copiés (`Base.astro`, `HeroSimForm.tsx`). Cette page sert de référence + checklist de config côté services.

## HubSpot — portail

- Portail : `26173790` · Région : `eu1`
- Endpoint Forms API : `https://api-eu1.hsforms.com/submissions/v3/integration/submit/{portalId}/{formGuid}`

## Form #1 — Simulateur (GUID `9577b1d9-d184-4f48-97b8-a3fdae3b2855`)

Champs envoyés (name du form → propriété HubSpot) :

| Champ | Propriété HubSpot | Valeurs internes |
|---|---|---|
| Prénom | `firstname` | texte |
| Nom | `lastname` | texte |
| Email | `email` | email |
| Téléphone | `phone` | tel |
| Montant du loyer | `master___montant_du_loyer` | `< 600€` · `600€ - 800€` · `800€ - 1 200€` · `> 1 200€` |
| Valeur du bien | `valeur_du_bien_loue` | `< 100 000€` · `100 000€ - 150 000€` · `150 000€ - 250 000€` · `> 250 000€` |
| Situation | `statut_de_la_mise_en_location` | `oui` (déjà loué) · `bientot` (acheté récemment) · `non` (réfléchit à investir) |
| First page seen | `marketing_first_page_seen_brut` | URL complète (UTM inclus), via localStorage |

Résultats simulateur (calculés, propriétés type nombre) :

| Propriété | Valeur |
|---|---|
| `new_simul_wf_valeur_mini_reel` | `0` (toujours) |
| `new_simul_wf_valeur_maxi_reel` | `0` (toujours) |
| `new_simul_wf_valeur_mini_microbic` | selon loyer (voir mapping) |
| `new_simul_wf_valeur_maxi_microbic` | selon loyer (voir mapping) |

Mapping micro-BIC par tranche de loyer (régime réel = toujours 0 ; la valeur du bien n'impacte pas) :

| Loyer | micro-BIC min | micro-BIC max |
|---|---|---|
| `< 600€` | 0 | 1 749 |
| `600€ - 800€` | 1 750 | 2 332 |
| `800€ - 1 200€` | 2 332 | 3 499 |
| `> 1 200€` | 3 500 | 14 000 |

## Branchement après Form #1 (valeur `statut_de_la_mise_en_location`)

- `non` (« Je réfléchis à réaliser un investissement immobilier ») → **Form #3**
- `bientot` / `oui` → **Form #2**

## Form #2 — Propriétaire/locataire (GUID `771d8312-7858-4d06-9f74-9e08b016d7fc`)

Envoie l'`email` (repris de l'étape 1) + :

| Question | Propriété | Valeurs internes |
|---|---|---|
| Propriétaire ou locataire ? | `funnel_self_propriete` | `proprietaire` · `locataire` |
| Location meublée ? | `funnel_self_type_bail` | `location_meublee` · `location_nue` · `je_ne_sais_pas` |
| Cas particuliers ? | `funnel_self_cas_specifiques` | `demembrement` · `tva` · `aucun-cas-specifique` · `SCI/SARL` (options RP/LCD existent mais non affichées) |

Écrans de sortie (après Form #2) :
- cas = `SCI/SARL` → écran « offre SCI »
- statut = `locataire` → écran « non accompagné »
- propriétaire + `location_nue` → **calendrier HubSpot** `coralie-vincent/rdv-coralie-ln`
- propriétaire + (meublé/je ne sais pas) + cas non bloquant (`aucun-cas-specifique`/`residence_principale`/`LCD`) → **calendrier** `christopher-dieng/landing-page-simulateur`
- propriétaire + (meublé/je ne sais pas) + cas bloquant (`demembrement`/`tva`) → écran « non accompagné »

## Form #3 — Projet investisseur (GUID `821c76ec-0a29-41ff-a870-dee8e17fd36f`)

Envoie l'`email` + (valeurs internes = libellés) :

| Question | Propriété | Options |
|---|---|---|
| Où en êtes-vous ? | `maturite_du_projet` | Je débute ma réflexion · J'ai un projet d'achat mais rien de signé · J'ai une promesse de vente · J'ai déjà un bien à louer ou déjà loué |
| Quand concrétiser ? | `date_du_projet_estime` | Moins de 3 mois · 3 à 6 mois · Plus de 6 mois · Je ne sais pas |
| Type d'investissement ? | `type_de_projet_envisage` | LMNP / Meublé · Location nue · SCI · Autre · Je ne sais pas |

## GTM — `GTM-W4PCMHP`

- Chargé dans `Base.astro` (le placeholder `GTM-XXXXXX` du `.env` est ignoré via un garde `!includes('XXX')`).
- Événement de conversion poussé au dataLayer : **`soumission_simulateur_paid`** (après succès HubSpot de l'étape 1), avec `form_id: 'hero_sim_form'`, `keyword`, `match_type`.
- Événement GA4 baseline `form_submit` aussi poussé.
- Côté GTM : déclencheur « Événement personnalisé » = `soumission_simulateur_paid` → tag de conversion Google Ads.

## Axeptio — CMP

- `clientId: 65a101e82071ac9cf7c32830` · `cookiesVersion: fr-12-01-2024`
- Gère le **Consent Mode v2** (denied par défaut).
- Le script HubSpot (`hs-scripts.js`) est **gaté** : chargé uniquement après consentement du vendor **`hubspot`** (`window._axcb` → `cookies:complete` → `choices.hubspot`).

## API signup (side-effect location nue)

- `POST https://api.my.nopillo.com/api/auth/email-signup`
- Déclenché au submit du Form #2 si `funnel_self_type_bail === 'location_nue'`
- Payload : `{ email, prenom, nom, phone, callbackURL: 'https://my.nopillo.com/bienvenue', sendEmail: false }`, `keepalive: true`
- ⚠️ Nécessite l'autorisation **CORS** de l'origine de la LP côté API.
