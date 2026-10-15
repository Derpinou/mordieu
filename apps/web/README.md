# Site web

Nuxt 4 sur Cloudflare Workers (preset Nitro `cloudflare_module`). La page est prérendue et servie par les fichiers statiques du Worker ; seule la route `POST /api/traduire` l'exécute.

- `app/` : la page (parchemin, lettrine, carte du résultat) ; `composables/useTurnstile.ts`, le widget anti-robots ; `utils/image.ts`, l'image téléchargeable, dessinée dans un canvas.
- `app/pages/mentions-legales.vue` et `app/pages/confidentialite.vue` : les pages légales (LCEN, RGPD), liées depuis le pied de page (`app.vue`). L'éditeur et son contact sont dans `app/utils/editeur.ts`. Elles décrivent ce que le site et le bot font des données : à relire dès que ça change (nouveau service, cookie, journal, durée de conservation), et changer leur date de mise à jour.
- `server/api/traduire.post.ts` : la route. Dans l'ordre : compteur par adresse IP (binding Rate Limiting), jeton Turnstile, puis le moteur.
- `shared/api.ts` : ce que la page envoie et ce que la route renvoie.
- `app/utils/embedDiscord.ts` : l'aperçu des liens du site sur Discord, en composants, inscrit dans le `<head>` de la page. Après un déploiement, l'[Embed Debugger](https://discord.com/developers/embeds) de Discord montre ce qu'il en fait.

## Développement

```sh
pnpm --filter @mordieu/web dev
```

Puis http://localhost:3000. Nitro émule les bindings de `wrangler.jsonc` grâce à wrangler : le compteur tourne en local, mais l'IA est la vraie. Il faut donc être connecté (`wrangler login`), et **chaque traduction consomme environ 15 neurons** du quota Workers AI.

Le script `dev` fournit à Turnstile les clés de test officielles de Cloudflare : le widget passe toujours, sans rien afficher. Lancer `nuxt dev` directement, sans ce script, laisse la page sans clé.

`pnpm --filter @mordieu/web test` vérifie la route avec de faux bindings (IA, compteur) et un faux Turnstile.

## Mise en route

Aucune clé dans le dépôt : la clé secrète Turnstile est un secret du Worker, la clé de site une variable de build. Le déploiement passe par Workers Builds : chaque push sur `main` qui touche le site le redéploie.

1. **Widget Turnstile** : dans le tableau de bord Cloudflare, *Turnstile > Add widget*, en mode *Managed*, avec le nom d'hôte du site : `mordieu.<sous-domaine>.workers.dev`, ou ton domaine (ses sous-domaines sont couverts d'office). Le sous-domaine `workers.dev` du compte s'affiche dans *Workers & Pages*.
2. **Clé secrète** : `pnpm --filter @mordieu/web exec wrangler secret put TURNSTILE_SECRET_KEY`, puis la coller. Si le Worker `mordieu` n'existe pas encore, wrangler propose de le créer. `wrangler.jsonc` déclare ce secret comme requis : tout déploiement échoue tant qu'il manque.
3. **Brancher GitHub** : *Workers & Pages > mordieu > Settings > Builds > Connect*, dépôt `Derpinou/mordieu`, puis :
   - branche `main`, root directory `apps/web` ;
   - build command `pnpm install --frozen-lockfile && pnpm typecheck && pnpm test && pnpm build` : si un test échoue, rien n'est déployé ;
   - deploy command `npx wrangler deploy` (celle par défaut), qui prend la config générée par le build ;
   - variables de build : `NUXT_PUBLIC_TURNSTILE_SITE_KEY`, la clé de site (publique, mais lue au build pour être inscrite dans la page prérendue), `PNPM_VERSION=11.20.0` (l'image fournit pnpm 10) et `SKIP_DEPENDENCY_INSTALL=1` (l'installation automatique de Cloudflare n'est pas documentée pour un workspace vu depuis un sous-dossier : la build command s'en charge) ;
   - build watch paths `apps/web/*`, `packages/*`, `pnpm-lock.yaml`.

   Le prochain push sur `main` déploie le site. Pour ne pas attendre : `NUXT_PUBLIC_TURNSTILE_SITE_KEY=<clé de site> pnpm --filter @mordieu/web deploy`.

Les autres branches donnent des préversions, sur des URL hors de `mordieu.<sous-domaine>.workers.dev` : pour que Turnstile les accepte, ajoute `<sous-domaine>.workers.dev` aux noms d'hôte du widget.

Sans clé de site au build, la page annonce que le guet n'est point à son poste, et aucune traduction ne passe.

## Notes

- `nuxt build` écrit `.output/server/wrangler.json` : `wrangler.jsonc` (secret requis compris), plus le point d'entrée, les fichiers statiques et `nodejs_compat`. Il écrit aussi `.wrangler/deploy/config.json`, qui y renvoie wrangler quand on le lance depuis ce dossier.
- Pour vérifier le bundle sans rien envoyer : `pnpm --filter @mordieu/web build`, puis `pnpm --filter @mordieu/web exec wrangler deploy --dry-run`.
- Le compteur (`ratelimits` dans `wrangler.jsonc`) accepte 10 traductions par minute et par adresse IP. Son `namespace_id` est libre, mais propre au compte.
