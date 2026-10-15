# Site web

Nuxt 4 sur Cloudflare Workers (preset Nitro `cloudflare_module`). La page est prérendue et servie par les fichiers statiques du Worker ; seule la route `POST /api/traduire` l'exécute.

- `app/` : la page (parchemin, lettrine, carte du résultat) ; `composables/useTurnstile.ts`, le widget anti-robots ; `utils/image.ts`, l'image téléchargeable, dessinée dans un canvas.
- `server/api/traduire.post.ts` : la route. Dans l'ordre : compteur par adresse IP (binding Rate Limiting), jeton Turnstile, puis le moteur.
- `shared/api.ts` : ce que la page envoie et ce que la route renvoie.

## Développement

```sh
pnpm --filter @mordieu/web dev
```

Puis http://localhost:3000. Nitro émule les bindings de `wrangler.jsonc` grâce à wrangler : le compteur tourne en local, mais l'IA est la vraie. Il faut donc être connecté (`wrangler login`), et **chaque traduction consomme environ 15 neurons** du quota Workers AI.

En développement, Turnstile prend les clés de test officielles de Cloudflare : le widget passe toujours, sans rien afficher.

`pnpm --filter @mordieu/web test` vérifie la route avec de faux bindings (IA, compteur) et un faux Turnstile.

## Mise en route

1. **Widget Turnstile** : dans le tableau de bord Cloudflare, *Turnstile > Add widget*, en mode *Managed*, avec le nom d'hôte du site : `mordieu.<sous-domaine>.workers.dev`, ou ton domaine (ses sous-domaines sont couverts d'office). Le sous-domaine `workers.dev` du compte s'affiche dans *Workers & Pages*.
2. **Clé de site** : la copier dans `nuxt.config.ts` (`CLE_SITE_TURNSTILE`). Elle est publique : le build l'inscrit dans la page. À défaut, la variable d'environnement `NUXT_PUBLIC_TURNSTILE_SITE_KEY` au moment du build fait le même travail.
3. **Clé secrète** : `pnpm --filter @mordieu/web exec wrangler secret put TURNSTILE_SECRET_KEY`, puis la coller. Si le Worker n'existe pas encore, wrangler propose de le créer.
4. **Déployer** : `pnpm --filter @mordieu/web deploy`, qui lance le build puis `wrangler deploy`. Au premier déploiement, wrangler peut demander de choisir le sous-domaine `workers.dev`.

Tant que les clés manquent, rien ne passe : sans clé de site, la page annonce que le guet n'est point à son poste ; sans clé secrète, la route répond 500.

## Notes

- `nuxt build` écrit `.output/server/wrangler.json` : `wrangler.jsonc`, plus le point d'entrée, les fichiers statiques et `nodejs_compat`. Il écrit aussi `.wrangler/deploy/config.json`, qui y renvoie wrangler quand on le lance depuis ce dossier.
- Pour vérifier le bundle sans rien envoyer : `pnpm --filter @mordieu/web build`, puis `pnpm --filter @mordieu/web exec wrangler deploy --dry-run`.
- Le compteur (`ratelimits` dans `wrangler.jsonc`) accepte 10 traductions par minute et par adresse IP. Son `namespace_id` est libre, mais propre au compte.
