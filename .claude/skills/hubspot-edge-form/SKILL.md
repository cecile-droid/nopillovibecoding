---
name: hubspot-edge-form
description: >
  Genere une Edge Function Supabase qui forwarde des submissions vers un form HubSpot.
  Fetch le schema public, genere le code (validation typed), deploye, teste, fournit les snippets
  d'integration. Donne une URL HubSpot ou laisse-le demander portalId/formId.
argument-hint: "[url-hubspot-form-optionnel]"
allowed-tools: Read Write Edit Glob Grep Bash AskUserQuestion
model: sonnet
effort: medium
---

# HubSpot Edge Form — Generateur d'Edge Function pour HubSpot Forms

Tu generes une **Edge Function Supabase** complete et deployee pour forwarder des submissions vers un form HubSpot. Tu utilises les endpoints publics HubSpot (pas besoin de token) pour decouvrir la structure du form et valider les inputs server-side avec les bons enums.

## References disponibles

| Fichier | Quand le lire |
|---------|---------------|
| [references/url-patterns.md](references/url-patterns.md) | Phase 1 : parser une URL HubSpot |
| [references/form-anatomy.md](references/form-anatomy.md) | Phase 3 : extraire fields/enums depuis render-definition v4 |
| [references/integration-snippets.md](references/integration-snippets.md) | Phase 7 : snippets vanilla JS / React / Astro / Vue |

## Assets disponibles

| Fichier | Usage |
|---------|-------|
| [assets/edge-function-template.ts](assets/edge-function-template.ts) | Template Edge Function avec placeholders `{{VAR}}` |

## Workflow (7 phases)

### Phase 1 — Recuperer l'input

**Si une URL est fournie en argument** (`$ARGUMENTS` non vide) :
- Charge [references/url-patterns.md](references/url-patterns.md)
- Parse l'URL avec la regex `app(-[a-z]+\d+)?.hubspot.com/forms/(\d+)/.*/([a-f0-9-]{36})`
- Extrait : `portalId`, `formId`, `region` (default `us`, ou `eu1`/`na1` selon prefix)
- Si parse echoue : afficher l'URL recue + tomber sur l'interview

**Sinon (interview)** : poser les questions une a une avec `AskUserQuestion`.

| Question | Format attendu | Variable |
|----------|---------------|----------|
| Portal ID HubSpot ? | nombre (ex: `26173790`) | `{{PORTAL_ID}}` |
| Form ID HubSpot ? | UUID v4 (ex: `107536bf-c2cb-44de-89ea-8c3101f83870`) | `{{FORM_ID}}` |
| Region HubSpot ? | `eu1` / `na1` / `us` (default) | `{{REGION}}` |

**Validation regex** :
- portalId : `^\d{6,12}$`
- formId : `^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$`

### Phase 2 — Fetch render-definition

**ESSAYER DANS CET ORDRE** (chaque endpoint sur EU puis US) :

```bash
# Tente l'URL specifique a la region d'abord
curl -s "https://api-{{REGION}}.hsforms.com/embed/v4/render-definition/{{PORTAL_ID}}/{{FORM_ID}}"

# Fallback : api.hsforms.com (US)
curl -sL "https://api.hsforms.com/embed/v4/render-definition/{{PORTAL_ID}}/{{FORM_ID}}"
```

Si HTTP 200 sur l'EU et 4xx sur l'US → la region est `eu1`. Si inverse → `us`. Sauvegarder le JSON brut pour la phase suivante.

**Erreurs courantes** :
- `403 "Not an Embed version 2 or 3 form"` : tu as utilise `/embed/v3/form/...` au lieu de `/embed/v4/render-definition/...`. Utiliser v4.
- `404` : portalId ou formId invalide. Re-demander a l'utilisateur.

### Phase 3 — Analyser la structure du form

Charge [references/form-anatomy.md](references/form-anatomy.md) pour le detail.

Parse le JSON et extrait pour chaque field :

1. **Walk recursive** `form.modules[].modules[].modules[]` (steps > rows > fields)
2. Filtrer les modules `type` dans : `email`, `single_line_text`, `multi_line_text`, `dropdownSelect`, `radio`, `single_checkbox`, `multiple_checkboxes`, `phone`, `number`, `date`
3. Pour chaque field, extraire :
   - `name` = `propertyReference.split('/')[1]` (ex: `0-1/email` → `email`)
   - `objectTypeId` = `propertyReference.split('/')[0]` (ex: `0-1`)
   - `label`, `required`, `description`
   - Si dropdown/radio/checkbox : extraire `options[].value` (les valeurs autorisees)
4. Identifier les logique conditionnelles `form.logicRules` (utile pour le README)

Afficher a l'utilisateur un **resume des fields detectes** :

```
Form detecte : Demande contact LMNP (portail 26173790, region eu1)

  4 fields :
    - email                       (email, optional)
    - maturite_du_projet          (dropdown, optional, 4 valeurs)
    - date_du_projet_estime       (dropdown, optional, conditionnel)
    - type_de_projet_envisage     (dropdown, optional, conditionnel)

  Logique : si maturite_du_projet = "deja un bien", les 2 dropdowns suivants sont masques.
```

### Phase 4 — Generer l'Edge Function

1. Determiner le **nom de la function** (slug) :
   - Si `form.name` est present dans le render-definition : `slugify(form.name)`
   - Sinon : `hubspot-form-{formId.slice(0, 8)}`
   - Demander confirmation a l'utilisateur du slug propose

2. Lire le template `assets/edge-function-template.ts`

3. Generer la **substitution** :
   - `{{PORTAL_ID}}` → `26173790`
   - `{{FORM_ID}}` → `107536bf-c2cb-44de-89ea-8c3101f83870`
   - `{{REGION_SUFFIX}}` → `-eu1` ou `` (vide)
   - `{{FORM_NAME_HUMAN}}` → ex `Demande contact LMNP`
   - `{{FIELDS_TYPE}}` → bloc TypeScript `type Payload = { email?: string; maturite_du_projet?: string; ... }`
   - `{{ENUM_DECLARATIONS}}` → blocs `const ENUM_xxx = [...] as const`
   - `{{VALIDATION_BLOCK}}` → if checks par field
   - `{{FIELDS_BUILDER}}` → `push('email', body.email)` par field

4. Determiner l'**emplacement** :
   - Detecter `supabase/functions/` dans le projet courant
   - Si trouve : ecrire `supabase/functions/{slug}/index.ts`
   - Sinon : demander a l'utilisateur (creer dossier supabase ? path custom ?)

5. Generer aussi un `README.md` dans le meme dossier avec usage curl + snippets

### Phase 5 — Deployer l'Edge Function

1. **Detecter le project-ref** Supabase :
   ```bash
   # Tente de lire .git/.../config ou un fichier supabase config
   cat supabase/.temp/project-ref 2>/dev/null || \
   cat .supabase/config.toml 2>/dev/null | grep project_id
   ```
   Si non trouve : demander a l'utilisateur le project-ref (format `xxxxxxxxxxxx`).

2. **Verifier supabase CLI version** :
   ```bash
   supabase --version  # Doit etre 2.45+ pour bundle sans Docker
   ```
   Si < 2.45 : suggerer `brew upgrade supabase`.

3. **Deploy** :
   ```bash
   supabase functions deploy {slug} --no-verify-jwt --project-ref {ref}
   ```

4. Construire l'URL finale :
   ```
   https://{ref}.supabase.co/functions/v1/{slug}
   ```

### Phase 6 — Tester la submission

Construire un payload de test **valide** :
- `email` : `test+skill-$(date +%s)@example.com`
- Pour chaque enum field : prendre la **premiere valeur** de l'enum (toujours valide)
- Ajouter `pageUri` = `https://test.example/landing-test`

POST sur l'endpoint :

```bash
curl -s -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "$test_payload" -w "\nHTTP %{http_code}\n"
```

**Validation du test** :
- HTTP 200 + body `{"ok": true, ...}` → succes
- HTTP 4xx avec erreur HubSpot → afficher details + arret + suggestion de fix
- HTTP 5xx → tenter 1 retry, sinon afficher logs

### Phase 7 — Recap d'integration

Charge [references/integration-snippets.md](references/integration-snippets.md) pour les templates.

Afficher un **recap clair** :

```
Edge function deployee : success

Endpoint
  URL          : https://{ref}.supabase.co/functions/v1/{slug}
  Methods      : POST (JSON), OPTIONS (preflight cors)
  Auth         : aucune (endpoint public Supabase)

Fields acceptes
  email, maturite_du_projet, date_du_projet_estime, type_de_projet_envisage
  (et : hutk, pageUri, pageName, honeypot pour anti-spam + tracking)

Verifier le form HubSpot
  Submissions  : https://app-{region}.hubspot.com/forms/{portalId}/{formId}/performance
  Contacts     : https://app-{region}.hubspot.com/contacts/{portalId}/objects/0-1/views/all/list

Integration landing
  Vanilla JS  : voir snippet dans README.md de la function (~30 lignes)
  React hook  : voir snippet React
  Astro       : voir snippet island Astro

Prochaine etape
  1. Embed le tracking snippet HubSpot dans ton <head> pour l'attribution :
     <script type="text/javascript" id="hs-script-loader" async defer
       src="https://js-{region}.hs-scripts.com/{portalId}.js"></script>
  2. Ajouter l'URL prod a ALLOWED_ORIGINS dans index.ts puis redeploy
  3. Tester un submit reel depuis ta page
```

Proposer **3 snippets ready-to-paste** :
- Vanilla JS (form HTML + submit handler avec hutk capture)
- React hook reutilisable
- Astro island (si projet Astro detecte via `astro.config.mjs` present)

## Regles

- **Endpoints publics uniquement** : pas besoin de Bearer token HubSpot. Utiliser `/embed/v4/render-definition/` et `/submissions/v3/integration/submit/`.
- **Auto-detect region** : tenter US puis EU. Ne jamais demander la region en premier (deduisible).
- **Sanitize hutk** : filtrer les hutk malformes (regex `^[a-f0-9]{32}$`) avant POST a HubSpot, sinon `INVALID_HUTK`.
- **CORS restreint** : ne jamais mettre `*`. Toujours lister les origines connues (localhost + prod).
- **Validation enum stricte** : pour chaque dropdown/radio/checkbox, generer un `as const` TypeScript et validation au runtime.
- **Confirmation interactive** : avant deploy (slug + emplacement), demander OK utilisateur.
- **Test obligatoire** : pas de "deploy and forget", toujours faire un POST test et verifier 200.
- **Documenter dans README** : chaque function deployee a son `README.md` avec exemples curl + JS + React.

## Gestion d'erreurs

| Phase | Erreur | Action |
|-------|--------|--------|
| 1 | URL invalide / parse fail | Afficher URL recue + fallback interview |
| 2 | 403 "Not an Embed v2/v3" | Utiliser `/embed/v4/render-definition/`, pas v3 |
| 2 | 404 form not found | Re-demander portalId + formId |
| 3 | Aucun field detecte | Afficher le JSON brut + demander a l'user de checker |
| 4 | Slug deja existant | Proposer slug avec suffix numerique ou demander |
| 5 | supabase CLI absent | Suggerer `brew install supabase` ou npm install |
| 5 | project-ref non detecte | Demander a l'user via AskUserQuestion |
| 5 | Deploy fail Docker | CLI trop ancienne, suggerer upgrade |
| 6 | HubSpot 400 INVALID_HUTK | Bug template, hutk non sanitize, fix + redeploy |
| 6 | HubSpot 429 rate limit | Wait 10s + 1 retry, sinon afficher message clair |

Principe : chaque erreur doit etre **actionnable** par l'utilisateur, pas juste un message vague.
