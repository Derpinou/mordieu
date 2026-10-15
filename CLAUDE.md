# Mordieu

Side project humoristique : traduire du français moderne en **faux vieux français**, façon memes médiévaux. Deux surfaces, toutes deux sur Cloudflare Workers : un site web et un bot Discord.

## Règles de traduction

La spec du style (orthographe, vocabulaire, jurons, exemples) est dans `packages/core/prompt/regles.md`. C'est la source du prompt système : pour faire évoluer le style, on modifie ce fichier, pas le code. Ensuite, `pnpm --filter @mordieu/core regles` régénère `src/regles.gen.ts` (un test échoue tant que ce n'est pas fait).

## Structure

Workspace pnpm : `apps/*` et `packages/*`.

- `packages/core` (`@mordieu/core`) : moteur partagé. Il exporte directement ses sources TypeScript, sans étape de build : ce sont les apps qui bundlent.
  - `src/` : `traduire()`, prompt, nettoyage de la sortie, catalogue des modèles (`modeleWorkersAI(env.AI)`).
  - `eval/` : corpus de phrases et script qui compare les modèles ; rapports dans `eval/resultats/`.
- `apps/discord` (`@mordieu/discord`) : Worker qui sert d'endpoint d'interactions Discord. Mise en route côté Discord : `apps/discord/README.md`.
  - `src/index.ts` : vérification de la signature, routage, réponse différée ; `src/commandes.ts` : définition des commandes ; `src/discord.ts` : format du message et appel à l'API Discord.
  - `scripts/enregistrer-commandes.ts` : envoie les commandes à Discord (jeton du bot dans `apps/discord/.env`).
- `apps/web` (`@mordieu/web`) : site Nuxt 4 sur Workers (preset `cloudflare_module`). Mise en route (Turnstile, déploiement) : `apps/web/README.md`.
  - `app/` : la page (`pages/index.vue`, `components/CarteTraduction.vue`), le widget Turnstile (`composables/useTurnstile.ts`), l'image à télécharger dessinée dans un canvas (`utils/image.ts`), l'aperçu des liens sur Discord (`utils/embedDiscord.ts`), le style parchemin (`assets/css/parchemin.css`). Pages légales : `pages/mentions-legales.vue` et `pages/confidentialite.vue` (mise en page `components/PageLegale.vue`, éditeur et contact dans `utils/editeur.ts`).
  - `server/api/traduire.post.ts` : la seule route ; `server/utils/turnstile.ts` : vérification des jetons. `shared/api.ts` : le contrat entre les deux.
  - `wrangler.jsonc` : bindings (`AI`, `LIMITEUR`), lus par `nuxt dev` et recopiés au build dans `.output/server/wrangler.json`.

## Commandes

- `pnpm install`
- `pnpm typecheck` et `pnpm test` : tous les paquets
- `pnpm --filter @mordieu/core regles` : régénère le prompt depuis `regles.md`
- `pnpm --filter @mordieu/core eval [--modeles gemma-4,llama-3.3-70b] [--phrases 3] [--sans-variantes]` : compare les modèles en vrai (`--sans-variantes` : le mode du bot). Passe par le `wrangler login` de l'utilisateur et **consomme du quota Workers AI** (≈ 4 000 neurons pour tout le corpus) : ne pas le lancer sans raison.
- `pnpm --filter @mordieu/discord deploy` : déploie le bot. `pnpm --filter @mordieu/discord commandes` : met à jour ses commandes chez Discord. Les deux agissent sur les comptes de l'utilisateur : à lui de les lancer.
- `pnpm --filter @mordieu/web dev` : le site sur http://localhost:3000, avec la vraie IA (≈ 15 neurons par traduction : en faire peu) ; le script passe les clés de test de Turnstile. `pnpm --filter @mordieu/web build`, puis `pnpm --filter @mordieu/web exec wrangler deploy --dry-run` : vérifie le bundle Workers sans rien envoyer. `pnpm --filter @mordieu/web deploy` : à l'utilisateur de le lancer.
- Déploiement normal : Workers Builds, à chaque push sur `main` (un Worker par app, réglages dans les README de `apps/discord` et `apps/web`).

## Conventions

- Node 24 (`.nvmrc`), pnpm 11, ESM partout, TypeScript strict (`tsconfig.base.json`).
- Imports relatifs avec l'extension `.ts` : Node exécute directement les scripts TypeScript.
- Dans `packages/core`, `src/` est typé pour Workers, sans types Node ; `scripts/`, `eval/` et `test/` passent par `tsconfig.node.json`. Les deux jeux de types globaux entrent en conflit, d'où la séparation.
- Une dépendance utilisée par plusieurs paquets a sa version dans le `catalog` de `pnpm-workspace.yaml` et se déclare avec `"catalog:"`.
- pnpm 11 refuse les scripts d'installation non listés dans `allowBuilds`, et les versions publiées depuis moins d'un jour (`minimumReleaseAge`) : viser une version plus ancienne plutôt que garder les `minimumReleaseAgeExclude` qu'il ajoute tout seul.
- TypeScript reste en 6.x : `vue-tsc` (Nuxt) ne fonctionne pas encore avec TypeScript 7.
- Dans `apps/web`, `nuxt typecheck` vérifie les projets générés par Nuxt (`.nuxt/tsconfig.*.json`) et les tests (`test/tsconfig.json`, réglages du serveur plus types Node). Le code de `server/` importe explicitement (`h3`, chemins relatifs) plutôt que par les auto-imports de Nitro : les tests montent la route sur une app h3 nue. Côté `app/`, les auto-imports de Nuxt restent la règle.
- Le vocabulaire du domaine est en français : `traduire`, `variantes`, `regles`…

## Décisions techniques

- **IA : Workers AI uniquement**, via le binding `env.AI` (AI SDK + `workers-ai-provider`). Pas d'API IA externe. `hubAI()` de NuxtHub n'existe plus depuis NuxtHub v0.10 : ne pas l'utiliser.
- **Modèle par défaut : `@cf/google/gemma-4-26b-a4b-it`**, choisi par la comparaison du 2026-10-15 (`eval/resultats/2026-10-15-1048.md`). Cloudflare retire régulièrement des modèles : vérifier qu'un modèle n'est pas déprécié avant de l'adopter.
- **JSON demandé dans le prompt, pas imposé par schéma** : sur Workers AI, `response_format` fait dérailler certains modèles (gpt-oss ne renvoie plus que des « ! »). On extrait l'objet de la réponse (souvent entourée d'un bloc de code) et on relance une fois si besoin.
- **Variantes facultatives** : `traduire(…, { variantes: false })` ne demande que la traduction principale (sortie plus courte, limite de tokens plus basse). Seule la dernière consigne du prompt système, celle du format, change : le reste est commun. Une réponse sans variantes est acceptée dans les deux cas.
- **`maxOutputTokens` toujours explicite** : Workers AI coupe à 256 tokens par défaut.
- **Raisonnement coupé** sur les modèles qui en ont : `chat_template_kwargs.enable_thinking: false` (sur GLM, `reasoning_effort: null` ne suffit pas).
- **Le texte de l'utilisateur est à traduire, jamais à exécuter** : il est placé entre balises `<texte>`, et le prompt l'impose avec un exemple.
- **Discord** : endpoint HTTP, sans connexion Gateway. La première réponse doit partir en moins de 3 s : on répond en différé (type 5), puis on édite le message depuis `ctx.waitUntil()`, qui s'arrête 30 s après la réponse ; la traduction est donc abandonnée au bout de 25 s pour avoir le temps de prévenir. Textes vides ou trop longs : refus immédiat, en message éphémère.
- **Aucune clé dans le dépôt** : les clés sont des secrets du Worker (`wrangler secret put`), déclarés dans `secrets.required` de `wrangler.jsonc`. `wrangler deploy` échoue tant qu'il en manque un, et `wrangler dev` ne charge que ceux-là depuis `.env` ou `.dev.vars`. Une valeur nécessaire au build passe par une variable de build (Workers Builds). Seules les clés de test publiques de Cloudflare apparaissent en clair, dans le script `dev` du site.
- **Configuration du bot minimale** : un seul secret, `DISCORD_PUBLIC_KEY` ; l'identifiant d'application vient de l'interaction signée. Le jeton du bot ne sert qu'au script des commandes et ne va jamais dans le Worker. Le message publié ne contient que la traduction principale (ni le texte d'origine, ni les variantes) : le bot n'en demande donc pas au modèle (`variantes: false`), ce qui économise des neurons et du temps. Mentions désactivées (`allowed_mentions`) : la traduction peut reprendre celles du texte des autres. Scope `applications.commands` seulement, installation sur serveur et par utilisateur.
- **Pas de `nodejs_compat` pour le bot** : il tourne sans (vérifié dans `wrangler dev`). Le site, lui, l'active (`nitro.cloudflare.nodeCompat`, le défaut de Nitro avec `deployConfig`) : Nitro s'appuie sur des API Node, autant les avoir natives que polyfillées dans le bundle.
- **Site** : page prérendue, servie par les fichiers statiques du Worker, et une seule route, `POST /api/traduire`. Elle vérifie, du moins cher au plus cher, le compteur par IP (binding Rate Limiting, 10 par minute), le jeton Turnstile, puis appelle le moteur. Ses erreurs renvoient `{ erreur }`, un message dans le ton que la page montre tel quel.
- **Turnstile** : clé de site publique lue au build (`NUXT_PUBLIC_TURNSTILE_SITE_KEY`) et inscrite dans la page prérendue, clé secrète dans le secret `TURNSTILE_SECRET_KEY` du Worker. En dev, le script `dev` passe les clés de test officielles de Cloudflare : la secrète arrive dans les bindings par wrangler, qui lit les secrets requis dans les variables d'environnement. Rien à configurer. Un jeton ne sert qu'une fois : la page en redemande un dès qu'elle a pris le précédent.
- **Bindings en dev** : `nuxt dev` les obtient de wrangler (`getPlatformProxy`), par un proxy qui ne sait pas transmettre d'`AbortSignal` à `env.AI.run()`. La route ne fixe donc son délai (20 s) qu'en production.
- **La page n'importe pas `@mordieu/core`** : zod y entrerait avec (≈ 30 Ko gzip). `LONGUEUR_MAX` lui parvient par `appConfig`, fixé au build dans `nuxt.config.ts`.
- **Image à télécharger** : dessinée dans un canvas côté client (parchemin, lettrine, texte), sans bibliothèque de capture du DOM.
- **Aperçu des liens sur Discord** : en composants ([component embeds](https://docs.discord.com/developers/link-previews/component-embeds)), dans un `<script id="discord:component-embed">` du `<head>` de la page prérendue ; les balises Open Graph restent pour le repli. Couleur `--rubrique`, boutons de lien seulement (ajout du bot, code source), sans émoji. Discord n'affiche rien au-delà de 3 000 octets ou avec une clé non permise : un test y veille.
- **Pages légales** : éditeur non professionnel, sous le pseudonyme `Derpinou`, anonyme comme le permet la LCEN (art. 1-1, II) ; contact par le serveur Discord seulement, à la demande de l'utilisateur. La politique de confidentialité décrit les traitements réels du site et du bot (texte, IP, Turnstile, journaux Workers Logs, Discord) : un changement qui touche aux données (nouveau service tiers, cookie, stockage, journal) doit la mettre à jour, avec sa date. Aucun cookie déposé par le site, d'où l'absence de bandeau : en ajouter un traceur non indispensable (mesure d'audience…) imposerait un consentement.

## Feuille de route

0. Fondations : fait
1. Moteur `packages/core` : fait
2. Bot Discord : code fait (`/mordieu`, menu contextuel « Traduire en vieux françois ») ; mise en ligne côté Discord à faire par l'utilisateur
3. Site Nuxt : code fait ; mise en ligne à faire par l'utilisateur (widget Turnstile, clé de site, secret, déploiement)
4. CI avec Workers Builds : réglages décrits dans les README des apps ; branchement à faire par l'utilisateur. Puis bonus (permaliens, AI Gateway, images)
