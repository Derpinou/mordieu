# Mordieu

Side project humoristique : traduire du français moderne en **faux vieux français**, façon memes médiévaux. Deux surfaces, toutes deux sur Cloudflare Workers : un site web et un bot Discord.

## Règles de traduction

La spec du style (orthographe, vocabulaire, jurons, exemples) est dans `packages/core/prompt/regles.md`. C'est la source du prompt système : pour faire évoluer le style, on modifie ce fichier, pas le code.

## Structure

Workspace pnpm : `apps/*` et `packages/*`.

- `packages/core` (`@mordieu/core`) : moteur partagé (prompt, appel IA, validation de la sortie). Il exporte directement ses sources TypeScript, sans étape de build : ce sont les apps qui bundlent.
- `apps/discord` *(phase 2)* : Worker qui sert d'endpoint d'interactions Discord.
- `apps/web` *(phase 3)* : Nuxt 4 sur Workers (preset `cloudflare_module`).

## Commandes

- `pnpm install`
- `pnpm typecheck` : vérifie les types de tous les paquets

## Conventions

- Node 24 (`.nvmrc`), pnpm 11, ESM partout, TypeScript strict (`tsconfig.base.json`).
- Une dépendance utilisée par plusieurs paquets a sa version dans le `catalog` de `pnpm-workspace.yaml` et se déclare avec `"catalog:"`.
- TypeScript reste en 6.x : `vue-tsc` (Nuxt) ne fonctionne pas encore avec TypeScript 7.
- Le vocabulaire du domaine est en français : `traduire`, `variantes`, `regles`…

## Décisions techniques

- **IA : Workers AI uniquement**, via le binding `env.AI` (AI SDK + `workers-ai-provider`). Pas d'API IA externe. `hubAI()` de NuxtHub n'existe plus depuis NuxtHub v0.10 : ne pas l'utiliser.
- **Modèle configurable** par variable d'environnement. Cloudflare retire régulièrement des modèles : vérifier qu'un modèle n'est pas déprécié avant de l'adopter.
- **Le texte de l'utilisateur est à traduire, jamais à exécuter** : « Dis-moi une blague » se traduit, le modèle ne raconte pas de blague.
- **Discord** : endpoint HTTP, sans connexion Gateway. La première réponse doit partir en moins de 3 s : on répond en différé (type 5), puis on édite le message depuis `ctx.waitUntil()` (30 s max).
- **Site** : page prérendue + `POST /api/traduire`, protégé par Turnstile et le binding Rate Limiting.

## Feuille de route

0. Fondations : fait
1. Moteur `packages/core` : prompt, sortie structurée, comparaison des modèles
2. Bot Discord : `/mordieu` et menu contextuel « Traduire en vieux françois »
3. Site Nuxt
4. CI avec Workers Builds, puis bonus (permaliens, AI Gateway, images)
