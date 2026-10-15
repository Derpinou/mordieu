# Mordieu

Side project humoristique : traduire du français moderne en **faux vieux français**, façon memes médiévaux. Deux surfaces, toutes deux sur Cloudflare Workers : un site web et un bot Discord.

## Règles de traduction

La spec du style (orthographe, vocabulaire, jurons, exemples) est dans `packages/core/prompt/regles.md`. C'est la source du prompt système : pour faire évoluer le style, on modifie ce fichier, pas le code. Ensuite, `pnpm --filter @mordieu/core regles` régénère `src/regles.gen.ts` (un test échoue tant que ce n'est pas fait).

## Structure

Workspace pnpm : `apps/*` et `packages/*`.

- `packages/core` (`@mordieu/core`) : moteur partagé. Il exporte directement ses sources TypeScript, sans étape de build : ce sont les apps qui bundlent.
  - `src/` : `traduire()`, prompt, nettoyage de la sortie, catalogue des modèles (`modeleWorkersAI(env.AI)`).
  - `eval/` : corpus de phrases et script qui compare les modèles ; rapports dans `eval/resultats/`.
- `apps/discord` *(phase 2)* : Worker qui sert d'endpoint d'interactions Discord.
- `apps/web` *(phase 3)* : Nuxt 4 sur Workers (preset `cloudflare_module`).

## Commandes

- `pnpm install`
- `pnpm typecheck` et `pnpm test` : tous les paquets
- `pnpm --filter @mordieu/core regles` : régénère le prompt depuis `regles.md`
- `pnpm --filter @mordieu/core eval [--modeles gemma-4,llama-3.3-70b] [--phrases 3]` : compare les modèles en vrai. Passe par le `wrangler login` de l'utilisateur et **consomme du quota Workers AI** (≈ 4 000 neurons pour tout le corpus) : ne pas le lancer sans raison.

## Conventions

- Node 24 (`.nvmrc`), pnpm 11, ESM partout, TypeScript strict (`tsconfig.base.json`).
- Imports relatifs avec l'extension `.ts` : Node exécute directement les scripts TypeScript.
- Dans `packages/core`, `src/` est typé pour Workers, sans types Node ; `scripts/`, `eval/` et `test/` passent par `tsconfig.node.json`. Les deux jeux de types globaux entrent en conflit, d'où la séparation.
- Une dépendance utilisée par plusieurs paquets a sa version dans le `catalog` de `pnpm-workspace.yaml` et se déclare avec `"catalog:"`.
- pnpm 11 refuse les scripts d'installation non listés dans `allowBuilds`, et les versions publiées depuis moins d'un jour (`minimumReleaseAge`) : viser une version plus ancienne plutôt que garder les `minimumReleaseAgeExclude` qu'il ajoute tout seul.
- TypeScript reste en 6.x : `vue-tsc` (Nuxt) ne fonctionne pas encore avec TypeScript 7.
- Le vocabulaire du domaine est en français : `traduire`, `variantes`, `regles`…

## Décisions techniques

- **IA : Workers AI uniquement**, via le binding `env.AI` (AI SDK + `workers-ai-provider`). Pas d'API IA externe. `hubAI()` de NuxtHub n'existe plus depuis NuxtHub v0.10 : ne pas l'utiliser.
- **Modèle par défaut : `@cf/google/gemma-4-26b-a4b-it`**, choisi par la comparaison du 2026-10-15 (`eval/resultats/2026-10-15-1048.md`). Cloudflare retire régulièrement des modèles : vérifier qu'un modèle n'est pas déprécié avant de l'adopter.
- **JSON demandé dans le prompt, pas imposé par schéma** : sur Workers AI, `response_format` fait dérailler certains modèles (gpt-oss ne renvoie plus que des « ! »). On extrait l'objet de la réponse (souvent entourée d'un bloc de code) et on relance une fois si besoin.
- **`maxOutputTokens` toujours explicite** : Workers AI coupe à 256 tokens par défaut.
- **Raisonnement coupé** sur les modèles qui en ont : `chat_template_kwargs.enable_thinking: false` (sur GLM, `reasoning_effort: null` ne suffit pas).
- **Le texte de l'utilisateur est à traduire, jamais à exécuter** : il est placé entre balises `<texte>`, et le prompt l'impose avec un exemple.
- **Discord** : endpoint HTTP, sans connexion Gateway. La première réponse doit partir en moins de 3 s : on répond en différé (type 5), puis on édite le message depuis `ctx.waitUntil()` (30 s max).
- **Site** : page prérendue + `POST /api/traduire`, protégé par Turnstile et le binding Rate Limiting.

## Feuille de route

0. Fondations : fait
1. Moteur `packages/core` : fait
2. Bot Discord : `/mordieu` et menu contextuel « Traduire en vieux françois »
3. Site Nuxt
4. CI avec Workers Builds, puis bonus (permaliens, AI Gateway, images)
