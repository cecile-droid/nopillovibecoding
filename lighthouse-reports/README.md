# Lighthouse reports — nopillo.com

Baseline et post-remédiation des audits Lighthouse pour www.nopillo.com.

Cible AEO niveau 4 : **65+ mobile / 90+ desktop**. Baseline connue (rapport AEO Webflow, juillet 2026) : **40 mobile / 56 desktop**.

## Layout

```
lighthouse-reports/
  avant/   # rapports pré-remédiation (JSON + HTML par page)
  apres/   # rapports post-remédiation (mêmes pages, mêmes flags)
```

Convention de nommage : `{slug}-{mobile|desktop}.report.{json,html}`

Slugs :
- `home` → https://www.nopillo.com/
- `simulateur` → https://www.nopillo.com/simulateur-economie-impots
- `blog` → https://www.nopillo.com/blog
- `qsn` → https://www.nopillo.com/qui-sommes-nous

## Statut actuel (2026-07-16)

Dossiers vides : **audits pas encore exécutés**. Le sandbox CCR qui devait lancer Lighthouse ne peut pas atteindre `www.nopillo.com` (proxy egress renvoie 403 policy denial), et la voie de contournement PageSpeed Insights partage un quota anonyme épuisé. Trois moyens de débloquer, voir `../CLAUDE.md` ou la conversation Claude Code associée.

## Reproduire les runs

Requiert Chrome installé et Lighthouse 13+.

```bash
npm install -g lighthouse

for page in home:https://www.nopillo.com/ \
            simulateur:https://www.nopillo.com/simulateur-economie-impots \
            blog:https://www.nopillo.com/blog \
            qsn:https://www.nopillo.com/qui-sommes-nous; do
  slug=${page%%:*}; url=${page#*:}
  lighthouse "$url" --preset=perf --form-factor=mobile \
    --output=json --output=html \
    --output-path=./lighthouse-reports/avant/${slug}-mobile --quiet
  lighthouse "$url" --preset=desktop \
    --output=json --output=html \
    --output-path=./lighthouse-reports/avant/${slug}-desktop --quiet
done
```

Post-remédiation : même boucle, écrire dans `apres/` au lieu de `avant/`.
